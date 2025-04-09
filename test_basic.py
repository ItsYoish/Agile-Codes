import unittest
from app import app, db
import os
import tempfile

class AquaAlertBasicTestCase(unittest.TestCase):
    
    def setUp(self):
        """Set up a test environment before each test."""
        self.db_fd, app.config['DATABASE'] = tempfile.mkstemp()
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        app.config['WTF_CSRF_ENABLED'] = False  # Disable CSRF for testing
        self.client = app.test_client()
        
        with app.app_context():
            db.create_all()
            
    def tearDown(self):
        """Clean up after each test."""
        os.close(self.db_fd)
        os.unlink(app.config['DATABASE'])
    
    # Test Public Routes
    def test_public_home(self):
        """Test the public home page."""
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)
    
    def test_public_map(self):
        """Test the public map page."""
        response = self.client.get('/public_map')
        self.assertEqual(response.status_code, 200)
    
    def test_login_page(self):
        """Test access to login page."""
        response = self.client.get('/login')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Login', response.data)
    
    # Test API Endpoints
    def test_api_bowsers_exists(self):
        """Test the bowsers API endpoint exists."""
        response = self.client.get('/api/bowsers')
        self.assertEqual(response.status_code, 200)
    
    def test_api_locations_exists(self):
        """Test the locations API endpoint exists."""
        response = self.client.get('/api/locations')
        self.assertEqual(response.status_code, 200)
    
    def test_api_deployments_exists(self):
        """Test the deployments API endpoint exists."""
        response = self.client.get('/api/deployments')
        self.assertEqual(response.status_code, 200)
    
    def test_api_maintenance_exists(self):
        """Test the maintenance API endpoint exists."""
        response = self.client.get('/api/maintenance')
        self.assertEqual(response.status_code, 200)
    
    def test_api_alerts_exists(self):
        """Test the alerts API endpoint exists."""
        response = self.client.get('/api/alerts')
        self.assertEqual(response.status_code, 200)

if __name__ == '__main__':
    unittest.main()
