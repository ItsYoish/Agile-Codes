from app import app, db, User
from werkzeug.security import generate_password_hash, check_password_hash

# Run inside app context
with app.app_context():
    # Check if admin user exists
    admin = User.query.filter_by(username='admin').first()
    
    if admin:
        print(f"Admin user found:")
        print(f"  ID: {admin.id}")
        print(f"  Username: {admin.username}")
        print(f"  Email: {admin.email}")
        print(f"  Role: {admin.role}")
        print(f"  Password hash: {admin.password_hash[:30]}...")
        
        # Test password
        test_password = 'admin123'
        result = check_password_hash(admin.password_hash, test_password)
        print(f"\nPassword check result for 'admin123': {result}")
        
        if not result:
            print("\nFixing admin password...")
            # Fix the password
            admin.password_hash = generate_password_hash('admin123')
            db.session.commit()
            
            # Verify fix
            print("Password updated. Verifying...")
            new_result = check_password_hash(admin.password_hash, 'admin123')
            print(f"New password check result: {new_result}")
            
    else:
        print("Admin user not found!")
        
    # List all users
    print("\nAll users in database:")
    for user in User.query.all():
        print(f"- {user.username} ({user.email}): {user.role}")
