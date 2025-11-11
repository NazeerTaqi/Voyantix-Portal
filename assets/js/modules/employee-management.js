


/**
 * Employee Management Module
 * Handles CRUD operations for employees with localStorage
 * Access restricted to Admin users only
 */

// Employee Management Class
class EmployeeManager {
    constructor() {
        this.employees = [];
        this.currentEditId = null;
        this.deleteId = null;
        this.currentPasswordResetId = null;
        this.init();
    }

    /**
     * Initialize the module
     */
    init() {
        // Check admin access
        if (!this.checkAdminAccess()) {
            return;
        }

        // Load employees from localStorage
        this.loadEmployees();
        
        // Load roles for dropdown
        this.loadRoles();
        
        // Render employee table
        this.renderEmployees();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Display current user
        this.displayCurrentUser();
    }

    /**
     * Check if current user is Admin
     */
    checkAdminAccess() {
        try {
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            if (!currentUser || currentUser.role !== 'Admin') {
                alert('Access Denied! Only Admin users can access Employee Management.');
                window.location.href = '../dashboard.html';
                return false;
            }
            return true;
        } catch (error) {
            console.error('Error checking admin access:', error);
            return false;
        }
    }

    /**
     * Display current user in navbar
     */
    displayCurrentUser() {
        try {
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            const userElement = document.getElementById('currentUser');
            if (userElement && currentUser.name) {
                userElement.textContent = currentUser.name;
            }
        } catch (error) {
            console.error('Error displaying current user:', error);
        }
    }

    /**
     * Load employees from localStorage
     */
    loadEmployees() {
        try {
            const stored = localStorage.getItem('employees');
            if (stored) {
                this.employees = JSON.parse(stored);
                // Ensure all employees have firstLogin flag
                this.employees.forEach(emp => {
                    if (emp.firstLogin === undefined) {
                        emp.firstLogin = false;
                    }
                });
                this.saveEmployees();
            } else {
                this.employees = [];
                this.saveEmployees();
            }
        } catch (error) {
            console.error('Error loading employees:', error);
            this.employees = [];
            this.saveEmployees();
        }
    }

    /**
     * Save employees to localStorage
     */
    saveEmployees() {
        try {
            localStorage.setItem('employees', JSON.stringify(this.employees));
        } catch (error) {
            console.error('Error saving employees:', error);
            alert('Error saving employee data. Please try again.');
        }
    }

