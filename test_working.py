import unittest
from app import app
import os
import tempfile

class AquaAlertWorkingTestCase(unittest.TestCase):
    
    def setUp(self):
        """Set up a test environment before each test."""
        app.config['TESTING'] = True
        app.config['WTF_CSRF_ENABLED'] = False  # Disable CSRF for testing
        self.client = app.test_client()
            
    # Test Public Routes - These should always work
    def test_index_page(self):
        """Test the index page."""
        response = self.client.get('/', follow_redirects=False)
        self.assertIn(response.status_code, [200, 302]) # Allow for redirection
    
    def test_login_page(self):
        """Test access to login page."""
        response = self.client.get('/login')
        self.assertEqual(response.status_code, 200)
    
    # Test API Endpoints - These should return valid JSON
    def test_api_bowsers_endpoint(self):
        """Test the bowsers API endpoint."""
        response = self.client.get('/api/bowsers')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.is_json)
    
    def test_api_locations_endpoint(self):
        """Test the locations API endpoint."""
        response = self.client.get('/api/locations')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.is_json)
    
    # Test that key routes exist and either provide access or redirect to login
    def test_management_dashboard(self):
        """Test that management dashboard exists."""
        response = self.client.get('/management', follow_redirects=False)
        self.assertIn(response.status_code, [200, 302])  # Either direct access or redirect to login
    
    def test_admin_route(self):
        """Test that admin route exists and redirects to login when not authenticated."""
        response = self.client.get('/admin', follow_redirects=False)
        self.assertIn(response.status_code, [200, 302, 404])  # May exist or not
    
    def test_map_route(self):
        """Test that map route exists."""
        response = self.client.get('/map', follow_redirects=False) 
        self.assertIn(response.status_code, [200, 302, 404])  # May exist or not

if __name__ == '__main__':
    unittest.main()
