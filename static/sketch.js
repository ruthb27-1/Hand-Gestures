const URL = "https://teachablemachine.withgoogle.com/models/EH7ULWjfW/";
const predictSound = new Audio("/static/sounds/click.mp3");

let model, webcam;
let cameraStarted = false;

const gestureMap = {
  "Thumbs Up": "/static/hands/thumbs-up.png",
  "Thumbs Down": "/static/hands/thumbs-down.png",
  "Peace Sign": "/static/hands/peace.png",
  "Fist": "/static/hands/fist.png",
  "Open Hand": "/static/hands/open.png"
};

const responseMap = {
  "Thumbs Up": "Nice! 👍 Approval detected.",
  "Thumbs Down": "👎 Disapproval detected.",
  "Peace Sign": "✌️ Peace gesture recognized.",
  "Fist": "✊ Strong gesture.",
  "Open Hand": "✋ Open hand detected."
};

const glowMap = {
  "Thumbs Up": "#22c55e",
  "Thumbs Down": "#ef4444",
  "Peace Sign": "#a855f7",
  "Fist": "#f59e0b",
  "Open Hand": "#3b82f6"
};

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("startBtn").addEventListener("click", initCamera);
  document.getElementById("predictBtn").addEventListener("click", predictOnce);
  document.getElementById("resetBtn").addEventListener("click", resetPrediction);

  document.getElementById("openModal").onclick = () => {
    document.getElementById("gestureModal").classList.add("show");
  };

  document.getElementById("closeModal").onclick = () => {
    document.getElementById("gestureModal").classList.remove("show");
  };

  document.getElementById("openInfo").onclick = () => {
    document.getElementById("infoBox").classList.add("show");
  };

  document.getElementById("closeInfo").onclick = () => {
    document.getElementById("infoBox").classList.remove("show");
  };

  window.onclick = (e) => {
    const gestureModal = document.getElementById("gestureModal");
    const infoBox = document.getElementById("infoBox");

    if (e.target === gestureModal) {
      gestureModal.classList.remove("show");
    }

    if (e.target === infoBox) {
      infoBox.classList.remove("show");
    }
  };
});

async function initCamera() {
  const status = document.getElementById("status");

  if (cameraStarted) {
    status.textContent = "Camera is already running.";
    return;
  }

  try {
    status.textContent = "Loading model...";
    model = await tmImage.load(URL + "model.json", URL + "metadata.json");

    status.textContent = "Starting camera...";
    webcam = new tmImage.Webcam(350, 280, true);
    await webcam.setup();
    await webcam.play();

    const webcamContainer = document.getElementById("webcam-container");
    webcamContainer.innerHTML = "";
    webcamContainer.appendChild(webcam.canvas);

    cameraStarted = true;
    status.textContent = "Camera ready. Hold up a gesture, then click Predict.";

    updateCamera();
  } catch (err) {
    console.error(err);
    status.textContent = "Error loading model.";
  }
}

function updateCamera() {
  if (!cameraStarted) return;
  webcam.update();
  window.requestAnimationFrame(updateCamera);
}

async function predictOnce() {
  const status = document.getElementById("status");
  const predictionBox = document.getElementById("prediction");

  if (!cameraStarted || !model || !webcam) {
    status.textContent = "Start the camera first.";
    return;
  }

  try {
    status.textContent = "Predicting...";
    predictionBox.textContent = "🤖 Thinking...";
    predictionBox.classList.add("thinking");
    predictionBox.style.boxShadow = "none";

    try {
      predictSound.currentTime = 0;
      predictSound.play();
    } catch (e) {
      console.log("Sound could not play.");
    }

    const prediction = await model.predict(webcam.canvas);

    let best = prediction[0];
    for (let i = 1; i < prediction.length; i++) {
      if (prediction[i].probability > best.probability) {
        best = prediction[i];
      }
    }

    const label = best.className.trim();
    console.log("LABEL:", label);

    const confidence = best.probability;
    const img = gestureMap[label];
    const response = responseMap[label] || `Prediction: ${label}`;
    const glowColor = glowMap[label] || "#3b82f6";

    if (confidence < 0.75) {
      predictionBox.textContent = "Show your hand more clearly 👋";
      predictionBox.style.boxShadow = "0 0 20px rgba(148,163,184,0.35)";
      predictionBox.classList.remove("thinking");
      status.textContent = "Prediction too uncertain. Try again.";
      return;
    }

    if (img) {
      predictionBox.innerHTML = `<img src="${img}" style="width:170px;">`;
    } else {
      predictionBox.textContent = label;
    }

    predictionBox.style.boxShadow = `0 0 28px ${glowColor}`;
    predictionBox.classList.remove("thinking");
    status.textContent = response;
  } catch (err) {
    console.error(err);
    status.textContent = "Prediction failed.";
    predictionBox.classList.remove("thinking");
  }
}

function resetPrediction() {
  const predictionBox = document.getElementById("prediction");
  predictionBox.textContent = "🤖 Waiting...";
  predictionBox.style.boxShadow = "none";
  predictionBox.classList.remove("thinking");

  document.getElementById("status").textContent =
    "Ready for another try. Hold up a gesture and click Predict.";
}