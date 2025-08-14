// Dashboard functionality
class Dashboard {
    constructor() {
        this.baseURL = 'http://localhost:3000/api';
        this.currentView = 'dashboard';
        this.students = [];
        this.filteredStudents = [];
        this.init();
    }

    init() {
        // Check authentication
        if (!this.isAuthenticated()) {
            window.location.href = 'login.html';
            return;
        }

        this.loadUserInfo();
        this.setupEventListeners();
    }

    isAuthenticated() {
        return localStorage.getItem('authToken') && localStorage.getItem('userData');
    }

    getAuthHeaders() {
        const token = localStorage.getItem('authToken');
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }

    loadUserInfo() {
        const userData = JSON.parse(localStorage.getItem('userData'));
        if (userData) {
            document.getElementById('collegeName').textContent = userData.college.name;
            // userInfo element removed - college name is now shown in navbar
        }
    }

    setupEventListeners() {
        // Navigation
        // logoutBtn removed - logout is now in navbar
        document.getElementById('generateCertificatesCard').addEventListener('click', () => {
            // Redirect to certificate generation page
            window.location.href = '/index.html#certificate-generator';
        });
    }

    setupModalEvents() {
        // Simplified - no modals needed for basic dashboard
    }
        document.getElementById('addStudentForm').addEventListener('submit', this.addStudent.bind(this));

        // Bulk Upload Modal
        document.getElementById('closeBulkUploadModal').addEventListener('click', this.closeBulkUploadModal.bind(this));
        document.getElementById('csvUploadArea').addEventListener('click', () => document.getElementById('csvFileInput').click());
        document.getElementById('csvFileInput').addEventListener('change', this.handleBulkUpload.bind(this));
        document.getElementById('downloadStudentTemplate').addEventListener('click', this.downloadStudentTemplate.bind(this));

