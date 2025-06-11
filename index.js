// Elementos del DOM
const mediaElement = document.getElementById('media-element');
const videoElement = document.getElementById('video-element');
const predictionsElement = document.getElementById('predictions');
const loadSampleBtn = document.getElementById('load-sample');
const uploadBtn = document.getElementById('upload-btn');
const fileInput = document.getElementById('file-input');
const imageTabBtn = document.getElementById('image-tab');
const videoTabBtn = document.getElementById('video-tab');

// Configuración del modelo
const modelConfig = {
    version: 2,
    alpha: 1.0,
};

let model;
let isVideoMode = false;
let videoInterval;

// Cargar el modelo
async function loadModel() {
    try {
        console.log('Cargando modelo MobileNet...');
        predictionsElement.innerHTML = '<div class="loading">Cargando modelo, por favor espere...</div>';
        
        model = await mobilenet.load(modelConfig);
        console.log('Modelo cargado correctamente');
        predictionsElement.innerHTML = '<div class="loading">Modelo listo. Seleccione un archivo.</div>';
    } catch (error) {
        console.error('Error al cargar el modelo:', error);
        predictionsElement.innerHTML = `<div class="error">Error al cargar el modelo: ${error.message}</div>`;
    }
}

// Clasificar el frame actual
async function classifyFrame() {
    if (!model) return;
    
    try {
        const predictions = await model.classify(isVideoMode ? videoElement : mediaElement);
        displayPredictions(predictions);
    } catch (error) {
        console.error('Error al clasificar:', error);
        predictionsElement.innerHTML = `<div class="error">Error al clasificar: ${error.message}</div>`;
    }
}

// Mostrar las predicciones
function displayPredictions(predictions) {
    predictionsElement.innerHTML = predictions
        .map(p => `
            <div class="prediction">
                <strong>${p.className}</strong> 
                <span>(${Math.round(p.probability * 100)}% de probabilidad)</span>
            </div>
        `)
        .join('');
}

// Cambiar entre modos imagen/video
function setMode(videoMode) {
    isVideoMode = videoMode;
    
    // Actualizar botones de pestaña
    imageTabBtn.classList.toggle('active', !videoMode);
    videoTabBtn.classList.toggle('active', videoMode);
    
    // Mostrar/ocultar elementos
    mediaElement.style.display = videoMode ? 'none' : 'block';
    videoElement.style.display = videoMode ? 'block' : 'none';
    
    // Detener cualquier intervalo de video existente
    if (videoInterval) {
        clearInterval(videoInterval);
        videoInterval = null;
    }
    
    // Si estamos en modo video y hay un video cargado, comenzar a clasificar
    if (videoMode && videoElement.src) {
        startVideoClassification();
    }
}

// Iniciar clasificación de video
function startVideoClassification() {
    if (videoInterval) clearInterval(videoInterval);
    
    videoInterval = setInterval(() => {
        classifyFrame();
    }, 1000); // Clasificar cada segundo
}

// Event Listeners
loadSampleBtn.addEventListener('click', () => {
    if (isVideoMode) {
        videoElement.src = './assets/video-prueba.mp4'; // Reemplaza con tu video de muestra
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
    
    if (isVideoMode) {
        reader.readAsDataURL(file);
    } else {
        reader.readAsDataURL(file);
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

// Iniciar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    if (typeof tf !== 'undefined' && typeof mobilenet !== 'undefined') {
        loadModel();
    } else {
        predictionsElement.innerHTML = '<div class="error">Error: TensorFlow.js no se cargó correctamente</div>';
    }
    
    // Establecer modo inicial
    setMode(false);
});