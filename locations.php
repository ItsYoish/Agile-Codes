<?php
session_start();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Locations - AquaAlert</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css">
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="css/locations.css">
    <link rel="stylesheet" href="css/responsive.css">
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
            <a href="index.php">Dashboard</a>
            <a href="management.php">Bowser Management</a>
            <a href="locations.php" class="active">Locations</a>
            <a href="maintenance.php">Maintenance</a>
            <a href="reports.php">Reports</a>
            <a href="finance.php">Finance</a>
            <a href="LoginPage.html">Login</a>
        </div>
    </nav>

    <main class="locations-container">
        <header class="page-header">
            <h1>Emergency Water Locations</h1>
            <div class="header-actions">
                <button class="btn primary-btn" id="addLocationBtn">
                    <i class="fas fa-plus"></i> Add Location
                </button>
            </div>
        </header>

        <div class="content-grid">
            <section class="map-section">
                <div class="map-container">
                    <div id="locationsMap"></div>
                </div>
            </section>

            <section class="locations-section">
                <div class="filters-section">
                    <div class="search-container">
                        <div class="input-group">
                            <i class="fas fa-search"></i>
                            <input type="text" id="locationSearch" placeholder="Search locations...">
                        </div>
                    </div>
                    <div class="filter-controls">
                        <div class="input-group">
                            <select id="areaFilter">
                                <option value="">All Areas</option>
                                <option value="north">North</option>
                                <option value="south">South</option>
                                <option value="east">East</option>
                                <option value="west">West</option>
                            </select>
                        </div>
                        <div class="input-group">
                            <select id="statusFilter">
                                <option value="">All Statuses</option>
                                <option value="active">Active</option>
                                <option value="planned">Planned</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="locations-list">
                    <!-- Location cards will be dynamically inserted here -->
                </div>
            </section>
        </div>

        <!-- Add Location Modal -->
        <div id="addLocationModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Add New Location</h2>
                    <button class="close-modal">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="addLocationForm">
                        <div class="form-grid">
                            <div class="input-group">
                                <label for="locationName">Location Name</label>
                                <input type="text" id="locationName" required placeholder="Enter location name">
                            </div>
                            <div class="input-group">
                                <label for="locationArea">Area</label>
                                <select id="locationArea" required>
                                    <option value="">Select Area</option>
                                    <option value="north">North</option>
                                    <option value="south">South</option>
                                    <option value="east">East</option>
                                    <option value="west">West</option>
                                </select>
                            </div>
                            <div class="input-group">
                                <label for="locationAddress">Address</label>
                                <input type="text" id="locationAddress" required placeholder="Enter full address">
                            </div>
                            <div class="input-group">
                                <label for="locationPostcode">Postcode</label>
                                <input type="text" id="locationPostcode" required placeholder="Enter postcode">
                            </div>
                            <div class="input-group full-width">
                                <label for="locationNotes">Notes</label>
                                <textarea id="locationNotes" rows="3" placeholder="Additional information"></textarea>
                            </div>
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn secondary-btn" data-action="cancel">Cancel</button>
                            <button type="submit" class="btn primary-btn">Add Location</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </main>

    <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>
    <script src="js/utils.js"></script>
    <script src="js/locations.js"></script>
</body>
</html>
