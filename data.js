/**
 * Data management for the AquaAlert application
 */
class DataManager {
    constructor() {
        this.bowsers = [];
        this.locations = [];
        this.deployments = [];
        this.maintenanceRecords = [];
        this.alerts = [];
        this.schedule = [];
        this.refills = [];
    }
    
    /**
     * Load mock data for testing
     */
    async loadMockData() {
        // Simulate API delay
        if (CONFIG.mockData.enabled) {
            await new Promise(resolve => setTimeout(resolve, CONFIG.mockData.delay));
        }
        
        // Generate mock locations
        this.locations = [
            { id: '1', name: 'Central Park', address: '123 Main St, London', coordinates: [51.505, -0.09], type: 'residential' },
            { id: '2', name: 'City Hospital', address: '456 Oak Ave, London', coordinates: [51.51, -0.1], type: 'healthcare' },
            { id: '3', name: 'West Community Center', address: '789 Elm Rd, London', coordinates: [51.515, -0.12], type: 'community' },
            { id: '4', name: 'Southside Apartment Complex', address: '101 Pine Blvd, London', coordinates: [51.49, -0.11], type: 'residential' },
            { id: '5', name: 'East Shopping Mall', address: '202 Maple Dr, London', coordinates: [51.52, -0.05], type: 'commercial' }
        ];
        
        // Generate mock bowsers
        this.bowsers = [
            { id: '1', number: 'B001', capacity: 5000, currentLevel: 4200, status: 'active', lastMaintenance: '2025-01-15', owner: 'Company A' },
            { id: '2', number: 'B002', capacity: 10000, currentLevel: 8500, status: 'active', lastMaintenance: '2025-01-20', owner: 'Company A' },
            { id: '3', number: 'B003', capacity: 5000, currentLevel: 1200, status: 'lowSupply', lastMaintenance: '2025-02-01', owner: 'Company B' },
            { id: '4', number: 'B004', capacity: 2000, currentLevel: 1800, status: 'active', lastMaintenance: '2025-02-10', owner: 'Company A' },
            { id: '5', number: 'B005', capacity: 10000, currentLevel: 0, status: 'maintenance', lastMaintenance: '2025-02-25', owner: 'Government' },
            { id: '6', number: 'B006', capacity: 5000, currentLevel: 4800, status: 'available', lastMaintenance: '2025-02-15', owner: 'Company B' },
            { id: '7', number: 'B007', capacity: 5000, currentLevel: 500, status: 'outOfService', lastMaintenance: '2024-12-10', owner: 'Government' }
        ];
        
        // Generate mock deployments
        this.deployments = [
            { 
                id: '1', 
                bowserId: '1', 
                locationId: '1', 
                startDate: '2025-02-20', 
                endDate: '2025-03-05', 
                status: 'active', 
                supplyLevel: 84,
                notes: 'Regular checks required' 
            },
            { 
                id: '2', 
                bowserId: '2', 
                locationId: '2', 
                startDate: '2025-02-15', 
                endDate: '2025-03-15', 
                status: 'active', 
                supplyLevel: 85,
                notes: 'Priority location - hospital' 
            },
            { 
                id: '3', 
                bowserId: '3', 
                locationId: '3', 
                startDate: '2025-02-25', 
                endDate: '2025-03-10', 
                status: 'active', 
                supplyLevel: 24,
                notes: 'Need refill soon' 
            },
            { 
                id: '4', 
                bowserId: '4', 
                locationId: '4', 
                startDate: '2025-02-25', 
                endDate: '2025-03-10', 
                status: 'active', 
                supplyLevel: 90,
                notes: 'High demand area' 
            }
        ];
        
        // Generate mock maintenance records
        this.maintenanceRecords = [
            { 
                id: '1', 
                bowserId: '5', 
                type: 'repair', 
                description: 'Valve replacement needed', 
                reportedDate: '2025-02-25', 
                scheduledDate: '2025-02-28', 
                status: 'scheduled',
                priority: 'high',
                assignedTo: 'Tech Team A'
            },
            { 
                id: '2', 
                bowserId: '3', 
                type: 'inspection', 
                description: 'Regular maintenance check', 
                reportedDate: '2025-02-26', 
                scheduledDate: '2025-03-01', 
                status: 'scheduled',
                priority: 'medium',
                assignedTo: 'Tech Team B'
            },
            { 
                id: '3', 
                bowserId: '7', 
                type: 'repair', 
                description: 'Major leak detected', 
                reportedDate: '2025-02-24', 
                scheduledDate: '2025-02-27', 
                status: 'in-progress',
                priority: 'high',
                assignedTo: 'Tech Team A'
            }
        ];
        
        // Generate mock alerts
        const now = new Date();
        this.alerts = [
            { 
                id: '1', 
                type: 'lowSupply', 
                message: 'Bowser B003 at West Community Center below 25% capacity', 
                relatedId: '3', 
                timestamp: new Date(now.getTime() - 30 * 60000).toISOString(), // 30 minutes ago
                priority: 'high'
            },
            { 
                id: '2', 
                type: 'maintenance', 
                message: 'Scheduled maintenance for Bowser B005 tomorrow', 
                relatedId: '5', 
                timestamp: new Date(now.getTime() - 120 * 60000).toISOString(), // 2 hours ago
                priority: 'medium'
            },
            { 
                id: '3', 
                type: 'deployment', 
                message: 'New bowser deployed to Southside Apartment Complex', 
                relatedId: '4', 
                timestamp: new Date(now.getTime() - 240 * 60000).toISOString(), // 4 hours ago
                priority: 'low'
            },
            { 
                id: '4', 
                type: 'outOfService', 
                message: 'Bowser B007 marked as out of service', 
                relatedId: '7', 
                timestamp: new Date(now.getTime() - 300 * 60000).toISOString(), // 5 hours ago
                priority: 'high'
            }
        ];
        
        // Generate mock schedule for today
        const today = new Date().toISOString().split('T')[0];
        this.schedule = [
            { 
                id: '1', 
                type: 'refill', 
                bowserId: '3', 
                locationId: '3', 
                scheduledTime: `${today}T09:00:00`, 
                status: 'scheduled', 
                notes: 'Low supply alert triggered' 
            },
            { 
                id: '2', 
                type: 'maintenance', 
                bowserId: '5', 
                locationId: null, 
                scheduledTime: `${today}T11:30:00`, 
                status: 'scheduled', 
                notes: 'Valve replacement' 
            },
            { 
                id: '3', 
                type: 'deployment', 
                bowserId: '6', 
                locationId: '5', 
                scheduledTime: `${today}T14:00:00`, 
                status: 'scheduled', 
                notes: 'New location setup' 
            },
            { 
                id: '4', 
                type: 'check', 
                bowserId: '1', 
                locationId: '1', 
                scheduledTime: `${today}T16:30:00`, 
                status: 'scheduled', 
                notes: 'Regular inspection' 
            }
        ];
        
        // Generate mock refill history
        this.refills = [
            { 
                id: '1', 
                bowserId: '1', 
                amount: 2000, 
                date: '2025-02-25T10:15:00', 
                performedBy: 'Team A',
                location: '1'
            },
            { 
                id: '2', 
                bowserId: '2', 
                amount: 3500, 
                date: '2025-02-24T14:30:00', 
                performedBy: 'Team B',
                location: '2'
            },
            { 
                id: '3', 
                bowserId: '4', 
                amount: 1000, 
                date: '2025-02-26T09:45:00', 
                performedBy: 'Team A',
                location: '4'
            }
        ];
        
        console.log('Mock data loaded successfully');
    }
    
