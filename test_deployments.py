import unittest
from app import app, db, User, Bowser, Location, Deployment, Alert
import os
import tempfile
from datetime import datetime, timedelta
import json

class DeploymentTestCase(unittest.TestCase):
    
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
            self._create_test_alerts()
            
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
        
        bowser3 = Bowser(
            number='TEST-B003',
            capacity=10000,
            current_level=9000,
            status='standby',
            owner='Test Region',
            last_maintenance=datetime.now().date(),
            notes='Test bowser 3'
        )
        
        db.session.add(bowser1)
        db.session.add(bowser2)
        db.session.add(bowser3)
        db.session.commit()
    
    def _create_test_locations(self):
        """Create test locations."""
        location1 = Location(
            name='Test Hospital',
            address='123 Test Street',
            latitude=51.505,
            longitude=-0.09,
            type='healthcare'
        )
        
        location2 = Location(
            name='Test Community Center',
            address='456 Test Avenue',
            latitude=51.51,
            longitude=-0.11,
            type='community'
        )
        
        location3 = Location(
            name='Test School',
            address='789 Test Boulevard',
            latitude=51.52,
            longitude=-0.12,
            type='education'
        )
        
        db.session.add(location1)
        db.session.add(location2)
        db.session.add(location3)
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
            priority='emergency',
            notes='Test emergency deployment'
        )
        
        deployment2 = Deployment(
            bowser_id=bowsers[1].id,
            location_id=locations[1].id,
            start_date=datetime.now().date(),
            end_date=None,
            status='active',
            priority='medium',
            notes='Test medium priority deployment'
        )
        
        # Update bowser statuses to deployed
        bowsers[0].status = 'deployed'
        bowsers[1].status = 'deployed'
        
        db.session.add(deployment1)
        db.session.add(deployment2)
        db.session.commit()
    
    def _create_test_alerts(self):
        """Create test alerts."""
        alert1 = Alert(
            title='Emergency Deployment Alert',
            message='Emergency water bowser deployed to Test Hospital',
            alert_type='deployment',
            priority='high',
            status='active',
            timestamp=datetime.now()
        )
        
        alert2 = Alert(
            title='Low Water Level Alert',
            message='Bowser TEST-B002 is below 50% capacity',
            alert_type='water_level',
            priority='medium',
            status='active',
            timestamp=datetime.now()
        )
        
        db.session.add(alert1)
        db.session.add(alert2)
        db.session.commit()
    
    # Test Deployment Management
    def test_deployment_page_access(self):
        """Test access to deployment page with authentication."""
        # Login as admin
        self.client.post('/login', data={
            'username': 'admin',
            'password': 'password'
        })
        # Access deployments page
        response = self.client.get('/deployments')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Deployment Management', response.data)
    
    def test_deployment_page_unauthenticated(self):
        """Test access to deployment page without authentication."""
        response = self.client.get('/deployments', follow_redirects=True)
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Please log in', response.data)
    
    # Test API Endpoints
    def test_api_deployments(self):
        """Test the deployments API endpoint."""
        response = self.client.get('/api/deployments')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(len(data), 2)  # We created 2 test deployments
    
    def test_api_alerts(self):
        """Test the alerts API endpoint."""
        response = self.client.get('/api/alerts')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(len(data), 2)  # We created 2 test alerts
    
    # Test CRUD Operations
    def test_create_deployment(self):
        """Test creating a new deployment."""
        # Login as admin
        self.client.post('/login', data={
            'username': 'admin',
            'password': 'password'
        })
        
        # Get a standby bowser
        bowsers = Bowser.query.filter_by(status='standby').all()
        self.assertTrue(len(bowsers) > 0, "No standby bowsers available for testing")
        
        # Get an available location
        locations = Location.query.all()
        
        # Create new deployment
        new_deployment = {
            'bowser_id': bowsers[0].id,
            'location_id': locations[2].id,
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
        
        # Verify bowser status was updated
        response = self.client.get(f'/api/bowsers/{bowsers[0].id}')
        bowser_data = response.get_json()
        self.assertEqual(bowser_data['status'], 'deployed')
    
    def test_complete_deployment(self):
        """Test completing a deployment."""
        # Login as admin
        self.client.post('/login', data={
            'username': 'admin',
            'password': 'password'
        })
        
        # Get the first deployment
        response = self.client.get('/api/deployments')
        deployments = response.get_json()
        deployment_id = deployments[0]['id']
        bowser_id = deployments[0]['bowser_id']
        
        # Complete the deployment
        updated_deployment = {
            'status': 'completed',
            'end_date': datetime.now().strftime('%Y-%m-%d')
        }
        
        response = self.client.put(f'/api/deployments/{deployment_id}', 
                                  data=json.dumps(updated_deployment),
                                  content_type='application/json')
        self.assertEqual(response.status_code, 200)
        
        # Verify it was updated
        response = self.client.get(f'/api/deployments/{deployment_id}')
        data = response.get_json()
        self.assertEqual(data['status'], 'completed')
        
        # Verify bowser status was updated
        response = self.client.get(f'/api/bowsers/{bowser_id}')
        bowser_data = response.get_json()
        self.assertEqual(bowser_data['status'], 'active')  # Should return to active
    
    def test_emergency_priority_system(self):
        """Test the emergency priority system for deployments."""
        # Login as admin
        self.client.post('/login', data={
            'username': 'admin',
            'password': 'password'
        })
        
        # Get deployments sorted by priority
        response = self.client.get('/api/deployments?sort=priority')
        deployments = response.get_json()
        
        # Verify emergency deployments come first
        self.assertEqual(deployments[0]['priority'], 'emergency')
        
        # Create a new high priority deployment
        bowsers = Bowser.query.filter_by(status='standby').all()
        if len(bowsers) > 0:
            locations = Location.query.all()
            
            new_deployment = {
                'bowser_id': bowsers[0].id,
                'location_id': locations[2].id,
                'start_date': datetime.now().strftime('%Y-%m-%d'),
                'status': 'active',
                'priority': 'high',
                'notes': 'Test high priority deployment'
            }
            
            self.client.post('/api/deployments', 
                           data=json.dumps(new_deployment),
                           content_type='application/json')
            
            # Verify sorting still works
            response = self.client.get('/api/deployments?sort=priority')
            updated_deployments = response.get_json()
            
            # First should be emergency, second should be high
            self.assertEqual(updated_deployments[0]['priority'], 'emergency')
            self.assertEqual(updated_deployments[1]['priority'], 'high')

if __name__ == '__main__':
    unittest.main()
