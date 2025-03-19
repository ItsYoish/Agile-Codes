/**
 * Mock data for AquaAlert system demonstration
 */
const mockData = {
    bowsers: [
        {
            id: "BWR001",
            number: "WB-2025-001",
            capacity: 5000,
            currentLevel: 4200,
            status: "deployed",
            manufacturer: "HydraTech",
            model: "HT-5000",
            lastMaintenance: "2025-02-15",
            nextMaintenance: "2025-04-15"
        },
        {
            id: "BWR002",
            number: "WB-2025-002",
            capacity: 7500,
            currentLevel: 7000,
            status: "deployed",
            manufacturer: "HydraTech",
            model: "HT-7500",
            lastMaintenance: "2025-03-01",
            nextMaintenance: "2025-05-01"
        },
        {
            id: "BWR003",
            number: "WB-2025-003",
            capacity: 5000,
            currentLevel: 2500,
            status: "maintenance",
            manufacturer: "AquaSystem",
            model: "AS-5000",
            lastMaintenance: "2025-03-10",
            nextMaintenance: "2025-05-10"
        },
        {
            id: "BWR004",
            number: "WB-2025-004",
            capacity: 10000,
            currentLevel: 9500,
            status: "standby",
            manufacturer: "HydraTech",
            model: "HT-10000",
            lastMaintenance: "2025-03-05",
            nextMaintenance: "2025-05-05"
        }
    ],

    locations: [
        {
            id: "LOC001",
            name: "City General Hospital",
            type: "healthcare",
            priority: 1,
            address: "123 Medical Drive",
            postcode: "SW1A 1AA",
            coordinates: { lat: 51.5074, lng: -0.1278 },
            currentBowser: "BWR001",
            estimatedPopulation: 1200,
            hasVulnerablePopulation: true,
            hasCriticalEquipment: true
        },
        {
            id: "LOC002",
            name: "Central Fire Station",
            type: "emergency",
            priority: 1,
            address: "45 Emergency Road",
            postcode: "SW1A 2BB",
            coordinates: { lat: 51.5124, lng: -0.1300 },
            currentBowser: "BWR002",
            estimatedPopulation: 150,
            hasVulnerablePopulation: false,
            hasCriticalEquipment: true
        },
        {
            id: "LOC003",
            name: "Riverside Apartments",
            type: "residential",
            priority: 3,
            address: "78 River View",
            postcode: "SW1A 3CC",
            coordinates: { lat: 51.5154, lng: -0.1240 },
            currentBowser: null,
            estimatedPopulation: 500,
            hasVulnerablePopulation: true,
            hasCriticalEquipment: false
        },
        {
            id: "LOC004",
            name: "Shopping Center Mall",
            type: "commercial",
            priority: 4,
            address: "90 High Street",
            postcode: "SW1A 4DD",
            coordinates: { lat: 51.5184, lng: -0.1220 },
            currentBowser: null,
            estimatedPopulation: 2000,
            hasVulnerablePopulation: false,
            hasCriticalEquipment: false
        }
    ],

    deployments: [
        {
            id: "DEP001",
            bowserId: "BWR001",
            locationId: "LOC001",
            startTime: "2025-03-18T08:00:00Z",
            endTime: null,
            status: "active",
            supplyLevel: 84,
            lastChecked: "2025-03-19T14:30:00Z",
            deployedBy: "USR001"
        },
        {
            id: "DEP002",
            bowserId: "BWR002",
            locationId: "LOC002",
            startTime: "2025-03-18T09:30:00Z",
            endTime: null,
            status: "active",
            supplyLevel: 93,
            lastChecked: "2025-03-19T14:30:00Z",
            deployedBy: "USR002"
        }
    ],

    maintenance: [
        {
            id: "MNT001",
            bowserId: "BWR003",
            type: "scheduled",
            description: "Annual maintenance check",
            status: "in-progress",
            priority: 2,
            assignedTo: "USR003",
            scheduledDate: "2025-03-19",
            estimatedCompletion: "2025-03-20",
            tasks: [
                { id: "TSK001", name: "Pump inspection", status: "completed" },
                { id: "TSK002", name: "Tank cleaning", status: "in-progress" },
                { id: "TSK003", name: "Valve check", status: "pending" }
            ]
        }
    ],

    alerts: [
        {
            id: "ALT001",
            type: "supply_warning",
            locationId: "LOC001",
            message: "Supply level below 85% threshold",
            priority: 2,
            status: "active",
            createdAt: "2025-03-19T14:15:00Z",
            acknowledgedBy: null
        }
    ],

    users: [
        {
            id: "USR001",
            username: "john.smith",
            name: "John Smith",
            role: "operator",
            contact: {
                email: "john.smith@aquaalert.com",
                phone: "+44 20 1234 5678"
            }
        },
        {
            id: "USR002",
            username: "sarah.jones",
            name: "Sarah Jones",
            role: "supervisor",
            contact: {
                email: "sarah.jones@aquaalert.com",
                phone: "+44 20 1234 5679"
            }
        },
        {
            id: "USR003",
            username: "mike.brown",
            name: "Mike Brown",
            role: "technician",
            contact: {
                email: "mike.brown@aquaalert.com",
                phone: "+44 20 1234 5680"
            }
        }
    ],

    subscriptions: [
        {
            id: "SUB001",
            email: "resident@email.com",
            postcode: "SW1A 3CC",
            notificationTypes: ["supply_issues", "maintenance_updates"],
            status: "active",
            createdAt: "2025-03-15T10:00:00Z"
        }
    ],

    invoices: [
        {
            id: "INV001",
            invoiceNumber: "2025-001",
            clientName: "City Council",
            totalAmount: 15000.00,
            status: "pending",
            issueDate: "2025-03-01",
            dueDate: "2025-03-31",
            items: [
                {
                    description: "Emergency water supply - City General Hospital",
                    quantity: 30,
                    unitPrice: 500.00,
                    total: 15000.00
                }
            ]
        }
    ],

    mutualAid: [
        {
            id: "MUT001",
            partnerCompany: "WaterCorp Ltd",
            transactionType: "bowser_loan",
            resourceType: "water_bowser",
            quantity: 1,
            durationDays: 7,
            estimatedCost: 2500.00,
            status: "active",
            startDate: "2025-03-15",
            endDate: "2025-03-22"
        }
    ]
};

