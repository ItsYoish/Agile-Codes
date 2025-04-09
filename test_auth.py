import unittest
from app import app, db, User
from werkzeug.security import generate_password_hash
from flask_login import current_user
from datetime import datetime

class TestConfig:
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    WTF_CSRF_ENABLED = False
    SECRET_KEY = 'test-secret-key'

class AuthenticationTest(unittest.TestCase):
    def setUp(self):
        app.config.from_object(TestConfig)
        self.client = app.test_client()
        self.app_context = app.app_context()
        
        with app.app_context():
            # Create test database and tables
            db.create_all()
            
            # Create test users
            admin_user = User(
                username='admin_test',
                email='admin@test.com',
                role='admin'
            )
            admin_user.set_password('adminpass')
            
            staff_user = User(
                username='staff_test',
                email='staff@test.com',
                role='staff'
            )
            staff_user.set_password('staffpass')
            
            db.session.add(admin_user)
            db.session.add(staff_user)
            db.session.commit()

    def tearDown(self):
        with app.app_context():
            db.session.remove()
            db.drop_all()

    # Public Access Tests
    def test_public_routes(self):
        """Test that public routes are accessible without authentication"""
        routes = ['/public_map']
        for route in routes:
            response = self.client.get(route)
            self.assertEqual(response.status_code, 200, f"Public route {route} failed")
        
        # Root route should redirect to public_map for unauthenticated users
        response = self.client.get('/')
        self.assertEqual(response.status_code, 302)
        self.assertTrue('/public_map' in response.location)

    # Authentication Tests
    def test_login_success(self):
        """Test successful login for both admin and staff"""
        test_cases = [
            {'username': 'admin_test', 'password': 'adminpass', 'expected_redirect': '/finance'},
            {'username': 'staff_test', 'password': 'staffpass', 'expected_redirect': '/management'}
        ]
        
        for case in test_cases:
            # First logout if logged in
            self.client.get('/logout')
            
            # Try login
            response = self.client.post('/login', data={
                'username': case['username'],
                'password': case['password']
            }, follow_redirects=False)
            
            self.assertEqual(response.status_code, 302)
            self.assertTrue(case['expected_redirect'] in response.location)

    def test_login_failure(self):
        """Test login with invalid credentials"""
        response = self.client.post('/login', data={
            'username': 'fake_user',
            'password': 'wrongpass'
        }, follow_redirects=True)
        self.assertEqual(response.status_code, 200)
        # Should check for error message

    # Staff Access Tests
    def test_staff_routes(self):
        """Test staff route access with and without authentication"""
        routes = ['/management', '/maintenance', '/manage_locations']
        
        # First try without authentication
        for route in routes:
            response = self.client.get(route)
            self.assertEqual(response.status_code, 302)  # Should redirect to login
        
        # Login as staff
        self.client.post('/login', data={
            'username': 'staff_test',
            'password': 'staffpass'
        })
        
        # Try routes with staff authentication
        for route in routes:
            response = self.client.get(route)
            self.assertEqual(response.status_code, 200, f"Staff route {route} failed")

    # Admin Access Tests
    def test_admin_routes(self):
        """Test admin route access with different authentication levels"""
        admin_routes = ['/admin_users', '/finance', '/admin_reports']
        
        # Try without authentication
        for route in admin_routes:
            response = self.client.get(route)
            self.assertEqual(response.status_code, 302)  # Should redirect to login
        
        # Try with staff authentication
        self.client.post('/login', data={
            'username': 'staff_test',
            'password': 'staffpass'
        })
        for route in admin_routes:
            response = self.client.get(route)
            self.assertEqual(response.status_code, 302)  # Should redirect to login
        
        # Logout staff user
        self.client.get('/logout')
        
        # Try with admin authentication
        self.client.post('/login', data={
            'username': 'admin_test',
            'password': 'adminpass'
        })
        for route in admin_routes:
            response = self.client.get(route)
            self.assertEqual(response.status_code, 200, f"Admin route {route} failed")

    def test_logout(self):
        """Test logout functionality"""
        # First login
        self.client.post('/login', data={
            'username': 'admin_test',
            'password': 'adminpass'
        })
        
        # Then logout
        response = self.client.get('/logout', follow_redirects=True)
        self.assertEqual(response.status_code, 200)
        # Should check that user is redirected to login page

if __name__ == '__main__':
    unittest.main()
