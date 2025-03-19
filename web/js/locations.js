/**
 * Locations management functionality for AquaAlert
 */
class LocationManager {
    constructor() {
        this.map = null;
        this.markers = {};
        this.currentView = 'grid';
        this.initializeMap();
        this.initializeEventListeners();
        this.loadLocations();
    }

    initializeMap() {
        this.map = L.map('locationMap').setView([51.505, -0.09], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);
    }

    initializeEventListeners() {
        // Search functionality
        document.getElementById('searchLocation').addEventListener('input', (e) => {
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
            // Load locations from data manager
            const locations = await dataManager.getLocations();
            this.displayLocations(locations);
            this.addMarkersToMap(locations);
        } catch (error) {
            this.showNotification('Error loading locations', 'error');
        }
    }

    displayLocations(locations) {
        const locationGrid = document.getElementById('locationGrid');
        locationGrid.innerHTML = '';

        locations.forEach(location => {
            const card = this.createLocationCard(location);
            locationGrid.appendChild(card);
        });
    }

    createLocationCard(location) {
        const card = document.createElement('div');
        card.className = 'location-card';
        card.innerHTML = `
            <div class="location-type type-${location.type}">${location.type.charAt(0).toUpperCase() + location.type.slice(1)}</div>
            <h3>${location.name}</h3>
            <p>${location.address}</p>
            <div class="location-status">
                <span class="status-indicator status-active"></span>
                <span>Active</span>
            </div>
            <div class="bowser-count">
                <i class="fas fa-truck"></i> ${this.getBowserCount(location.id)} Bowsers Deployed
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
        const bowserCount = this.getBowserCount(location.id);
        return `
            <div class="marker-popup">
                <h3>${location.name}</h3>
                <p>${location.address}</p>
                <p><strong>Type:</strong> ${location.type}</p>
                <p><strong>Bowsers Deployed:</strong> ${bowserCount}</p>
                <button onclick="locationManager.viewLocationDetails('${location.id}')" class="primary-btn">
                    View Details
                </button>
            </div>
        `;
    }

    getBowserCount(locationId) {
        // Get active deployments for this location
        const deployments = dataManager.deployments.filter(d => 
            d.locationId === locationId && 
            d.status === 'active'
        );
        return deployments.length;
    }

    filterLocations() {
        const searchTerm = document.getElementById('searchLocation').value.toLowerCase();
        const typeFilter = document.getElementById('typeFilter').value;
        const statusFilter = document.getElementById('statusFilter').value;

        const filteredLocations = dataManager.locations.filter(location => {
            const matchesSearch = location.name.toLowerCase().includes(searchTerm) ||
                                location.address.toLowerCase().includes(searchTerm);
            const matchesType = typeFilter === 'all' || location.type === typeFilter;
            // For now, we'll assume all locations are active
            const matchesStatus = statusFilter === 'all' || statusFilter === 'active';

            return matchesSearch && matchesType && matchesStatus;
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

    async addNewLocation() {
        const form = document.getElementById('addLocationForm');
        const name = document.getElementById('locationName').value;
        const type = document.getElementById('locationType').value;
        const address = document.getElementById('locationAddress').value;
        const priority = document.getElementById('locationPriority').value;
        const notes = document.getElementById('locationNotes').value;

        // In a real application, we would geocode the address here
        // For now, we'll use a random nearby location
        const baseCoords = [51.505, -0.09];
        const randomOffset = () => (Math.random() - 0.5) * 0.02;
        const coordinates = [baseCoords[0] + randomOffset(), baseCoords[1] + randomOffset()];

        const newLocation = {
            id: String(dataManager.locations.length + 1),
            name,
            type,
            address,
            coordinates,
            priority,
            notes,
            status: 'active'
        };

        try {
            // In a real application, this would be an API call
            dataManager.locations.push(newLocation);
            
            // Update UI
            this.displayLocations(dataManager.locations);
            this.addMarkersToMap([newLocation]);
            
            // Close modal and reset form
            document.getElementById('addLocationModal').style.display = 'none';
            form.reset();
            
            this.showNotification('Location added successfully', 'success');
        } catch (error) {
            this.showNotification('Error adding location', 'error');
        }
    }

    viewLocationDetails(locationId) {
        // To be implemented: show detailed view of location
        console.log('Viewing details for location:', locationId);
    }

    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        const notificationText = document.getElementById('notificationText');
        
        notificationText.textContent = message;
        notification.className = `notification ${type}`;
        notification.style.display = 'block';
        
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    }
}

// Initialize location manager when the page loads
let locationManager;
document.addEventListener('DOMContentLoaded', () => {
    locationManager = new LocationManager();
});
