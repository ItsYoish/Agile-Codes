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
            { id: '1', name: 'Central Park', address: '123 Main St, Lambeth, London SE1 7PB', coordinates: [51.505, -0.09], type: 'residential' },
            { id: '2', name: 'City Hospital', address: '456 Oak Ave, Southwark, London SE1 9RT', coordinates: [51.51, -0.1], type: 'healthcare' },
            { id: '3', name: 'West Community Center', address: '789 Elm Rd, Camden, London NW1 8QP', coordinates: [51.515, -0.12], type: 'community' },
            { id: '4', name: 'Southside Apartment Complex', address: '101 Pine Blvd, Southwark, London SE1 0NQ', coordinates: [51.49, -0.11], type: 'residential' },
            { id: '5', name: 'East Shopping Mall', address: '202 Maple Dr, Tower Hamlets, London E1 6GH', coordinates: [51.52, -0.05], type: 'commercial' },
            { id: '6', name: 'SW1 Town Square', address: '123 Westminster Rd, Westminster, London SW1A 2JR', coordinates: [51.498, -0.134], type: 'community' },
            { id: '7', name: 'SW1 Residential Zone', address: '45 Buckingham Gate, Westminster, London SW1E 6BS', coordinates: [51.499, -0.138], type: 'residential' },
            { id: '8', name: 'SW1 Shopping Center', address: '67 Victoria St, Westminster, London SW1E 6QP', coordinates: [51.496, -0.135], type: 'commercial' }
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
        
        // Generate mock deployments - ensuring each bowser has only one active deployment
        // Current date for comparison
        const currentDate = new Date();
        
        this.deployments = [
            { 
                id: '1', 
                bowserId: '1', 
                locationId: '6', 
                startDate: '2025-04-05', 
                endDate: '2025-04-20', 
                status: 'active', 
                supplyLevel: 95,
                priority: 'emergency',
                population_affected: 3500,
                notes: 'Emergency deployment due to SW1 water main break' 
            },
            { 
                id: '2', 
                bowserId: '2', 
                locationId: '7', 
                startDate: '2025-04-05', 
                endDate: '2025-04-20', 
                status: 'active', 
                supplyLevel: 85,
                priority: 'emergency',
                population_affected: 5200,
                notes: 'SW1 residential area emergency water supply' 
            },
            { 
                id: '3', 
                bowserId: '3', 
                locationId: '3', 
                startDate: '2025-04-01', 
                endDate: '2025-04-15', 
                status: 'active', 
                supplyLevel: 24,
                priority: 'high',
                notes: 'Need refill soon' 
            },
            { 
                id: '4', 
                bowserId: '4', 
                locationId: '4', 
                startDate: '2025-04-02', 
                endDate: '2025-04-17', 
                status: 'active', 
                supplyLevel: 90,
                priority: 'normal',
                notes: 'High demand area' 
            },
            { 
                id: '7', 
                bowserId: '6', 
                locationId: '8', 
                startDate: '2025-04-06', 
                endDate: '2025-04-20', 
                status: 'active', 
                supplyLevel: 90,
                priority: 'high',
                population_affected: 2100,
                notes: 'SW1 commercial area support' 
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
    
    /**
     * Get deployment by bowser ID
     * @param {string} bowserId - Bowser ID
     * @returns {Object} Active deployment for the bowser, or null if not deployed
     */
    getDeploymentByBowserId(bowserId) {
        // Find active deployment for the bowser
        const deployment = this.deployments.find(dep => 
            dep.bowserId === bowserId && 
            dep.status === 'active'
        );
        
        if (!deployment) return null;
        
        const location = this.getLocationById(deployment.locationId);
        
        return {
            ...deployment,
            location
        };
    }
    
    /**
     * Get all deployments for a bowser
     * @param {string} bowserId - Bowser ID
     * @returns {Array} All deployments for the bowser
     */
    getDeploymentsByBowserId(bowserId) {
        return this.deployments
            .filter(dep => dep.bowserId === bowserId)
            .map(dep => {
                const location = this.getLocationById(dep.locationId);
                return {
                    ...dep,
                    location
                };
            });
    }
    
    /**
     * Get maintenance records for a bowser
     * @param {string} bowserId - Bowser ID
     * @returns {Array} Maintenance records for the bowser
     */
    getMaintenanceRecordsByBowserId(bowserId) {
        return this.maintenanceRecords
            .filter(record => record.bowserId === bowserId)
            .sort((a, b) => new Date(b.scheduledDate) - new Date(a.scheduledDate));
    }
    
    /**
     * Add a new bowser
     * @param {Object} bowser - Bowser data
     * @returns {Object} Added bowser
     */
    async addBowser(bowser) {
        // Simulate API delay
        if (CONFIG.mockData.enabled) {
            await new Promise(resolve => setTimeout(resolve, CONFIG.mockData.delay));
        }
        
        // Check if bowser with this ID already exists
        const existingBowser = this.getBowserById(bowser.id);
        if (existingBowser) {
            throw new Error(`Bowser with ID ${bowser.id} already exists`);
        }
        
        // Add the bowser
        this.bowsers.push(bowser);
        
        return bowser;
    }
    
    /**
     * Update a bowser
     * @param {string} id - Bowser ID
     * @param {Object} updatedBowser - Updated bowser data
     * @returns {Object} Updated bowser
     */
    async updateBowser(id, updatedBowser) {
        // Simulate API delay
        if (CONFIG.mockData.enabled) {
            await new Promise(resolve => setTimeout(resolve, CONFIG.mockData.delay));
        }
        
        const index = this.bowsers.findIndex(bowser => bowser.id === id);
        
        if (index === -1) {
            throw new Error(`Bowser with ID ${id} not found`);
        }
        
        // Update the bowser
        this.bowsers[index] = {
            ...this.bowsers[index],
            ...updatedBowser,
            id // Ensure ID doesn't change
        };
        
        return this.bowsers[index];
    }
    
    /**
     * Update a deployment
     * @param {string} id - Deployment ID
     * @param {Object} updatedDeployment - Updated deployment data
     * @returns {Object} Updated deployment
     */
    async updateDeployment(id, updatedDeployment) {
        // Simulate API delay
        if (CONFIG.mockData.enabled) {
            await new Promise(resolve => setTimeout(resolve, CONFIG.mockData.delay));
        }
        
        const index = this.deployments.findIndex(deployment => deployment.id === id);
        
        if (index === -1) {
            throw new Error(`Deployment with ID ${id} not found`);
        }
        
        // Update the deployment
        this.deployments[index] = {
            ...this.deployments[index],
            ...updatedDeployment,
            id // Ensure ID doesn't change
        };
        
        return this.deployments[index];
    }
    
    /**
     * Get all locations
     * @returns {Array} All locations
     */
    getLocations() {
        return this.locations;
    }
    
    /**
     * Get all bowsers
     * @returns {Array} All bowsers
     */
    getBowsers() {
        return this.bowsers;
    }
    
    /**
     * Get bowsers by status
     * @param {string} status - Status to filter by
     * @returns {Array} Filtered bowsers
     */
    getBowsersByStatus(status) {
        return this.bowsers.filter(bowser => bowser.status === status);
    }
}

// Create global instance
const dataManager = new DataManager();
