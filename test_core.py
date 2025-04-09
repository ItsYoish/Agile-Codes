import unittest
from app import app, db, User, Bowser, Location, Maintenance, Deployment, Alert, Invoice, MutualAidScheme, Partner
import os
import tempfile
from datetime import datetime, timedelta
import json

class AquaAlertCoreTestCase(unittest.TestCase):
    
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
            
    def tearDown(self):
        """Clean up after each test."""
        os.close(self.db_fd)
        os.unlink(app.config['DATABASE'])
        
    def _create_test_users(self):
        """Create test users."""
        admin = User(username='testadmin', email='testadmin@example.com', role='admin')
        admin.set_password('password')
        
        staff = User(username='teststaff', email='teststaff@example.com', role='staff')
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
            notes='Test bowser 1'
        )
        
        bowser2 = Bowser(
            number='TEST-B002',
            capacity=7500,
            current_level=7000,
            status='maintenance',
            owner='Test Region',
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
    
    # Test Public Routes
    def test_public_home(self):
        """Test the public home page."""
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)
    
    def test_public_map(self):
        """Test the public map page."""
        response = self.client.get('/public_map')
        self.assertEqual(response.status_code, 200)
    
    # Test API Endpoints
    def test_api_bowsers(self):
        """Test the bowsers API endpoint."""
        response = self.client.get('/api/bowsers')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(len(data), 2)  # We created 2 test bowsers
    
    def test_api_locations(self):
        """Test the locations API endpoint."""
        response = self.client.get('/api/locations')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(len(data), 2)  # We created 2 test locations
    
    # Test Authentication
    def test_login_page(self):
        """Test access to login page."""
        response = self.client.get('/login')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Login', response.data)
    
    def test_login_valid(self):
        """Test login with valid credentials."""
        response = self.client.post('/login', data={
            'username': 'testadmin',
            'password': 'password'
        }, follow_redirects=True)
        self.assertEqual(response.status_code, 200)
        # Check if we're redirected to a page that indicates successful login
        self.assertIn(b'Dashboard', response.data)
    
    def test_login_invalid(self):
        """Test login with invalid credentials."""
        response = self.client.post('/login', data={
            'username': 'testadmin',
            'password': 'wrongpassword'
        }, follow_redirects=True)
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Invalid username or password', response.data)
    
    # Test Data Models
    def test_bowser_model(self):
        """Test Bowser model functionality."""
        with app.app_context():
            bowser = Bowser.query.filter_by(number='TEST-B001').first()
            self.assertIsNotNone(bowser)
            self.assertEqual(bowser.capacity, 5000)
            self.assertEqual(bowser.status, 'active')
    
    def test_location_model(self):
        """Test Location model functionality."""
        with app.app_context():
            location = Location.query.filter_by(name='Test Location 1').first()
            self.assertIsNotNone(location)
            self.assertEqual(location.type, 'test')
            self.assertAlmostEqual(location.latitude, 51.505)
            self.assertAlmostEqual(location.longitude, -0.09)

if __name__ == '__main__':
    unittest.main()
