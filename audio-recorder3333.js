// audio-recorder.js

class AudioRecorder extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    // Create template
    const template = document.createElement('template');
    template.innerHTML = 
      `<style>
        /* Container split into two equal parts */
        .container {
          display: flex;
          flex-direction: row;
          align-items: center; /* Center items vertically to minimize extra space */
          width: 100%;
          max-width: 1920px;
          margin: 20px auto;
          padding: 30px; /* Increased padding for better spacing */
          box-shadow: 0 4px 12px rgba(0,0,0,0.4); /* Enhanced shadow for depth */
          border-radius: 10px; /* Slightly larger border-radius */
          background-color: #2a2a2a; /* Darker background for improved contrast */
          color: #ffffff; /* Text color set to white */
          box-sizing: border-box;
          font-family: "Avenir", sans-serif;
        }

        /* Left section for Title, Links, and User Name */
        .left {
          width: 50%;
          padding-right: 30px; /* Increased padding for better spacing */
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          gap: 25px; /* Increased gap for better separation */
        }

        .left h2 {
          margin: 0 0 8px 0; /* Slightly increased bottom margin */
          font-size: 26px; /* Increased font size */
          color: #ffffff; /* Text color set to white */
        }

        .right h2 {
          margin: 0 0 8px 0; /* Match .left h2 */
          font-size: 26px; /* Match .left h2 */
          color: #ffffff; /* Text color set to white */
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px; /* Increased gap for better spacing */
        }

        .input-group input {
          padding: 10px 14px; /* Increased padding for better input fields */
          font-size: 18px; /* Increased font size for readability */
          border: 1px solid #777; /* Slightly lighter border */
          border-radius: 6px; /* Larger border-radius for smoother edges */
          background-color: #3c3c3c; /* Slightly lighter background */
          color: #f0f0f0;
          transition: border-color 0.3s, box-shadow 0.3s;
        }

        .input-group input:focus {
          border-color: #ff5252; /* Highlight border on focus */
          box-shadow: 0 0 5px rgba(255, 82, 82, 0.5); /* Subtle shadow on focus */
          outline: none; /* Remove default outline */
        }

        .input-group input.error {
          border-color: #e53935; /* Brighter red for errors */
          animation: shake 0.3s; /* Shake animation for error indication */
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
          padding-left: 30px; /* Increased padding for better spacing */
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          gap: 20px; /* Increased gap for better separation */
          position: relative;
        }

        /* Controls Row */
        .controls-row {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 10px; /* Increased gap between controls */
          width: 100%;
        }

        /* Timer */
        #timer {
          font-size: 18px; /* Increased font size */
          color: #FF5252; /* Red color for recording indicator */
          display: none;
          font-weight: bold; /* Bold text for prominence */
        }

        /* Record Text */
        .right h2.record-text {
          margin: 0 0 8px 0; /* Match .left h2 */
          font-size: 26px; /* Match .left h2 */
          color: #ffffff; /* Text color set to white */
        }

        /* Audio Recorder Controls */
        .audio-recorder-controls {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 20px; /* Increased gap for better spacing */
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
          border-radius: 8px; /* Larger border-radius for smoother buttons */
          font-size: 18px; /* Increased font size */
          cursor: pointer;
          display: flex;
          align-items: center;
          transition: background-color 0.3s, transform 0.2s;
        }

        button:disabled {
          color: #888; /* Lighter color for disabled state */
          cursor: not-allowed;
        }

        button:not(:disabled):hover {
          background-color: rgba(255, 255, 255, 0.15);
          transform: scale(1.05); /* Slightly enlarge on hover */
        }

        .icon {
          width: 34px; /* Increased size */
          height: 34px; /* Increased size */
          margin-right: 8px; /* Increased margin for better spacing */
        }

        /* Waveform Container */
        .waveform-container {
          width: 100%;
          height: 80px;
          border-radius: 6px;
          overflow: hidden;
          background-color: #333;
          margin-top: 20px;
          display: none; /* Hidden initially */
          border: 1px solid #777;
        }

        /* Message Styling */
        .message {
          width: 100%;
          text-align: center;
          margin-top: 15px; /* Increased margin-top for better spacing */
          font-size: 16px; /* Increased font size for readability */
          padding: 10px;
          border-radius: 6px; /* Rounded corners for messages */
          display: none;
        }

        /* Success Message */
        .message.success {
          color: #2e7d32; /* Dark green for success */
          background-color: #c8e6c9; /* Light green background */
        }

        /* Error Message */
        .message.error {
          color: #c62828; /* Dark red for errors */
          background-color: #ffcdd2; /* Light red background */
        }

        /* Info Message */
        .message.info {
          color: #0277bd; /* Dark blue for info */
          background-color: #b3e5fc; /* Light blue background */
        }

        /* Warning Message */
        .message.warning {
          color: #f9a825; /* Dark yellow for warnings */
          background-color: #fff9c4; /* Light yellow background */
        }

        /* Responsive Adjustments */
        @media (max-width: 600px) {
          .container {
            flex-direction: column;
            padding: 15px; /* Reduced padding for smaller screens */
          }
          .left, .right {
            width: 100%;
            padding: 0;
          }
          .right {
            padding-top: 15px; /* Reduced padding-top */
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
            flex-direction: row; /* Keep horizontal on mobile */
            gap: 12px; /* Adjusted gap */
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
    this.userNameInput = this.shadowRoot.getElementById('userNameInput'); // New input field

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
      waveColor: '#aaa', // Lighter wave color for better visibility
      progressColor: '#ff5252',
      cursorColor: '#ff5252',
      height: 80,
      responsive: true,
      normalize: true,
      partialRender: true
    });

    // Event listener for waveform completion
    this.waveSurfer.on('finish', () => {
      this.playButton.innerHTML = 
        `<img class="icon" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M8 5v14l11-7z'/%3E%3C/svg%3E">`;
    });

    this.waveSurfer.on('play', () => {
      this.playButton.innerHTML = 
        `<img class="icon" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M6 19h4V5H6v14zm8-14v14h4V5h-4z'/%3E%3C/svg%3E">`;
    });

    this.waveSurfer.on('pause', () => {
      this.playButton.innerHTML = 
        `<img class="icon" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M8 5v14l11-7z'/%3E%3C/svg%3E">`;
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
      this.mediaRecorder = new MediaRecorder(this.stream, { mimeType: 'audio/mp4' });

      this.mediaRecorder.start();
      this.recordButton.disabled = true;
      this.stopButton.disabled = false;
      this.playButton.disabled = true;
      this.discardButton.disabled = true;
      this.submitButton.disabled = true;
      this.timerElement.style.display = 'inline';
      this.waveformOuterContainer.style.display = 'none';
      // this.recordText.style.display = 'none'; // Removed to keep 'Record' text visible

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

        this.blob = new Blob(this.chunks, { type: 'audio/mp4' });
        this.chunks = [];

        // Stop all tracks to release the microphone
        if (this.stream) {
          this.stream.getTracks().forEach(track => track.stop());
          this.stream = null;
        }

        // Convert to WAV
        try {
          this.wavBlob = await this.convertToWav(this.blob);
          const audioURL = URL.createObjectURL(this.wavBlob);
          if (!this.waveSurfer) {
            this.initializeWaveSurfer(); // Re-initialize WaveSurfer
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
      this.waveSurfer.destroy(); // Destroy WaveSurfer instance
      this.waveSurfer = null;
    }
    this.waveformOuterContainer.style.display = 'none';
    this.wavBlob = null;
    this.blob = null; // Also reset the mp4 blob
    if (showMessage) {
      this.showMessage('Recording discarded.', 'warning');
    }
    // this.recordText.style.display = 'block'; // Already visible
    this.controls.classList.remove('centered');
  }

  // Submit Recording
  async submitRecording() {
    if (!this.wavBlob || !this.blob) {
      this.showMessage('No recording to submit.', 'error');
      return;
    }

    // Retrieve Title, Links, and User Name (Email)
    const title = this.titleInput.value.trim();
    const links = this.linksInput.value.trim();
    const userName = this.userNameInput.value.trim(); // New field

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

    // Generate a Unique Job ID
    const jobId = crypto.randomUUID();

    // Stop WaveSurfer to release resources
    if (this.waveSurfer) {
      this.waveSurfer.pause();
    }

    const formData = new FormData();
    formData.append('mp4file', this.blob, 'recording.mp4');
    formData.append('wavfile', this.wavBlob, 'recording.wav');
    formData.append('title', title);
    formData.append('links', links);
    formData.append('userName', userName); // Append the new field
    formData.append('jobId', jobId); // Include jobId in the formData

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

        // Dispatch the custom event to Wix page code, including the userName and jobId
        this.dispatchEvent(new CustomEvent('startLoadingEvent', {
          bubbles: true,
          composed: true,
          detail: { action: "addJob", userName: userName, jobId: jobId }
        }));

        // Reset UI after a short delay to allow users to see the success message
        setTimeout(() => {
          this.discardRecording(false); // Do not show 'Recording discarded' message
          this.titleInput.value = '';
          this.linksInput.value = '';
          this.userNameInput.value = ''; // Reset the new field
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

customElements.define('audio-recorder3333', AudioRecorder);
