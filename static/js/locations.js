/**
 * Locations management functionality for AquaAlert
 */
class LocationManager {
    constructor() {
        this.map = null;
        this.markers = {};
        this.currentView = 'grid';
        // Use dataManager instead of dbHandler
        this.dataManager = dataManager
        this.initializeMap();
        this.initializeEventListeners();
        this.loadLocations();
    }

    initializeMap() {
        this.map = L.map('locationsMap').setView([51.505, -0.09], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: ' OpenStreetMap contributors'
        }).addTo(this.map);
    }

    initializeEventListeners() {
        // Search functionality
        document.getElementById('searchLocation').addEventListener('input', () => {
            this.filterLocations();
        });

        // Filter handlers
        document.getElementById('typeFilter').addEventListener('change', () => this.filterLocations());
        document.getElementById('statusFilter').addEventListener('change', () => this.filterLocations());

        // View toggle
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.toggleView(e.currentTarget.dataset.view);
            });
        });

        // Add location modal
        const addLocationBtn = document.getElementById('addLocationBtn');
        const addLocationModal = document.getElementById('addLocationModal');
        const closeModalBtns = document.querySelectorAll('.close-modal, .cancel-btn');

        addLocationBtn.addEventListener('click', () => {
            addLocationModal.style.display = 'block';
        });

        closeModalBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                addLocationModal.style.display = 'none';
            });
        });

        // Add location form submission
        document.getElementById('addLocationForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addNewLocation();
        });
    }

    async loadLocations() {
        try {
            // Ensure data is loaded first
            if (!this.dataManager.dataLoaded) {
                await this.dataManager.loadData();
            }
            // Load locations from data manager
            const locations = this.dataManager.getLocations();
            this.displayLocations(locations);
            this.addMarkersToMap(locations);
        } catch (error) {
            this.showNotification('Error loading locations', 'error');
        }
    }

    displayLocations(locations) {
        const locationList = document.getElementById('locationList');
        locationList.innerHTML = '';

        locations.forEach(location => {
            const card = this.createLocationCard(location);
            locationList.appendChild(card);
        });
    }

    createLocationCard(location) {
        // Get deployments for this location
        const deployments = this.dataManager.getDeployments().filter(d => d.locationId === location.id);
        const card = document.createElement('div');
        card.className = 'location-card';
        card.innerHTML = `
            <div class="location-type type-${location.type}">${location.type.charAt(0).toUpperCase() + location.type.slice(1)}</div>
            <h3>${location.name}</h3>
            <p>${location.address}</p>
            <div class="location-status">
                <span class="status-indicator status-${location.priority}"></span>
                <span>${location.priority.charAt(0).toUpperCase() + location.priority.slice(1)} Priority</span>
            </div>
            <div class="bowser-count">
                <i class="fas fa-truck"></i> ${deployments.length} Bowsers Deployed
            </div>
        `;

        card.addEventListener('click', () => {
            this.map.setView(location.coordinates, 15);
            const marker = this.markers[location.id];
            if (marker) {
                marker.openPopup();
            }
        });

        return card;
    }

    addMarkersToMap(locations) {
        // Clear existing markers
        Object.values(this.markers).forEach(marker => this.map.removeLayer(marker));
        this.markers = {};

        locations.forEach(location => {
            const marker = L.marker(location.coordinates)
                .bindPopup(this.createMarkerPopup(location))
                .addTo(this.map);
            
            this.markers[location.id] = marker;
        });

        // Fit map bounds to show all markers
        const bounds = Object.values(this.markers).map(marker => marker.getLatLng());
        if (bounds.length > 0) {
            this.map.fitBounds(bounds);
        }
    }

    createMarkerPopup(location) {
        const deployments = this.dataManager.getDeploymentsByLocation(location.id); // Update to use this.dataManager
        const activeDeployments = deployments.filter(d => d.status === 'active');
        const alerts = this.dataManager.getAlertsByLocation(location.id); // Update to use this.dataManager
        
        return `
            <div class="marker-popup">
                <h3>${location.name}</h3>
                <p>${location.address}</p>
                <p><strong>Type:</strong> ${location.type}</p>
                <p><strong>Priority:</strong> ${location.priority}</p>
                <p><strong>Active Bowsers:</strong> ${activeDeployments.length}</p>
                <p><strong>Active Alerts:</strong> ${alerts.length}</p>
                <button onclick="locationManager.viewLocationDetails('${location.id}')" class="primary-btn">
                    View Details
                </button>
            </div>
        `;
    }

    filterLocations() {
        const searchTerm = document.getElementById('locationSearch').value.toLowerCase();
        const areaFilter = document.getElementById('areaFilter').value;
        const statusFilter = document.getElementById('statusFilter').value;

        const locations = this.dataManager.getLocations();
        const filteredLocations = locations.filter(location => {
            const matchesSearch = location.name.toLowerCase().includes(searchTerm) ||
                                location.address.toLowerCase().includes(searchTerm);
            const matchesArea = !areaFilter || location.area === areaFilter;
            const matchesStatus = !statusFilter || location.status === statusFilter;

            return matchesSearch && matchesArea && matchesStatus;
        });

        this.displayLocations(filteredLocations);
        this.updateMapMarkers(filteredLocations);
    }

    updateMapMarkers(locations) {
        // Hide all markers first
        Object.values(this.markers).forEach(marker => {
            this.map.removeLayer(marker);
        });

        // Show only filtered markers
        locations.forEach(location => {
            const marker = this.markers[location.id];
            if (marker) {
                marker.addTo(this.map);
            }
        });
    }

    toggleView(view) {
        const locationGrid = document.getElementById('locationGrid');
        const buttons = document.querySelectorAll('.toggle-btn');

        buttons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });

        locationGrid.className = view === 'grid' ? 'grid-view' : 'list-view';
        this.currentView = view;
    }

    addNewLocation() {
        const form = document.getElementById('addLocationForm');
        const newLocation = {
            id: Date.now().toString(),
            name: form.locationName.value,
            type: form.locationType.value,
            address: form.locationAddress.value,
            priority: form.locationPriority.value,
            notes: form.locationNotes.value,
            coordinates: { lat: 51.505, lng: -0.09 }, // Default coordinates for demo
            status: 'active'
        };

        // Add to database
        this.dataManager.addLocation(newLocation);

        // Update UI
        this.loadLocations();
        document.getElementById('addLocationModal').style.display = 'none';
        form.reset();
        this.showNotification('Location added successfully', 'success');
    }

    viewLocationDetails(locationId) {
        const location = this.dataManager.getLocationById(locationId);
        const deployments = this.dataManager.getDeployments().filter(d => d.locationId === locationId);
        // Get alerts related to this location if available
        const alerts = this.dataManager.getAlerts ? this.dataManager.getAlerts().filter(a => a.locationId === locationId) : [];
        
        // You can implement a modal or details panel here
        console.log('Location Details:', { location, deployments, alerts });
    }

    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        const notificationText = document.getElementById('notificationText');
        
        if (notification && notificationText) {
            notificationText.textContent = message;
            notification.className = `notification ${type}`;
            notification.style.display = 'block';
            
            setTimeout(() => {
                notification.style.display = 'none';
            }, 3000);
        }
    }
}

// Initialize location manager when the page loads
let locationManager;
document.addEventListener('DOMContentLoaded', () => {
    locationManager = new LocationManager();
});