    /**
     * Load roles from localStorage for dropdown
     */
    loadRoles() {
        try {
            const roles = JSON.parse(localStorage.getItem('roles') || '[]');
            const roleSelect = document.getElementById('empRole');
            const filterRoleSelect = document.getElementById('filterRole');
            
            if (roleSelect) {
                roleSelect.innerHTML = '<option value="">Select Role</option>';
            }
            if (filterRoleSelect) {
                filterRoleSelect.innerHTML = '<option value="">All Roles</option>';
            }

            roles.forEach(role => {
                if (roleSelect) {
                    const option = document.createElement('option');
                    option.value = role.roleName;
                    option.textContent = role.roleName;
                    roleSelect.appendChild(option);
                }
                if (filterRoleSelect) {
                    const option = document.createElement('option');
                    option.value = role.roleName;
                    option.textContent = role.roleName;
                    filterRoleSelect.appendChild(option);
                }
            });
        } catch (error) {
            console.error('Error loading roles:', error);
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        try {
            // Search input
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.addEventListener('input', () => this.renderEmployees());
            }

            // Filter dropdowns
            const filterRole = document.getElementById('filterRole');
            const filterStatus = document.getElementById('filterStatus');
            if (filterRole) {
                filterRole.addEventListener('change', () => this.renderEmployees());
            }
            if (filterStatus) {
                filterStatus.addEventListener('change', () => this.renderEmployees());
            }

            // Form validation
            const form = document.getElementById('employeeForm');
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                });
            }

            // Logout button
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', () => {
                    if (authManager) {
                        authManager.logout();
                        window.location.href = '../index.html';
                    }
                });
            }

            // Modal close - reset form
            const employeeModal = document.getElementById('employeeModal');
            if (employeeModal) {
                employeeModal.addEventListener('hidden.bs.modal', () => {
                    this.resetForm();
                });
            }

            // Change password modal close
            const changePasswordModal = document.getElementById('changePasswordModal');
            if (changePasswordModal) {
                changePasswordModal.addEventListener('hidden.bs.modal', () => {
                    this.resetPasswordForm();
                });
            }
        } catch (error) {
            console.error('Error setting up event listeners:', error);
        }
    }

    /**
     * Get filtered employees based on search and filters
     */
    getFilteredEmployees() {
        try {
            const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
            const filterRole = document.getElementById('filterRole')?.value || '';
            const filterStatus = document.getElementById('filterStatus')?.value || '';

            return this.employees.filter(emp => {
                const matchesSearch = !searchTerm || 
                    (emp.employeeId && emp.employeeId.toLowerCase().includes(searchTerm)) ||
                    (emp.name && emp.name.toLowerCase().includes(searchTerm)) ||
                    (emp.email && emp.email.toLowerCase().includes(searchTerm));
                
                const matchesRole = !filterRole || emp.role === filterRole;
                const matchesStatus = !filterStatus || emp.status === filterStatus;

                return matchesSearch && matchesRole && matchesStatus;
            });
        } catch (error) {
            console.error('Error filtering employees:', error);
            return [];
        }
    }

    /**
     * Render employees table
     */
    renderEmployees() {
        try {
            const tbody = document.getElementById('employeeTableBody');
            const filteredEmployees = this.getFilteredEmployees();
            const countElement = document.getElementById('employeeCount');

            if (!tbody) return;

            if (countElement) {
                countElement.textContent = filteredEmployees.length;
            }

            tbody.innerHTML = '';

            if (filteredEmployees.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="8" class="text-center text-muted">
                            <i class="bi bi-inbox me-2"></i>No employees found matching your criteria.
                        </td>
                    </tr>
                `;
                return;
            }

            // Render employees
            filteredEmployees.forEach(emp => {
                const row = document.createElement('tr');
                const statusClass = emp.status === 'Active' ? 'success' : 'secondary';
                
                row.innerHTML = `
                    <td><strong>${this.escapeHtml(emp.employeeId || '')}</strong></td>
                    <td>${this.escapeHtml(emp.name || '')}</td>
                    <td>${this.escapeHtml(emp.email || '')}</td>
                    <td>${this.escapeHtml(emp.phone || '')}</td>
                    <td><span class="badge bg-info">${this.escapeHtml(emp.role || '')}</span></td>
                    <td><span class="badge bg-${statusClass} status-badge">${this.escapeHtml(emp.status || '')}</span></td>
                    <td>
                        <button class="btn btn-sm btn-primary me-1" onclick="employeeManager.editEmployee('${emp.id}')" title="Edit">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="employeeManager.deleteEmployee('${emp.id}')" title="Delete">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                    <td>
                        <div class="dropdown">
                            <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" id="resetPasswordDropdown${emp.id}" data-bs-toggle="dropdown" aria-expanded="false">
                                <i class="bi bi-key me-1"></i>Reset Password
                            </button>
                            <ul class="dropdown-menu" aria-labelledby="resetPasswordDropdown${emp.id}">
                                <li><a class="dropdown-item" href="#" onclick="employeeManager.openChangePasswordModal('${emp.id}'); return false;">
                                    <i class="bi bi-pencil-square me-2"></i>Change Password
                                </a></li>
                                <li><a class="dropdown-item" href="#" onclick="employeeManager.resetToDefaultPassword('${emp.id}'); return false;">
                                    <i class="bi bi-arrow-counterclockwise me-2"></i>Default Password
                                </a></li>
                            </ul>
                        </div>
                    </td>
                `;
                tbody.appendChild(row);
            });
        } catch (error) {
            console.error('Error rendering employees:', error);
        }
    }

    /**
     * Open employee modal for adding new employee
     */
    openModal() {
        try {
            this.currentEditId = null;
            const modalElement = document.getElementById('employeeModal');
            if (!modalElement) {
                console.error('Employee modal not found');
                return;
            }
            
            const modal = new bootstrap.Modal(modalElement);
            const modalTitle = document.getElementById('employeeModalTitle');
            
            if (modalTitle) {
                modalTitle.textContent = 'Add New Employee';
            }
            
            const passwordRow = document.getElementById('passwordRow');
            if (passwordRow) {
                passwordRow.style.display = 'none';
            }
            
            this.resetForm();
            modal.show();
        } catch (error) {
            console.error('Error opening modal:', error);
            alert('Error opening employee form. Please try again.');
        }
    }

    /**
     * Edit employee
     */
    editEmployee(id) {
        try {
            const employee = this.employees.find(emp => emp.id === id);
            if (!employee) {
                alert('Employee not found!');
                return;
            }

            this.currentEditId = id;
            const modalElement = document.getElementById('employeeModal');
            if (!modalElement) {
                console.error('Employee modal not found');
                return;
            }
            
            const modal = new bootstrap.Modal(modalElement);
            const modalTitle = document.getElementById('employeeModalTitle');
            
            if (modalTitle) {
                modalTitle.textContent = 'Edit Employee';
            }

            const passwordRow = document.getElementById('passwordRow');
            if (passwordRow) {
                passwordRow.style.display = 'none';
            }

            // Populate form
            const employeeIdField = document.getElementById('employeeId');
            const empEmployeeIdField = document.getElementById('empEmployeeId');
            const empNameField = document.getElementById('empName');
            const empEmailField = document.getElementById('empEmail');
            const empPhoneField = document.getElementById('empPhone');
            const empRoleField = document.getElementById('empRole');
            const empStatusField = document.getElementById('empStatus');
            
            if (employeeIdField) employeeIdField.value = employee.id || '';
            if (empEmployeeIdField) empEmployeeIdField.value = employee.employeeId || '';
            if (empNameField) empNameField.value = employee.name || '';
            if (empEmailField) empEmailField.value = employee.email || '';
            if (empPhoneField) empPhoneField.value = employee.phone || '';
            if (empRoleField) empRoleField.value = employee.role || '';
            if (empStatusField) empStatusField.value = employee.status || '';

            modal.show();
        } catch (error) {
            console.error('Error editing employee:', error);
            alert('Error loading employee data. Please try again.');
        }
    }

    /**
     * Delete employee
     */
    deleteEmployee(id) {
        try {
            const employee = this.employees.find(emp => emp.id === id);
            if (!employee) {
                alert('Employee not found!');
                return;
            }

            this.deleteId = id;
            const deleteNameElement = document.getElementById('deleteEmployeeName');
            if (deleteNameElement) {
                deleteNameElement.textContent = employee.name || 'Unknown';
            }

            const modalElement = document.getElementById('deleteModal');
            if (modalElement) {
                const modal = new bootstrap.Modal(modalElement);
                modal.show();
            }
        } catch (error) {
            console.error('Error deleting employee:', error);
            alert('Error preparing delete confirmation. Please try again.');
        }
    }

    /**
     * Confirm delete
     */
    confirmDelete() {
        try {
            if (!this.deleteId) return;

            this.employees = this.employees.filter(emp => emp.id !== this.deleteId);
            this.saveEmployees();
            this.renderEmployees();

            const modalElement = document.getElementById('deleteModal');
            if (modalElement) {
                const modal = bootstrap.Modal.getInstance(modalElement);
                if (modal) {
                    modal.hide();
                }
            }

            this.deleteId = null;
            this.showAlert('Employee deleted successfully!', 'success');
            
            if (typeof authManager !== 'undefined') {
                authManager.loadUsers();
            }
        } catch (error) {
            console.error('Error confirming delete:', error);
            alert('Error deleting employee. Please try again.');
        }
    }

    /**
     * Save employee (add or update)
     */
    saveEmployee() {
        try {
            const form = document.getElementById('employeeForm');
            if (!form) {
                console.error('Employee form not found');
                return;
            }

            if (!form.checkValidity()) {
                form.classList.add('was-validated');
                return;
            }

            const employeeId = document.getElementById('empEmployeeId')?.value.trim() || '';
            const name = document.getElementById('empName')?.value.trim() || '';
            const email = document.getElementById('empEmail')?.value.trim() || '';
            const phone = document.getElementById('empPhone')?.value.trim() || '';
            const role = document.getElementById('empRole')?.value || '';
            const status = document.getElementById('empStatus')?.value || '';

            if (!employeeId || !name || !email || !phone || !role || !status) {
                alert('Please fill in all required fields.');
                return;
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                alert('Please enter a valid email address.');
                return;
            }

            if (!/^[0-9]{10}$/.test(phone)) {
                alert('Please enter a valid 10-digit phone number.');
                return;
            }

            // Check for duplicate employee ID
            if (!this.currentEditId) {
                const duplicate = this.employees.find(emp => emp.employeeId === employeeId);
                if (duplicate) {
                    alert('Employee ID already exists! Please use a different ID.');
                    return;
                }
            } else {
                const duplicate = this.employees.find(emp => emp.employeeId === employeeId && emp.id !== this.currentEditId);
                if (duplicate) {
                    alert('Employee ID already exists! Please use a different ID.');
                    return;
                }
            }

            // Check for duplicate email
            if (!this.currentEditId) {
                const duplicate = this.employees.find(emp => emp.email === email);
                if (duplicate) {
                    alert('Email already exists! Please use a different email.');
                    return;
                }
            } else {
                const duplicate = this.employees.find(emp => emp.email === email && emp.id !== this.currentEditId);
                if (duplicate) {
                    alert('Email already exists! Please use a different email.');
                    return;
                }
            }

            const username = email.split('@')[0].toLowerCase();
            const defaultPassword = 'welcome';

            if (this.currentEditId) {
                // Update existing
                const index = this.employees.findIndex(emp => emp.id === this.currentEditId);
                if (index !== -1) {
                    this.employees[index] = {
                        ...this.employees[index],
                        employeeId,
                        name,
                        email,
                        phone,
                        role,
                        status,
                        username: username,
                        updatedAt: new Date().toISOString()
                    };
                    
                    this.saveEmployees();
                    this.renderEmployees();
                    
                    if (typeof authManager !== 'undefined') {
                        authManager.loadUsers();
                    }
                    
                    const modalElement = document.getElementById('employeeModal');
                    if (modalElement) {
                        const modal = bootstrap.Modal.getInstance(modalElement);
                        if (modal) {
                            modal.hide();
                        }
                    }
                    
                    this.showAlert('Employee updated successfully!', 'success');
                }
            } else {
                // Add new employee with default password "welcome"
                const newEmployee = {
                    id: this.generateId(),
                    employeeId,
                    name,
                    email,
                    phone,
                    role,
                    status,
                    username: username,
                    password: defaultPassword,
                    firstLogin: true,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                
                this.employees.push(newEmployee);
                this.saveEmployees();
                this.renderEmployees();
                
                if (typeof authManager !== 'undefined') {
                    authManager.loadUsers();
                }
                
                const modalElement = document.getElementById('employeeModal');
                if (modalElement) {
                    const modal = bootstrap.Modal.getInstance(modalElement);
                    if (modal) {
                        modal.hide();
                    }
                }
                
                const successMessage = `Employee added successfully!<br><br>
                    <strong>Login Credentials:</strong><br>
                    Username: <code>${username}</code><br>
                    Password: <code>${defaultPassword}</code><br><br>
                    <small class="text-muted">User must change password on first login.</small>`;
                
                this.showAlert(successMessage, 'success', 10000);
                
                console.log('New Employee Created:', {
                    username: username,
                    password: defaultPassword,
                    employeeId: employeeId,
                    name: name,
                    email: email,
                    role: role,
                    firstLogin: true
                });
            }
        } catch (error) {
            console.error('Error saving employee:', error);
            alert('Error saving employee. Please try again.');
        }
    }

    /**
     * Open change password modal
     */
    openChangePasswordModal(employeeId) {
        try {
            const employee = this.employees.find(emp => emp.id === employeeId);
            if (!employee) {
                alert('Employee not found!');
                return;
            }

            this.currentPasswordResetId = employeeId;
            const modalElement = document.getElementById('changePasswordModal');
            if (!modalElement) {
                console.error('Change password modal not found');
                return;
            }

            const modal = new bootstrap.Modal(modalElement);
            const employeeNameElement = document.getElementById('changePasswordEmployeeName');
            if (employeeNameElement) {
                employeeNameElement.textContent = employee.name || 'Employee';
            }

            // Reset form
            const newPasswordField = document.getElementById('newPassword');
            const confirmPasswordField = document.getElementById('confirmPassword');
            if (newPasswordField) newPasswordField.value = '';
            if (confirmPasswordField) confirmPasswordField.value = '';

            modal.show();
        } catch (error) {
            console.error('Error opening change password modal:', error);
            alert('Error opening password change form. Please try again.');
        }
    }

    /**
     * Save changed password
     */
    saveChangedPassword() {
        try {
            if (!this.currentPasswordResetId) {
                alert('No employee selected for password change.');
                return;
            }

            const newPassword = document.getElementById('newPassword')?.value.trim() || '';
            const confirmPassword = document.getElementById('confirmPassword')?.value.trim() || '';

            if (!newPassword || !confirmPassword) {
                alert('Please fill in both password fields.');
                return;
            }

            if (newPassword !== confirmPassword) {
                alert('Passwords do not match. Please try again.');
                return;
            }

            if (newPassword.length < 8) {
                alert('Password must be at least 8 characters long.');
                return;
            }

            const employee = this.employees.find(emp => emp.id === this.currentPasswordResetId);
            if (!employee) {
                alert('Employee not found!');
                return;
            }

            // Update password and set firstLogin to false
            employee.password = newPassword;
            employee.firstLogin = false;
            employee.updatedAt = new Date().toISOString();

            this.saveEmployees();
            this.renderEmployees();

            // Reload users in auth manager
            if (typeof authManager !== 'undefined') {
                authManager.loadUsers();
            }

            // Close modal
            const modalElement = document.getElementById('changePasswordModal');
            if (modalElement) {
                const modal = bootstrap.Modal.getInstance(modalElement);
                if (modal) {
                    modal.hide();
                }
            }

            this.showAlert('Password changed successfully!', 'success');
            this.currentPasswordResetId = null;
        } catch (error) {
            console.error('Error saving changed password:', error);
            alert('Error changing password. Please try again.');
        }
    }

    /**
     * Reset password to default "welcome"
     */
    resetToDefaultPassword(employeeId) {
        try {
            const employee = this.employees.find(emp => emp.id === employeeId);
            if (!employee) {
                alert('Employee not found!');
                return;
            }

            if (confirm(`Reset password to default "welcome" for ${employee.name}?`)) {
                employee.password = 'welcome';
                employee.firstLogin = true;
                employee.updatedAt = new Date().toISOString();

                this.saveEmployees();
                this.renderEmployees();

                // Reload users in auth manager
                if (typeof authManager !== 'undefined') {
                    authManager.loadUsers();
                }

                this.showAlert('Password reset to default: welcome', 'success');
            }
        } catch (error) {
            console.error('Error resetting password:', error);
            alert('Error resetting password. Please try again.');
        }
    }

    /**
     * Reset password form
     */
    resetPasswordForm() {
        try {
            const newPasswordField = document.getElementById('newPassword');
            const confirmPasswordField = document.getElementById('confirmPassword');
            if (newPasswordField) newPasswordField.value = '';
            if (confirmPasswordField) confirmPasswordField.value = '';
            this.currentPasswordResetId = null;
        } catch (error) {
            console.error('Error resetting password form:', error);
        }
    }

    /**
     * Reset form
     */
    resetForm() {
        try {
            const form = document.getElementById('employeeForm');
            if (form) {
                form.reset();
                form.classList.remove('was-validated');
            }
            
            const passwordRow = document.getElementById('passwordRow');
            if (passwordRow) {
                passwordRow.style.display = 'none';
            }
            
            this.currentEditId = null;
        } catch (error) {
            console.error('Error resetting form:', error);
        }
    }

    /**
     * Clear filters
     */
    clearFilters() {
        try {
            const searchInput = document.getElementById('searchInput');
            const filterRole = document.getElementById('filterRole');
            const filterStatus = document.getElementById('filterStatus');
            
            if (searchInput) searchInput.value = '';
            if (filterRole) filterRole.value = '';
            if (filterStatus) filterStatus.value = '';
            
            this.renderEmployees();
        } catch (error) {
            console.error('Error clearing filters:', error);
        }
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return 'emp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Show alert message
     */
    showAlert(message, type = 'info', duration = 5000) {
        try {
            const existingAlerts = document.querySelectorAll('.custom-alert');
            existingAlerts.forEach(alert => alert.remove());
            
            const alertDiv = document.createElement('div');
            alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3 custom-alert`;
            alertDiv.style.zIndex = '9999';
            alertDiv.style.maxWidth = '500px';
            alertDiv.innerHTML = `
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            `;
            
            document.body.appendChild(alertDiv);
            
            setTimeout(() => {
                if (alertDiv.parentNode) {
                    alertDiv.classList.remove('show');
                    setTimeout(() => {
                        if (alertDiv.parentNode) {
                            alertDiv.remove();
                        }
                    }, 300);
                }
            }, duration);
        } catch (error) {
            console.error('Error showing alert:', error);
            alert(message.replace(/<[^>]*>/g, ''));
        }
    }
}

// Global functions for onclick handlers
function openEmployeeModal() {
    if (employeeManager) {
        employeeManager.openModal();
    }
}

function saveEmployee() {
    if (employeeManager) {
        employeeManager.saveEmployee();
    }
}

function clearFilters() {
    if (employeeManager) {
        employeeManager.clearFilters();
    }
}

function confirmDelete() {
    if (employeeManager) {
        employeeManager.confirmDelete();
    }
}

function saveChangedPassword() {
    if (employeeManager) {
        employeeManager.saveChangedPassword();
    }
}

// Initialize Employee Manager
let employeeManager;
document.addEventListener('DOMContentLoaded', () => {
    try {
        employeeManager = new EmployeeManager();
    } catch (error) {
        console.error('Error initializing Employee Manager:', error);
    }
});