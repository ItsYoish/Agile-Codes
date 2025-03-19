/**
 * Utility functions for the AquaAlert application
 */
const Utils = {
    /**
     * Format a date into a readable string
     * @param {Date|string} date - Date to format
     * @param {boolean} includeTime - Whether to include time in the output
     * @returns {string} Formatted date string
     */
    formatDate(date, includeTime = true) {
        const dateObj = new Date(date);
        const options = {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        };
        
        if (includeTime) {
            options.hour = '2-digit';
            options.minute = '2-digit';
        }
        
        return dateObj.toLocaleString('en-GB', options);
    },
    
    /**
     * Calculate the time difference from now and return a human-readable string
     * @param {Date|string} date - Date to compare
     * @returns {string} Human-readable time difference
     */
    getTimeDifference(date) {
        const now = new Date();
        const dateObj = new Date(date);
        const diffMs = now - dateObj;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHrs = Math.floor(diffMin / 60);
        const diffDays = Math.floor(diffHrs / 24);
        
        if (diffSec < 60) {
            return 'Just now';
        } else if (diffMin < 60) {
            return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
        } else if (diffHrs < 24) {
            return `${diffHrs} hour${diffHrs !== 1 ? 's' : ''} ago`;
        } else {
            return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
        }
    },
    
    /**
     * Format a number with thousand separators
     * @param {number} num - Number to format
     * @returns {string} Formatted number string
     */
    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },
    
    /**
     * Calculate distance between two coordinates in kilometers
     * @param {Array} coord1 - First coordinate [lat, lng]
     * @param {Array} coord2 - Second coordinate [lat, lng]
     * @returns {number} Distance in kilometers
     */
    calculateDistance(coord1, coord2) {
        const [lat1, lon1] = coord1;
        const [lat2, lon2] = coord2;
        
        const R = 6371; // Earth's radius in km
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        
        return parseFloat(distance.toFixed(2));
    },
    
    /**
     * Convert degrees to radians
     * @param {number} degrees - Degrees to convert
     * @returns {number} Value in radians
     */
    toRad(degrees) {
        return degrees * Math.PI / 180;
    },
    
    /**
     * Generate a random UUID
     * @returns {string} UUID
     */
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },
    
    /**
     * Display a notification to the user
     * @param {string} message - Message to display
     * @param {string} type - Type of notification (success, warning, danger, info)
     * @param {number} duration - Duration in ms to display the notification
     */
    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.getElementById('notification');
        const notificationText = document.getElementById('notificationText');
        
        notification.className = `notification ${type}`;
        notificationText.textContent = message;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, duration);
    },
    
    /**
     * Create an HTML element with a status badge
     * @param {string} status - Status text
     * @param {string} priority - Priority level (high, medium, low)
     * @returns {string} HTML for badge element
     */
    createStatusBadge(status, priority) {
        return `<span class="badge badge-${priority}">${status}</span>`;
    },
    
    /**
     * Calculate percentage and ensure it's between 0-100
     * @param {number} value - Current value
     * @param {number} total - Total value
     * @returns {number} Percentage between 0-100
     */
    calculatePercentage(value, total) {
        if (total === 0) return 0;
        const percentage = Math.round((value / total) * 100);
        return Math.max(0, Math.min(100, percentage));
    }
};
