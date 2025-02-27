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
    async initialize() {
        try {
            // Load data
            await dataManager.loadMockData();
            
            // Initialize map
            this.initializeMap();
            
            // Initialize performance chart
            this.initializePerformanceChart();
            
            // Update dashboard components
            this.updateDashboard();
            
            // Set up refresh intervals
            this.setupRefreshIntervals();
            
            // Show welcome notification
            Utils.showNotification('Dashboard loaded successfully', 'success');
        } catch (error) {
            console.error('Dashboard initialization error:', error);
            Utils.showNotification('Error loading dashboard data', 'danger');
        }
    }
    
    /**
     * Initialize map with active deployments
     */
    initializeMap() {
        // Create map
        this.map = L.map('map').setView(CONFIG.map.defaultCenter, CONFIG.map.defaultZoom);
        
        // Add tile layer
        L.tileLayer(CONFIG.map.tileLayer, {
            attribution: CONFIG.map.attribution
        }).addTo(this.map);
        
        // Add deployment markers
        this.updateMapMarkers();
    }
    
    /**
     * Update map markers for active deployments
     */
    updateMapMarkers() {
        // Clear existing markers
        this.markers.forEach(marker => marker.remove());
        this.markers = [];
        
        // Get active deployments
        const deployments = dataManager.getActiveDeployments();
        
        // Add markers for each deployment
        deployments.forEach(deployment => {
            if (deployment.location && deployment.location.coordinates) {
                // Create marker with custom color based on status
                const markerColor = this.getMarkerColorForStatus(deployment.bowser.status);
                const markerIcon = L.divIcon({
                    className: 'custom-marker',
                    html: `<div style="background-color: ${markerColor}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white;"></div>`,
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                });
                
                // Create popup content
                const popupContent = `
                    <div class="map-popup">
                        <h3>${deployment.location.name}</h3>
                        <p><strong>Bowser:</strong> ${deployment.bowser.number}</p>
                        <p><strong>Capacity:</strong> ${deployment.bowser.capacity} L</p>
                        <p><strong>Current Level:</strong> ${deployment.supplyLevel}%</p>
                        <p><strong>Status:</strong> ${deployment.bowser.status}</p>
                        <p><strong>Deployed:</strong> ${Utils.formatDate(deployment.startDate)}</p>
                    </div>
                `;
                
                // Create marker and add to map
                const marker = L.marker(deployment.location.coordinates, { icon: markerIcon })
                    .bindPopup(popupContent);
                
                marker.addTo(this.map);
                this.markers.push(marker);
            }
        });
        
        // If no deployments, show default view
        if (deployments.length === 0) {
            this.map.setView(CONFIG.map.defaultCenter, CONFIG.map.defaultZoom);
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
        return CONFIG.statusColors[status] || '#3182ce'; // Default to blue
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
        const currentEfficiency = dataManager.calculateEfficiency();
        
        // Generate random historical data (slightly variable)
        const baseEfficiency = 80;
        const variance = 10;
        
        return [
            baseEfficiency + Math.floor(Math.random() * variance - variance/2),
            baseEfficiency + Math.floor(Math.random() * variance - variance/2),
            baseEfficiency + Math.floor(Math.random() * variance - variance/2),
            baseEfficiency + Math.floor(Math.random() * variance - variance/2),
            baseEfficiency + Math.floor(Math.random() * variance - variance/2),
            baseEfficiency + Math.floor(Math.random() * variance - variance/2),
            currentEfficiency
        ];
    }
    
    /**
     * Update quick stats section
     */
    updateQuickStats() {
        // Get stats data
        const activeBowsers = dataManager.getActiveBowsersCount();
        const totalLocations = dataManager.getLocationsCount();
        const pendingMaintenance = dataManager.getPendingMaintenanceCount();
        const efficiency = dataManager.calculateEfficiency();
        
        // Update DOM elements
        document.getElementById('activeBowsers').textContent = Utils.formatNumber(activeBowsers);
        document.getElementById('totalLocations').textContent = Utils.formatNumber(totalLocations);
        document.getElementById('pendingMaintenance').textContent = Utils.formatNumber(pendingMaintenance);
        document.getElementById('efficiency').textContent = `${efficiency}%`;
    }
    
    /**
     * Update alerts list
     */
    updateAlertsList() {
        const alertsList = document.getElementById('alertsList');
        if (!alertsList) return;
        
        // Get recent alerts
        const alerts = dataManager.getRecentAlerts(5);
        
        // Update list
        if (alerts.length > 0) {
            alertsList.innerHTML = alerts.map(alert => `
                <div class="list-item">
                    <div>
                        ${Utils.createStatusBadge(alert.type, alert.priority)}
                        <span>${alert.message}</span>
                    </div>
                    <small>${Utils.getTimeDifference(alert.timestamp)}</small>
                </div>
            `).join('');
        } else {
            alertsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-bell-slash"></i>
                    <p>No recent alerts</p>
                </div>
            `;
        }
    }
    
    /**
     * Update schedule list
     */
    updateScheduleList() {
        const scheduleList = document.getElementById('scheduleList');
        if (!scheduleList) return;
        
        // Get today's schedule
        const schedule = dataManager.getTodaySchedule();
        
        // Update list
        if (schedule.length > 0) {
            scheduleList.innerHTML = schedule.map(item => `
                <div class="list-item">
                    <div>
                        <strong>${item.type.charAt(0).toUpperCase() + item.type.slice(1)}</strong>
                        <p>Bowser ${item.bowser.number}${item.location ? ` at ${item.location.name}` : ''}</p>
                    </div>
                    <div>${Utils.formatDate(item.scheduledTime)}</div>
                </div>
            `).join('');
        } else {
            scheduleList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-check"></i>
                    <p>No scheduled activities today</p>
                </div>
            `;
        }
    }
    
    /**
     * Update all dashboard components
     */
    updateDashboard() {
        this.updateQuickStats();
        this.updateMapMarkers();
        this.updateAlertsList();
        this.updateScheduleList();
    }
    
    /**
     * Set up refresh intervals for dashboard components
     */
    setupRefreshIntervals() {
        // Refresh entire dashboard
        setInterval(() => this.updateDashboard(), CONFIG.refreshIntervals.dashboard);
        
        // Refresh alerts more frequently
        setInterval(() => this.updateAlertsList(), CONFIG.refreshIntervals.alerts);
        
        // Refresh schedule
        setInterval(() => this.updateScheduleList(), CONFIG.refreshIntervals.schedule);
        
        // Refresh map
        setInterval(() => this.updateMapMarkers(), CONFIG.refreshIntervals.map);
    }
}

// Initialize dashboard
const dashboard = new Dashboard();
