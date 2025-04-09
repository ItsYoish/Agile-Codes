#!/usr/bin/env python
"""
Test Runner for AquaAlert Water Bowser Management System
This script runs automated tests for the application
"""

import unittest
import sys
import os
from colorama import init, Fore, Style

# Initialize colorama for colored terminal output
init()

def run_tests(pattern='test_*.py'):
    """
    Run tests that match the given pattern
    
    Args:
        pattern (str): Pattern to match test files, defaults to 'test_*.py'
    """
    print(Fore.CYAN + "\n=== AquaAlert Emergency Water Bowser Management System Tests ===" + Style.RESET_ALL)
    print(Fore.YELLOW + f"Running automated tests matching pattern: {pattern}" + Style.RESET_ALL)
    
    # Add the current directory to the path so we can import the application
    sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
    
    # Load all tests matching the pattern
    if pattern.endswith('.py'):
        # If it's a specific file, load it directly
        if os.path.exists(pattern):
            test_suite = unittest.TestLoader().discover('.', pattern=pattern)
        else:
            print(Fore.RED + f"Test file {pattern} not found!" + Style.RESET_ALL)
            return 1
    else:
        # Otherwise, use the pattern for discovery
        test_suite = unittest.TestLoader().discover('.', pattern=pattern)
    
    # Run the tests
    result = unittest.TextTestRunner(verbosity=2).run(test_suite)
    
    # Print summary
    if result.wasSuccessful():
        print(Fore.GREEN + "\n✓ All tests passed successfully!" + Style.RESET_ALL)
        return 0
    else:
        print(Fore.RED + f"\n✗ Tests failed: {len(result.failures)} failures, {len(result.errors)} errors" + Style.RESET_ALL)
        return 1
    
def run_flask_app():
    """
    Run the Flask application for manual testing
    """
    print(Fore.CYAN + "\n=== Starting AquaAlert Flask Application ===" + Style.RESET_ALL)
    print(Fore.YELLOW + "Starting Flask development server for manual testing..." + Style.RESET_ALL)
    print(Fore.YELLOW + "Press CTRL+C to stop the server" + Style.RESET_ALL)
    
    try:
        from app import app
        app.run(debug=True)
    except KeyboardInterrupt:
        print(Fore.YELLOW + "\nServer stopped by user" + Style.RESET_ALL)
    except Exception as e:
        print(Fore.RED + f"\nError starting server: {e}" + Style.RESET_ALL)
        return 1
    
    return 0

def run_specific_tests():
    """
    Run specific test categories based on command line arguments
    """
    categories = {
        'core': 'test_working.py',
        'basic': 'test_basic.py',
        'financial': 'test_financial.py',
        'locations': 'test_locations.py',
        'deployments': 'test_deployments.py',
        'all': 'test_*.py'
    }
    
    print(Fore.CYAN + "\n=== AquaAlert Test Categories ===" + Style.RESET_ALL)
    for category, pattern in categories.items():
        print(f"- {category}: {pattern}")
    
    category = input(Fore.YELLOW + "\nEnter test category to run (default: all): " + Style.RESET_ALL).strip().lower()
    
    if not category:
        category = 'all'
        
    if category in categories:
        return run_tests(categories[category])
    else:
        print(Fore.RED + f"Unknown category: {category}" + Style.RESET_ALL)
        return 1

if __name__ == "__main__":
    if len(sys.argv) > 1:
        if sys.argv[1] == "run":
            sys.exit(run_flask_app())
        elif sys.argv[1] == "specific":
            sys.exit(run_specific_tests())
        elif sys.argv[1] in ["core", "basic", "financial", "locations", "deployments"]:
            categories = {
                'core': 'test_working.py',
                'basic': 'test_basic.py',
                'financial': 'test_financial.py',
                'locations': 'test_locations.py',
                'deployments': 'test_deployments.py'
            }
            sys.exit(run_tests(categories[sys.argv[1]]))
    else:
        sys.exit(run_tests())
