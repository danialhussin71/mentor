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
          align-items: center;
          width: 100%;
          max-width: 1920px;
          margin: 20px auto;
          padding: 30px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4);
          border-radius: 10px;
          background-color: #2a2a2a;
          color: #ffffff;
          box-sizing: border-box;
          font-family: "Avenir", sans-serif;
        }

        /* Left section for Title, Links, and User Name */
        .left {
          width: 50%;
          padding-right: 30px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          gap: 25px;
        }

        .left h2 {
          margin: 0 0 8px 0;
          font-size: 26px;
          color: #ffffff;
        }

        .right h2 {
          margin: 0 0 8px 0;
          font-size: 26px;
          color: #ffffff;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .input-group input {
          padding: 10px 14px;
          font-size: 18px;
          border: 1px solid #777;
          border-radius: 6px;
          background-color: #3c3c3c;
          color: #f0f0f0;
          transition: border-color 0.3s, box-shadow 0.3s;
        }

        .input-group input:focus {
          border-color: #ff5252;
          box-shadow: 0 0 5px rgba(255, 82, 82, 0.5);
          outline: none;
        }

        .input-group input.error {
          border-color: #e53935;
          animation: shake 0.3s;
        }

        @keyframes shake {
          0% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          50% { transform: translateX(5px); }
          75% { transform: translateX(-5px); }
          100% { transform: translateX(0); }
        }

        /* Right section for Recorder */
        .right {
          width: 50%;
          padding-left: 30px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          gap: 20px;
          position: relative;
        }

        /* Controls Row */
        .controls-row {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 10px;
          width: 100%;
        }

        /* Timer */
        #timer {
          font-size: 18px;
          color: #FF5252;
          display: none;
          font-weight: bold;
        }

        /* Record Text */
        .right h2.record-text {
          margin: 0 0 8px 0;
          font-size: 26px;
          color: #ffffff;
        }

        /* Audio Recorder Controls */
        .audio-recorder-controls {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 20px;
          flex-grow: 1;
        }

        .audio-recorder-controls.centered {
          justify-content: flex-start;
        }

        button {
          background-color: transparent;
          color: #f0f0f0;
          border: none;
          padding: 12px;
          border-radius: 8px;
          font-size: 18px;
          cursor: pointer;
          display: flex;
          align-items: center;
          transition: background-color 0.3s, transform 0.2s;
        }

        button:disabled {
          color: #888;
          cursor: not-allowed;
        }

        button:not(:disabled):hover {
          background-color: rgba(255, 255, 255, 0.15);
          transform: scale(1.05);
        }

        .icon {
          width: 34px;
          height: 34px;
          margin-right: 8px;
        }

        /* Waveform Container */
        .waveform-container {
          width: 100%;
          height: 80px;
          border-radius: 6px;
          overflow: hidden;
          background-color: #333;
          margin-top: 20px;
          display: none;
          border: 1px solid #777;
        }

        /* Message Styling */
        .message {
          width: 100%;
          text-align: center;
          margin-top: 15px;
          font-size: 16px;
          padding: 10px;
          border-radius: 6px;
          display: none;
        }

        /* Success Message */
        .message.success {
          color: #2e7d32;
          background-color: #c8e6c9;
        }

        /* Error Message */
        .message.error {
          color: #c62828;
          background-color: #ffcdd2;
        }

        /* Info Message */
        .message.info {
          color: #0277bd;
          background-color: #b3e5fc;
        }

        /* Warning Message */
        .message.warning {
          color: #f9a825;
          background-color: #fff9c4;
        }

        /* Responsive Adjustments */
        @media (max-width: 600px) {
          .container {
            flex-direction: column;
            padding: 15px;
          }
          .left, .right {
            width: 100%;
            padding: 0;
          }
          .right {
            padding-top: 15px;
          }
          .waveform-container {
            height: 60px;
          }
          /* Adjust button sizes */
          button {
            padding: 8px;
            font-size: 16px;
          }
          .icon {
            width: 24px;
            height: 24px;
            margin-right: 5px;
          }
          /* Centered controls */
          .audio-recorder-controls.centered {
            flex-direction: row;
            gap: 12px;
          }
        }
      </style>
      <div class="container">
        <!-- Left Section -->
        <div class="left">
          <div class="input-group">
            <h2>Title<span style="color: red;">*</span></h2>
            <input type="text" id="titleInput" placeholder="Enter title here">
          </div>
          <div class="input-group">
            <h2>Links</h2>
            <input type="text" id="linksInput" placeholder="Enter links here">
          </div>
          <div class="input-group">
            <h2>User name<span style="color: red;">*</span></h2>
            <input type="email" id="userNameInput" placeholder="Your mentor email">
          </div>
        </div>

        <!-- Right Section -->
        <div class="right">
          <h2 class="record-text" id="recordText">Record</h2>
          <div class="controls-row">
            <span id="timer">00:00</span>
            <div class="audio-recorder-controls" id="controls">
              <button id="recordButton" title="Start Recording" aria-label="Start Recording">
                <img class="icon" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23FF5252'%3E%3Cpath d='M12 15c1.66 0 3-1.34 3-3V6c0-1.66-1.34-3-3-3S9 4.34 9 6v6c0 1.66 1.34 3 3 3zm5-3c0 2.76-2.24 5-5 5s-5-2.24-5-5H4v6h16v-6h-3zm3-13h-4v2h4v4h2V4h4V2h-4V0h-2v2z'/%3E%3C/svg%3E">
              </button>
              <button id="stopButton" disabled title="Stop Recording" aria-label="Stop Recording">
                <img class="icon" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23B0BEC5'%3E%3Cpath d='M6 6h12v12H6z'/%3E%3C/svg%3E">
              </button>
              <button id="playButton" title="Play/Pause" aria-label="Play/Pause">
                <img class="icon" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M8 5v14l11-7z'/%3E%3C/svg%3E">
              </button>
              <button id="discardButton" title="Discard Recording" aria-label="Discard Recording">
                <img class="icon" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23FFC107'%3E%3Cpath d='M16 9v10H8V9h8m-1.5-6L12 2 9.5 3H5v2h14V3h-4.5zM7 9v10a2 2 0 002 2h6a2 2 0 002-2V9a2 2 0 00-2-2H9a2 2 0 00-2 2z'/%3E%3C/svg%3E">
              </button>
              <button id="submitButton" title="Submit Recording" aria-label="Submit Recording">
                <img class="icon" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M9 16.17L4.83 12 3.41 13.41 9 19l11-11-1.41-1.41z'/%3E%3C/svg%3E"> Submit
              </button>
            </div>
          </div>
          <div class="waveform-container">
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
    this.waveformOuterContainer = this.shadowRoot.querySelector('.waveform-container');
    this.messageDiv = this.shadowRoot.getElementById('message');
    this.recordText = this.shadowRoot.getElementById('recordText');
    this.controls = this.shadowRoot.getElementById('controls');
    this.titleInput = this.shadowRoot.getElementById('titleInput');
    this.linksInput = this.shadowRoot.getElementById('linksInput');
    this.userNameInput = this.shadowRoot.getElementById('userNameInput');

    // Initialize variables
    this.mediaRecorder = null;
    this.chunks = [];
    this.stream = null;
    this.blob = null;
    this.audioContext = null;
    this.wavBlob = null;
    this.mp3Blob = null; // Added for MP3
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
        this.showMessage('Failed to load audio waveform.', 'error');
      });

    // Set up event listeners
    this.recordButton.addEventListener('click', this.startRecording);
    this.stopButton.addEventListener('click', this.stopRecording);
    this.discardButton.addEventListener('click', this.discardRecording);
    this.submitButton.addEventListener('click', this.submitRecording);
    this.playButton.addEventListener('click', this.togglePlay);

    // Initialize button states
    this.recordButton.disabled = false;
    this.stopButton.disabled = true;
    this.playButton.disabled = true;
    this.discardButton.disabled = true;
    this.submitButton.disabled = true;
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
      waveColor: '#aaa',
      progressColor: '#ff5252',
      cursorColor: '#ff5252',
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

    // Handle waveform errors
    this.waveSurfer.on('error', (error) => {
      console.error('WaveSurfer error:', error);
      this.showMessage('Error loading waveform.', 'error');
    });
  }

  // Start Recording
  async startRecording() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(this.stream, { mimeType: 'audio/webm' });

      this.mediaRecorder.start();
      this.recordButton.disabled = true;
      this.stopButton.disabled = false;
      this.playButton.disabled = true;
      this.discardButton.disabled = true;
      this.submitButton.disabled = true;
      this.timerElement.style.display = 'inline';
      this.waveformOuterContainer.style.display = 'none';

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
        this.discardButton.disabled = false;
        this.submitButton.disabled = false;
        this.playButton.disabled = false;

        this.blob = new Blob(this.chunks, { type: 'audio/webm' });
        this.chunks = [];

        // Stop all tracks to release the microphone
        if (this.stream) {
          this.stream.getTracks().forEach(track => track.stop());
          this.stream = null;
        }

        // Convert to WAV and MP3
        try {
          const audioBuffer = await this.convertBlobToAudioBuffer(this.blob);

          // Convert to WAV
          this.wavBlob = await this.convertAudioBufferToWavBlob(audioBuffer);

          // Convert to MP3
          this.mp3Blob = await this.convertAudioBufferToMp3Blob(audioBuffer);

          const audioURL = URL.createObjectURL(this.wavBlob);
          if (!this.waveSurfer) {
            this.initializeWaveSurfer();
          }
          this.waveSurfer.load(audioURL);
          this.waveformOuterContainer.style.display = 'block';
        } catch (error) {
          console.error('Error during processing:', error);
          this.showMessage('An error occurred while processing the audio.', 'error');
        }

        // Center the control buttons
        this.controls.classList.add('centered');
      };
    } catch (error) {
      console.error('Error accessing microphone:', error);
      this.showMessage('Error accessing microphone. Please check your device settings.', 'error');
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
  discardRecording(showMessage = true) {
    this.seconds = 0;
    clearInterval(this.interval);
    this.timerElement.textContent = '00:00';
    this.timerElement.style.display = 'none';
    this.discardButton.disabled = true;
    this.submitButton.disabled = true;
    this.playButton.disabled = true;
    this.recordButton.disabled = false;
    if (this.waveSurfer) {
      this.waveSurfer.destroy();
      this.waveSurfer = null;
    }
    this.waveformOuterContainer.style.display = 'none';
    this.wavBlob = null;
    this.blob = null;
    this.mp3Blob = null; // Reset the MP3 blob
    if (showMessage) {
      this.showMessage('Recording discarded.', 'warning');
    }
    this.controls.classList.remove('centered');
  }

  // Submit Recording
  async submitRecording() {
    if (!this.wavBlob || !this.mp3Blob) {
      this.showMessage('No recording to submit.', 'error');
      return;
    }

    // Retrieve Title, Links, and User Name (Email)
    const title = this.titleInput.value.trim();
    const links = this.linksInput.value.trim();
    const userName = this.userNameInput.value.trim();

    let valid = true;

    // Clear previous error states
    this.titleInput.classList.remove('error');
    this.userNameInput.classList.remove('error');

    // Validate Title
    if (!title) {
      this.showMessage('Please enter a title.', 'error');
      this.titleInput.classList.add('error');
      valid = false;
    }

    // Validate User Name (Email)
    if (!userName) {
      this.showMessage('Please enter your mentor email.', 'error');
      this.userNameInput.classList.add('error');
      valid = false;
    } else if (!this.validateEmail(userName)) {
      this.showMessage('Please enter a valid email address.', 'error');
      this.userNameInput.classList.add('error');
      valid = false;
    }

    if (!valid) {
      return;
    }

    // Stop WaveSurfer to release resources
    if (this.waveSurfer) {
      this.waveSurfer.pause();
    }

    const formData = new FormData();
    formData.append('mp3file', this.mp3Blob, 'recording.mp3');
    formData.append('wavfile', this.wavBlob, 'recording.wav');
    formData.append('title', title);
    formData.append('links', links);
    formData.append('userName', userName);

    // Show a submitting message
    this.showMessage('Submitting audio...', 'info');

    try {
      const response = await fetch('https://hooks.zapier.com/hooks/catch/17969384/2dvld0t/', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        // Attempt to parse JSON, but handle if it's not JSON
        try {
          const data = await response.json();
          console.log('Success:', data);
        } catch (jsonError) {
          console.warn('Response is not JSON:', jsonError);
        }
        this.showMessage('Audio submitted successfully!', 'success');
        // Reset UI after a short delay to allow users to see the success message
        setTimeout(() => {
          this.discardRecording(false); // Do not show 'Recording discarded' message
          this.titleInput.value = '';
          this.linksInput.value = '';
          this.userNameInput.value = '';
        }, 2000);
      } else {
        throw new Error(`Server responded with status ${response.status}`);
      }
    } catch (error) {
      console.error('Error submitting audio:', error);
      this.showMessage('Error submitting audio. Please try again.', 'error');
    }
  }

  // Validate Email Format
  validateEmail(email) {
    // Simple email regex
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
  }

  // Toggle Play/Pause
  togglePlay() {
    if (this.waveSurfer) {
      this.waveSurfer.playPause();
    } else {
      this.showMessage('No audio to play.', 'error');
    }
  }

  // Convert Blob to AudioBuffer
  async convertBlobToAudioBuffer(blob) {
    const arrayBuffer = await blob.arrayBuffer();
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return await this.audioContext.decodeAudioData(arrayBuffer);
  }

  // Convert AudioBuffer to WAV Blob
  async convertAudioBufferToWavBlob(audioBuffer) {
    const wavBuffer = this.encodeWav(audioBuffer);
    return new Blob([wavBuffer], { type: 'audio/wav' });
  }

  // Convert AudioBuffer to MP3 Blob
  async convertAudioBufferToMp3Blob(audioBuffer) {
    return new Promise((resolve, reject) => {
      // Load the Lame.js library for MP3 encoding
      if (!window.lamejs) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lamejs/1.2.0/lame.min.js';
        script.onload = () => {
          this.encodeMp3(audioBuffer, resolve, reject);
        };
        script.onerror = () => {
          reject(new Error('Failed to load Lame.js for MP3 encoding.'));
        };
        document.head.appendChild(script);
      } else {
        this.encodeMp3(audioBuffer, resolve, reject);
      }
    });
  }

  // Encode AudioBuffer to MP3
  encodeMp3(audioBuffer, resolve, reject) {
    try {
      const samples = audioBuffer.getChannelData(0);
      const sampleRate = audioBuffer.sampleRate;
      const mp3encoder = new lamejs.Mp3Encoder(1, sampleRate, 128);
      const blockSize = 1152;
      const mp3Data = [];

      for (let i = 0; i < samples.length; i += blockSize) {
        const sampleChunk = samples.subarray(i, i + blockSize);
        const mp3buf = mp3encoder.encodeBuffer(sampleChunk);
        if (mp3buf.length > 0) {
          mp3Data.push(mp3buf);
        }
      }

      const mp3buf = mp3encoder.flush();
      if (mp3buf.length > 0) {
        mp3Data.push(mp3buf);
      }

      const mp3Blob = new Blob(mp3Data, { type: 'audio/mp3' });
      resolve(mp3Blob);
    } catch (error) {
      reject(error);
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
  showMessage(message, type) {
    this.messageDiv.textContent = message;
    this.messageDiv.className = `message ${type}`;
    this.messageDiv.style.display = 'block';
    // Hide the message after 3 seconds
    clearTimeout(this.messageTimeout);
    this.messageTimeout = setTimeout(() => {
      this.messageDiv.style.display = 'none';
      this.messageDiv.className = 'message'; // Reset class
    }, 3000);
  }
}

customElements.define('audio-recorder6666', AudioRecorder);
