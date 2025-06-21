const mediaElement = document.getElementById('media-element');
const videoElement = document.getElementById('video-element');
const cameraElement = document.getElementById('camera-element');
const predictionsElement = document.getElementById('predictions');
const loadSampleBtn = document.getElementById('load-sample');
const uploadBtn = document.getElementById('upload-btn');
const fileInput = document.getElementById('file-input');
const imageTabBtn = document.getElementById('image-tab');
const videoTabBtn = document.getElementById('video-tab');
const cameraTabBtn = document.getElementById('camera-tab');
const videoUrlContainer = document.getElementById('video-url-container');
const videoUrlInput = document.getElementById('video-url');
const loadUrlBtn = document.getElementById('load-url');
const imageUrlContainer = document.getElementById('image-url-container');
const imageUrlInput = document.getElementById('image-url');
const loadImageUrlBtn = document.getElementById('load-image-url');

const modelConfig = { version: 2, alpha: 1.0 };
let model;
let mode = 'image'; // image | video | camera
let videoInterval;

async function loadModel() {
  predictionsElement.innerHTML = '<div class="loading">Cargando modelo, por favor espere...</div>';
  model = await mobilenet.load(modelConfig);
  predictionsElement.innerHTML = '<div class="loading">Modelo listo. Seleccione una fuente.</div>';
}

function displayPredictions(predictions) {
  predictionsElement.innerHTML = predictions.map(p =>
    `<div class="prediction"><strong>${p.className}</strong> (${Math.round(p.probability * 100)}%)</div>`
  ).join('');
}

async function classifyFrame() {
  if (!model) return;
  try {
    let input;
    if (mode === 'image') input = mediaElement;
    else if (mode === 'video') input = videoElement;
    else if (mode === 'camera') input = cameraElement;
    const predictions = await model.classify(input);
    displayPredictions(predictions);
  } catch (error) {
    predictionsElement.innerHTML = `<div class="error">Error al clasificar: ${error.message}</div>`;
  }
}

async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    cameraElement.srcObject = stream;
    cameraElement.onloadedmetadata = () => {
      cameraElement.play();
      videoInterval = setInterval(() => classifyFrame(), 1000);
    };
  } catch (err) {
    predictionsElement.innerHTML = `<div class="error">No se pudo acceder a la cámara: ${err.message}</div>`;
  }
}

function setMode(newMode) {
  mode = newMode;

  imageTabBtn.classList.toggle('active', mode === 'image');
  videoTabBtn.classList.toggle('active', mode === 'video');
  cameraTabBtn.classList.toggle('active', mode === 'camera');

  mediaElement.style.display = mode === 'image' ? 'block' : 'none';
  videoElement.style.display = mode === 'video' ? 'block' : 'none';
  cameraElement.style.display = mode === 'camera' ? 'block' : 'none';

  imageUrlContainer.style.display = mode === 'image' ? 'block' : 'none';
  videoUrlContainer.style.display = mode === 'video' ? 'block' : 'none';

  if (videoInterval) clearInterval(videoInterval);

  predictionsElement.innerHTML = `<div class="loading">Modo ${mode} activado. Cargando...</div>`;

  if (mode === 'camera') startCamera();
}

function startVideoClassification() {
  if (videoInterval) clearInterval(videoInterval);
  videoInterval = setInterval(() => classifyFrame(), 1000);
}

function loadVideoFromUrl(url) {
  if (!url) return;
  try {
    new URL(url);
    videoElement.src = url;
    predictionsElement.innerHTML = 'Cargando video desde URL...';

    videoElement.onerror = () => {
      predictionsElement.innerHTML = 'Error al cargar el video. Verifica la URL.';
    };

    videoElement.onloadeddata = () => {
      videoElement.play();
      startVideoClassification();
    };
  } catch {
    predictionsElement.innerHTML = 'URL inválida.';
  }
}

function loadImageFromUrl(url) {
  if (!url) return;
  try {
    new URL(url);
    mediaElement.src = url;
    predictionsElement.innerHTML = 'Cargando imagen desde URL...';
  } catch {
    predictionsElement.innerHTML = 'URL inválida.';
  }
}

// Eventos
loadSampleBtn.addEventListener('click', () => {
  if (mode === 'image') {
    mediaElement.src = './assets/gato.webp';
  } else if (mode === 'video') {
    videoElement.src = './assets/video-prueba.mp4';
    videoElement.play();
    startVideoClassification();
  }
});

uploadBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    if (mode === 'image') {
      mediaElement.src = event.target.result;
    } else if (mode === 'video') {
      videoElement.src = event.target.result;
      videoElement.play();
      startVideoClassification();
    }
  };
  reader.readAsDataURL(file);
});

loadUrlBtn.addEventListener('click', () => {
  const url = videoUrlInput.value.trim();
  loadVideoFromUrl(url);
});

videoUrlInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    loadVideoFromUrl(videoUrlInput.value.trim());
  }
});

loadImageUrlBtn.addEventListener('click', () => {
  const url = imageUrlInput.value.trim();
  loadImageFromUrl(url);
});

imageUrlInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    loadImageFromUrl(imageUrlInput.value.trim());
  }
});

imageTabBtn.addEventListener('click', () => setMode('image'));
videoTabBtn.addEventListener('click', () => setMode('video'));
cameraTabBtn.addEventListener('click', () => setMode('camera'));

mediaElement.addEventListener('load', () => {
  if (mode === 'image') classifyFrame();
});

videoElement.addEventListener('play', () => {
  if (mode === 'video') startVideoClassification();
});

document.addEventListener('DOMContentLoaded', () => {
  if (typeof tf !== 'undefined' && typeof mobilenet !== 'undefined') {
    loadModel();
  } else {
    predictionsElement.innerHTML = '<div class="error">Error: TensorFlow.js no se cargó correctamente</div>';
  }

  setMode('image');
});
