import os
import mysql.connector
from dotenv import load_dotenv

load_dotenv()

connection = mysql.connector.connect(
    host=os.getenv("DB_HOST"),
    port=int(os.getenv("DB_PORT")),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    database=os.getenv("DB_NAME"),
    ssl_ca=os.path.join(os.path.dirname(__file__), "certs", "ca.pem")
)

cursor = connection.cursor(dictionary=True)

cursor.execute("""
    SELECT *
    FROM trip_budget_estimates
    WHERE trip_id = 3
    ORDER BY id DESC
""")

rows = cursor.fetchall()

print("Rows found:", len(rows))

for row in rows:
    print(row)

cursor.close()
connection.close()