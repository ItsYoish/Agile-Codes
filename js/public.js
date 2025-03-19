/**
 * Public interface functionality for AquaAlert
 */
class PublicInterface {
    constructor() {
        this.map = null;
        this.markers = {};
        this.currentPostcode = null;
        this.initializeMap();
        this.initializeEventListeners();
        this.loadPublicData();
    }

    initializeMap() {
        this.map = L.map('publicMap').setView([51.505, -0.09], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: ' OpenStreetMap contributors'
        }).addTo(this.map);
    }

    initializeEventListeners() {
        // Search functionality
        document.querySelector('.search-btn').addEventListener('click', () => {
            const postcode = document.getElementById('locationSearch').value;
            this.searchLocation(postcode);
        });

        // Filter handlers
        document.getElementById('areaFilter').addEventListener('change', () => this.filterLocations());
        document.getElementById('statusFilter').addEventListener('change', () => this.filterLocations());

        // Report form submission
        document.getElementById('reportForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitReport();
        });

        // Subscribe form submission
        document.getElementById('subscribeForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitSubscription();
        });

        // Emergency banner close
        const closeBanner = document.querySelector('.close-banner');
        if (closeBanner) {
            closeBanner.addEventListener('click', () => {
                document.getElementById('emergencyBanner').style.display = 'none';
            });
        }
    }

    async loadPublicData() {
        try {
            // Load active deployments from data manager
            const deployments = dataManager.deployments.filter(d => d.status === 'active');
            const locations = dataManager.locations;
            const alerts = dataManager.alerts;

            this.displayBowserLocations(deployments, locations);
            this.displayAlerts(alerts);
        } catch (error) {
            this.showNotification('Error loading data', 'error');
        }
    }

    displayBowserLocations(deployments, locations) {
        const bowserList = document.getElementById('bowserList');
        bowserList.innerHTML = '';

        deployments.forEach(deployment => {
            const location = locations.find(l => l.id === deployment.locationId);
            const bowser = dataManager.bowsers.find(b => b.id === deployment.bowserId);
            
            if (location && bowser) {
                // Add marker to map
                const marker = L.marker(location.coordinates)
                    .bindPopup(this.createMarkerPopup(location, bowser, deployment))
                    .addTo(this.map);
                
                this.markers[deployment.id] = marker;

                // Add to list
                const card = this.createBowserCard(location, bowser, deployment);
                bowserList.appendChild(card);
            }
        });

        // Fit map bounds to show all markers
        const bounds = Object.values(this.markers).map(marker => marker.getLatLng());
        if (bounds.length > 0) {
            this.map.fitBounds(bounds);
        }
    }

    createMarkerPopup(location, bowser, deployment) {
        return `
            <div class="marker-popup">
                <h3>${location.name}</h3>
                <p>${location.address}</p>
                <p><strong>Bowser:</strong> ${bowser.number}</p>
                <p><strong>Supply Level:</strong> ${deployment.supplyLevel}%</p>
                <p><strong>Status:</strong> ${this.getBowserStatus(deployment)}</p>
                <button onclick="publicInterface.navigateToReport('${bowser.number}')" class="primary-btn">
                    Report Issue
                </button>
            </div>
        `;
    }

    createBowserCard(location, bowser, deployment) {
        const card = document.createElement('div');
        card.className = 'bowser-card';
        
        const status = this.getBowserStatus(deployment);
        card.innerHTML = `
            <div class="bowser-status status-${status.toLowerCase()}">${status}</div>
            <h3>${location.name}</h3>
            <p><i class="fas fa-map-marker-alt"></i> ${location.address}</p>
            <p><i class="fas fa-truck"></i> Bowser ${bowser.number}</p>
            <p><i class="fas fa-tint"></i> Supply Level: ${deployment.supplyLevel}%</p>
            <button onclick="publicInterface.navigateToReport('${bowser.number}')" class="submit-btn">
                Report Issue
            </button>
        `;

        card.addEventListener('click', () => {
            const marker = this.markers[deployment.id];
            if (marker) {
                this.map.setView(marker.getLatLng(), 15);
                marker.openPopup();
            }
        });

        return card;
    }

    getBowserStatus(deployment) {
        if (deployment.supplyLevel < 25) {
            return 'Refilling';
        } else if (deployment.status === 'active') {
            return 'Available';
        } else {
            return 'Maintenance';
        }
    }

    displayAlerts(alerts) {
        const alertsList = document.getElementById('alertsList');
        alertsList.innerHTML = '';

        alerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
              .forEach(alert => {
                  const card = document.createElement('div');
                  card.className = 'alert-card';
                  
                  const iconClass = this.getAlertIcon(alert.type);
                  const timeAgo = this.getTimeAgo(new Date(alert.timestamp));
                  
                  card.innerHTML = `
                      <div class="alert-icon ${alert.type}">
                          <i class="${iconClass}"></i>
                      </div>
                      <div class="alert-content">
                          <h3>${this.formatAlertType(alert.type)}</h3>
                          <p>${alert.message}</p>
                          <span class="alert-time">${timeAgo}</span>
                      </div>
                  `;
                  
                  alertsList.appendChild(card);
              });
    }

    getAlertIcon(type) {
        switch (type) {
            case 'emergency': return 'fas fa-exclamation-triangle alert-emergency';
            case 'maintenance': return 'fas fa-wrench alert-warning';
            case 'deployment': return 'fas fa-truck alert-info';
            default: return 'fas fa-info-circle alert-info';
        }
    }

    formatAlertType(type) {
        return type.charAt(0).toUpperCase() + type.slice(1) + ' Alert';
    }

    getTimeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 60) {
            return `${diffMins} minutes ago`;
        } else if (diffHours < 24) {
            return `${diffHours} hours ago`;
        } else {
            return `${diffDays} days ago`;
        }
    }

    async searchLocation(postcode) {
        // In a real application, this would use a geocoding service
        this.showNotification('Searching for water bowsers near ' + postcode, 'info');
        
        // Simulate search with random nearby location
        const baseCoords = [51.505, -0.09];
        const randomOffset = () => (Math.random() - 0.5) * 0.02;
        const searchLocation = [baseCoords[0] + randomOffset(), baseCoords[1] + randomOffset()];
        
        this.map.setView(searchLocation, 15);
        this.currentPostcode = postcode;
        
        // Filter locations based on simulated proximity
        this.filterLocations();
    }

    filterLocations() {
        const area = document.getElementById('areaFilter').value;
        const status = document.getElementById('statusFilter').value;

        // Hide all markers first
        Object.values(this.markers).forEach(marker => {
            this.map.removeLayer(marker);
        });

        const deployments = dataManager.deployments.filter(deployment => {
            const matchesArea = area === 'all' || this.getArea(deployment.locationId) === area;
            const matchesStatus = status === 'all' || this.getBowserStatus(deployment).toLowerCase() === status;
            return matchesArea && matchesStatus;
        });

        const locations = dataManager.locations;
        this.displayBowserLocations(deployments, locations);
    }

    getArea(locationId) {
        // Simulate area determination (in real app, would use postcode/coordinates)
        const location = dataManager.locations.find(l => l.id === locationId);
        if (location) {
            const lat = location.coordinates[0];
            if (lat > 51.51) return 'sw1';
            else if (lat > 51.50) return 'sw2';
            else return 'se1';
        }
        return 'sw1';
    }

    navigateToReport(bowserNumber) {
        document.getElementById('bowserNumber').value = bowserNumber;
        document.getElementById('report-section').scrollIntoView({ behavior: 'smooth' });
    }

    async submitReport() {
        const bowserNumber = document.getElementById('bowserNumber').value;
        const issueType = document.getElementById('issueType').value;
        const description = document.getElementById('description').value;
        const contactInfo = document.getElementById('contactInfo').value;

        try {
            // In a real application, this would be an API call
            const report = {
                id: String(Date.now()),
                bowserNumber,
                issueType,
                description,
                contactInfo,
                timestamp: new Date().toISOString(),
                status: 'submitted'
            };

            // Simulate successful submission
            this.showNotification('Report submitted successfully', 'success');
            document.getElementById('reportForm').reset();
        } catch (error) {
            this.showNotification('Error submitting report', 'error');
        }
    }

    async submitSubscription() {
        const postcode = document.getElementById('subscribePostcode').value;
        const email = document.getElementById('subscribeEmail').value;
        const notifications = Array.from(document.querySelectorAll('input[name="notifications"]:checked'))
            .map(checkbox => checkbox.value);

        try {
            // In a real application, this would be an API call
            const subscription = {
                id: String(Date.now()),
                postcode,
                email,
                notifications,
                timestamp: new Date().toISOString()
            };

            // Simulate successful subscription
            this.showNotification('Subscription successful', 'success');
            document.getElementById('subscribeForm').reset();
        } catch (error) {
            this.showNotification('Error processing subscription', 'error');
        }
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

// Initialize public interface when the page loads
let publicInterface;
document.addEventListener('DOMContentLoaded', () => {
    publicInterface = new PublicInterface();
});

// Mobile Navigation Toggle
document.addEventListener('DOMContentLoaded', () => {
    const navToggle = document.createElement('button');
    navToggle.className = 'nav-toggle';
    navToggle.innerHTML = '<i class="fas fa-bars"></i>';
    
    const navLinks = document.querySelector('.nav-links');
    const navbar = document.querySelector('.navbar');
    
    if (navbar && navLinks) {
        navbar.insertBefore(navToggle, navLinks);
        
        navToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            navToggle.innerHTML = navLinks.classList.contains('active') 
                ? '<i class="fas fa-times"></i>' 
                : '<i class="fas fa-bars"></i>';
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!navbar.contains(e.target) && navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                navToggle.innerHTML = '<i class="fas fa-bars"></i>';
            }
        });

        // Close mobile menu when window is resized to desktop size
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768 && navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                navToggle.innerHTML = '<i class="fas fa-bars"></i>';
            }
        });
    }
});
