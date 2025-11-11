// Main Application Script
document.addEventListener('DOMContentLoaded', function() {
    // Login form handler
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;
            const loginError = document.getElementById('loginError');
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            
            // Clear previous errors
            loginError.classList.add('d-none');
            loginError.textContent = '';
            
            // Validate inputs
            if (!username || !password) {
                loginError.textContent = 'Please enter both username and password';
                loginError.classList.remove('d-none');
                return;
            }
            
            // Disable submit button
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Logging in...';
            
            // Attempt login
            const result = authManager.login(username, password);
            
            if (result.success) {
                // Store remember me preference
                const rememberMe = document.getElementById('rememberMe').checked;
                if (rememberMe) {
                    localStorage.setItem('rememberUsername', username);
                } else {
                    localStorage.removeItem('rememberUsername');
                }
                
                // Check if password change is required (only for employees with firstLogin)
                if (result.requiresPasswordChange) {
                    // Show password change modal instead of redirecting
                    const modalElement = document.getElementById('firstLoginPasswordModal');
                    if (modalElement) {
                        const modal = new bootstrap.Modal(modalElement);
                        modal.show();
                    } else {
                        // Fallback: redirect to dashboard with flag
                        localStorage.setItem('requiresPasswordChange', 'true');
                        window.location.href = 'dashboard.html';
                    }
                } else {
                    // Normal login - redirect to dashboard
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 500);
                }
            } else {
                // Show error
                loginError.textContent = result.message;
                loginError.classList.remove('d-none');
                
                // Re-enable submit button
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="bi bi-box-arrow-in-right me-2"></i>Login';
            }
        });
    }
    
    // First login password change handler
    const firstLoginPasswordForm = document.getElementById('firstLoginPasswordForm');
    if (firstLoginPasswordForm) {
        firstLoginPasswordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const newPassword = document.getElementById('firstLoginNewPassword')?.value.trim() || '';
            const confirmPassword = document.getElementById('firstLoginConfirmPassword')?.value.trim() || '';
            const errorDiv = document.getElementById('firstLoginPasswordError');
            
            // Clear previous errors
            if (errorDiv) {
                errorDiv.classList.add('d-none');
                errorDiv.textContent = '';
            }
            
            // Validate
            if (!newPassword || !confirmPassword) {
                if (errorDiv) {
                    errorDiv.textContent = 'Please fill in both password fields.';
                    errorDiv.classList.remove('d-none');
                }
                return;
            }
            
            if (newPassword !== confirmPassword) {
                if (errorDiv) {
                    errorDiv.textContent = 'Passwords do not match. Please try again.';
                    errorDiv.classList.remove('d-none');
                }
                return;
            }
            
            if (newPassword.length < 8) {
                if (errorDiv) {
                    errorDiv.textContent = 'Password must be at least 8 characters long.';
                    errorDiv.classList.remove('d-none');
                }
                return;
            }
            
            // Get current user
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            if (!currentUser || !currentUser.username) {
                if (errorDiv) {
                    errorDiv.textContent = 'Session expired. Please login again.';
                    errorDiv.classList.remove('d-none');
                }
                return;
            }
            
            // Change password
            const result = authManager.changePassword(currentUser.username, newPassword);
            
            if (result.success) {
                // Update current user
                currentUser.requiresPasswordChange = false;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                
                // Close modal
                const modalElement = document.getElementById('firstLoginPasswordModal');
                if (modalElement) {
                    const modal = bootstrap.Modal.getInstance(modalElement);
                    if (modal) {
                        modal.hide();
                    }
                }
                
                // Redirect to dashboard
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 500);
            } else {
                if (errorDiv) {
                    errorDiv.textContent = result.message || 'Error changing password. Please try again.';
                    errorDiv.classList.remove('d-none');
                }
            }
        });
    }
    
    // Password toggle
    const togglePassword = document.getElementById('togglePassword');
    if (togglePassword) {
        togglePassword.addEventListener('click', function() {
            const passwordInput = document.getElementById('password');
            const icon = this.querySelector('i');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.classList.remove('bi-eye');
                icon.classList.add('bi-eye-slash');
            } else {
                passwordInput.type = 'password';
                icon.classList.remove('bi-eye-slash');
                icon.classList.add('bi-eye');
            }
        });
    }
    
    // Load remembered username
    const rememberedUsername = localStorage.getItem('rememberUsername');
    if (rememberedUsername) {
        const usernameInput = document.getElementById('username');
        const rememberMeCheckbox = document.getElementById('rememberMe');
        if (usernameInput) {
            usernameInput.value = rememberedUsername;
        }
        if (rememberMeCheckbox) {
            rememberMeCheckbox.checked = true;
        }
    }
    
    // Forgot password handler
    const resetPasswordBtn = document.getElementById('resetPasswordBtn');
    if (resetPasswordBtn) {
        resetPasswordBtn.addEventListener('click', function() {
            const resetUsername = document.getElementById('resetUsername').value.trim();
            if (!resetUsername) {
                alert('Please enter your username');
                return;
            }
            
            // In a real app, this would send a reset email
            alert('Password reset instructions would be sent to your registered email address.');
            const modal = bootstrap.Modal.getInstance(document.getElementById('forgotPasswordModal'));
            if (modal) {
                modal.hide();
            }
        });
    }
});
