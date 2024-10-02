class AudioRecorder extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' }); // Use shadow DOM to encapsulate styles.
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    border: 1px solid #ccc;
                    padding: 10px;
                    text-align: center;
                    background-color: #f8f8f8;
                }
                button {
                    margin: 10px;
                    padding: 5px 10px;
                    font-size: 16px;
                }
            </style>
            <div>
                <button id="recordButton">Start Recording</button>
                <button id="stopButton" disabled>Stop Recording</button>
                <p id="status">Not Recording</p>
            </div>
            <audio controls hidden></audio>
        `;

        // Define DOM elements
        this.recordButton = this.shadowRoot.querySelector('#recordButton');
        this.stopButton = this.shadowRoot.querySelector('#stopButton');
        this.status = this.shadowRoot.querySelector('#status');
        this.audio = this.shadowRoot.querySelector('audio');

        // MediaRecorder instance
        this.mediaRecorder = null;
        this.audioChunks = [];

        // Bind event handlers
        this.recordButton.addEventListener('click', () => this.startRecording());
        this.stopButton.addEventListener('click', () => this.stopRecording());
    }

    async startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            this.mediaRecorder.start();
            this.recordButton.disabled = true;
            this.stopButton.disabled = false;
            this.status.textContent = 'Recording...';
            this.mediaRecorder.ondataavailable = e => this.audioChunks.push(e.data);
            this.mediaRecorder.onstop = () => this.handleRecordingStop();
        } catch (error) {
            console.error('Error accessing the microphone:', error);
        }
    }

    stopRecording() {
        this.mediaRecorder.stop();
        this.recordButton.disabled = false;
        this.stopButton.disabled = true;
        this.status.textContent = 'Not Recording';
    }

    handleRecordingStop() {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.audio.src = URL.createObjectURL(audioBlob);
        this.audio.hidden = false;
        this.audioChunks = [];
    }
}

customElements.define('audio-recorder', AudioRecorder);
