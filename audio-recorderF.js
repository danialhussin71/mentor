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
        const statusText = document.createElement('p');

        // Set UI properties
        recordButton.textContent = 'Start';
        stopButton.textContent = 'Stop';
        submitButton.textContent = 'Submit';
        discardButton.textContent = 'Discard';
        stopButton.disabled = true;
        submitButton.style.display = 'none';
        discardButton.style.display = 'none';
        audioPlayback.controls = true;
        audioPlayback.style.display = 'none';
        statusText.textContent = '';
        statusText.style.visibility = 'hidden';

        container.style.display = 'flex';
        container.style.flexDirection = 'column';
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
        container.appendChild(statusText);
        this.shadowRoot.appendChild(container);

        let mediaRecorder;
        let chunks = [];
        let stream;

        // Load MP3 conversion library
        this.loadLibrary();

        recordButton.addEventListener('click', async () => {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/mp4' });

            mediaRecorder.ondataavailable = e => chunks.push(e.data);
            mediaRecorder.onstop = async () => {
                const blob = new Blob(chunks, { type: 'audio/mp4' });
                chunks = [];
                const mp3Blob = await this.convertToMP3(blob);
                audioPlayback.src = URL.createObjectURL(mp3Blob);
                audioPlayback.style.display = 'block';
                submitButton.style.display = 'block';
                discardButton.style.display = 'block';
                stopButton.disabled = true;
                recordButton.disabled = false;
                stream.getTracks().forEach(track => track.stop());
            };
            mediaRecorder.start();
            recordButton.disabled = true;
            stopButton.disabled = false;
        });

        stopButton.addEventListener('click', () => {
            mediaRecorder.stop();
        });

        discardButton.addEventListener('click', () => {
            audioPlayback.src = '';
            submitButton.style.display = 'none';
            discardButton.style.display = 'none';
            audioPlayback.style.display = 'none';
            statusText.style.visibility = 'hidden';
        });

        submitButton.addEventListener('click', async () => {
            const mp3Blob = await this.convertToMP3(audioPlayback.captureStream().getTracks()[0]);
            const formData = new FormData();
            formData.append('file', mp3Blob, 'filename.mp3');
            fetch('https://hooks.zapier.com/hooks/catch/17969384/2dvld0t/', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                statusText.textContent = 'Audio submitted successfully.';
                statusText.style.color = 'green';
                statusText.style.visibility = 'visible';
            })
            .catch(error => {
                console.error('Error:', error);
                statusText.textContent = 'Submission failed.';
                statusText.style.color = 'red';
                statusText.style.visibility = 'visible';
            });
        });
    }

    async loadLibrary() {
        await import('https://bespoke-otter-bc795f.netlify.app/lame.min.js');
        console.log('MP3 conversion library loaded!');
    }

    async convertToMP3(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = function() {
                const buffer = new Uint8Array(reader.result);
                const mp3Encoder = new lamejs.Mp3Encoder(1, 44100, 128); // Mono channel, 44100Hz, 128kbps
                const mp3Data = [];
                const samples = new Int16Array(buffer.buffer);
                let mp3buf = mp3Encoder.encodeBuffer(samples);
                if (mp3buf.length > 0) {
                    mp3Data.push(new Int8Array(mp3buf));
                }
                mp3buf = mp3Encoder.flush();   // Flush remaining data
                if (mp3buf.length > 0) {
                    mp3Data.push(new Int8Array(mp3buf));
                }
                const blob = new Blob(mp3Data, {type: 'audio/mp3'});
                resolve(blob);
            };
            reader.onerror = () => reject('Failed to read audio data');
            reader.readAsArrayBuffer(blob);
        });
    }
}

customElements.define('audio-recorderF', AudioRecorder);
