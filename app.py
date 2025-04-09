from flask import Flask, render_template, request, jsonify, send_from_directory, redirect, url_for, flash, session
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from urllib.parse import urlparse
from functools import wraps
from datetime import datetime, timedelta
from random import randint
import os
from dotenv import load_dotenv

load_dotenv()  # Load environment variables from .env file

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'a_super_secret_key_for_dev_change_me') # Needed for sessions

# Database configuration - use environment variable or default
DATABASE_URL = os.environ.get('DATABASE_URL', 'sqlite:///aquaalert.db')
app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
migrate = Migrate(app, db)

# --- Flask-Login Setup ---
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login' # Redirect to 'login' view if user tries to access protected page
login_manager.login_message = "Please log in to access this page."
login_manager.login_message_category = 'info' # Flash message category

# User loader is defined below with more detailed comments

# --- Database Models ---

# User Model for Authentication
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False) # Increased length for stronger hashes potentially
    # Roles: 'admin', 'staff'. Public users are simply not logged in.
    role = db.Column(db.String(20), nullable=False, default='staff') 

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def __repr__(self):
        return f'<User {self.username} ({self.role})>'

# Database Models
class Bowser(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    number = db.Column(db.String(20), nullable=False)
    capacity = db.Column(db.Integer, nullable=False)
    current_level = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(20), nullable=False)
    owner = db.Column(db.String(100))
    last_maintenance = db.Column(db.Date)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Location(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    address = db.Column(db.String(200))
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    type = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Maintenance(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    bowser_id = db.Column(db.Integer, db.ForeignKey('bowser.id'), nullable=False)
    scheduled_date = db.Column(db.Date, nullable=False)
    type = db.Column(db.String(50))
    description = db.Column(db.Text)
    status = db.Column(db.String(20), default='scheduled')
    assigned_to = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    bowser = db.relationship('Bowser', backref=db.backref('maintenance_records', lazy=True))

class Deployment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    bowser_id = db.Column(db.Integer, db.ForeignKey('bowser.id'), nullable=False)
    location_id = db.Column(db.Integer, db.ForeignKey('location.id'), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date)
    status = db.Column(db.String(20), default='active')
    priority = db.Column(db.String(20), default='normal')  # 'low', 'normal', 'high', 'emergency'
    emergency_reason = db.Column(db.Text)  # Reason for emergency priority
    population_affected = db.Column(db.Integer)  # Estimated number of people affected
    expected_duration = db.Column(db.Integer)  # Expected duration in days
    alternative_sources = db.Column(db.Boolean, default=False)  # Are alternative water sources available?
    vulnerability_index = db.Column(db.Integer, default=0)  # 0-10 vulnerability score
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    bowser = db.relationship('Bowser', backref=db.backref('deployments', lazy=True))
    location = db.relationship('Location', backref=db.backref('deployments', lazy=True))
    
    @property
    def priority_score(self):
        """Calculate emergency priority score based on various factors"""
        # Start with base score based on priority level
        base_score = {
            'low': 10,
            'normal': 30,
            'high': 60,
            'emergency': 90
        }.get(self.priority, 30)
        
        # Add points for population affected (1 point per 100 people)
        population_score = min(50, (self.population_affected or 0) // 100)
        
        # Add vulnerability index points (0-10)
        vulnerability_score = self.vulnerability_index or 0
        
        # Subtract points if alternative sources are available
        alternative_penalty = -15 if self.alternative_sources else 0
        
        # Calculate total score (capped at 100)
        total = min(100, base_score + population_score + vulnerability_score + alternative_penalty)
        
        return total

class Invoice(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    invoice_number = db.Column(db.String(50), nullable=False, unique=True)
    client_name = db.Column(db.String(100), nullable=False)
    issue_date = db.Column(db.Date, nullable=False)
    due_date = db.Column(db.Date, nullable=False)
    amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default='pending')  # 'pending', 'paid', 'overdue'
    deployment_id = db.Column(db.Integer, db.ForeignKey('deployment.id'))
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    deployment = db.relationship('Deployment', backref=db.backref('invoices', lazy=True))

class MutualAidScheme(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date)
    contribution_amount = db.Column(db.Float, nullable=False)
    balance = db.Column(db.Float, default=0.0)
    status = db.Column(db.String(20), default='active')  # 'active', 'inactive', 'pending'
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class MutualAidContribution(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    scheme_id = db.Column(db.Integer, db.ForeignKey('mutual_aid_scheme.id'), nullable=False)
    contributor_name = db.Column(db.String(100), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    contribution_date = db.Column(db.Date, nullable=False)
    receipt_number = db.Column(db.String(50))
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    scheme = db.relationship('MutualAidScheme', backref=db.backref('contributions', lazy=True))

class Partner(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    contact_person = db.Column(db.String(100))
    email = db.Column(db.String(100))
    phone = db.Column(db.String(20))
    balance = db.Column(db.Float, default=0.0)
    partnership_start = db.Column(db.Date)
    status = db.Column(db.String(20), default='active')  # 'active', 'inactive', 'suspended'
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Alert(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    message = db.Column(db.Text, nullable=False)
    priority = db.Column(db.String(20), default='normal')  # 'low', 'normal', 'high', 'emergency'
    status = db.Column(db.String(20), default='active')  # 'active', 'acknowledged', 'resolved'
    target_users = db.Column(db.String(100))  # 'admin', 'maintenance', 'public', 'all'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    resolved_at = db.Column(db.DateTime)

# Flask-Login User Loader Callback
@login_manager.user_loader
def load_user(user_id):
    # Since user_id is just the primary key of our user table, use it
    # to look up the user.
    return db.session.get(User, int(user_id))

# --- Access Control Decorators ---

def admin_required(f):
    # Decorator to restrict access to admin users only
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated:
            flash('Please log in to access this page.', 'info')
            return redirect(url_for('login', next=request.url))
        elif current_user.role != 'admin':
            flash('Administrator access required. You do not have sufficient permissions.', 'danger')
            return redirect(url_for('public_map'))
        return f(*args, **kwargs)
    return decorated_function

def staff_required(f):
    # Decorator to restrict access to staff and admin users
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated:
            flash('Please log in to access this page.', 'info')
            return redirect(url_for('login', next=request.url))
        elif current_user.role not in ['staff', 'admin']:
            flash('Staff access required. You do not have sufficient permissions.', 'danger')
            return redirect(url_for('public_map'))
        return f(*args, **kwargs)
    return decorated_function

# --- Routes ---

# --- Authentication Routes ---
@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        # For debugging purposes, log the current user's role
        print(f"Already authenticated as {current_user.username} with role {current_user.role}")
        return redirect(url_for('dashboard'))
    
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        user = User.query.filter_by(username=username).first()
        
        # Debug: Log the login attempt
        if user:
            print(f"Login attempt for {username}: user found with role {user.role}")
        else:
            print(f"Login attempt for {username}: user not found")
        
        if user and user.check_password(password):
            login_user(user)
            next_page = request.args.get('next')
            
            # Validate the next page to prevent redirect loops
            if next_page:
                # Parse the URL to extract the endpoint
                parsed_url = urlparse(next_page)
                path = parsed_url.path
                
                # If the next page requires staff/admin privileges but user doesn't have them
                # redirect to dashboard instead to avoid loops
                if (('management' in path or 'admin' in path) and 
                    user.role not in ['staff', 'admin']):
                    next_page = url_for('dashboard')
                    flash('You were redirected to an appropriate page based on your permissions.', 'info')
            
            if not next_page or urlparse(next_page).netloc != '':
                next_page = url_for('dashboard')
                
            flash(f'Welcome back, {user.username}!', 'success')
            print(f"Redirecting {username} to {next_page}")
            return redirect(next_page)
            
        flash('Invalid username or password', 'danger')
    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('You have been logged out.', 'info')
    # Redirect to the public map after logout for better user experience
    return redirect(url_for('public_map'))

# Root route to direct users based on authentication status
@app.route('/')
def index():
    # We always show the public map now as the landing page
    # No auto-redirect to staff/admin areas to avoid confusion
    print("Index: Showing public map as landing page")
    return redirect(url_for('public_map'))
    
# Separate route for authorized dashboards
@app.route('/dashboard')
@login_required
def dashboard():
    # Debug: Log which route we're redirecting to
    print(f"Dashboard: User {current_user.username} has role {current_user.role}")
    
    # Redirect to appropriate dashboard based on user role
    if current_user.role == 'admin':
        print(f"Redirecting {current_user.username} to finance dashboard")
        return redirect(url_for('finance'))  # Admin dashboard
    elif current_user.role == 'staff':
        print(f"Redirecting {current_user.username} to management dashboard")
        return redirect(url_for('management'))  # Staff dashboard
    else:
        # Fallback for unknown roles - redirect to public map to avoid loops
        print(f"WARNING: Unknown role '{current_user.role}' for {current_user.username}, redirecting to public map")
        flash('Your account does not have any assigned roles. Please contact an administrator.', 'warning')
        return redirect(url_for('public_map'))

# --- Public Routes (No Decorators) ---
@app.route('/public_map')
def public_map():
    """Public view of bowser locations and status"""
    bowsers = Bowser.query.all()
    locations = Location.query.all()
    return render_template('public.html', bowsers=bowsers, locations=locations)

# --- Staff Routes ---
@app.route('/management')
@staff_required
def management():
    """Staff dashboard for bowser management"""
    bowsers = Bowser.query.all()
    return render_template('management.html', bowsers=bowsers, title='Bowser Management')

@app.route('/maintenance')
@staff_required
def maintenance():
    """Maintenance scheduling and tracking"""
    maintenance_records = Maintenance.query.all()
    bowsers = Bowser.query.all()
    return render_template('maintenance.html', records=maintenance_records, bowsers=bowsers, title='Maintenance Management')

@app.route('/locations/manage')
@staff_required
def manage_locations():
    """Location management interface"""
    locations = Location.query.all()
    return render_template('locations.html', locations=locations)

# --- Admin Routes ---
@app.route('/admin/users')
@admin_required
def admin_users():
    """Admin user management"""
    users = User.query.all()
    return render_template('admin_users.html', users=users, title='User Management')

@app.route('/finance')
@admin_required
def finance():
    """Financial management interface"""
    invoices = Invoice.query.all()
    schemes = MutualAidScheme.query.all()
    return render_template('finance.html', invoices=invoices, schemes=schemes)

@app.route('/finance/invoices')
@admin_required
def manage_invoices():
    """Invoice management interface"""
    invoices = Invoice.query.order_by(Invoice.issue_date.desc()).all()
    deployments = Deployment.query.all()
    return render_template('manage_invoices.html', invoices=invoices, deployments=deployments)

@app.route('/finance/invoices/create', methods=['GET', 'POST'])
@admin_required
def create_invoice():
    """Create new invoice"""
    if request.method == 'POST':
        # Generate unique invoice number with prefix INV- and date
        invoice_number = f"INV-{datetime.now().strftime('%Y%m%d')}-{randint(1000, 9999)}"
        
        # Create new invoice from form data
        new_invoice = Invoice(
            invoice_number=invoice_number,
            client_name=request.form['client_name'],
            issue_date=datetime.strptime(request.form['issue_date'], '%Y-%m-%d').date(),
            due_date=datetime.strptime(request.form['due_date'], '%Y-%m-%d').date(),
            amount=float(request.form['amount']),
            status='pending',
            notes=request.form.get('notes', ''),
            deployment_id=int(request.form['deployment_id']) if request.form.get('deployment_id') else None
        )
        
        try:
            db.session.add(new_invoice)
            db.session.commit()
            flash('Invoice created successfully!', 'success')
            return redirect(url_for('manage_invoices'))
        except Exception as e:
            db.session.rollback()
            flash(f'Error creating invoice: {str(e)}', 'danger')
    
    # GET request - show form
    deployments = Deployment.query.filter(Deployment.end_date != None).all()
    return render_template('create_invoice.html', deployments=deployments)

@app.route('/finance/invoices/<int:invoice_id>/edit', methods=['GET', 'POST'])
@admin_required
def edit_invoice(invoice_id):
    """Edit existing invoice"""
    invoice = Invoice.query.get_or_404(invoice_id)
    
    if request.method == 'POST':
        # Update invoice from form data
        invoice.client_name = request.form['client_name']
        invoice.issue_date = datetime.strptime(request.form['issue_date'], '%Y-%m-%d').date()
        invoice.due_date = datetime.strptime(request.form['due_date'], '%Y-%m-%d').date()
        invoice.amount = float(request.form['amount'])
        invoice.status = request.form['status']
        invoice.notes = request.form.get('notes', '')
        
        try:
            db.session.commit()
            flash('Invoice updated successfully!', 'success')
            return redirect(url_for('manage_invoices'))
        except Exception as e:
            db.session.rollback()
            flash(f'Error updating invoice: {str(e)}', 'danger')
    
    # GET request - show form with invoice data
    return render_template('edit_invoice.html', invoice=invoice)

@app.route('/finance/schemes')
@admin_required
def manage_schemes():
    """Mutual Aid Scheme management interface"""
    schemes = MutualAidScheme.query.order_by(MutualAidScheme.start_date.desc()).all()
    return render_template('manage_schemes.html', schemes=schemes)

@app.route('/finance/schemes/create', methods=['GET', 'POST'])
@admin_required
def create_scheme():
    """Create new mutual aid scheme"""
    if request.method == 'POST':
        # Create new scheme from form data
        new_scheme = MutualAidScheme(
            name=request.form['name'],
            start_date=datetime.strptime(request.form['start_date'], '%Y-%m-%d').date(),
            end_date=datetime.strptime(request.form['end_date'], '%Y-%m-%d').date() if request.form.get('end_date') else None,
            contribution_amount=float(request.form['contribution_amount']),
            balance=float(request.form.get('initial_balance', 0)),
            status=request.form.get('status', 'active'),
            notes=request.form.get('notes', '')
        )
        
        try:
            db.session.add(new_scheme)
            db.session.commit()
            flash('Mutual Aid Scheme created successfully!', 'success')
            return redirect(url_for('manage_schemes'))
        except Exception as e:
            db.session.rollback()
            flash(f'Error creating scheme: {str(e)}', 'danger')
    
    # GET request - show form
    return render_template('create_scheme.html')

@app.route('/finance/schemes/<int:scheme_id>/edit', methods=['GET', 'POST'])
@admin_required
def edit_scheme(scheme_id):
    """Edit existing mutual aid scheme"""
    scheme = MutualAidScheme.query.get_or_404(scheme_id)
    
    if request.method == 'POST':
        # Update scheme from form data
        scheme.name = request.form['name']
        scheme.start_date = datetime.strptime(request.form['start_date'], '%Y-%m-%d').date()
        scheme.end_date = datetime.strptime(request.form['end_date'], '%Y-%m-%d').date() if request.form.get('end_date') else None
        scheme.contribution_amount = float(request.form['contribution_amount'])
        scheme.status = request.form['status']
        scheme.notes = request.form.get('notes', '')
        
        try:
            db.session.commit()
            flash('Mutual Aid Scheme updated successfully!', 'success')
            return redirect(url_for('manage_schemes'))
        except Exception as e:
            db.session.rollback()
            flash(f'Error updating scheme: {str(e)}', 'danger')
    
    # GET request - show form with scheme data
    return render_template('edit_scheme.html', scheme=scheme)

@app.route('/admin/reports')
@admin_required
def admin_reports():
    """Administrative reports"""
    return render_template('reports.html', title='Administrative Reports')

@app.route('/emergency/priority')
@admin_required
def emergency_priority():
    """Emergency priority management interface"""
    # Get all deployments ordered by priority score (highest first)
    deployments = Deployment.query.filter(Deployment.status == 'active').all()
    # Sort deployments by priority_score (can't use order_by since it's a property)
    deployments.sort(key=lambda d: d.priority_score, reverse=True)
    
    return render_template('emergency_priority.html', deployments=deployments)

@app.route('/emergency/priority/<int:deployment_id>', methods=['GET', 'POST'])
@admin_required
def update_priority(deployment_id):
    """Update emergency priority for a deployment"""
    deployment = Deployment.query.get_or_404(deployment_id)
    
    if request.method == 'POST':
        # Update priority and related fields
        deployment.priority = request.form['priority']
        deployment.emergency_reason = request.form.get('emergency_reason', '')
        deployment.population_affected = int(request.form.get('population_affected', 0))
        deployment.expected_duration = int(request.form.get('expected_duration', 1))
        deployment.alternative_sources = 'alternative_sources' in request.form
        deployment.vulnerability_index = int(request.form.get('vulnerability_index', 0))
        deployment.notes = request.form.get('notes', '')
        
        try:
            db.session.commit()
            flash('Emergency priority updated successfully!', 'success')
            return redirect(url_for('emergency_priority'))
        except Exception as e:
            db.session.rollback()
            flash(f'Error updating priority: {str(e)}', 'danger')
    
    # GET request - show form with deployment data
    return render_template('update_priority.html', deployment=deployment)

# API Endpoints
@app.route('/api/bowsers')
def api_bowsers():
    bowsers = Bowser.query.all()
    result = []
    for bowser in bowsers:
        result.append({
            'id': bowser.id,
            'number': bowser.number,
            'capacity': bowser.capacity,
            'currentLevel': bowser.current_level,
            'status': bowser.status,
            'owner': bowser.owner,
            'lastMaintenance': bowser.last_maintenance.isoformat() if bowser.last_maintenance else None,
            'notes': bowser.notes
        })
    return jsonify(result)

@app.route('/api/locations')
def api_locations():
    locations = Location.query.all()
    result = []
    for location in locations:
        result.append({
            'id': location.id,
            'name': location.name,
            'address': location.address,
            'coordinates': {
                'lat': location.latitude,
                'lng': location.longitude
            },
            'type': location.type
        })
    return jsonify(result)

@app.route('/api/maintenance')
def api_maintenance():
    maintenance_records = Maintenance.query.all()
    result = []
    for record in maintenance_records:
        result.append({
            'id': record.id,
            'bowserId': record.bowser_id,
            'scheduledDate': record.scheduled_date.isoformat() if record.scheduled_date else None,
            'type': record.type,
            'description': record.description,
            'status': record.status,
            'assignedTo': record.assigned_to
        })
    return jsonify(result)

@app.route('/api/deployments')
def api_deployments():
    deployment_records = Deployment.query.all()
    result = []
    for deployment in deployment_records:
        result.append({
            'id': deployment.id,
            'bowserId': deployment.bowser_id,
            'locationId': deployment.location_id,
            'startDate': deployment.start_date.isoformat() if deployment.start_date else None,
            'endDate': deployment.end_date.isoformat() if deployment.end_date else None,
            'status': deployment.status,
            'priority': deployment.priority,
            'notes': deployment.notes
        })
    return jsonify(result)

# --- Staff & Admin Routes ---

# --- Admin Only Routes ---





# --- User Management Routes ---

@app.route('/admin/create-user', methods=['GET', 'POST'])
@admin_required
def create_user():
    # Only admins can create new users
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        role = request.form.get('role')
        
        # Validate input
        if not username or not email or not password or not role:
            flash('All fields are required.', 'warning')
            return redirect(url_for('create_user'))
            
        # Check if username or email already exists
        if User.query.filter_by(username=username).first():
            flash('Username already exists.', 'danger')
            return redirect(url_for('create_user'))
            
        if User.query.filter_by(email=email).first():
            flash('Email already exists.', 'danger')
            return redirect(url_for('create_user'))
        
        # Create new user
        user = User(username=username, email=email, role=role)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        
        flash(f'User {username} created successfully.', 'success')
        return redirect(url_for('admin_users'))
        
    return render_template('create_user.html', title='Create User')

# --- Initial Setup ---

def create_admin_user():
    # Non-route function to create admin during startup
    admin = User.query.filter_by(username='admin').first()
    if not admin:
        admin = User(
            username='admin',
            email='admin@aquaalert.com',
            role='admin'
        )
        admin.set_password('admin123')
        db.session.add(admin)
        db.session.commit()
        print('Admin user created successfully!')
    else:
        print('Admin user already exists.')
        
def create_staff_user():
    # Create a staff user for testing
    staff = User.query.filter_by(username='staff').first()
    if not staff:
        staff = User(
            username='staff',
            email='staff@aquaalert.com',
            role='staff'
        )
        staff.set_password('staff123')
        db.session.add(staff)
        db.session.commit()
        print('Staff user created successfully!')
    else:
        print('Staff user already exists.')

def create_standard_user():
    # Create a standard user for testing
    user = User.query.filter_by(username='user123').first()
    if not user:
        user = User(
            username='user123',
            email='user123@example.com',
            role='staff'  # Assign staff role to ensure they can access appropriate pages
        )
        user.set_password('password123')
        db.session.add(user)
        db.session.commit()
        print('Standard user (user123) created successfully!')
    else:
        print('Standard user already exists.')
        
    # Also create a regular user without staff privileges for testing
    regular_user = User.query.filter_by(username='user').first()
    if not regular_user:
        regular_user = User(
            username='user',
            email='user@example.com',
            role='user'  # A regular user without staff privileges
        )
        regular_user.set_password('password')
        db.session.add(regular_user)
        db.session.commit()
        print('Regular user (user) created successfully!')
    else:
        print('Regular user already exists.')

# Initialize database with sample data
def init_db():
    db.drop_all()  # Drop all tables
    db.create_all()  # Create all tables
    print("Forcing database reset...")
    
    # Create admin, staff, and standard user
    print("Creating admin user...")
    create_admin_user()
    create_staff_user()
    create_standard_user()  # Add regular user for testing
    print("Users created successfully!")
    print("Creating initial sample data...")
    # Sample data for initial testing
    # Add bowsers
    bowsers = [
        Bowser(number="BWS001", capacity=5000, current_level=4500, status="active", owner="North Region"),
        Bowser(number="BWS002", capacity=7500, current_level=7000, status="active", owner="East Region"),
        Bowser(number="BWS003", capacity=5000, current_level=2500, status="maintenance", owner="West Region"),
        Bowser(number="BWS004", capacity=10000, current_level=9500, status="active", owner="South Region"),
        Bowser(number="BWS005", capacity=5000, current_level=4800, status="active", owner="North Region")
    ]
    db.session.add_all(bowsers)
    
    # Add locations
    locations = [
        Location(name="City Hospital", address="123 Medical Road", latitude=51.5074, longitude=-0.1278, type="healthcare"),
        Location(name="Central Fire Station", address="456 Emergency Ave", latitude=51.5124, longitude=-0.1300, type="emergency"),
        Location(name="Riverside Apartments", address="789 River View", latitude=51.5154, longitude=-0.1240, type="residential"),
        Location(name="Shopping Center", address="101 High Street", latitude=51.5184, longitude=-0.1220, type="commercial"),
        Location(name="Community Center", address="202 Main Street", latitude=51.5134, longitude=-0.1260, type="community")
    ]
    db.session.add_all(locations)
    
    # Add deployments
    today = datetime.now().date()
    deployments = [
        Deployment(bowser_id=1, location_id=1, start_date=today, status="active", priority="high", notes="Critical healthcare facility"),
        Deployment(bowser_id=2, location_id=2, start_date=today, status="active", priority="emergency", notes="Emergency services"),
        Deployment(bowser_id=4, location_id=4, start_date=today, status="active", priority="normal", notes="Commercial area"),
        Deployment(bowser_id=5, location_id=5, start_date=today, status="active", priority="normal", notes="Community support")
    ]
    db.session.add_all(deployments)
    
    # Add maintenance records
    maintenance_records = [
        Maintenance(bowser_id=3, scheduled_date=today, type="repair", description="Valve replacement", status="in-progress", assigned_to="John Smith"),
        Maintenance(bowser_id=1, scheduled_date=today + datetime.timedelta(days=7), type="inspection", description="Regular inspection", status="scheduled", assigned_to="Sarah Johnson"),
        Maintenance(bowser_id=2, scheduled_date=today + datetime.timedelta(days=14), type="service", description="Annual service", status="scheduled", assigned_to="Mike Brown"),
        Maintenance(
            bowser_id=bowser_objects[0].id,
            scheduled_date=datetime.strptime('2025-05-01', '%Y-%m-%d').date(),
            type='routine',
            description='Quarterly maintenance check',
            status='scheduled',
            assigned_to='Maintenance Team A'
        ),
        Maintenance(
            bowser_id=bowser_objects[1].id,
            scheduled_date=datetime.strptime('2025-04-15', '%Y-%m-%d').date(),
            type='repair',
            description='Fix leaking valve',
            status='pending',
            assigned_to='Maintenance Team B'
        )
    ]
    for record in maintenance_records:
        db.session.add(record)
    
    # Add sample deployment
    sample_deployment = Deployment(
        bowser_id=bowser_objects[0].id,
        location_id=location_objects[0].id,
        start_date=datetime.strptime('2025-04-01', '%Y-%m-%d').date(),
        end_date=None,
        status='active',
        priority='emergency',  # Set explicit priority
        notes='Emergency water supply due to pipe burst'
    )
    db.session.add(sample_deployment)
        
    # Add another sample deployment with high priority
    high_priority_deployment = Deployment(
        bowser_id=bowser_objects[1].id, 
        location_id=location_objects[1].id, # Deploy second bowser to City Hospital
        start_date=datetime.strptime('2025-04-05', '%Y-%m-%d').date(),
        end_date=None,
        status='active',
        priority='high', # High priority deployment
        notes='Critical water supply needed for hospital wing'
    )
    db.session.add(high_priority_deployment)
        
    # Update bowser statuses to deployed
    bowser_objects[0].status = 'deployed'
    bowser_objects[1].status = 'deployed'
        
    # Add sample alerts
    alerts = [
        Alert(
            title='Emergency Deployment Needed',
            message='Water outage reported in North Region - emergency bowser deployment required',
            priority='high',
            status='active',
            target_users='admin'
        ),
        Alert(
            title='Maintenance Reminder',
            message='Scheduled maintenance for BWS002 due next week',
            priority='normal',
            status='active',
            target_users='maintenance'
        ),
        Alert(
            title='Low Water Level',
            message='Bowser BWS003 water level below 25%',
            priority='normal',
            status='active',
            target_users='all'
        )
    ]
    for alert in alerts:
        db.session.add(alert)
        
    # Add sample mutual aid schemes
    schemes = [
        MutualAidScheme(
            name='North Region Emergency Fund',
            start_date=datetime.strptime('2025-01-01', '%Y-%m-%d').date(),
            end_date=datetime.strptime('2025-12-31', '%Y-%m-%d').date(),
            contribution_amount=500.00,
            balance=2500.00,
            status='active',
            notes='Mutual aid scheme for emergency water supply in North Region'
        ),
        MutualAidScheme(
            name='Community Support Fund',
            start_date=datetime.strptime('2025-02-15', '%Y-%m-%d').date(),
            end_date=None,
            contribution_amount=250.00,
            balance=1250.00,
            status='active',
            notes='Ongoing community support scheme'
        )
    ]
    for scheme in schemes:
        db.session.add(scheme)
        
    # Commit to get scheme IDs
    db.session.commit()
    scheme_objects = MutualAidScheme.query.all()
        
    # Add sample contributions
    contributions = [
        MutualAidContribution(
            scheme_id=scheme_objects[0].id,
            contributor_name='North Region Council',
            amount=500.00,
            contribution_date=datetime.strptime('2025-03-01', '%Y-%m-%d').date(),
            receipt_number='CONT-001',
            notes='Monthly contribution'
        ),
        MutualAidContribution(
            scheme_id=scheme_objects[0].id,
            contributor_name='City Water Authority',
            amount=1000.00,
            contribution_date=datetime.strptime('2025-02-15', '%Y-%m-%d').date(),
            receipt_number='CONT-002',
            notes='Quarterly contribution'
        ),
        MutualAidContribution(
            scheme_id=scheme_objects[1].id,
            contributor_name='Community Center Association',
            amount=250.00,
            contribution_date=datetime.strptime('2025-03-10', '%Y-%m-%d').date(),
            receipt_number='CONT-003',
            notes='Initial contribution'
        )
    ]
    for contribution in contributions:
        db.session.add(contribution)
        
    # Add sample partners
    partners = [
        Partner(
            name='Thames Water',
            contact_person='James Smith',
            email='james.smith@thameswater.co.uk',
            phone='020 7123 4567',
            balance=2500.00,
            partnership_start=datetime.strptime('2024-01-15', '%Y-%m-%d').date(),
            status='active',
            notes='Primary water utility partner for emergency support'
        ),
        Partner(
            name='Severn Trent',
            contact_person='Emily Johnson',
            email='e.johnson@severntrent.co.uk',
            phone='0121 456 7890',
            balance=-1200.00,
            partnership_start=datetime.strptime('2024-02-20', '%Y-%m-%d').date(),
            status='active',
            notes='Regional partner for Midlands area'
        ),
        Partner(
            name='Yorkshire Water',
            contact_person='Robert Brown',
            email='r.brown@yorkshirewater.co.uk',
            phone='0113 789 0123',
            balance=850.00,
            partnership_start=datetime.strptime('2024-03-10', '%Y-%m-%d').date(),
            status='active',
            notes='Northern region mutual aid partner'
        ),
        Partner(
            name='United Utilities',
            contact_person='Sarah Wilson',
            email='s.wilson@unitedutilities.co.uk',
            phone='0161 234 5678',
            balance=1300.00,
            partnership_start=datetime.strptime('2024-01-05', '%Y-%m-%d').date(),
            status='active',
            notes='Northwest region emergency support partner'
        )
    ]
    for partner in partners:
        db.session.add(partner)
        
    # Add sample invoices
    invoices = [
        Invoice(
            invoice_number='INV-2025-001',
            client_name='North Region Council',
            issue_date=datetime.strptime('2025-04-01', '%Y-%m-%d').date(),
            due_date=datetime.strptime('2025-05-01', '%Y-%m-%d').date(),
            amount=1500.00,
            status='pending',
            deployment_id=sample_deployment.id,
            notes='Invoice for emergency water supply services'
        ),
        Invoice(
            invoice_number='INV-2025-002',
            client_name='City Hospital',
            issue_date=datetime.strptime('2025-03-15', '%Y-%m-%d').date(),
            due_date=datetime.strptime('2025-04-15', '%Y-%m-%d').date(),
            amount=2200.00,
            status='paid',
            notes='Invoice for scheduled water delivery services'
        )
    ]
    for invoice in invoices:
        db.session.add(invoice)
        
    db.session.commit()
        
    print('Database initialized with sample data.')

def initialize_database(force_reset=False):
    """Initialize the database with sample data if it doesn't exist
    
    Args:
        force_reset (bool): If True, will drop all tables and recreate with fresh sample data
    """
    # If force reset is requested, drop all tables first
    if force_reset:
        print('Forcing database reset...')
        db.drop_all()
    
    # Create tables if they don't exist
    db.create_all()
    
    # Check if we already have data (check for bowsers)
    existing_bowsers = Bowser.query.first()
    
    # Check if users exist first
    admin_user = User.query.filter_by(username='admin').first()
    if admin_user is None:
        print('Creating admin user...')
        # Create admin user
        admin = User(
            username='admin',
            email='admin@example.com',
            role='admin'
        )
        admin.set_password('admin123')  # Set password for admin user
        db.session.add(admin)
        
        # Create staff user
        staff = User(
            username='staff',
            email='staff@example.com',
            role='staff'
        )
        staff.set_password('staff123')  # Set password for staff user
        db.session.add(staff)
        
        # Create regular user
        user = User(
            username='user',
            email='user@example.com',
            role='user'
        )
        user.set_password('user123')  # Set password for regular user
        db.session.add(user)
        
        db.session.commit()
        print('Users created successfully!')
        
    if existing_bowsers is None:
        print('Creating initial sample data...')
        
        # Add sample data
        # Create bowsers with various statuses for testing
        bowsers = [
            Bowser(
                number='BWS001',
                capacity=5000,
                current_level=5000,
                status='active',
                owner='Region North',
                last_maintenance=datetime.strptime('2025-04-07', '%Y-%m-%d').date(),
                notes='Regular maintenance completed'
            ),
            Bowser(
                number='BWS002',
                capacity=7500,
                current_level=7200,
                status='active',
                owner='Region South',
                last_maintenance=datetime.strptime('2025-03-21', '%Y-%m-%d').date(),
                notes='Scheduled maintenance in 2 weeks'
            ),
            Bowser(
                number='BWS003',
                capacity=5000,
                current_level=2500,
                status='maintenance',
                owner='Region East',
                last_maintenance=datetime.strptime('2025-03-10', '%Y-%m-%d').date(),
                notes='Currently undergoing repairs'
            ),
            Bowser(
                number='BWS004',
                capacity=10000,
                current_level=9800,
                status='active',
                owner='Region West',
                last_maintenance=datetime.strptime('2025-04-05', '%Y-%m-%d').date(),
                notes='New bowser, recently commissioned'
            ),
            Bowser(
                number='BWS005',
                capacity=7500,
                current_level=7500,
                status='standby',
                owner='Region North',
                last_maintenance=datetime.strptime('2025-04-02', '%Y-%m-%d').date(),
                notes='Ready for emergency deployment'
            ),
            Bowser(
                number='BWS006',
                capacity=5000,
                current_level=4200,
                status='active',
                owner='Region South',
                last_maintenance=datetime.strptime('2025-03-15', '%Y-%m-%d').date(),
                notes='Regular service scheduled'
            ),
            Bowser(
                number='BWS007',
                capacity=5000,
                current_level=0,
                status='out_of_service',
                owner='Region East',
                last_maintenance=datetime.strptime('2025-02-28', '%Y-%m-%d').date(),
                notes='Major repair needed - tank leak'
            )
        ]
        for bowser in bowsers:
            db.session.add(bowser)
        
        # Create locations with different types
        locations = [
            Location(
                name='North Region HQ',
                address='123 North Street',
                latitude=51.505,
                longitude=-0.09,
                type='headquarters'
            ),
            Location(
                name='City Hospital',
                address='456 Medical Drive',
                latitude=51.51,
                longitude=-0.11,
                type='healthcare'
            ),
            Location(
                name='Community Center',
                address='789 Community Road',
                latitude=51.52,
                longitude=-0.12,
                type='community'
            ),
            Location(
                name='South Water Treatment Plant',
                address='10 Industrial Way',
                latitude=51.48,
                longitude=-0.13,
                type='infrastructure'
            ),
            Location(
                name='East Region School',
                address='25 Education Lane',
                latitude=51.51,
                longitude=-0.05,
                type='education'
            ),
            Location(
                name='West Region Residential Complex',
                address='42 Housing Estate',
                latitude=51.49,
                longitude=-0.15,
                type='residential'
            ),
            Location(
                name='Emergency Response Center',
                address='112 Emergency Road',
                latitude=51.50,
                longitude=-0.10,
                type='emergency'
            )
        ]
        for location in locations:
            db.session.add(location)
        
        db.session.commit()
        
        # Add maintenance records after bowsers are committed to get IDs
        bowser_objects = Bowser.query.all()
        location_objects = Location.query.all()
        
        # Add maintenance records with various statuses and types
        maintenance_records = [
            Maintenance(
                bowser_id=bowser_objects[0].id,
                scheduled_date=datetime.strptime('2025-05-01', '%Y-%m-%d').date(),
                type='routine',
                description='Quarterly maintenance check',
                status='scheduled',
                assigned_to='Maintenance Team A'
            ),
            Maintenance(
                bowser_id=bowser_objects[1].id,
                scheduled_date=datetime.strptime('2025-04-15', '%Y-%m-%d').date(),
                type='repair',
                description='Fix leaking valve',
                status='pending',
                assigned_to='Maintenance Team B'
            ),
            Maintenance(
                bowser_id=bowser_objects[2].id,
                scheduled_date=datetime.strptime('2025-04-10', '%Y-%m-%d').date(),
                type='emergency',
                description='Replace broken pump',
                status='in_progress',
                assigned_to='Emergency Response Team'
            ),
            Maintenance(
                bowser_id=bowser_objects[3].id,
                scheduled_date=datetime.strptime('2025-04-05', '%Y-%m-%d').date(),
                type='inspection',
                description='Annual safety inspection',
                status='completed',
                assigned_to='Safety Inspector'
            ),
            Maintenance(
                bowser_id=bowser_objects[4].id,
                scheduled_date=datetime.strptime('2025-05-15', '%Y-%m-%d').date(),
                type='routine',
                description='Filter replacement',
                status='scheduled',
                assigned_to='Maintenance Team C'
            ),
            Maintenance(
                bowser_id=bowser_objects[6].id,
                scheduled_date=datetime.strptime('2025-04-12', '%Y-%m-%d').date(),
                type='major_repair',
                description='Tank replacement due to severe leak',
                status='scheduled',
                assigned_to='Specialist Repair Team'
            )
        ]
        for record in maintenance_records:
            db.session.add(record)
        
        # Add sample deployments with various priorities and statuses
        deployments = [
            Deployment(
                bowser_id=bowser_objects[0].id,
                location_id=location_objects[0].id,
                start_date=datetime.strptime('2025-04-01', '%Y-%m-%d').date(),
                end_date=None,
                status='active',
                priority='emergency',
                notes='Emergency water supply due to pipe burst'
            ),
            Deployment(
                bowser_id=bowser_objects[1].id, 
                location_id=location_objects[1].id,
                start_date=datetime.strptime('2025-04-05', '%Y-%m-%d').date(),
                end_date=None,
                status='active',
                priority='high',
                notes='Critical water supply needed for hospital wing'
            ),
            Deployment(
                bowser_id=bowser_objects[3].id,
                location_id=location_objects[2].id,
                start_date=datetime.strptime('2025-04-03', '%Y-%m-%d').date(),
                end_date=None,
                status='active',
                priority='medium',
                notes='Community center water supply'
            ),
            Deployment(
                bowser_id=bowser_objects[5].id,
                location_id=location_objects[5].id,
                start_date=datetime.strptime('2025-04-02', '%Y-%m-%d').date(),
                end_date=None,
                status='active',
                priority='low',
                notes='Scheduled water delivery for residential complex'
            ),
            Deployment(
                bowser_id=bowser_objects[4].id,
                location_id=location_objects[6].id,
                start_date=datetime.strptime('2025-04-07', '%Y-%m-%d').date(),
                end_date=None,
                status='pending',
                priority='high',
                notes='Standby deployment for emergency response center'
            ),
            # Historical deployment (completed)
            Deployment(
                bowser_id=bowser_objects[0].id,
                location_id=location_objects[3].id,
                start_date=datetime.strptime('2025-03-15', '%Y-%m-%d').date(),
                end_date=datetime.strptime('2025-03-25', '%Y-%m-%d').date(),
                status='completed',
                priority='medium',
                notes='Temporary water supply during maintenance'
            )
        ]
        
        for deployment in deployments:
            db.session.add(deployment)
        
        # Update bowser statuses to match their deployments
        bowser_objects[0].status = 'deployed'
        bowser_objects[1].status = 'deployed'
        bowser_objects[3].status = 'deployed'
        bowser_objects[5].status = 'deployed'
        
        # Add sample alerts
        alerts = [
            Alert(
                title='Emergency Deployment Needed',
                message='Water outage reported in North Region - emergency bowser deployment required',
                priority='high',
                status='active',
                target_users='admin'
            ),
            Alert(
                title='Maintenance Reminder',
                message='Scheduled maintenance for BWS002 due next week',
                priority='normal',
                status='active',
                target_users='maintenance'
            ),
            Alert(
                title='Low Water Level',
                message='Bowser BWS003 water level below 25%',
                priority='normal',
                status='active',
                target_users='all'
            )
        ]
        for alert in alerts:
            db.session.add(alert)
        
        # Add sample mutual aid schemes with various statuses
        schemes = [
            MutualAidScheme(
                name='North Region Emergency Fund',
                start_date=datetime.strptime('2025-01-01', '%Y-%m-%d').date(),
                end_date=datetime.strptime('2025-12-31', '%Y-%m-%d').date(),
                contribution_amount=500.00,
                balance=2500.00,
                status='active',
                notes='Mutual aid scheme for emergency water supply in North Region'
            ),
            MutualAidScheme(
                name='Community Support Fund',
                start_date=datetime.strptime('2025-02-15', '%Y-%m-%d').date(),
                end_date=None,
                contribution_amount=250.00,
                balance=1250.00,
                status='active',
                notes='Ongoing community support scheme'
            ),
            MutualAidScheme(
                name='South Region Drought Relief',
                start_date=datetime.strptime('2025-03-01', '%Y-%m-%d').date(),
                end_date=datetime.strptime('2025-09-30', '%Y-%m-%d').date(),
                contribution_amount=750.00,
                balance=3000.00,
                status='active',
                notes='Temporary fund for drought relief efforts'
            ),
            MutualAidScheme(
                name='East-West Collaborative Fund',
                start_date=datetime.strptime('2024-11-01', '%Y-%m-%d').date(),
                end_date=datetime.strptime('2025-10-31', '%Y-%m-%d').date(),
                contribution_amount=1000.00,
                balance=5000.00,
                status='active',
                notes='Joint fund between East and West regions'
            ),
            MutualAidScheme(
                name='Winter Emergency Fund',
                start_date=datetime.strptime('2024-12-01', '%Y-%m-%d').date(),
                end_date=datetime.strptime('2025-02-28', '%Y-%m-%d').date(),
                contribution_amount=600.00,
                balance=0.00,
                status='completed',
                notes='Fund for winter freeze emergencies - now closed'
            )
        ]
        for scheme in schemes:
            db.session.add(scheme)
        
        # Commit to get scheme IDs
        db.session.commit()
        scheme_objects = MutualAidScheme.query.all()
        
        # Note: MutualAidTransaction model not yet implemented
        # Will be added as part of the financial management module implementation
        
        # Add sample contributions
        contributions = [
            MutualAidContribution(
                scheme_id=scheme_objects[0].id,
                contributor_name='North Region Council',
                amount=500.00,
                contribution_date=datetime.strptime('2025-03-01', '%Y-%m-%d').date(),
                receipt_number='CONT-001',
                notes='Monthly contribution'
            ),
            MutualAidContribution(
                scheme_id=scheme_objects[0].id,
                contributor_name='City Water Authority',
                amount=1000.00,
                contribution_date=datetime.strptime('2025-02-15', '%Y-%m-%d').date(),
                receipt_number='CONT-002',
                notes='Quarterly contribution'
            ),
            MutualAidContribution(
                scheme_id=scheme_objects[1].id,
                contributor_name='Community Center Association',
                amount=250.00,
                contribution_date=datetime.strptime('2025-03-10', '%Y-%m-%d').date(),
                receipt_number='CONT-003',
                notes='Initial contribution'
            )
        ]
        for contribution in contributions:
            db.session.add(contribution)
        
        # Add sample partners
        partners = [
            Partner(
                name='Thames Water',
                contact_person='James Smith',
                email='james.smith@thameswater.co.uk',
                phone='020 7123 4567',
                balance=2500.00,
                partnership_start=datetime.strptime('2024-01-15', '%Y-%m-%d').date(),
                status='active',
                notes='Primary water utility partner for emergency support'
            ),
            Partner(
                name='Severn Trent',
                contact_person='Emily Johnson',
                email='e.johnson@severntrent.co.uk',
                phone='0121 456 7890',
                balance=-1200.00,
                partnership_start=datetime.strptime('2024-02-20', '%Y-%m-%d').date(),
                status='active',
                notes='Regional partner for Midlands area'
            ),
            Partner(
                name='Yorkshire Water',
                contact_person='Robert Brown',
                email='r.brown@yorkshirewater.co.uk',
                phone='0113 789 0123',
                balance=850.00,
                partnership_start=datetime.strptime('2024-03-10', '%Y-%m-%d').date(),
                status='active',
                notes='Northern region mutual aid partner'
            ),
            Partner(
                name='United Utilities',
                contact_person='Sarah Wilson',
                email='s.wilson@unitedutilities.co.uk',
                phone='0161 234 5678',
                balance=1300.00,
                partnership_start=datetime.strptime('2024-01-05', '%Y-%m-%d').date(),
                status='active',
                notes='Northwest region emergency support partner'
            )
        ]
        for partner in partners:
            db.session.add(partner)
        
        # Add sample invoices with various statuses
        invoices = [
            Invoice(
                invoice_number='INV-2025-001',
                client_name='North Region Council',
                issue_date=datetime.strptime('2025-04-01', '%Y-%m-%d').date(),
                due_date=datetime.strptime('2025-05-01', '%Y-%m-%d').date(),
                amount=1500.00,
                status='pending',
                deployment_id=deployments[0].id,
                notes='Invoice for emergency water supply services'
            ),
            Invoice(
                invoice_number='INV-2025-002',
                client_name='City Hospital',
                issue_date=datetime.strptime('2025-03-15', '%Y-%m-%d').date(),
                due_date=datetime.strptime('2025-04-15', '%Y-%m-%d').date(),
                amount=2200.00,
                status='paid',
                deployment_id=deployments[1].id,
                notes='Invoice for scheduled water delivery services'
            ),
            Invoice(
                invoice_number='INV-2025-003',
                client_name='Community Center Association',
                issue_date=datetime.strptime('2025-04-05', '%Y-%m-%d').date(),
                due_date=datetime.strptime('2025-05-05', '%Y-%m-%d').date(),
                amount=950.00,
                status='pending',
                deployment_id=deployments[2].id,
                notes='Invoice for community water supply'
            ),
            Invoice(
                invoice_number='INV-2025-004',
                client_name='West Region Housing Authority',
                issue_date=datetime.strptime('2025-04-03', '%Y-%m-%d').date(),
                due_date=datetime.strptime('2025-05-03', '%Y-%m-%d').date(),
                amount=1200.00,
                status='overdue',
                deployment_id=deployments[3].id,
                notes='Invoice for residential complex water supply'
            ),
            Invoice(
                invoice_number='INV-2025-005',
                client_name='South Water Treatment Plant',
                issue_date=datetime.strptime('2025-03-20', '%Y-%m-%d').date(),
                due_date=datetime.strptime('2025-04-20', '%Y-%m-%d').date(),
                amount=1800.00,
                status='cancelled',
                deployment_id=deployments[5].id,
                notes='Invoice cancelled due to service agreement revision'
            ),
            Invoice(
                invoice_number='INV-2025-006',
                client_name='Emergency Response Authority',
                issue_date=datetime.strptime('2025-04-08', '%Y-%m-%d').date(),
                due_date=datetime.strptime('2025-05-08', '%Y-%m-%d').date(),
                amount=2500.00,
                status='draft',
                deployment_id=deployments[4].id,
                notes='Draft invoice for emergency standby services'
            )
        ]
        for invoice in invoices:
            db.session.add(invoice)
        
        db.session.commit()
        
        print('Database initialized with sample data.')
    else:
        print('Database already contains data, skipping initialization.')

# API Endpoints for Financial Data

@app.route('/api/partners', methods=['GET'])
def get_partners():
    """API endpoint to get all partners"""
    partners = Partner.query.all()
    result = []
    for partner in partners:
        result.append({
            'id': partner.id,
            'name': partner.name,
            'balance': float(partner.balance),
            'status': partner.status,
            'contactPerson': partner.contact_person,
            'email': partner.email,
            'phone': partner.phone,
            'partnershipStart': partner.partnership_start.strftime('%Y-%m-%d') if partner.partnership_start else None,
            'notes': partner.notes
        })
    return jsonify(result)

@app.route('/api/invoices', methods=['GET'])
def get_invoices():
    """API endpoint to get all invoices"""
    invoices = Invoice.query.all()
    result = []
    for invoice in invoices:
        result.append({
            'id': invoice.id,
            'invoiceNumber': invoice.invoice_number,
            'client': invoice.client_name,
            'issueDate': invoice.issue_date.strftime('%Y-%m-%d'),
            'dueDate': invoice.due_date.strftime('%Y-%m-%d'),
            'amount': float(invoice.amount),
            'status': invoice.status,
            'notes': invoice.notes
        })
    return jsonify(result)

@app.route('/api/mutual-aid/transactions', methods=['GET'])
def get_mutual_aid_transactions():
    """API endpoint to get all mutual aid contributions"""
    contributions = MutualAidContribution.query.all()
    result = []
    for contribution in contributions:
        result.append({
            'id': contribution.id,
            'partner': contribution.contributor_name,
            'scheme': contribution.scheme.name if contribution.scheme else None,
            'type': 'contribution',
            'amount': float(contribution.amount),
            'date': contribution.contribution_date.strftime('%Y-%m-%d'),
            'receiptNumber': contribution.receipt_number,
            'notes': contribution.notes
        })
    return jsonify(result)

@app.route('/api/mutual-aid/schemes', methods=['GET'])
def get_mutual_aid_schemes():
    """API endpoint to get all mutual aid schemes"""
    schemes = MutualAidScheme.query.all()
    result = []
    for scheme in schemes:
        result.append({
            'id': scheme.id,
            'name': scheme.name,
            'startDate': scheme.start_date.strftime('%Y-%m-%d'),
            'endDate': scheme.end_date.strftime('%Y-%m-%d') if scheme.end_date else None,
            'contributionAmount': float(scheme.contribution_amount),
            'balance': float(scheme.balance),
            'status': scheme.status,
            'notes': scheme.notes
        })
    return jsonify(result)

@app.route('/api/export/<data_type>', methods=['GET'])
def export_data(data_type):
    """API endpoint to get data for export"""
    try:
        if data_type == 'invoices':
            data = Invoice.query.all()
            result = [{
                'Invoice Number': invoice.invoice_number,
                'Client': invoice.client_name,
                'Issue Date': invoice.issue_date.strftime('%Y-%m-%d'),
                'Due Date': invoice.due_date.strftime('%Y-%m-%d'),
                'Amount': float(invoice.amount),
                'Status': invoice.status,
                'Notes': invoice.notes
            } for invoice in data]
        elif data_type == 'partners':
            data = Partner.query.all()
            result = [{
                'Name': partner.name,
                'Contact Person': partner.contact_person,
                'Email': partner.email,
                'Phone': partner.phone,
                'Balance': float(partner.balance),
                'Partnership Start': partner.partnership_start.strftime('%Y-%m-%d') if partner.partnership_start else None,
                'Status': partner.status,
                'Notes': partner.notes
            } for partner in data]
        elif data_type == 'transactions':
            data = MutualAidContribution.query.all()
            result = [{
                'Partner': contribution.contributor_name,
                'Scheme': contribution.scheme.name if contribution.scheme else None,
                'Type': 'Contribution',
                'Amount': float(contribution.amount),
                'Date': contribution.contribution_date.strftime('%Y-%m-%d'),
                'Receipt Number': contribution.receipt_number,
                'Notes': contribution.notes
            } for contribution in data]
        else:
            return jsonify({'error': 'Invalid data type requested'}), 400
            
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# === Test Dashboard Routes ===
@app.route('/testing')
def test_dashboard():
    """Render the test dashboard page."""
    return render_template('test_dashboard.html')

@app.route('/testing_guide')
def testing_guide():
    """Render the testing guide page."""
    try:
        with open('TESTING.md', 'r') as file:
            content = file.read()
            return render_template('markdown.html', content=content, title='Testing Guide')
    except FileNotFoundError:
        return render_template('error.html', message='Testing guide not found.')

@app.route('/run_tests/<test_type>')
def run_tests_api(test_type):
    """API endpoint to run tests and return results as JSON."""
    import subprocess
    import sys
    
    # Map test types to the appropriate command
    test_commands = {
        'core': ['python', 'run_tests.py', 'core'],
        'financial_api': ['python', '-m', 'unittest', 'test_financial_api.py'],
        'all': ['python', 'run_tests.py']
    }
    
    if test_type not in test_commands:
        return jsonify({'success': False, 'output': 'Invalid test type'}), 400
    
    try:
        # Run the tests and capture output
        process = subprocess.run(
            test_commands[test_type],
            capture_output=True,
            text=True
        )
        
        # Return the results
        return jsonify({
            'success': process.returncode == 0,
            'output': process.stdout + process.stderr
        })
    except Exception as e:
        return jsonify({'success': False, 'output': str(e)}), 500

# === Main Routes ===

# === User Management Routes ===





@app.route('/admin/users/edit/<int:user_id>', methods=['GET', 'POST'])
@login_required
def edit_user(user_id):
    """Edit an existing user."""
    # Only admin users can edit users
    if current_user.role != 'admin':
        flash('You do not have permission to perform this action.', 'danger')
        return redirect(url_for('index'))
    
    user = User.query.get_or_404(user_id)
    
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        role = request.form.get('role')
        password = request.form.get('password')
        
        # Validate input
        if not all([username, email, role]):
            flash('Username, email, and role are required.', 'danger')
            return redirect(url_for('admin_users'))
            
        # Check if username already exists (excluding current user)
        existing_user = User.query.filter_by(username=username).first()
        if existing_user and existing_user.id != user_id:
            flash('Username already exists.', 'danger')
            return redirect(url_for('admin_users'))
            
        # Check if email already exists (excluding current user)
        existing_user = User.query.filter_by(email=email).first()
        if existing_user and existing_user.id != user_id:
            flash('Email already exists.', 'danger')
            return redirect(url_for('admin_users'))
        
        # Update user
        user.username = username
        user.email = email
        user.role = role
        
        # Only update password if provided
        if password:
            user.set_password(password)
        
        try:
            db.session.commit()
            flash('User updated successfully.', 'success')
        except Exception as e:
            db.session.rollback()
            flash(f'Error updating user: {str(e)}', 'danger')
        
        return redirect(url_for('admin_users'))
    
    # GET request - return JSON data for the user
    return jsonify({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'role': user.role
    })

@app.route('/admin/users/delete/<int:user_id>', methods=['POST'])
@login_required
def delete_user(user_id):
    """Delete a user."""
    # Only admin users can delete users
    if current_user.role != 'admin':
        flash('You do not have permission to perform this action.', 'danger')
        return redirect(url_for('index'))
    
    user = User.query.get_or_404(user_id)
    
    # Prevent deleting yourself
    if user.id == current_user.id:
        flash('You cannot delete your own account.', 'danger')
        return redirect(url_for('admin_users'))
    
    try:
        db.session.delete(user)
        db.session.commit()
        flash('User deleted successfully.', 'success')
    except Exception as e:
        db.session.rollback()
        flash(f'Error deleting user: {str(e)}', 'danger')
    
    return redirect(url_for('admin_users'))

# Clear any existing sessions and cookies on app startup via a route
@app.route('/clear_session')
def clear_session():
    # This will force all users to re-login
    # It helps prevent persistent logins
    session.clear()
    if current_user.is_authenticated:
        logout_user()
    flash('Your session has been cleared.', 'info')
    return redirect(url_for('public_map'))

# Set a permanent cookie removal to prevent auto-login
@app.after_request
def remove_session_cookies_on_logout(response):
    if request.path == '/logout':
        # Instruct browser to delete the cookie by setting expiry in the past
        response.set_cookie('session', '', expires=0)
    return response

# Create a function to clear all sessions in the database
def clear_all_sessions():
    # This is a more direct approach to clear sessions on startup
    # It removes the session cookie for each request
    for key in list(session.keys()):
        session.pop(key)
    print("All sessions cleared at startup")

# Force clear sessions on index page load
@app.before_request
def clear_sessions_on_first_request():
    # Only run on the first request after server restart
    if not hasattr(app, '_session_cleared'):
        clear_all_sessions()
        app._session_cleared = True
        if current_user.is_authenticated:
            logout_user()
            print("Automatically logged out all users on server start")

if __name__ == '__main__':
    # Initialize the database on startup
    with app.app_context():
        # Set force_reset=True to completely rebuild the database with fresh sample data
        # Change to False after first successful run
        initialize_database(force_reset=True)
    app.run(debug=True)
