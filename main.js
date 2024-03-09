'use strict';

const preferredDisplaySurface = document.getElementById('displaySurface');
const startButton = document.getElementById('startButton');

if (adapter.browserDetails.browser === 'chrome' &&
    adapter.browserDetails.version >= 107) {
  // See https://developer.chrome.com/docs/web-platform/screen-sharing-controls/
  document.getElementById('options').style.display = 'block';
} else if (adapter.browserDetails.browser === 'firefox') {
  // Polyfill in Firefox.
  // See https://blog.mozilla.org/webrtc/getdisplaymedia-now-available-in-adapter-js/
  adapter.browserShim.shimGetDisplayMedia(window, 'screen');
}


function handleSuccess(stream) {
  startButton.disabled = true;
  preferredDisplaySurface.disabled = true;
  const video = document.querySelector('video');
  video.srcObject = stream;

  // demonstrates how to detect that the user has stopped
  // sharing the screen via the browser UI.
  let stop = false;
  stream.getVideoTracks()[0].addEventListener('ended', () => {
    stop = true;
    errorMsg('The user has ended sharing the screen');
    startButton.disabled = false;
    preferredDisplaySurface.disabled = false;
  });

  (function loop() {
    setTimeout(() => {
      if (stop)
        return;

      try {
        errorMsg(`${video.videoWidth}x${video.videoHeight}`);
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.style.width = '60%';
        canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
        document.body.append(canvas);
      }
      catch(e) {
        console.log('Stopping capture loop:', e);
        return;
      }

      loop();
    }, 10000);
  })();
}

function handleError(error) {
  errorMsg(`getDisplayMedia error: ${error.name}`, error);
}

function errorMsg(msg, error) {
  const errorElement = document.querySelector('#errorMsg');
  const date = new Date();
  const time = ('0' + date.getHours()).slice(-2) + ':' + ('0' + date.getMinutes()).slice(-2) + ':' + ('0' + date.getSeconds()).slice(-2);
  errorElement.innerHTML += `<br>${time} ${msg}`;
  if (typeof error !== 'undefined') {
    console.error(error);
  }
}

startButton.addEventListener('click', () => {
  const options = {
    audio: true,
    video: {width: {ideal: 4096}, height: {ideal: 2160}, frameRate: 30}
  };
  const displaySurface = preferredDisplaySurface.options[preferredDisplaySurface.selectedIndex].value;
  if (displaySurface !== 'default') {
    options.video = {displaySurface};
  }
  navigator.mediaDevices.getDisplayMedia(options)
      .then(handleSuccess, handleError);
});

if ((navigator.mediaDevices && 'getDisplayMedia' in navigator.mediaDevices)) {
  startButton.disabled = false;
} else {
  errorMsg('getDisplayMedia is not supported');
}