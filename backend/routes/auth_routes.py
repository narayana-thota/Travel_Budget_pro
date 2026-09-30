from flask import Blueprint, request, jsonify, session
from werkzeug.security import generate_password_hash,check_password_hash
from config.database import get_db_connection

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/api/me", methods=["GET"])
def get_current_user():

    user_id = session.get("user_id")

    if not user_id:
        return jsonify({
            "status": "error",
            "message": "User is not logged in."
        }), 401

    return jsonify({
        "status": "success",
        "message": "User is logged in.",
        "user": {
            "id": session.get("user_id"),
            "full_name": session.get("full_name"),
            "email": session.get("email")
        }
    }), 200

@auth_bp.route("/api/register", methods=["POST"])
def register():
    try:
        # Get JSON data from request
        data = request.get_json()

        if not data:
            return jsonify({
                "status": "error",
                "message": "Request body is required."
            }), 400

        full_name = data.get("full_name", "").strip()
        email = data.get("email", "").strip().lower()
        password = data.get("password", "")

        # Validate required fields
        if not full_name or not email or not password:
            return jsonify({
                "status": "error",
                "message": "Full name, email and password are required."
            }), 400

        # Basic password validation
        if len(password) < 6:
            return jsonify({
                "status": "error",
                "message": "Password must contain at least 6 characters."
            }), 400

        connection = get_db_connection()
        cursor = connection.cursor()

        # Check whether email already exists
        cursor.execute(
            "SELECT id FROM users WHERE email = %s",
            (email,)
        )

        existing_user = cursor.fetchone()

        if existing_user:
            cursor.close()
            connection.close()

            return jsonify({
                "status": "error",
                "message": "Email is already registered."
            }), 409

        # Hash password
        password_hash = generate_password_hash(password)

        # Insert user
        cursor.execute(
            """
            INSERT INTO users
                (full_name, email, password_hash)
            VALUES
                (%s, %s, %s)
            """,
            (full_name, email, password_hash)
        )

        connection.commit()

        user_id = cursor.lastrowid

        cursor.close()
        connection.close()

        return jsonify({
            "status": "success",
            "message": "Registration successful!",
            "user_id": user_id
        }), 201

    except Exception as e:
        # 🟢 THESE LINES ARE NOW CORRECTLY INDENTED BY 4 SPACES
        print("REGISTRATION ERROR:")
        print(type(e).__name__)
        print(str(e))

        return jsonify({
            "status": "error",
            "message": "Registration failed.",
            "error": str(e)
        }), 500
@auth_bp.route("/api/login", methods=["POST"])

def login():

    try:
        # Get JSON data from request
        data = request.get_json()

        if not data:
            return jsonify({
                "status": "error",
                "message": "Request body is required."
            }), 400

        email = data.get("email", "").strip().lower()
        password = data.get("password", "")

        # Validate required fields
        if not email or not password:
            return jsonify({
                "status": "error",
                "message": "Email and password are required."
            }), 400

        # Connect to database
        connection = get_db_connection()
        cursor = connection.cursor()

        # Find user by email
        cursor.execute(
            """
            SELECT id, full_name, email, password_hash
            FROM users
            WHERE email = %s
            """,
            (email,)
        )

        user = cursor.fetchone()

        # Close database connection
        cursor.close()
        connection.close()

        # User doesn't exist
        if not user:
            return jsonify({
                "status": "error",
                "message": "Invalid email or password."
            }), 401

        user_id = user[0]
        full_name = user[1]
        user_email = user[2]
        stored_password_hash = user[3]

        session.permanent = True
        session["user_id"] = user_id
        session["full_name"] = full_name
        session["email"] = user_email

        # Check password
        password_is_correct = check_password_hash(
            stored_password_hash,
            password
        )

        if not password_is_correct:
            return jsonify({
                "status": "error",
                "message": "Invalid email or password."
            }), 401

        # Login successful
        return jsonify({
            "status": "success",
            "message": "Login successful!",
            "user": {
                "id": user_id,
                "full_name": full_name,
                "email": user_email
            }
        }), 200

    except Exception as e:

        print("LOGIN ERROR:")
        print(type(e).__name__)
        print(str(e))

        return jsonify({
            "status": "error",
            "message": "Login failed.",
            "error": str(e)
        }), 500
@auth_bp.route("/api/logout", methods=["POST"])

def logout():

    session.clear()

    return jsonify({
        "status": "success",
        "message": "Logout successful!"
    }), 200
