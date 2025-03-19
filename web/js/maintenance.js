/**
 * Maintenance management functionality for AquaAlert
 */
class MaintenanceManager {
    constructor() {
        this.currentView = 'list';
        this.currentWeek = new Date();
        this.initializeEventListeners();
        this.loadMaintenanceData();
    }

    initializeEventListeners() {
        // Search and filter handlers
        document.getElementById('searchMaintenance').addEventListener('input', () => this.filterRecords());
        document.getElementById('typeFilter').addEventListener('change', () => this.filterRecords());
        document.getElementById('statusFilter').addEventListener('change', () => this.filterRecords());
        document.getElementById('priorityFilter').addEventListener('change', () => this.filterRecords());

        // Calendar navigation
        document.getElementById('prevWeek').addEventListener('click', () => this.navigateWeek(-1));
        document.getElementById('nextWeek').addEventListener('click', () => this.navigateWeek(1));

        // View toggle
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.toggleView(e.currentTarget.dataset.view);
            });
        });

        // Modal handlers
        const addMaintenanceBtn = document.getElementById('addMaintenanceBtn');
        const addMaintenanceModal = document.getElementById('addMaintenanceModal');
        const closeModalBtns = document.querySelectorAll('.close-modal, .cancel-btn');

        addMaintenanceBtn.addEventListener('click', () => {
            this.populateBowserSelect();
            addMaintenanceModal.style.display = 'block';
        });

        closeModalBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                addMaintenanceModal.style.display = 'none';
                document.getElementById('maintenanceDetailsModal').style.display = 'none';
            });
        });

        // Form submission
        document.getElementById('addMaintenanceForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addNewMaintenance();
        });
    }

    async loadMaintenanceData() {
        try {
            // Load maintenance records from data manager
            const records = dataManager.maintenanceRecords;
            this.updateCalendar();
            this.displayMaintenanceRecords(records);
        } catch (error) {
            this.showNotification('Error loading maintenance records', 'error');
        }
    }

    updateCalendar() {
        const calendar = document.getElementById('maintenanceCalendar');
        calendar.innerHTML = '';

        // Update week display
        const startDate = this.getWeekStartDate(this.currentWeek);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6);

        document.getElementById('currentWeek').textContent = 
            `${startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${
                endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;

        // Create calendar grid
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        days.forEach(day => {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.innerHTML = `<div class="day-header">${day}</div>`;
            calendar.appendChild(dayElement);
        });

        // Populate calendar with maintenance events
        this.populateCalendarEvents(startDate);
    }

    populateCalendarEvents(startDate) {
        const days = document.querySelectorAll('.calendar-day');
        const today = new Date();
        
        for (let i = 0; i < 7; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(currentDate.getDate() + i);
            
            // Mark today
            if (currentDate.toDateString() === today.toDateString()) {
                days[i].classList.add('today');
            }

            // Add date to header
            const dateHeader = days[i].querySelector('.day-header');
            dateHeader.textContent = `${days[i].querySelector('.day-header').textContent}\n${
                currentDate.getDate()}`;

            // Find maintenance events for this day
            const events = dataManager.maintenanceRecords.filter(record => {
                const scheduledDate = new Date(record.scheduledDate);
                return scheduledDate.toDateString() === currentDate.toDateString();
            });

            // Add events to calendar
            events.forEach(event => {
                const eventElement = document.createElement('div');
                eventElement.className = `maintenance-event event-${event.priority}`;
                eventElement.textContent = `${event.type}: Bowser ${
                    dataManager.bowsers.find(b => b.id === event.bowserId)?.number}`;
                eventElement.addEventListener('click', () => this.viewMaintenanceDetails(event.id));
                days[i].appendChild(eventElement);
            });
        }
    }

    displayMaintenanceRecords(records) {
        const container = document.getElementById('maintenanceRecords');
        container.innerHTML = '';

        if (this.currentView === 'list') {
            records.forEach(record => {
                const card = this.createMaintenanceCard(record);
                container.appendChild(card);
            });
        } else {
            this.displayKanbanView(records);
        }
    }

    createMaintenanceCard(record) {
        const bowser = dataManager.bowsers.find(b => b.id === record.bowserId);
        const card = document.createElement('div');
        card.className = 'maintenance-card';
        card.innerHTML = `
            <div class="maintenance-info">
                <div>
                    <h3>Bowser ${bowser?.number}</h3>
                    <p>${record.description}</p>
                    <div class="maintenance-status status-${record.status}">
                        ${record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                    </div>
                    <div class="priority-indicator priority-${record.priority}">
                        <i class="fas fa-flag"></i>
                        ${record.priority.charAt(0).toUpperCase() + record.priority.slice(1)} Priority
                    </div>
                </div>
                <div>
                    <p><i class="fas fa-calendar"></i> ${new Date(record.scheduledDate).toLocaleDateString()}</p>
                    <p><i class="fas fa-user-cog"></i> ${record.assignedTo}</p>
                </div>
            </div>
        `;

        card.addEventListener('click', () => this.viewMaintenanceDetails(record.id));
        return card;
    }

    displayKanbanView(records) {
        const container = document.getElementById('maintenanceRecords');
        container.className = 'kanban-view';
        
        const columns = {
            scheduled: [],
            'in-progress': [],
            completed: [],
            overdue: []
        };

        // Sort records into columns
        records.forEach(record => {
            columns[record.status].push(record);
        });

        // Create columns
        Object.entries(columns).forEach(([status, statusRecords]) => {
            const column = document.createElement('div');
            column.className = 'kanban-column';
            column.innerHTML = `
                <h3>${status.charAt(0).toUpperCase() + status.slice(1)}</h3>
                <div class="kanban-cards"></div>
            `;

            const cardsContainer = column.querySelector('.kanban-cards');
            statusRecords.forEach(record => {
                cardsContainer.appendChild(this.createMaintenanceCard(record));
            });

            container.appendChild(column);
        });
    }

    async addNewMaintenance() {
        const form = document.getElementById('addMaintenanceForm');
        const bowserId = document.getElementById('bowserId').value;
        const type = document.getElementById('maintenanceType').value;
        const description = document.getElementById('description').value;
        const scheduledDate = document.getElementById('scheduledDate').value;
        const priority = document.getElementById('priority').value;
        const assignedTo = document.getElementById('assignedTo').value;

        const newMaintenance = {
            id: String(dataManager.maintenanceRecords.length + 1),
            bowserId,
            type,
            description,
            reportedDate: new Date().toISOString(),
            scheduledDate,
            status: 'scheduled',
            priority,
            assignedTo
        };

        try {
            // In a real application, this would be an API call
            dataManager.maintenanceRecords.push(newMaintenance);
            
            // Update UI
            this.loadMaintenanceData();
            
            // Close modal and reset form
            document.getElementById('addMaintenanceModal').style.display = 'none';
            form.reset();
            
            this.showNotification('Maintenance scheduled successfully', 'success');
        } catch (error) {
            this.showNotification('Error scheduling maintenance', 'error');
        }
    }

    viewMaintenanceDetails(id) {
        const record = dataManager.maintenanceRecords.find(r => r.id === id);
        const bowser = dataManager.bowsers.find(b => b.id === record.bowserId);
        
        const modal = document.getElementById('maintenanceDetailsModal');
        const content = document.getElementById('maintenanceDetailsContent');
        
        content.innerHTML = `
            <div class="maintenance-details">
                <div class="detail-group">
                    <h3>Bowser Information</h3>
                    <p><strong>Number:</strong> ${bowser.number}</p>
                    <p><strong>Owner:</strong> ${bowser.owner}</p>
                    <p><strong>Last Maintenance:</strong> ${bowser.lastMaintenance}</p>
                </div>
                <div class="detail-group">
                    <h3>Maintenance Details</h3>
                    <p><strong>Type:</strong> ${record.type}</p>
                    <p><strong>Description:</strong> ${record.description}</p>
                    <p><strong>Status:</strong> ${record.status}</p>
                    <p><strong>Priority:</strong> ${record.priority}</p>
                    <p><strong>Assigned To:</strong> ${record.assignedTo}</p>
                    <p><strong>Scheduled Date:</strong> ${new Date(record.scheduledDate).toLocaleString()}</p>
                </div>
                <div class="detail-actions">
                    <button class="primary-btn" onclick="maintenanceManager.updateMaintenanceStatus('${id}', '${
                        record.status === 'scheduled' ? 'in-progress' : 
                        record.status === 'in-progress' ? 'completed' : 'scheduled'
                    }')">
                        ${record.status === 'scheduled' ? 'Start Maintenance' :
                          record.status === 'in-progress' ? 'Complete Maintenance' :
                          'Reopen Maintenance'}
                    </button>
                </div>
            </div>
        `;
        
        modal.style.display = 'block';
    }

    updateMaintenanceStatus(id, newStatus) {
        const record = dataManager.maintenanceRecords.find(r => r.id === id);
        if (record) {
            record.status = newStatus;
            this.loadMaintenanceData();
            document.getElementById('maintenanceDetailsModal').style.display = 'none';
            this.showNotification('Maintenance status updated', 'success');
        }
    }

    filterRecords() {
        const searchTerm = document.getElementById('searchMaintenance').value.toLowerCase();
        const typeFilter = document.getElementById('typeFilter').value;
        const statusFilter = document.getElementById('statusFilter').value;
        const priorityFilter = document.getElementById('priorityFilter').value;

        const filteredRecords = dataManager.maintenanceRecords.filter(record => {
            const matchesSearch = record.description.toLowerCase().includes(searchTerm);
            const matchesType = typeFilter === 'all' || record.type === typeFilter;
            const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
            const matchesPriority = priorityFilter === 'all' || record.priority === priorityFilter;

            return matchesSearch && matchesType && matchesStatus && matchesPriority;
        });

        this.displayMaintenanceRecords(filteredRecords);
    }

    toggleView(view) {
        const buttons = document.querySelectorAll('.toggle-btn');
        buttons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });

        this.currentView = view;
        this.loadMaintenanceData();
    }

    navigateWeek(offset) {
        this.currentWeek.setDate(this.currentWeek.getDate() + (offset * 7));
        this.updateCalendar();
    }

    getWeekStartDate(date) {
        const startDate = new Date(date);
        startDate.setDate(startDate.getDate() - startDate.getDay());
        return startDate;
    }

    populateBowserSelect() {
        const select = document.getElementById('bowserId');
        select.innerHTML = '';
        
        dataManager.bowsers
            .filter(bowser => bowser.status !== 'outOfService')
            .forEach(bowser => {
                const option = document.createElement('option');
                option.value = bowser.id;
                option.textContent = `${bowser.number} (${bowser.owner})`;
                select.appendChild(option);
            });
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

// Initialize maintenance manager when the page loads
let maintenanceManager;
document.addEventListener('DOMContentLoaded', () => {
    maintenanceManager = new MaintenanceManager();
});
