// Certificate Generator App
class CertificateGenerator {
    constructor() {
        this.participants = [];
        this.selectedTemplate = null;
        this.currentStep = 1;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupTemplates();
        this.updateProgressIndicator();
    }

    setupEventListeners() {
        // File upload
        const uploadArea = document.getElementById('uploadArea');
        const csvFile = document.getElementById('csvFile');

        uploadArea.addEventListener('click', () => csvFile.click());
        uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        uploadArea.addEventListener('drop', this.handleDrop.bind(this));
        csvFile.addEventListener('change', this.handleFileSelect.bind(this));

        // Navigation buttons
        document.getElementById('downloadTemplate').addEventListener('click', this.downloadTemplate.bind(this));
        document.getElementById('backToStep1').addEventListener('click', () => this.goToStep(1));
        document.getElementById('proceedToTemplates').addEventListener('click', () => this.goToStep(3));
        document.getElementById('backToStep2').addEventListener('click', () => this.goToStep(2));
        document.getElementById('generateCertificates').addEventListener('click', this.generateCertificates.bind(this));
        document.getElementById('downloadAll').addEventListener('click', this.downloadAllCertificates.bind(this));
        document.getElementById('startOver').addEventListener('click', this.startOver.bind(this));
    }

    setupTemplates() {
        const templates = [
            {
                id: 'modern',
                name: 'Modern Certificate',
                description: 'Clean and professional design with modern typography',
                icon: 'fas fa-medal'
            },
            {
                id: 'classic',
                name: 'Classic Certificate',
                description: 'Traditional formal certificate with elegant borders',
                icon: 'fas fa-trophy'
            },
            {
                id: 'colorful',
                name: 'Colorful Certificate',
                description: 'Vibrant and energetic design perfect for events',
                icon: 'fas fa-star'
            },
            {
                id: 'simple',
                name: 'Minimalist Certificate',
                description: 'Simple and clean design focusing on content',
                icon: 'fas fa-certificate'
            }
        ];

        const templateGrid = document.getElementById('templateGrid');
        templateGrid.innerHTML = templates.map(template => `
            <div class="template-card" data-template="${template.id}">
                <div class="template-preview">
                    <i class="${template.icon}"></i>
                </div>
                <h3>${template.name}</h3>
                <p>${template.description}</p>
            </div>
        `).join('');

        // Add click listeners to template cards
        document.querySelectorAll('.template-card').forEach(card => {
            card.addEventListener('click', () => this.selectTemplate(card.dataset.template));
        });
    }

    handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }

    processFile(file) {
        if (!file.name.toLowerCase().endsWith('.csv')) {
            alert('Please select a CSV file.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                this.parseCSV(e.target.result);
                this.goToStep(2);
            } catch (error) {
                alert('Error reading CSV file. Please check the format.');
                console.error('CSV parsing error:', error);
            }
        };
        reader.readAsText(file);
    }

    parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        if (lines.length < 2) {
            throw new Error('CSV file must have at least a header and one data row');
        }

        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        this.participants = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
            if (values.length >= headers.length) {
                const participant = {};
                headers.forEach((header, index) => {
                    participant[header.toLowerCase()] = values[index] || '';
                });
                
                // Ensure we have at least a name field
                if (participant.name || participant.participant || participant['participant name']) {
                    participant.displayName = participant.name || 
                                            participant.participant || 
                                            participant['participant name'] || 
                                            'Unknown Participant';
                    this.participants.push(participant);
                }
            }
        }

        if (this.participants.length === 0) {
            throw new Error('No valid participants found in CSV');
        }

        this.displayParticipants();
    }

    displayParticipants() {
        const participantList = document.getElementById('participantList');
        const participantCount = document.getElementById('participantCount');

        participantCount.textContent = `${this.participants.length} participants loaded`;

        participantList.innerHTML = this.participants.map((participant, index) => `
            <div class="participant-item">
                <div class="participant-info">
                    <h4>${participant.displayName}</h4>
                    <p>${Object.entries(participant).filter(([key]) => key !== 'displayName').map(([key, value]) => `${key}: ${value}`).join(' • ')}</p>
                </div>
                <div class="participant-number">#${index + 1}</div>
            </div>
        `).join('');
    }

    selectTemplate(templateId) {
        // Remove previous selection
        document.querySelectorAll('.template-card').forEach(card => {
            card.classList.remove('selected');
        });

        // Add selection to clicked template
        document.querySelector(`[data-template="${templateId}"]`).classList.add('selected');
        this.selectedTemplate = templateId;

        // Enable generate button
        document.getElementById('generateCertificates').disabled = false;
    }

    async generateCertificates() {
        if (!this.selectedTemplate || this.participants.length === 0) {
            alert('Please select a template and ensure participants are loaded.');
            return;
        }

        this.goToStep(4);
        
        // Simulate progress
        const progressFill = document.getElementById('progressFill');
        const statusText = document.getElementById('statusText');
        
        for (let i = 0; i <= 100; i += 10) {
            progressFill.style.width = i + '%';
            statusText.textContent = `Generating certificates... ${i}%`;
            await this.delay(200);
        }

        // Show download section
        document.getElementById('downloadSection').style.display = 'block';
        statusText.textContent = 'Certificates generated successfully!';
    }

    async downloadAllCertificates() {
        const zip = new JSZip();
        const { jsPDF } = window.jspdf;

        for (let i = 0; i < this.participants.length; i++) {
            const participant = this.participants[i];
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });

            this.generateCertificatePDF(pdf, participant);
            
            const pdfBlob = pdf.output('blob');
            const fileName = `${participant.displayName.replace(/[^a-zA-Z0-9]/g, '_')}_certificate.pdf`;
            zip.file(fileName, pdfBlob);
        }

        // Generate and download zip file
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(zipBlob);
        downloadLink.download = 'certificates.zip';
        downloadLink.click();
    }

    generateCertificatePDF(pdf, participant) {
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        // Template-specific styling
        const templates = {
            modern: {
                bgColor: [245, 248, 255],
                primaryColor: [102, 126, 234],
                secondaryColor: [118, 75, 162],
                accentColor: [40, 167, 69]
            },
            classic: {
                bgColor: [255, 248, 240],
                primaryColor: [139, 69, 19],
                secondaryColor: [160, 82, 45],
                accentColor: [218, 165, 32]
            },
            colorful: {
                bgColor: [255, 245, 238],
                primaryColor: [255, 99, 71],
                secondaryColor: [255, 140, 0],
                accentColor: [50, 205, 50]
            },
            simple: {
                bgColor: [250, 250, 250],
                primaryColor: [52, 58, 64],
                secondaryColor: [108, 117, 125],
                accentColor: [0, 123, 255]
            }
        };

        const template = templates[this.selectedTemplate] || templates.modern;

        // Background
        pdf.setFillColor(...template.bgColor);
        pdf.rect(0, 0, pageWidth, pageHeight, 'F');

        // Border
        pdf.setDrawColor(...template.primaryColor);
        pdf.setLineWidth(2);
        pdf.rect(10, 10, pageWidth - 20, pageHeight - 20);

        // Inner border
        pdf.setLineWidth(0.5);
        pdf.rect(15, 15, pageWidth - 30, pageHeight - 30);

        // Title
        pdf.setFontSize(36);
        pdf.setTextColor(...template.primaryColor);
        pdf.text('CERTIFICATE OF PARTICIPATION', pageWidth / 2, 40, { align: 'center' });

        // Subtitle
        pdf.setFontSize(16);
        pdf.setTextColor(...template.secondaryColor);
        pdf.text('This is to certify that', pageWidth / 2, 60, { align: 'center' });

        // Participant name
        pdf.setFontSize(32);
        pdf.setTextColor(...template.primaryColor);
        pdf.text(participant.displayName.toUpperCase(), pageWidth / 2, 85, { align: 'center' });

        // Participation text
        pdf.setFontSize(16);
        pdf.setTextColor(...template.secondaryColor);
        pdf.text('has successfully participated in the event', pageWidth / 2, 105, { align: 'center' });

        // Event details
        const eventName = participant.event || participant['event name'] || 'EVENT NAME';
        pdf.setFontSize(24);
        pdf.setTextColor(...template.accentColor);
        pdf.text(eventName, pageWidth / 2, 125, { align: 'center' });

        // Date
        const eventDate = participant.date || participant['event date'] || new Date().toLocaleDateString();
        pdf.setFontSize(14);
        pdf.setTextColor(...template.secondaryColor);
        pdf.text(`Date: ${eventDate}`, pageWidth / 2, 145, { align: 'center' });

        // Additional info
        const additionalInfo = [];
        Object.entries(participant).forEach(([key, value]) => {
            if (!['displayName', 'name', 'participant', 'participant name', 'event', 'event name', 'date', 'event date'].includes(key.toLowerCase()) && value) {
                additionalInfo.push(`${key}: ${value}`);
            }
        });

        if (additionalInfo.length > 0) {
            pdf.setFontSize(12);
            pdf.setTextColor(...template.secondaryColor);
            let yPos = 160;
            additionalInfo.slice(0, 3).forEach(info => {
                pdf.text(info, pageWidth / 2, yPos, { align: 'center' });
                yPos += 8;
            });
        }

        // Footer
        pdf.setFontSize(12);
        pdf.setTextColor(...template.secondaryColor);
        pdf.text('Generated by Certificate Generator', pageWidth / 2, pageHeight - 20, { align: 'center' });
    }

    downloadTemplate() {
        const csvContent = 'name,event,date,email,position\n' +
                          'John Doe,Annual Conference 2024,2024-08-14,john@email.com,Attendee\n' +
                          'Jane Smith,Annual Conference 2024,2024-08-14,jane@email.com,Speaker\n' +
                          'Mike Johnson,Annual Conference 2024,2024-08-14,mike@email.com,Volunteer';

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = 'participant_template.csv';
        downloadLink.click();
        URL.revokeObjectURL(url);
    }

    goToStep(stepNumber) {
        // Hide all steps
        document.querySelectorAll('.step').forEach(step => {
            step.classList.remove('active');
        });

        // Show target step
        document.getElementById(`step${stepNumber}`).classList.add('active');
        this.currentStep = stepNumber;
        this.updateProgressIndicator();
    }

    updateProgressIndicator() {
        document.querySelectorAll('.progress-step').forEach((step, index) => {
            const stepNumber = index + 1;
            step.classList.remove('active', 'completed');
            
            if (stepNumber < this.currentStep) {
                step.classList.add('completed');
            } else if (stepNumber === this.currentStep) {
                step.classList.add('active');
            }
        });
    }

    startOver() {
        this.participants = [];
        this.selectedTemplate = null;
        this.currentStep = 1;
        
        // Reset file input
        document.getElementById('csvFile').value = '';
        
        // Reset template selection
        document.querySelectorAll('.template-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        // Reset progress
        document.getElementById('progressFill').style.width = '0%';
        document.getElementById('downloadSection').style.display = 'none';
        
        // Go to first step
        this.goToStep(1);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CertificateGenerator();
});

// Additional utility functions
function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function sanitizeFileName(name) {
    return name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
}

// Handle window resize for responsive design
window.addEventListener('resize', () => {
    // Adjust progress indicator position on mobile
    const progressIndicator = document.querySelector('.progress-indicator');
    if (window.innerWidth <= 768) {
        progressIndicator.style.position = 'relative';
    } else {
        progressIndicator.style.position = 'fixed';
    }
});
