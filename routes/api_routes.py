from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from models.json_models import json_handler
from functools import wraps

api = Blueprint('api', __name__)

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated or current_user.role != 'admin':
            return jsonify({'error': 'Admin privileges required'}), 403
        return f(*args, **kwargs)
    return decorated_function

# Bowser routes
@api.route('/api/bowsers', methods=['GET'])
def get_bowsers():
    bowsers = json_handler.get_all('bowsers')
    return jsonify(bowsers)

@api.route('/api/bowsers/<id>', methods=['GET'])
def get_bowser(id):
    bowser = json_handler.get_by_id('bowsers', id)
    if not bowser:
        return jsonify({'error': 'Bowser not found'}), 404
    return jsonify(bowser)

@api.route('/api/bowsers', methods=['POST'])
@login_required
def create_bowser():
    data = request.get_json()
    bowser = json_handler.create('bowsers', data)
    return jsonify(bowser), 201

@api.route('/api/bowsers/<id>', methods=['PUT'])
@login_required
def update_bowser(id):
    data = request.get_json()
    bowser = json_handler.update('bowsers', id, data)
    if not bowser:
        return jsonify({'error': 'Bowser not found'}), 404
    return jsonify(bowser)

@api.route('/api/bowsers/<id>', methods=['DELETE'])
@admin_required
def delete_bowser(id):
    if json_handler.delete('bowsers', id):
        return '', 204
    return jsonify({'error': 'Bowser not found'}), 404

# Location routes
@api.route('/api/locations', methods=['GET'])
def get_locations():
    locations = json_handler.get_all('locations')
    return jsonify(locations)

@api.route('/api/locations/<id>', methods=['GET'])
def get_location(id):
    location = json_handler.get_by_id('locations', id)
    if not location:
        return jsonify({'error': 'Location not found'}), 404
    return jsonify(location)

@api.route('/api/locations', methods=['POST'])
@login_required
def create_location():
    data = request.get_json()
    location = json_handler.create('locations', data)
    return jsonify(location), 201

@api.route('/api/locations/<id>', methods=['PUT'])
@login_required
def update_location(id):
    data = request.get_json()
    location = json_handler.update('locations', id, data)
    if not location:
        return jsonify({'error': 'Location not found'}), 404
    return jsonify(location)

@api.route('/api/locations/<id>', methods=['DELETE'])
@admin_required
def delete_location(id):
    if json_handler.delete('locations', id):
        return '', 204
    return jsonify({'error': 'Location not found'}), 404

# Maintenance routes
@api.route('/api/maintenance', methods=['GET'])
@login_required
def get_maintenance_records():
    records = json_handler.get_all('maintenance')
    return jsonify(records)

@api.route('/api/maintenance/<id>', methods=['GET'])
@login_required
def get_maintenance(id):
    record = json_handler.get_by_id('maintenance', id)
    if not record:
        return jsonify({'error': 'Maintenance record not found'}), 404
    return jsonify(record)

@api.route('/api/maintenance', methods=['POST'])
@login_required
def create_maintenance():
    data = request.get_json()
    record = json_handler.create('maintenance', data)
    return jsonify(record), 201

@api.route('/api/maintenance/<id>', methods=['PUT'])
@login_required
def update_maintenance(id):
    data = request.get_json()
    record = json_handler.update('maintenance', id, data)
    if not record:
        return jsonify({'error': 'Maintenance record not found'}), 404
    return jsonify(record)

@api.route('/api/maintenance/<id>', methods=['DELETE'])
@admin_required
def delete_maintenance(id):
    if json_handler.delete('maintenance', id):
        return '', 204
    return jsonify({'error': 'Maintenance record not found'}), 404

# Deployment routes
@api.route('/api/deployments', methods=['GET'])
@login_required
def get_deployments():
    deployments = json_handler.get_all('deployments')
    return jsonify(deployments)

@api.route('/api/deployments/<id>', methods=['GET'])
@login_required
def get_deployment(id):
    deployment = json_handler.get_by_id('deployments', id)
    if not deployment:
        return jsonify({'error': 'Deployment not found'}), 404
    return jsonify(deployment)

@api.route('/api/deployments', methods=['POST'])
@login_required
def create_deployment():
    data = request.get_json()
    deployment = json_handler.create('deployments', data)
    return jsonify(deployment), 201

@api.route('/api/deployments/<id>', methods=['PUT'])
@login_required
def update_deployment(id):
    data = request.get_json()
    deployment = json_handler.update('deployments', id, data)
    if not deployment:
        return jsonify({'error': 'Deployment not found'}), 404
    return jsonify(deployment)

@api.route('/api/deployments/<id>', methods=['DELETE'])
@admin_required
def delete_deployment(id):
    if json_handler.delete('deployments', id):
        return '', 204
    return jsonify({'error': 'Deployment not found'}), 404

