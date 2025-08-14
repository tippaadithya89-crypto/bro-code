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
            const collegeNameElement = document.getElementById('collegeName');
            if (collegeNameElement) {
                collegeNameElement.textContent = userData.college.name;
            }
            // College name is now shown in navbar via auth.js
        }
    }

    setupEventListeners() {
        // Navigation to certificate generation
        const generateCard = document.getElementById('generateCertificatesCard');
        if (generateCard) {
            generateCard.addEventListener('click', () => {
                window.location.href = 'index.html#certificate-generator';
            });
        }
        
        // Navigation to student management
        const studentManagementCard = document.getElementById('studentManagementCard');
        if (studentManagementCard) {
            studentManagementCard.addEventListener('click', () => {
                this.showStudentManagement();
            });
        }
        
        // Navigation to template designer
        const templateDesignerCard = document.getElementById('templateDesignerCard');
        if (templateDesignerCard) {
            templateDesignerCard.addEventListener('click', () => {
                window.location.href = 'template-designer.html';
            });
        }

        // Back to dashboard buttons
        const backToDashboard = document.getElementById('backToDashboard');
        if (backToDashboard) {
            backToDashboard.addEventListener('click', () => {
                this.showDashboard();
            });
        }

        // Student management functionality
        this.setupStudentManagement();
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

    showDashboard() {
        document.querySelector('.dashboard-options').style.display = 'block';
        document.getElementById('studentManagement').style.display = 'none';
        document.getElementById('certificateGeneration').style.display = 'none';
    }

    showStudentManagement() {
        document.querySelector('.dashboard-options').style.display = 'none';
        document.getElementById('studentManagement').style.display = 'block';
        document.getElementById('certificateGeneration').style.display = 'none';
        this.loadStudents();
    }

    async loadStudents() {
        try {
            const response = await fetch(`${this.baseURL}/students`, {
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to load students');
            }

            const students = await response.json();
            this.displayStudents(students);
            this.updateStudentStats(students);

        } catch (error) {
            console.error('Error loading students:', error);
            this.showError('Failed to load students');
        }
    }

    displayStudents(students) {
        const studentList = document.getElementById('studentList');
        if (!studentList) return;

        if (students.length === 0) {
            studentList.innerHTML = `
                <div class="no-students">
                    <i class="fas fa-users"></i>
                    <h3>No Students Found</h3>
                    <p>Start by adding students to your college database</p>
                </div>
            `;
            return;
        }

        const studentsHTML = students.map(student => `
            <div class="student-item">
                <div class="student-info">
                    <h4>${student.name}</h4>
                    <p>Roll: ${student.rollNumber || 'N/A'} | Course: ${student.course || 'N/A'}</p>
                    <span class="student-contact">${student.email || ''} ${student.phone || ''}</span>
                </div>
                <div class="student-actions">
                    <button class="btn btn-sm btn-secondary" onclick="dashboard.editStudent('${student._id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="dashboard.deleteStudent('${student._id}', '${student.name}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');

        studentList.innerHTML = studentsHTML;
    }

    updateStudentStats(students) {
        const totalStudentsElement = document.getElementById('totalStudents');
        if (totalStudentsElement) {
            totalStudentsElement.textContent = students.length;
        }
    }

    setupStudentManagement() {
        // Add student button
        const addStudentBtn = document.getElementById('addStudentBtn');
        if (addStudentBtn) {
            addStudentBtn.addEventListener('click', () => {
                document.getElementById('addStudentModal').style.display = 'flex';
            });
        }

        // Close modals
        const closeAddStudentModal = document.getElementById('closeAddStudentModal');
        if (closeAddStudentModal) {
            closeAddStudentModal.addEventListener('click', () => {
                document.getElementById('addStudentModal').style.display = 'none';
            });
        }

        const closeBulkUploadModal = document.getElementById('closeBulkUploadModal');
        if (closeBulkUploadModal) {
            closeBulkUploadModal.addEventListener('click', () => {
                document.getElementById('bulkUploadModal').style.display = 'none';
            });
        }

        const cancelAddStudent = document.getElementById('cancelAddStudent');
        if (cancelAddStudent) {
            cancelAddStudent.addEventListener('click', () => {
                document.getElementById('addStudentModal').style.display = 'none';
            });
        }

        // Bulk upload
        const bulkUploadBtn = document.getElementById('bulkUploadBtn');
        if (bulkUploadBtn) {
            bulkUploadBtn.addEventListener('click', () => {
                document.getElementById('bulkUploadModal').style.display = 'flex';
            });
        }

        // Download template
        const downloadTemplateBtn = document.getElementById('downloadTemplateBtn');
        if (downloadTemplateBtn) {
            downloadTemplateBtn.addEventListener('click', () => {
                this.downloadStudentTemplate();
            });
        }

        // Student form submission
        const addStudentForm = document.getElementById('addStudentForm');
        if (addStudentForm) {
            addStudentForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addStudent();
            });
        }
    }

    async addStudent() {
        const formData = {
            name: document.getElementById('studentName').value,
            rollNumber: document.getElementById('studentRollNumber').value,
            email: document.getElementById('studentEmail').value,
            phone: document.getElementById('studentPhone').value,
            course: document.getElementById('studentCourse').value,
            year: document.getElementById('studentYear').value,
            section: document.getElementById('studentSection').value
        };

        try {
            const response = await fetch(`${this.baseURL}/students`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to add student');
            }

            this.showSuccess('Student added successfully');
            document.getElementById('addStudentModal').style.display = 'none';
            document.getElementById('addStudentForm').reset();
            this.loadStudents();

        } catch (error) {
            console.error('Error adding student:', error);
            this.showError(error.message);
        }
    }

    async downloadStudentTemplate() {
        try {
            const response = await fetch(`${this.baseURL}/students/template`, {
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to download template');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'student_template.csv';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (error) {
            console.error('Error downloading template:', error);
            this.showError('Failed to download template');
        }
    }

    async deleteStudent(studentId, studentName) {
        if (!confirm(`Are you sure you want to delete ${studentName}?`)) {
            return;
        }

        try {
            const response = await fetch(`${this.baseURL}/students/${studentId}`, {
                method: 'DELETE',
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to delete student');
            }

            this.showSuccess('Student deleted successfully');
            this.loadStudents();

        } catch (error) {
            console.error('Error deleting student:', error);
            this.showError('Failed to delete student');
        }
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
