import os
import mysql.connector
from dotenv import load_dotenv

load_dotenv()

CA_PATH = os.path.join(
    os.path.dirname(__file__),
    "certs",
    "ca.pem"
)


connection = None
cursor = None

try:

    print("Connecting to Aiven MySQL...")

    connection = mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        port=int(os.getenv("DB_PORT")),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME"),
        ssl_ca=CA_PATH
    )

    print("✅ Database connection successful")

    cursor = connection.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS trip_budget_estimates (

            id INT AUTO_INCREMENT PRIMARY KEY,

            trip_id INT NOT NULL,

            plan VARCHAR(30) NOT NULL,

            api_budget_level VARCHAR(30) NOT NULL,

            cost_estimate_id VARCHAR(100),

            estimated_total DECIMAL(12, 2) NOT NULL DEFAULT 0,

            travel_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,

            hotel_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,

            food_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,

            shopping_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,

            activities_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,

            local_transport_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,

            other_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,

            travel_description TEXT,

            hotel_description TEXT,

            food_description TEXT,

            shopping_description TEXT,

            activities_description TEXT,

            local_transport_description TEXT,

            other_description TEXT,

            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ON UPDATE CURRENT_TIMESTAMP,

            CONSTRAINT fk_budget_estimate_trip
                FOREIGN KEY (trip_id)
                REFERENCES trips(id)
                ON DELETE CASCADE

        )
    """)

    connection.commit()

    print("✅ trip_budget_estimates table created successfully")

    # Verify

    cursor.execute("""
        SHOW TABLES LIKE 'trip_budget_estimates'
    """)

    result = cursor.fetchone()

    if result:
        print("✅ VERIFIED: trip_budget_estimates exists")
    else:
        print("❌ Table was not found after creation")

except Exception as e:

    print("❌ ERROR")
    print(type(e).__name__)
    print(str(e))

finally:

    if cursor:
        cursor.close()

    if connection:
        connection.close()

    print("Database connection closed.")