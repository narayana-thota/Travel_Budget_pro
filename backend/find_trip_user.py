from config.database import get_db_connection


connection = None
cursor = None

try:
    connection = get_db_connection()
    cursor = connection.cursor()

    query = """
        SELECT
            t.id AS trip_id,
            t.trip_name,
            t.user_id,
            u.full_name,
            u.email,
            u.created_at
        FROM trips t
        JOIN users u ON t.user_id = u.id
        WHERE t.id = %s
    """

    cursor.execute(query, (1,))
    result = cursor.fetchone()

    if result:
        print("\n===== TRIP OWNER DETAILS =====")
        print("Trip ID   :", result[0])
        print("Trip Name :", result[1])
        print("User ID   :", result[2])
        print("Full Name :", result[3])
        print("Email     :", result[4])
        print("Created   :", result[5])
        print("==============================\n")
    else:
        print("No trip found with ID 1.")

except Exception as e:
    print("ERROR:", e)

finally:
    if cursor:
        cursor.close()

    if connection:
        connection.close()