        // Close modals on outside click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        });
    }

    showSection(section) {
        // Hide all sections
        document.querySelectorAll('.dashboard-options, .student-management, .certificate-generation').forEach(el => {
            el.style.display = 'none';
        });

        this.currentView = section;

        switch (section) {
            case 'dashboard':
                document.querySelector('.dashboard-options').style.display = 'grid';
                break;
            case 'studentManagement':
                document.querySelector('.student-management').style.display = 'block';
                this.loadStudents();
                break;
            case 'certificateGeneration':
                document.querySelector('.certificate-generation').style.display = 'block';
                break;
        }
    }

    async loadStudents() {
        try {
            this.showLoadingState();
            
            const response = await fetch(`${this.baseURL}/students`, {
                headers: this.getAuthHeaders()
            });

            if (response.ok) {
                this.students = await response.json();
                this.filteredStudents = [...this.students];
                this.displayStudents();
                this.updateStudentStats();
            } else {
                throw new Error('Failed to load students');
            }
        } catch (error) {
            console.error('Error loading students:', error);
            this.showError('Failed to load students. Please try again.');
        }
    }

    displayStudents() {
        const studentList = document.getElementById('studentList');
        
        if (this.filteredStudents.length === 0) {
            studentList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users"></i>
                    <h3>No students found</h3>
                    <p>Start by adding students to your college database.</p>
                </div>
            `;
            return;
        }

        studentList.innerHTML = this.filteredStudents.map(student => `
            <div class="student-item">
                <div class="student-item-header">
                    <span class="student-name">${student.name}</span>
                    <div class="student-actions">
                        <button class="btn btn-small btn-secondary" onclick="dashboard.editStudent('${student._id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-small btn-danger" onclick="dashboard.deleteStudent('${student._id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
                <div class="student-details">
                    ${student.rollNumber ? `<div class="student-detail"><strong>Roll Number:</strong> ${student.rollNumber}</div>` : ''}
                    ${student.email ? `<div class="student-detail"><strong>Email:</strong> ${student.email}</div>` : ''}
                    ${student.phone ? `<div class="student-detail"><strong>Phone:</strong> ${student.phone}</div>` : ''}
                    ${student.course ? `<div class="student-detail"><strong>Course:</strong> ${student.course}</div>` : ''}
                    ${student.year ? `<div class="student-detail"><strong>Year:</strong> ${student.year}</div>` : ''}
                    ${student.section ? `<div class="student-detail"><strong>Section:</strong> ${student.section}</div>` : ''}
                </div>
            </div>
        `).join('');
    }

    updateStudentStats() {
        const total = this.students.length;
        document.getElementById('totalStudents').textContent = total;
    }

    filterStudents() {
        const searchTerm = document.getElementById('studentSearch').value.toLowerCase();

        this.filteredStudents = this.students.filter(student => {
            const matchesSearch = !searchTerm || 
                student.name.toLowerCase().includes(searchTerm) ||
                student.rollNumber?.toLowerCase().includes(searchTerm) ||
                student.email?.toLowerCase().includes(searchTerm) ||
                student.course?.toLowerCase().includes(searchTerm);

            return matchesSearch;
        });

        this.displayStudents();
    }

    showLoadingState() {
        const studentList = document.getElementById('studentList');
        studentList.innerHTML = `
            <div class="loading-state">
                <i class="fas fa-spinner"></i>
                <p>Loading students...</p>
            </div>
        `;
    }

    showAddStudentModal() {
        document.getElementById('addStudentModal').style.display = 'flex';
        document.getElementById('addStudentForm').reset();
    }

    closeAddStudentModal() {
        document.getElementById('addStudentModal').style.display = 'none';
    }

    async addStudent(e) {
        e.preventDefault();
        
        const studentData = {
            name: document.getElementById('studentName').value.trim(),
            rollNumber: document.getElementById('studentRollNumber').value.trim(),
            email: document.getElementById('studentEmail').value.trim(),
            phone: document.getElementById('studentPhone').value.trim(),
            course: document.getElementById('studentCourse').value.trim(),
            year: document.getElementById('studentYear').value,
            section: document.getElementById('studentSection').value.trim()
        };

        // Remove empty fields
        Object.keys(studentData).forEach(key => {
            if (!studentData[key]) delete studentData[key];
        });

        try {
            const response = await fetch(`${this.baseURL}/students`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(studentData)
            });

            if (response.ok) {
                this.showSuccess('Student added successfully!');
                this.closeAddStudentModal();
                this.loadStudents();
            } else {
                const error = await response.json();
                this.showError(error.error || 'Failed to add student');
            }
        } catch (error) {
            console.error('Error adding student:', error);
            this.showError('Failed to add student. Please try again.');
        }
    }

    showBulkUploadModal() {
        document.getElementById('bulkUploadModal').style.display = 'flex';
    }

    closeBulkUploadModal() {
        document.getElementById('bulkUploadModal').style.display = 'none';
    }

    async handleBulkUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.name.toLowerCase().endsWith('.csv')) {
            this.showError('Please select a CSV file.');
            return;
        }

        const formData = new FormData();
        formData.append('csvFile', file);

        try {
            const response = await fetch(`${this.baseURL}/students/bulk`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                let message = result.message;
                
                // Show duplicate roll numbers if any
                if (result.duplicates && result.duplicates.rollNumbers.length > 0) {
                    const duplicateList = result.duplicates.rollNumbers.join(', ');
                    message += `\n\nDuplicate roll numbers skipped: ${duplicateList}`;
                }
                
                this.showSuccess(message);
                this.closeBulkUploadModal();
                this.loadStudents();
            } else {
                this.showError(result.error || 'Failed to upload students');
            }
        } catch (error) {
            console.error('Error uploading students:', error);
            this.showError('Failed to upload students. Please try again.');
        }
    }

    async downloadStudentTemplate() {
        try {
            const response = await fetch(`${this.baseURL}/students/template`);
            const blob = await response.blob();
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'students_template.csv';
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading template:', error);
            this.showError('Failed to download template.');
        }
    }

    async deleteStudent(studentId) {
        if (!confirm('Are you sure you want to delete this student?')) {
            return;
        }

        try {
            const response = await fetch(`${this.baseURL}/students/${studentId}`, {
                method: 'DELETE',
                headers: this.getAuthHeaders()
            });

            if (response.ok) {
                this.showSuccess('Student deleted successfully!');
                this.loadStudents();
            } else {
                const error = await response.json();
                this.showError(error.error || 'Failed to delete student');
            }
        } catch (error) {
            console.error('Error deleting student:', error);
            this.showError('Failed to delete student. Please try again.');
        }
    }

    useCollegeStudents() {
        // Convert college students to certificate format and redirect
        if (this.students.length === 0) {
            this.showError('No students found in your college database. Please add students first.');
            return;
        }

        // Store college students data for certificate generation
        const certificateData = this.students.map(student => ({
            displayName: student.name,
            name: student.name,
            rollNumber: student.rollNumber || '',
            email: student.email || '',
            phone: student.phone || '',
            course: student.course || '',
            year: student.year || '',
            section: student.section || '',
            category: student.category || 'participation',
            event: 'College Event',
            date: new Date().toLocaleDateString()
        }));

        localStorage.setItem('certificateStudents', JSON.stringify(certificateData));
        window.location.href = 'index.html?source=college';
    }

    useCustomCSV() {
        // Redirect to main certificate generator
        window.location.href = 'index.html';
    }

    logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        window.location.href = 'login.html';
    }

    showSuccess(message) {
        this.clearMessages();
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
        
        const main = document.querySelector('.dashboard-main');
        main.insertBefore(successDiv, main.firstChild);
        
        setTimeout(() => successDiv.remove(), 5000);
    }

    showError(message) {
        this.clearMessages();
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;
        
        const main = document.querySelector('.dashboard-main');
        main.insertBefore(errorDiv, main.firstChild);
        
        setTimeout(() => errorDiv.remove(), 5000);
    }

    clearMessages() {
        document.querySelectorAll('.success-message, .error-message').forEach(msg => {
            msg.remove();
        });
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