    /**
     * Get all active deployments with location and bowser information
     * @returns {Array} Active deployments with detailed information
     */
    getActiveDeployments() {
        return this.deployments
            .filter(deployment => deployment.status === 'active')
            .map(deployment => {
                const location = this.locations.find(loc => loc.id === deployment.locationId);
                const bowser = this.bowsers.find(b => b.id === deployment.bowserId);
                
                return {
                    ...deployment,
                    location,
                    bowser
                };
            });
    }
    
    /**
     * Get active bowsers count
     * @returns {number} Number of active bowsers
     */
    getActiveBowsersCount() {
        return this.bowsers.filter(bowser => 
            bowser.status === 'active' || bowser.status === 'lowSupply'
        ).length;
    }
    
    /**
     * Get all locations count
     * @returns {number} Number of locations
     */
    getLocationsCount() {
        return this.locations.length;
    }
    
    /**
     * Get pending maintenance count
     * @returns {number} Number of pending maintenance records
     */
    getPendingMaintenanceCount() {
        return this.maintenanceRecords.filter(record => 
            record.status === 'scheduled' || record.status === 'in-progress'
        ).length;
    }
    
    /**
     * Calculate overall system efficiency
     * @returns {number} Efficiency percentage
     */
    calculateEfficiency() {
        const totalBowsers = this.bowsers.length;
        const activeBowsers = this.getActiveBowsersCount();
        const maintenanceIssues = this.getPendingMaintenanceCount();
        
        // Weight factors
        const deploymentWeight = 0.7;
        const maintenanceWeight = 0.3;
        
        // Calculate deployment efficiency (percentage of active bowsers)
        const deploymentEfficiency = totalBowsers ? (activeBowsers / totalBowsers) * 100 : 0;
        
        // Calculate maintenance efficiency (inverse of pending maintenance ratio)
        const maintenanceEfficiency = totalBowsers ? 
            100 - ((maintenanceIssues / totalBowsers) * 100) : 100;
        
        // Overall weighted efficiency
        const efficiency = (deploymentEfficiency * deploymentWeight) + 
                           (maintenanceEfficiency * maintenanceWeight);
        
        return Math.round(efficiency);
    }
    