/**
 * Data access class for mock data
 */
class MockDataManager {
    constructor() {
        this.data = mockData;
        this._setupDataAccessors();
    }

    _setupDataAccessors() {
        // Create getters for each data type
        Object.keys(this.data).forEach(key => {
            this[`get${key.charAt(0).toUpperCase() + key.slice(1)}`] = () => this.data[key];
        });
    }

    // Bowser methods
    getBowserById(id) {
        return this.data.bowsers.find(b => b.id === id);
    }

    getBowsersByStatus(status) {
        return this.data.bowsers.filter(b => b.status === status);
    }

    // Location methods
    getLocationById(id) {
        return this.data.locations.find(l => l.id === id);
    }

    getLocationsByType(type) {
        return this.data.locations.filter(l => l.type === type);
    }

    getLocationsByPriority(priority) {
        return this.data.locations.filter(l => l.priority === priority);
    }

    // Deployment methods
    getActiveDeployments() {
        return this.data.deployments.filter(d => d.status === 'active');
    }

    getDeploymentsByBowser(bowserId) {
        return this.data.deployments.filter(d => d.bowserId === bowserId);
    }

    getDeploymentsByLocation(locationId) {
        return this.data.deployments.filter(d => d.locationId === locationId);
    }

    // Maintenance methods
    getActiveMaintenance() {
        return this.data.maintenance.filter(m => m.status === 'in-progress');
    }

    getMaintenanceByBowser(bowserId) {
        return this.data.maintenance.filter(m => m.bowserId === bowserId);
    }

    // Alert methods
    getActiveAlerts() {
        return this.data.alerts.filter(a => a.status === 'active');
    }

    getAlertsByPriority(priority) {
        return this.data.alerts.filter(a => a.priority === priority);
    }

    getAlertsByLocation(locationId) {
        return this.data.alerts.filter(a => a.locationId === locationId);
    }

    // User methods
    getUserById(id) {
        return this.data.users.find(u => u.id === id);
    }

    getUsersByRole(role) {
        return this.data.users.filter(u => u.role === role);
    }

    // Subscription methods
    getSubscriptionsByPostcode(postcode) {
        return this.data.subscriptions.filter(s => s.postcode === postcode);
    }

    // Invoice methods
    getPendingInvoices() {
        return this.data.invoices.filter(i => i.status === 'pending');
    }

    // Mutual aid methods
    getActiveMutualAid() {
        return this.data.mutualAid.filter(m => m.status === 'active');
    }
}

// Initialize the mock data manager
const dataManager = new MockDataManager();
