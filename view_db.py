import sqlite3
import os
import json
from datetime import datetime

# Function to serialize datetime objects for JSON
def json_serial(obj):
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serializable")

# Connect to the database
db_path = os.path.join('instance', 'aquaalert.db')
conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row  # This enables column access by name

# Create a cursor
cur = conn.cursor()

# Function to print table data
def print_table(table_name):
    print(f"\n=== {table_name.upper()} TABLE ===")
    cur.execute(f"SELECT * FROM {table_name}")
    rows = cur.fetchall()
    
    if not rows:
        print("No records found.")
        return
    
    # Convert to list of dicts for easier display
    records = [dict(row) for row in rows]
    for record in records:
        print(json.dumps(record, indent=2, default=json_serial))
        print("-" * 30)
    
    print(f"Total {table_name} records: {len(records)}")

# Get list of tables
cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [row[0] for row in cur.fetchall()]

print(f"Database tables: {', '.join(tables)}\n")

# Print data from each table
for table in tables:
    print_table(table)

# Close the connection
conn.close()

print("\nDatabase inspection complete.")
