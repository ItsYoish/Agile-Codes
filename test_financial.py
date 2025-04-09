import unittest
from app import app, db, User, MutualAidScheme, Partner, Invoice
import os
import tempfile
from datetime import datetime, timedelta
import json

class FinancialModuleTestCase(unittest.TestCase):
    
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
            self._create_test_schemes()
            self._create_test_partners()
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
    
    def _create_test_schemes(self):
        """Create test mutual aid schemes."""
        scheme1 = MutualAidScheme(
            name='Test Emergency Fund',
            start_date=datetime.now().date(),
            end_date=(datetime.now() + timedelta(days=365)).date(),
            contribution_amount=500.00,
            balance=2500.00,
            status='active',
            notes='Test mutual aid scheme'
        )
        
        scheme2 = MutualAidScheme(
            name='Test Community Fund',
            start_date=datetime.now().date(),
            end_date=None,
            contribution_amount=250.00,
            balance=1000.00,
            status='active',
            notes='Test community scheme'
        )
        
        db.session.add(scheme1)
        db.session.add(scheme2)
        db.session.commit()
    
    def _create_test_partners(self):
        """Create test partners."""
        partner1 = Partner(
            name='Test Water Company',
            contact_person='John Smith',
            email='john@testwater.com',
            phone='123-456-7890',
            balance=1500.00,
            partnership_start=datetime.now().date(),
            status='active',
            notes='Test partner'
        )
        
        partner2 = Partner(
            name='Test Utility Corp',
            contact_person='Jane Doe',
            email='jane@testutility.com',
            phone='987-654-3210',
            balance=-500.00,
            partnership_start=datetime.now().date(),
            status='active',
            notes='Test partner with negative balance'
        )
        
        db.session.add(partner1)
        db.session.add(partner2)
        db.session.commit()
    
    def _create_test_invoices(self):
        """Create test invoices."""
        invoice1 = Invoice(
            invoice_number='TEST-001',
            client_name='Test Client 1',
            issue_date=datetime.now().date(),
            due_date=(datetime.now() + timedelta(days=30)).date(),
            amount=1000.00,
            status='pending',
            notes='Test invoice 1'
        )
        
        invoice2 = Invoice(
            invoice_number='TEST-002',
            client_name='Test Client 2',
            issue_date=datetime.now().date(),
            due_date=(datetime.now() + timedelta(days=30)).date(),
            amount=2000.00,
            status='paid',
            notes='Test invoice 2'
        )
        
        db.session.add(invoice1)
        db.session.add(invoice2)
        db.session.commit()
    
    # Test Financial Management Routes
    def test_finance_page_access(self):
        """Test access to finance page with authentication."""
        # Login as admin
        self.client.post('/login', data={
            'username': 'admin',
            'password': 'password'
        })
        # Access finance page
        response = self.client.get('/finance')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Financial Management', response.data)
    
    def test_finance_page_unauthenticated(self):
        """Test access to finance page without authentication."""
        response = self.client.get('/finance', follow_redirects=True)
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Please log in', response.data)
    
    # Test API Endpoints
    def test_api_schemes(self):
        """Test the mutual aid schemes API endpoint."""
        response = self.client.get('/api/schemes')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(len(data), 2)  # We created 2 test schemes
    
    def test_api_partners(self):
        """Test the partners API endpoint."""
        response = self.client.get('/api/partners')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(len(data), 2)  # We created 2 test partners
    
    def test_api_invoices(self):
        """Test the invoices API endpoint."""
        response = self.client.get('/api/invoices')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(len(data), 2)  # We created 2 test invoices
    
    # Test CRUD Operations
    def test_create_invoice(self):
        """Test creating a new invoice."""
        # Login as admin
        self.client.post('/login', data={
            'username': 'admin',
            'password': 'password'
        })
        
        # Create new invoice
        new_invoice = {
            'invoice_number': 'TEST-003',
            'client_name': 'Test Client 3',
            'issue_date': datetime.now().strftime('%Y-%m-%d'),
            'due_date': (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d'),
            'amount': 3000.00,
            'status': 'draft',
            'notes': 'Test invoice creation'
        }
        
        response = self.client.post('/api/invoices', 
                                   data=json.dumps(new_invoice),
                                   content_type='application/json')
        self.assertEqual(response.status_code, 201)
        
        # Verify it was created
        response = self.client.get('/api/invoices')
        data = response.get_json()
        self.assertEqual(len(data), 3)  # Now we should have 3 invoices
    
    def test_update_partner(self):
        """Test updating a partner."""
        # Login as admin
        self.client.post('/login', data={
            'username': 'admin',
            'password': 'password'
        })
        
        # Get the first partner
        response = self.client.get('/api/partners')
        partners = response.get_json()
        partner_id = partners[0]['id']
        
        # Update the partner
        updated_partner = {
            'name': 'Updated Test Water Company',
            'contact_person': 'Updated John Smith',
            'balance': 2000.00
        }
        
        response = self.client.put(f'/api/partners/{partner_id}', 
                                  data=json.dumps(updated_partner),
                                  content_type='application/json')
        self.assertEqual(response.status_code, 200)
        
        # Verify it was updated
        response = self.client.get(f'/api/partners/{partner_id}')
        data = response.get_json()
        self.assertEqual(data['name'], 'Updated Test Water Company')
        self.assertEqual(data['balance'], 2000.00)
    
    def test_delete_invoice(self):
        """Test deleting an invoice."""
        # Login as admin
        self.client.post('/login', data={
            'username': 'admin',
            'password': 'password'
        })
        
        # Get the first invoice
        response = self.client.get('/api/invoices')
        invoices = response.get_json()
        invoice_id = invoices[0]['id']
        
        # Delete the invoice
        response = self.client.delete(f'/api/invoices/{invoice_id}')
        self.assertEqual(response.status_code, 200)
        
        # Verify it was deleted
        response = self.client.get('/api/invoices')
        data = response.get_json()
        self.assertEqual(len(data), 1)  # Now we should have 1 invoice

if __name__ == '__main__':
    unittest.main()
