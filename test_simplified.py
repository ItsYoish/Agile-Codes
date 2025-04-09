import unittest
from app import app, db, User
import os
import tempfile
from flask import url_for

class AquaAlertBasicTests(unittest.TestCase):
    
    def setUp(self):
        """Set up a test environment before each test."""
        app.config['TESTING'] = True
        app.config['WTF_CSRF_ENABLED'] = False  # Disable CSRF for testing
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.client = app.test_client()
        
        with app.app_context():
            db.create_all()
            # Create test admin user
            admin = User(username='testadmin', email='admin@test.com', role='admin')
            admin.set_password('password123')
            db.session.add(admin)
            
            # Create test staff user
            staff = User(username='teststaff', email='staff@test.com', role='staff')
            staff.set_password('password123')
            db.session.add(staff)
            
            db.session.commit()
    
    def tearDown(self):
        """Clean up after each test."""
        with app.app_context():
            db.session.remove()
            db.drop_all()
    
    # Test public routes
    def test_home_page_redirect(self):
        """Test the home page redirects to public map."""
        response = self.client.get('/', follow_redirects=True)
        self.assertEqual(response.status_code, 200)
        # After redirect, should be at public map
        self.assertIn(b'Emergency Water Supply', response.data)
    
    # Test authentication
    def test_login_page(self):
        """Test the login page loads."""
        response = self.client.get('/login')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Login', response.data)
    
    def test_valid_login(self):
        """Test login with valid credentials."""
        response = self.client.post('/login', 
            data=dict(username='testadmin', password='password123'),
            follow_redirects=True)
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Welcome back', response.data)
    
    def test_invalid_login(self):
        """Test login with invalid credentials."""
        response = self.client.post('/login', 
            data=dict(username='testadmin', password='wrongpassword'),
            follow_redirects=True)
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Invalid username or password', response.data)
    
    def test_logout(self):
        """Test logout functionality."""
        # First login
        self.client.post('/login', 
            data=dict(username='testadmin', password='password123'))
        
        # Then logout
        response = self.client.get('/logout', follow_redirects=True)
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'logged out', response.data.lower())
    
    # Test protected routes
    def test_protected_route_redirect(self):
        """Test that protected routes redirect to login."""
        response = self.client.get('/management', follow_redirects=True)
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'login', response.data.lower())
    
    def test_admin_access(self):
        """Test admin access to admin pages."""
        # Login as admin
        self.client.post('/login', 
            data=dict(username='testadmin', password='password123'))
        
        # Access admin page - use the actual route defined in app.py
        response = self.client.get('/admin/users')
        self.assertEqual(response.status_code, 200)
    
    def test_staff_access(self):
        """Test staff access to staff pages."""
        # Login as staff
        self.client.post('/login', 
            data=dict(username='teststaff', password='password123'))
        
        # Access staff page
        response = self.client.get('/management')
        self.assertEqual(response.status_code, 200)

if __name__ == '__main__':
    unittest.main()
