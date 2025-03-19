/**
 * Reports and analytics functionality for AquaAlert
 */
class ReportsManager {
    constructor() {
        this.charts = {};
        this.dateRange = 7; // Default to 7 days
        this.initializeEventListeners();
        this.loadReportData();
    }

    initializeEventListeners() {
        // Date range selector
        document.getElementById('dateRange').addEventListener('change', (e) => {
            const value = e.target.value;
            document.getElementById('customRange').style.display = 
                value === 'custom' ? 'flex' : 'none';
            if (value !== 'custom') {
                this.dateRange = parseInt(value);
                this.loadReportData();
            }
        });

        // Custom date range
        document.getElementById('applyRange').addEventListener('click', () => {
            const startDate = new Date(document.getElementById('startDate').value);
            const endDate = new Date(document.getElementById('endDate').value);
            if (startDate && endDate) {
                this.dateRange = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
                this.loadReportData();
            }
        });

        // Location type filter
        document.getElementById('locationTypeFilter').addEventListener('change', () => {
            this.updateLocationPerformance();
        });

        // Export buttons
        document.querySelectorAll('.export-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.exportReport(btn.dataset.format);
            });
        });
    }

    async loadReportData() {
        try {
            this.updateMetrics();
            this.createUtilizationChart();
            this.createDistributionChart();
            this.createMaintenanceCharts();
            this.updateLocationPerformance();
        } catch (error) {
            this.showNotification('Error loading report data', 'error');
        }
    }

    updateMetrics() {
        // Calculate metrics based on data
        const activeBowsers = dataManager.bowsers.filter(b => b.status === 'active').length;
        const locationsServed = new Set(dataManager.deployments
            .filter(d => d.status === 'active')
            .map(d => d.locationId)).size;
        
        const totalMaintenance = dataManager.maintenanceRecords.length;
        const completedMaintenance = dataManager.maintenanceRecords
            .filter(r => r.status === 'completed').length;
        const maintenanceRate = totalMaintenance ? 
            Math.round((completedMaintenance / totalMaintenance) * 100) : 0;

        const waterSupplied = dataManager.bowsers
            .reduce((total, bowser) => total + (bowser.capacity - bowser.currentLevel), 0);

        // Update DOM
        document.getElementById('activeBowsers').textContent = activeBowsers;
        document.getElementById('locationsServed').textContent = locationsServed;
        document.getElementById('maintenanceRate').textContent = `${maintenanceRate}%`;
        document.getElementById('waterSupplied').textContent = `${waterSupplied.toLocaleString()}L`;
    }

    createUtilizationChart() {
        const ctx = document.getElementById('utilizationChart').getContext('2d');
        
        // Calculate utilization data
        const bowserData = dataManager.bowsers.reduce((acc, bowser) => {
            const status = bowser.status.charAt(0).toUpperCase() + bowser.status.slice(1);
            acc.labels.add(status);
            acc.data[status] = (acc.data[status] || 0) + 1;
            return acc;
        }, { labels: new Set(), data: {} });

        if (this.charts.utilization) {
            this.charts.utilization.destroy();
        }

        this.charts.utilization = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Array.from(bowserData.labels),
                datasets: [{
                    data: Object.values(bowserData.data),
                    backgroundColor: [
                        '#4caf50',  // Active
                        '#ff9800',  // Maintenance
                        '#f44336',  // OutOfService
                        '#2196f3',  // Available
                        '#9e9e9e'   // Other
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
    }

    createDistributionChart() {
        const ctx = document.getElementById('distributionChart').getContext('2d');
        
        // Calculate distribution data
        const locationTypes = ['residential', 'healthcare', 'community', 'commercial'];
        const distributionData = locationTypes.map(type => {
            const locations = dataManager.locations.filter(l => l.type === type);
            const deployments = dataManager.deployments.filter(d => 
                locations.some(l => l.id === d.locationId) && d.status === 'active'
            );
            return deployments.length;
        });

        if (this.charts.distribution) {
            this.charts.distribution.destroy();
        }

        this.charts.distribution = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: locationTypes.map(t => t.charAt(0).toUpperCase() + t.slice(1)),
                datasets: [{
                    label: 'Active Deployments',
                    data: distributionData,
                    backgroundColor: '#2196f3'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    createMaintenanceCharts() {
        // Maintenance by Type chart
        const typeCtx = document.getElementById('maintenanceTypeChart').getContext('2d');
        const maintenanceTypes = dataManager.maintenanceRecords.reduce((acc, record) => {
            acc[record.type] = (acc[record.type] || 0) + 1;
            return acc;
        }, {});

        if (this.charts.maintenanceType) {
            this.charts.maintenanceType.destroy();
        }

        this.charts.maintenanceType = new Chart(typeCtx, {
            type: 'pie',
            data: {
                labels: Object.keys(maintenanceTypes).map(t => t.charAt(0).toUpperCase() + t.slice(1)),
                datasets: [{
                    data: Object.values(maintenanceTypes),
                    backgroundColor: ['#4caf50', '#ff9800', '#2196f3']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });

        // Response Time Trends chart
        const timeCtx = document.getElementById('responseTimeChart').getContext('2d');
        const responseTimeData = this.calculateResponseTimeTrends();

        if (this.charts.responseTime) {
            this.charts.responseTime.destroy();
        }

        this.charts.responseTime = new Chart(timeCtx, {
            type: 'line',
            data: {
                labels: responseTimeData.labels,
                datasets: [{
                    label: 'Average Response Time (hours)',
                    data: responseTimeData.data,
                    borderColor: '#2196f3',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Hours'
                        }
                    }
                }
            }
        });
    }

    calculateResponseTimeTrends() {
        // Simulate response time data (in a real app, this would use actual timestamps)
        const labels = [];
        const data = [];
        const now = new Date();

        for (let i = 6; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
            
            // Simulate response time between 1-4 hours
            data.push(Math.random() * 3 + 1);
        }

        return { labels, data };
    }

    updateLocationPerformance() {
        const tbody = document.getElementById('performanceTableBody');
        const typeFilter = document.getElementById('locationTypeFilter').value;
        
        // Filter and sort locations
        const locations = dataManager.locations
            .filter(location => typeFilter === 'all' || location.type === typeFilter)
            .sort((a, b) => {
                const aDeployments = this.getLocationDeployments(a.id).length;
                const bDeployments = this.getLocationDeployments(b.id).length;
                return bDeployments - aDeployments;
            });

        // Generate table rows
        tbody.innerHTML = '';
        locations.forEach(location => {
            const deployments = this.getLocationDeployments(location.id);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${location.name}</td>
                <td>${location.type.charAt(0).toUpperCase() + location.type.slice(1)}</td>
                <td>${deployments.length}</td>
                <td>${this.calculateSupplyLevel(deployments)}%</td>
                <td>${this.calculateRefillRate(location.id)}/week</td>
                <td>${this.getLocationIssues(location.id)}</td>
            `;
            tbody.appendChild(row);
        });
    }

    getLocationDeployments(locationId) {
        return dataManager.deployments.filter(d => 
            d.locationId === locationId && d.status === 'active'
        );
    }

    calculateSupplyLevel(deployments) {
        if (!deployments.length) return 0;
        return Math.round(deployments.reduce((sum, d) => sum + d.supplyLevel, 0) / deployments.length);
    }

    calculateRefillRate(locationId) {
        // Simulate refill rate (in a real app, this would use historical data)
        const deployments = this.getLocationDeployments(locationId);
        return deployments.length ? Math.round(Math.random() * 2 + 1) : 0;
    }

    getLocationIssues(locationId) {
        const deployments = this.getLocationDeployments(locationId);
        const bowserIds = deployments.map(d => d.bowserId);
        
        return dataManager.maintenanceRecords.filter(r => 
            bowserIds.includes(r.bowserId) && 
            r.status !== 'completed'
        ).length;
    }

    exportReport(format) {
        // In a real application, this would generate and download the report
        this.showNotification(`Exporting report as ${format.toUpperCase()}...`, 'info');
        setTimeout(() => {
            this.showNotification(`Report exported successfully`, 'success');
        }, 1500);
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

// Initialize reports manager when the page loads
let reportsManager;
document.addEventListener('DOMContentLoaded', () => {
    reportsManager = new ReportsManager();
});
