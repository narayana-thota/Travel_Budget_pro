import os

import requests

from datetime import datetime



from flask import Blueprint, request, jsonify, session

from dotenv import load_dotenv



from config.database import get_db_connection



load_dotenv()



trip_bp = Blueprint("trip", __name__)



# ============================================================

# CREATE TRIP

# ============================================================



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





# ============================================================

# GET ALL TRIPS

# ============================================================



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





# ============================================================

# GET SINGLE TRIP

# ============================================================



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



        # Get the requested trip belonging to logged-in user

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





# ============================================================

# UPDATE TRIP

# ============================================================



# ============================================================

# UPDATE TRIP

# ============================================================



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



        # ========================================================

        # STATUS UPDATE

        # ========================================================



        # Frontend can send:

        #

        # {

        #     "status": "Completed"

        # }

        #

        # without sending the other trip fields.



        if "status" in data:

            new_status = data.get("status")

            allowed_statuses = [
                "Planned",
                "Completed",
                "Cancelled"
            ]

            if new_status not in allowed_statuses:
                return jsonify({
                    "status": "error",
                    "message": "Invalid trip status."
                }), 400

            connection = None
            cursor = None

            try:
                connection = get_db_connection()
                cursor = connection.cursor()

                # Support older databases where the status ENUM
                # was created before "Cancelled" was added.
                cursor.execute(
                    "SHOW COLUMNS FROM trips LIKE 'status'"
                )

                status_column = cursor.fetchone()

                if status_column:
                    column_type = str(
                        status_column[1]
                    ).lower()

                    if (
                        column_type.startswith("enum(")
                        and "cancelled" not in column_type
                    ):
                        cursor.execute(
                            """
                            ALTER TABLE trips
                            MODIFY COLUMN status
                            ENUM(
                                'Planned',
                                'Completed',
                                'Cancelled'
                            )
                            NOT NULL
                            DEFAULT 'Planned'
                            """
                        )

                cursor.execute(
                    """
                    UPDATE trips
                    SET status = %s
                    WHERE id = %s
                      AND user_id = %s
                    """,
                    (
                        new_status,
                        trip_id,
                        user_id
                    )
                )

                rows_updated = cursor.rowcount

                if rows_updated == 0:
                    connection.rollback()

                    return jsonify({
                        "status": "error",
                        "message": "Trip not found."
                    }), 404

                connection.commit()

                return jsonify({
                    "status": "success",
                    "message": f"Trip marked as {new_status}.",
                    "trip_id": trip_id,
                    "trip_status": new_status
                }), 200

            except Exception as status_error:
                if connection:
                    connection.rollback()

                print("UPDATE TRIP STATUS ERROR:")
                print(
                    type(status_error).__name__
                )
                print(str(status_error))

                return jsonify({
                    "status": "error",
                    "message": "Failed to update trip status.",
                    "error": str(status_error)
                }), 500

            finally:
                if cursor:
                    cursor.close()

                if connection:
                    connection.close()


        # ========================================================

        # NORMAL TRIP UPDATE

        # ========================================================



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

                "message": (

                    "Trip name, source and destination "

                    "are required."

                )

            }), 400



        if not start_date or not end_date:

            return jsonify({

                "status": "error",

                "message": (

                    "Start date and end date are required."

                )

            }), 400



        if travelers is None or total_budget is None:

            return jsonify({

                "status": "error",

                "message": (

                    "Travelers and total budget are required."

                )

            }), 400



        # Validate travelers

        try:

            travelers = int(travelers)



            if travelers <= 0:

                return jsonify({

                    "status": "error",

                    "message": (

                        "Travelers must be greater than 0."

                    )

                }), 400



        except (ValueError, TypeError):

            return jsonify({

                "status": "error",

                "message": (

                    "Travelers must be a valid number."

                )

            }), 400



        # Validate budget

        try:

            total_budget = float(total_budget)



            if total_budget < 0:

                return jsonify({

                    "status": "error",

                    "message": (

                        "Total budget cannot be negative."

                    )

                }), 400



        except (ValueError, TypeError):

            return jsonify({

                "status": "error",

                "message": (

                    "Total budget must be a valid number."

                )

            }), 400



        # Connect to database

        connection = get_db_connection()

        cursor = connection.cursor()



        # Update only logged-in user's trip

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



