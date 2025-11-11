// Authentication Module
class AuthManager {
    constructor() {
        //this.users = this.loadUsers();
        this.currentUser = null;
        this.failedAttempts = {};
        this.maxAttempts = 5;
        this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
        this.lastActivity = null;
        this.init();
    }

    init() {
        this.loadUsers();
        // Check if user is already logged in
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            this.currentUser = JSON.parse(storedUser);
            this.checkSession();
        }

        // Load last login
        this.displayLastLogin();
        
        // Setup inactivity monitoring
        this.setupInactivityMonitoring();
        
        // Prevent multiple logins
        this.checkMultipleLogins();
    }

    loadUsers() {
        // Default users for each role
        const defaultUsers = [
            { username: 'initiator', password: 'Initiator@123', role: 'Initiator', name: 'John Doe' },
            { username: 'hod', password: 'HOD@123', role: 'HOD', name: 'Jane Smith' },
            { username: 'qa_manager', password: 'QAManager@123', role: 'QA Manager', name: 'Robert Johnson' },
            { username: 'head_qa', password: 'HeadQA@123', role: 'Head QA', name: 'Sarah Williams' },
            { username: 'plant_head', password: 'PlantHead@123', role: 'Plant Head', name: 'Michael Brown' },
            { username: 'analytical_qa', password: 'AnalyticalQA@123', role: 'Analytical QA Incharge', name: 'Emily Davis' },
            { username: 'head_qc', password: 'HeadQC@123', role: 'Head QC', name: 'David Wilson' },
            { username: 'operating_manager', password: 'OpManager@123', role: 'Operating Manager CQA', name: 'Lisa Anderson' },
            { username: 'site_quality', password: 'SiteQuality@123', role: 'Site Quality Head', name: 'James Taylor' },
            { username: 'purchase_hod', password: 'PurchaseHOD@123', role: 'Purchase HOD', name: 'Patricia Martinez' },
            { username: 'head_cqa', password: 'HeadCQA@123', role: 'Head CQA', name: 'Christopher Garcia' },
            { username: 'admin', password: 'Admin@123', role: 'Admin', name: 'System Administrator' }
        ];

        // Start with default users
        this.users = [...defaultUsers];

        // Load employees from localStorage and add them as users
        const storedEmployees = localStorage.getItem('employees');
        if (storedEmployees) {
            try {
                const employees = JSON.parse(storedEmployees);
                employees.forEach(emp => {
                    // Only add active employees
                    if (emp.status === 'Active') {
                        // Get username from employee record
                        const username = emp.username || (emp.email ? emp.email.split('@')[0].toLowerCase() : '');
                        
                        if (!username) {
                            console.warn('Employee missing username:', emp);
                            return;
                        }
                        
                        // Check if user already exists (by username)
                        const existingUserIndex = this.users.findIndex(u => u.username === username);
                        
                        if (existingUserIndex === -1) {
                            // New employee - add to users array
                            this.users.push({
                                username: username,
                                password: emp.password || 'welcome',
                                role: emp.role,
                                name: emp.name,
                                email: emp.email,
                                employeeId: emp.employeeId
                            });
                        } else {
                            // Update existing user with employee data
                            this.users[existingUserIndex] = {
                                ...this.users[existingUserIndex],
                                password: emp.password || this.users[existingUserIndex].password,
                                role: emp.role,
                                name: emp.name,
                                email: emp.email,
                                employeeId: emp.employeeId
                            };
                        }
                    }
                });
            } catch (error) {
                console.error('Error loading employees into users:', error);
            }
        }

        return this.users;
    }

    validatePassword(password) {
        // Minimum 8 characters, alphanumeric + special character
        const minLength = 8;
        const hasAlpha = /[a-zA-Z]/.test(password);
        const hasNumeric = /[0-9]/.test(password);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        
        return password.length >= minLength && hasAlpha && hasNumeric && hasSpecial;
    }

    login(username, password) {
        // Check if account is locked
        if (this.failedAttempts[username] >= this.maxAttempts) {
            return {
                success: false,
                message: 'Account locked due to multiple failed login attempts. Please contact administrator.'
            };
        }

        // Find user
        const user = this.users.find(u => u.username === username);
        
        // if (!user) {
        //     this.recordFailedAttempt(username);
        //     return {
        //         success: false,
        //         message: 'Invalid username or password'
        //     };
        // }

        // // Validate password (in real app, this would be hashed)
        // if (user.password !== password) {
        //     this.recordFailedAttempt(username);
        //     return {
        //         success: false,
        //         message: 'Invalid username or password'
        //     };
        // }

        // Check if already logged in elsewhere
        if (localStorage.getItem('activeSession_' + username)) {
            return {
                success: false,
                message: 'User already logged in from another device. Please logout first.'
            };
        }

        // Successful login
        this.currentUser = {
            username: user.username,
            role: user.role,
            name: user.name,
            loginTime: new Date().toISOString()
        };

        // Store session
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        localStorage.setItem('activeSession_' + username, Date.now().toString());
        
        // Store last login
        localStorage.setItem('lastLogin_' + username, new Date().toISOString());
        
        // Reset failed attempts
        delete this.failedAttempts[username];
        
        // Set last activity
        this.lastActivity = Date.now();

        return {
            success: true,
            user: this.currentUser
        };
    }

    recordFailedAttempt(username) {
        if (!this.failedAttempts[username]) {
            this.failedAttempts[username] = 0;
        }
        this.failedAttempts[username]++;
    }

    logout() {
        if (this.currentUser) {
            localStorage.removeItem('activeSession_' + this.currentUser.username);
        }
        localStorage.removeItem('currentUser');
        this.currentUser = null;
        this.lastActivity = null;
    }

    isAuthenticated() {
        return this.currentUser !== null;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    checkSession() {
        if (!this.currentUser) return false;

        const sessionTime = localStorage.getItem('activeSession_' + this.currentUser.username);
        if (!sessionTime) {
            this.logout();
            return false;
        }

        const timeDiff = Date.now() - parseInt(sessionTime);
        if (timeDiff > this.sessionTimeout) {
            this.logout();
            alert('Session expired due to inactivity. Please login again.');
            window.location.href = 'index.html';
            return false;
        }

        return true;
    }

    setupInactivityMonitoring() {
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
        
        events.forEach(event => {
            document.addEventListener(event, () => {
                this.lastActivity = Date.now();
            });
        });

        setInterval(() => {
            if (this.lastActivity && this.currentUser) {
                const inactiveTime = Date.now() - this.lastActivity;
                if (inactiveTime > this.sessionTimeout) {
                    this.logout();
                    alert('Session expired due to inactivity. Please login again.');
                    window.location.href = 'index.html';
                }
            }
        }, 60000); // Check every minute
    }

    checkMultipleLogins() {
        // Clean up old sessions
        const now = Date.now();
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('activeSession_')) {
                const sessionTime = parseInt(localStorage.getItem(key));
                if (now - sessionTime > this.sessionTimeout) {
                    localStorage.removeItem(key);
                }
            }
        });
    }

    displayLastLogin() {
        const username = localStorage.getItem('lastUsername') || '';
        if (username) {
            const lastLogin = localStorage.getItem('lastLogin_' + username);
            if (lastLogin) {
                const date = new Date(lastLogin);
                const formatted = date.toLocaleString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                const lastLoginEl = document.getElementById('lastLogin');
                if (lastLoginEl) {
                    lastLoginEl.textContent = formatted;
                }
            }
        }
    }

    hasAccess(module, action) {
        if (!this.currentUser) return false;
        
        const role = this.currentUser.role;
        const roleAccess = {
            'Initiator': ['create', 'view'],
            'HOD': ['approve', 'view', 'reject'],
            'QA Manager': ['approve', 'view', 'reject', 'close'],
            'Head QA': ['approve', 'view', 'reject', 'close', 'final_approve'],
            'Plant Head': ['approve', 'view'],
            'Analytical QA Incharge': ['approve', 'view', 'investigate'],
            'Head QC': ['approve', 'view', 'investigate'],
            'Operating Manager CQA': ['approve', 'view'],
            'Site Quality Head': ['approve', 'view', 'final_approve'],
            'Purchase HOD': ['approve', 'view'],
            'Head CQA': ['approve', 'view', 'final_approve'],
            'Admin': ['create', 'view', 'edit', 'delete', 'approve', 'reject', 'close', 'investigate', 'final_approve', 'export', 'import']
        };

        const allowedActions = roleAccess[role] || [];
        return allowedActions.includes(action);
    }

    /**
     * Change user password
     */
    changePassword(username, newPassword) {
        try {
            // Update in employees array
            const storedEmployees = localStorage.getItem('employees');
            if (storedEmployees) {
                const employees = JSON.parse(storedEmployees);
                const employeeIndex = employees.findIndex(emp => 
                    emp.username === username || 
                    emp.email?.split('@')[0].toLowerCase() === username
                );
                
                if (employeeIndex !== -1) {
                    employees[employeeIndex].password = newPassword;
                    employees[employeeIndex].firstLogin = false;
                    employees[employeeIndex].updatedAt = new Date().toISOString();
                    localStorage.setItem('employees', JSON.stringify(employees));
                }
            }

            // Reload users to update the users array
            this.loadUsers();

            return {
                success: true,
                message: 'Password changed successfully!'
            };
        } catch (error) {
            console.error('Error changing password:', error);
            return {
                success: false,
                message: 'Error changing password. Please try again.'
            };
        }
    }

    isAdmin() {
        return this.currentUser && this.currentUser.role === 'Admin';
    }
}

// Initialize auth manager
const authManager = new AuthManager();

