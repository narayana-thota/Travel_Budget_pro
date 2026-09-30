from flask import Blueprint, request, jsonify, session
from config.database import get_db_connection


trip_bp = Blueprint("trip", __name__)


@trip_bp.route("/api/trips", methods=["POST"])
def create_trip():

    try:
        # Check whether user is logged in
        user_id = session.get("user_id")

        if not user_id:
            return jsonify({
                "status": "error",
                "message": "User is not logged in."
            }), 401

        # Get JSON data
        data = request.get_json()

        if not data:
            return jsonify({
                "status": "error",
                "message": "Request body is required."
            }), 400

        # Read trip details
        trip_name = data.get("trip_name", "").strip()
        source = data.get("source", "").strip()
        destination = data.get("destination", "").strip()
        start_date = data.get("start_date", "")
        end_date = data.get("end_date", "")
        travelers = data.get("travelers")
        total_budget = data.get("total_budget")

        # Validate required fields
        if not trip_name or not source or not destination:
            return jsonify({
                "status": "error",
                "message": "Trip name, source and destination are required."
            }), 400

        if not start_date or not end_date:
            return jsonify({
                "status": "error",
                "message": "Start date and end date are required."
            }), 400

        if travelers is None or total_budget is None:
            return jsonify({
                "status": "error",
                "message": "Travelers and total budget are required."
            }), 400

        # Validate travelers
        try:
            travelers = int(travelers)

            if travelers <= 0:
                return jsonify({
                    "status": "error",
                    "message": "Travelers must be greater than 0."
                }), 400

        except (ValueError, TypeError):

            return jsonify({
                "status": "error",
                "message": "Travelers must be a valid number."
            }), 400

        # Validate budget
        try:
            total_budget = float(total_budget)

            if total_budget < 0:
                return jsonify({
                    "status": "error",
                    "message": "Total budget cannot be negative."
                }), 400

        except (ValueError, TypeError):

            return jsonify({
                "status": "error",
                "message": "Total budget must be a valid number."
            }), 400

        # Connect to database
        connection = get_db_connection()
        cursor = connection.cursor()

        # Insert trip
        cursor.execute(
            """
            INSERT INTO trips
                (
                    user_id,
                    trip_name,
                    source,
                    destination,
                    start_date,
                    end_date,
                    travelers,
                    total_budget
                )
            VALUES
                (%s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                user_id,
                trip_name,
                source,
                destination,
                start_date,
                end_date,
                travelers,
                total_budget
            )
        )

        connection.commit()

        trip_id = cursor.lastrowid

        cursor.close()
        connection.close()

        return jsonify({
            "status": "success",
            "message": "Trip created successfully!",
            "trip": {
                "id": trip_id,
                "user_id": user_id,
                "trip_name": trip_name,
                "source": source,
                "destination": destination,
                "start_date": start_date,
                "end_date": end_date,
                "travelers": travelers,
                "total_budget": total_budget,
                "status": "Planned"
            }
        }), 201

    except Exception as e:

        print("CREATE TRIP ERROR:")
        print(type(e).__name__)
        print(str(e))

        return jsonify({
            "status": "error",
            "message": "Trip creation failed.",
            "error": str(e)
        }), 500
@trip_bp.route("/api/trips", methods=["GET"])
def get_trips():

    try:
        # Check whether user is logged in
        user_id = session.get("user_id")

        if not user_id:
            return jsonify({
                "status": "error",
                "message": "User is not logged in."
            }), 401

        # Connect to database
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Get only this user's trips
        cursor.execute(
            """
            SELECT
                id,
                trip_name,
                source,
                destination,
                start_date,
                end_date,
                travelers,
                total_budget,
                status,
                created_at,
                updated_at
            FROM trips
            WHERE user_id = %s
            ORDER BY created_at DESC
            """,
            (user_id,)
        )

        trips = cursor.fetchall()

        cursor.close()
        connection.close()

        return jsonify({
            "status": "success",
            "message": "Trips retrieved successfully!",
            "trips": trips
        }), 200

    except Exception as e:

        print("GET TRIPS ERROR:")
        print(type(e).__name__)
        print(str(e))

        return jsonify({
            "status": "error",
            "message": "Failed to retrieve trips.",
            "error": str(e)
        }), 500
@trip_bp.route("/api/trips/<int:trip_id>", methods=["GET"])
def get_trip(trip_id):

    try:
        # Check whether user is logged in
        user_id = session.get("user_id")

        if not user_id:
            return jsonify({
                "status": "error",
                "message": "User is not logged in."
            }), 401

        # Connect to database
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Get the requested trip belonging to the logged-in user
        cursor.execute(
            """
            SELECT
                id,
                trip_name,
                source,
                destination,
                start_date,
                end_date,
                travelers,
                total_budget,
                status,
                created_at,
                updated_at
            FROM trips
            WHERE id = %s
              AND user_id = %s
            """,
            (trip_id, user_id)
        )

        trip = cursor.fetchone()

        cursor.close()
        connection.close()

        # Trip not found
        if not trip:
            return jsonify({
                "status": "error",
                "message": "Trip not found."
            }), 404

        return jsonify({
            "status": "success",
            "message": "Trip details retrieved successfully!",
            "trip": trip
        }), 200

    except Exception as e:

        print("GET TRIP ERROR:")
        print(type(e).__name__)
        print(str(e))

        return jsonify({
            "status": "error",
            "message": "Failed to retrieve trip.",
            "error": str(e)
        }), 500
@trip_bp.route("/api/trips/<int:trip_id>", methods=["PUT"])
def update_trip(trip_id):

    try:
        # Check whether user is logged in
        user_id = session.get("user_id")

        if not user_id:
            return jsonify({
                "status": "error",
                "message": "User is not logged in."
            }), 401

        # Get JSON data
        data = request.get_json()

        if not data:
            return jsonify({
                "status": "error",
                "message": "Request body is required."
            }), 400

        # Read updated trip details
        trip_name = data.get("trip_name", "").strip()
        source = data.get("source", "").strip()
        destination = data.get("destination", "").strip()
        start_date = data.get("start_date", "")
        end_date = data.get("end_date", "")
        travelers = data.get("travelers")
        total_budget = data.get("total_budget")

        # Validate required fields
        if not trip_name or not source or not destination:
            return jsonify({
                "status": "error",
                "message": "Trip name, source and destination are required."
            }), 400

        if not start_date or not end_date:
            return jsonify({
                "status": "error",
                "message": "Start date and end date are required."
            }), 400

        if travelers is None or total_budget is None:
            return jsonify({
                "status": "error",
                "message": "Travelers and total budget are required."
            }), 400

        try:
            travelers = int(travelers)

            if travelers <= 0:
                return jsonify({
                    "status": "error",
                    "message": "Travelers must be greater than 0."
                }), 400

        except (ValueError, TypeError):

            return jsonify({
                "status": "error",
                "message": "Travelers must be a valid number."
            }), 400

        try:
            total_budget = float(total_budget)

            if total_budget < 0:
                return jsonify({
                    "status": "error",
                    "message": "Total budget cannot be negative."
                }), 400

        except (ValueError, TypeError):

            return jsonify({
                "status": "error",
                "message": "Total budget must be a valid number."
            }), 400

        # Connect to database
        connection = get_db_connection()
        cursor = connection.cursor()

        # Update only the logged-in user's trip
        cursor.execute(
            """
            UPDATE trips
            SET
                trip_name = %s,
                source = %s,
                destination = %s,
                start_date = %s,
                end_date = %s,
                travelers = %s,
                total_budget = %s
            WHERE id = %s
              AND user_id = %s
            """,
            (
                trip_name,
                source,
                destination,
                start_date,
                end_date,
                travelers,
                total_budget,
                trip_id,
                user_id
            )
        )

        connection.commit()

        rows_updated = cursor.rowcount

        cursor.close()
        connection.close()

        if rows_updated == 0:
            return jsonify({
                "status": "error",
                "message": "Trip not found."
            }), 404

        return jsonify({
            "status": "success",
            "message": "Trip updated successfully!",
            "trip_id": trip_id
        }), 200

    except Exception as e:

        print("UPDATE TRIP ERROR:")
        print(type(e).__name__)
        print(str(e))

        return jsonify({
            "status": "error",
            "message": "Trip update failed.",
            "error": str(e)
        }), 500
@trip_bp.route("/api/trips/<int:trip_id>", methods=["DELETE"])
def delete_trip(trip_id):

    try:
        # Check whether user is logged in
        user_id = session.get("user_id")

        if not user_id:
            return jsonify({
                "status": "error",
                "message": "User is not logged in."
            }), 401

        # Connect to database
        connection = get_db_connection()
        cursor = connection.cursor()

        # Delete only the logged-in user's trip
        cursor.execute(
            """
            DELETE FROM trips
            WHERE id = %s
              AND user_id = %s
            """,
            (trip_id, user_id)
        )

        connection.commit()

        rows_deleted = cursor.rowcount

        cursor.close()
        connection.close()

        if rows_deleted == 0:
            return jsonify({
                "status": "error",
                "message": "Trip not found."
            }), 404

        return jsonify({
            "status": "success",
            "message": "Trip deleted successfully!",
            "trip_id": trip_id
        }), 200

    except Exception as e:

        print("DELETE TRIP ERROR:")
        print(type(e).__name__)
        print(str(e))

        return jsonify({
            "status": "error",
            "message": "Trip deletion failed.",
            "error": str(e)
        }), 500
@trip_bp.route("/api/trips/<int:trip_id>/expenses", methods=["POST"])
def add_expense(trip_id):

    try:
        # Check whether user is logged in
        user_id = session.get("user_id")

        if not user_id:
            return jsonify({
                "status": "error",
                "message": "User is not logged in."
            }), 401

        # Get request data
        data = request.get_json()

        if not data:
            return jsonify({
                "status": "error",
                "message": "Request body is required."
            }), 400

        category_id = data.get("category_id")
        expense_name = data.get("expense_name", "").strip()
        amount = data.get("amount")
        expense_date = data.get("expense_date")
        expense_type = data.get("expense_type", "Planned")
        description = data.get("description", "").strip()

        # Validate required fields
        if category_id is None or not expense_name or amount is None or not expense_date:
            return jsonify({
                "status": "error",
                "message": "Category, expense name, amount and expense date are required."
            }), 400

        # Validate expense type
        if expense_type not in ["Planned", "Actual"]:
            return jsonify({
                "status": "error",
                "message": "Expense type must be Planned or Actual."
            }), 400

        # Validate amount
        try:
            amount = float(amount)

            if amount < 0:
                return jsonify({
                    "status": "error",
                    "message": "Expense amount cannot be negative."
                }), 400

        except (ValueError, TypeError):

            return jsonify({
                "status": "error",
                "message": "Amount must be a valid number."
            }), 400

        # Connect to database
        connection = get_db_connection()
        cursor = connection.cursor()

        # Check whether trip belongs to logged-in user
        cursor.execute(
            """
            SELECT id
            FROM trips
            WHERE id = %s
              AND user_id = %s
            """,
            (trip_id, user_id)
        )

        trip = cursor.fetchone()

        if not trip:
            cursor.close()
            connection.close()

            return jsonify({
                "status": "error",
                "message": "Trip not found."
            }), 404

        # Check whether category exists
        cursor.execute(
            """
            SELECT id
            FROM expense_categories
            WHERE id = %s
            """,
            (category_id,)
        )

        category = cursor.fetchone()

        if not category:
            cursor.close()
            connection.close()

            return jsonify({
                "status": "error",
                "message": "Expense category not found."
            }), 404

        # Insert expense
        cursor.execute(
            """
            INSERT INTO expenses
            (
                trip_id,
                category_id,
                expense_name,
                amount,
                expense_date,
                expense_type,
                description
            )
            VALUES
            (%s, %s, %s, %s, %s, %s, %s)
            """,
            (
                trip_id,
                category_id,
                expense_name,
                amount,
                expense_date,
                expense_type,
                description
            )
        )

        connection.commit()

        expense_id = cursor.lastrowid

        cursor.close()
        connection.close()

        return jsonify({
            "status": "success",
            "message": "Expense added successfully!",
            "expense": {
                "id": expense_id,
                "trip_id": trip_id,
                "category_id": category_id,
                "expense_name": expense_name,
                "amount": amount,
                "expense_date": expense_date,
                "expense_type": expense_type,
                "description": description
            }
        }), 201

    except Exception as e:

        print("ADD EXPENSE ERROR:")
        print(type(e).__name__)
        print(str(e))

        return jsonify({
            "status": "error",
            "message": "Failed to add expense.",
            "error": str(e)
        }), 500
@trip_bp.route("/api/trips/<int:trip_id>/expenses", methods=["GET"])
def get_expenses(trip_id):

    try:
        user_id = session.get("user_id")

        if not user_id:
            return jsonify({
                "status": "error",
                "message": "User is not logged in."
            }), 401

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Make sure the trip belongs to the logged-in user
        cursor.execute(
            """
            SELECT id
            FROM trips
            WHERE id = %s
              AND user_id = %s
            """,
            (trip_id, user_id)
        )

        trip = cursor.fetchone()

        if not trip:
            cursor.close()
            connection.close()

            return jsonify({
                "status": "error",
                "message": "Trip not found."
            }), 404

        # Get expenses with category name
        cursor.execute(
            """
            SELECT
                e.id,
                e.trip_id,
                e.category_id,
                c.category_name,
                e.expense_name,
                e.amount,
                e.expense_date,
                e.expense_type,
                e.description,
                e.created_at,
                e.updated_at
            FROM expenses e
            JOIN expense_categories c
                ON e.category_id = c.id
            WHERE e.trip_id = %s
            ORDER BY e.expense_date ASC, e.id ASC
            """,
            (trip_id,)
        )

        expenses = cursor.fetchall()

        cursor.close()
        connection.close()

        return jsonify({
            "status": "success",
            "message": "Expenses retrieved successfully!",
            "expenses": expenses
        }), 200

    except Exception as e:

        print("GET EXPENSES ERROR:")
        print(type(e).__name__)
        print(str(e))

        return jsonify({
            "status": "error",
            "message": "Failed to retrieve expenses.",
            "error": str(e)
        }), 500
@trip_bp.route("/api/trips/<int:trip_id>/budget-summary", methods=["GET"])
def get_budget_summary(trip_id):

    try:
        # Check whether user is logged in
        user_id = session.get("user_id")

        if not user_id:
            return jsonify({
                "status": "error",
                "message": "User is not logged in."
            }), 401

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Get trip budget
        cursor.execute(
            """
            SELECT total_budget
            FROM trips
            WHERE id = %s
              AND user_id = %s
            """,
            (trip_id, user_id)
        )

        trip = cursor.fetchone()

        if not trip:
            cursor.close()
            connection.close()

            return jsonify({
                "status": "error",
                "message": "Trip not found."
            }), 404

        total_budget = float(trip["total_budget"])

        # Calculate planned expenses
        cursor.execute(
            """
            SELECT COALESCE(SUM(amount), 0) AS planned_expenses
            FROM expenses
            WHERE trip_id = %s
              AND expense_type = 'Planned'
            """,
            (trip_id,)
        )

        planned_result = cursor.fetchone()
        planned_expenses = float(planned_result["planned_expenses"])

        # Calculate actual expenses
        cursor.execute(
            """
            SELECT COALESCE(SUM(amount), 0) AS actual_expenses
            FROM expenses
            WHERE trip_id = %s
              AND expense_type = 'Actual'
            """,
            (trip_id,)
        )

        actual_result = cursor.fetchone()
        actual_expenses = float(actual_result["actual_expenses"])

        # Calculate total used
        total_expenses = planned_expenses + actual_expenses

        # Calculate remaining budget
        remaining_budget = total_budget - total_expenses

        # Calculate usage percentage
        if total_budget > 0:
            budget_usage_percentage = (
                total_expenses / total_budget
            ) * 100
        else:
            budget_usage_percentage = 0

        # Determine budget status
        if total_expenses > total_budget:
            budget_status = "Over Budget"
        else:
            budget_status = "Within Budget"

        cursor.close()
        connection.close()

        return jsonify({
            "status": "success",
            "message": "Budget summary retrieved successfully!",
            "budget": {
                "total_budget": total_budget,
                "planned_expenses": planned_expenses,
                "actual_expenses": actual_expenses,
                "total_expenses": total_expenses,
                "remaining_budget": remaining_budget,
                "budget_usage_percentage": round(
                    budget_usage_percentage, 2
                ),
                "status": budget_status
            }
        }), 200

    except Exception as e:

        print("BUDGET SUMMARY ERROR:")
        print(type(e).__name__)
        print(str(e))

        return jsonify({
            "status": "error",
            "message": "Failed to calculate budget summary.",
            "error": str(e)
        }), 500
@trip_bp.route("/api/expenses/<int:expense_id>", methods=["PUT"])
def update_expense(expense_id):

    try:
        user_id = session.get("user_id")

        if not user_id:
            return jsonify({
                "status": "error",
                "message": "User is not logged in."
            }), 401

        data = request.get_json()

        if not data:
            return jsonify({
                "status": "error",
                "message": "Request body is required."
            }), 400

        category_id = data.get("category_id")
        expense_name = data.get("expense_name", "").strip()
        amount = data.get("amount")
        expense_date = data.get("expense_date")
        expense_type = data.get("expense_type", "Planned")
        description = data.get("description", "").strip()

        if category_id is None or not expense_name or amount is None or not expense_date:
            return jsonify({
                "status": "error",
                "message": "Category, expense name, amount and expense date are required."
            }), 400

        if expense_type not in ["Planned", "Actual"]:
            return jsonify({
                "status": "error",
                "message": "Expense type must be Planned or Actual."
            }), 400

        try:
            amount = float(amount)

            if amount < 0:
                return jsonify({
                    "status": "error",
                    "message": "Amount cannot be negative."
                }), 400

        except (ValueError, TypeError):
            return jsonify({
                "status": "error",
                "message": "Amount must be a valid number."
            }), 400

        connection = get_db_connection()
        cursor = connection.cursor()

        # Make sure expense belongs to the logged-in user's trip
        cursor.execute(
            """
            SELECT e.id
            FROM expenses e
            JOIN trips t ON e.trip_id = t.id
            WHERE e.id = %s
              AND t.user_id = %s
            """,
            (expense_id, user_id)
        )

        expense = cursor.fetchone()

        if not expense:
            cursor.close()
            connection.close()

            return jsonify({
                "status": "error",
                "message": "Expense not found."
            }), 404

        # Check category
        cursor.execute(
            """
            SELECT id
            FROM expense_categories
            WHERE id = %s
            """,
            (category_id,)
        )

        category = cursor.fetchone()

        if not category:
            cursor.close()
            connection.close()

            return jsonify({
                "status": "error",
                "message": "Expense category not found."
            }), 404

        # Update expense
        cursor.execute(
            """
            UPDATE expenses
            SET
                category_id = %s,
                expense_name = %s,
                amount = %s,
                expense_date = %s,
                expense_type = %s,
                description = %s
            WHERE id = %s
            """,
            (
                category_id,
                expense_name,
                amount,
                expense_date,
                expense_type,
                description,
                expense_id
            )
        )

        connection.commit()

        cursor.close()
        connection.close()

        return jsonify({
            "status": "success",
            "message": "Expense updated successfully!",
            "expense_id": expense_id
        }), 200

    except Exception as e:

        print("UPDATE EXPENSE ERROR:")
        print(type(e).__name__)
        print(str(e))

        return jsonify({
            "status": "error",
            "message": "Failed to update expense.",
            "error": str(e)
        }), 500
@trip_bp.route("/api/expenses/<int:expense_id>", methods=["DELETE"])
def delete_expense(expense_id):
    try:
        user_id = session.get("user_id")

        if not user_id:
            return jsonify({
                "status": "error",
                "message": "User is not logged in."
            }), 401

        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute(
            """
            DELETE e
            FROM expenses e
            JOIN trips t ON e.trip_id = t.id
            WHERE e.id = %s
              AND t.user_id = %s
            """,
            (expense_id, user_id)
        )

        connection.commit()

        if cursor.rowcount == 0:
            cursor.close()
            connection.close()

            return jsonify({
                "status": "error",
                "message": "Expense not found."
            }), 404

        cursor.close()
        connection.close()

        return jsonify({
            "status": "success",
            "message": "Expense deleted successfully!",
            "expense_id": expense_id
        }), 200

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": "Failed to delete expense.",
            "error": str(e)
        }), 500