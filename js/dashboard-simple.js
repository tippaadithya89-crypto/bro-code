// Simplified Dashboard Class for certificate generation focus
class Dashboard {
    constructor() {
        this.baseURL = window.location.protocol + '//' + window.location.host + '/api';
        this.checkAuthentication();
        this.loadUserInfo();
        this.setupEventListeners();
    }

    checkAuthentication() {
        const token = localStorage.getItem('authToken');
        if (!token) {
            window.location.href = 'login.html';
        }
    }

    getAuthHeaders() {
        return {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
        };
    }

    loadUserInfo() {
        const userData = JSON.parse(localStorage.getItem('userData'));
        if (userData) {
            document.getElementById('collegeName').textContent = userData.college.name;
            // College name is now shown in navbar via auth.js
        }
    }

    setupEventListeners() {
        // Navigation
        document.getElementById('generateCertificatesCard').addEventListener('click', () => {
            // Redirect to certificate generation page
            window.location.href = '/index.html#certificate-generator';
        });
    }

    showSuccess(message) {
        this.clearMessages();
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
        
        const main = document.querySelector('.dashboard-main');
        main.insertBefore(successDiv, main.firstChild);
        
        setTimeout(() => {
            successDiv.remove();
        }, 5000);
    }

    showError(message) {
        this.clearMessages();
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        
        const main = document.querySelector('.dashboard-main');
        main.insertBefore(errorDiv, main.firstChild);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    clearMessages() {
        const existingMessages = document.querySelectorAll('.success-message, .error-message');
        existingMessages.forEach(msg => msg.remove());
    }
}

// Global dashboard instance
let dashboard;

// Global logout function for navbar
function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    window.location.href = 'login.html';
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new Dashboard();
});
