class AudioRecorder extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    // Create elements
    const container = document.createElement('div');
    const recordButton = document.createElement('button');
    const stopButton = document.createElement('button');
    const submitButton = document.createElement('button');
    const audioPlayback = document.createElement('audio');
    const discardButton = document.createElement('button');

    // Set element properties
    recordButton.textContent = 'Start';
    stopButton.textContent = 'Stop';
    submitButton.textContent = 'Submit';
    discardButton.textContent = 'Discard';
    stopButton.disabled = true;
    submitButton.style.display = 'none';
    discardButton.style.display = 'none';
    audioPlayback.controls = true;
    audioPlayback.style.display = 'none';

    // Style adjustments for a sleek look
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.alignItems = 'center';
    container.style.gap = '10px';
    const buttonStyle = 'padding: 5px 10px; font-size: 14px;';
    recordButton.style.cssText = buttonStyle;
    stopButton.style.cssText = buttonStyle;
    submitButton.style.cssText = buttonStyle;
    discardButton.style.cssText = buttonStyle;

    // Append elements to the container
    container.appendChild(recordButton);
    container.appendChild(stopButton);
    container.appendChild(submitButton);
    container.appendChild(audioPlayback);
    container.appendChild(discardButton);
    this.shadowRoot.appendChild(container);

    // Event handlers
    let mediaRecorder;
    let chunks = [];
    let stream;

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

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/mp4' });
        chunks = [];
        audioPlayback.src = URL.createObjectURL(blob);
        audioPlayback.style.display = 'block';
        submitButton.style.display = 'block';
        discardButton.style.display = 'block';
        stopButton.disabled = true;
        recordButton.disabled = false;
        stream.getTracks().forEach(track => track.stop()); // Stop using the mic
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
  }
}

customElements.define('audio-recorder1', AudioRecorder);
