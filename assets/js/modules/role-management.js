


/**
 * Role Management Module
 * Handles CRUD operations for roles and permissions with localStorage
 * Access restricted to Admin users only
 */

// Role Management Class
class RoleManager {
    constructor() {
        this.roles = [];
        this.currentEditId = null;
        this.deleteId = null;
        this.permissions = [
            'Manage Employees',
            'Manage Roles',
            'View Dashboard',
            'Modify Settings',
            'Approve Documents',
            'Create Documents',
            'View Reports',
            'Export Data',
            'Manage Vendors',
            'Manage Audits'
        ];
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

        // Load roles from localStorage
        this.loadRoles();
        
        // Render roles table
        this.renderRoles();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Display current user
        this.displayCurrentUser();
        
        // Render permissions in modal
        this.renderPermissions();
    }

    /**
     * Check if current user is Admin
     */
    checkAdminAccess() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        if (!currentUser || currentUser.role !== 'Admin') {
            alert('Access Denied! Only Admin users can access Role Management.');
            window.location.href = '../dashboard.html';
            return false;
        }
        return true;
    }

    /**
     * Display current user in navbar
     */
    displayCurrentUser() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const userElement = document.getElementById('currentUser');
        if (userElement && currentUser.name) {
            userElement.textContent = currentUser.name;
        }
    }

    /**
     * Load roles from localStorage
     */
    loadRoles() {
        const stored = localStorage.getItem('roles');
        if (stored) {
            this.roles = JSON.parse(stored);
        } else {
            // Initialize with default roles if empty
            this.roles = [];
            this.saveRoles();
        }
    }

    /**
     * Save roles to localStorage
     */
    saveRoles() {
        localStorage.setItem('roles', JSON.stringify(this.roles));
    }

    /**
     * Render permissions checkboxes in modal
     */
    renderPermissions() {
        const permissionsList = document.getElementById('permissionsList');
        if (!permissionsList) return;

        permissionsList.innerHTML = '';
        
        this.permissions.forEach(permission => {
            const div = document.createElement('div');
            div.className = 'form-check mb-2';
            div.innerHTML = `
                <input class="form-check-input" type="checkbox" value="${permission}" id="perm_${permission.replace(/\s+/g, '_')}">
                <label class="form-check-label" for="perm_${permission.replace(/\s+/g, '_')}">
                    ${permission}
                </label>
            `;
            permissionsList.appendChild(div);
        });
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('searchRole');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.renderRoles());
        }

        // Form validation
        const form = document.getElementById('roleForm');
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
        const roleModal = document.getElementById('roleModal');
        if (roleModal) {
            roleModal.addEventListener('hidden.bs.modal', () => {
                this.resetForm();
            });
        }
    }

    /**
     * Get filtered roles based on search
     */
    getFilteredRoles() {
        const searchTerm = document.getElementById('searchRole')?.value.toLowerCase() || '';
        
        if (!searchTerm) {
            return this.roles;
        }

        return this.roles.filter(role => 
            role.roleName.toLowerCase().includes(searchTerm) ||
            (role.description && role.description.toLowerCase().includes(searchTerm)) ||
            role.permissions.some(perm => perm.toLowerCase().includes(searchTerm))
        );
    }

    /**
     * Render roles table
     */
    renderRoles() {
        const tbody = document.getElementById('roleTableBody');
        const filteredRoles = this.getFilteredRoles();

        if (!tbody) return;

        // Clear table
        tbody.innerHTML = '';

        if (filteredRoles.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-muted">
                        <i class="bi bi-inbox me-2"></i>No roles found. Click "Create Role" to get started.
                    </td>
                </tr>
            `;
            return;
        }

        // Render roles
        filteredRoles.forEach(role => {
            const row = document.createElement('tr');
            const permissionsText = role.permissions.length > 0 
                ? role.permissions.join(', ') 
                : 'No permissions';
            const createdDate = role.createdAt 
                ? new Date(role.createdAt).toLocaleDateString() 
                : 'N/A';
            
            row.innerHTML = `
                <td><strong>${this.escapeHtml(role.roleName)}</strong></td>
                <td>${this.escapeHtml(role.description || 'N/A')}</td>
                <td>
                    <span class="badge bg-secondary me-1">${role.permissions.length} permission(s)</span>
                    <small class="text-muted">${this.escapeHtml(permissionsText.length > 50 ? permissionsText.substring(0, 50) + '...' : permissionsText)}</small>
                </td>
                <td>${createdDate}</td>
                <td>
                    <button class="btn btn-sm btn-primary me-1" onclick="roleManager.editRole('${role.id}')" title="Edit">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="roleManager.deleteRole('${role.id}')" title="Delete">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    /**
     * Open role modal for adding new role
     */
    openModal() {
        this.currentEditId = null;
        const modal = new bootstrap.Modal(document.getElementById('roleModal'));
        const modalTitle = document.getElementById('roleModalTitle');
        
        if (modalTitle) {
            modalTitle.textContent = 'Create Role';
        }
        
        this.resetForm();
        modal.show();
    }

    /**
     * Edit role
     */
    editRole(id) {
        const role = this.roles.find(r => r.id === id);
        if (!role) {
            alert('Role not found!');
            return;
        }

        this.currentEditId = id;
        const modal = new bootstrap.Modal(document.getElementById('roleModal'));
        const modalTitle = document.getElementById('roleModalTitle');
        
        if (modalTitle) {
            modalTitle.textContent = 'Edit Role';
        }

        // Populate form
        document.getElementById('roleId').value = role.id;
        document.getElementById('roleName').value = role.roleName;
        document.getElementById('roleDescription').value = role.description || '';

        // Check selected permissions
        role.permissions.forEach(permission => {
            const checkbox = document.getElementById(`perm_${permission.replace(/\s+/g, '_')}`);
            if (checkbox) {
                checkbox.checked = true;
            }
        });

        modal.show();
    }

    /**
     * Delete role
     */
    deleteRole(id) {
        const role = this.roles.find(r => r.id === id);
        if (!role) {
            alert('Role not found!');
            return;
        }

        // Check if role is being used by employees
        const employees = JSON.parse(localStorage.getItem('employees') || '[]');
        const employeesUsingRole = employees.filter(emp => emp.role === role.roleName);
        
        if (employeesUsingRole.length > 0) {
            alert(`Cannot delete role "${role.roleName}" because it is assigned to ${employeesUsingRole.length} employee(s). Please reassign employees first.`);
            return;
        }

        if (confirm(`Are you sure you want to delete role "${role.roleName}"? This action cannot be undone.`)) {
            this.roles = this.roles.filter(r => r.id !== id);
            this.saveRoles();
            this.renderRoles();
            this.showAlert('Role deleted successfully!', 'success');
        }
    }

    /**
     * Save role (add or update)
     */
    saveRole() {
        const roleName = document.getElementById('roleName')?.value.trim();
        const description = document.getElementById('roleDescription')?.value.trim();

        // Validate role name
        if (!roleName) {
            alert('Please enter a role name.');
            document.getElementById('roleName')?.focus();
            return;
        }

        // Get selected permissions
        const selectedPermissions = [];
        this.permissions.forEach(permission => {
            const checkbox = document.getElementById(`perm_${permission.replace(/\s+/g, '_')}`);
            if (checkbox && checkbox.checked) {
                selectedPermissions.push(permission);
            }
        });

        // Validate permissions
        if (selectedPermissions.length === 0) {
            alert('Please select at least one permission.');
            return;
        }

        // Check for duplicate role name (if not editing)
        if (!this.currentEditId) {
            const duplicate = this.roles.find(r => r.roleName.toLowerCase() === roleName.toLowerCase());
            if (duplicate) {
                alert('Role name already exists! Please use a different name.');
                return;
            }
        } else {
            // Check for duplicate role name (excluding current role)
            const duplicate = this.roles.find(r => r.roleName.toLowerCase() === roleName.toLowerCase() && r.id !== this.currentEditId);
            if (duplicate) {
                alert('Role name already exists! Please use a different name.');
                return;
            }
        }

        // Create or update role
        if (this.currentEditId) {
            // Update existing
            const index = this.roles.findIndex(r => r.id === this.currentEditId);
            if (index !== -1) {
                this.roles[index] = {
                    ...this.roles[index],
                    roleName,
                    description,
                    permissions: selectedPermissions,
                    updatedAt: new Date().toISOString()
                };
                this.showAlert('Role updated successfully!', 'success');
            }
        } else {
            // Add new
            const newRole = {
                id: this.generateId(),
                roleName,
                description,
                permissions: selectedPermissions,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            this.roles.push(newRole);
            this.showAlert('Role created successfully!', 'success');
        }

        // Save and render
        this.saveRoles();
        this.renderRoles();

        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('roleModal'));
        if (modal) {
            modal.hide();
        }
    }

    /**
     * Reset form
     */
    resetForm() {
        document.getElementById('roleId').value = '';
        document.getElementById('roleName').value = '';
        document.getElementById('roleDescription').value = '';
        
        // Uncheck all permissions
        this.permissions.forEach(permission => {
            const checkbox = document.getElementById(`perm_${permission.replace(/\s+/g, '_')}`);
            if (checkbox) {
                checkbox.checked = false;
            }
        });
        
        this.currentEditId = null;
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return 'role_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Show alert message
     */
    showAlert(message, type = 'info') {
        // Create alert element
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
        alertDiv.style.zIndex = '9999';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(alertDiv);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 3000);
    }
}

// Global functions for onclick handlers
function openRoleModal() {
    if (roleManager) {
        roleManager.openModal();
    }
}

function saveRole() {
    if (roleManager) {
        roleManager.saveRole();
    }
}

// Initialize Role Manager
let roleManager;
document.addEventListener('DOMContentLoaded', () => {
    roleManager = new RoleManager();
});