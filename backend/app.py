import os

from datetime import timedelta

from flask import Flask, jsonify
from dotenv import load_dotenv

from config.database import get_db_connection
from routes.auth_routes import auth_bp


load_dotenv()

app = Flask(__name__)

# Flask session configuration
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(minutes=30)


# Register authentication routes
app.register_blueprint(auth_bp)


@app.route("/")
def home():
    return jsonify({
        "message": "Travel Budget Pro API is running!"
    })


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


if __name__ == "__main__":
    app.run(debug=True)