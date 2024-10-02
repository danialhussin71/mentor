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
      formData.append('file', audioPlayback.src); // This needs to be the blob directly
      fetch('https://hooks.zapier.com/hooks/catch/17969384/2dvld0t/', {
        method: 'POST',
        body: formData
      })
      .then(response => response.json())
      .then(data => console.log('Success:', data))
      .catch(error => console.error('Error:', error));
    });
  }
}

customElements.define('audio-recorder3', AudioRecorder);
