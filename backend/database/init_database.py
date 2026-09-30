import os
import mysql.connector
from dotenv import load_dotenv


# Load environment variables from .env
load_dotenv()


def create_database_tables():
    connection = None
    cursor = None

    try:
        # Connect to Aiven MySQL
        connection = mysql.connector.connect(
            host=os.getenv("DB_HOST"),
            port=int(os.getenv("DB_PORT")),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            database=os.getenv("DB_NAME"),
            ssl_ca=os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    "certs",
    "ca.pem"
)
        )

        print("✅ Connected to Aiven MySQL")

        cursor = connection.cursor()

        # Read schema.sql
        schema_path = os.path.join(
            os.path.dirname(__file__),
            "schema.sql"
        )

        with open(schema_path, "r", encoding="utf-8") as file:
            schema = file.read()

        # Remove comments and split SQL statements
        statements = []

        for statement in schema.split(";"):
            statement = statement.strip()

            if statement:
                statements.append(statement)

        # Execute each SQL statement
        for statement in statements:
            cursor.execute(statement)

        connection.commit()

        print("✅ Database tables created successfully!")

        # Verify tables
        cursor.execute("SHOW TABLES")

        tables = cursor.fetchall()

        print("\nTables in travel_budget_pro:")

        for table in tables:
            print(" -", table[0])

        print("\n🎉 Database initialization completed successfully!")

    except Exception as e:
        print("❌ Database initialization failed.")
        print("Error:", e)

    finally:
        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()
            print("🔒 Database connection closed.")


if __name__ == "__main__":
    create_database_tables()