class AudioRecorder extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    const container = document.createElement('div');
    const recordButton = document.createElement('button');
    const stopButton = document.createElement('button');
    const submitButton = document.createElement('button');
    const audioPlayback = document.createElement('audio');
    const discardButton = document.createElement('button');

    recordButton.textContent = 'Start';
    stopButton.textContent = 'Stop';
    submitButton.textContent = 'Submit';
    discardButton.textContent = 'Discard';
    stopButton.disabled = true;
    submitButton.style.display = 'none';
    discardButton.style.display = 'none';
    audioPlayback.controls = true;
    audioPlayback.style.display = 'none';

    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.alignItems = 'center';
    container.style.gap = '10px';
    const buttonStyle = 'padding: 5px 10px; font-size: 14px;';
    recordButton.style.cssText = buttonStyle;
    stopButton.style.cssText = buttonStyle;
    submitButton.style.cssText = buttonStyle;
    discardButton.style.cssText = buttonStyle;

    container.appendChild(recordButton);
    container.appendChild(stopButton);
    container.appendChild(submitButton);
    container.appendChild(audioPlayback);
    container.appendChild(discardButton);
    this.shadowRoot.appendChild(container);

    let mediaRecorder;
    let chunks = [];
    let stream;
    let blob;
    let audioContext;
    let wavBlob;

    recordButton.addEventListener('click', async () => {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/mp4' });

      mediaRecorder.start();
      recordButton.disabled = true;
      stopButton.disabled = false;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        blob = new Blob(chunks, { type: 'audio/mp4' });
        chunks = [];

        // Convert the recorded Blob to WAV format
        wavBlob = await this.convertToWav(blob);

        audioPlayback.src = URL.createObjectURL(wavBlob);
        audioPlayback.style.display = 'block';
        submitButton.style.display = 'block';
        discardButton.style.display = 'block';
        stopButton.disabled = true;
        recordButton.disabled = false;
        stream.getTracks().forEach(track => track.stop());
      };
    });

    stopButton.addEventListener('click', () => {
      mediaRecorder.stop();
    });

    discardButton.addEventListener('click', () => {
      audioPlayback.src = '';
      submitButton.style.display = 'none';
      discardButton.style.display = 'none';
      audioPlayback.style.display = 'none';
    });

    submitButton.addEventListener('click', () => {
      audioPlayback.captureStream().getTracks().forEach(track => {
        track.stop();  // Ensure we stop the audio playback track to release resources
      });

      const formData = new FormData();
      formData.append('file', wavBlob, 'recording.wav');

      fetch('https://hooks.zapier.com/hooks/catch/17969384/2dvld0t/', {
        method: 'POST',
        body: formData
      })
      .then(response => response.json())
      .then(data => console.log('Success:', data))
      .catch(error => console.error('Error:', error));
    });
  }

  async convertToWav(blob) {
    // Create an AudioContext to decode the audio data
    const arrayBuffer = await blob.arrayBuffer();
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

    // Encode audio data to WAV format
    const wavBuffer = this.encodeWav(audioBuffer);
    return new Blob([wavBuffer], { type: 'audio/wav' });
  }

  encodeWav(audioBuffer) {
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const format = 1; // PCM
    const bitsPerSample = 16;

    const samples = audioBuffer.getChannelData(0); // Assuming mono audio

    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    // RIFF identifier 'RIFF'
    this.writeString(view, 0, 'RIFF');
    // file length minus RIFF identifier length and file description length
    view.setUint32(4, 36 + samples.length * 2, true);
    // RIFF type 'WAVE'
    this.writeString(view, 8, 'WAVE');
    // format chunk identifier 'fmt '
    this.writeString(view, 12, 'fmt ');
    // format chunk length
    view.setUint32(16, 16, true);
    // sample format (raw)
    view.setUint16(20, format, true);
    // channel count
    view.setUint16(22, numChannels, true);
    // sample rate
    view.setUint32(24, sampleRate, true);
    // byte rate (sample rate * block align)
    view.setUint32(28, sampleRate * numChannels * bitsPerSample / 8, true);
    // block align (channel count * bytes per sample)
    view.setUint16(32, numChannels * bitsPerSample / 8, true);
    // bits per sample
    view.setUint16(34, bitsPerSample, true);
    // data chunk identifier 'data'
    this.writeString(view, 36, 'data');
    // data chunk length
    view.setUint32(40, samples.length * 2, true);

    // write the PCM samples
    this.floatTo16BitPCM(view, 44, samples);

    return buffer;
  }

  writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  floatTo16BitPCM(output, offset, input) {
    for (let i = 0; i < input.length; i++, offset += 2) {
      let s = Math.max(-1, Math.min(1, input[i]));
      s = s < 0 ? s * 0x8000 : s * 0x7FFF;
      output.setInt16(offset, s, true);
    }
  }
}

customElements.define('audio-recorder5', AudioRecorder);
