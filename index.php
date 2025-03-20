<?php
session_start();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AquaAlert - Emergency Water Bowser Management</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="css/responsive.css">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css">
</head>
<body>
    <nav class="navbar">
        <div class="nav-brand">
            <i class="fas fa-water fa-lg"></i>
            <span>AquaAlert</span>
        </div>
        <button class="nav-toggle">
            <i class="fas fa-bars"></i>
        </button>
        <div class="nav-links">
            <a href="index.php" class="active">Dashboard</a>
            <a href="management.php">Bowser Management</a>
            <a href="locations.php">Locations</a>
            <a href="maintenance.php">Maintenance</a>
            <a href="reports.php">Reports</a>
            <a href="finance.php">Finance</a>
            <a href="LoginPage.html">Login</a>
        </div>
    </nav>

    <main class="dashboard">
        <h1>Emergency Water Bowser Dashboard</h1>
        
        <div class="quick-stats">
            <div class="stat-card">
                <i class="fas fa-truck-moving"></i>
                <div class="stat-info">
                    <h3>Active Bowsers</h3>
                    <p id="activeBowsers">0</p>
                </div>
            </div>
            <div class="stat-card">
                <i class="fas fa-map-marker-alt"></i>
                <div class="stat-info">
                    <h3>Locations</h3>
                    <p id="totalLocations">0</p>
                </div>
            </div>
            <div class="stat-card">
                <i class="fas fa-tools"></i>
                <div class="stat-info">
                    <h3>Pending Maintenance</h3>
                    <p id="pendingMaintenance">0</p>
                </div>
            </div>
            <div class="stat-card">
                <i class="fas fa-tachometer-alt"></i>
                <div class="stat-info">
                    <h3>System Efficiency</h3>
                    <p id="efficiency">0%</p>
                </div>
            </div>
        </div>

        <div class="dashboard-grid">
            <div class="grid-item map-container">
                <h2>Active Bowser Deployments</h2>
                <div id="map"></div>
            </div>
            
            <div class="grid-item alerts">
                <h2>Recent Alerts</h2>
                <div id="alertsList" class="list-container">
                    <div class="empty-state">
                        <i class="fas fa-bell-slash"></i>
                        <p>No recent alerts</p>
                    </div>
                </div>
            </div>

            <div class="grid-item schedule">
                <h2>Today's Schedule</h2>
                <div id="scheduleList" class="list-container">
                    <div class="empty-state">
                        <i class="fas fa-calendar-check"></i>
                        <p>No scheduled activities today</p>
                    </div>
                </div>
            </div>

            <div class="grid-item performance">
                <h2>Performance Metrics</h2>
                <canvas id="performanceChart"></canvas>
            </div>
        </div>
    </main>

    <div id="notification" class="notification">
        <span id="notificationText"></span>
    </div>
    
    <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="js/mock-data.js"></script>
    <script src="js/dashboard.js"></script>
</body>
</html>
