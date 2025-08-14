// Global authentication helper
class AuthManager {
    static checkAuthStatus() {
        const token = localStorage.getItem('authToken');
        const userData = localStorage.getItem('userData');
        
        return token && userData;
    }
    
    static getUserData() {
        const userData = localStorage.getItem('userData');
        return userData ? JSON.parse(userData) : null;
    }
    
    static logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        localStorage.removeItem('hasDownloadedCertificates');
        window.location.href = '/login.html';
    }
    
    static markCertificatesDownloaded() {
        localStorage.setItem('hasDownloadedCertificates', 'true');
        this.updateNavbar();
    }
    
    static hasDownloadedCertificates() {
        return localStorage.getItem('hasDownloadedCertificates') === 'true';
    }
    
    static updateNavbar() {
        const isLoggedIn = this.checkAuthStatus();
        const navbar = document.querySelector('.navbar');
        
        if (!navbar) return;
        
        const navLinks = navbar.querySelector('.navbar-nav');
        const hasDownloaded = this.hasDownloadedCertificates();
        
        if (isLoggedIn) {
            const userData = this.getUserData();
            const downloadStatus = hasDownloaded ? 'style="background: #27ae60; color: white;"' : '';
            
            navLinks.innerHTML = `
                <li><span class="nav-link" style="color: #3498db;">
                    <i class="fas fa-university"></i>
                    ${userData?.college?.name || 'College'}
                </span></li>
                <li><a href="/dashboard.html" class="nav-link">
                    <i class="fas fa-tachometer-alt"></i>
                    Dashboard
                </a></li>
                <li><a href="/index.html#certificate-generator" class="nav-link" ${downloadStatus}>
                    <i class="fas fa-certificate"></i>
                    Generate Certificates
                </a></li>
                <li><a href="#" onclick="AuthManager.logout()" class="nav-link btn-primary">
                    <i class="fas fa-sign-out-alt"></i>
                    Logout
                </a></li>
            `;
        } else {
            navLinks.innerHTML = `
                <li><a href="/login.html" class="nav-link btn-primary">
                    <i class="fas fa-sign-in-alt"></i>
                    Login
                </a></li>
            `;
        }
    }
    
    static init() {
        // Update navbar on page load
        document.addEventListener('DOMContentLoaded', () => {
            this.updateNavbar();
        });
    }
}

// Initialize auth manager
AuthManager.init();

// Make it globally available
window.AuthManager = AuthManager;
