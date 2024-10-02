// audio-recorder.js

document.addEventListener('DOMContentLoaded', function() {
    let mediaRecorder;
    let recordedChunks = [];
    const recordButton = document.getElementById('recordButton');
    const stopButton = document.getElementById('stopButton');
    const audioPlayback = document.getElementById('audioPlayback');
    const recordingStatus = document.getElementById('recording-status');

    recordButton.addEventListener('click', async () => {
        const audioConstraints = {
            audio: {
                sampleRate: 48000,
                channelCount: 2,
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false,
            }
        };

        try {
            const stream = await navigator.mediaDevices.getUserMedia(audioConstraints);

            if (MediaRecorder.isTypeSupported('audio/webm')) {
                mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
                mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/ogg; codecs=opus' });
            } else {
                alert('Your browser does not support any available audio format for recording.');
                return;
            }

            mediaRecorder.start();
            recordingStatus.style.display = 'block';
            recordButton.disabled = true;
            stopButton.disabled = false;

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    recordedChunks.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(recordedChunks, { type: mediaRecorder.mimeType });
                recordedChunks = [];
                const audioURL = URL.createObjectURL(blob);
                audioPlayback.src = audioURL;
            };
        } catch (error) {
            alert('Microphone access denied or an error occurred');
            console.error(error);
        }
    });

    stopButton.addEventListener('click', () => {
        mediaRecorder.stop();
        recordingStatus.style.display = 'none';
        recordButton.disabled = false;
        stopButton.disabled = true;
    });
});