# ============================================================

# DELETE TRIP

# ============================================================



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



        # Delete only logged-in user's trip

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





# ============================================================

# PLANTRIP API - ESTIMATE TRIP COST

# ============================================================



# ============================================================

# PLANTRIP API - ESTIMATE TRIP COST

# ============================================================



@trip_bp.route("/api/trips/<int:trip_id>/estimate", methods=["POST"])

def estimate_trip_cost(trip_id):



    connection = None

    cursor = None



    try:



        # ====================================================

        # 1. CHECK LOGIN

        # ====================================================



        user_id = session.get("user_id")



        if not user_id:

            return jsonify({

                "status": "error",

                "message": "User is not logged in."

            }), 401





        # ====================================================

        # 2. GET SELECTED PLAN

        # ====================================================



        data = request.get_json(silent=True) or {}



        plan = data.get("plan", "").strip().lower()



        plan_mapping = {

            "standard": "budget",

            "premium": "moderate",

            "ultra premium": "luxury"

        }



        if plan not in plan_mapping:

            return jsonify({

                "status": "error",

                "message": (

                    "Plan must be Standard, Premium, "

                    "or Ultra Premium."

                )

            }), 400



        budget_level = plan_mapping[plan]





        # ====================================================

        # 3. CONNECT TO MYSQL

        # ====================================================



        connection = get_db_connection()



        cursor = connection.cursor(dictionary=True)





        # ====================================================

        # 4. GET TRIP

        # ====================================================



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

                total_budget

            FROM trips

            WHERE id = %s

              AND user_id = %s

            """,

            (trip_id, user_id)

        )



        trip = cursor.fetchone()



        if not trip:



            return jsonify({

                "status": "error",

                "message": "Trip not found."

            }), 404





        # ====================================================

        # 5. CALCULATE NUMBER OF DAYS

        # ====================================================



        start_date = trip["start_date"]

        end_date = trip["end_date"]



        if isinstance(start_date, str):

            start_date = datetime.strptime(

                start_date,

                "%Y-%m-%d"

            ).date()



        if isinstance(end_date, str):

            end_date = datetime.strptime(

                end_date,

                "%Y-%m-%d"

            ).date()



        days = (end_date - start_date).days + 1



        if days <= 0:



            return jsonify({

                "status": "error",

                "message": "Invalid trip dates."

            }), 400





        # ====================================================

        # 6. GET PLANTRIP API KEY

        # ====================================================



        api_key = os.getenv("API_KEY")



        if not api_key:



            return jsonify({

                "status": "error",

                "message": "Plantrip API key is not configured."

            }), 500





        # ====================================================

        # 7. PLANTRIP API REQUEST

        # ====================================================



        plantrip_url = "https://plantrip.io/api/agent/execute"



        headers = {

            "X-API-Key": api_key,

            "Content-Type": "application/json"

        }



        payload = {

            "tool": "estimate_trip_cost",

            "arguments": {

                "destination": trip["destination"],

                "origin": trip["source"],

                "days": days,

                "travelers": trip["travelers"],

                "budget_level": budget_level

            }

        }





        print("\n==============================")

        print("PLANTRIP API REQUEST")

        print("==============================")

        print("Trip ID:", trip_id)

        print("Plan:", plan)

        print("API Budget Level:", budget_level)

        print("Destination:", trip["destination"])

        print("Origin:", trip["source"])

        print("Days:", days)

        print("Travelers:", trip["travelers"])

        print("==============================\n")





        api_response = requests.post(

            plantrip_url,

            headers=headers,

            json=payload,

            timeout=30

        )





        # ====================================================

        # 8. CHECK PLANTRIP HTTP RESPONSE

        # ====================================================



        if api_response.status_code != 200:



            print(

                "PLANTRIP STATUS:",

                api_response.status_code

            )



            print(

                "PLANTRIP RESPONSE:",

                api_response.text

            )



            return jsonify({

                "status": "error",

                "message": "Plantrip API request failed.",

                "api_status": api_response.status_code

            }), 502





        result = api_response.json()





        # ====================================================

        # 9. CHECK PLANTRIP SUCCESS

        # ====================================================



        if not result.get("success"):



            return jsonify({

                "status": "error",

                "message": "Plantrip could not generate an estimate.",

                "api_response": result

            }), 502





        # ====================================================

        # 10. CATEGORY MAPPING

        # ====================================================



        category_mapping = {



            "Getting There": "Travel",



            "Accommodations": "Hotel",



            "Food and Drink": "Food",



            "Transportation": "Local Transport",



            "Activities": "Activities",



            "Miscellaneous": "Other"



        }





        # ====================================================

        # 11. INITIALIZE APPLICATION CATEGORIES

        # ====================================================



        mapped_categories = {



            "Travel": {

                "estimated_amount": 0,

                "description": ""

            },



            "Hotel": {

                "estimated_amount": 0,

                "description": ""

            },



            "Food": {

                "estimated_amount": 0,

                "description": ""

            },



            "Shopping": {

                "estimated_amount": 0,

                "description":

                    "No shopping estimate provided by the API."

            },



            "Activities": {

                "estimated_amount": 0,

                "description": ""

            },



            "Local Transport": {

                "estimated_amount": 0,

                "description": ""

            },



            "Other": {

                "estimated_amount": 0,

                "description": ""

            }



        }





        # ====================================================

        # 12. CURRENCY PARSER

        # ====================================================



        def parse_currency(value):



            if value is None:

                return 0



            value = str(value)



            value = (

                value

                .replace("₹", "")

                .replace(",", "")

                .strip()

            )



            try:

                return float(value)



            except (ValueError, TypeError):

                return 0





        # ====================================================

        # 13. MAP PLANTRIP CATEGORIES

        # ====================================================



        categories = result.get("categories", [])



        for category in categories:



            api_category = category.get(

                "category_name"

            )



            application_category = category_mapping.get(

                api_category

            )



            if not application_category:

                continue





            amount = parse_currency(

                category.get("estimated_cost")

            )





            mapped_categories[application_category] = {



                "estimated_amount": amount,



                "description":

                    category.get("description") or ""



            }





        # ====================================================

        # 14. CALCULATE TOTAL

        # ====================================================



        estimated_total = sum(

            item["estimated_amount"]

            for item in mapped_categories.values()

        )





        total_budget = float(

            trip["total_budget"]

        )





        budget_difference = (

            total_budget - estimated_total

        )





        if budget_difference >= 0:

            budget_status = "Within Budget"



        else:

            budget_status = "Over Budget"





        # ====================================================

        # 15. CONVERT TO FRONTEND LIST

        # ====================================================



        estimates = []



        for category_name, category_data in (

            mapped_categories.items()

        ):



            estimates.append({



                "category": category_name,



                "estimated_amount":

                    category_data["estimated_amount"],



                "description":

                    category_data["description"]



            })





        # ====================================================

        # 16. SAVE ESTIMATE TO DATABASE

        # ====================================================



        print("\n==============================")

        print("SAVING BUDGET ESTIMATE")

        print("==============================")



        print("Trip ID:", trip_id)

        print("Plan:", plan)

        print("Estimated Total:", estimated_total)





        # Check whether an estimate already exists

        cursor.execute(

            """

            SELECT id

            FROM trip_budget_estimates

            WHERE trip_id = %s

              AND plan = %s

            ORDER BY id DESC

            LIMIT 1

            """,

            (

                trip_id,

                plan.title()

            )

        )



        existing_estimate = cursor.fetchone()





        if existing_estimate:



            # ================================================

            # UPDATE EXISTING ESTIMATE

            # ================================================



            estimate_id = existing_estimate["id"]



            cursor.execute(

                """

                UPDATE trip_budget_estimates



                SET

                    api_budget_level = %s,

                    cost_estimate_id = %s,

                    estimated_total = %s,



                    travel_amount = %s,

                    hotel_amount = %s,

                    food_amount = %s,

                    shopping_amount = %s,

                    activities_amount = %s,

                    local_transport_amount = %s,

                    other_amount = %s,



                    travel_description = %s,

                    hotel_description = %s,

                    food_description = %s,

                    shopping_description = %s,

                    activities_description = %s,

                    local_transport_description = %s,

                    other_description = %s



                WHERE id = %s

                """,



                (



                    budget_level,



                    result.get(

                        "cost_estimate_id"

                    ),



                    estimated_total,





                    mapped_categories[

                        "Travel"

                    ]["estimated_amount"],



                    mapped_categories[

                        "Hotel"

                    ]["estimated_amount"],



                    mapped_categories[

                        "Food"

                    ]["estimated_amount"],



                    mapped_categories[

                        "Shopping"

                    ]["estimated_amount"],



                    mapped_categories[

                        "Activities"

                    ]["estimated_amount"],



                    mapped_categories[

                        "Local Transport"

                    ]["estimated_amount"],



                    mapped_categories[

                        "Other"

                    ]["estimated_amount"],





                    mapped_categories[

                        "Travel"

                    ]["description"],



                    mapped_categories[

                        "Hotel"

                    ]["description"],



                    mapped_categories[

                        "Food"

                    ]["description"],



                    mapped_categories[

                        "Shopping"

                    ]["description"],



                    mapped_categories[

                        "Activities"

                    ]["description"],



                    mapped_categories[

                        "Local Transport"

                    ]["description"],



                    mapped_categories[

                        "Other"

                    ]["description"],





                    estimate_id



                )

            )





            print(

                "Updated estimate ID:",

                estimate_id

            )





        else:



            # ================================================

            # INSERT NEW ESTIMATE

            # ================================================



            cursor.execute(

                """

                INSERT INTO trip_budget_estimates (



                    trip_id,



                    plan,



                    api_budget_level,



                    cost_estimate_id,



                    estimated_total,



                    travel_amount,

                    hotel_amount,

                    food_amount,

                    shopping_amount,

                    activities_amount,

                    local_transport_amount,

                    other_amount,



                    travel_description,

                    hotel_description,

                    food_description,

                    shopping_description,

                    activities_description,

                    local_transport_description,

                    other_description



                )



                VALUES (



                    %s,

                    %s,

                    %s,

                    %s,

                    %s,



                    %s,

                    %s,

                    %s,

                    %s,

                    %s,

                    %s,

                    %s,



                    %s,

                    %s,

                    %s,

                    %s,

                    %s,

                    %s,

                    %s



                )

                """,



                (



                    trip_id,



                    plan.title(),



                    budget_level,



                    result.get(

                        "cost_estimate_id"

                    ),



                    estimated_total,





                    mapped_categories[

                        "Travel"

                    ]["estimated_amount"],



                    mapped_categories[

                        "Hotel"

                    ]["estimated_amount"],



                    mapped_categories[

                        "Food"

                    ]["estimated_amount"],



                    mapped_categories[

                        "Shopping"

                    ]["estimated_amount"],



                    mapped_categories[

                        "Activities"

                    ]["estimated_amount"],



                    mapped_categories[

                        "Local Transport"

                    ]["estimated_amount"],



                    mapped_categories[

                        "Other"

                    ]["estimated_amount"],





                    mapped_categories[

                        "Travel"

                    ]["description"],



                    mapped_categories[

                        "Hotel"

                    ]["description"],



                    mapped_categories[

                        "Food"

                    ]["description"],



                    mapped_categories[

                        "Shopping"

                    ]["description"],



                    mapped_categories[

                        "Activities"

                    ]["description"],



                    mapped_categories[

                        "Local Transport"

                    ]["description"],



                    mapped_categories[

                        "Other"

                    ]["description"]



                )

            )





            estimate_id = cursor.lastrowid



            print(

                "Inserted estimate ID:",

                estimate_id

            )





        # ====================================================

        # 17. COMMIT DATABASE CHANGES

        # ====================================================



        connection.commit()



        print("✅ Budget estimate saved successfully")



        print("==============================\n")





        # ====================================================

        # 18. RETURN RESPONSE

        # ====================================================



        return jsonify({



            "status": "success",



            "message":

                "Trip cost estimated successfully!",





            "saved_estimate_id":

                estimate_id,





            "trip": {



                "id":

                    trip["id"],



                "trip_name":

                    trip["trip_name"],



                "source":

                    trip["source"],



                "destination":

                    trip["destination"],



                "days":

                    days,



                "travelers":

                    trip["travelers"],



                "total_budget":

                    total_budget



            },





            "plan": {



                "name":

                    plan.title(),



                "api_budget_level":

                    budget_level



            },





            "budget": {



                "user_budget":

                    total_budget,



                "estimated_total":

                    estimated_total,



                "difference":

                    budget_difference,



                "status":

                    budget_status



            },





            "estimate": {



                "cost_estimate_id":

                    result.get(

                        "cost_estimate_id"

                    ),



                "title":

                    result.get("title"),



                "categories":

                    estimates,



                "content":

                    result.get("content"),



                "url":

                    result.get("url")



            }



        }), 200





    # ========================================================

    # PLANTRIP TIMEOUT

    # ========================================================



    except requests.exceptions.Timeout:



        if connection:

            connection.rollback()



        return jsonify({



            "status": "error",



            "message":

                "Plantrip API request timed out."



        }), 504





    # ========================================================

    # PLANTRIP CONNECTION ERROR

    # ========================================================



    except requests.exceptions.RequestException as e:



        if connection:

            connection.rollback()



        print(

            "PLANTRIP API CONNECTION ERROR:"

        )



        print(

            type(e).__name__

        )



        print(

            str(e)

        )



        return jsonify({



            "status": "error",



            "message":

                "Could not connect to Plantrip API."



        }), 502





    # ========================================================

    # GENERAL ERROR

    # ========================================================



    except Exception as e:



        if connection:

            connection.rollback()



        print(

            "ESTIMATE TRIP COST ERROR:"

        )



        print(

            type(e).__name__

        )



        print(

            str(e)

        )



        return jsonify({



            "status": "error",



            "message":

                "Failed to estimate trip cost.",



            "error":

                str(e)



        }), 500





    # ========================================================

    # CLOSE DATABASE

    # ========================================================



    finally:



        if cursor:



            cursor.close()



        if connection:



            connection.close()



# ============================================================

# GET SAVED BUDGET ESTIMATE

# ============================================================



@trip_bp.route("/api/trips/<int:trip_id>/estimate", methods=["GET"])

def get_saved_estimate(trip_id):

    connection = None

    cursor = None



    try:

        user_id = session.get("user_id")



        if not user_id:

            return jsonify({

                "status": "error",

                "message": "User is not logged in."

            }), 401



        connection = get_db_connection()

        cursor = connection.cursor(dictionary=True)



        cursor.execute(

            """

            SELECT id, trip_name, source, destination,

                   start_date, end_date, travelers, total_budget

            FROM trips

            WHERE id = %s AND user_id = %s

            """,

            (trip_id, user_id)

        )



        trip = cursor.fetchone()



        if not trip:

            return jsonify({

                "status": "error",

                "message": "Trip not found."

            }), 404



        cursor.execute(

            """

            SELECT *

            FROM trip_budget_estimates

            WHERE trip_id = %s

            ORDER BY updated_at DESC, id DESC

            LIMIT 1

            """,

            (trip_id,)

        )



        estimate = cursor.fetchone()



        if not estimate:

            return jsonify({

                "status": "error",

                "message": "No budget estimate found for this trip."

            }), 404



        total_budget = float(trip["total_budget"])

        estimated_total = float(estimate["estimated_total"])

        difference = total_budget - estimated_total



        categories = [

            {

                "category": "Travel",

                "estimated_amount": float(estimate["travel_amount"]),

                "description": estimate["travel_description"] or ""

            },

            {

                "category": "Hotel",

                "estimated_amount": float(estimate["hotel_amount"]),

                "description": estimate["hotel_description"] or ""

            },

            {

                "category": "Food",

                "estimated_amount": float(estimate["food_amount"]),

                "description": estimate["food_description"] or ""

            },

            {

                "category": "Shopping",

                "estimated_amount": float(estimate["shopping_amount"]),

                "description": estimate["shopping_description"] or ""

            },

            {

                "category": "Activities",

                "estimated_amount": float(estimate["activities_amount"]),

                "description": estimate["activities_description"] or ""

            },

            {

                "category": "Local Transport",

                "estimated_amount": float(estimate["local_transport_amount"]),

                "description": estimate["local_transport_description"] or ""

            },

            {

                "category": "Other",

                "estimated_amount": float(estimate["other_amount"]),

                "description": estimate["other_description"] or ""

            }

        ]



        return jsonify({

            "status": "success",

            "message": "Saved budget estimate retrieved successfully!",

            "trip": trip,

            "plan": {

                "name": estimate["plan"],

                "api_budget_level": estimate["api_budget_level"]

            },

            "budget": {

                "user_budget": total_budget,

                "estimated_total": estimated_total,

                "difference": difference,

                "status": "Within Budget" if difference >= 0 else "Over Budget"

            },

            "estimate": {

                "saved_estimate_id": estimate["id"],

                "cost_estimate_id": estimate["cost_estimate_id"],

                "categories": categories,

                "created_at": estimate["created_at"],

                "updated_at": estimate["updated_at"]

            }

        }), 200



    except Exception as e:

        print("GET SAVED ESTIMATE ERROR:")

        print(type(e).__name__)

        print(str(e))



        return jsonify({

            "status": "error",

            "message": "Failed to retrieve saved budget estimate.",

            "error": str(e)

        }), 500



    finally:

        if cursor:

            cursor.close()



        if connection:

            connection.close()





# ============================================================

# ADD EXPENSE

# ============================================================



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



        # Read expense data

        category_name = data.get("category", "").strip()

        category_id = data.get("category_id")



        expense_name = data.get(

            "expense_name",

            ""

        ).strip()



        amount = data.get("amount")

        expense_date = data.get("expense_date")



        expense_type = data.get(

            "expense_type",

            "Planned"

        )



        description = data.get(

            "description",

            ""

        ).strip()



        # Validate category

        if not category_name and category_id is None:

            return jsonify({

                "status": "error",

                "message": "Category is required."

            }), 400



        # Validate expense name

        if not expense_name:

            return jsonify({

                "status": "error",

                "message": "Expense name is required."

            }), 400



        # Validate amount

        if amount is None:

            return jsonify({

                "status": "error",

                "message": "Expense amount is required."

            }), 400



        # Validate expense date

        if not expense_date:

            return jsonify({

                "status": "error",

                "message": "Expense date is required."

            }), 400



        # Validate expense type

        if expense_type not in ["Planned", "Actual"]:

            return jsonify({

                "status": "error",

                "message": "Expense type must be Planned or Actual."

            }), 400



        # Convert amount

        try:

            amount = float(amount)



            if amount <= 0:

                return jsonify({

                    "status": "error",

                    "message": "Expense amount must be greater than 0."

                }), 400



        except (ValueError, TypeError):

            return jsonify({

                "status": "error",

                "message": "Amount must be a valid number."

            }), 400



        # Connect to database

        connection = get_db_connection()

        cursor = connection.cursor()



        # Check trip ownership

        cursor.execute(

            """

            SELECT id

            FROM trips

            WHERE id = %s

              AND user_id = %s

            """,

            (

                trip_id,

                user_id

            )

        )



        trip = cursor.fetchone()



        if not trip:

            cursor.close()

            connection.close()



            return jsonify({

                "status": "error",

                "message": "Trip not found."

            }), 404



        # Find expense category

        if category_id is not None:

            cursor.execute(

                """

                SELECT id, category_name

                FROM expense_categories

                WHERE id = %s

                """,

                (category_id,)

            )



        else:

            cursor.execute(

                """

                SELECT id, category_name

                FROM expense_categories

                WHERE category_name = %s

                """,

                (category_name,)

            )



        category = cursor.fetchone()



        if not category:

            cursor.close()

            connection.close()



            return jsonify({

                "status": "error",

                "message": "Expense category not found."

            }), 404



        category_id = category[0]

        category_name = category[1]



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

            (

                %s,

                %s,

                %s,

                %s,

                %s,

                %s,

                %s

            )

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



        # Save changes

        connection.commit()



        # Get newly created expense ID

        expense_id = cursor.lastrowid



        # Close resources

        cursor.close()

        connection.close()



        return jsonify({

            "status": "success",

            "message": "Expense added successfully!",

            "expense": {

                "id": expense_id,

                "trip_id": trip_id,

                "category_id": category_id,

                "category_name": category_name,

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





# ============================================================

# GET EXPENSES

# ============================================================



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



        # Make sure trip belongs to user

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





# ============================================================

# BUDGET SUMMARY

# ============================================================



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

        planned_expenses = float(

            planned_result["planned_expenses"]

        )



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

        actual_expenses = float(

            actual_result["actual_expenses"]

        )



        # Calculate total

        total_expenses = (

            planned_expenses +

            actual_expenses

        )



        # Calculate remaining budget

        remaining_budget = (

            total_budget -

            total_expenses

        )



        # Calculate usage percentage

        if total_budget > 0:

            budget_usage_percentage = (

                total_expenses /

                total_budget

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

                    budget_usage_percentage,

                    2

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





# ============================================================

# UPDATE EXPENSE

# ============================================================



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

        expense_name = data.get(

            "expense_name",

            ""

        ).strip()

        amount = data.get("amount")

        expense_date = data.get("expense_date")

        expense_type = data.get(

            "expense_type",

            "Planned"

        )

        description = data.get(

            "description",

            ""

        ).strip()



        if (

            category_id is None

            or not expense_name

            or amount is None

            or not expense_date

        ):

            return jsonify({

                "status": "error",

                "message": (

                    "Category, expense name, amount "

                    "and expense date are required."

                )

            }), 400



        if expense_type not in ["Planned", "Actual"]:

            return jsonify({

                "status": "error",

                "message": (

                    "Expense type must be Planned or Actual."

                )

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



        # Make sure expense belongs to user's trip

        cursor.execute(

            """

            SELECT e.id

            FROM expenses e

            JOIN trips t

                ON e.trip_id = t.id

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





# ============================================================

# DELETE EXPENSE

# ============================================================



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

            JOIN trips t

                ON e.trip_id = t.id

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

        print("DELETE EXPENSE ERROR:")

        print(type(e).__name__)

        print(str(e))



        return jsonify({

            "status": "error",

            "message": "Failed to delete expense.",

            "error": str(e)

        }), 500