    /**
     * Get recent alerts
     * @param {number} limit - Maximum number of alerts to return
     * @returns {Array} Recent alerts
     */
    getRecentAlerts(limit = 5) {
        return [...this.alerts]
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);
    }
    
    /**
     * Get today's schedule
     * @returns {Array} Today's scheduled activities
     */
    getTodaySchedule() {
        const today = new Date().toISOString().split('T')[0];
        
        return this.schedule
            .filter(item => item.scheduledTime.startsWith(today))
            .sort((a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime))
            .map(item => {
                const bowser = this.bowsers.find(b => b.id === item.bowserId);
                const location = item.locationId ? 
                    this.locations.find(l => l.id === item.locationId) : null;
                
                return {
                    ...item,
                    bowser,
                    location
                };
            });
    }
    
    /**
     * Get bowser by ID
     * @param {string} id - Bowser ID
     * @returns {Object} Bowser data
     */
    getBowserById(id) {
        return this.bowsers.find(bowser => bowser.id === id);
    }
    
    /**
     * Get location by ID
     * @param {string} id - Location ID
     * @returns {Object} Location data
     */
    getLocationById(id) {
        return this.locations.find(location => location.id === id);
    }
    
    /**
     * Get deployment by ID
     * @param {string} id - Deployment ID
     * @returns {Object} Deployment data with bowser and location details
     */
    getDeploymentById(id) {
        const deployment = this.deployments.find(dep => dep.id === id);
        
        if (!deployment) return null;
        
        const bowser = this.getBowserById(deployment.bowserId);
        const location = this.getLocationById(deployment.locationId);
        
        return {
            ...deployment,
            bowser,
            location
        };
    }
    
    /**
     * Get maintenance record by ID
     * @param {string} id - Maintenance record ID
     * @returns {Object} Maintenance record with bowser details
     */
    getMaintenanceById(id) {
        const record = this.maintenanceRecords.find(rec => rec.id === id);
        
        if (!record) return null;
        
        const bowser = this.getBowserById(record.bowserId);
        
        return {
            ...record,
            bowser
        };
    }
}

// Create global instance
const dataManager = new DataManager();
