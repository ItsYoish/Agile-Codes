import requests
import json

BASE_URL = "http://127.0.0.1:5000/api"

def test_get_bowsers():
    """Test retrieving all bowsers"""
    response = requests.get(f"{BASE_URL}/bowsers")
    if response.status_code == 200:
        print("✅ Successfully retrieved bowsers")
        bowsers = response.json()
        print(f"Found {len(bowsers)} bowsers:")
        for bowser in bowsers:
            print(f"  - Bowser #{bowser['number']}: {bowser['capacity']}L ({bowser['status']})")
    else:
        print(f"❌ Failed to retrieve bowsers: {response.status_code}")
        print(response.text)

def test_create_bowser():
    """Test creating a new bowser"""
    new_bowser = {
        "number": "BWS002",
        "capacity": 8000,
        "currentLevel": 8000,
        "status": "active",
        "owner": "Region South",
        "lastMaintenance": "2025-04-07",
        "notes": "New bowser for emergency deployment"
    }
    
    response = requests.post(
        f"{BASE_URL}/bowsers", 
        json=new_bowser,
        headers={"Content-Type": "application/json"}
    )
    
    if response.status_code == 201:
        print(f"✅ Successfully created bowser: {response.json()}")
    else:
        print(f"❌ Failed to create bowser: {response.status_code}")
        print(response.text)

def test_get_bowser_by_id(bowser_id):
    """Test retrieving a specific bowser"""
    response = requests.get(f"{BASE_URL}/bowsers/{bowser_id}")
    if response.status_code == 200:
        print(f"✅ Successfully retrieved bowser {bowser_id}")
        print(json.dumps(response.json(), indent=2))
    else:
        print(f"❌ Failed to retrieve bowser {bowser_id}: {response.status_code}")
        print(response.text)

def test_update_bowser(bowser_id):
    """Test updating a bowser"""
    update_data = {
        "status": "maintenance",
        "notes": "Scheduled for maintenance check"
    }
    
    response = requests.put(
        f"{BASE_URL}/bowsers/{bowser_id}", 
        json=update_data,
        headers={"Content-Type": "application/json"}
    )
    
    if response.status_code == 200:
        print(f"✅ Successfully updated bowser {bowser_id}: {response.json()}")
    else:
        print(f"❌ Failed to update bowser {bowser_id}: {response.status_code}")
        print(response.text)

if __name__ == "__main__":
    print("Testing AquaAlert API...")
    print("\n1. Getting all bowsers:")
    test_get_bowsers()
    
    print("\n2. Creating a new bowser:")
    test_create_bowser()
    
    print("\n3. Getting all bowsers again (should include new bowser):")
    test_get_bowsers()
    
    print("\n4. Getting bowser with ID 1:")
    test_get_bowser_by_id(1)
    
    print("\n5. Updating bowser with ID 1:")
    test_update_bowser(1)
    
    print("\n6. Getting bowser with ID 1 again (should show updated data):")
    test_get_bowser_by_id(1)
    
    print("\nAPI testing complete!")
