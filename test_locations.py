import unittest
from app import app, db, User, Location, Bowser, Deployment
import os
import tempfile
from datetime import datetime, timedelta
import json

class LocationsTestCase(unittest.TestCase):
    
    def setUp(self):
        """Set up a test environment before each test."""
        self.db_fd, app.config['DATABASE'] = tempfile.mkstemp()
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        app.config['WTF_CSRF_ENABLED'] = False  # Disable CSRF for testing
        self.client = app.test_client()
        
        with app.app_context():
            db.create_all()
            # Create test data
            self._create_test_users()
            self._create_test_bowsers()
            self._create_test_locations()
            self._create_test_deployments()
            
    def tearDown(self):
        """Clean up after each test."""
        os.close(self.db_fd)
        os.unlink(app.config['DATABASE'])
        
    def _create_test_users(self):
        """Create test users."""
        admin = User(username='admin', email='admin@example.com', role='admin')
        admin.set_password('password')
        
        staff = User(username='staff', email='staff@example.com', role='staff')
        staff.set_password('password')
        
        db.session.add(admin)
        db.session.add(staff)
        db.session.commit()
    
    def _create_test_bowsers(self):
        """Create test bowsers."""
        bowser1 = Bowser(
            number='TEST-B001',
            capacity=5000,
            current_level=5000,
            status='active',
            owner='Test Region',
            last_maintenance=datetime.now().date(),
            notes='Test bowser 1'
        )
        
        bowser2 = Bowser(
            number='TEST-B002',
            capacity=7500,
            current_level=7000,
            status='active',
            owner='Test Region',
            last_maintenance=datetime.now().date(),
            notes='Test bowser 2'
        )
        
        db.session.add(bowser1)
        db.session.add(bowser2)
        db.session.commit()
    
    def _create_test_locations(self):
        """Create test locations."""
        location1 = Location(
            name='Test Location 1',
            address='123 Test Street',
            latitude=51.505,
            longitude=-0.09,
            type='test'
        )
        
        location2 = Location(
            name='Test Location 2',
            address='456 Test Avenue',
            latitude=51.51,
            longitude=-0.11,
            type='test'
        )
        
        db.session.add(location1)
        db.session.add(location2)
        db.session.commit()
    
    def _create_test_deployments(self):
        """Create test deployments."""
        bowsers = Bowser.query.all()
        locations = Location.query.all()
        
        deployment1 = Deployment(
            bowser_id=bowsers[0].id,
            location_id=locations[0].id,
            start_date=datetime.now().date(),
            end_date=None,
            status='active',
            priority='high',
            notes='Test deployment 1'
        )
        
        deployment2 = Deployment(
            bowser_id=bowsers[1].id,
            location_id=locations[1].id,
            start_date=datetime.now().date(),
            end_date=None,
            status='active',
            priority='medium',
            notes='Test deployment 2'
        )
        
        # Update bowser statuses to deployed
        bowsers[0].status = 'deployed'
        bowsers[1].status = 'deployed'
        
        db.session.add(deployment1)
        db.session.add(deployment2)
        db.session.commit()
    
    # Test Locations Page Access
    def test_locations_page_access(self):
        """Test access to locations page with authentication."""
        # Login as admin
        self.client.post('/login', data={
            'username': 'admin',
            'password': 'password'
        })
        # Access locations page
        response = self.client.get('/locations')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Locations Management', response.data)
    
    def test_locations_page_unauthenticated(self):
        """Test access to locations page without authentication."""
        response = self.client.get('/locations', follow_redirects=True)
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Please log in', response.data)
    
    # Test Public Map
    def test_public_map_access(self):
        """Test access to public map."""
        response = self.client.get('/public_map')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Emergency Water Locations', response.data)
    
    # Test API Endpoints
    def test_api_locations(self):
        """Test the locations API endpoint."""
        response = self.client.get('/api/locations')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(len(data), 2)  # We created 2 test locations
    
    def test_api_deployments(self):
        """Test the deployments API endpoint."""
        response = self.client.get('/api/deployments')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(len(data), 2)  # We created 2 test deployments
    
    # Test CRUD Operations
    def test_create_location(self):
        """Test creating a new location."""
        # Login as admin
        self.client.post('/login', data={
            'username': 'admin',
            'password': 'password'
        })
        
        # Create new location
        new_location = {
            'name': 'Test Location 3',
            'address': '789 Test Boulevard',
            'latitude': 51.52,
            'longitude': -0.12,
            'type': 'test'
        }
        
        response = self.client.post('/api/locations', 
                                   data=json.dumps(new_location),
                                   content_type='application/json')
        self.assertEqual(response.status_code, 201)
        
        # Verify it was created
        response = self.client.get('/api/locations')
        data = response.get_json()
        self.assertEqual(len(data), 3)  # Now we should have 3 locations
    
    def test_update_location(self):
        """Test updating a location."""
        # Login as admin
        self.client.post('/login', data={
            'username': 'admin',
            'password': 'password'
        })
        
        # Get the first location
        response = self.client.get('/api/locations')
        locations = response.get_json()
        location_id = locations[0]['id']
        
        # Update the location
        updated_location = {
            'name': 'Updated Test Location',
            'address': 'Updated Test Address',
            'type': 'updated'
        }
        
        response = self.client.put(f'/api/locations/{location_id}', 
                                  data=json.dumps(updated_location),
                                  content_type='application/json')
        self.assertEqual(response.status_code, 200)
        
        # Verify it was updated
        response = self.client.get(f'/api/locations/{location_id}')
        data = response.get_json()
        self.assertEqual(data['name'], 'Updated Test Location')
        self.assertEqual(data['type'], 'updated')
    
    def test_delete_location(self):
        """Test deleting a location."""
        # Login as admin
        self.client.post('/login', data={
            'username': 'admin',
            'password': 'password'
        })
        
        # First, we need to remove any deployments associated with the location
        # Get the first location
        response = self.client.get('/api/locations')
        locations = response.get_json()
        location_id = locations[0]['id']
        
        # Get deployments for this location
        response = self.client.get('/api/deployments')
        deployments = response.get_json()
        for deployment in deployments:
            if deployment['location_id'] == location_id:
                # Delete the deployment
                self.client.delete(f'/api/deployments/{deployment["id"]}')
        
        # Now delete the location
        response = self.client.delete(f'/api/locations/{location_id}')
        self.assertEqual(response.status_code, 200)
        
        # Verify it was deleted
        response = self.client.get('/api/locations')
        data = response.get_json()
        self.assertEqual(len(data), 1)  # Now we should have 1 location
    
    def test_create_deployment(self):
        """Test creating a new deployment."""
        # Login as admin
        self.client.post('/login', data={
            'username': 'admin',
            'password': 'password'
        })
        
        # First, create a new bowser for this test
        new_bowser = {
            'number': 'TEST-B003',
            'capacity': 5000,
            'current_level': 5000,
            'status': 'active',
            'owner': 'Test Region',
            'notes': 'Test bowser for deployment'
        }
        
        response = self.client.post('/api/bowsers', 
                                   data=json.dumps(new_bowser),
                                   content_type='application/json')
        self.assertEqual(response.status_code, 201)
        
        # Get the new bowser ID
        response = self.client.get('/api/bowsers')
        bowsers = response.get_json()
        new_bowser_id = None
        for bowser in bowsers:
            if bowser['number'] == 'TEST-B003':
                new_bowser_id = bowser['id']
                break
        
        # Get a location ID
        response = self.client.get('/api/locations')
        locations = response.get_json()
        location_id = locations[0]['id']
        
        # Create new deployment
        new_deployment = {
            'bowser_id': new_bowser_id,
            'location_id': location_id,
            'start_date': datetime.now().strftime('%Y-%m-%d'),
            'status': 'active',
            'priority': 'high',
            'notes': 'Test deployment creation'
        }
        
        response = self.client.post('/api/deployments', 
                                   data=json.dumps(new_deployment),
                                   content_type='application/json')
        self.assertEqual(response.status_code, 201)
        
        # Verify it was created
        response = self.client.get('/api/deployments')
        data = response.get_json()
        self.assertEqual(len(data), 3)  # Now we should have 3 deployments

if __name__ == '__main__':
    unittest.main()
