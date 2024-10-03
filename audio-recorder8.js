class AudioRecorder extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    // Create UI elements
    const container = document.createElement('div');
    const recordButton = document.createElement('button');
    const stopButton = document.createElement('button');
    const submitButton = document.createElement('button');
    const audioPlayback = document.createElement('audio');
    const discardButton = document.createElement('button');
    const messageDiv = document.createElement('div');
    const outputSection = document.createElement('div'); // New output section

    recordButton.textContent = 'Start';
    stopButton.textContent = 'Stop';
    submitButton.textContent = 'Submit';
    discardButton.textContent = 'Discard';
    stopButton.disabled = true;
    submitButton.style.display = 'none';
    discardButton.style.display = 'none';
    audioPlayback.controls = true;
    audioPlayback.style.display = 'none';
    messageDiv.style.display = 'none';
    messageDiv.style.marginTop = '10px';
    messageDiv.style.fontSize = '14px';
    outputSection.style.display = 'none';
    outputSection.style.marginTop = '20px';

    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'center';
    container.style.gap = '10px';

    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'center';
    buttonContainer.style.alignItems = 'center';
    buttonContainer.style.gap = '10px';

    const buttonStyle = 'padding: 5px 10px; font-size: 14px;';
    recordButton.style.cssText = buttonStyle;
    stopButton.style.cssText = buttonStyle;
    submitButton.style.cssText = buttonStyle;
    discardButton.style.cssText = buttonStyle;

    buttonContainer.appendChild(recordButton);
    buttonContainer.appendChild(stopButton);
    buttonContainer.appendChild(submitButton);
    buttonContainer.appendChild(discardButton);

    container.appendChild(buttonContainer);
    container.appendChild(audioPlayback);
    container.appendChild(messageDiv);
    container.appendChild(outputSection); // Add the output section to the container
    this.shadowRoot.appendChild(container);

    let mediaRecorder;
    let chunks = [];
    let stream;
    let blob;
    let audioContext;
    let wavBlob;

    recordButton.addEventListener('click', async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/mp4' });

        mediaRecorder.start();
        recordButton.disabled = true;
        stopButton.disabled = false;
        messageDiv.style.display = 'none';
        messageDiv.textContent = '';

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data);
          }
        };

        mediaRecorder.onstop = async () => {
          try {
            blob = new Blob(chunks, { type: 'audio/mp4' });
            chunks = [];

            // Convert the recorded Blob to WAV format
            wavBlob = await this.convertToWav(blob);

            audioPlayback.src = URL.createObjectURL(wavBlob);
            audioPlayback.style.display = 'block';
            submitButton.style.display = 'inline-block';
            discardButton.style.display = 'inline-block';
            stopButton.disabled = true;
            recordButton.disabled = false;
            stream.getTracks().forEach(track => track.stop());
          } catch (error) {
            console.error('Error during processing:', error);
            messageDiv.style.display = 'block';
            messageDiv.style.color = 'red';
            messageDiv.textContent = 'An error occurred while processing the audio.';
            stopButton.disabled = true;
            recordButton.disabled = false;
            stream.getTracks().forEach(track => track.stop());
          }
        };
      } catch (error) {
        console.error('Error accessing microphone:', error);
        messageDiv.style.display = 'block';
        messageDiv.style.color = 'red';
        messageDiv.textContent = 'Error accessing microphone. Please check your device settings.';
      }
    });

    stopButton.addEventListener('click', () => {
      try {
        mediaRecorder.stop();
        stopButton.disabled = true;
      } catch (error) {
        console.error('Error stopping recording:', error);
        messageDiv.style.display = 'block';
        messageDiv.style.color = 'red';
        messageDiv.textContent = 'Error stopping recording.';
      }
    });

    discardButton.addEventListener('click', () => {
      try {
        audioPlayback.src = '';
        submitButton.style.display = 'none';
        discardButton.style.display = 'none';
        audioPlayback.style.display = 'none';
        messageDiv.style.display = 'none';
        messageDiv.textContent = '';
        wavBlob = null;
      } catch (error) {
        console.error('Error discarding audio:', error);
        messageDiv.style.display = 'block';
        messageDiv.style.color = 'red';
        messageDiv.textContent = 'Error discarding audio.';
      }
    });

    submitButton.addEventListener('click', async () => {
      try {
        // Stop audio playback to release resources
        audioPlayback.pause();
        audioPlayback.currentTime = 0;

        // Show a submitting message
        messageDiv.style.display = 'block';
        messageDiv.style.color = 'black';
        messageDiv.textContent = 'Submitting audio...';

        // Prepare FormData to send to Zapier
        const formData = new FormData();
        formData.append('file', wavBlob, 'recording.wav');

        // Send the audio to Zapier
        const zapierResponse = await fetch('https://hooks.zapier.com/hooks/catch/17969384/2dvld0t/', {
          method: 'POST',
          body: formData
        });

        if (zapierResponse.ok) {
          const data = await zapierResponse.json();
          console.log('Success:', data);

          // Now upload the audio to Wix
          const wixUploadResponse = await this.uploadAudioToWix(wavBlob, 'recording.wav');

          if (wixUploadResponse.success) {
            // Display the audio in the output section
            this.displayOutputAudio(wixUploadResponse.fileUrl);

            messageDiv.style.color = 'green';
            messageDiv.textContent = 'Audio submitted and uploaded successfully!';
            // Reset UI
            audioPlayback.src = '';
            audioPlayback.style.display = 'none';
            submitButton.style.display = 'none';
            discardButton.style.display = 'none';
            wavBlob = null;
          } else {
            throw new Error('Error uploading audio to Wix.');
          }
        } else {
          throw new Error(`Zapier responded with status ${zapierResponse.status}`);
        }
      } catch (error) {
        console.error('Error submitting audio:', error);
        messageDiv.style.color = 'red';
        messageDiv.textContent = 'Error submitting audio. Please try again.';
      }
    });
  }

  async convertToWav(blob) {
    try {
      // Create an AudioContext to decode the audio data
      const arrayBuffer = await blob.arrayBuffer();
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

      // Encode audio data to WAV format
      const wavBuffer = this.encodeWav(audioBuffer);
      return new Blob([wavBuffer], { type: 'audio/wav' });
    } catch (error) {
      console.error('Error converting to WAV:', error);
      throw error;
    }
  }

  encodeWav(audioBuffer) {
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const format = 1; // PCM
    const bitsPerSample = 16;

    // Interleave channels
    let interleaved;
    if (numChannels === 2) {
      const left = audioBuffer.getChannelData(0);
      const right = audioBuffer.getChannelData(1);
      interleaved = this.interleave(left, right);
    } else {
      interleaved = audioBuffer.getChannelData(0);
    }

    const dataLength = interleaved.length * (bitsPerSample / 8);
    const buffer = new ArrayBuffer(44 + dataLength);
    const view = new DataView(buffer);

    // RIFF identifier 'RIFF'
    this.writeString(view, 0, 'RIFF');
    // file length minus RIFF identifier length and file description length
    view.setUint32(4, 36 + dataLength, true);
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
    view.setUint32(40, dataLength, true);

    // write the PCM samples
    this.floatTo16BitPCM(view, 44, interleaved);

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

  interleave(leftChannel, rightChannel) {
    const length = leftChannel.length + rightChannel.length;
    const result = new Float32Array(length);

    let inputIndex = 0;
    for (let index = 0; index < length;) {
      result[index++] = leftChannel[inputIndex];
      result[index++] = rightChannel[inputIndex];
      inputIndex++;
    }
    return result;
  }

  async uploadAudioToWix(blob, filename) {
    try {
      // Create a FormData object to send the Blob to the Wix backend function
      const formData = new FormData();
      formData.append('file', blob, filename);

      // Replace 'https://your-wix-site.com' with your actual Wix site domain
      const wixUploadUrl = 'https://www.thementorprogram.xyz/_functions/post_uploadAudio';

      // Call the backend function to upload the file
      const response = await fetch(wixUploadUrl, {
        method: 'POST',
        body: formData,
        // Include 'credentials: "include"' if needed
        // credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        return { success: true, fileUrl: result.fileUrl };
      } else {
        console.error('Error uploading audio to Wix:', response.statusText);
        return { success: false };
      }
    } catch (error) {
      console.error('Error uploading audio to Wix:', error);
      return { success: false };
    }
  }

  displayOutputAudio(fileUrl) {
    // Show the output section
    const outputSection = this.shadowRoot.querySelector('div:last-child');
    outputSection.style.display = 'block';
    outputSection.innerHTML = ''; // Clear previous content

    // Create an audio element
    const outputAudio = document.createElement('audio');
    outputAudio.controls = true;
    outputAudio.src = fileUrl;

    // Append to the output section
    outputSection.appendChild(outputAudio);
  }
}

customElements.define('audio-recorder3', AudioRecorder);
