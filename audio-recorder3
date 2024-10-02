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

    container.append(recordButton, stopButton, submitButton, audioPlayback, discardButton);
    this.shadowRoot.append(container);

    let mediaRecorder;
    let audioBlob;

    recordButton.addEventListener('click', async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      const chunks = [];
      mediaRecorder.start();

      recordButton.disabled = true;
      stopButton.disabled = false;

      mediaRecorder.ondataavailable = e => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        audioBlob = new Blob(chunks, { type: 'audio/webm' });
        audioPlayback.src = URL.createObjectURL(audioBlob);
        audioPlayback.style.display = 'block';
        submitButton.style.display = 'block';
        discardButton.style.display = 'block';
        stopButton.disabled = true;
        recordButton.disabled = false;
        stream.getTracks().forEach(track => track.stop());
      };
    });

    stopButton.addEventListener('click', () => mediaRecorder.stop());

    discardButton.addEventListener('click', () => {
      audioPlayback.src = '';
      submitButton.style.display = 'none';
      discardButton.style.display = 'none';
      audioPlayback.style.display = 'none';
      audioBlob = null;
    });

    submitButton.addEventListener('click', () => {
      const formData = new FormData();
      formData.append('file', audioBlob, 'audiofile.webm');
      formData.append('upload_preset', 'MentorAi');

      fetch(`https://api.cloudinary.com/v1_1/deyflef5j/auto/upload`, {
        method: 'POST',
        body: formData
      })
      .then(response => response.json())
      .then(data => {
        console.log('Cloudinary upload success:', data);
        alert('File uploaded successfully!');
        sendFileUrlToZapier(data.secure_url);
      })
      .catch(err => console.error('Cloudinary upload error:', err));
    });

    function sendFileUrlToZapier(fileUrl) {
      fetch('https://hooks.zapier.com/hooks/catch/17969384/2dvld0t/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fileUrl })
      })
      .then(response => response.json())
      .then(data => console.log('Zapier webhook success:', data))
      .catch(error => console.error('Zapier webhook error:', error));
    }
  }
}

customElements.define('audio-recorder3', AudioRecorder);
