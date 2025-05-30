// Simple Database Implementation for CRM
class SimpleDB {
    constructor() {
        this.storageKey = 'crm_data';
    }

    async get(key) {
        const data = this.getAllData();
        return data[key] || null;
    }

    async set(key, value) {
        const data = this.getAllData();
        data[key] = value;
        localStorage.setItem(this.storageKey, JSON.stringify(data));
        return true;
    }

    async list(prefix = '') {
        const data = this.getAllData();
        return Object.keys(data).filter(key => key.startsWith(prefix));
    }

    getAllData() {
        try {
            return JSON.parse(localStorage.getItem(this.storageKey) || '{}');
        } catch {
            return {};
        }
    }
}

// CRM Application
class CRMApp {
    constructor() {
        this.db = new SimpleDB();
        this.customers = [];
        this.currentCustomer = null;
        this.currentCustomerId = null;
        this.nextCustomerId = 1;
        
        this.init();
    }

    async init() {
        try {
            await this.loadCustomers();
            this.bindEvents();
            this.showView('dashboard');
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showError('dashboard-error', 'Failed to load application data.');
        }
    }

    bindEvents() {
        // Navigation
        document.getElementById('dashboard-btn').addEventListener('click', () => this.showView('dashboard'));
        document.getElementById('add-customer-btn').addEventListener('click', () => this.showAddCustomerForm());
        document.getElementById('add-first-customer').addEventListener('click', (e) => {
            e.preventDefault();
            this.showAddCustomerForm();
        });

        // Form events
        document.getElementById('customer-form').addEventListener('submit', (e) => this.handleSaveCustomer(e));
        document.getElementById('back-btn').addEventListener('click', () => this.showView('dashboard'));
        document.getElementById('cancel-btn').addEventListener('click', () => this.showView('dashboard'));

        // Detail view events
        document.getElementById('edit-customer-btn').addEventListener('click', () => this.editCurrentCustomer());
        document.getElementById('delete-customer-btn').addEventListener('click', () => this.deleteCurrentCustomer());
        document.getElementById('back-to-dashboard-btn').addEventListener('click', () => this.showView('dashboard'));

        // Notes
        document.getElementById('note-form').addEventListener('submit', (e) => this.handleAddNote(e));

        // Real-time duplicate checking
        document.getElementById('company-name').addEventListener('input', () => this.checkDuplicates());
        document.getElementById('primary-email').addEventListener('input', () => this.checkDuplicates());
        document.getElementById('primary-phone').addEventListener('input', () => this.checkDuplicates());

        // Auto-fill functionality
        document.getElementById('paste-note-email').addEventListener('input', (e) => this.handlePasteTextChange(e));
        document.getElementById('auto-fill-btn').addEventListener('click', () => this.autoFillForm());
        document.getElementById('clear-paste-btn').addEventListener('click', () => this.clearPasteText());

        // Smart contact duplication
        document.getElementById('signer-same-as-primary').addEventListener('change', (e) => this.handleSignerSameAsPrimary(e));
        document.getElementById('billing-same-as-primary').addEventListener('change', (e) => this.handleBillingSameAsPrimary(e));

        // Primary contact field changes should update copied fields
        document.getElementById('primary-name').addEventListener('input', () => this.updateCopiedFields());
        document.getElementById('primary-email').addEventListener('input', () => this.updateCopiedFields());
        document.getElementById('primary-phone').addEventListener('input', () => this.updateCopiedFields());
    }

    async loadCustomers() {
        try {
            document.getElementById('dashboard-loading').style.display = 'block';
            
            // Get all customer keys
            const keys = await this.db.list('customer_');
            this.customers = [];

            // Load each customer
            for (const key of keys) {
                try {
                    const customer = await this.db.get(key);
                    if (customer) {
                        this.customers.push({ id: key, ...customer });
                        
                        // Update next customer ID
                        const numericId = parseInt(key.replace('customer_', ''));
                        if (numericId >= this.nextCustomerId) {
                            this.nextCustomerId = numericId + 1;
                        }
                    }
                } catch (error) {
                    console.error(`Failed to load customer ${key}:`, error);
                }
            }

            this.renderCustomerList();
        } catch (error) {
            console.error('Failed to load customers:', error);
            this.showError('dashboard-error', 'Failed to load customers from database.');
        } finally {
            document.getElementById('dashboard-loading').style.display = 'none';
        }
    }

