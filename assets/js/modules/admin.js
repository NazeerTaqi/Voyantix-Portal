// Admin Module
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is Admin
    if (!authManager.isAdmin()) {
        Utils.showNotification('Access denied. Admin privileges required.', 'danger');
        window.location.href = '../dashboard.html';
        return;
    }
});

