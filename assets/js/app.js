// Main Application JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize app based on current page
    const currentPage = window.location.pathname.split('/').pop();
    
    if (currentPage === 'index.html' || currentPage === '') {
        initLoginPage();
    } else if (currentPage === 'dashboard.html') {
        initDashboard();
    } else {
        initModulePage();
    }

    // Setup password toggle
    setupPasswordToggle();
    
    // Setup time display
    setupTimeDisplay();
});

function initLoginPage() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    const resetPasswordBtn = document.getElementById('resetPasswordBtn');
    if (resetPasswordBtn) {
        resetPasswordBtn.addEventListener('click', handleResetPassword);
    }
}

function initDashboard() {
    // Check authentication
    if (!authManager.isAuthenticated()) {
        window.location.href = 'index.html';
        return;
    }

    // Display current user
    const currentUser = authManager.getCurrentUser();
    if (currentUser) {
        const userEl = document.getElementById('currentUser');
        if (userEl) {
            userEl.textContent = currentUser.name + ' (' + currentUser.role + ')';
        }
    }

    // Setup logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

function initModulePage() {
    // Check authentication
    if (!authManager.isAuthenticated()) {
        window.location.href = 'index.html';
        return;
    }

    // Display current user
    const currentUser = authManager.getCurrentUser();
    if (currentUser) {
        const userEl = document.getElementById('currentUser');
        if (userEl) {
            userEl.textContent = currentUser.name + ' (' + currentUser.role + ')';
        }
    }

    // Setup logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('loginError');

    // Store username for last login display
    localStorage.setItem('lastUsername', username);

    // Validate password strength
    if (!authManager.validatePassword(password)) {
        errorDiv.textContent = 'Password must be at least 8 characters with alphanumeric and special characters.';
        errorDiv.classList.remove('d-none');
        return;
    }

    // Attempt login
    const result = authManager.login(username, password);

    if (result.success) {
        // Redirect to dashboard
        window.location.href = 'dashboard.html';
    } else {
        errorDiv.textContent = result.message;
        errorDiv.classList.remove('d-none');
    }
}

function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        authManager.logout();
        window.location.href = 'index.html';
    }
}

function handleResetPassword() {
    const username = document.getElementById('resetUsername').value.trim();
    if (!username) {
        alert('Please enter your username');
        return;
    }

    // Simulate password reset
    alert('Password reset link has been sent to your registered email. (This is a demo)');
    const modal = bootstrap.Modal.getInstance(document.getElementById('forgotPasswordModal'));
    modal.hide();
}

function setupPasswordToggle() {
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            const icon = togglePassword.querySelector('i');
            icon.classList.toggle('bi-eye');
            icon.classList.toggle('bi-eye-slash');
        });
    }
}

function setupTimeDisplay() {
    const currentTimeEl = document.getElementById('currentTime');
    if (currentTimeEl) {
        function updateTime() {
            const now = new Date();
            const formatted = now.toLocaleString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            currentTimeEl.textContent = formatted;
        }
        
        updateTime();
        setInterval(updateTime, 1000);
    }
}

// Utility Functions
const Utils = {
    formatDate: function(date) {
        if (!date) return '';
        const d = new Date(date);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const day = String(d.getDate()).padStart(2, '0');
        const month = months[d.getMonth()];
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
    },

    generateNumber: function(prefix) {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        return `${prefix}-${timestamp.toString().slice(-6)}-${random}`;
    },

    showNotification: function(message, type = 'info') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
        alertDiv.style.zIndex = '9999';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        document.body.appendChild(alertDiv);

        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    },

    confirmAction: function(message) {
        return confirm(message);
    },

    exportToCSV: function(data, filename) {
        if (!data || data.length === 0) {
            Utils.showNotification('No data to export', 'warning');
            return;
        }

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => {
                const value = row[header] || '';
                return `"${String(value).replace(/"/g, '""')}"`;
            }).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
    },

    exportToPDF: function(elementId, filename) {
        // Simple HTML to PDF using window.print
        // In production, you'd use a library like jsPDF or html2pdf
        const element = document.getElementById(elementId);
        if (!element) {
            Utils.showNotification('Element not found for PDF export', 'error');
            return;
        }

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>${filename}</title>
                    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
                    <style>
                        body { padding: 20px; }
                        @media print { .no-print { display: none; } }
                    </style>
                </head>
                <body>
                    ${element.innerHTML}
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }
};

// Make Utils globally available
window.Utils = Utils;

