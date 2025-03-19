/**
 * Bowser Management functionality for the AquaAlert application
 */
class BowserManagement {
    constructor() {
        this.currentTab = 'all';
        this.bowsers = [];
        this.filteredBowsers = [];
        
        // Initialize when DOM is loaded
        document.addEventListener('DOMContentLoaded', () => this.initialize());
    }
    
    /**
     * Initialize the management page
     */
    async initialize() {
        try {
            // Load mock data
            await dataManager.loadMockData();
            this.bowsers = dataManager.bowsers;
            this.filteredBowsers = [...this.bowsers];
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Initial render
            this.renderBowserGrid();
            
            // Show welcome notification
            Utils.showNotification('Bowser management loaded successfully', 'success');
        } catch (error) {
            console.error('Management initialization error:', error);
            Utils.showNotification('Error loading bowser data', 'danger');
        }
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Tab buttons
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.setActiveTab(btn.dataset.tab);
            });
        });
        
        // Search functionality
        const searchInput = document.getElementById('searchBowser');
        searchInput.addEventListener('input', () => {
            this.filterBowsers();
        });
        
        // Filter dropdowns
        const statusFilter = document.getElementById('statusFilter');
        const capacityFilter = document.getElementById('capacityFilter');
        
        statusFilter.addEventListener('change', () => this.filterBowsers());
        capacityFilter.addEventListener('change', () => this.filterBowsers());
        
        // Add bowser button
        const addBowserBtn = document.getElementById('addBowserBtn');
        addBowserBtn.addEventListener('click', () => this.openAddBowserModal());
        
        // Modal close buttons
        const closeButtons = document.querySelectorAll('.close-modal, .cancel-btn');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => this.closeAllModals());
        });
        
        // Add bowser form submission
        const addBowserForm = document.getElementById('addBowserForm');
        addBowserForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddBowser();
        });
        
        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeAllModals();
            }
        });
    }
    
    /**
     * Set active tab and filter bowsers
     * @param {string} tabName - Tab name to activate
     */
    setActiveTab(tabName) {
        // Update active tab
        this.currentTab = tabName;
        
        // Update tab button styles
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            if (btn.dataset.tab === tabName) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // Filter and render bowsers
        this.filterBowsers();
    }
    
    /**
     * Filter bowsers based on current tab and filters
     */
    filterBowsers() {
        const searchTerm = document.getElementById('searchBowser').value.toLowerCase();
        const statusFilter = document.getElementById('statusFilter').value;
        const capacityFilter = document.getElementById('capacityFilter').value;
        
        // Apply all filters
        this.filteredBowsers = this.bowsers.filter(bowser => {
            // Tab filter
            if (this.currentTab !== 'all') {
                if (this.currentTab === 'deployed' && 
                    (bowser.status !== 'active' && bowser.status !== 'lowSupply')) {
                    return false;
                } else if (this.currentTab === 'available' && bowser.status !== 'available') {
                    return false;
                } else if (this.currentTab === 'maintenance' && 
                    (bowser.status !== 'maintenance' && bowser.status !== 'outOfService')) {
                    return false;
                }
            }
            
            // Search filter
            if (searchTerm && 
                !bowser.number.toLowerCase().includes(searchTerm) && 
                !bowser.owner.toLowerCase().includes(searchTerm)) {
                return false;
            }
            
            // Status filter
            if (statusFilter !== 'all' && bowser.status !== statusFilter) {
                return false;
            }
            
            // Capacity filter
            if (capacityFilter !== 'all' && bowser.capacity !== parseInt(capacityFilter)) {
                return false;
            }
            
            return true;
        });
        
        // Render filtered results
        this.renderBowserGrid();
    }
    
    /**
     * Render the bowser grid with filtered bowsers
     */
    renderBowserGrid() {
        const bowserGrid = document.getElementById('bowserGrid');
        
        if (this.filteredBowsers.length === 0) {
            bowserGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-truck"></i>
                    <p>No bowsers found matching your criteria</p>
                </div>
            `;
            return;
        }
        
        bowserGrid.innerHTML = this.filteredBowsers.map(bowser => {
            const supplyLevel = bowser.currentLevel / bowser.capacity * 100;
            const isLowSupply = supplyLevel < 25;
            
            return `
                <div class="bowser-card" data-id="${bowser.id}">
                    <div class="bowser-header">
                        <h3>${bowser.number}</h3>
                        <span class="bowser-status status-${bowser.status}">${this.formatStatus(bowser.status)}</span>
                    </div>
                    <div class="bowser-body">
                        <div class="bowser-info">
                            <div class="info-row">
                                <span class="info-label">Capacity</span>
                                <span class="info-value">${Utils.formatNumber(bowser.capacity)} L</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Owner</span>
                                <span class="info-value">${bowser.owner}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Last Maintenance</span>
                                <span class="info-value">${Utils.formatDate(bowser.lastMaintenance, false)}</span>
                            </div>
                        </div>
                        
                        <div class="water-level ${isLowSupply ? 'level-low' : ''}">
                            <div class="level-label">
                                <span class="level-text">Water Level</span>
                                <span class="level-percent">${Math.round(supplyLevel)}%</span>
                            </div>
                            <div class="level-bar">
                                <div class="level-fill" style="width: ${supplyLevel}%"></div>
                            </div>
                        </div>
                    </div>
                    <div class="bowser-actions">
                        <button class="action-btn view-btn" data-id="${bowser.id}">
                            <i class="fas fa-eye"></i> Details
                        </button>
                        <button class="action-btn edit-btn" data-id="${bowser.id}">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="action-btn deploy-btn" data-id="${bowser.id}" ${bowser.status !== 'available' ? 'disabled' : ''}>
                            <i class="fas fa-map-marker-alt"></i> Deploy
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        // Add event listeners to the action buttons
        this.addBowserCardEventListeners();
    }
    
    /**
     * Add event listeners to bowser card buttons
     */
    addBowserCardEventListeners() {
        // View details
        const viewButtons = document.querySelectorAll('.view-btn');
        viewButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const bowserId = btn.dataset.id;
                this.showBowserDetails(bowserId);
            });
        });
        
        // Edit bowser
        const editButtons = document.querySelectorAll('.edit-btn');
        editButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const bowserId = btn.dataset.id;
                this.editBowser(bowserId);
            });
        });
        
        // Deploy bowser
        const deployButtons = document.querySelectorAll('.deploy-btn');
        deployButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (!btn.disabled) {
                    const bowserId = btn.dataset.id;
                    this.deployBowser(bowserId);
                }
            });
        });
        
        // Make entire card clickable for details
        const bowserCards = document.querySelectorAll('.bowser-card');
        bowserCards.forEach(card => {
            card.addEventListener('click', () => {
                const bowserId = card.dataset.id;
                this.showBowserDetails(bowserId);
            });
        });
    }
    
    /**
     * Format status text for display
     * @param {string} status - Status code
     * @returns {string} Formatted status text
     */
    formatStatus(status) {
        switch (status) {
            case 'active': return 'Active';
            case 'maintenance': return 'Maintenance';
            case 'outOfService': return 'Out of Service';
            case 'lowSupply': return 'Low Supply';
            case 'available': return 'Available';
            default: return status;
        }
    }
    
    /**
     * Open the add bowser modal
     */
    openAddBowserModal() {
        const modal = document.getElementById('addBowserModal');
        modal.style.display = 'block';
    }
    
    /**
     * Show bowser details in modal
     * @param {string} bowserId - ID of the bowser
     */
    showBowserDetails(bowserId) {
        const bowser = this.bowsers.find(b => b.id === bowserId);
        if (!bowser) return;
        
        // Find active deployment if any
        const activeDeployment = dataManager.deployments.find(
            d => d.bowserId === bowserId && d.status === 'active'
        );
        
        // Find location if deployed
        let location = null;
        if (activeDeployment) {
            location = dataManager.locations.find(l => l.id === activeDeployment.locationId);
        }
        
        // Find recent maintenance
        const maintenance = dataManager.maintenanceRecords
            .filter(m => m.bowserId === bowserId)
            .sort((a, b) => new Date(b.scheduledDate) - new Date(a.scheduledDate))[0];
        
        // Calculate water level percentage
        const waterLevel = bowser.currentLevel / bowser.capacity * 100;
        
        // Populate modal content
        const detailsContent = document.getElementById('bowserDetailsContent');
        detailsContent.innerHTML = `
            <div class="bowser-details">
                <div class="details-header">
                    <h3>${bowser.number}</h3>
                    <span class="bowser-status status-${bowser.status}">${this.formatStatus(bowser.status)}</span>
                </div>
                
                <div class="details-section">
                    <h4>Bowser Information</h4>
                    <div class="details-grid">
                        <div class="details-item">
                            <span class="details-label">Capacity</span>
                            <span class="details-value">${Utils.formatNumber(bowser.capacity)} L</span>
                        </div>
                        <div class="details-item">
                            <span class="details-label">Current Level</span>
                            <span class="details-value">${Utils.formatNumber(bowser.currentLevel)} L (${Math.round(waterLevel)}%)</span>
                        </div>
                        <div class="details-item">
                            <span class="details-label">Owner</span>
                            <span class="details-value">${bowser.owner}</span>
                        </div>
                        <div class="details-item">
                            <span class="details-label">Last Maintenance</span>
                            <span class="details-value">${Utils.formatDate(bowser.lastMaintenance)}</span>
                        </div>
                    </div>
                </div>
                
                ${activeDeployment ? `
                <div class="details-section">
                    <h4>Current Deployment</h4>
                    <div class="details-grid">
                        <div class="details-item">
                            <span class="details-label">Location</span>
                            <span class="details-value">${location ? location.name : 'Unknown'}</span>
                        </div>
                        <div class="details-item">
                            <span class="details-label">Address</span>
                            <span class="details-value">${location ? location.address : 'Unknown'}</span>
                        </div>
                        <div class="details-item">
                            <span class="details-label">Start Date</span>
                            <span class="details-value">${Utils.formatDate(activeDeployment.startDate)}</span>
                        </div>
                        <div class="details-item">
                            <span class="details-label">End Date</span>
                            <span class="details-value">${Utils.formatDate(activeDeployment.endDate)}</span>
                        </div>
                        <div class="details-item">
                            <span class="details-label">Notes</span>
                            <span class="details-value">${activeDeployment.notes || 'No notes'}</span>
                        </div>
                    </div>
                </div>
                ` : ''}
                
                ${maintenance ? `
                <div class="details-section">
                    <h4>Latest Maintenance</h4>
                    <div class="details-grid">
                        <div class="details-item">
                            <span class="details-label">Type</span>
                            <span class="details-value">${maintenance.type}</span>
                        </div>
                        <div class="details-item">
                            <span class="details-label">Description</span>
                            <span class="details-value">${maintenance.description}</span>
                        </div>
                        <div class="details-item">
                            <span class="details-label">Scheduled Date</span>
                            <span class="details-value">${Utils.formatDate(maintenance.scheduledDate)}</span>
                        </div>
                        <div class="details-item">
                            <span class="details-label">Status</span>
                            <span class="details-value">${maintenance.status}</span>
                        </div>
                        <div class="details-item">
                            <span class="details-label">Assigned To</span>
                            <span class="details-value">${maintenance.assignedTo}</span>
                        </div>
                    </div>
                </div>
                ` : ''}
                
                <div class="details-actions">
                    <button class="secondary-btn close-details">Close</button>
                    <button class="primary-btn edit-details" data-id="${bowser.id}">
                        <i class="fas fa-edit"></i> Edit Bowser
                    </button>
                </div>
            </div>
        `;
        
        // Add event listeners to the modal buttons
        const closeButton = detailsContent.querySelector('.close-details');
        closeButton.addEventListener('click', () => this.closeAllModals());
        
        const editButton = detailsContent.querySelector('.edit-details');
        editButton.addEventListener('click', () => {
            this.closeAllModals();
            this.editBowser(bowserId);
        });
        
        // Show the modal
        const modal = document.getElementById('bowserDetailsModal');
        modal.style.display = 'block';
    }
    
    /**
     * Edit a bowser (placeholder)
     * @param {string} bowserId - ID of the bowser to edit
     */
    editBowser(bowserId) {
        Utils.showNotification('Edit functionality will be implemented in a future sprint', 'info');
    }
    
    /**
     * Deploy a bowser (placeholder)
     * @param {string} bowserId - ID of the bowser to deploy
     */
    deployBowser(bowserId) {
        Utils.showNotification('Deployment functionality will be implemented in a future sprint', 'info');
    }
    
    /**
     * Handle add bowser form submission
     */
    handleAddBowser() {
        // Get form values
        const number = document.getElementById('bowserNumber').value;
        const capacity = parseInt(document.getElementById('bowserCapacity').value);
        const owner = document.getElementById('bowserOwner').value;
        const status = document.getElementById('bowserStatus').value;
        const notes = document.getElementById('bowserNotes').value;
        
        // Create new bowser object
        const newBowser = {
            id: Utils.generateUUID(),
            number,
            capacity,
            currentLevel: capacity, // Start with full capacity
            status,
            owner,
            lastMaintenance: new Date().toISOString().split('T')[0],
            notes
        };
        
        // Add to data
        this.bowsers.push(newBowser);
        
        // Update filtered bowsers
        this.filterBowsers();
        
        // Close modal
        this.closeAllModals();
        
        // Show success notification
        Utils.showNotification(`Bowser ${number} added successfully`, 'success');
        
        // Reset form
        document.getElementById('addBowserForm').reset();
    }
    
    /**
     * Close all modals
     */
    closeAllModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.style.display = 'none';
        });
    }
}

// Initialize bowser management
const bowserManagement = new BowserManagement();