    renderCustomerList() {
        const listContainer = document.getElementById('customer-list');
        const emptyState = document.getElementById('empty-state');

        if (this.customers.length === 0) {
            listContainer.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        
        listContainer.innerHTML = this.customers.map(customer => {
            const primaryContactName = customer.primaryContact?.name || 'No primary contact';
            const { noteText, noteTimestamp } = this.getLatestNoteInfo(customer.notes);
            
            return `
                <div class="customer-card" onclick="app.showCustomerDetail('${customer.id}')">
                    <div class="customer-card-header">
                        <h3>${this.escapeHtml(customer.companyName)}</h3>
                        <span class="status-badge ${this.getStatusClass(customer.status)}">${customer.status}</span>
                    </div>
                    <div class="customer-card-details">
                        <div class="contact-info">
                            <strong>Primary Contact:</strong> ${this.escapeHtml(primaryContactName)}
                        </div>
                        <div class="latest-note">
                            <strong>Latest Note:</strong> ${noteText}
                            ${noteTimestamp ? `<span class="note-timestamp">${noteTimestamp}</span>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    getLatestNoteInfo(notes) {
        if (!notes || notes.length === 0) {
            return { noteText: 'No notes yet.', noteTimestamp: null };
        }

        // Sort notes by timestamp, newest first
        const sortedNotes = [...notes].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        const latestNote = sortedNotes[0];
        
        // Truncate note text if too long
        const maxLength = 100;
        let noteText = latestNote.content;
        if (noteText.length > maxLength) {
            noteText = noteText.substring(0, maxLength) + '...';
        }

        // Format timestamp
        const noteDate = new Date(latestNote.timestamp);
        const noteTimestamp = noteDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }) + ' @ ' + noteDate.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });

        return { noteText: this.escapeHtml(noteText), noteTimestamp };
    }

    getStatusClass(status) {
        return 'status-' + status.toLowerCase().replace(/\s+/g, '-');
    }

    showView(viewName) {
        // Hide all views
        document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
        
        // Show selected view
        document.getElementById(`${viewName}-view`).classList.add('active');
        
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        if (viewName === 'dashboard') {
            document.getElementById('dashboard-btn').classList.add('active');
        }
        
        // Clear any errors
        this.clearErrors();
    }

    showAddCustomerForm() {
        this.currentCustomer = null;
        this.currentCustomerId = null;
        document.getElementById('form-title').textContent = 'Add Customer';
        document.getElementById('customer-form').reset();
        this.clearDuplicateWarning();
        this.clearPasteText();
        this.clearContactDuplicationCheckboxes();
        document.getElementById('auto-fill-section').style.display = 'block';
        this.showView('customer-form');
    }

