// Modern Template Designer Class - Canva-like Experience
class TemplateDesigner {
    constructor() {
        this.baseURL = window.location.protocol + '//' + window.location.host + '/api';
        this.canvas = document.getElementById('designCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.overlay = document.getElementById('canvasOverlay');
        
        // Modern template state
        this.currentTemplate = null;
        this.elements = [];
        this.selectedElement = null;
        this.draggedElement = null;
        this.isDragging = false;
        this.isResizing = false;
        this.dragOffset = { x: 0, y: 0 };
        this.resizeDirection = null;
        
        // Canvas state
        this.zoom = 1;
        this.canvasOffset = { x: 0, y: 0 };
        this.guidelines = [];
        this.currentFrame = null; // Current applied frame
        
        // History for undo/redo
        this.history = [];
        this.historyIndex = -1;
        this.maxHistory = 50;
        
        // Predefined frames
        this.frames = {
            classic: { 
                background: '#f8f9fa',
                border: { width: 20, color: '#2c3e50', style: 'double' },
                corners: 'rounded'
            },
            modern: { 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: { width: 0 },
                corners: 'sharp'
            },
            elegant: { 
                background: '#ffffff',
                border: { width: 15, color: '#d4af37', style: 'solid' },
                corners: 'rounded',
                ornament: 'floral'
            },
            minimal: { 
                background: '#ffffff',
                border: { width: 2, color: '#e2e8f0', style: 'solid' },
                corners: 'sharp'
            },
            ornate: { 
                background: '#fef7e7',
                border: { width: 25, color: '#8b5a3c', style: 'decorative' },
                corners: 'rounded'
            },
            corporate: { 
                background: '#f8fafc',
                border: { width: 10, color: '#3498db', style: 'solid' },
                corners: 'sharp'
            }
        };
        
        // Field types for certificate data
        this.fieldTypes = {
            name: 'John Doe',
            rollNumber: '2021001',
            course: 'Computer Science',
            year: '3rd Year',
            section: 'A',
            email: 'john@student.edu',
            phone: '+1234567890',
            date: new Date().toLocaleDateString()
        };
        
        this.checkAuthentication();
        this.loadUserInfo();
        this.setupEventListeners();
        this.loadTemplatesLocal(); // Use local template loading
        this.updateCanvas();
        this.setupModernInteractions();
        this.updatePropertiesPanel(); // Initialize properties panel
        
        // Handle window resize for toolbar repositioning (debounced)
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                if (this.selectedElement && !this.isDragging && !this.isResizing) {
                    const element = this.selectedElement;
                    const x = element.x * this.zoom;
                    const y = element.y * this.zoom;
                    const width = element.width * this.zoom;
                    const height = element.height * this.zoom;
                    this.positionFloatingToolbar(x, y, width, height);
                }
            }, 100);
        });
        
        // Handle scroll for toolbar repositioning (debounced)
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                if (this.selectedElement && !this.isDragging && !this.isResizing) {
                    const element = this.selectedElement;
                    const x = element.x * this.zoom;
                    const y = element.y * this.zoom;
                    const width = element.width * this.zoom;
                    const height = element.height * this.zoom;
                    this.positionFloatingToolbar(x, y, width, height);
                }
            }, 50);
        });
        
        // Auto-save every 30 seconds
        setInterval(() => {
            this.autoSave();
        }, 30000);
        
        // Load any existing auto-saved data
        this.loadAutoSave();
    }

    checkAuthentication() {
        const token = localStorage.getItem('authToken');
        if (!token) {
            console.log('No auth token found, using demo mode');
            // Don't redirect, just log - allow demo mode
        }
    }

    getAuthHeaders() {
        return {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
        };
    }

    loadUserInfo() {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const collegeNameElement = document.getElementById('collegeName');
        if (collegeNameElement) {
            collegeNameElement.textContent = userData.college?.name || 'Demo Mode';
        }
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.currentTarget.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // Modern frame selection
        document.querySelectorAll('.frame-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const frameType = e.currentTarget.dataset.frame;
                this.applyFrame(frameType);
                
                // Update active state
                document.querySelectorAll('.frame-item').forEach(f => f.classList.remove('active'));
                e.currentTarget.classList.add('active');
            });
        });

        // Element creation
        document.querySelectorAll('.element-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const type = e.currentTarget.dataset.type;
                const subtype = e.currentTarget.dataset.subtype;
                this.addElement(type, subtype);
            });
        });

        // Modern toolbar actions
        document.getElementById('newTemplateBtn')?.addEventListener('click', () => this.createNewTemplate());
        
        // Save dropdown functionality
        const saveDropdown = document.getElementById('saveDropdown');
        const saveDropdownMenu = document.getElementById('saveDropdownMenu');
        
        saveDropdown?.addEventListener('click', (e) => {
            e.stopPropagation();
            const dropdown = document.querySelector('.save-dropdown');
            const isActive = dropdown.classList.contains('active');
            
            // Close all dropdowns first
            document.querySelector('.save-dropdown')?.classList.remove('active');
            
            if (!isActive) {
                // Position dropdown intelligently
                this.positionDropdown(dropdown);
                dropdown.classList.add('active');
            }
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            const dropdown = document.querySelector('.save-dropdown');
            const menu = dropdown?.querySelector('.dropdown-menu');
            
            dropdown?.classList.remove('active');
            dropdown?.classList.remove('dropup');
            
            // Reset positioning
            if (menu) {
                menu.style.position = '';
                menu.style.left = '';
                menu.style.top = '';
            }
        });
        
        // Save dropdown options
        document.getElementById('saveToDraftsBtn')?.addEventListener('click', () => {
            this.saveToDrafts();
            this.closeDropdown();
        });
        
        document.getElementById('saveAsTemplateBtn')?.addEventListener('click', () => {
            this.saveAsTemplate();
            this.closeDropdown();
        });
        
        document.getElementById('undoBtn')?.addEventListener('click', () => this.undo());
        document.getElementById('redoBtn')?.addEventListener('click', () => this.redo());
        document.getElementById('zoomIn')?.addEventListener('click', () => this.zoomIn());
        document.getElementById('zoomOut')?.addEventListener('click', () => this.zoomOut());
        document.getElementById('fitToScreen')?.addEventListener('click', () => this.fitToScreen());
        document.getElementById('previewBtn')?.addEventListener('click', () => this.previewTemplate());
        document.getElementById('publishBtn')?.addEventListener('click', () => this.publishTemplate());

        // Property controls
        this.setupPropertyControls();
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        // Canvas interactions will be set up in setupModernInteractions
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');
    }

    setupPropertyControls() {
        // Font family control
        const fontFamily = document.getElementById('fontFamily');
        if (fontFamily) {
            fontFamily.addEventListener('change', () => this.updateSelectedElementProperty('fontFamily', fontFamily.value));
        }

        // Font size control
        const fontSize = document.getElementById('fontSize');
        if (fontSize) {
            fontSize.addEventListener('input', () => this.updateSelectedElementProperty('fontSize', fontSize.value));
        }

        // Font weight control
        const fontWeight = document.getElementById('fontWeight');
        if (fontWeight) {
            fontWeight.addEventListener('change', () => this.updateSelectedElementProperty('fontWeight', fontWeight.value));
        }

        // Text color control
        const textColor = document.getElementById('textColor');
        if (textColor) {
            textColor.addEventListener('change', () => this.updateSelectedElementProperty('color', textColor.value));
        }

        // Text alignment controls
        document.querySelectorAll('[data-align]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('[data-align]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.updateSelectedElementProperty('textAlign', btn.dataset.align);
            });
        });

        // Shape properties
        const fillColor = document.getElementById('fillColor');
        if (fillColor) {
            fillColor.addEventListener('change', () => this.updateSelectedElementProperty('fillColor', fillColor.value));
        }

        const borderColor = document.getElementById('borderColor');
        if (borderColor) {
            borderColor.addEventListener('change', () => this.updateSelectedElementProperty('borderColor', borderColor.value));
        }

        const borderWidth = document.getElementById('borderWidth');
        if (borderWidth) {
            borderWidth.addEventListener('input', () => this.updateSelectedElementProperty('borderWidth', borderWidth.value));
        }
    }

    // Modern frame application
    applyFrame(frameType) {
        const frameConfig = this.frames[frameType];
        if (!frameConfig) return;

        // Store current frame info
        this.currentFrame = {
            type: frameType,
            config: frameConfig
        };

        // Redraw canvas with frame
        this.updateCanvas();
        this.saveToHistory();
    }

    // Modern interactions setup
    setupModernInteractions() {
        this.canvas.addEventListener('mousedown', (e) => this.onCanvasMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onCanvasMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onCanvasMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this.onCanvasWheel(e));
        
        // Resize handles
        this.setupResizeHandles();
    }

    setupResizeHandles() {
        document.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('resize-handle')) {
                e.stopPropagation();
                this.isResizing = true;
                this.resizeDirection = e.target.dataset.direction;
                this.dragOffset = {
                    x: e.clientX,
                    y: e.clientY,
                    startX: this.selectedElement.x,
                    startY: this.selectedElement.y,
                    startWidth: this.selectedElement.width,
                    startHeight: this.selectedElement.height
                };
                
                document.addEventListener('mousemove', this.handleResize.bind(this));
                document.addEventListener('mouseup', this.handleResizeEnd.bind(this));
            }
        });
    }

    handleResize(e) {
        if (!this.isResizing || !this.selectedElement) return;
        
        const deltaX = (e.clientX - this.dragOffset.x) / this.zoom;
        const deltaY = (e.clientY - this.dragOffset.y) / this.zoom;
        
        const element = this.selectedElement;
        const direction = this.resizeDirection;
        
        // Apply resize based on direction
        switch (direction) {
            case 'se': // Southeast
                element.width = Math.max(20, this.dragOffset.startWidth + deltaX);
                element.height = Math.max(20, this.dragOffset.startHeight + deltaY);
                break;
            case 'sw': // Southwest
                element.width = Math.max(20, this.dragOffset.startWidth - deltaX);
                element.height = Math.max(20, this.dragOffset.startHeight + deltaY);
                element.x = this.dragOffset.startX + deltaX;
                break;
            case 'ne': // Northeast
                element.width = Math.max(20, this.dragOffset.startWidth + deltaX);
                element.height = Math.max(20, this.dragOffset.startHeight - deltaY);
                element.y = this.dragOffset.startY + deltaY;
                break;
            case 'nw': // Northwest
                element.width = Math.max(20, this.dragOffset.startWidth - deltaX);
                element.height = Math.max(20, this.dragOffset.startHeight - deltaY);
                element.x = this.dragOffset.startX + deltaX;
                element.y = this.dragOffset.startY + deltaY;
                break;
            case 'n': // North
                element.height = Math.max(20, this.dragOffset.startHeight - deltaY);
                element.y = this.dragOffset.startY + deltaY;
                break;
            case 's': // South
                element.height = Math.max(20, this.dragOffset.startHeight + deltaY);
                break;
            case 'e': // East
                element.width = Math.max(20, this.dragOffset.startWidth + deltaX);
                break;
            case 'w': // West
                element.width = Math.max(20, this.dragOffset.startWidth - deltaX);
                element.x = this.dragOffset.startX + deltaX;
                break;
        }
        
        this.updateCanvas();
        // Don't update toolbar position while resizing - it causes jumping
        if (this.selectedElement && this.selectedElement.id === element.id) {
            this.updateSelectionBounds(element);
        }
    }

    handleResizeEnd(e) {
        if (this.isResizing) {
            this.isResizing = false;
            this.resizeDirection = null;
            this.saveToHistory();
            this.autoSave();
            
            // Now update toolbar position after resize is complete
            if (this.selectedElement) {
                const element = this.selectedElement;
                const x = element.x * this.zoom;
                const y = element.y * this.zoom;
                const width = element.width * this.zoom;
                const height = element.height * this.zoom;
                this.positionFloatingToolbar(x, y, width, height);
            }
            
            document.removeEventListener('mousemove', this.handleResize.bind(this));
            document.removeEventListener('mouseup', this.handleResizeEnd.bind(this));
        }
    }

    // Modern zoom controls
    zoomIn() {
        this.zoom = Math.min(this.zoom * 1.2, 5);
        this.updateZoomDisplay();
        this.updateCanvas();
    }

    zoomOut() {
        this.zoom = Math.max(this.zoom / 1.2, 0.1);
        this.updateZoomDisplay();
        this.updateCanvas();
    }

    fitToScreen() {
        const containerRect = this.canvas.parentElement.getBoundingClientRect();
        const canvasAspect = this.canvas.width / this.canvas.height;
        const containerAspect = containerRect.width / containerRect.height;
        
        if (canvasAspect > containerAspect) {
            this.zoom = (containerRect.width * 0.9) / this.canvas.width;
        } else {
            this.zoom = (containerRect.height * 0.9) / this.canvas.height;
        }
        
        this.updateZoomDisplay();
        this.updateCanvas();
    }

    updateZoomDisplay() {
        const indicator = document.getElementById('zoomIndicator');
        if (indicator) {
            indicator.textContent = Math.round(this.zoom * 100) + '%';
        }
    }

    // Handle keyboard shortcuts
    handleKeyboard(e) {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'z':
                    e.preventDefault();
                    if (e.shiftKey) {
                        this.redo();
                    } else {
                        this.undo();
                    }
                    break;
                case 's':
                    e.preventDefault();
                    this.saveTemplate();
                    break;
            }
        } else if (e.key === 'Delete' && this.selectedElement) {
            this.deleteElement(this.selectedElement.id);
        }
    }

    // Add element to canvas
    addElement(type, subtype) {
        const element = this.createElement(type, subtype);
        this.elements.push(element);
        this.selectElement(element);
        this.updateCanvas();
        this.saveToHistory();
        this.autoSave();
    }

    createElement(type, subtype) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        const baseElement = {
            id: 'element_' + Date.now(),
            type: type,
            subtype: subtype,
            x: centerX - 100,
            y: centerY - 25,
            width: 200,
            height: 50,
            rotation: 0,
            zIndex: this.elements.length
        };

        switch (type) {
            case 'text':
                return {
                    ...baseElement,
                    text: this.getDefaultText(subtype),
                    fontFamily: 'Arial',
                    fontSize: subtype === 'heading' ? 24 : subtype === 'subheading' ? 18 : 14,
                    fontWeight: subtype === 'heading' ? 'bold' : 'normal',
                    color: '#000000',
                    textAlign: 'center'
                };
            
            case 'shape':
                return {
                    ...baseElement,
                    fillColor: '#3498db',
                    borderColor: '#2c3e50',
                    borderWidth: 1,
                    shape: subtype
                };
            
            case 'image':
                return {
                    ...baseElement,
                    src: null,
                    preserveAspectRatio: true
                };
            
            default:
                return baseElement;
        }
    }

    getDefaultText(subtype) {
        switch (subtype) {
            case 'heading': return 'Certificate Title';
            case 'subheading': return 'Subtitle';
            case 'body': return 'Body Text';
            default: return 'Text';
        }
    }

    // Property updates
    updateSelectedElementProperty(property, value) {
        if (!this.selectedElement) return;
        
        this.selectedElement[property] = value;
        this.updateCanvas();
        this.saveToHistory();
        this.updateSaveStatus(false);
    }

    updateSaveStatus(saved = true) {
        const status = document.getElementById('saveStatus');
        if (status) {
            if (saved) {
                status.innerHTML = '<i class="fas fa-circle" style="color: #10b981;"></i> Saved';
            } else {
                status.innerHTML = '<i class="fas fa-circle" style="color: #e74c3c;"></i> Unsaved';
            }
        }
    }

    // Modern template creation
    createNewTemplate() {
        this.currentTemplate = null;
        this.elements = [];
        this.selectedElement = null;
        this.history = [];
        this.historyIndex = -1;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.updateCanvas();
        this.updateSaveStatus(false);
        
        // Update template name
        const nameEl = document.getElementById('templateName');
        if (nameEl) {
            nameEl.textContent = 'Untitled Design';
        }
    }

    // Template preview
    previewTemplate() {
        // Create a temporary canvas for preview
        const previewCanvas = document.createElement('canvas');
        previewCanvas.width = this.canvas.width;
        previewCanvas.height = this.canvas.height;
        const previewCtx = previewCanvas.getContext('2d');
        
        // Draw current canvas content
        previewCtx.drawImage(this.canvas, 0, 0);
        
        // Open preview in new window
        const previewWindow = window.open('', '_blank');
        previewWindow.document.write(`
            <html>
                <head><title>Template Preview</title></head>
                <body style="margin: 0; padding: 20px; background: #f0f0f0; display: flex; justify-content: center; align-items: center; min-height: 100vh;">
                    <img src="${previewCanvas.toDataURL()}" style="max-width: 100%; max-height: 100%; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
                </body>
            </html>
        `);
    }

    // Publish template
    publishTemplate() {
        if (!this.currentTemplate) {
            this.saveTemplate().then(() => {
                this.showSuccess('Template published successfully!');
            });
        } else {
            this.showSuccess('Template is ready to use!');
        }
    }

    async loadTemplates() {
        try {
            const response = await fetch(`${this.baseURL}/templates`, {
                headers: this.getAuthHeaders()
            });
            
            if (response.ok) {
                const templates = await response.json();
                this.displayTemplates(templates);
            } else {
                console.error('Failed to load templates');
                this.loadTemplatesLocal(); // Fallback to local
            }
        } catch (error) {
            console.error('Error loading templates:', error);
            this.loadTemplatesLocal(); // Fallback to local
        }
    }

    loadTemplatesLocal() {
        // Load templates from localStorage or use empty array
        const savedTemplates = JSON.parse(localStorage.getItem('designerTemplates') || '[]');
        this.displayTemplates(savedTemplates);
    }

    displayTemplates(templates) {
        // Since we're using a canvas-based designer, we don't need a template list
        // Templates are handled through the save/load system
        console.log(`Loaded ${templates.length} templates from storage`);
        
        // Update UI to show template count if needed
        const templateInfo = document.querySelector('.template-info');
        if (templateInfo && templates.length > 0) {
            const savedCount = templates.length;
            console.log(`Found ${savedCount} saved templates`);
        }
    }

    async loadTemplate(templateId) {
        try {
            const response = await fetch(`${this.baseURL}/templates/${templateId}`, {
                headers: this.getAuthHeaders()
            });
            
            if (response.ok) {
                const template = await response.json();
                this.currentTemplate = template;
                this.elements = template.elements || [];
                
                // Update canvas settings
                this.canvas.width = template.canvas.width;
                this.canvas.height = template.canvas.height;
                
                // Update UI
                document.getElementById('templateName').textContent = template.name;
                document.getElementById('canvasSize').textContent = `${template.canvas.width} × ${template.canvas.height}`;
                
                // Enable save dropdown
                const saveDropdown = document.getElementById('saveDropdown');
                if (saveDropdown) {
                    saveDropdown.disabled = false;
                }
                
                // Update active template in list
                document.querySelectorAll('.template-item').forEach(item => {
                    item.classList.remove('active');
                });
                document.querySelector(`[data-template-id="${templateId}"]`)?.classList.add('active');
                
                this.clearSelection();
                this.updateCanvas();
                this.saveToHistory();
            }
        } catch (error) {
            console.error('Error loading template:', error);
        }
    }

    showNewTemplateModal() {
        document.getElementById('newTemplateModal').style.display = 'flex';
        document.getElementById('templateNameInput').focus();
    }

    hideNewTemplateModal() {
        document.getElementById('newTemplateModal').style.display = 'none';
        document.getElementById('newTemplateForm').reset();
    }

    async createTemplateFromForm(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const templateData = {
            name: document.getElementById('templateNameInput').value,
            description: document.getElementById('templateDescription').value,
            canvas: {
                width: parseInt(document.getElementById('canvasWidth').value),
                height: parseInt(document.getElementById('canvasHeight').value),
                backgroundColor: document.getElementById('canvasBackground').value
            },
            elements: []
        };
        
        try {
            const response = await fetch(`${this.baseURL}/templates`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(templateData)
            });
            
            if (response.ok) {
                const newTemplate = await response.json();
                this.hideNewTemplateModal();
                this.loadTemplates();
                this.loadTemplate(newTemplate._id);
            } else {
                const error = await response.json();
                alert(error.error || 'Failed to create template');
            }
        } catch (error) {
            console.error('Error creating template:', error);
            alert('Failed to create template');
        }
    }

    async saveTemplate() {
        if (!this.currentTemplate) {
            // Create a new template
            this.currentTemplate = {
                _id: 'template_' + Date.now(),
                name: document.getElementById('templateName')?.textContent || 'Untitled Design',
                canvas: {
                    width: this.canvas.width,
                    height: this.canvas.height,
                    backgroundColor: '#ffffff'
                },
                elements: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
        }
        
        try {
            // Update current template
            this.currentTemplate.elements = this.elements;
            this.currentTemplate.updatedAt = new Date().toISOString();
            
            // Save to localStorage
            const savedTemplates = JSON.parse(localStorage.getItem('designerTemplates') || '[]');
            const existingIndex = savedTemplates.findIndex(t => t._id === this.currentTemplate._id);
            
            if (existingIndex >= 0) {
                savedTemplates[existingIndex] = this.currentTemplate;
            } else {
                savedTemplates.push(this.currentTemplate);
            }
            
            localStorage.setItem('designerTemplates', JSON.stringify(savedTemplates));
            this.showSuccess('Template saved successfully');
            this.updateSaveStatus(true);
            
            // Try server save as well (optional)
            try {
                const response = await fetch(`${this.baseURL}/templates/${this.currentTemplate._id}`, {
                    method: 'PUT',
                    headers: this.getAuthHeaders(),
                    body: JSON.stringify({
                        elements: this.elements,
                        canvas: this.currentTemplate.canvas
                    })
                });
                // Server save is optional, don't fail if it doesn't work
            } catch (serverError) {
                console.log('Server save failed, but local save succeeded');
            }
            
        } catch (error) {
            console.error('Error saving template:', error);
            alert('Failed to save template');
        }
    }

    async duplicateTemplate(templateId) {
        try {
            const response = await fetch(`${this.baseURL}/templates/${templateId}/duplicate`, {
                method: 'POST',
                headers: this.getAuthHeaders()
            });
            
            if (response.ok) {
                this.loadTemplates();
                this.showSuccess('Template duplicated successfully');
            } else {
                throw new Error('Failed to duplicate template');
            }
        } catch (error) {
            console.error('Error duplicating template:', error);
            alert('Failed to duplicate template');
        }
    }

    async deleteTemplate(templateId) {
        if (!confirm('Are you sure you want to delete this template?')) return;
        
        try {
            const response = await fetch(`${this.baseURL}/templates/${templateId}`, {
                method: 'DELETE',
                headers: this.getAuthHeaders()
            });
            
            if (response.ok) {
                this.loadTemplates();
                if (this.currentTemplate && this.currentTemplate._id === templateId) {
                    this.currentTemplate = null;
                    this.elements = [];
                    this.clearSelection();
                    this.updateCanvas();
                    document.getElementById('templateName').textContent = 'Untitled Template';
                    
                    // Disable save dropdown
                    const saveDropdown = document.getElementById('saveDropdown');
                    if (saveDropdown) {
                        saveDropdown.disabled = true;
                    }
                }
                this.showSuccess('Template deleted successfully');
            } else {
                throw new Error('Failed to delete template');
            }
        } catch (error) {
            console.error('Error deleting template:', error);
            alert('Failed to delete template');
        }
    }

    selectTool(tool) {
        // Clear active tool
        document.querySelectorAll('.tool-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Set active tool
        document.querySelector(`[data-tool="${tool}"]`).classList.add('active');
        this.currentTool = tool;
        
        // Change cursor
        this.canvas.style.cursor = tool === 'text' || tool === 'field' ? 'crosshair' : 'default';
    }

    onCanvasClick(e) {
        if (!this.currentTool || this.isDragging) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / this.zoom;
        const y = (e.clientY - rect.top) / this.zoom;
        
        if (this.currentTool === 'text') {
            this.addTextElement(x, y);
        } else if (this.currentTool === 'field') {
            this.showFieldSelectionModal(x, y);
        } else if (this.currentTool === 'image') {
            this.addImageElement(x, y);
        } else if (this.currentTool === 'shape') {
            this.addShapeElement(x, y);
        }
    }

    addTextElement(x, y) {
        const element = {
            id: `text_${Date.now()}`,
            type: 'text',
            x: x,
            y: y,
            width: 200,
            height: 30,
            properties: {
                text: 'Sample Text',
                fontSize: 16,
                fontFamily: 'Arial',
                fontWeight: 'normal',
                color: '#000000',
                alignment: 'left'
            }
        };
        
        this.elements.push(element);
        this.selectElement(element);
        this.updateCanvas();
        this.saveToHistory();
    }

    showFieldSelectionModal(x, y) {
        this.pendingFieldPosition = { x, y };
        document.getElementById('fieldSelectionModal').style.display = 'flex';
    }

    hideFieldSelectionModal() {
        document.getElementById('fieldSelectionModal').style.display = 'none';
        this.pendingFieldPosition = null;
    }

    selectFieldType(fieldType) {
        if (!this.pendingFieldPosition) return;
        
        const element = {
            id: `field_${Date.now()}`,
            type: 'field',
            x: this.pendingFieldPosition.x,
            y: this.pendingFieldPosition.y,
            width: 200,
            height: 30,
            properties: {
                fieldType: fieldType,
                text: `{${fieldType}}`,
                fontSize: 16,
                fontFamily: 'Arial',
                fontWeight: 'normal',
                color: '#000000',
                alignment: 'left'
            }
        };
        
        this.elements.push(element);
        this.selectElement(element);
        this.updateCanvas();
        this.saveToHistory();
        this.hideFieldSelectionModal();
    }

    addImageElement(x, y) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const element = {
                        id: `image_${Date.now()}`,
                        type: 'image',
                        x: x,
                        y: y,
                        width: 150,
                        height: 100,
                        properties: {
                            imageUrl: event.target.result
                        }
                    };
                    
                    this.elements.push(element);
                    this.selectElement(element);
                    this.updateCanvas();
                    this.saveToHistory();
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    }

    addShapeElement(x, y) {
        const element = {
            id: `shape_${Date.now()}`,
            type: 'shape',
            x: x,
            y: y,
            width: 100,
            height: 100,
            properties: {
                backgroundColor: '#3498db',
                borderColor: '#2980b9',
                borderWidth: 2,
                borderRadius: 0
            }
        };
        
        this.elements.push(element);
        this.selectElement(element);
        this.updateCanvas();
        this.saveToHistory();
    }

    onCanvasMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / this.zoom;
        const y = (e.clientY - rect.top) / this.zoom;
        
        // Check if clicking on an element
        const clickedElement = this.getElementAt(x, y);
        
        if (clickedElement) {
            this.selectElement(clickedElement);
            this.isDragging = true;
            this.draggedElement = clickedElement;
            this.dragOffset = {
                x: x - clickedElement.x,
                y: y - clickedElement.y
            };
        } else {
            this.clearSelection();
        }
    }

    onCanvasMouseMove(e) {
        if (this.isResizing) return; // Resize is handled separately
        
        if (!this.isDragging || !this.draggedElement) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / this.zoom;
        const y = (e.clientY - rect.top) / this.zoom;
        
        this.draggedElement.x = x - this.dragOffset.x;
        this.draggedElement.y = y - this.dragOffset.y;
        
        this.updateCanvas();
        // Don't update toolbar position while dragging - it causes jumping
        if (this.selectedElement && this.selectedElement.id === this.draggedElement.id) {
            this.updateSelectionBounds(this.draggedElement);
        }
    }

    onCanvasMouseUp(e) {
        if (this.isDragging) {
            this.isDragging = false;
            this.draggedElement = null;
            this.saveToHistory();
            this.autoSave();
            
            // Now update toolbar position after drag is complete
            if (this.selectedElement) {
                const element = this.selectedElement;
                const x = element.x * this.zoom;
                const y = element.y * this.zoom;
                const width = element.width * this.zoom;
                const height = element.height * this.zoom;
                this.positionFloatingToolbar(x, y, width, height);
            }
        }
    }

    onCanvasWheel(e) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        this.zoom = Math.max(0.1, Math.min(5, this.zoom + delta));
        this.updateZoomDisplay();
        this.updateCanvas();
    }

    getElementAt(x, y) {
        // Check elements in reverse order (topmost first)
        for (let i = this.elements.length - 1; i >= 0; i--) {
            const element = this.elements[i];
            if (x >= element.x && x <= element.x + element.width &&
                y >= element.y && y <= element.y + element.height) {
                return element;
            }
        }
        return null;
    }

    selectElement(element) {
        this.selectedElement = element;
        this.showElementSelection(element);
        this.updatePropertiesPanel();
        this.updateCanvas();
    }

    clearSelection() {
        this.selectedElement = null;
        this.hideElementSelection();
        this.updatePropertiesPanel();
        this.updateCanvas();
    }

    showElementSelection(element) {
        const selection = document.getElementById('elementSelection');
        const canvasWrapper = document.getElementById('canvasWrapper');
        const canvasRect = this.canvas.getBoundingClientRect();
        const wrapperRect = canvasWrapper.getBoundingClientRect();
        
        // Calculate element position relative to canvas wrapper
        const x = element.x * this.zoom;
        const y = element.y * this.zoom;
        const width = element.width * this.zoom;
        const height = element.height * this.zoom;
        
        // Position the selection container
        selection.style.left = x + 'px';
        selection.style.top = y + 'px';
        selection.style.width = width + 'px';
        selection.style.height = height + 'px';
        selection.style.display = 'block';
        
        // Position selection border
        const border = selection.querySelector('.selection-border');
        border.style.left = '-2px';
        border.style.top = '-2px';
        border.style.width = (width + 4) + 'px';
        border.style.height = (height + 4) + 'px';
        
        // Position resize handles
        this.positionResizeHandles(selection, width, height);
        
        // Setup and position floating toolbar
        this.setupFloatingToolbar(element);
        this.positionFloatingToolbar(x, y, width, height);
    }

    updateSelectionBounds(element) {
        const selection = document.getElementById('elementSelection');
        
        if (selection.style.display === 'none') return;
        
        // Calculate element position relative to canvas wrapper
        const x = element.x * this.zoom;
        const y = element.y * this.zoom;
        const width = element.width * this.zoom;
        const height = element.height * this.zoom;
        
        // Update only the selection bounds, not the toolbar
        selection.style.left = x + 'px';
        selection.style.top = y + 'px';
        selection.style.width = width + 'px';
        selection.style.height = height + 'px';
        
        // Update selection border
        const border = selection.querySelector('.selection-border');
        border.style.left = '-2px';
        border.style.top = '-2px';
        border.style.width = (width + 4) + 'px';
        border.style.height = (height + 4) + 'px';
        
        // Update resize handles
        this.positionResizeHandles(selection, width, height);
        
        // Don't update toolbar position during drag/resize operations
    }

    hideElementSelection() {
        const selection = document.getElementById('elementSelection');
        const toolbar = document.getElementById('floatingToolbar');
        selection.style.display = 'none';
        toolbar.style.display = 'none';
    }

    positionResizeHandles(selection, width, height) {
        const handles = selection.querySelectorAll('.resize-handle');
        
        handles.forEach(handle => {
            const direction = handle.dataset.direction;
            
            switch (direction) {
                case 'nw':
                    handle.style.left = '0px';
                    handle.style.top = '0px';
                    break;
                case 'n':
                    handle.style.left = width / 2 + 'px';
                    handle.style.top = '0px';
                    break;
                case 'ne':
                    handle.style.left = width + 'px';
                    handle.style.top = '0px';
                    break;
                case 'e':
                    handle.style.left = width + 'px';
                    handle.style.top = height / 2 + 'px';
                    break;
                case 'se':
                    handle.style.left = width + 'px';
                    handle.style.top = height + 'px';
                    break;
                case 's':
                    handle.style.left = width / 2 + 'px';
                    handle.style.top = height + 'px';
                    break;
                case 'sw':
                    handle.style.left = '0px';
                    handle.style.top = height + 'px';
                    break;
                case 'w':
                    handle.style.left = '0px';
                    handle.style.top = height / 2 + 'px';
                    break;
            }
        });
    }

    setupFloatingToolbar(element) {
        const toolbar = document.getElementById('floatingToolbar');
        const textTools = document.getElementById('textTools');
        const shapeTools = document.getElementById('shapeTools');
        
        // Hide all tool groups first
        textTools.style.display = 'none';
        shapeTools.style.display = 'none';
        
        // Show relevant tools based on element type
        if (element.type === 'text') {
            textTools.style.display = 'flex';
            this.populateTextTools(element);
        } else if (element.type === 'shape') {
            shapeTools.style.display = 'flex';
            this.populateShapeTools(element);
        }
        
        // Setup common tool events
        this.setupToolbarEvents();
        
        // Show toolbar
        toolbar.style.display = 'flex';
    }

    positionFloatingToolbar(elementX, elementY, elementWidth, elementHeight) {
        const toolbar = document.getElementById('floatingToolbar');
        const canvasContainer = document.querySelector('.canvas-container');
        
        if (!toolbar || toolbar.style.display === 'none') return;
        
        // Get canvas container bounds
        const containerRect = canvasContainer.getBoundingClientRect();
        
        // Calculate element position relative to viewport
        const elementViewportX = containerRect.left + elementX;
        const elementViewportY = containerRect.top + elementY;
        
        // Get toolbar dimensions (force layout first)
        toolbar.style.visibility = 'hidden';
        toolbar.style.display = 'flex';
        const toolbarRect = toolbar.getBoundingClientRect();
        const toolbarWidth = toolbarRect.width;
        const toolbarHeight = toolbarRect.height;
        toolbar.style.visibility = 'visible';
        
        // Calculate preferred position (above element, centered)
        let toolbarX = elementViewportX + (elementWidth / 2) - (toolbarWidth / 2);
        let toolbarY = elementViewportY - toolbarHeight - 15; // Increased gap
        
        // Screen boundary checks
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const padding = 10;
        
        // Horizontal boundary check
        if (toolbarX < padding) {
            toolbarX = padding;
        } else if (toolbarX + toolbarWidth > screenWidth - padding) {
            toolbarX = screenWidth - toolbarWidth - padding;
        }
        
        // Vertical boundary check
        if (toolbarY < padding) {
            // If toolbar goes above screen, position it below the element
            toolbarY = elementViewportY + elementHeight + 15; // Increased gap
            
            // If still doesn't fit below, position at top with padding
            if (toolbarY + toolbarHeight > screenHeight - padding) {
                toolbarY = padding;
            }
        }
        
        // Check if position actually changed to avoid unnecessary updates
        const currentX = parseInt(toolbar.style.left) || 0;
        const currentY = parseInt(toolbar.style.top) || 0;
        
        if (Math.abs(currentX - toolbarX) > 5 || Math.abs(currentY - toolbarY) > 5) {
            // Apply position with smooth transition
            toolbar.style.left = toolbarX + 'px';
            toolbar.style.top = toolbarY + 'px';
        }
    }

    populateTextTools(element) {
        // Font family
        const fontFamilyTool = document.getElementById('fontFamilyTool');
        fontFamilyTool.value = element.fontFamily || 'Arial';
        
        // Font size
        const fontSizeTool = document.getElementById('fontSizeTool');
        fontSizeTool.value = element.fontSize || 16;
        
        // Text color
        const textColorTool = document.getElementById('textColorTool');
        textColorTool.value = element.color || '#000000';
        
        // Update button states
        this.updateToolbarButtonStates(element);
    }

    populateShapeTools(element) {
        // Fill color
        const fillColorTool = document.getElementById('fillColorTool');
        fillColorTool.value = element.fillColor || '#3498db';
        
        // Border color
        const borderColorTool = document.getElementById('borderColorTool');
        borderColorTool.value = element.borderColor || '#2c3e50';
        
        // Border width
        const borderWidthTool = document.getElementById('borderWidthTool');
        borderWidthTool.value = element.borderWidth || 1;
    }

    updateToolbarButtonStates(element) {
        // Bold button
        const boldBtn = document.getElementById('boldBtn');
        boldBtn.classList.toggle('active', element.fontWeight === 'bold');
        
        // Alignment buttons
        document.querySelectorAll('[id$="AlignBtn"]').forEach(btn => {
            btn.classList.remove('active');
        });
        
        if (element.textAlign === 'left') {
            document.getElementById('alignLeftBtn').classList.add('active');
        } else if (element.textAlign === 'center') {
            document.getElementById('alignCenterBtn').classList.add('active');
        } else if (element.textAlign === 'right') {
            document.getElementById('alignRightBtn').classList.add('active');
        }
    }

    setupToolbarEvents() {
        // Font family change
        document.getElementById('fontFamilyTool').onchange = (e) => {
            this.updateElementProperty('fontFamily', e.target.value);
        };
        
        // Font size change
        document.getElementById('fontSizeTool').onchange = (e) => {
            this.updateElementProperty('fontSize', parseInt(e.target.value));
        };
        
        // Text color change
        document.getElementById('textColorTool').onchange = (e) => {
            this.updateElementProperty('color', e.target.value);
        };
        
        // Fill color change
        document.getElementById('fillColorTool').onchange = (e) => {
            this.updateElementProperty('fillColor', e.target.value);
        };
        
        // Border color change
        document.getElementById('borderColorTool').onchange = (e) => {
            this.updateElementProperty('borderColor', e.target.value);
        };
        
        // Border width change
        document.getElementById('borderWidthTool').onchange = (e) => {
            this.updateElementProperty('borderWidth', parseInt(e.target.value));
        };
        
        // Toolbar buttons
        document.querySelectorAll('.toolbar-btn[data-property]').forEach(btn => {
            btn.onclick = () => {
                const property = btn.dataset.property;
                const value = btn.dataset.value;
                
                if (property === 'fontWeight') {
                    const currentWeight = this.selectedElement.fontWeight;
                    const newWeight = currentWeight === 'bold' ? 'normal' : 'bold';
                    this.updateElementProperty('fontWeight', newWeight);
                } else {
                    this.updateElementProperty(property, value);
                }
                
                this.updateToolbarButtonStates(this.selectedElement);
            };
        });
        
        // Delete button
        document.getElementById('deleteBtn').onclick = () => {
            this.deleteElement();
        };
        
        // Duplicate button
        document.getElementById('duplicateBtn').onclick = () => {
            this.duplicateElement();
        };
        
        // Layer management buttons
        document.getElementById('layerUpBtn').onclick = () => {
            this.bringForward();
        };
        
        document.getElementById('layerDownBtn').onclick = () => {
            this.sendBackward();
        };
    }

    duplicateElement() {
        if (!this.selectedElement) return;
        
        const newElement = JSON.parse(JSON.stringify(this.selectedElement));
        newElement.id = 'element_' + Date.now();
        newElement.x += 20;
        newElement.y += 20;
        
        this.elements.push(newElement);
        this.selectElement(newElement);
        this.updateCanvas();
        this.saveToHistory();
        this.autoSave();
    }

    bringForward() {
        if (!this.selectedElement) return;
        
        const currentIndex = this.elements.findIndex(el => el.id === this.selectedElement.id);
        if (currentIndex < this.elements.length - 1) {
            // Swap with next element (bring forward)
            [this.elements[currentIndex], this.elements[currentIndex + 1]] = 
            [this.elements[currentIndex + 1], this.elements[currentIndex]];
            
            this.updateCanvas();
            this.saveToHistory();
            this.autoSave();
        }
    }

    sendBackward() {
        if (!this.selectedElement) return;
        
        const currentIndex = this.elements.findIndex(el => el.id === this.selectedElement.id);
        if (currentIndex > 0) {
            // Swap with previous element (send backward)
            [this.elements[currentIndex], this.elements[currentIndex - 1]] = 
            [this.elements[currentIndex - 1], this.elements[currentIndex]];
            
            this.updateCanvas();
            this.saveToHistory();
            this.autoSave();
        }
    }

    bringToFront() {
        if (!this.selectedElement) return;
        
        const elementIndex = this.elements.findIndex(el => el.id === this.selectedElement.id);
        if (elementIndex !== -1) {
            const element = this.elements.splice(elementIndex, 1)[0];
            this.elements.push(element);
            this.updateCanvas();
            this.saveToHistory();
            this.autoSave();
        }
    }

    sendToBack() {
        if (!this.selectedElement) return;
        
        const elementIndex = this.elements.findIndex(el => el.id === this.selectedElement.id);
        if (elementIndex !== -1) {
            const element = this.elements.splice(elementIndex, 1)[0];
            this.elements.unshift(element);
            this.updateCanvas();
            this.saveToHistory();
            this.autoSave();
        }
    }

    updateCanvas() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw frame background first
        if (this.currentFrame) {
            const frameConfig = this.currentFrame.config;
            
            // Apply background
            if (frameConfig.background.startsWith('linear-gradient')) {
                // Apply gradient background
                const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
                if (this.currentFrame.type === 'modern') {
                    gradient.addColorStop(0, '#667eea');
                    gradient.addColorStop(1, '#764ba2');
                } else {
                    gradient.addColorStop(0, '#667eea');
                    gradient.addColorStop(1, '#764ba2');
                }
                this.ctx.fillStyle = gradient;
            } else {
                this.ctx.fillStyle = frameConfig.background;
            }
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            // Apply border
            if (frameConfig.border.width > 0) {
                this.ctx.strokeStyle = frameConfig.border.color;
                this.ctx.lineWidth = frameConfig.border.width;
                
                if (frameConfig.border.style === 'double') {
                    // Draw double border
                    this.ctx.strokeRect(frameConfig.border.width/2, frameConfig.border.width/2, 
                        this.canvas.width - frameConfig.border.width, this.canvas.height - frameConfig.border.width);
                    this.ctx.strokeRect(frameConfig.border.width/4, frameConfig.border.width/4, 
                        this.canvas.width - frameConfig.border.width/2, this.canvas.height - frameConfig.border.width/2);
                } else if (frameConfig.border.style === 'decorative') {
                    // Draw decorative border (ridge effect)
                    this.ctx.strokeRect(frameConfig.border.width/2, frameConfig.border.width/2, 
                        this.canvas.width - frameConfig.border.width, this.canvas.height - frameConfig.border.width);
                    
                    // Add inner border for decorative effect
                    this.ctx.strokeStyle = '#a0522d';
                    this.ctx.lineWidth = 2;
                    this.ctx.strokeRect(frameConfig.border.width - 5, frameConfig.border.width - 5, 
                        this.canvas.width - (frameConfig.border.width - 5) * 2, this.canvas.height - (frameConfig.border.width - 5) * 2);
                } else {
                    this.ctx.strokeRect(frameConfig.border.width/2, frameConfig.border.width/2, 
                        this.canvas.width - frameConfig.border.width, this.canvas.height - frameConfig.border.width);
                }
            }
        } else {
            // Default white background if no frame
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        
        // Draw template background (if any)
        if (this.currentTemplate?.canvas?.backgroundColor && !this.currentFrame) {
            this.ctx.fillStyle = this.currentTemplate.canvas.backgroundColor;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        
        // Draw elements
        this.elements.forEach(element => {
            this.drawElement(element);
        });
        
        // Note: Selection is now handled by overlay system, not canvas drawing
    }

    drawElement(element) {
        const { x, y, width, height, type } = element;
        
        if (type === 'text' || type === 'field') {
            // Access properties directly from element
            const fontWeight = element.fontWeight || 'normal';
            const fontSize = element.fontSize || 16;
            const fontFamily = element.fontFamily || 'Arial';
            const color = element.color || '#000000';
            const textAlign = element.textAlign || 'left';
            const text = element.text || 'Text';
            
            this.ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
            this.ctx.fillStyle = color;
            this.ctx.textAlign = textAlign;
            
            let displayText = text;
            if (type === 'field' && element.fieldType) {
                displayText = this.fieldTypes[element.fieldType] || text;
            }
            
            const textX = textAlign === 'center' ? x + width / 2 : 
                         textAlign === 'right' ? x + width : x;
            
            this.ctx.fillText(displayText, textX, y + fontSize);
            
        } else if (type === 'image' && element.src) {
            const img = new Image();
            img.onload = () => {
                this.ctx.drawImage(img, x, y, width, height);
            };
            img.src = element.src;
            
        } else if (type === 'shape') {
            // Draw shape background
            const fillColor = element.fillColor || '#3498db';
            const borderColor = element.borderColor || '#2c3e50';
            const borderWidth = element.borderWidth || 1;
            const shape = element.subtype || element.shape || 'rectangle';
            
            this.ctx.fillStyle = fillColor;
            this.ctx.strokeStyle = borderColor;
            this.ctx.lineWidth = borderWidth;
            
            // Draw different shapes based on subtype
            switch (shape) {
                case 'rectangle':
                    this.ctx.fillRect(x, y, width, height);
                    if (borderWidth > 0) {
                        this.ctx.strokeRect(x, y, width, height);
                    }
                    break;
                    
                case 'circle':
                    const centerX = x + width / 2;
                    const centerY = y + height / 2;
                    const radius = Math.min(width, height) / 2;
                    
                    this.ctx.beginPath();
                    this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
                    this.ctx.fill();
                    if (borderWidth > 0) {
                        this.ctx.stroke();
                    }
                    break;
                    
                case 'line':
                    this.ctx.beginPath();
                    this.ctx.moveTo(x, y + height / 2);
                    this.ctx.lineTo(x + width, y + height / 2);
                    this.ctx.lineWidth = Math.max(borderWidth, 2);
                    this.ctx.strokeStyle = fillColor; // Use fill color for line
                    this.ctx.stroke();
                    break;
                    
                default:
                    this.ctx.fillRect(x, y, width, height);
                    if (borderWidth > 0) {
                        this.ctx.strokeRect(x, y, width, height);
                    }
            }
        }
    }

    drawRoundedRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
    }

    drawSelection(element) {
        const { x, y, width, height } = element;
        
        // Draw selection border
        this.ctx.strokeStyle = '#e74c3c';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.strokeRect(x - 2, y - 2, width + 4, height + 4);
        this.ctx.setLineDash([]);
        
        // Draw resize handles
        const handleSize = 8;
        this.ctx.fillStyle = '#e74c3c';
        
        // Corner handles
        this.ctx.fillRect(x - handleSize/2, y - handleSize/2, handleSize, handleSize);
        this.ctx.fillRect(x + width - handleSize/2, y - handleSize/2, handleSize, handleSize);
        this.ctx.fillRect(x - handleSize/2, y + height - handleSize/2, handleSize, handleSize);
        this.ctx.fillRect(x + width - handleSize/2, y + height - handleSize/2, handleSize, handleSize);
    }

    updatePropertiesPanel() {
        const panel = document.getElementById('propertiesPanel');
        
        if (!this.selectedElement) {
            panel.innerHTML = `
                <div class="no-selection">
                    <i class="fas fa-mouse-pointer"></i>
                    <p>Select an element to edit properties</p>
                </div>
            `;
            return;
        }
        
        // Auto-switch to properties tab when element is selected
        this.switchTab('properties');
        
        const element = this.selectedElement;
        
        let html = `
            <div class="property-group">
                <h4>Position & Size</h4>
                <div class="property-row">
                    <div class="property-field">
                        <label>X Position</label>
                        <input type="number" value="${Math.round(element.x)}" onchange="templateDesigner.updateElementProperty('x', parseFloat(this.value))">
                    </div>
                    <div class="property-field">
                        <label>Y Position</label>
                        <input type="number" value="${Math.round(element.y)}" onchange="templateDesigner.updateElementProperty('y', parseFloat(this.value))">
                    </div>
                </div>
                <div class="property-row">
                    <div class="property-field">
                        <label>Width</label>
                        <input type="number" value="${Math.round(element.width)}" onchange="templateDesigner.updateElementProperty('width', parseFloat(this.value))">
                    </div>
                    <div class="property-field">
                        <label>Height</label>
                        <input type="number" value="${Math.round(element.height)}" onchange="templateDesigner.updateElementProperty('height', parseFloat(this.value))">
                    </div>
                </div>
            </div>
        `;
        
        if (element.type === 'text') {
            html += `
                <div class="property-group">
                    <h4>Text Properties</h4>
                    <div class="property-field">
                        <label>Text</label>
                        <input type="text" value="${element.text || ''}" onchange="templateDesigner.updateElementProperty('text', this.value)">
                    </div>
                    <div class="property-row">
                        <div class="property-field">
                            <label>Font Family</label>
                            <select onchange="templateDesigner.updateElementProperty('fontFamily', this.value)">
                                <option value="Arial" ${element.fontFamily === 'Arial' ? 'selected' : ''}>Arial</option>
                                <option value="Times New Roman" ${element.fontFamily === 'Times New Roman' ? 'selected' : ''}>Times New Roman</option>
                                <option value="Helvetica" ${element.fontFamily === 'Helvetica' ? 'selected' : ''}>Helvetica</option>
                                <option value="Georgia" ${element.fontFamily === 'Georgia' ? 'selected' : ''}>Georgia</option>
                                <option value="Verdana" ${element.fontFamily === 'Verdana' ? 'selected' : ''}>Verdana</option>
                            </select>
                        </div>
                        <div class="property-field">
                            <label>Font Size</label>
                            <input type="number" value="${element.fontSize || 16}" onchange="templateDesigner.updateElementProperty('fontSize', parseFloat(this.value))">
                        </div>
                    </div>
                    <div class="property-row">
                        <div class="property-field">
                            <label>Font Weight</label>
                            <select onchange="templateDesigner.updateElementProperty('fontWeight', this.value)">
                                <option value="normal" ${element.fontWeight === 'normal' ? 'selected' : ''}>Normal</option>
                                <option value="bold" ${element.fontWeight === 'bold' ? 'selected' : ''}>Bold</option>
                                <option value="lighter" ${element.fontWeight === 'lighter' ? 'selected' : ''}>Light</option>
                            </select>
                        </div>
                        <div class="property-field">
                            <label>Color</label>
                            <input type="color" value="${element.color || '#000000'}" onchange="templateDesigner.updateElementProperty('color', this.value)">
                        </div>
                    </div>
                    <div class="property-field">
                        <label>Text Align</label>
                        <div class="button-group">
                            <button class="btn btn-sm ${element.textAlign === 'left' ? 'active' : ''}" onclick="templateDesigner.updateElementProperty('textAlign', 'left')">
                                <i class="fas fa-align-left"></i>
                            </button>
                            <button class="btn btn-sm ${element.textAlign === 'center' ? 'active' : ''}" onclick="templateDesigner.updateElementProperty('textAlign', 'center')">
                                <i class="fas fa-align-center"></i>
                            </button>
                            <button class="btn btn-sm ${element.textAlign === 'right' ? 'active' : ''}" onclick="templateDesigner.updateElementProperty('textAlign', 'right')">
                                <i class="fas fa-align-right"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
        
        if (element.type === 'shape') {
            html += `
                <div class="property-group">
                    <h4>Shape Properties</h4>
                    <div class="property-field">
                        <label>Fill Color</label>
                        <input type="color" value="${element.fillColor || '#3498db'}" onchange="templateDesigner.updateElementProperty('fillColor', this.value)">
                    </div>
                    <div class="property-row">
                        <div class="property-field">
                            <label>Border Color</label>
                            <input type="color" value="${element.borderColor || '#2c3e50'}" onchange="templateDesigner.updateElementProperty('borderColor', this.value)">
                        </div>
                        <div class="property-field">
                            <label>Border Width</label>
                            <input type="number" value="${element.borderWidth || 1}" min="0" max="10" onchange="templateDesigner.updateElementProperty('borderWidth', parseInt(this.value))">
                        </div>
                    </div>
                </div>
            `;
        }
        
        if (element.type === 'image') {
            html += `
                <div class="property-group">
                    <h4>Image Properties</h4>
                    <div class="property-field">
                        <label>Upload Image</label>
                        <input type="file" accept="image/*" onchange="templateDesigner.handleImageUpload(this.files[0])">
                    </div>
                    <div class="property-field">
                        <label>
                            <input type="checkbox" ${element.preserveAspectRatio ? 'checked' : ''} onchange="templateDesigner.updateElementProperty('preserveAspectRatio', this.checked)">
                            Preserve Aspect Ratio
                        </label>
                    </div>
                </div>
            `;
        }
        
        html += `
            <div class="property-group">
                <h4>Actions</h4>
                <button class="btn btn-danger btn-sm" onclick="templateDesigner.deleteElement()">
                    <i class="fas fa-trash"></i> Delete Element
                </button>
            </div>
        `;
        
        panel.innerHTML = html;
    }

    updateElementProperty(property, value) {
        if (!this.selectedElement) return;
        
        // Update the property directly on the element
        this.selectedElement[property] = value;
        
        this.updateCanvas();
        this.saveToHistory();
        this.updateSaveStatus(false);
    }

    handleImageUpload(file) {
        if (!file || !this.selectedElement || this.selectedElement.type !== 'image') return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            this.selectedElement.src = e.target.result;
            this.updateCanvas();
            this.saveToHistory();
        };
        reader.readAsDataURL(file);
    }

    deleteElement() {
        if (!this.selectedElement) return;
        
        const index = this.elements.indexOf(this.selectedElement);
        if (index > -1) {
            this.elements.splice(index, 1);
            this.clearSelection();
            this.updateCanvas();
            this.saveToHistory();
            this.autoSave();
        }
    }

    zoomIn() {
        this.zoom = Math.min(this.zoom * 1.2, 3);
        this.updateZoom();
    }

    zoomOut() {
        this.zoom = Math.max(this.zoom / 1.2, 0.5);
        this.updateZoom();
    }

    updateZoom() {
        this.canvas.style.transform = `scale(${this.zoom})`;
        document.getElementById('zoomLevel').textContent = `${Math.round(this.zoom * 100)}%`;
    }

    saveToHistory() {
        // Remove any future history if we're not at the end
        this.history = this.history.slice(0, this.historyIndex + 1);
        
        // Add current state
        this.history.push(JSON.parse(JSON.stringify(this.elements)));
        this.historyIndex++;
        
        // Limit history size
        if (this.history.length > this.maxHistory) {
            this.history.shift();
            this.historyIndex--;
        }
        
        // Update buttons
        document.getElementById('undoBtn').disabled = this.historyIndex <= 0;
        document.getElementById('redoBtn').disabled = this.historyIndex >= this.history.length - 1;
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.elements = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
            this.clearSelection();
            this.updateCanvas();
            
            document.getElementById('undoBtn').disabled = this.historyIndex <= 0;
            document.getElementById('redoBtn').disabled = false;
        }
    }

    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.elements = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
            this.clearSelection();
            this.updateCanvas();
            
            document.getElementById('redoBtn').disabled = this.historyIndex >= this.history.length - 1;
            document.getElementById('undoBtn').disabled = false;
        }
    }

    showPreview() {
        const previewCanvas = document.getElementById('previewCanvas');
        previewCanvas.width = this.canvas.width;
        previewCanvas.height = this.canvas.height;
        
        const previewCtx = previewCanvas.getContext('2d');
        
        // Draw background
        if (this.currentTemplate?.canvas?.backgroundColor) {
            previewCtx.fillStyle = this.currentTemplate.canvas.backgroundColor;
            previewCtx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
        }
        
        // Draw elements with sample data
        this.elements.forEach(element => {
            this.drawElementPreview(previewCtx, element);
        });
        
        document.getElementById('previewModal').style.display = 'flex';
    }

    drawElementPreview(ctx, element) {
        const { x, y, width, height, properties, type } = element;
        
        if (type === 'text') {
            ctx.font = `${properties.fontWeight} ${properties.fontSize}px ${properties.fontFamily}`;
            ctx.fillStyle = properties.color;
            ctx.textAlign = properties.alignment;
            
            const textX = properties.alignment === 'center' ? x + width / 2 : 
                         properties.alignment === 'right' ? x + width : x;
            
            ctx.fillText(properties.text, textX, y + properties.fontSize);
            
        } else if (type === 'field') {
            const sampleData = {
                name: 'John Doe',
                rollNumber: '2021001',
                course: 'Computer Science',
                year: '3rd Year',
                section: 'A',
                email: 'john@student.edu',
                phone: '+1234567890',
                date: new Date().toLocaleDateString()
            };
            
            ctx.font = `${properties.fontWeight} ${properties.fontSize}px ${properties.fontFamily}`;
            ctx.fillStyle = properties.color;
            ctx.textAlign = properties.alignment;
            
            const textX = properties.alignment === 'center' ? x + width / 2 : 
                         properties.alignment === 'right' ? x + width : x;
            
            const displayText = sampleData[properties.fieldType] || properties.text;
            ctx.fillText(displayText, textX, y + properties.fontSize);
            
        } else if (type === 'image' && properties.imageUrl) {
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, x, y, width, height);
            };
            img.src = properties.imageUrl;
            
        } else if (type === 'shape') {
            // Draw shape background
            if (properties.backgroundColor) {
                ctx.fillStyle = properties.backgroundColor;
                if (properties.borderRadius > 0) {
                    this.drawRoundedRectOnCtx(ctx, x, y, width, height, properties.borderRadius);
                    ctx.fill();
                } else {
                    ctx.fillRect(x, y, width, height);
                }
            }
            
            // Draw border
            if (properties.borderWidth > 0 && properties.borderColor) {
                ctx.strokeStyle = properties.borderColor;
                ctx.lineWidth = properties.borderWidth;
                if (properties.borderRadius > 0) {
                    this.drawRoundedRectOnCtx(ctx, x, y, width, height, properties.borderRadius);
                    ctx.stroke();
                } else {
                    ctx.strokeRect(x, y, width, height);
                }
            }
        }
    }

    drawRoundedRectOnCtx(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }

    hidePreviewModal() {
        document.getElementById('previewModal').style.display = 'none';
    }

    downloadPreview() {
        const previewCanvas = document.getElementById('previewCanvas');
        const link = document.createElement('a');
        link.download = `${this.currentTemplate?.name || 'template'}_preview.png`;
        link.href = previewCanvas.toDataURL();
        link.click();
    }

    handleKeyboard(e) {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'z':
                    e.preventDefault();
                    if (e.shiftKey) {
                        this.redo();
                    } else {
                        this.undo();
                    }
                    break;
                case 's':
                    e.preventDefault();
                    this.saveTemplate();
                    break;
                case 'Delete':
                case 'Backspace':
                    if (this.selectedElement) {
                        e.preventDefault();
                        this.deleteElement();
                    }
                    break;
            }
        }
    }

    showSuccess(message) {
        // Create success notification
        const notification = document.createElement('div');
        notification.className = 'success-notification';
        notification.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #27ae60;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 500;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Auto-save and Draft Management
    autoSave() {
        if (this.elements.length === 0 && !this.currentFrame) {
            return; // Nothing to save
        }

        const designData = {
            elements: this.elements,
            currentFrame: this.currentFrame,
            canvasSize: {
                width: this.canvas.width,
                height: this.canvas.height
            },
            timestamp: new Date().toISOString(),
            college: this.getCollegeInfo()
        };

        // Save to localStorage for auto-recovery
        localStorage.setItem('autoSave_template_designer', JSON.stringify(designData));
        
        // Show subtle save indicator
        this.showAutoSaveIndicator();
    }

    loadAutoSave() {
        const autoSaveData = localStorage.getItem('autoSave_template_designer');
        if (autoSaveData) {
            try {
                const designData = JSON.parse(autoSaveData);
                
                // Ask user if they want to restore
                if (confirm('Found an auto-saved design. Would you like to restore it?')) {
                    this.elements = designData.elements || [];
                    this.currentFrame = designData.currentFrame || null;
                    
                    if (designData.canvasSize) {
                        this.canvas.width = designData.canvasSize.width;
                        this.canvas.height = designData.canvasSize.height;
                    }
                    
                    this.updateCanvas();
                    this.showSuccess('Auto-saved design restored successfully!');
                }
            } catch (error) {
                console.error('Error loading auto-save:', error);
            }
        }
    }

    saveToDrafts() {
        if (this.elements.length === 0 && !this.currentFrame) {
            alert('Please add some content before saving to drafts.');
            return;
        }

        const title = prompt('Enter a title for this draft:') || `Draft ${new Date().toLocaleDateString()}`;
        
        const draftData = {
            id: 'draft_' + Date.now(),
            title: title,
            elements: this.elements,
            currentFrame: this.currentFrame,
            canvasSize: {
                width: this.canvas.width,
                height: this.canvas.height
            },
            timestamp: new Date().toISOString(),
            college: this.getCollegeInfo(),
            preview: this.generatePreview()
        };

        // Save to localStorage drafts
        const drafts = JSON.parse(localStorage.getItem('template_drafts') || '[]');
        drafts.push(draftData);
        localStorage.setItem('template_drafts', JSON.stringify(drafts));

        // Also save to college-specific drafts for sharing
        this.saveToCollegeDrafts(draftData);
        
        this.showSuccess('Draft saved successfully!');
    }

    saveToCollegeDrafts(draftData) {
        const collegeInfo = this.getCollegeInfo();
        if (!collegeInfo.id) return;

        const collegeDraftsKey = `college_drafts_${collegeInfo.id}`;
        const collegeDrafts = JSON.parse(localStorage.getItem(collegeDraftsKey) || '[]');
        
        // Add user info to draft
        draftData.createdBy = {
            name: collegeInfo.userName || 'Unknown User',
            email: collegeInfo.userEmail || 'unknown@email.com'
        };
        
        collegeDrafts.push(draftData);
        localStorage.setItem(collegeDraftsKey, JSON.stringify(collegeDrafts));
    }

    saveAsTemplate() {
        if (this.elements.length === 0 && !this.currentFrame) {
            alert('Please add some content before saving as template.');
            return;
        }

        const title = prompt('Enter a title for this template:') || `Template ${new Date().toLocaleDateString()}`;
        const description = prompt('Enter a description (optional):') || '';
        
        const templateData = {
            id: 'template_' + Date.now(),
            title: title,
            description: description,
            elements: this.elements,
            currentFrame: this.currentFrame,
            canvasSize: {
                width: this.canvas.width,
                height: this.canvas.height
            },
            timestamp: new Date().toISOString(),
            college: this.getCollegeInfo(),
            preview: this.generatePreview(),
            isPublic: true
        };

        // Save to college templates for sharing
        this.saveToCollegeTemplates(templateData);
        
        this.showSuccess('Template saved successfully and is now available to your college!');
    }

    saveToCollegeTemplates(templateData) {
        const collegeInfo = this.getCollegeInfo();
        if (!collegeInfo.id) return;

        const collegeTemplatesKey = `college_templates_${collegeInfo.id}`;
        const collegeTemplates = JSON.parse(localStorage.getItem(collegeTemplatesKey) || '[]');
        
        // Add user info to template
        templateData.createdBy = {
            name: collegeInfo.userName || 'Unknown User',
            email: collegeInfo.userEmail || 'unknown@email.com'
        };
        
        collegeTemplates.push(templateData);
        localStorage.setItem(collegeTemplatesKey, JSON.stringify(collegeTemplates));
    }

    getCollegeInfo() {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        return {
            id: userData.college?.id || 'demo_college',
            name: userData.college?.name || 'Demo College',
            userName: userData.name || 'Demo User',
            userEmail: userData.email || 'demo@college.edu'
        };
    }

    generatePreview() {
        // Create a smaller canvas for preview
        const previewCanvas = document.createElement('canvas');
        previewCanvas.width = 300;
        previewCanvas.height = 200;
        const previewCtx = previewCanvas.getContext('2d');
        
        // Scale factor
        const scaleX = 300 / this.canvas.width;
        const scaleY = 200 / this.canvas.height;
        const scale = Math.min(scaleX, scaleY);
        
        previewCtx.scale(scale, scale);
        
        // Draw background
        if (this.currentFrame) {
            const frameConfig = this.currentFrame.config;
            if (frameConfig.background.startsWith('linear-gradient')) {
                const gradient = previewCtx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
                gradient.addColorStop(0, '#667eea');
                gradient.addColorStop(1, '#764ba2');
                previewCtx.fillStyle = gradient;
            } else {
                previewCtx.fillStyle = frameConfig.background;
            }
            previewCtx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        
        // Draw elements
        this.elements.forEach(element => {
            this.drawElement(previewCtx, element);
        });
        
        return previewCanvas.toDataURL();
    }

    showAutoSaveIndicator() {
        // Create or update auto-save indicator
        let indicator = document.getElementById('autoSaveIndicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'autoSaveIndicator';
            indicator.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #4CAF50;
                color: white;
                padding: 8px 12px;
                border-radius: 4px;
                font-size: 12px;
                z-index: 1000;
                opacity: 0;
                transition: opacity 0.3s ease;
            `;
            indicator.innerHTML = '<i class="fas fa-check"></i> Auto-saved';
            document.body.appendChild(indicator);
        }
        
        indicator.style.opacity = '1';
        setTimeout(() => {
            indicator.style.opacity = '0';
        }, 2000);
    }

    positionDropdown(dropdown) {
        // Get dropdown button position
        const button = dropdown.querySelector('.dropdown-toggle');
        const menu = dropdown.querySelector('.dropdown-menu');
        
        if (!button || !menu) return;
        
        // Get button position relative to viewport
        const buttonRect = button.getBoundingClientRect();
        const menuHeight = 120; // Approximate height of dropdown menu
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        const spaceBelow = viewportHeight - buttonRect.bottom;
        const spaceAbove = buttonRect.top;
        const spaceRight = viewportWidth - buttonRect.right;
        
        // Reset positioning classes
        dropdown.classList.remove('dropup');
        
        // Check if we're in the sidebar (narrow space)
        const isInSidebar = buttonRect.left < 300;
        
        if (isInSidebar) {
            // For sidebar, use fixed positioning
            menu.style.position = 'fixed';
            menu.style.left = buttonRect.right + 10 + 'px';
            menu.style.top = buttonRect.top + 'px';
            
            // If dropdown would go off right edge, position to the left
            if (spaceRight < 180) {
                menu.style.left = buttonRect.left - 170 + 'px';
            }
            
            // If dropdown would go off bottom, position upward
            if (spaceBelow < menuHeight && spaceAbove > menuHeight) {
                menu.style.top = buttonRect.bottom - menuHeight + 'px';
            }
        } else {
            // For other areas, use relative positioning
            menu.style.position = 'absolute';
            menu.style.left = '0';
            menu.style.top = '100%';
            
            // If not enough space below and more space above, position upward
            if (spaceBelow < menuHeight && spaceAbove > menuHeight) {
                dropdown.classList.add('dropup');
            }
        }
    }

    closeDropdown() {
        const dropdown = document.querySelector('.save-dropdown');
        const menu = dropdown?.querySelector('.dropdown-menu');
        
        dropdown?.classList.remove('active');
        dropdown?.classList.remove('dropup');
        
        // Reset positioning
        if (menu) {
            menu.style.position = '';
            menu.style.left = '';
            menu.style.top = '';
        }
    }
}

// Global instance
let templateDesigner;

// Global logout function for navbar
function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    window.location.href = 'login.html';
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    templateDesigner = new TemplateDesigner();
});