# Invoice routes
@api.route('/api/invoices', methods=['GET'])
@login_required
def get_invoices():
    invoices = json_handler.get_all('invoices')
    return jsonify(invoices)

@api.route('/api/invoices/<id>', methods=['GET'])
@login_required
def get_invoice(id):
    invoice = json_handler.get_by_id('invoices', id)
    if not invoice:
        return jsonify({'error': 'Invoice not found'}), 404
    return jsonify(invoice)

@api.route('/api/invoices', methods=['POST'])
@login_required
def create_invoice():
    data = request.get_json()
    invoice = json_handler.create('invoices', data)
    return jsonify(invoice), 201

@api.route('/api/invoices/<id>', methods=['PUT'])
@login_required
def update_invoice(id):
    data = request.get_json()
    invoice = json_handler.update('invoices', id, data)
    if not invoice:
        return jsonify({'error': 'Invoice not found'}), 404
    return jsonify(invoice)

@api.route('/api/invoices/<id>', methods=['DELETE'])
@admin_required
def delete_invoice(id):
    if json_handler.delete('invoices', id):
        return '', 204
    return jsonify({'error': 'Invoice not found'}), 404

# Mutual Aid Scheme routes
@api.route('/api/schemes', methods=['GET'])
@login_required
def get_schemes():
    schemes = json_handler.get_all('mutual_aid_schemes')
    return jsonify(schemes)

@api.route('/api/schemes/<id>', methods=['GET'])
@login_required
def get_scheme(id):
    scheme = json_handler.get_by_id('mutual_aid_schemes', id)
    if not scheme:
        return jsonify({'error': 'Scheme not found'}), 404
    return jsonify(scheme)

@api.route('/api/schemes', methods=['POST'])
@login_required
def create_scheme():
    data = request.get_json()
    scheme = json_handler.create('mutual_aid_schemes', data)
    return jsonify(scheme), 201

@api.route('/api/schemes/<id>', methods=['PUT'])
@login_required
def update_scheme(id):
    data = request.get_json()
    scheme = json_handler.update('mutual_aid_schemes', id, data)
    if not scheme:
        return jsonify({'error': 'Scheme not found'}), 404
    return jsonify(scheme)

@api.route('/api/schemes/<id>', methods=['DELETE'])
@admin_required
def delete_scheme(id):
    if json_handler.delete('mutual_aid_schemes', id):
        return '', 204
    return jsonify({'error': 'Scheme not found'}), 404

# Partner routes
@api.route('/api/partners', methods=['GET'])
@login_required
def get_partners():
    partners = json_handler.get_all('partners')
    return jsonify(partners)

@api.route('/api/partners/<id>', methods=['GET'])
@login_required
def get_partner(id):
    partner = json_handler.get_by_id('partners', id)
    if not partner:
        return jsonify({'error': 'Partner not found'}), 404
    return jsonify(partner)

@api.route('/api/partners', methods=['POST'])
@login_required
def create_partner():
    data = request.get_json()
    partner = json_handler.create('partners', data)
    return jsonify(partner), 201

@api.route('/api/partners/<id>', methods=['PUT'])
@login_required
def update_partner(id):
    data = request.get_json()
    partner = json_handler.update('partners', id, data)
    if not partner:
        return jsonify({'error': 'Partner not found'}), 404
    return jsonify(partner)

@api.route('/api/partners/<id>', methods=['DELETE'])
@admin_required
def delete_partner(id):
    if json_handler.delete('partners', id):
        return '', 204
    return jsonify({'error': 'Partner not found'}), 404

# Alert routes
@api.route('/api/alerts', methods=['GET'])
def get_alerts():
    alerts = json_handler.get_all('alerts')
    return jsonify(alerts)

@api.route('/api/alerts/<id>', methods=['GET'])
def get_alert(id):
    alert = json_handler.get_by_id('alerts', id)
    if not alert:
        return jsonify({'error': 'Alert not found'}), 404
    return jsonify(alert)

@api.route('/api/alerts', methods=['POST'])
@login_required
def create_alert():
    data = request.get_json()
    alert = json_handler.create('alerts', data)
    return jsonify(alert), 201

@api.route('/api/alerts/<id>', methods=['PUT'])
@login_required
def update_alert(id):
    data = request.get_json()
    alert = json_handler.update('alerts', id, data)
    if not alert:
        return jsonify({'error': 'Alert not found'}), 404
    return jsonify(alert)

@api.route('/api/alerts/<id>', methods=['DELETE'])
@admin_required
def delete_alert(id):
    if json_handler.delete('alerts', id):
        return '', 204
    return jsonify({'error': 'Alert not found'}), 404