import json
import os
from datetime import datetime

class JSONDataHandler:
    def __init__(self, json_file_path):
        self.json_file_path = json_file_path
        self.data = self.load_data()

    def load_data(self):
        """Load data from JSON file or create new if doesn't exist"""
        if os.path.exists(self.json_file_path):
            with open(self.json_file_path, 'r') as f:
                return json.load(f)
        return {
            'bowsers': [],
            'locations': [],
            'maintenance': [],
            'deployments': [],
            'invoices': [],
            'mutual_aid_schemes': [],
            'mutual_aid_contributions': [],
            'partners': [],
            'alerts': []
        }

    def save_data(self):
        """Save data to JSON file"""
        with open(self.json_file_path, 'w') as f:
            json.dump(self.data, f, indent=2)

    def get_all(self, model_name):
        """Get all records for a model"""
        return self.data.get(model_name, [])

    def get_by_id(self, model_name, id):
        """Get a record by ID"""
        items = self.data.get(model_name, [])
        return next((item for item in items if item['id'] == id), None)

    def create(self, model_name, item):
        """Create a new record"""
        if model_name not in self.data:
            self.data[model_name] = []
        
        # Ensure item has an ID
        if 'id' not in item:
            existing_ids = [int(x['id']) if isinstance(x['id'], str) and x['id'].isdigit() else int(x['id']) for x in self.data[model_name]]
            new_id = max(existing_ids, default=0) + 1
            item['id'] = new_id
        
        # Add created_at timestamp
        item['created_at'] = datetime.utcnow().isoformat()
        
        self.data[model_name].append(item)
        self.save_data()
        return item

    def update(self, model_name, id, updates):
        """Update a record"""
        items = self.data.get(model_name, [])
        for i, item in enumerate(items):
            if item['id'] == id:
                items[i] = {**item, **updates}
                self.save_data()
                return items[i]
        return None

    def delete(self, model_name, id):
        """Delete a record"""
        items = self.data.get(model_name, [])
        self.data[model_name] = [item for item in items if item['id'] != id]
        self.save_data()
        return True

    def query(self, model_name, filters=None):
        """Query records with filters"""
        items = self.data.get(model_name, [])
        if not filters:
            return items

        results = []
        for item in items:
            matches = True
            for key, value in filters.items():
                if key not in item or item[key] != value:
                    matches = False
                    break
            if matches:
                results.append(item)
        return results

# Initialize the JSON data handler
json_handler = JSONDataHandler('data/db.json')