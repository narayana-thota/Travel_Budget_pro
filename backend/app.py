import os

from datetime import timedelta

from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

from config.database import get_db_connection
from routes.auth_routes import auth_bp
from routes.trip_routes import trip_bp


# Load environment variables from .env
load_dotenv()


# Create Flask application
app = Flask(__name__)


# --------------------------------------------------
# Flask Session Configuration
# --------------------------------------------------

app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")

app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(
    minutes=30
)

# Session cookie configuration
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SECURE"] = False
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"


# --------------------------------------------------
# CORS Configuration
# --------------------------------------------------

CORS(
    app,
    origins=["http://localhost:5173"],
    supports_credentials=True
)


# --------------------------------------------------
# Register Blueprints
# --------------------------------------------------

app.register_blueprint(auth_bp)
app.register_blueprint(trip_bp)


# --------------------------------------------------
# Home Route
# --------------------------------------------------

@app.route("/")
def home():

    return jsonify({
        "message": "Travel Budget Pro API is running!"
    })


# --------------------------------------------------
# Health Check Route
# --------------------------------------------------

@app.route("/api/health")
def health_check():

    try:

        connection = get_db_connection()

        if connection.is_connected():

            cursor = connection.cursor()

            cursor.execute("SELECT DATABASE();")

            database = cursor.fetchone()[0]

            cursor.close()
            connection.close()

            return jsonify({
                "status": "success",
                "message": "Flask API and database are connected!",
                "database": database
            })

    except Exception as e:

        return jsonify({
            "status": "error",
            "message": "Database connection failed",
            "error": str(e)
        }), 500


# --------------------------------------------------
# Run Flask Application
# --------------------------------------------------

if __name__ == "__main__":

    app.run(debug=True)