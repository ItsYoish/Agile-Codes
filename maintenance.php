<?php
session_start();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Maintenance - AquaAlert</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="css/maintenance.css">
</head>
<body>
    <nav class="navbar">
        <div class="nav-brand">
            <i class="fas fa-water fa-lg"></i>
            <span>AquaAlert</span>
        </div>
        <div class="nav-links">
            <a href="index.php">Dashboard</a>
            <a href="management.php">Bowser Management</a>
            <a href="locations.php">Locations</a>
            <a href="maintenance.php" class="active">Maintenance</a>
            <a href="reports.php">Reports</a>
            <a href="finance.php">Finance</a>
            <a href="LoginPage.html">Login</a>
        </div>
    </nav>

    <main class="maintenance-container">
        <div class="maintenance-header">
            <h1>Maintenance Management</h1>
            <div class="action-bar">
                <div class="search-container">
                    <input type="text" id="searchMaintenance" placeholder="Search maintenance records...">
                    <button class="search-btn"><i class="fas fa-search"></i></button>
                </div>
                <div class="filters">
                    <select id="typeFilter">
                        <option value="all">All Types</option>
                        <option value="repair">Repairs</option>
                        <option value="inspection">Inspections</option>
                        <option value="service">Service</option>
                    </select>
                    <select id="statusFilter">
                        <option value="all">All Statuses</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="overdue">Overdue</option>
                    </select>
                    <select id="priorityFilter">
                        <option value="all">All Priorities</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>
                </div>
                <button id="addMaintenanceBtn" class="primary-btn">
                    <i class="fas fa-plus"></i> New Maintenance
                </button>
            </div>
        </div>

        <div class="content-grid">
            <div class="maintenance-calendar">
                <div class="calendar-header">
                    <h2>Maintenance Schedule</h2>
                    <div class="calendar-nav">
                        <button id="prevWeek"><i class="fas fa-chevron-left"></i></button>
                        <span id="currentWeek">March 17 - 23, 2025</span>
                        <button id="nextWeek"><i class="fas fa-chevron-right"></i></button>
                    </div>
                </div>
                <div id="maintenanceCalendar" class="calendar-grid">
                    <!-- Calendar will be populated by JavaScript -->
                </div>
            </div>

            <div class="maintenance-list">
                <div class="list-header">
                    <h2>Maintenance Records</h2>
                    <div class="view-toggle">
                        <button class="toggle-btn active" data-view="list">
                            <i class="fas fa-list"></i>
                        </button>
                        <button class="toggle-btn" data-view="kanban">
                            <i class="fas fa-columns"></i>
                        </button>
                    </div>
                </div>
                <div id="maintenanceRecords" class="list-view">
                    <!-- Records will be populated by JavaScript -->
                </div>
            </div>
        </div>
    </main>

    <!-- Add Maintenance Modal -->
    <div id="addMaintenanceModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Schedule Maintenance</h2>
                <span class="close-modal">&times;</span>
            </div>
            <div class="modal-body">
                <form id="addMaintenanceForm">
                    <div class="form-group">
                        <label for="bowserId">Bowser</label>
                        <select id="bowserId" required>
                            <!-- Will be populated from available bowsers -->
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="maintenanceType">Type</label>
                        <select id="maintenanceType" required>
                            <option value="repair">Repair</option>
                            <option value="inspection">Inspection</option>
                            <option value="service">Service</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="description">Description</label>
                        <textarea id="description" rows="3" required></textarea>
                    </div>
                    <div class="form-group">
                        <label for="scheduledDate">Scheduled Date</label>
                        <input type="datetime-local" id="scheduledDate" required>
                    </div>
                    <div class="form-group">
                        <label for="priority">Priority</label>
                        <select id="priority" required>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="assignedTo">Assign To</label>
                        <select id="assignedTo" required>
                            <option value="team-a">Tech Team A</option>
                            <option value="team-b">Tech Team B</option>
                            <option value="team-c">Tech Team C</option>
                        </select>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="secondary-btn cancel-btn">Cancel</button>
                        <button type="submit" class="primary-btn">Schedule Maintenance</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- Maintenance Details Modal -->
    <div id="maintenanceDetailsModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Maintenance Details</h2>
                <span class="close-modal">&times;</span>
            </div>
            <div class="modal-body" id="maintenanceDetailsContent">
                <!-- Content will be populated by JavaScript -->
            </div>
        </div>
    </div>

    <div id="notification" class="notification">
        <span id="notificationText"></span>
    </div>

    <script src="js/mock-data.js"></script>
    <script src="js/maintenance.js"></script>
</body>
</html>
