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
        
        this.checkAuthentication();
        this.loadUserInfo();
        this.setupEventListeners();
        this.loadTemplates();
        this.updateCanvas();
        this.setupModernInteractions();
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
        }
    }

    setupEventListeners() {
        // Modern frame selection
        document.querySelectorAll('.frame-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const frameType = e.currentTarget.dataset.frame;
                this.applyFrame(frameType);
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
        document.getElementById('saveTemplateBtn')?.addEventListener('click', () => this.saveTemplate());
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

        // Clear canvas and apply frame
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Apply background
        if (frameConfig.background.startsWith('linear-gradient')) {
            // Apply gradient background
            const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
            gradient.addColorStop(0, '#667eea');
            gradient.addColorStop(1, '#764ba2');
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
            } else {
                this.ctx.strokeRect(frameConfig.border.width/2, frameConfig.border.width/2, 
                    this.canvas.width - frameConfig.border.width, this.canvas.height - frameConfig.border.width);
            }
        }

        this.updateCanvas();
        this.addToHistory();
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
        const handles = document.querySelectorAll('.resize-handle');
        handles.forEach(handle => {
            handle.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                this.isResizing = true;
                this.resizeDirection = handle.dataset.direction;
                this.dragOffset = {
                    x: e.clientX,
                    y: e.clientY
                };
            });
        });
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
        this.addToHistory();
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
        this.addToHistory();
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
            }
        } catch (error) {
            console.error('Error loading templates:', error);
        }
    }

    displayTemplates(templates) {
        const templateList = document.getElementById('templateList');
        templateList.innerHTML = '';
        
        if (templates.length === 0) {
            templateList.innerHTML = `
                <div style="text-align: center; color: #718096; padding: 20px;">
                    <i class="fas fa-folder-open" style="font-size: 24px; margin-bottom: 10px; display: block;"></i>
                    No templates yet. Create your first template!
                </div>
            `;
            return;
        }
        
        templates.forEach(template => {
            const templateItem = document.createElement('div');
            templateItem.className = 'template-item';
            templateItem.dataset.templateId = template._id;
            
            templateItem.innerHTML = `
                <div class="template-item-name">${template.name}</div>
                <div class="template-item-meta">
                    <span>${new Date(template.updatedAt).toLocaleDateString()}</span>
                    <span>${template.elements?.length || 0} elements</span>
                </div>
                <div class="template-item-actions">
                    <button class="btn btn-sm btn-secondary" onclick="templateDesigner.duplicateTemplate('${template._id}')">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="templateDesigner.deleteTemplate('${template._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            templateItem.addEventListener('click', (e) => {
                if (!e.target.closest('.template-item-actions')) {
                    this.loadTemplate(template._id);
                }
            });
            
            templateList.appendChild(templateItem);
        });
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
                document.getElementById('saveTemplateBtn').disabled = false;
                
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

    async createNewTemplate(e) {
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
        if (!this.currentTemplate) return;
        
        try {
            const updateData = {
                elements: this.elements,
                canvas: {
                    width: this.canvas.width,
                    height: this.canvas.height,
                    backgroundColor: this.currentTemplate.canvas.backgroundColor
                }
            };
            
            const response = await fetch(`${this.baseURL}/templates/${this.currentTemplate._id}`, {
                method: 'PUT',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(updateData)
            });
            
            if (response.ok) {
                this.showSuccess('Template saved successfully');
            } else {
                throw new Error('Failed to save template');
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
                    document.getElementById('saveTemplateBtn').disabled = true;
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
        if (!this.isDragging || !this.draggedElement) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / this.zoom;
        const y = (e.clientY - rect.top) / this.zoom;
        
        this.draggedElement.x = x - this.dragOffset.x;
        this.draggedElement.y = y - this.dragOffset.y;
        
        this.updateCanvas();
        this.updatePropertiesPanel();
    }

    onCanvasMouseUp(e) {
        if (this.isDragging) {
            this.isDragging = false;
            this.draggedElement = null;
            this.saveToHistory();
        }
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
        this.updatePropertiesPanel();
        this.updateCanvas();
    }

    clearSelection() {
        this.selectedElement = null;
        this.updatePropertiesPanel();
        this.updateCanvas();
    }

    updateCanvas() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background
        if (this.currentTemplate?.canvas?.backgroundColor) {
            this.ctx.fillStyle = this.currentTemplate.canvas.backgroundColor;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        
        // Draw elements
        this.elements.forEach(element => {
            this.drawElement(element);
        });
        
        // Draw selection
        if (this.selectedElement) {
            this.drawSelection(this.selectedElement);
        }
    }

    drawElement(element) {
        const { x, y, width, height, properties, type } = element;
        
        if (type === 'text' || type === 'field') {
            this.ctx.font = `${properties.fontWeight} ${properties.fontSize}px ${properties.fontFamily}`;
            this.ctx.fillStyle = properties.color;
            this.ctx.textAlign = properties.alignment;
            
            let displayText = properties.text;
            if (type === 'field' && properties.fieldType) {
                displayText = this.fieldTypes[properties.fieldType] || properties.text;
            }
            
            const textX = properties.alignment === 'center' ? x + width / 2 : 
                         properties.alignment === 'right' ? x + width : x;
            
            this.ctx.fillText(displayText, textX, y + properties.fontSize);
            
        } else if (type === 'image' && properties.imageUrl) {
            const img = new Image();
            img.onload = () => {
                this.ctx.drawImage(img, x, y, width, height);
            };
            img.src = properties.imageUrl;
            
        } else if (type === 'shape') {
            // Draw shape background
            if (properties.backgroundColor) {
                this.ctx.fillStyle = properties.backgroundColor;
                if (properties.borderRadius > 0) {
                    this.drawRoundedRect(x, y, width, height, properties.borderRadius);
                    this.ctx.fill();
                } else {
                    this.ctx.fillRect(x, y, width, height);
                }
            }
            
            // Draw border
            if (properties.borderWidth > 0 && properties.borderColor) {
                this.ctx.strokeStyle = properties.borderColor;
                this.ctx.lineWidth = properties.borderWidth;
                if (properties.borderRadius > 0) {
                    this.drawRoundedRect(x, y, width, height, properties.borderRadius);
                    this.ctx.stroke();
                } else {
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
        
        const element = this.selectedElement;
        const properties = element.properties;
        
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
        
        if (element.type === 'text' || element.type === 'field') {
            html += `
                <div class="property-group">
                    <h4>Text Properties</h4>
                    ${element.type === 'text' ? `
                        <div class="property-field">
                            <label>Text</label>
                            <input type="text" value="${properties.text}" onchange="templateDesigner.updateElementProperty('text', this.value)">
                        </div>
                    ` : `
                        <div class="property-field">
                            <label>Field Type</label>
                            <select onchange="templateDesigner.updateElementProperty('fieldType', this.value)">
                                ${Object.keys(this.fieldTypes).map(key => 
                                    `<option value="${key}" ${properties.fieldType === key ? 'selected' : ''}>${this.fieldTypes[key]}</option>`
                                ).join('')}
                            </select>
                        </div>
                    `}
                    <div class="property-row">
                        <div class="property-field">
                            <label>Font Size</label>
                            <input type="number" value="${properties.fontSize}" min="8" max="72" onchange="templateDesigner.updateElementProperty('fontSize', parseInt(this.value))">
                        </div>
                        <div class="property-field">
                            <label>Font Weight</label>
                            <select onchange="templateDesigner.updateElementProperty('fontWeight', this.value)">
                                <option value="normal" ${properties.fontWeight === 'normal' ? 'selected' : ''}>Normal</option>
                                <option value="bold" ${properties.fontWeight === 'bold' ? 'selected' : ''}>Bold</option>
                            </select>
                        </div>
                    </div>
                    <div class="property-row">
                        <div class="property-field">
                            <label>Font Family</label>
                            <select onchange="templateDesigner.updateElementProperty('fontFamily', this.value)">
                                <option value="Arial" ${properties.fontFamily === 'Arial' ? 'selected' : ''}>Arial</option>
                                <option value="Times New Roman" ${properties.fontFamily === 'Times New Roman' ? 'selected' : ''}>Times New Roman</option>
                                <option value="Helvetica" ${properties.fontFamily === 'Helvetica' ? 'selected' : ''}>Helvetica</option>
                                <option value="Georgia" ${properties.fontFamily === 'Georgia' ? 'selected' : ''}>Georgia</option>
                            </select>
                        </div>
                        <div class="property-field">
                            <label>Alignment</label>
                            <select onchange="templateDesigner.updateElementProperty('alignment', this.value)">
                                <option value="left" ${properties.alignment === 'left' ? 'selected' : ''}>Left</option>
                                <option value="center" ${properties.alignment === 'center' ? 'selected' : ''}>Center</option>
                                <option value="right" ${properties.alignment === 'right' ? 'selected' : ''}>Right</option>
                            </select>
                        </div>
                    </div>
                    <div class="property-field">
                        <label>Color</label>
                        <input type="color" value="${properties.color}" onchange="templateDesigner.updateElementProperty('color', this.value)">
                    </div>
                </div>
            `;
        }
        
        if (element.type === 'shape') {
            html += `
                <div class="property-group">
                    <h4>Shape Properties</h4>
                    <div class="property-field">
                        <label>Background Color</label>
                        <input type="color" value="${properties.backgroundColor}" onchange="templateDesigner.updateElementProperty('backgroundColor', this.value)">
                    </div>
                    <div class="property-row">
                        <div class="property-field">
                            <label>Border Color</label>
                            <input type="color" value="${properties.borderColor}" onchange="templateDesigner.updateElementProperty('borderColor', this.value)">
                        </div>
                        <div class="property-field">
                            <label>Border Width</label>
                            <input type="number" value="${properties.borderWidth}" min="0" max="10" onchange="templateDesigner.updateElementProperty('borderWidth', parseInt(this.value))">
                        </div>
                    </div>
                    <div class="property-field">
                        <label>Border Radius</label>
                        <input type="number" value="${properties.borderRadius}" min="0" max="50" onchange="templateDesigner.updateElementProperty('borderRadius', parseInt(this.value))">
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
        
        if (property === 'x' || property === 'y' || property === 'width' || property === 'height') {
            this.selectedElement[property] = value;
        } else {
            this.selectedElement.properties[property] = value;
            
            // Update text display for field elements
            if (property === 'fieldType' && this.selectedElement.type === 'field') {
                this.selectedElement.properties.text = `{${value}}`;
            }
        }
        
        this.updateCanvas();
        this.saveToHistory();
    }

    deleteElement() {
        if (!this.selectedElement) return;
        
        const index = this.elements.indexOf(this.selectedElement);
        if (index > -1) {
            this.elements.splice(index, 1);
            this.clearSelection();
            this.updateCanvas();
            this.saveToHistory();
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
