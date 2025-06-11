// Elementos del DOM
const imgElement = document.getElementById('img');
const predictionsElement = document.getElementById('predictions');
const loadSampleBtn = document.getElementById('load-sample');
const uploadBtn = document.getElementById('upload-btn');
const fileInput = document.getElementById('file-input');

// Configuración del modelo
const modelConfig = {
  version: 2,
  alpha: 1.0,
};

let model;

// Cargar el modelo
async function loadModel() {
  try {
    console.log('Cargando modelo MobileNet...');
    predictionsElement.innerHTML = '<div class="loading">Cargando modelo, por favor espere...</div>';
    
    // Cargar TensorFlow.js y el modelo
    model = await mobilenet.load(modelConfig);
    console.log('Modelo cargado correctamente');
    predictionsElement.innerHTML = '<div class="loading">Modelo listo. Procesando imagen...</div>';
    classifyImage();
  } catch (error) {
    console.error('Error al cargar el modelo:', error);
    predictionsElement.innerHTML = `<div class="error">Error al cargar el modelo: ${error.message}</div>`;
  }
}

// Clasificar la imagen
async function classifyImage() {
  if (!model || !imgElement.complete || !imgElement.naturalWidth) {
    return;
  }
  
  try {
    predictionsElement.innerHTML = '<div class="loading">Procesando imagen...</div>';
    
    // Realizar la clasificación
    const predictions = await model.classify(imgElement);
    console.log('Predicciones:', predictions);
    
    // Mostrar resultados
    displayPredictions(predictions);
  } catch (error) {
    console.error('Error al clasificar la imagen:', error);
    predictionsElement.innerHTML = `<div class="error">Error al clasificar la imagen: ${error.message}</div>`;
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

// Event Listeners
loadSampleBtn.addEventListener('click', () => {
  imgElement.src = 'gato.webp';
  predictionsElement.innerHTML = '<div class="loading">Cargando imagen de muestra...</div>';
});

uploadBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      imgElement.src = event.target.result;
      predictionsElement.innerHTML = '<div class="loading">Imagen cargada. Procesando...</div>';
    };
    reader.readAsDataURL(file);
  }
});

imgElement.addEventListener('load', classifyImage);

// Iniciar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  // Verificar si TensorFlow.js está cargado
  if (typeof tf !== 'undefined' && typeof mobilenet !== 'undefined') {
    loadModel();
  } else {
    predictionsElement.innerHTML = '<div class="error">Error: TensorFlow.js no se cargó correctamente</div>';
  }
});