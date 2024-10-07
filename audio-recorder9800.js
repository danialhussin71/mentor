// audio-recorder9200.js

class AudioRecorder extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    // Create template
    const template = document.createElement('template');
    template.innerHTML = `
      <style>
        /* [Your existing styles here] */
        /* No changes needed here */
      </style>
      <div class="container">
        <!-- [Your existing HTML structure here] -->
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

    // Handle waveform errors
    this.waveSurfer.on('error', (error) => {
      console.error('WaveSurfer error:', error);
      this.showMessage('Error loading waveform.', 'error');
    });
  }

  // Start Recording
  async startRecording() {
    try {
      console.log('Requesting microphone access...');
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Microphone access granted.');

      // **Use a supported MIME type**
      const mimeType = 'audio/webm'; // Recommended supported type

      if (!MediaRecorder.isTypeSupported(mimeType)) {
        console.error(`MIME type ${mimeType} is not supported.`);
        this.showMessage(`MIME type ${mimeType} is not supported in this browser.`, 'error');
        return;
      }

      this.mediaRecorder = new MediaRecorder(this.stream, { mimeType });
      console.log(`MediaRecorder created with MIME type: ${mimeType}`);

      this.mediaRecorder.start();
      this.recordButton.disabled = true;
      this.stopButton.disabled = false;
      this.submitButton.disabled = true;
      this.discardButton.disabled = true;
      this.playButton.disabled = true; // Disable play button until recording is done
      this.timerElement.style.display = 'inline';
      this.waveformContainer.style.display = 'none';
      this.playButton.style.display = 'flex';
      this.playButton.style.order = '3'; // Ensure Play button is after Stop button
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

        this.blob = new Blob(this.chunks, { type: mimeType });
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
          this.waveSurfer.load(audioURL);
          this.waveformContainer.style.display = 'block';
          this.playButton.disabled = false; // Enable play button after recording
        } catch (error) {
          console.error('Error during processing:', error);
          this.showMessage('An error occurred while processing the audio.', 'error');
        }

        // Enable Submit and Discard buttons
        this.submitButton.disabled = false;
        this.discardButton.disabled = false;
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
  discardRecording() {
    this.seconds = 0;
    clearInterval(this.interval);
    this.timerElement.textContent = '00:00';
    this.timerElement.style.display = 'none';
    this.discardButton.disabled = true;
    this.submitButton.disabled = true;
    this.recordButton.disabled = false;
    this.waveSurfer.empty();
    this.waveformContainer.style.display = 'none';
    this.playButton.style.display = 'none';
    this.wavBlob = null;
    this.showMessage('Recording discarded.', 'warning');
    this.recordText.style.display = 'block'; // Show recordText again
    this.controls.classList.remove('centered');
  }

  // Submit Recording
  async submitRecording() {
    if (!this.wavBlob) {
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

    // Stop WaveSurfer to release resources
    if (this.waveSurfer) {
      this.waveSurfer.pause();
    }

    const formData = new FormData();
    formData.append('file', this.wavBlob, 'recording.wav');
    formData.append('title', title);
    formData.append('links', links);
    formData.append('userName', userName); // Append the new field

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
          this.discardRecording();
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

customElements.define('audio-recorder9800', AudioRecorder);
