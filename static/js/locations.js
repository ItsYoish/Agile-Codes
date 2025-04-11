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
        const searchInput = document.getElementById('locationSearch');
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                this.filterLocations();
            });
        }

        // Filter handlers
        const typeFilter = document.getElementById('typeFilter');
        if (typeFilter) {
            typeFilter.addEventListener('change', () => this.filterLocations());
        }
        
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.filterLocations());
        }

        // View toggle
        const toggleButtons = document.querySelectorAll('.toggle-btn');
        if (toggleButtons.length > 0) {
            toggleButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    this.toggleView(e.currentTarget.dataset.view);
                });
            });
        }

        // Add location modal
        const addLocationBtn = document.getElementById('addLocationBtn');
        const addLocationModal = document.getElementById('addLocationModal');
        const closeModalBtns = document.querySelectorAll('.close-modal, .cancel-btn');

        if (addLocationBtn && addLocationModal) {
            addLocationBtn.addEventListener('click', () => {
                addLocationModal.style.display = 'block';
            });
        }

        if (closeModalBtns.length > 0) {
            closeModalBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    if (addLocationModal) {
                        addLocationModal.style.display = 'none';
                    }
                });
            });
        }

        // Add location form submission
        const addLocationForm = document.getElementById('addLocationForm');
        if (addLocationForm) {
            addLocationForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addNewLocation();
            });
        }
    }

    async loadLocations() {
        try {
            // Fetch locations from API endpoint
            const response = await fetch('/api/locations');
            if (!response.ok) {
                throw new Error('Failed to fetch locations');
            }
            const locations = await response.json();
            console.log('Loaded locations from API:', locations);
            
            // Display locations in the list and on the map
            this.displayLocations(locations);
            this.addMarkersToMap(locations);
        } catch (error) {
            console.error('Error loading locations:', error);
            this.showNotification('Error loading locations: ' + error.message, 'error');
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
        const card = document.createElement('div');
        card.className = 'location-card';
        
        // Handle potentially missing or different field names from API
        const type = location.type || 'unknown';
        const name = location.name || 'Unnamed Location';
        const address = location.address || 'No address provided';
        const status = location.status || 'unknown';
        
        card.innerHTML = `
            <div class="location-type type-${type}">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
            <h3>${name}</h3>
            <p>${address}</p>
            <div class="location-status">
                <span class="status-indicator status-${status}"></span>
                <span>${status.charAt(0).toUpperCase() + status.slice(1)}</span>
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
            // Handle different coordinate formats from API
            let coordinates;
            if (Array.isArray(location.coordinates)) {
                // If coordinates is an array [lat, lng]
                coordinates = location.coordinates;
            } else if (location.coordinates && typeof location.coordinates === 'object') {
                // If coordinates is an object {lat, lng}
                coordinates = [location.coordinates.lat, location.coordinates.lng];
            } else if (location.latitude !== undefined && location.longitude !== undefined) {
                // If separate latitude/longitude fields
                coordinates = [location.latitude, location.longitude];
            } else {
                console.error('Invalid coordinates format for location:', location);
                return; // Skip this location
            }
            
            const marker = L.marker(coordinates)
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
        // We're not using dataManager for deployments and alerts anymore
        // since we're fetching directly from the API
        
        return `
            <div class="marker-popup">
                <h3>${location.name || 'Unnamed Location'}</h3>
                <p>${location.address || 'No address provided'}</p>
                <p><strong>Type:</strong> ${location.type || 'N/A'}</p>
                <p><strong>Status:</strong> ${location.status || 'N/A'}</p>
                <button onclick="locationManager.viewLocationDetails('${location.id}')" class="primary-btn">
                    View Details
                </button>
            </div>
        `;
    }

    async filterLocations() {
        const searchTerm = document.getElementById('locationSearch').value.toLowerCase();
        const areaFilter = document.getElementById('areaFilter').value;
        const statusFilter = document.getElementById('statusFilter').value;

        try {
            // Fetch all locations from API
            const response = await fetch('/api/locations');
            if (!response.ok) {
                throw new Error('Failed to fetch locations for filtering');
            }
            
            const locations = await response.json();
            
            // Filter locations based on search criteria
            const filteredLocations = locations.filter(location => {
                // Handle potentially missing fields
                const name = (location.name || '').toLowerCase();
                const address = (location.address || '').toLowerCase();
                const area = location.area || '';
                const status = location.status || '';
                
                const matchesSearch = name.includes(searchTerm) || address.includes(searchTerm);
                const matchesArea = !areaFilter || area === areaFilter;
                const matchesStatus = !statusFilter || status === statusFilter;

                return matchesSearch && matchesArea && matchesStatus;
            });

            this.displayLocations(filteredLocations);
            this.updateMapMarkers(filteredLocations);
        } catch (error) {
            console.error('Error filtering locations:', error);
            this.showNotification('Error filtering locations: ' + error.message, 'error');
        }
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

    async viewLocationDetails(locationId) {
        try {
            // Fetch location details from API
            const response = await fetch(`/api/locations/${locationId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch location details');
            }
            
            const location = await response.json();
            
            // You can implement a modal or details panel here
            console.log('Location Details:', { location });
            
            // Show a notification with basic location details for now
            this.showNotification(`Location: ${location.name || 'Unnamed'}<br>Address: ${location.address || 'No address'}<br>Type: ${location.type || 'Unknown'}`, 'info');
        } catch (error) {
            console.error('Error fetching location details:', error);
            this.showNotification('Error fetching location details: ' + error.message, 'error');
        }
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
