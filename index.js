
const mediaElement = document.getElementById('media-element');
const videoElement = document.getElementById('video-element');
const predictionsElement = document.getElementById('predictions');
const loadSampleBtn = document.getElementById('load-sample');
const uploadBtn = document.getElementById('upload-btn');
const fileInput = document.getElementById('file-input');
const imageTabBtn = document.getElementById('image-tab');
const videoTabBtn = document.getElementById('video-tab');
const videoUrlContainer = document.getElementById('video-url-container');
const videoUrlInput = document.getElementById('video-url');
const loadUrlBtn = document.getElementById('load-url');
const imageUrlContainer = document.getElementById('image-url-container');
const imageUrlInput = document.getElementById('image-url');
const loadImageUrlBtn = document.getElementById('load-image-url');

const modelConfig = { version: 2, alpha: 1.0 };
let model;
let isVideoMode = false;
let videoInterval;

async function loadModel() {
    try {
        predictionsElement.innerHTML = '<div class="loading">Cargando modelo, por favor espere...</div>';
        model = await mobilenet.load(modelConfig);
        predictionsElement.innerHTML = '<div class="loading">Modelo listo. Seleccione un archivo o URL.</div>';
    } catch (error) {
        predictionsElement.innerHTML = `<div class="error">Error al cargar el modelo: ${error.message}</div>`;
    }
}

async function classifyFrame() {
    if (!model) return;
    try {
        const predictions = await model.classify(isVideoMode ? videoElement : mediaElement);
        displayPredictions(predictions);
    } catch (error) {
        predictionsElement.innerHTML = `<div class="error">Error al clasificar: ${error.message}</div>`;
    }
}

function displayPredictions(predictions) {
    predictionsElement.innerHTML = predictions.map(p => `
        <div class="prediction">
            <strong>${p.className}</strong> 
            <span>(${Math.round(p.probability * 100)}% de probabilidad)</span>
        </div>
    `).join('');
}

function setMode(videoMode) {
    isVideoMode = videoMode;
    imageTabBtn.classList.toggle('active', !videoMode);
    videoTabBtn.classList.toggle('active', videoMode);

    mediaElement.style.display = videoMode ? 'none' : 'block';
    videoElement.style.display = videoMode ? 'block' : 'none';
    videoUrlContainer.style.display = videoMode ? 'block' : 'none';
    imageUrlContainer.style.display = videoMode ? 'none' : 'block';

    if (videoInterval) clearInterval(videoInterval);
    predictionsElement.innerHTML = `<div class="loading">Seleccione un ${videoMode ? 'video' : 'imagen'} o ingrese una URL.</div>`;
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
        predictionsElement.innerHTML = '<div class="loading">Cargando video desde URL...</div>';

        videoElement.onerror = () => {
            predictionsElement.innerHTML = '<div class="error">Error al cargar el video. Verifica la URL.</div>';
        };

        videoElement.onloadeddata = () => {
            videoElement.play();
            startVideoClassification();
        };
    } catch (e) {
        predictionsElement.innerHTML = '<div class="error">URL inválida. Ingresa una URL completa.</div>';
    }
}

function loadImageFromUrl(url) {
    if (!url) return;
    try {
        new URL(url);
        mediaElement.src = url;
        predictionsElement.innerHTML = '<div class="loading">Cargando imagen desde URL...</div>';
    } catch (e) {
        predictionsElement.innerHTML = '<div class="error">URL inválida. Ingresa una URL completa.</div>';
    }
}

loadSampleBtn.addEventListener('click', () => {
    if (isVideoMode) {
        videoElement.src = './assets/video-prueba.mp4';
        videoElement.play();
        predictionsElement.innerHTML = '<div class="loading">Cargando video de muestra...</div>';
        startVideoClassification();
    } else {
        mediaElement.src = './assets/gato.webp';
        predictionsElement.innerHTML = '<div class="loading">Cargando imagen de muestra...</div>';
    }
});

uploadBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        if (isVideoMode) {
            videoElement.src = event.target.result;
            videoElement.play();
            predictionsElement.innerHTML = '<div class="loading">Video cargado. Procesando...</div>';
            startVideoClassification();
        } else {
            mediaElement.src = event.target.result;
            predictionsElement.innerHTML = '<div class="loading">Imagen cargada. Procesando...</div>';
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

imageTabBtn.addEventListener('click', () => setMode(false));
videoTabBtn.addEventListener('click', () => setMode(true));

mediaElement.addEventListener('load', () => {
    if (!isVideoMode) classifyFrame();
});

videoElement.addEventListener('play', () => {
    if (isVideoMode) startVideoClassification();
});

document.addEventListener('DOMContentLoaded', () => {
    if (typeof tf !== 'undefined' && typeof mobilenet !== 'undefined') {
        loadModel();
    } else {
        predictionsElement.innerHTML = '<div class="error">Error: TensorFlow.js no se cargó correctamente</div>';
    }

    setMode(false);
});
