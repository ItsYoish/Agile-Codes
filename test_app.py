import unittest
from app import app, db, User, Bowser, Location, Maintenance, Invoice
import os
import tempfile
from datetime import datetime, timedelta

class AquaAlertTestCase(unittest.TestCase):
    
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
            self._create_test_maintenance()
            self._create_test_invoices()
            
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
        bowser1 = Bowser(number='B001', capacity=5000, status='active')
        bowser2 = Bowser(number='B002', capacity=10000, status='maintenance')
        
        db.session.add(bowser1)
        db.session.add(bowser2)
        db.session.commit()
        
    def _create_test_locations(self):
        """Create test locations."""
        location1 = Location(
            name='Town Center', 
            address='123 Main St, Townsville',
            latitude=51.5074,
            longitude=-0.1278,
            location_type='urban'
        )
        location2 = Location(
            name='Rural Village', 
            address='1 Farm Road, Countryside',
            latitude=52.5074,
            longitude=-1.1278,
            location_type='rural'
        )
        
        db.session.add(location1)
        db.session.add(location2)
        db.session.commit()
        
    def _create_test_maintenance(self):
        """Create test maintenance records."""
        bowser = Bowser.query.filter_by(number='B001').first()
        
        maintenance = Maintenance(
            bowser_id=bowser.id,
            maintenance_type='inspection',
            scheduled_date=datetime.now() + timedelta(days=7),
            status='scheduled',
            notes='Regular inspection'
        )
        
        db.session.add(maintenance)
        db.session.commit()
        
    def _create_test_invoices(self):
        """Create test invoices."""
        invoice = Invoice(
            invoice_number='INV001',
            client='Townsville Council',
            amount=5000.00,
            issue_date=datetime.now(),
            due_date=datetime.now() + timedelta(days=30),
            status='unpaid'
        )
        
        db.session.add(invoice)
        db.session.commit()
        
    # Test Routes - Public
    def test_public_home(self):
        """Test the public home page."""
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)
        
    def test_public_map(self):
        """Test the public map page."""
        response = self.client.get('/public_map')
        self.assertEqual(response.status_code, 200)
    
    # Test Authentication
    def test_login_valid(self):
        """Test login with valid credentials."""
        response = self.client.post('/login', data={
            'username': 'admin',
            'password': 'password'
        }, follow_redirects=True)
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Welcome back', response.data)
        
    def test_login_invalid(self):
        """Test login with invalid credentials."""
        response = self.client.post('/login', data={
            'username': 'admin',
            'password': 'wrongpassword'
        }, follow_redirects=True)
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Invalid username or password', response.data)
        
    def test_logout(self):
        """Test logout functionality."""
        # First login
        self.client.post('/login', data={
            'username': 'admin',
            'password': 'password'
        })
        # Then logout
        response = self.client.get('/logout', follow_redirects=True)
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'You have been logged out', response.data)
        
    # Test Staff Routes (requires login)
    def test_management_authenticated(self):
        """Test access to management with authentication."""
        # Login as staff
        self.client.post('/login', data={
            'username': 'staff',
            'password': 'password'
        })
        # Access management page
        response = self.client.get('/management')
        self.assertEqual(response.status_code, 200)
        
    def test_management_unauthenticated(self):
        """Test access to management without authentication."""
        response = self.client.get('/management', follow_redirects=True)
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Please log in', response.data)
        
    # Test Admin Routes (requires admin login)
    def test_admin_users_as_admin(self):
        """Test access to admin users page as admin."""
        # Login as admin
        self.client.post('/login', data={
            'username': 'admin',
            'password': 'password'
        })
        # Access admin users page
        response = self.client.get('/admin/users')
        self.assertEqual(response.status_code, 200)
        
    def test_admin_users_as_staff(self):
        """Test access to admin users page as staff (should be restricted)."""
        # Login as staff
        self.client.post('/login', data={
            'username': 'staff',
            'password': 'password'
        })
        # Try to access admin users page
        response = self.client.get('/admin/users', follow_redirects=True)
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'You do not have permission', response.data)
        
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

if __name__ == '__main__':
    unittest.main()