    async showCustomerDetail(customerId) {
        try {
            const customer = this.customers.find(c => c.id === customerId);
            if (!customer) {
                this.showError('dashboard-error', 'Customer not found.');
                return;
            }

            this.currentCustomer = customer;
            this.currentCustomerId = customerId;

            // Populate customer details
            document.getElementById('detail-company-name').textContent = customer.companyName;
            
            const detailsContainer = document.getElementById('customer-details');
            detailsContainer.innerHTML = `
                <div class="detail-section">
                    <h4>Basic Information</h4>
                    <div class="detail-field"><strong>Company Name:</strong> ${this.escapeHtml(customer.companyName)}</div>
                    <div class="detail-field"><strong>Status:</strong> <span class="status-badge ${this.getStatusClass(customer.status)}">${customer.status}</span></div>
                </div>
                
                <div class="detail-section">
                    <h4>Addresses</h4>
                    <div class="detail-field"><strong>Physical Address:</strong><br>${this.escapeHtml(customer.physicalAddress) || 'Not provided'}</div>
                    <div class="detail-field"><strong>Billing Address:</strong><br>${this.escapeHtml(customer.billingAddress) || 'Not provided'}</div>
                </div>
                
                <div class="detail-section">
                    <h4>Primary Contact</h4>
                    <div class="detail-field"><strong>Name:</strong> ${this.escapeHtml(customer.primaryContact?.name) || 'Not provided'}</div>
                    <div class="detail-field"><strong>Email:</strong> ${this.escapeHtml(customer.primaryContact?.email) || 'Not provided'}</div>
                    <div class="detail-field"><strong>Phone:</strong> ${this.escapeHtml(customer.primaryContact?.phone) || 'Not provided'}</div>
                </div>
                
                <div class="detail-section">
                    <h4>Authorized Signer</h4>
                    <div class="detail-field"><strong>Name:</strong> ${this.escapeHtml(customer.authorizedSigner?.name) || 'Not provided'}</div>
                    <div class="detail-field"><strong>Email:</strong> ${this.escapeHtml(customer.authorizedSigner?.email) || 'Not provided'}</div>
                    <div class="detail-field"><strong>Phone:</strong> ${this.escapeHtml(customer.authorizedSigner?.phone) || 'Not provided'}</div>
                </div>
                
                <div class="detail-section">
                    <h4>Billing Contact</h4>
                    <div class="detail-field"><strong>Name:</strong> ${this.escapeHtml(customer.billingContact?.name) || 'Not provided'}</div>
                    <div class="detail-field"><strong>Email:</strong> ${this.escapeHtml(customer.billingContact?.email) || 'Not provided'}</div>
                    <div class="detail-field"><strong>Phone:</strong> ${this.escapeHtml(customer.billingContact?.phone) || 'Not provided'}</div>
                </div>
                
                ${customer.pasteText ? `
                <div class="detail-section">
                    <h4>Additional Text</h4>
                    <div style="background: hsl(var(--background)); padding: 1rem; border-radius: 4px; white-space: pre-wrap; word-wrap: break-word;">${this.escapeHtml(customer.pasteText)}</div>
                </div>
                ` : ''}
            `;

            this.renderNotes(customer.notes || []);
            this.showView('customer-detail');
        } catch (error) {
            console.error('Failed to show customer detail:', error);
            this.showError('dashboard-error', 'Failed to load customer details.');
        }
    }

    renderNotes(notes) {
        const notesList = document.getElementById('notes-list');
        
        if (!notes || notes.length === 0) {
            notesList.innerHTML = '<p style="color: hsl(var(--text-secondary)); text-align: center; padding: 2rem;">No notes yet.</p>';
            return;
        }

        // Sort notes by timestamp, newest first
        const sortedNotes = [...notes].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        notesList.innerHTML = sortedNotes.map(note => `
            <div class="note-item">
                <div class="note-header">
                    ${new Date(note.timestamp).toLocaleString()}
                </div>
                <div class="note-content">${this.escapeHtml(note.content)}</div>
            </div>
        `).join('');
    }

    editCurrentCustomer() {
        if (!this.currentCustomer) return;

        document.getElementById('form-title').textContent = 'Edit Customer';
        this.populateForm(this.currentCustomer);
        document.getElementById('auto-fill-section').style.display = 'none';
        this.showView('customer-form');
    }

    populateForm(customer) {
        document.getElementById('company-name').value = customer.companyName || '';
        document.getElementById('status').value = customer.status || 'Lead';
        document.getElementById('physical-address').value = customer.physicalAddress || '';
        document.getElementById('billing-address').value = customer.billingAddress || '';
        
        document.getElementById('primary-name').value = customer.primaryContact?.name || '';
        document.getElementById('primary-email').value = customer.primaryContact?.email || '';
        document.getElementById('primary-phone').value = customer.primaryContact?.phone || '';
        
        document.getElementById('signer-name').value = customer.authorizedSigner?.name || '';
        document.getElementById('signer-email').value = customer.authorizedSigner?.email || '';
        document.getElementById('signer-phone').value = customer.authorizedSigner?.phone || '';
        
        document.getElementById('billing-name').value = customer.billingContact?.name || '';
        document.getElementById('billing-email').value = customer.billingContact?.email || '';
        document.getElementById('billing-phone').value = customer.billingContact?.phone || '';
        
        document.getElementById('paste-text').value = customer.pasteText || '';
    }

