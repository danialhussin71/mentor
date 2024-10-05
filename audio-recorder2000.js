class AudioRecorder extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    // Create template
    const template = document.createElement('template');
    template.innerHTML = `
      <style>
        .audio-recorder {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px;
          border-radius: 8px;
          background-color: transparent;
          color: white;
          width: 100%;
          max-width: 960px; /* Adjusted to fill half of a 1920px screen */
          margin: 20px auto;
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        }
        button, .timer-container {
          background-color: transparent;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 5px;
          font-size: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
        }
        button:disabled {
          color: gray;
          cursor: default;
        }
        button:hover:not(:disabled) {
          opacity: 0.8;
        }
        .icon {
          width: 28.8px; /* 20% larger */
          height: 28.8px; /* 20% larger */
        }
        #timer {
          font-size: 16px;
          color: #FF5252; /* Red color for recording indicator */
          display: none;
        }
        #submitButton {
          background-color: #4CAF50; /* Green background */
          color: white; /* Text color */
          display: none; /* Hidden initially */
        }
        #discardButton, #stopButton {
          display: inline-flex; /* Make stop button visible but disabled initially */
        }
        .timer-container {
          flex-grow: 1; /* Takes up all available space */
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        #audioPlayback {
          width: 100%;
          margin-top: 10px;
          display: none;
        }
        .message {
          width: 100%;
          text-align: center;
          margin-top: 10px;
          font-size: 14px;
          display: none;
        }
        /* Responsive adjustments */
        @media (max-width: 768px) {
          .audio-recorder {
            flex-direction: column;
          }
          .timer-container {
            width: 100%;
            margin-top: 10px;
          }
          #audioPlayback {
            width: 100%;
          }
        }
      </style>
      <div class="audio-recorder">
        <button id="recordButton" title="Start Recording">
          <img class="icon" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23FF5252'%3E%3Cpath d='M12 15c1.66 0 3-1.34 3-3V6c0-1.66-1.34-3-3-3S9 4.34 9 6v6c0 1.66 1.34 3 3 3zm5-3c0 2.76-2.24 5-5 5s-5-2.24-5-5H4v6h16v-6h-3zm3-13h-4v2h4v4h2V4h4V2h-4V0h-2v2z'/%3E%3C/svg%3E">
        </button>
        <button id="stopButton" disabled title="Stop Recording">
          <img class="icon" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23B0BEC5'%3E%3Cpath d='M6 6h12v12H6z'/%3E%3C/svg%3E">
        </button>
        <div class="timer-container">
          <span id="timer">00:00</span>
          <audio id="audioPlayback" controls></audio>
        </div>
        <button id="discardButton" title="Discard Recording">
          <img class="icon" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23FFC107'%3E%3Cpath d='M16 9v10H8V9h8m-1.5-6L12 2 9.5 3H5v2h14V3h-4.5zM7 9v10a2 2 0 002 2h6a2 2 0 002-2V9a2 2 0 00-2-2H9a2 2 0 00-2 2z'/%3E%3C/svg%3E">
        </button>
        <button id="submitButton" title="Submit Recording">
          <img class="icon" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M9 16.17L4.83 12 3.41 13.41 9 19l11-11-1.41-1.41z'/%3E%3C/svg%3E"> Submit
        </button>
      </div>
      <div class="message" id="message"></div>
    `;

    // Append template to shadow root
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    // Get references to elements
    this.recordButton = this.shadowRoot.getElementById('recordButton');
    this.stopButton = this.shadowRoot.getElementById('stopButton');
    this.discardButton = this.shadowRoot.getElementById('discardButton');
    this.submitButton = this.shadowRoot.getElementById('submitButton');
    this.timerElement = this.shadowRoot.getElementById('timer');
    this.audioPlayback = this.shadowRoot.getElementById('audioPlayback');
    this.messageDiv = this.shadowRoot.getElementById('message');

    // Set up event listeners
    this.recordButton.addEventListener('click', this.startRecording.bind(this));
    this.stopButton.addEventListener('click', this.stopRecording.bind(this));
    this.discardButton.addEventListener('click', this.discardRecording.bind(this));
    this.submitButton.addEventListener('click', this.submitRecording.bind(this));

    // Initialize variables
    this.mediaRecorder = null;
    this.chunks = [];
    this.stream = null;
    this.blob = null;
    this.audioContext = null;
    this.wavBlob = null;
    this.seconds = 0;
    this.interval = null;

    // Hide or show elements as needed
    this.stopButton.disabled = true;
    this.submitButton.style.display = 'none';
    this.discardButton.style.display = 'none';
    this.timerElement.style.display = 'none';
    this.messageDiv.style.display = 'none';
  }

  startRecording() {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        this.stream = stream;
        this.mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/mp4' });
        this.mediaRecorder.start();
        this.recordButton.disabled = true;
        this.stopButton.disabled = false;
        this.timerElement.style.display = 'inline';
        this.seconds = 0;
        this.timerElement.textContent = '00:00';
        this.interval = setInterval(() => {
          this.seconds++;
          this.timerElement.textContent = new Date(this.seconds * 1000).toISOString().substr(14, 5);
        }, 1000);

        this.chunks = [];
        this.mediaRecorder.ondataavailable = e => {
          if (e.data.size > 0) {
            this.chunks.push(e.data);
          }
        };
        this.mediaRecorder.onstop = () => {
          this.blob = new Blob(this.chunks, { type: 'audio/mp4' });
          this.chunks = [];

          // Convert to WAV
          this.convertToWav(this.blob).then(wavBlob => {
            this.wavBlob = wavBlob;
            this.audioPlayback.src = URL.createObjectURL(this.wavBlob);
            this.audioPlayback.style.display = 'block';
          }).catch(error => {
            console.error('Error during processing:', error);
            this.showMessage('An error occurred while processing the audio.', 'red');
          });

          this.submitButton.style.display = 'inline-flex';
          this.discardButton.style.display = 'inline-flex';
          this.recordButton.style.display = 'none';
          this.stopButton.disabled = true;
          clearInterval(this.interval);
          this.stream.getTracks().forEach(track => track.stop());
        };
      })
      .catch(error => {
        console.error('Error accessing microphone:', error);
        this.showMessage('Error accessing microphone. Please check your device settings.', 'red');
      });
  }

  stopRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    clearInterval(this.interval);
    this.stopButton.disabled = true;
  }

  discardRecording() {
    this.seconds = 0;
    clearInterval(this.interval);
    this.timerElement.textContent = '00:00';
    this.timerElement.style.display = 'none';
    this.discardButton.style.display = 'none';
    this.submitButton.style.display = 'none';
    this.recordButton.disabled = false;
    this.recordButton.style.display = 'inline-flex';
    this.audioPlayback.src = '';
    this.audioPlayback.style.display = 'none';
    this.wavBlob = null;
    this.showMessage('Recording discarded.', 'yellow');
  }

  submitRecording() {
    if (!this.wavBlob) {
      this.showMessage('No recording to submit.', 'red');
      return;
    }

    // Stop audio playback to release resources
    this.audioPlayback.pause();
    this.audioPlayback.currentTime = 0;

    const formData = new FormData();
    formData.append('file', this.wavBlob, 'recording.wav');

    // Show a submitting message
    this.showMessage('Submitting audio...', 'black');

    fetch('https://hooks.zapier.com/hooks/catch/17969384/2dvld0t/', {
      method: 'POST',
      body: formData
    })
    .then(response => {
      if (response.ok) {
        return response.json();
      } else {
        throw new Error(`Server responded with status ${response.status}`);
      }
    })
    .then(data => {
      console.log('Success:', data);
      this.showMessage('Audio submitted successfully!', 'green');
      // Reset UI after a short delay to allow users to see the success message
      setTimeout(() => {
        this.discardRecording();
      }, 2000);
    })
    .catch(error => {
      console.error('Error submitting audio:', error);
      this.showMessage('Error submitting audio. Please try again.', 'red');
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

  showMessage(message, color) {
    this.messageDiv.textContent = message;
    this.messageDiv.style.color = color;
    this.messageDiv.style.display = 'block';
    // Hide the message after 3 seconds
    clearTimeout(this.messageTimeout);
    this.messageTimeout = setTimeout(() => {
      this.messageDiv.style.display = 'none';
    }, 3000);
  }
}

customElements.define('audio-recorder2000', AudioRecorder);
