// Example setup, adjust according to your actual setup and logic
var recordButton = document.getElementById('recordButton');
var pauseButton = document.getElementById('pauseButton');
var stopButton = document.getElementById('stopButton');
var recordingsList = document.getElementById('recordingsList');
var audioContext = new AudioContext;
var gumStream; // stream from getUserMedia()
var rec; // Recorder.js object

// Event handling for buttons
recordButton.addEventListener("click", startRecording);
pauseButton.addEventListener("click", pauseRecording);
stopButton.addEventListener("click", stopRecording);

function startRecording() {
    navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then(function(stream) {
        gumStream = stream;
        var input = audioContext.createMediaStreamSource(stream);
        rec = new Recorder(input, {numChannels: 1});
        rec.record();
    }).catch(function(err) {
        console.log(err);
    });
}

function pauseRecording() {
    if (rec.recording) {
        rec.stop();
        pauseButton.textContent = "Resume";
    } else {
        rec.record();
        pauseButton.textContent = "Pause";
    }
}

function stopRecording() {
    rec.stop();
    gumStream.getAudioTracks()[0].stop();
    rec.exportWAV(createDownloadLink);
}

function createDownloadLink(blob) {
    var url = URL.createObjectURL(blob);
    var au = document.createElement('audio');
    var li = document.createElement('li');
    var link = document.createElement('a');
    au.controls = true;
    au.src = url;
    link.href = url;
    link.download = new Date().toISOString() + '.wav';
    link.innerHTML = "Download";
    li.appendChild(au);
    li.appendChild(link);
    recordingsList.appendChild(li);
}
