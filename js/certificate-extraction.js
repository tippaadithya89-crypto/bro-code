class CertificateExtraction {
    constructor() {
        this.baseURL = 'http://localhost:3000/api';
        this.checkAuthentication();
        this.setupEventListeners();
        this.loadTesseract();
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

    async loadTesseract() {
        // Load Tesseract.js script dynamically
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/tesseract.min.js';
        script.onload = () => {
            console.log('Tesseract.js loaded successfully');
        };
        document.body.appendChild(script);
    }

    setupEventListeners() {
        // Upload area setup
        const uploadArea = document.getElementById('certificateUploadArea');
        const certificateInput = document.getElementById('certificateInput');

        if (uploadArea && certificateInput) {
            // Click to upload
            uploadArea.addEventListener('click', () => {
                certificateInput.click();
            });

            // Drag and drop
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.stopPropagation();
                uploadArea.classList.add('dragover');
            });

            uploadArea.addEventListener('dragleave', (e) => {
                e.preventDefault();
                e.stopPropagation();
                uploadArea.classList.remove('dragover');
            });

            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();
                uploadArea.classList.remove('dragover');
                
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    this.handleFile(files[0]);
                }
            });

            // File input change
            certificateInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.handleFile(file);
                }
            });
        }

        // Copy results button
        const copyButton = document.getElementById('copyResults');
        if (copyButton) {
            copyButton.addEventListener('click', () => this.copyResults());
        }
    }

    async handleFile(file) {
        try {
            // Show loading state
            this.showLoading();

            // Display preview
            await this.displayPreview(file);

            // Extract text using OCR
            await this.extractText(file);

            // Show results section
            document.querySelector('.extraction-results').style.display = 'block';
        } catch (error) {
            this.showError('Error processing certificate: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    async displayPreview(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const preview = document.getElementById('certificatePreview');
                preview.src = e.target.result;
                preview.onload = () => resolve();
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }

    async extractText(file) {
        try {
            const worker = await Tesseract.createWorker('eng');
            
            // Read the image
            const result = await worker.recognize(file);
            const text = result.data.text;

            // Parse the extracted text
            this.parseExtractedText(text);

            await worker.terminate();
        } catch (error) {
            throw new Error('OCR processing failed: ' + error.message);
        }
    }

    parseExtractedText(text) {
        // Convert to lowercase for easier searching
        const lowerText = text.toLowerCase();
        
        // Extract name (looking for common patterns)
        const nameMatch = text.match(/(?:name[:\s]+)([A-Za-z\s]+)|(?:certify that[:\s]+)([A-Za-z\s]+)|(?:awarded to[:\s]+)([A-Za-z\s]+)/i);
        const extractedName = nameMatch ? (nameMatch[1] || nameMatch[2] || nameMatch[3]).trim() : '';

        // Extract date
        const dateMatch = text.match(/(?:\\d{1,2}[-/]\\d{1,2}[-/]\\d{2,4})|(?:January|February|March|April|May|June|July|August|September|October|November|December)\\s+\\d{1,2},?\\s+\\d{4}/i);
        const extractedDate = dateMatch ? dateMatch[0] : '';

        // Extract certificate number
        const certNumberMatch = text.match(/(?:certificate|cert|no)[.:#\\s-]+([A-Za-z0-9-]+)/i);
        const extractedNumber = certNumberMatch ? certNumberMatch[1] : '';

        // Extract course/program
        const courseMatch = text.match(/(?:course|program|certification in)[:\s]+([A-Za-z0-9\s]+)/i);
        const extractedCourse = courseMatch ? courseMatch[1].trim() : '';

        // Update the form fields
        document.getElementById('extractedName').value = extractedName;
        document.getElementById('extractedDate').value = extractedDate;
        document.getElementById('extractedNumber').value = extractedNumber;
        document.getElementById('extractedCourse').value = extractedCourse;
        document.getElementById('extractedText').value = text.trim();
    }

    copyResults() {
        const results = {
            name: document.getElementById('extractedName').value,
            date: document.getElementById('extractedDate').value,
            certificateNumber: document.getElementById('extractedNumber').value,
            course: document.getElementById('extractedCourse').value,
            fullText: document.getElementById('extractedText').value
        };

        const textToCopy = Object.entries(results)
            .map(([key, value]) => `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`)
            .join('\\n');

        navigator.clipboard.writeText(textToCopy)
            .then(() => this.showSuccess('Results copied to clipboard!'))
            .catch(err => this.showError('Failed to copy results'));
    }

    showLoading() {
        // Create loading overlay if it doesn't exist
        let loadingOverlay = document.querySelector('.loading-overlay');
        if (!loadingOverlay) {
            loadingOverlay = document.createElement('div');
            loadingOverlay.className = 'loading-overlay';
            loadingOverlay.innerHTML = `
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                    <span>Processing certificate...</span>
                </div>
            `;
            document.body.appendChild(loadingOverlay);
        }
        loadingOverlay.style.display = 'flex';
    }

    hideLoading() {
        const loadingOverlay = document.querySelector('.loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    }

    showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
        document.querySelector('.container').insertBefore(successDiv, document.querySelector('.extraction-container'));
        setTimeout(() => successDiv.remove(), 3000);
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        document.querySelector('.container').insertBefore(errorDiv, document.querySelector('.extraction-container'));
        setTimeout(() => errorDiv.remove(), 3000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CertificateExtraction();
});
