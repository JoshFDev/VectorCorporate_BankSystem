from flask import Flask, jsonify, request
from flask_cors import CORS
from pyfingerprint.pyfingerprint import PyFingerprint
import threading
import time

app = Flask(__name__)
CORS(app)

PUERTO_SENSOR = "COM3"
BAUDRATE = 57600

sensor = None
sensor_lock = threading.Lock()


def conectar_sensor():
    global sensor
    try:
        sensor = PyFingerprint(PUERTO_SENSOR, BAUDRATE, 0xFFFFFFFF, 0x00000000)
        if sensor.verifyPassword():
            return True
        return False
    except Exception as e:
        print(f"Error sensor: {e}")
        return False


@app.route("/status", methods=["GET"])
def status():
    if sensor is None:
        ok = conectar_sensor()
        if not ok:
            return jsonify({"connected": False, "error": "Sensor no detectado en " + PUERTO_SENSOR})
    try:
        return jsonify({"connected": True, "port": PUERTO_SENSOR, "templates": sensor.getTemplateCount()})
    except Exception as e:
        return jsonify({"connected": False, "error": str(e)})


@app.route("/identify", methods=["POST"])
def identify():
    with sensor_lock:
        if sensor is None:
            if not conectar_sensor():
                return jsonify({"error": "Sensor no conectado"}), 503

        try:
            timeout = 10
            start = time.time()
            while not sensor.readImage():
                if time.time() - start > timeout:
                    return jsonify({"error": "Tiempo agotado. Coloca tu dedo en el sensor."}), 408
                time.sleep(0.1)

            sensor.convertImage(0x01)

            result = sensor.searchTemplate()
            position = result[0]
            accuracy = result[1]

            if position < 0:
                return jsonify({"found": False, "error": "Huella no encontrada en el sensor"})

            return jsonify({"found": True, "position": position, "accuracy": accuracy})
        except Exception as e:
            return jsonify({"error": str(e)}), 500


@app.route("/delete-template/<int:position>", methods=["DELETE"])
def delete_template(position):
    with sensor_lock:
        if sensor is None:
            if not conectar_sensor():
                return jsonify({"error": "Sensor no conectado"}), 503
        try:
            deleted = sensor.deleteTemplate(position)
            return jsonify({"deleted": deleted, "position": position})
        except Exception as e:
            return jsonify({"error": str(e)}), 500


@app.route("/delete-all", methods=["DELETE"])
def delete_all():
    with sensor_lock:
        if sensor is None:
            if not conectar_sensor():
                return jsonify({"error": "Sensor no conectado"}), 503
        try:
            count = 0
            while sensor.getTemplateCount() > 0:
                sensor.deleteTemplate(0)
                count += 1
            return jsonify({"deleted": count})
        except Exception as e:
            return jsonify({"error": str(e)}), 500


@app.route("/register-scan", methods=["POST"])
def register_scan():
    with sensor_lock:
        if sensor is None:
            if not conectar_sensor():
                return jsonify({"error": "Sensor no conectado"}), 503

        try:
            timeout = 10
            start = time.time()
            while not sensor.readImage():
                if time.time() - start > timeout:
                    return jsonify({"error": "Tiempo agotado. Coloca tu dedo en el sensor."}), 408
                time.sleep(0.1)

            sensor.convertImage(0x01)

            return jsonify({"ok": True, "message": "Primer escaneo capturado"})
        except Exception as e:
            return jsonify({"error": str(e)}), 500


@app.route("/register-confirm", methods=["POST"])
def register_confirm():
    with sensor_lock:
        if sensor is None:
            if not conectar_sensor():
                return jsonify({"error": "Sensor no conectado"}), 503

        try:
            timeout = 10
            start = time.time()
            while not sensor.readImage():
                if time.time() - start > timeout:
                    return jsonify({"error": "Tiempo agotado. Coloca tu dedo de nuevo."}), 408
                time.sleep(0.1)

            sensor.convertImage(0x02)

            match_result = sensor.compareCharacteristics()
            if match_result == 0:
                return jsonify({"match": False, "error": "Las huellas no coinciden. Intenta de nuevo."})

            sensor.createTemplate()
            pos = sensor.storeTemplate()

            return jsonify({"match": True, "position": pos})
        except Exception as e:
            return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    print("Conectando sensor...")
    if conectar_sensor():
        print(f"Sensor listo en {PUERTO_SENSOR}")
    else:
        print(f"ADVERTENCIA: Sensor no encontrado en {PUERTO_SENSOR}.")
    app.run(host="127.0.0.1", port=5000, debug=False)