    async handleSaveCustomer(e) {
        e.preventDefault();
        
        try {
            const formData = new FormData(e.target);
            const customerData = this.extractCustomerData(formData);
            
            // Validate required fields
            if (!customerData.companyName.trim()) {
                this.showError('dashboard-error', 'Company name is required.');
                return;
            }

            // Check for duplicates before saving
            const duplicates = this.checkDuplicatesBeforeSave(customerData);
            if (duplicates.length > 0) {
                this.showDuplicateWarning(duplicates);
                return;
            }

            const customerId = this.currentCustomerId || `customer_${this.nextCustomerId.toString().padStart(3, '0')}`;
            
            // Preserve existing notes when editing
            if (this.currentCustomer && this.currentCustomer.notes) {
                customerData.notes = this.currentCustomer.notes;
            }

            customerData.createdAt = this.currentCustomer?.createdAt || new Date().toISOString();
            customerData.updatedAt = new Date().toISOString();

            await this.db.set(customerId, customerData);
            
            if (!this.currentCustomerId) {
                this.nextCustomerId++;
            }

            await this.loadCustomers();
            this.showView('dashboard');
            
        } catch (error) {
            console.error('Failed to save customer:', error);
            this.showError('dashboard-error', 'Failed to save customer to database.');
        }
    }

    extractCustomerData(formData) {
        return {
            companyName: formData.get('companyName'),
            status: formData.get('status'),
            physicalAddress: formData.get('physicalAddress'),
            billingAddress: formData.get('billingAddress'),
            primaryContact: {
                name: formData.get('primaryContact.name'),
                email: formData.get('primaryContact.email'),
                phone: formData.get('primaryContact.phone')
            },
            authorizedSigner: {
                name: formData.get('authorizedSigner.name'),
                email: formData.get('authorizedSigner.email'),
                phone: formData.get('authorizedSigner.phone')
            },
            billingContact: {
                name: formData.get('billingContact.name'),
                email: formData.get('billingContact.email'),
                phone: formData.get('billingContact.phone')
            },
            pasteText: formData.get('pasteText')
        };
    }

    checkDuplicates() {
        const companyName = document.getElementById('company-name').value.trim();
        const primaryEmail = document.getElementById('primary-email').value.trim();
        const primaryPhone = document.getElementById('primary-phone').value.trim();

        if (!companyName && !primaryEmail && !primaryPhone) {
            this.clearDuplicateWarning();
            return;
        }

        const duplicates = [];

        for (const customer of this.customers) {
            // Skip current customer when editing
            if (this.currentCustomerId && customer.id === this.currentCustomerId) {
                continue;
            }

            if (companyName && customer.companyName.toLowerCase() === companyName.toLowerCase()) {
                duplicates.push(`Company name "${companyName}" already exists`);
                break;
            }

            if (primaryEmail && customer.primaryContact?.email?.toLowerCase() === primaryEmail.toLowerCase()) {
                duplicates.push(`Email "${primaryEmail}" already exists`);
                break;
            }

            if (primaryPhone && customer.primaryContact?.phone === primaryPhone) {
                duplicates.push(`Phone "${primaryPhone}" already exists`);
                break;
            }
        }

        if (duplicates.length > 0) {
            this.showDuplicateWarning(duplicates);
        } else {
            this.clearDuplicateWarning();
        }
    }

