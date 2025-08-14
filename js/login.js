// Login functionality
class LoginManager {
    constructor() {
        this.baseURL = 'http://localhost:3000/api';
        this.init();
    }

    init() {
        this.loadColleges();
        this.setupEventListeners();
        this.checkExistingAuth();
    }

    setupEventListeners() {
        const loginForm = document.getElementById('loginForm');
        const passwordToggle = document.getElementById('passwordToggle');
        const passwordField = document.getElementById('password');

        loginForm.addEventListener('submit', this.handleLogin.bind(this));
        
        passwordToggle.addEventListener('click', () => {
            const type = passwordField.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordField.setAttribute('type', type);
            
            const icon = passwordToggle.querySelector('i');
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        });

        // Clear error messages on input
        document.querySelectorAll('input, select').forEach(input => {
            input.addEventListener('input', this.clearErrors.bind(this));
        });
    }

    async loadColleges() {
        try {
            const response = await fetch(`${this.baseURL}/colleges`);
            
            if (response.status === 503) {
                const error = await response.json();
                const collegeSelect = document.getElementById('college');
                collegeSelect.innerHTML = '<option value="">Database unavailable</option>';
                this.showError(error.error + ' Please check the server console for instructions.');
                return;
            }
            
            const colleges = await response.json();
            
            const collegeSelect = document.getElementById('college');
            collegeSelect.innerHTML = '<option value="">Select your college</option>';
            
            colleges.forEach(college => {
                const option = document.createElement('option');
                option.value = college._id;
                option.textContent = college.name;
                collegeSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading colleges:', error);
            this.showError('Failed to load colleges. Please check your connection and that the server is running.');
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const collegeId = document.getElementById('college').value;

        // Clear previous errors
        this.clearErrors();

        // Validation
        if (!collegeId) {
            this.showFieldError('college', 'Please select a college');
            return;
        }

        if (!username) {
            this.showFieldError('username', 'Username is required');
            return;
        }

        if (!password) {
            this.showFieldError('password', 'Password is required');
            return;
        }

        this.showLoading(true);

        try {
            const response = await fetch(`${this.baseURL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username,
                    password,
                    collegeId
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Store authentication data
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('userData', JSON.stringify(data.user));
                
                this.showSuccess('Login successful! Redirecting...');
                
                // Redirect to dashboard
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            } else {
                this.showError(data.error || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('Connection error. Please try again.');
        } finally {
            this.showLoading(false);
        }
    }

    checkExistingAuth() {
        const token = localStorage.getItem('authToken');
        const userData = localStorage.getItem('userData');
        
        if (token && userData) {
            // Verify token is still valid
            this.verifyToken(token).then(isValid => {
                if (isValid) {
                    window.location.href = 'dashboard.html';
                } else {
                    // Clear invalid token
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('userData');
                }
            });
        }
    }

    async verifyToken(token) {
        try {
            const response = await fetch(`${this.baseURL}/students`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        const loginBtn = document.getElementById('loginBtn');
        
        if (show) {
            overlay.style.display = 'flex';
            loginBtn.disabled = true;
        } else {
            overlay.style.display = 'none';
            loginBtn.disabled = false;
        }
    }

    showError(message) {
        this.clearMessages();
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;
        
        const form = document.getElementById('loginForm');
        form.insertBefore(errorDiv, form.firstChild);
    }

    showSuccess(message) {
        this.clearMessages();
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
        
        const form = document.getElementById('loginForm');
        form.insertBefore(successDiv, form.firstChild);
    }

    showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        const formGroup = field.closest('.form-group');
        formGroup.classList.add('error');
        
        // Remove existing error message
        const existingError = formGroup.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
        
        // Add new error message
        const errorSpan = document.createElement('span');
        errorSpan.className = 'field-error';
        errorSpan.style.color = '#dc3545';
        errorSpan.style.fontSize = '0.8rem';
        errorSpan.style.marginTop = '5px';
        errorSpan.style.display = 'block';
        errorSpan.textContent = message;
        
        formGroup.appendChild(errorSpan);
    }

    clearErrors() {
        // Clear form group errors
        document.querySelectorAll('.form-group').forEach(group => {
            group.classList.remove('error');
        });
        
        // Clear field error messages
        document.querySelectorAll('.field-error').forEach(error => {
            error.remove();
        });
        
        // Clear general messages
        this.clearMessages();
    }

    clearMessages() {
        document.querySelectorAll('.error-message, .success-message').forEach(msg => {
            msg.remove();
        });
    }
}

// Initialize login manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LoginManager();
});

// Utility function to check if user is authenticated
function isAuthenticated() {
    return localStorage.getItem('authToken') && localStorage.getItem('userData');
}

// Utility function to get user data
function getUserData() {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
}

// Utility function to logout
function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    window.location.href = 'login.html';
}
