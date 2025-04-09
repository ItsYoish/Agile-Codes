import unittest
from app import app
import json

class FinancialAPITestCase(unittest.TestCase):
    
    def setUp(self):
        """Set up a test environment before each test."""
        app.config['TESTING'] = True
        app.config['WTF_CSRF_ENABLED'] = False  # Disable CSRF for testing
        self.client = app.test_client()
            
    # Test API Endpoints
    def test_api_schemes_endpoint_exists(self):
        """Test that the mutual aid schemes API endpoint exists."""
        response = self.client.get('/api/mutual-aid/schemes')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.is_json)
    
    def test_api_transactions_endpoint_exists(self):
        """Test that the mutual aid transactions API endpoint exists."""
        response = self.client.get('/api/mutual-aid/transactions')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.is_json)
    
    def test_api_invoices_endpoint_exists(self):
        """Test that the invoices API endpoint exists."""
        response = self.client.get('/api/invoices')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.is_json)
    
    def test_api_partners_endpoint_exists(self):
        """Test that the partners API endpoint exists."""
        response = self.client.get('/api/partners')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.is_json)
    
    def test_export_data_endpoint_exists(self):
        """Test that the export data API endpoint exists."""
        response = self.client.get('/api/export/invoices')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.is_json)
    
    # Test Financial Pages
    def test_finance_page_exists(self):
        """Test that the finance page exists (may redirect to login)."""
        response = self.client.get('/finance', follow_redirects=False)
        self.assertIn(response.status_code, [200, 302])  # Either direct access or redirect to login

if __name__ == '__main__':
    unittest.main()
