// audio-recorder.js

class AudioRecorder extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    // Create template
    const template = document.createElement('template');
    template.innerHTML = `
      <style>
        /* Container split into two equal parts */
        .container {
          display: flex;
          flex-direction: row;
          width: 100%;
          max-width: 1920px;
          margin: 20px auto;
          padding: 20px;
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
          border-radius: 8px;
          background-color: #1e1e1e; /* Dark background for contrast */
          color: white;
          box-sizing: border-box;
          font-family: "Avenir", sans-serif;
        }

        /* Left section for Title and Links */
        .left {
          width: 50%;
          padding-right: 20px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .left h2 {
          margin: 0 0 5px 0;
          font-size: 24px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .input-group input {
          padding: 8px 12px;
          font-size: 16px;
          border: 1px solid #555;
          border-radius: 4px;
          background-color: #2c2c2c;
          color: white;
        }

        /* Right section for Recorder */
        .right {
          width: 50%;
          padding-left: 20px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          gap: 15px;
          align-items: flex-start;
          justify-content: center;
          position: relative;
        }

        /* Controls Row */
        .controls-row {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 15px;
          width: 100%;
        }

        /* Timer */
        #timer {
          font-size: 16px;
          color: #FF5252; /* Red color for recording indicator */
          display: none;
        }

        /* Record Text */
        .record-text {
          font-size: 24px;
          white-space: nowrap;
        }

        /* Audio Recorder Controls */
        .audio-recorder-controls {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 15px;
          flex-grow: 1;
        }

        .audio-recorder-controls.centered {
          justify-content: center;
        }

        button {
          background-color: transparent;
          color: white;
          border: none;
          padding: 10px;
          border-radius: 5px;
          font-size: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          transition: background-color 0.3s;
        }

        button:disabled {
          color: gray;
          cursor: not-allowed;
        }

        button:hover:not(:disabled) {
          background-color: rgba(255, 255, 255, 0.1);
        }

        .icon {
          width: 28.8px; /* 20% larger */
          height: 28.8px; /* 20% larger */
          margin-right: 5px;
        }

        /* Playback Row */
        .playback-row {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 15px;
          width: 100%;
        }

        /* Play Button */
        #playButton {
          display: none;
          background-color: transparent;
          border: none;
          cursor: pointer;
          padding: 10px;
          border-radius: 5px;
          transition: background-color 0.3s;
          display: flex;
          align-items: center;
        }

        #playButton:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }

        /* WaveSurfer Container */
        #waveform {
          width: 100%;
          height: 80px;
          display: none;
        }

        /* Message Styling */
        .message {
          width: 100%;
          text-align: center;
          margin-top: 10px;
          font-size: 14px;
          display: none;
        }

        /* Submit Button */
        #submitButton {
          display: none;
          align-items: center;
        }

        /* Discard Button */
        #discardButton {
          display: none;
          align-items: center;
        }

        /* Responsive Adjustments */
        @media (max-width: 600px) {
          .container {
            flex-direction: column;
            padding: 10px;
          }
          .left, .right {
            width: 100%;
            padding: 0;
          }
          .right {
            padding-top: 20px;
          }
          #waveform {
            height: 60px;
          }
          /* Adjust button sizes */
          button {
            padding: 6px;
            font-size: 14px;
          }
          .icon {
            width: 20px;
            height: 20px;
            margin-right: 3px;
          }
          /* Centered controls */
          .audio-recorder-controls.centered {
            flex-direction: column;
            gap: 10px;
          }
          /* Playback Row adjustments */
          .playback-row {
            flex-direction: column;
            align-items: center;
            gap: 10px;
          }
          /* Play button and waveform alignment */
          #playButton {
            order: 1;
          }
          #waveform {
            order: 2;
          }
        }
      </style>
      <div class="container">
        <!-- Left Section -->
        <div class="left">
          <div class="input-group">
            <h2>Title</h2>
            <input type="text" id="titleInput" placeholder="Enter title here">
          </div>
          <div class="input-group">
            <h2>Links</h2>
            <input type="text" id="linksInput" placeholder="Enter links here">
          </div>
        </div>

        <!-- Right Section -->
        <div class="right">
          <div class="controls-row">
            <span id="timer">00:00</span>
            <div class="record-text" id="recordText">Record</div>
            <div class="audio-recorder-controls" id="controls">
              <button id="recordButton" title="Start Recording">
                <img class="icon" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23FF5252'%3E%3Cpath d='M12 15c1.66 0 3-1.34 3-3V6c0-1.66-1.34-3-3-3S9 4.34 9 6v6c0 1.66 1.34 3 3 3zm5-3c0 2.76-2.24 5-5 5s-5-2.24-5-5H4v6h16v-6h-3zm3-13h-4v2h4v4h2V4h4V2h-4V0h-2v2z'/%3E%3C/svg%3E">
              </button>
              <button id="stopButton" disabled title="Stop Recording">
                <img class="icon" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23B0BEC5'%3E%3Cpath d='M6 6h12v12H6z'/%3E%3C/svg%3E">
              </button>
              <button id="discardButton" title="Discard Recording">
                <img class="icon" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23FFC107'%3E%3Cpath d='M16 9v10H8V9h8m-1.5-6L12 2 9.5 3H5v2h14V3h-4.5zM7 9v10a2 2 0 002 2h6a2 2 0 002-2V9a2 2 0 00-2-2H9a2 2 0 00-2 2z'/%3E%3C/svg%3E">
              </button>
              <button id="submitButton" title="Submit Recording">
                <img class="icon" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M9 16.17L4.83 12 3.41 13.41 9 19l11-11-1.41-1.41z'/%3E%3C/svg%3E"> Submit
              </button>
            </div>
          </div>
          <div class="playback-row">
            <button id="playButton" title="Play/Pause">
              <img class="icon" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M8 5v14l11-7z'/%3E%3C/svg%3E">
            </button>
            <div id="waveform"></div>
          </div>
        </div>
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
    this.playButton = this.shadowRoot.getElementById('playButton');
    this.timerElement = this.shadowRoot.getElementById('timer');
    this.waveformContainer = this.shadowRoot.getElementById('waveform');
    this.messageDiv = this.shadowRoot.getElementById('message');
    this.recordText = this.shadowRoot.getElementById('recordText');
    this.controls = this.shadowRoot.getElementById('controls');
    this.titleInput = this.shadowRoot.getElementById('titleInput');
    this.linksInput = this.shadowRoot.getElementById('linksInput');

    // Initialize variables
    this.mediaRecorder = null;
    this.chunks = [];
    this.stream = null;
    this.blob = null;
    this.audioContext = null;
    this.wavBlob = null;
    this.seconds = 0;
    this.interval = null;
    this.waveSurfer = null;

    // Bind methods
    this.startRecording = this.startRecording.bind(this);
    this.stopRecording = this.stopRecording.bind(this);
    this.discardRecording = this.discardRecording.bind(this);
    this.submitRecording = this.submitRecording.bind(this);
    this.togglePlay = this.togglePlay.bind(this);
    this.showMessage = this.showMessage.bind(this);
  }

  connectedCallback() {
    // Load WaveSurfer.js
    this.loadWaveSurfer()
      .then(() => {
        this.initializeWaveSurfer();
      })
      .catch(error => {
        console.error('Failed to load WaveSurfer.js:', error);
        this.showMessage('Failed to load audio waveform.', 'red');
      });

    // Set up event listeners
    this.recordButton.addEventListener('click', this.startRecording);
    this.stopButton.addEventListener('click', this.stopRecording);
    this.discardButton.addEventListener('click', this.discardRecording);
    this.submitButton.addEventListener('click', this.submitRecording);
    this.playButton.addEventListener('click', this.togglePlay);
  }

  disconnectedCallback() {
    // Clean up event listeners
    this.recordButton.removeEventListener('click', this.startRecording);
    this.stopButton.removeEventListener('click', this.stopRecording);
    this.discardButton.removeEventListener('click', this.discardRecording);
    this.submitButton.removeEventListener('click', this.submitRecording);
    this.playButton.removeEventListener('click', this.togglePlay);

    // Stop any ongoing recordings
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }

    // Clear intervals
    clearInterval(this.interval);
  }

  // Method to load WaveSurfer.js dynamically
  loadWaveSurfer() {
    return new Promise((resolve, reject) => {
      if (window.WaveSurfer) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/wavesurfer.js';
      script.onload = () => {
        resolve();
      };
      script.onerror = () => {
        reject(new Error('WaveSurfer.js failed to load.'));
      };
      document.head.appendChild(script);
    });
  }

  // Initialize WaveSurfer
  initializeWaveSurfer() {
    this.waveSurfer = WaveSurfer.create({
      container: this.waveformContainer,
      waveColor: '#555',
      progressColor: '#FF5252',
      cursorColor: '#FF5252',
      height: 80,
      responsive: true,
      normalize: true,
      partialRender: true
    });

    // Event listener for waveform completion
    this.waveSurfer.on('finish', () => {
      this.playButton.innerHTML = `
        <img class="icon" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M8 5v14l11-7z'/%3E%3C/svg%3E">
      `;
    });

    this.waveSurfer.on('play', () => {
      this.playButton.innerHTML = `
        <img class="icon" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M6 19h4V5H6v14zm8-14v14h4V5h-4z'/%3E%3C/svg%3E">
      `;
    });

    this.waveSurfer.on('pause', () => {
      this.playButton.innerHTML = `
        <img class="icon" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M8 5v14l11-7z'/%3E%3C/svg%3E">
      `;
    });
  }

  // Start Recording
  async startRecording() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(this.stream, { mimeType: 'audio/mp4' });

      this.mediaRecorder.start();
      this.recordButton.disabled = true;
      this.stopButton.disabled = false;
      this.discardButton.style.display = 'none';
      this.submitButton.style.display = 'none';
      this.timerElement.style.display = 'inline';
      this.waveformContainer.style.display = 'none';
      this.playButton.style.display = 'none';
      this.recordText.style.display = 'none';

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

      this.mediaRecorder.onstop = async () => {
        clearInterval(this.interval);
        this.timerElement.style.display = 'none';
        this.stopButton.disabled = true;
        this.recordButton.disabled = false;

        this.blob = new Blob(this.chunks, { type: 'audio/mp4' });
        this.chunks = [];

        // Stop all tracks to release the microphone
        this.stream.getTracks().forEach(track => track.stop());

        // Convert to WAV
        try {
          this.wavBlob = await this.convertToWav(this.blob);
          const audioURL = URL.createObjectURL(this.wavBlob);
          this.waveSurfer.load(audioURL);
          this.waveformContainer.style.display = 'block';
          this.playButton.style.display = 'flex';
        } catch (error) {
          console.error('Error during processing:', error);
          this.showMessage('An error occurred while processing the audio.', 'red');
        }

        // Center the control buttons
        this.controls.classList.add('centered');

        this.submitButton.style.display = 'inline-flex';
        this.discardButton.style.display = 'inline-flex';
        this.recordText.style.display = 'block';
      };
    } catch (error) {
      console.error('Error accessing microphone:', error);
      this.showMessage('Error accessing microphone. Please check your device settings.', 'red');
    }
  }

  // Stop Recording
  stopRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    clearInterval(this.interval);
    this.stopButton.disabled = true;
  }

  // Discard Recording
  discardRecording() {
    this.seconds = 0;
    clearInterval(this.interval);
    this.timerElement.textContent = '00:00';
    this.timerElement.style.display = 'none';
    this.discardButton.style.display = 'none';
    this.submitButton.style.display = 'none';
    this.recordButton.disabled = false;
    this.waveSurfer.empty();
    this.waveformContainer.style.display = 'none';
    this.playButton.style.display = 'none';
    this.wavBlob = null;
    this.showMessage('Recording discarded.', 'yellow');
    this.recordText.style.display = 'block';
    this.controls.classList.remove('centered');
  }

  // Submit Recording
  async submitRecording() {
    if (!this.wavBlob) {
      this.showMessage('No recording to submit.', 'red');
      return;
    }

    // Retrieve Title and Links
    const title = this.titleInput.value.trim();
    const links = this.linksInput.value.trim();

    if (!title) {
      this.showMessage('Please enter a title.', 'red');
      return;
    }

    // Stop WaveSurfer to release resources
    if (this.waveSurfer) {
      this.waveSurfer.pause();
    }

    const formData = new FormData();
    formData.append('file', this.wavBlob, 'recording.wav');
    formData.append('title', title);
    formData.append('links', links);

    // Show a submitting message
    this.showMessage('Submitting audio...', 'black');

    try {
      const response = await fetch('https://hooks.zapier.com/hooks/catch/17969384/2dvld0t/', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Success:', data);
        this.showMessage('Audio submitted successfully!', 'green');
        // Reset UI after a short delay to allow users to see the success message
        setTimeout(() => {
          this.discardRecording();
          this.titleInput.value = '';
          this.linksInput.value = '';
        }, 2000);
      } else {
        throw new Error(`Server responded with status ${response.status}`);
      }
    } catch (error) {
      console.error('Error submitting audio:', error);
      this.showMessage('Error submitting audio. Please try again.', 'red');
    }
  }

  // Toggle Play/Pause
  togglePlay() {
    if (this.waveSurfer) {
      this.waveSurfer.playPause();
    }
  }

  // Convert audio Blob to WAV format
  async convertToWav(blob) {
    try {
      const arrayBuffer = await blob.arrayBuffer();
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

      // Encode to WAV
      const wavBuffer = this.encodeWav(audioBuffer);
      return new Blob([wavBuffer], { type: 'audio/wav' });
    } catch (error) {
      console.error('Error converting to WAV:', error);
      throw error;
    }
  }

  // Encode AudioBuffer to WAV
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

    /* RIFF identifier 'RIFF' */
    this.writeString(view, 0, 'RIFF');
    /* file length minus RIFF identifier length and file description length */
    view.setUint32(4, 36 + dataLength, true);
    /* RIFF type 'WAVE' */
    this.writeString(view, 8, 'WAVE');
    /* format chunk identifier 'fmt ' */
    this.writeString(view, 12, 'fmt ');
    /* format chunk length */
    view.setUint32(16, 16, true);
    /* sample format (raw) */
    view.setUint16(20, format, true);
    /* channel count */
    view.setUint16(22, numChannels, true);
    /* sample rate */
    view.setUint32(24, sampleRate, true);
    /* byte rate (sample rate * block align) */
    view.setUint32(28, sampleRate * numChannels * bitsPerSample / 8, true);
    /* block align (channel count * bytes per sample) */
    view.setUint16(32, numChannels * bitsPerSample / 8, true);
    /* bits per sample */
    view.setUint16(34, bitsPerSample, true);
    /* data chunk identifier 'data' */
    this.writeString(view, 36, 'data');
    /* data chunk length */
    view.setUint32(40, dataLength, true);

    // Write PCM samples
    this.floatTo16BitPCM(view, 44, interleaved);

    return buffer;
  }

  // Write string to DataView
  writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  // Convert float samples to 16-bit PCM
  floatTo16BitPCM(output, offset, input) {
    for (let i = 0; i < input.length; i++, offset += 2) {
      let s = Math.max(-1, Math.min(1, input[i]));
      s = s < 0 ? s * 0x8000 : s * 0x7FFF;
      output.setInt16(offset, s, true);
    }
  }

  // Interleave left and right channels
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

  // Display messages to the user
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

customElements.define('audio-recorder5000', AudioRecorder);
