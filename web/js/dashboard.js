/**
 * Dashboard functionality for the AquaAlert application
 */
class Dashboard {
    constructor() {
        this.map = null;
        this.markers = [];
        this.performanceChart = null;
        
        // Initialize dashboard when DOM is loaded
        document.addEventListener('DOMContentLoaded', () => this.initialize());
    }
    
    /**
     * Initialize the dashboard
     */
    initialize() {
        try {
            // Initialize map
            this.initializeMap();
            
            // Initialize performance chart
            this.initializePerformanceChart();
            
            // Update dashboard components
            this.updateDashboard();
            
            // Set up refresh intervals
            this.setupRefreshIntervals();
            
            // Show welcome notification
            this.showNotification('Dashboard loaded successfully', 'success');
        } catch (error) {
            console.error('Dashboard initialization error:', error);
            this.showNotification('Error loading dashboard data', 'danger');
        }
    }
    
    /**
     * Initialize map with active deployments
     */
    initializeMap() {
        // Create map
        this.map = L.map('map').setView([51.5074, -0.1278], 13);
        
        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: ' OpenStreetMap contributors'
        }).addTo(this.map);
        
        // Add deployment markers
        this.updateMapMarkers();
    }
    
    /**
     * Update map markers for active deployments
     */
    updateMapMarkers() {
        // Clear existing markers
        if (this.markers) {
            this.markers.forEach(marker => marker.remove());
        }
        this.markers = [];
        
        // Get active deployments
        const deployments = dataManager.getActiveDeployments();
        
        // Add markers for each deployment
        deployments.forEach(deployment => {
            const location = dataManager.getLocationById(deployment.locationId);
            const bowser = dataManager.getBowserById(deployment.bowserId);
            
            if (location && location.coordinates) {
                // Create marker with custom color based on status
                const markerColor = this.getMarkerColorForStatus(bowser.status);
                const markerIcon = L.divIcon({
                    className: 'custom-marker',
                    html: `<div style="background-color: ${markerColor}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white;"></div>`,
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                });
                
                // Create popup content
                const popupContent = `
                    <div class="map-popup">
                        <h3>${location.name}</h3>
                        <p><strong>Bowser:</strong> ${bowser.number}</p>
                        <p><strong>Capacity:</strong> ${bowser.capacity} L</p>
                        <p><strong>Current Level:</strong> ${deployment.supplyLevel}%</p>
                        <p><strong>Status:</strong> ${bowser.status}</p>
                        <p><strong>Deployed:</strong> ${this.formatDate(deployment.startTime)}</p>
                    </div>
                `;
                
                // Create marker and add to map
                const marker = L.marker([location.coordinates.lat, location.coordinates.lng], { icon: markerIcon })
                    .bindPopup(popupContent);
                
                marker.addTo(this.map);
                this.markers.push(marker);
            }
        });
        
        // If no deployments, show default view
        if (deployments.length === 0) {
            this.map.setView([51.5074, -0.1278], 13);
        } 
        // Otherwise, fit map to show all markers
        else if (this.markers.length > 0) {
            const group = new L.featureGroup(this.markers);
            this.map.fitBounds(group.getBounds().pad(0.1));
        }
    }
    
    /**
     * Get marker color based on bowser status
     * @param {string} status - Bowser status
     * @returns {string} Color code
     */
    getMarkerColorForStatus(status) {
        const statusColors = {
            'deployed': '#28a745',
            'maintenance': '#ffc107',
            'standby': '#17a2b8',
            'decommissioned': '#dc3545'
        };
        return statusColors[status] || '#3182ce'; // Default to blue
    }
    
    /**
     * Initialize performance chart
     */
    initializePerformanceChart() {
        const ctx = document.getElementById('performanceChart');
        if (!ctx) return;
        
        // Generate historical efficiency data (mock)
        const efficiencyData = this.generateHistoricalEfficiency();
        
        // Create chart
        this.performanceChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['6 days ago', '5 days ago', '4 days ago', '3 days ago', '2 days ago', 'Yesterday', 'Today'],
                datasets: [{
                    label: 'System Efficiency',
                    data: efficiencyData,
                    borderColor: '#2c5282',
                    backgroundColor: 'rgba(44, 82, 130, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#2c5282',
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        titleColor: 'white',
                        bodyColor: 'white',
                        borderColor: 'white',
                        borderWidth: 0.5,
                        padding: 10,
                        callbacks: {
                            label: function(context) {
                                return `Efficiency: ${context.parsed.y}%`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        min: 50,
                        max: 100,
                        ticks: {
                            stepSize: 10
                        },
                        grid: {
                            display: true,
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }
    
    /**
     * Generate mock historical efficiency data
     * @returns {Array} Historical efficiency percentages
     */
    generateHistoricalEfficiency() {
        // Current efficiency
        const currentEfficiency = this.calculateEfficiency();
        
        // Historical values (randomly fluctuating around current)
        const history = [];
        for (let i = 0; i < 6; i++) {
            const deviation = Math.random() * 10 - 5; // -5 to +5
            const value = Math.max(70, Math.min(98, currentEfficiency + deviation));
            history.push(Math.round(value));
        }
        
        // Add current value and return in chronological order
        return [...history, currentEfficiency];
    }
    
    /**
     * Calculate current system efficiency
     * @returns {number} Efficiency percentage
     */
    calculateEfficiency() {
        const deployedBowsers = dataManager.getBowsersByStatus('deployed').length;
        const totalBowsers = dataManager.getBowsers().length;
        const activeDeployments = dataManager.getActiveDeployments().length;
        const totalLocations = dataManager.getLocations().length;
        
        // Calculate components
        const fleetUsage = totalBowsers > 0 ? (deployedBowsers / totalBowsers) * 100 : 0;
        const coverageRate = totalLocations > 0 ? (activeDeployments / totalLocations) * 100 : 0;
        
        // Average for overall efficiency (additional factors could be added)
        const efficiency = Math.round((fleetUsage * 0.7) + (coverageRate * 0.3));
        
        return Math.min(100, Math.max(0, efficiency));
    }
    
    /**
     * Update all dashboard components
     */
    updateDashboard() {
        this.updateStats();
        this.updateMapMarkers();
        this.updateAlerts();
        this.updateSchedule();
    }
    
    /**
     * Update quick stats
     */
    updateStats() {
        // Update active bowsers
        const activeBowsersElement = document.getElementById('activeBowsers');
        if (activeBowsersElement) {
            activeBowsersElement.textContent = dataManager.getBowsersByStatus('deployed').length;
        }
        
        // Update total locations
        const totalLocationsElement = document.getElementById('totalLocations');
        if (totalLocationsElement) {
            totalLocationsElement.textContent = dataManager.getLocations().length;
        }
        
        // Update pending maintenance
        const pendingMaintenanceElement = document.getElementById('pendingMaintenance');
        if (pendingMaintenanceElement) {
            const maintenanceItems = dataManager.data.maintenance || [];
            pendingMaintenanceElement.textContent = maintenanceItems.filter(m => m.status !== 'completed').length;
        }
        
        // Update efficiency
        const efficiencyElement = document.getElementById('efficiency');
        if (efficiencyElement) {
            efficiencyElement.textContent = `${this.calculateEfficiency()}%`;
        }
    }
    
    /**
     * Update alerts list
     */
    updateAlerts() {
        const alertsListElement = document.getElementById('alertsList');
        if (!alertsListElement) return;
        
        const alerts = dataManager.getActiveAlerts();
        
        if (alerts.length === 0) {
            alertsListElement.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-bell-slash"></i>
                    <p>No recent alerts</p>
                </div>
            `;
            return;
        }
        
        alertsListElement.innerHTML = '';
        alerts.forEach(alert => {
            const location = dataManager.getLocationById(alert.locationId);
            const alertItem = document.createElement('div');
            alertItem.className = `alert-item priority-${alert.priority}`;
            alertItem.innerHTML = `
                <div class="alert-header">
                    <span class="alert-title">${location ? location.name : 'Unknown Location'}</span>
                    <span class="alert-time">${this.formatDate(alert.createdAt)}</span>
                </div>
                <div class="alert-body">
                    ${alert.message}
                </div>
            `;
            alertsListElement.appendChild(alertItem);
        });
    }
    
    /**
     * Update schedule
     */
    updateSchedule() {
        const scheduleListElement = document.getElementById('scheduleList');
        if (!scheduleListElement) return;
        
        // Get today's maintenance tasks
        const today = new Date().toISOString().split('T')[0];
        const maintenanceItems = dataManager.data.maintenance || [];
        const todayMaintenance = maintenanceItems.filter(m => 
            m.scheduledDate === today && m.status !== 'completed'
        );
        
        // If no scheduled activities
        if (todayMaintenance.length === 0) {
            scheduleListElement.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-check"></i>
                    <p>No scheduled activities today</p>
                </div>
            `;
            return;
        }
        
        // Add schedule items
        scheduleListElement.innerHTML = '';
        todayMaintenance.forEach(maintenance => {
            const bowser = dataManager.getBowserById(maintenance.bowserId);
            const scheduleItem = document.createElement('div');
            scheduleItem.className = 'schedule-item';
            scheduleItem.innerHTML = `
                <div class="schedule-info">
                    <span class="schedule-title">${maintenance.type} - ${bowser ? bowser.number : 'Unknown Bowser'}</span>
                    <span class="schedule-status ${maintenance.status}">${maintenance.status}</span>
                </div>
                <div class="schedule-description">
                    ${maintenance.description}
                </div>
            `;
            scheduleListElement.appendChild(scheduleItem);
        });
    }
    
    /**
     * Set up refresh intervals
     */
    setupRefreshIntervals() {
        // Refresh every 30 seconds
        setInterval(() => this.updateDashboard(), 30000);
    }
    
    /**
     * Show notification
     * @param {string} message - Notification message
     * @param {string} type - Notification type (success, danger, etc)
     */
    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        const notificationText = document.getElementById('notificationText');
        
        if (notification && notificationText) {
            notificationText.textContent = message;
            notification.className = `notification ${type}`;
            notification.style.display = 'block';
            
            // Hide after 3 seconds
            setTimeout(() => {
                notification.style.display = 'none';
            }, 3000);
        }
    }
    
    /**
     * Format date
     * @param {string} dateString - ISO date string
     * @returns {string} Formatted date
     */
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        
        const date = new Date(dateString);
        return date.toLocaleString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// Initialize dashboard
const dashboard = new Dashboard();
