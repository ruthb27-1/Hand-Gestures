from flask import Flask, render_template, request, jsonify
import numpy as np
from tensorflow.keras.models import load_model
from PIL import Image
import base64
import io

app = Flask(__name__)

model = load_model("model/keras_model.h5")

with open("model/labels.txt", "r") as f:
    labels = [line.strip() for line in f.readlines()]

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/predict", methods=["POST"])
def predict():
    data = request.json["image"]

    image_data = base64.b64decode(data.split(",")[1])
    image = Image.open(io.BytesIO(image_data)).resize((224, 224))
    image = np.array(image) / 255.0
    image = image.reshape(1, 224, 224, 3)

    prediction = model.predict(image)
    index = np.argmax(prediction)

    return jsonify({"prediction": labels[index]})

if __name__ == "__main__":
    app.run(debug=True)