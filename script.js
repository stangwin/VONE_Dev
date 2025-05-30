// CRM Application
class CRMApp {
    constructor() {
        this.db = new Database();
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
        
        listContainer.innerHTML = this.customers.map(customer => `
            <div class="customer-card" onclick="app.showCustomerDetail('${customer.id}')">
                <h3>${this.escapeHtml(customer.companyName)}</h3>
                <span class="status-badge ${this.getStatusClass(customer.status)}">${customer.status}</span>
            </div>
        `).join('');
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
}

// Initialize the app when the page loads
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new CRMApp();
});