    checkDuplicatesBeforeSave(customerData) {
        const duplicates = [];

        for (const customer of this.customers) {
            // Skip current customer when editing
            if (this.currentCustomerId && customer.id === this.currentCustomerId) {
                continue;
            }

            if (customerData.companyName && customer.companyName.toLowerCase() === customerData.companyName.toLowerCase()) {
                duplicates.push(`Company name "${customerData.companyName}" already exists`);
            }

            if (customerData.primaryContact?.email && customer.primaryContact?.email?.toLowerCase() === customerData.primaryContact.email.toLowerCase()) {
                duplicates.push(`Email "${customerData.primaryContact.email}" already exists`);
            }

            if (customerData.primaryContact?.phone && customer.primaryContact?.phone === customerData.primaryContact.phone) {
                duplicates.push(`Phone "${customerData.primaryContact.phone}" already exists`);
            }
        }

        return duplicates;
    }

    showDuplicateWarning(duplicates) {
        const warningDiv = document.getElementById('duplicate-warning');
        const messageSpan = document.getElementById('duplicate-message');
        messageSpan.textContent = duplicates.join(', ');
        warningDiv.style.display = 'block';
    }

    clearDuplicateWarning() {
        document.getElementById('duplicate-warning').style.display = 'none';
    }

    async deleteCurrentCustomer() {
        if (!this.currentCustomerId || !confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
            return;
        }

        try {
            await this.db.delete(this.currentCustomerId);
            await this.loadCustomers();
            this.showView('dashboard');
        } catch (error) {
            console.error('Failed to delete customer:', error);
            this.showError('dashboard-error', 'Failed to delete customer from database.');
        }
    }

    async handleAddNote(e) {
        e.preventDefault();
        
        const noteContent = document.getElementById('new-note').value.trim();
        if (!noteContent) return;

        try {
            const note = {
                content: noteContent,
                timestamp: new Date().toISOString()
            };

            if (!this.currentCustomer.notes) {
                this.currentCustomer.notes = [];
            }

            this.currentCustomer.notes.push(note);
            this.currentCustomer.updatedAt = new Date().toISOString();

            await this.db.set(this.currentCustomerId, this.currentCustomer);
            
            // Update local data
            const customerIndex = this.customers.findIndex(c => c.id === this.currentCustomerId);
            if (customerIndex !== -1) {
                this.customers[customerIndex] = { ...this.currentCustomer };
            }

            this.renderNotes(this.currentCustomer.notes);
            document.getElementById('new-note').value = '';
            
        } catch (error) {
            console.error('Failed to add note:', error);
            this.showError('dashboard-error', 'Failed to save note to database.');
        }
    }

    showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }

    clearErrors() {
        document.querySelectorAll('.error-message').forEach(error => {
            error.style.display = 'none';
        });
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Auto-fill functionality
    handlePasteTextChange(e) {
        const text = e.target.value.trim();
        const autoFillBtn = document.getElementById('auto-fill-btn');
        autoFillBtn.disabled = text.length === 0;
    }

    clearPasteText() {
        document.getElementById('paste-note-email').value = '';
        document.getElementById('auto-fill-btn').disabled = true;
    }

    autoFillForm() {
        const text = document.getElementById('paste-note-email').value;
        if (!text.trim()) return;

        const extractedData = this.parseTextForCustomerData(text);
        this.populateFormFromExtractedData(extractedData);
    }

    /*
     * FUTURE ENHANCEMENT: OpenAI API Integration
     * 
     * To upgrade this text parsing with AI, replace the parseTextForCustomerData method
     * with an OpenAI API call. Here's how:
     * 
     * 1. Add OpenAI API key to environment variables
     * 2. Create a prompt that asks GPT to extract customer data from the text
     * 3. Structure the prompt to return JSON with the expected fields
     * 4. Example implementation:
     * 
     * async parseTextWithAI(text) {
     *   const response = await fetch('https://api.openai.com/v1/chat/completions', {
     *     method: 'POST',
     *     headers: {
     *       'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
     *       'Content-Type': 'application/json'
     *     },
     *     body: JSON.stringify({
     *       model: 'gpt-3.5-turbo',
     *       messages: [{
     *         role: 'user',
     *         content: `Extract customer information from this text and return as JSON: ${text}`
     *       }]
     *     })
     *   });
     *   return await response.json();
     * }
     */

    parseTextForCustomerData(text) {
        const data = {
            companyName: '',
            physicalAddress: '',
            billingAddress: '',
            primaryContact: { name: '', email: '', phone: '' },
            authorizedSigner: { name: '', email: '', phone: '' },
            billingContact: { name: '', email: '', phone: '' }
        };

        // Extract emails (basic pattern)
        const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
        const emails = text.match(emailRegex) || [];

        // Extract phone numbers (US format variations)
        const phoneRegex = /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
        const phones = [];
        let phoneMatch;
        while ((phoneMatch = phoneRegex.exec(text)) !== null) {
            phones.push(phoneMatch[0].trim());
        }

        // Extract company name (look for common patterns)
        const companyPatterns = [
            /(?:company|corp|corporation|inc|llc|ltd|limited)[\s:]+([^\n\r.]+)/i,
            /([A-Z][a-zA-Z\s&]+(?:Inc|LLC|Corp|Corporation|Company|Ltd|Limited))/,
            /company[\s:]+([^\n\r]+)/i,
            /from[\s:]+([A-Z][a-zA-Z\s&]+)/i
        ];

        for (const pattern of companyPatterns) {
            const match = text.match(pattern);
            if (match) {
                data.companyName = match[1].trim();
                break;
            }
        }

        // Extract addresses (look for multi-line patterns with city, state, zip)
        const addressRegex = /([0-9]+[\s\w]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Way|Place|Pl)[^\n]*[\n\r]*[A-Za-z\s]+,\s*[A-Z]{2}\s*[0-9]{5}(?:-[0-9]{4})?)/gi;
        const addresses = text.match(addressRegex) || [];

        if (addresses.length > 0) {
            data.physicalAddress = addresses[0].trim();
            if (addresses.length > 1) {
                data.billingAddress = addresses[1].trim();
            }
        }

        // Extract names (look for patterns like "Name:", "Contact:", etc.)
        const namePatterns = [
            /(?:contact|name|from)[\s:]+([A-Z][a-z]+\s+[A-Z][a-z]+)/i,
            /([A-Z][a-z]+\s+[A-Z][a-z]+)[\s,]*<[^>]+@/,
            /([A-Z][a-z]+\s+[A-Z][a-z]+)[\s,]*\(?[0-9]/
        ];

        for (const pattern of namePatterns) {
            const match = text.match(pattern);
            if (match) {
                data.primaryContact.name = match[1].trim();
                break;
            }
        }

        // Assign first email and phone to primary contact
        if (emails.length > 0) {
            data.primaryContact.email = emails[0];
        }
        if (phones.length > 0) {
            data.primaryContact.phone = phones[0];
        }

        // If we have multiple emails/phones, distribute them
        if (emails.length > 1) {
            data.authorizedSigner.email = emails[1];
        }
        if (emails.length > 2) {
            data.billingContact.email = emails[2];
        }

        if (phones.length > 1) {
            data.authorizedSigner.phone = phones[1];
        }
        if (phones.length > 2) {
            data.billingContact.phone = phones[2];
        }

        return data;
    }

    populateFormFromExtractedData(data) {
        // Only populate if we found something
        if (data.companyName) {
            document.getElementById('company-name').value = data.companyName;
        }
        if (data.physicalAddress) {
            document.getElementById('physical-address').value = data.physicalAddress;
        }
        if (data.billingAddress) {
            document.getElementById('billing-address').value = data.billingAddress;
        }

        // Primary Contact
        if (data.primaryContact.name) {
            document.getElementById('primary-name').value = data.primaryContact.name;
        }
        if (data.primaryContact.email) {
            document.getElementById('primary-email').value = data.primaryContact.email;
        }
        if (data.primaryContact.phone) {
            document.getElementById('primary-phone').value = data.primaryContact.phone;
        }

        // Authorized Signer
        if (data.authorizedSigner.name) {
            document.getElementById('signer-name').value = data.authorizedSigner.name;
        }
        if (data.authorizedSigner.email) {
            document.getElementById('signer-email').value = data.authorizedSigner.email;
        }
        if (data.authorizedSigner.phone) {
            document.getElementById('signer-phone').value = data.authorizedSigner.phone;
        }

        // Billing Contact
        if (data.billingContact.name) {
            document.getElementById('billing-name').value = data.billingContact.name;
        }
        if (data.billingContact.email) {
            document.getElementById('billing-email').value = data.billingContact.email;
        }
        if (data.billingContact.phone) {
            document.getElementById('billing-phone').value = data.billingContact.phone;
        }

        // Trigger duplicate checking after auto-fill
        this.checkDuplicates();
    }

    // Smart contact duplication functionality
    handleSignerSameAsPrimary(e) {
        const isChecked = e.target.checked;
        const signerFields = ['signer-name', 'signer-email', 'signer-phone'];
        
        if (isChecked) {
            this.copyPrimaryContactToFields(signerFields);
            this.setFieldsReadOnly(signerFields, true);
        } else {
            this.clearFields(signerFields);
            this.setFieldsReadOnly(signerFields, false);
        }
    }

    handleBillingSameAsPrimary(e) {
        const isChecked = e.target.checked;
        const billingFields = ['billing-name', 'billing-email', 'billing-phone'];
        
        if (isChecked) {
            this.copyPrimaryContactToFields(billingFields);
            this.setFieldsReadOnly(billingFields, true);
        } else {
            this.clearFields(billingFields);
            this.setFieldsReadOnly(billingFields, false);
        }
    }

    copyPrimaryContactToFields(targetFields) {
        const primaryName = document.getElementById('primary-name').value;
        const primaryEmail = document.getElementById('primary-email').value;
        const primaryPhone = document.getElementById('primary-phone').value;

        if (targetFields.includes('signer-name') || targetFields.includes('billing-name')) {
            const nameField = targetFields.find(field => field.includes('name'));
            if (nameField) document.getElementById(nameField).value = primaryName;
        }
        
        if (targetFields.includes('signer-email') || targetFields.includes('billing-email')) {
            const emailField = targetFields.find(field => field.includes('email'));
            if (emailField) document.getElementById(emailField).value = primaryEmail;
        }
        
        if (targetFields.includes('signer-phone') || targetFields.includes('billing-phone')) {
            const phoneField = targetFields.find(field => field.includes('phone'));
            if (phoneField) document.getElementById(phoneField).value = primaryPhone;
        }
    }

    setFieldsReadOnly(fieldIds, isReadOnly) {
        fieldIds.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            field.readOnly = isReadOnly;
            if (isReadOnly) {
                field.style.backgroundColor = 'hsl(var(--secondary))';
                field.style.color = 'hsl(var(--text-secondary))';
            } else {
                field.style.backgroundColor = '';
                field.style.color = '';
            }
        });
    }

    clearFields(fieldIds) {
        fieldIds.forEach(fieldId => {
            document.getElementById(fieldId).value = '';
        });
    }

    updateCopiedFields() {
        // Update signer fields if checkbox is checked
        if (document.getElementById('signer-same-as-primary').checked) {
            const signerFields = ['signer-name', 'signer-email', 'signer-phone'];
            this.copyPrimaryContactToFields(signerFields);
        }

        // Update billing fields if checkbox is checked
        if (document.getElementById('billing-same-as-primary').checked) {
            const billingFields = ['billing-name', 'billing-email', 'billing-phone'];
            this.copyPrimaryContactToFields(billingFields);
        }
    }

    clearContactDuplicationCheckboxes() {
        // Uncheck checkboxes
        document.getElementById('signer-same-as-primary').checked = false;
        document.getElementById('billing-same-as-primary').checked = false;
        
        // Reset field states
        const allFields = ['signer-name', 'signer-email', 'signer-phone', 'billing-name', 'billing-email', 'billing-phone'];
        this.setFieldsReadOnly(allFields, false);
    }
}

// Initialize the app when the page loads
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new CRMApp();
});
