// Database API client
class DatabaseAPI {
    constructor() {
        this.baseURL = '/api';
    }

    async getCustomers() {
        try {
            const response = await fetch(`${this.baseURL}/customers`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching customers:', error);
            throw error;
        }
    }

    async getCustomer(customerId) {
        try {
            const response = await fetch(`${this.baseURL}/customers/${customerId}`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching customer:', error);
            throw error;
        }
    }

    async createCustomer(customerData) {
        try {
            const response = await fetch(`${this.baseURL}/customers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(customerData)
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('Error creating customer:', error);
            throw error;
        }
    }

    async updateCustomer(customerId, updates) {
        try {
            const response = await fetch(`${this.baseURL}/customers/${customerId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('Error updating customer:', error);
            throw error;
        }
    }

    async deleteCustomer(customerId) {
        try {
            const response = await fetch(`${this.baseURL}/customers/${customerId}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('Error deleting customer:', error);
            throw error;
        }
    }
}

// CRM Application
class CRMApp {
    constructor() {
        this.api = new DatabaseAPI();
        this.customers = [];
        this.currentCustomer = null;
        this.currentCustomerId = null;

        this.init();
    }

    getNextCustomerId() {
        const existingKeys = Object.keys(localStorage).filter(key => key.startsWith('customer_'));
        if (existingKeys.length === 0) return 1;
        
        const highestId = Math.max(...existingKeys.map(key => {
            const idPart = key.replace('customer_', '');
            return parseInt(idPart) || 0;
        }));
        
        return highestId + 1;
    }

    generateCustomerId() {
        const id = `customer_${this.nextCustomerId.toString().padStart(3, '0')}`;
        this.nextCustomerId++;
        return id;
    }

    async init() {
        try {
            console.log('Initializing CRM...');
            await this.loadCustomers();
            this.bindEvents();
            this.showView("dashboard");
        } catch (error) {
            console.error("Failed to initialize app:", error);
            this.showError(
                "dashboard-error",
                "Failed to load application data.",
            );
        }
    }

    bindEvents() {
        // Navigation
        document
            .getElementById("dashboard-btn")
            .addEventListener("click", () => this.showView("dashboard"));
        document
            .getElementById("add-customer-btn")
            .addEventListener("click", () => this.showAddCustomerForm());
        const importBtn = document.getElementById("import-btn");
        if (importBtn) {
            importBtn.addEventListener("click", () => this.showImportView());
        }
        document
            .getElementById("add-first-customer")
            .addEventListener("click", (e) => {
                e.preventDefault();
                this.showAddCustomerForm();
            });
        
        // Initialize data import automatically if no customers exist
        this.checkAndAutoImport();

        // Form events
        document
            .getElementById("customer-form")
            .addEventListener("submit", (e) => this.handleSaveCustomer(e));
        document
            .getElementById("back-btn")
            .addEventListener("click", () => this.showView("dashboard"));
        document
            .getElementById("cancel-btn")
            .addEventListener("click", () => this.showView("dashboard"));
        const backToDashboardFromImport = document.getElementById("back-to-dashboard-from-import");
        if (backToDashboardFromImport) {
            backToDashboardFromImport.addEventListener("click", () => this.showView("dashboard"));
        }

        // Detail view events
        document
            .getElementById("edit-customer-btn")
            .addEventListener("click", () => this.editCurrentCustomer());
        document
            .getElementById("delete-customer-btn")
            .addEventListener("click", () => this.deleteCurrentCustomer());
        document
            .getElementById("back-to-dashboard-btn")
            .addEventListener("click", () => this.showView("dashboard"));

        // Notes
        document
            .getElementById("note-form")
            .addEventListener("submit", (e) => this.handleAddNote(e));

        // Real-time duplicate checking
        document
            .getElementById("company-name")
            .addEventListener("input", () => this.checkDuplicates());
        document
            .getElementById("primary-email")
            .addEventListener("input", () => this.checkDuplicates());
        document
            .getElementById("primary-phone")
            .addEventListener("input", () => this.checkDuplicates());

        // Auto-fill functionality - check if elements exist
        const pasteTextArea = document.getElementById("paste-note-email");
        const autoFillBtn = document.getElementById("auto-fill-btn");
        const clearPasteBtn = document.getElementById("clear-paste-btn");
        
        if (pasteTextArea) {
            pasteTextArea.addEventListener("input", (e) => this.handlePasteTextChange(e));
        }
        if (autoFillBtn) {
            autoFillBtn.addEventListener("click", () => this.autoFillForm());
        }
        if (clearPasteBtn) {
            clearPasteBtn.addEventListener("click", () => this.clearPasteText());
        }

        // Smart contact duplication
        document
            .getElementById("signer-same-as-primary")
            .addEventListener("change", (e) =>
                this.handleSignerSameAsPrimary(e),
            );
        document
            .getElementById("billing-same-as-primary")
            .addEventListener("change", (e) =>
                this.handleBillingSameAsPrimary(e),
            );

        // Primary contact field changes should update copied fields
        document
            .getElementById("primary-name")
            .addEventListener("input", () => this.updateCopiedFields());
        document
            .getElementById("primary-email")
            .addEventListener("input", () => this.updateCopiedFields());
        document
            .getElementById("primary-phone")
            .addEventListener("input", () => this.updateCopiedFields());

        // CSV Import functionality - check if elements exist before binding
        const csvFileInput = document.getElementById('csv-file');
        const previewCsvBtn = document.getElementById('preview-csv');
        const importDataBtn = document.getElementById('import-data');
        const cancelImportBtn = document.getElementById('cancel-import');
        const viewImportedBtn = document.getElementById('view-imported-data');
        
        if (csvFileInput) csvFileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        if (previewCsvBtn) previewCsvBtn.addEventListener('click', () => this.previewCSV());
        if (importDataBtn) importDataBtn.addEventListener('click', () => this.importCSVData());
        if (cancelImportBtn) cancelImportBtn.addEventListener('click', () => this.cancelImport());
        if (viewImportedBtn) viewImportedBtn.addEventListener('click', () => this.showView('dashboard'));
    }

    async loadCustomers() {
        try {
            console.log('Loading customers from database...');
            
            const loadingElement = document.getElementById("dashboard-loading");
            if (loadingElement) loadingElement.style.display = "block";
            
            // Test API connection first
            const response = await fetch('/api/customers');
            console.log('API response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`API returned ${response.status}`);
            }
            
            this.customers = await response.json();
            console.log(`Loaded ${this.customers.length} customers from PostgreSQL`);
            console.log('Sample customer:', this.customers[0]);
            
            this.renderCustomerList();
            
        } catch (error) {
            console.error("Failed to load customers:", error);
            console.error("Error details:", error.message);
            this.showError(
                "dashboard-error",
                `Failed to load customers: ${error.message}`,
            );
        } finally {
            const loadingElement = document.getElementById("dashboard-loading");
            if (loadingElement) loadingElement.style.display = "none";
        }
    }

    renderCustomerList() {
        const listContainer = document.getElementById("customer-list");
        const emptyState = document.getElementById("empty-state");

        if (this.customers.length === 0) {
            listContainer.innerHTML = "";
            emptyState.style.display = "block";
            return;
        }

        emptyState.style.display = "none";

        try {
            const customerHTML = this.customers.map(customer => {
                const primaryContactName = customer.primary_contact?.name || 'No primary contact';
                const { noteText, noteTimestamp } = this.getLatestNoteInfo(customer.notes || []);

                return `
                    <div class="customer-card" onclick="app.showCustomerDetail('${customer.customer_id}')">
                        <div class="customer-header">
                            <h3 class="customer-name">${this.escapeHtml(customer.company_name)}</h3>
                            <span class="status-badge ${this.getStatusClass(customer.status)}">${customer.status}</span>
                        </div>
                        <div class="customer-info">
                            <div class="info-row">
                                <span class="label">Contact:</span>
                                <span>${this.escapeHtml(primaryContactName)}</span>
                            </div>
                            <div class="info-row">
                                <span class="label">Affiliate:</span>
                                <span>${this.escapeHtml(customer.affiliate_partner || 'None')}</span>
                            </div>
                            <div class="info-row">
                                <span class="label">Next Step:</span>
                                <span>${this.escapeHtml(customer.next_step || 'None')}</span>
                            </div>
                            ${noteText ? `
                                <div class="info-row latest-note">
                                    <span class="label">Latest Note:</span>
                                    <span class="note-preview">${this.escapeHtml(noteText)}</span>
                                    ${noteTimestamp ? `<small class="note-date">${new Date(noteTimestamp).toLocaleDateString()}</small>` : ''}
                                </div>
                            ` : ''}
                        </div>
                        <div class="customer-actions">
                            <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); app.showCustomerDetail('${customer.customer_id}')">View Details</button>
                            <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); app.createInQBO('${customer.customer_id}')">Create in QBO</button>
                            <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); app.sendAgreement('${customer.customer_id}')">Send Agreement</button>
                        </div>
                    </div>
                `;
            }).join('');

            listContainer.innerHTML = customerHTML;
            console.log(`Rendered ${this.customers.length} customers to the dashboard`);
                                <span>Agreement</span>
                            </button>
                        </div>
                    </div>
                    
                    <div class="customer-card-body">
                        <div class="card-row">
                            <div class="field-group">
                                <label>Primary Contact</label>
    
        } catch (error) {
            console.error('Error rendering customer list:', error);
            listContainer.innerHTML = '<p>Error loading customers. Please refresh the page.</p>';
        }
    }

    getLatestNoteInfo(notes) {
        if (!notes || notes.length === 0) {
            return { noteText: "No notes yet.", noteTimestamp: null };
        }

        // Sort notes by timestamp, newest first
        const sortedNotes = [...notes].sort(
            (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
        );
        const latestNote = sortedNotes[0];

        // Truncate note text if too long
        const maxLength = 100;
        let noteText = latestNote.content;
        if (noteText.length > maxLength) {
            noteText = noteText.substring(0, maxLength) + "...";
        }

        // Format timestamp
        const noteDate = new Date(latestNote.timestamp);
        const noteTimestamp =
            noteDate.toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
            }) +
            " @ " +
            noteDate.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
            });

        return { noteText: this.escapeHtml(noteText), noteTimestamp };
    }

    getStatusClass(status) {
        return "status-" + status.toLowerCase().replace(/\s+/g, "-");
    }

    showView(viewName) {
        // Hide all views
        document
            .querySelectorAll(".view")
            .forEach((view) => view.classList.remove("active"));

        // Show selected view
        document.getElementById(`${viewName}-view`).classList.add("active");

        // Update navigation
        document
            .querySelectorAll(".nav-btn")
            .forEach((btn) => btn.classList.remove("active"));
        if (viewName === "dashboard") {
            document.getElementById("dashboard-btn").classList.add("active");
        }

        // Clear any errors
        this.clearErrors();
    }

    showAddCustomerForm() {
        this.currentCustomer = null;
        this.currentCustomerId = null;
        document.getElementById("form-title").textContent = "Add Customer";
        document.getElementById("customer-form").reset();
        this.clearDuplicateWarning();
        this.clearPasteText();
        this.clearContactDuplicationCheckboxes();
        document.getElementById("auto-fill-section").style.display = "block";
        this.showView("customer-form");
    }

    async showCustomerDetail(customerId) {
        try {
            const customer = this.customers.find((c) => c.id === customerId);
            if (!customer) {
                this.showError("dashboard-error", "Customer not found.");
                return;
            }

            this.currentCustomer = customer;
            this.currentCustomerId = customerId;

            // Populate customer details
            document.getElementById("detail-company-name").textContent =
                customer.companyName;

            const detailsContainer =
                document.getElementById("customer-details");
            detailsContainer.innerHTML = `
                <div class="detail-section">
                    <h4>Basic Information</h4>
                    <div class="detail-field"><strong>Company Name:</strong> ${this.escapeHtml(customer.companyName)}</div>
                    <div class="detail-field"><strong>Status:</strong> <span class="status-badge ${this.getStatusClass(customer.status)}">${customer.status}</span></div>
                    <div class="detail-field"><strong>Affiliate Partner:</strong> ${this.escapeHtml(customer.affiliatePartner) || "Not provided"}</div>
                    <div class="detail-field"><strong>Next Step:</strong> ${this.escapeHtml(customer.nextStep) || "Not provided"}</div>
                </div>
                
                <div class="detail-section">
                    <h4>Addresses</h4>
                    <div class="detail-field"><strong>Physical Address:</strong><br>${this.escapeHtml(customer.physicalAddress) || "Not provided"}</div>
                    <div class="detail-field"><strong>Billing Address:</strong><br>${this.escapeHtml(customer.billingAddress) || "Not provided"}</div>
                </div>
                
                <div class="detail-section">
                    <h4>Primary Contact</h4>
                    <div class="detail-field"><strong>Name:</strong> ${this.escapeHtml(customer.primaryContact?.name) || "Not provided"}</div>
                    <div class="detail-field"><strong>Email:</strong> ${this.escapeHtml(customer.primaryContact?.email) || "Not provided"}</div>
                    <div class="detail-field"><strong>Phone:</strong> ${this.escapeHtml(customer.primaryContact?.phone) || "Not provided"}</div>
                </div>
                
                <div class="detail-section">
                    <h4>Authorized Signer</h4>
                    <div class="detail-field"><strong>Name:</strong> ${this.escapeHtml(customer.authorizedSigner?.name) || "Not provided"}</div>
                    <div class="detail-field"><strong>Email:</strong> ${this.escapeHtml(customer.authorizedSigner?.email) || "Not provided"}</div>
                    <div class="detail-field"><strong>Phone:</strong> ${this.escapeHtml(customer.authorizedSigner?.phone) || "Not provided"}</div>
                </div>
                
                <div class="detail-section">
                    <h4>Billing Contact</h4>
                    <div class="detail-field"><strong>Name:</strong> ${this.escapeHtml(customer.billingContact?.name) || "Not provided"}</div>
                    <div class="detail-field"><strong>Email:</strong> ${this.escapeHtml(customer.billingContact?.email) || "Not provided"}</div>
                    <div class="detail-field"><strong>Phone:</strong> ${this.escapeHtml(customer.billingContact?.phone) || "Not provided"}</div>
                </div>
                
                ${
                    customer.pasteText
                        ? `
                <div class="detail-section">
                    <h4>Additional Text</h4>
                    <div style="background: hsl(var(--background)); padding: 1rem; border-radius: 4px; white-space: pre-wrap; word-wrap: break-word;">${this.escapeHtml(customer.pasteText)}</div>
                </div>
                `
                        : ""
                }
            `;

            this.renderNotes(customer.notes || []);
            this.showView("customer-detail");
        } catch (error) {
            console.error("Failed to show customer detail:", error);
            this.showError(
                "dashboard-error",
                "Failed to load customer details.",
            );
        }
    }

    renderNotes(notes) {
        const notesList = document.getElementById("notes-list");

        if (!notes || notes.length === 0) {
            notesList.innerHTML =
                '<p style="color: hsl(var(--text-secondary)); text-align: center; padding: 2rem;">No notes yet.</p>';
            return;
        }

        // Sort notes by timestamp, newest first
        const sortedNotes = [...notes].sort(
            (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
        );

        notesList.innerHTML = sortedNotes
            .map(
                (note) => `
            <div class="note-item">
                <div class="note-header">
                    ${new Date(note.timestamp).toLocaleString()}
                </div>
                <div class="note-content">${this.escapeHtml(note.content)}</div>
            </div>
        `,
            )
            .join("");
    }

    editCurrentCustomer() {
        if (!this.currentCustomer) return;

        document.getElementById("form-title").textContent = "Edit Customer";
        this.populateForm(this.currentCustomer);
        document.getElementById("auto-fill-section").style.display = "none";
        this.showView("customer-form");
    }

    populateForm(customer) {
        document.getElementById("company-name").value =
            customer.companyName || "";
        document.getElementById("status").value = customer.status || "Lead";
        document.getElementById("physical-address").value =
            customer.physicalAddress || "";
        document.getElementById("billing-address").value =
            customer.billingAddress || "";

        document.getElementById("primary-name").value =
            customer.primaryContact?.name || "";
        document.getElementById("primary-email").value =
            customer.primaryContact?.email || "";
        document.getElementById("primary-phone").value =
            customer.primaryContact?.phone || "";

        document.getElementById("signer-name").value =
            customer.authorizedSigner?.name || "";
        document.getElementById("signer-email").value =
            customer.authorizedSigner?.email || "";
        document.getElementById("signer-phone").value =
            customer.authorizedSigner?.phone || "";

        document.getElementById("billing-name").value =
            customer.billingContact?.name || "";
        document.getElementById("billing-email").value =
            customer.billingContact?.email || "";
        document.getElementById("billing-phone").value =
            customer.billingContact?.phone || "";

        document.getElementById("paste-text").value = customer.pasteText || "";
    }

    async handleSaveCustomer(e) {
        e.preventDefault();

        try {
            const formData = new FormData(e.target);
            const customerData = this.extractCustomerData(formData);

            // Validate required fields
            if (!customerData.companyName.trim()) {
                this.showError("dashboard-error", "Company name is required.");
                return;
            }

            // Check for duplicates before saving
            const duplicates = this.checkDuplicatesBeforeSave(customerData);
            if (duplicates.length > 0) {
                this.showDuplicateWarning(duplicates);
                return;
            }

            const customerId =
                this.currentCustomerId ||
                `customer_${this.nextCustomerId.toString().padStart(3, "0")}`;

            // Preserve existing notes when editing
            if (this.currentCustomer && this.currentCustomer.notes) {
                customerData.notes = this.currentCustomer.notes;
            }

            customerData.createdAt =
                this.currentCustomer?.createdAt || new Date().toISOString();
            customerData.updatedAt = new Date().toISOString();

            await this.db.set(customerId, customerData);

            if (!this.currentCustomerId) {
                this.nextCustomerId++;
            }

            await this.loadCustomers();
            this.showView("dashboard");
        } catch (error) {
            console.error("Failed to save customer:", error);
            this.showError(
                "dashboard-error",
                "Failed to save customer to database.",
            );
        }
    }

    extractCustomerData(formData) {
        return {
            companyName: formData.get("companyName"),
            status: formData.get("status"),
            affiliatePartner: formData.get("affiliatePartner"),
            nextStep: formData.get("nextStep"),
            physicalAddress: formData.get("physicalAddress"),
            billingAddress: formData.get("billingAddress"),
            primaryContact: {
                name: formData.get("primaryContact.name"),
                email: formData.get("primaryContact.email"),
                phone: formData.get("primaryContact.phone"),
            },
            authorizedSigner: {
                name: formData.get("authorizedSigner.name"),
                email: formData.get("authorizedSigner.email"),
                phone: formData.get("authorizedSigner.phone"),
            },
            billingContact: {
                name: formData.get("billingContact.name"),
                email: formData.get("billingContact.email"),
                phone: formData.get("billingContact.phone"),
            },
            pasteText: formData.get("pasteText"),
        };
    }

    checkDuplicates() {
        const companyName = document
            .getElementById("company-name")
            .value.trim();
        const primaryEmail = document
            .getElementById("primary-email")
            .value.trim();
        const primaryPhone = document
            .getElementById("primary-phone")
            .value.trim();

        if (!companyName && !primaryEmail && !primaryPhone) {
            this.clearDuplicateWarning();
            return;
        }

        const duplicates = [];

        for (const customer of this.customers) {
            // Skip current customer when editing
            if (
                this.currentCustomerId &&
                customer.id === this.currentCustomerId
            ) {
                continue;
            }

            if (
                companyName &&
                customer.companyName.toLowerCase() === companyName.toLowerCase()
            ) {
                duplicates.push(`Company name "${companyName}" already exists`);
                break;
            }

            if (
                primaryEmail &&
                customer.primaryContact?.email?.toLowerCase() ===
                    primaryEmail.toLowerCase()
            ) {
                duplicates.push(`Email "${primaryEmail}" already exists`);
                break;
            }

            if (
                primaryPhone &&
                customer.primaryContact?.phone === primaryPhone
            ) {
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
            if (
                this.currentCustomerId &&
                customer.id === this.currentCustomerId
            ) {
                continue;
            }

            if (
                customerData.companyName &&
                customer.companyName.toLowerCase() ===
                    customerData.companyName.toLowerCase()
            ) {
                duplicates.push(
                    `Company name "${customerData.companyName}" already exists`,
                );
            }

            if (
                customerData.primaryContact?.email &&
                customer.primaryContact?.email?.toLowerCase() ===
                    customerData.primaryContact.email.toLowerCase()
            ) {
                duplicates.push(
                    `Email "${customerData.primaryContact.email}" already exists`,
                );
            }

            if (
                customerData.primaryContact?.phone &&
                customer.primaryContact?.phone ===
                    customerData.primaryContact.phone
            ) {
                duplicates.push(
                    `Phone "${customerData.primaryContact.phone}" already exists`,
                );
            }
        }

        return duplicates;
    }

    showDuplicateWarning(duplicates) {
        const warningDiv = document.getElementById("duplicate-warning");
        const messageSpan = document.getElementById("duplicate-message");
        messageSpan.textContent = duplicates.join(", ");
        warningDiv.style.display = "block";
    }

    clearDuplicateWarning() {
        document.getElementById("duplicate-warning").style.display = "none";
    }

    async deleteCurrentCustomer() {
        if (
            !this.currentCustomerId ||
            !confirm(
                "Are you sure you want to delete this customer? This action cannot be undone.",
            )
        ) {
            return;
        }

        try {
            await this.db.delete(this.currentCustomerId);
            await this.loadCustomers();
            this.showView("dashboard");
        } catch (error) {
            console.error("Failed to delete customer:", error);
            this.showError(
                "dashboard-error",
                "Failed to delete customer from database.",
            );
        }
    }

    async handleAddNote(e) {
        e.preventDefault();

        const noteContent = document.getElementById("new-note").value.trim();
        if (!noteContent) return;

        try {
            const note = {
                content: noteContent,
                timestamp: new Date().toISOString(),
            };

            if (!this.currentCustomer.notes) {
                this.currentCustomer.notes = [];
            }

            this.currentCustomer.notes.push(note);
            this.currentCustomer.updatedAt = new Date().toISOString();

            await this.db.set(this.currentCustomerId, this.currentCustomer);

            // Update local data
            const customerIndex = this.customers.findIndex(
                (c) => c.id === this.currentCustomerId,
            );
            if (customerIndex !== -1) {
                this.customers[customerIndex] = { ...this.currentCustomer };
            }

            this.renderNotes(this.currentCustomer.notes);
            document.getElementById("new-note").value = "";
        } catch (error) {
            console.error("Failed to add note:", error);
            this.showError(
                "dashboard-error",
                "Failed to save note to database.",
            );
        }
    }

    showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        errorElement.textContent = message;
        errorElement.style.display = "block";
    }

    clearErrors() {
        document.querySelectorAll(".error-message").forEach((error) => {
            error.style.display = "none";
        });
    }

    escapeHtml(text) {
        if (!text) return "";
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
    }

    // Auto-fill functionality
    handlePasteTextChange(e) {
        const text = e.target.value.trim();
        const autoFillBtn = document.getElementById("auto-fill-btn");
        if (autoFillBtn) {
            autoFillBtn.disabled = text.length === 0;
        }
    }

    clearPasteText() {
        const pasteTextArea = document.getElementById("paste-note-email");
        const autoFillBtn = document.getElementById("auto-fill-btn");
        
        if (pasteTextArea) pasteTextArea.value = "";
        if (autoFillBtn) autoFillBtn.disabled = true;
    }

    async autoFillForm() {
        const text = document.getElementById("paste-note-email").value;
        if (!text.trim()) return;

        // Show loading indicator
        const autoFillBtn = document.getElementById("auto-fill-btn");
        const originalText = autoFillBtn.textContent;
        autoFillBtn.textContent = "Parsing...";
        autoFillBtn.disabled = true;

        try {
            // Use AI parsing if available, otherwise fallback to regex
            const extractedData = await this.parseTextWithAI(text);
            this.populateFormFromExtractedData(extractedData);
        } finally {
            // Restore button
            autoFillBtn.textContent = originalText;
            autoFillBtn.disabled = false;
        }
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
            companyName: "",
            physicalAddress: "",
            billingAddress: "",
            primaryContact: { name: "", email: "", phone: "" },
            authorizedSigner: { name: "", email: "", phone: "" },
            billingContact: { name: "", email: "", phone: "" },
        };

        // Extract emails (basic pattern)
        const emailRegex =
            /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
        const emails = text.match(emailRegex) || [];

        // Extract phone numbers (US format variations)
        const phoneRegex =
            /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
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
            /from[\s:]+([A-Z][a-zA-Z\s&]+)/i,
        ];

        for (const pattern of companyPatterns) {
            const match = text.match(pattern);
            if (match) {
                data.companyName = match[1].trim();
                break;
            }
        }

        // Extract addresses (look for multi-line patterns with city, state, zip)
        const addressRegex =
            /([0-9]+[\s\w]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Way|Place|Pl)[^\n]*[\n\r]*[A-Za-z\s]+,\s*[A-Z]{2}\s*[0-9]{5}(?:-[0-9]{4})?)/gi;
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
            /([A-Z][a-z]+\s+[A-Z][a-z]+)[\s,]*\(?[0-9]/,
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
            document.getElementById("company-name").value = data.companyName;
        }
        if (data.physicalAddress) {
            document.getElementById("physical-address").value =
                data.physicalAddress;
        }
        if (data.billingAddress) {
            document.getElementById("billing-address").value =
                data.billingAddress;
        }

        // Primary Contact
        if (data.primaryContact.name) {
            document.getElementById("primary-name").value =
                data.primaryContact.name;
        }
        if (data.primaryContact.email) {
            document.getElementById("primary-email").value =
                data.primaryContact.email;
        }
        if (data.primaryContact.phone) {
            document.getElementById("primary-phone").value =
                data.primaryContact.phone;
        }

        // Authorized Signer
        if (data.authorizedSigner.name) {
            document.getElementById("signer-name").value =
                data.authorizedSigner.name;
        }
        if (data.authorizedSigner.email) {
            document.getElementById("signer-email").value =
                data.authorizedSigner.email;
        }
        if (data.authorizedSigner.phone) {
            document.getElementById("signer-phone").value =
                data.authorizedSigner.phone;
        }

        // Billing Contact
        if (data.billingContact.name) {
            document.getElementById("billing-name").value =
                data.billingContact.name;
        }
        if (data.billingContact.email) {
            document.getElementById("billing-email").value =
                data.billingContact.email;
        }
        if (data.billingContact.phone) {
            document.getElementById("billing-phone").value =
                data.billingContact.phone;
        }

        // Trigger duplicate checking after auto-fill
        this.checkDuplicates();
    }

    // Smart contact duplication functionality
    handleSignerSameAsPrimary(e) {
        const isChecked = e.target.checked;
        const signerFields = ["signer-name", "signer-email", "signer-phone"];

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
        const billingFields = [
            "billing-name",
            "billing-email",
            "billing-phone",
        ];

        if (isChecked) {
            this.copyPrimaryContactToFields(billingFields);
            this.setFieldsReadOnly(billingFields, true);
        } else {
            this.clearFields(billingFields);
            this.setFieldsReadOnly(billingFields, false);
        }
    }

    copyPrimaryContactToFields(targetFields) {
        const primaryName = document.getElementById("primary-name").value;
        const primaryEmail = document.getElementById("primary-email").value;
        const primaryPhone = document.getElementById("primary-phone").value;

        if (
            targetFields.includes("signer-name") ||
            targetFields.includes("billing-name")
        ) {
            const nameField = targetFields.find((field) =>
                field.includes("name"),
            );
            if (nameField)
                document.getElementById(nameField).value = primaryName;
        }

        if (
            targetFields.includes("signer-email") ||
            targetFields.includes("billing-email")
        ) {
            const emailField = targetFields.find((field) =>
                field.includes("email"),
            );
            if (emailField)
                document.getElementById(emailField).value = primaryEmail;
        }

        if (
            targetFields.includes("signer-phone") ||
            targetFields.includes("billing-phone")
        ) {
            const phoneField = targetFields.find((field) =>
                field.includes("phone"),
            );
            if (phoneField)
                document.getElementById(phoneField).value = primaryPhone;
        }
    }

    setFieldsReadOnly(fieldIds, isReadOnly) {
        fieldIds.forEach((fieldId) => {
            const field = document.getElementById(fieldId);
            field.readOnly = isReadOnly;
            if (isReadOnly) {
                field.style.backgroundColor = "hsl(var(--secondary))";
                field.style.color = "hsl(var(--text-secondary))";
            } else {
                field.style.backgroundColor = "";
                field.style.color = "";
            }
        });
    }

    clearFields(fieldIds) {
        fieldIds.forEach((fieldId) => {
            document.getElementById(fieldId).value = "";
        });
    }

    updateCopiedFields() {
        // Update signer fields if checkbox is checked
        if (document.getElementById("signer-same-as-primary").checked) {
            const signerFields = [
                "signer-name",
                "signer-email",
                "signer-phone",
            ];
            this.copyPrimaryContactToFields(signerFields);
        }

        // Update billing fields if checkbox is checked
        if (document.getElementById("billing-same-as-primary").checked) {
            const billingFields = [
                "billing-name",
                "billing-email",
                "billing-phone",
            ];
            this.copyPrimaryContactToFields(billingFields);
        }
    }

    clearContactDuplicationCheckboxes() {
        // Uncheck checkboxes
        document.getElementById("signer-same-as-primary").checked = false;
        document.getElementById("billing-same-as-primary").checked = false;

        // Reset field states
        const allFields = [
            "signer-name",
            "signer-email",
            "signer-phone",
            "billing-name",
            "billing-email",
            "billing-phone",
        ];
        this.setFieldsReadOnly(allFields, false);
    }
    // CSV Import functionality
    showImportView() {
        this.showView('import');
        // Reset import state
        const csvFileInput = document.getElementById('csv-file');
        const previewBtn = document.getElementById('preview-csv');
        const csvPreview = document.getElementById('csv-preview');
        const importResults = document.getElementById('import-results');
        
        if (csvFileInput) csvFileInput.value = '';
        if (previewBtn) previewBtn.disabled = true;
        if (csvPreview) csvPreview.style.display = 'none';
        if (importResults) importResults.style.display = 'none';
        this.csvData = null;
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        const previewBtn = document.getElementById('preview-csv');
        
        if (file && file.type === 'text/csv') {
            if (previewBtn) previewBtn.disabled = false;
            this.selectedFile = file;
        } else {
            if (previewBtn) previewBtn.disabled = true;
            this.selectedFile = null;
            if (file) {
                alert('Please select a valid CSV file.');
            }
        }
    }

    previewCSV() {
        if (!this.selectedFile) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const csvText = e.target.result;
            this.parseMicrosoftListsCSV(csvText);
        };
        reader.readAsText(this.selectedFile);
    }

    parseMicrosoftListsCSV(csvText) {
        try {
            const lines = csvText.split('\n');
            // Skip the first line (schema info) and get headers from second line
            const headers = this.parseCSVLine(lines[1]);
            const dataLines = lines.slice(2).filter(line => line.trim() && !line.startsWith(',,,,'));

            const customers = [];
            let customerId = Date.now();

            for (const line of dataLines) {
                if (!line.trim()) continue;
                
                const values = this.parseCSVLine(line);
                if (values.length < headers.length) continue;

                const customer = this.mapMicrosoftListsData(headers, values, customerId);
                if (customer.companyName) {
                    customers.push(customer);
                    customerId++;
                }
            }

            this.csvData = customers;
            this.showPreview(customers);

        } catch (error) {
            console.error('Error parsing CSV:', error);
            alert('Error parsing CSV file. Please check the file format.');
        }
    }

    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current.trim());
        return result;
    }

    mapMicrosoftListsData(headers, values, customerId) {
        const getField = (fieldName) => {
            const index = headers.findIndex(h => h.toLowerCase().includes(fieldName.toLowerCase()));
            return index >= 0 ? values[index]?.replace(/"/g, '').trim() : '';
        };

        const customer = {
            id: `customer_${customerId}`,
            companyName: getField('Title'),
            status: getField('Status') || 'Lead',
            affiliatePartner: getField('Affiliate Partner'),
            nextStep: getField('Next Step'),
            physicalAddress: this.buildAddress(
                getField('Service Address - Street 1'),
                getField('Service Address - Street 2'),
                getField('Service Address - City'),
                getField('Service Address - State'),
                getField('Service Address - ZIP')
            ),
            billingAddress: '', // Will copy from physical if needed
            primaryContact: {
                name: getField('Primary Contact Name'),
                email: getField('Primary Contact Email'),
                phone: getField('Primary Contact Phone')
            },
            authorizedSigner: {
                name: getField('Authorized Signer'),
                email: getField('Authorized Signer Email'),
                phone: ''
            },
            billingContact: {
                name: getField('Billing Contact Name'),
                email: getField('Billing Contact Email'),
                phone: getField('Billing Contact Number')
            },
            notes: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Add installation date and notes from the original data
        const installDate = getField('Installation Date');
        const notesContent = values[values.length - 1] || ''; // Last column typically contains notes
        
        if (installDate && installDate !== '') {
            customer.notes.push({
                content: `Installation Date: ${installDate}`,
                timestamp: new Date().toISOString()
            });
        }

        if (notesContent && notesContent !== '' && notesContent !== 'False' && notesContent !== 'True') {
            customer.notes.push({
                content: notesContent,
                timestamp: new Date().toISOString()
            });
        }

        // Copy physical address to billing if billing is empty
        if (!customer.billingContact.name && customer.physicalAddress) {
            customer.billingAddress = customer.physicalAddress;
        }

        return customer;
    }

    buildAddress(street1, street2, city, state, zip) {
        const parts = [street1, street2, city, state, zip].filter(part => part && part.trim());
        return parts.join(', ');
    }

    showPreview(customers) {
        const previewInfo = document.getElementById('preview-info');
        const csvPreview = document.getElementById('csv-preview');
        
        if (!previewInfo || !csvPreview) return;
        
        const statusCounts = {};
        
        customers.forEach(customer => {
            const status = customer.status || 'Unknown';
            statusCounts[status] = (statusCounts[status] || 0) + 1;
        });

        let statusBreakdown = Object.entries(statusCounts)
            .map(([status, count]) => `${status}: ${count}`)
            .join(', ');

        previewInfo.innerHTML = `
            <div class="preview-stats">
                <div class="stat-item">
                    <div class="stat-number">${customers.length}</div>
                    <div class="stat-label">Total Customers</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${Object.keys(statusCounts).length}</div>
                    <div class="stat-label">Different Statuses</div>
                </div>
            </div>
            <p><strong>Status Breakdown:</strong> ${statusBreakdown}</p>
            <p><strong>Ready to import:</strong> ${customers.length} customers with complete data</p>
        `;

        csvPreview.style.display = 'block';
    }

    async importCSVData() {
        if (!this.csvData || this.csvData.length === 0) return;

        try {
            let imported = 0;
            let skipped = 0;

            for (const customerData of this.csvData) {
                try {
                    // Check for duplicates
                    const existingCustomer = this.customers.find(c => 
                        c.companyName.toLowerCase() === customerData.companyName.toLowerCase()
                    );

                    if (existingCustomer) {
                        skipped++;
                        continue;
                    }

                    await this.db.set(customerData.id, customerData);
                    imported++;

                } catch (error) {
                    console.error('Error importing customer:', customerData.companyName, error);
                    skipped++;
                }
            }

            // Reload customers
            await this.loadCustomers();

            // Show results
            const importSummary = document.getElementById('import-summary');
            const csvPreview = document.getElementById('csv-preview');
            const importResults = document.getElementById('import-results');
            
            if (importSummary) {
                importSummary.innerHTML = `
                    <div class="preview-stats">
                        <div class="stat-item">
                            <div class="stat-number">${imported}</div>
                            <div class="stat-label">Successfully Imported</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-number">${skipped}</div>
                            <div class="stat-label">Skipped (Duplicates)</div>
                        </div>
                    </div>
                    <p>Import completed successfully!</p>
                `;
            }

            if (csvPreview) csvPreview.style.display = 'none';
            if (importResults) importResults.style.display = 'block';

        } catch (error) {
            console.error('Import failed:', error);
            alert('Import failed. Please try again.');
        }
    }

    cancelImport() {
        this.showView('dashboard');
    }

    // Auto-import Microsoft Lists data if no customers exist
    async checkAndAutoImport() {
        const existingKeys = Object.keys(localStorage).filter(key => key.startsWith('customer_'));
        console.log(`🔍 Checking for existing customers: ${existingKeys.length} found`);
        
        if (existingKeys.length === 0) {
            console.log('🚀 No customers found, starting auto-import...');
            await this.importMicrosoftData();
        } else {
            console.log('✅ Customers already exist, skipping import');
        }
    }

    // Microsoft Lists Data Import
    async importMicrosoftData() {
        console.log('🚀 Starting Microsoft data import...');
        
        // Clear any existing import flags for testing
        localStorage.removeItem('vantix_data_imported');
        
        const customers = [
            {"id":"customer_001","companyName":"My Pharmacist On Call","status":"Onboarding","affiliatePartner":"VOXO","nextStep":"Schedule Install","physicalAddress":"3426 Whittier Blvd, Los Angeles, CA, 90023","billingAddress":"3426 Whittier Blvd, Los Angeles, CA, 90023","primaryContact":{"name":"Jacqueline","email":"ashers.assistant@gmail.com","phone":"310-882-6661"},"authorizedSigner":{"name":"Asher Eghbali","email":"asher.eghbali@gmail.com","phone":""},"billingContact":{"name":"Asher Eghbali","email":"ahsher.eghbali@gmail.com","phone":"310-497-3109"},"notes":[{"content":"Mr. Manuel is the Voice contact at 323-408-3860.","timestamp":"2025-06-23T21:00:00.000Z"}],"createdAt":"2025-06-23T21:00:00.000Z","updatedAt":"2025-06-23T21:00:00.000Z"},
            {"id":"customer_002","companyName":"Berea Drug","status":"Onboarding","affiliatePartner":"VOXO","nextStep":"Perform Install","physicalAddress":"402 Richmond Road North, Berea, KY, 40403","billingAddress":"402 Richmond Road North, Berea, KY, 40403","primaryContact":{"name":"Robert Little","email":"bereadrug@yahoo.com","phone":"859-986-4521"},"authorizedSigner":{"name":"Robert Little","email":"bereadrug@yahoo.com","phone":""},"billingContact":{"name":"Robert Little","email":"bereadrug@yahoo.com","phone":"859-986-4521"},"notes":[{"content":"Installation Date: June 11, 2025","timestamp":"2025-06-23T21:00:00.000Z"},{"content":"Per call with Sally on 6/5/2025 -- Hardware is on site.","timestamp":"2025-06-23T21:00:00.000Z"}],"createdAt":"2025-06-23T21:00:00.000Z","updatedAt":"2025-06-23T21:00:00.000Z"},
            'customer_003': {"id":"customer_003","companyName":"Southeast Pharmacy","status":"Onboarding","affiliatePartner":"VOXO","nextStep":"Schedule Install","physicalAddress":"400 Parker Avenue North, STE 500A, Brooklet, GA, 30415","billingAddress":"400 Parker Avenue North, STE 500A, Brooklet, GA, 30415","primaryContact":{"name":"Shelby Hook","email":"hookrx@gmail.com","phone":"912-842-2040"},"authorizedSigner":{"name":"Shelby Hook","email":"hookrx@gmail.com","phone":""},"billingContact":{"name":"Shelby Hook","email":"hookrx@gmail.com","phone":"912-842-2040"},"notes":[{"content":"Z3 is ordered from Network Tigers and shipped directly to the site.","timestamp":"2025-06-23T21:00:00.000Z"}],"createdAt":"2025-06-23T21:00:00.000Z","updatedAt":"2025-06-23T21:00:00.000Z"},
            'customer_004': {"id":"customer_004","companyName":"Rancho Pueblo Pharmacy","status":"Quoted","affiliatePartner":"VOXO","nextStep":"Follow with VOXO AE","physicalAddress":"","billingAddress":"","primaryContact":{"name":"Yash Patel","email":"yashpatel031998@gmail.com","phone":"951-972-8822"},"authorizedSigner":{"name":"Yash Patel","email":"yashpatel031998@gmail.com","phone":""},"billingContact":{"name":"","email":"","phone":""},"notes":[{"content":"Spoke with Yash. He had an issue with price. Rusty needs to go back and explain to him the whole story instead of just the voice portion","timestamp":"2025-06-23T21:00:00.000Z"}],"createdAt":"2025-06-23T21:00:00.000Z","updatedAt":"2025-06-23T21:00:00.000Z"},
            'customer_005': {"id":"customer_005","companyName":"CR Care Pharmacy","status":"Lead","affiliatePartner":"VOXO","nextStep":"Follow with VOXO AE","physicalAddress":"3100 E Avenue NW, Suite 102, Cedar Rapids, IA, 52405","billingAddress":"3100 E Avenue NW, Suite 102, Cedar Rapids, IA, 52405","primaryContact":{"name":"Jackie Fitzgerald","email":"crcarerx@gmail.com","phone":"319-200-1188"},"authorizedSigner":{"name":"Jackie Fitzgerald","email":"crcarerx@gmail.com","phone":""},"billingContact":{"name":"","email":"","phone":""},"notes":[{"content":"Neal is reaching out to Jackie -- From Connect 2025. Saw her there. She is purposely waiting a few months to move forward with Voxo until she gets some folks back in the office.","timestamp":"2025-06-23T21:00:00.000Z"}],"createdAt":"2025-06-23T21:00:00.000Z","updatedAt":"2025-06-23T21:00:00.000Z"},
            'customer_006': {"id":"customer_006","companyName":"McCoy Tygart Drug","status":"Lead","affiliatePartner":"VOXO","nextStep":"","physicalAddress":"","billingAddress":"","primaryContact":{"name":"Casey Hedden","email":"casey@mccoytygartdrug.com","phone":""},"authorizedSigner":{"name":"","email":"","phone":""},"billingContact":{"name":"","email":"","phone":""},"notes":[{"content":"We have 4 stores in a 30 mile radius that we need to get VPN connected with each other. A not-so-distant goal is to get a centralized data entry location for these stores setup, with central fill a secondary goal.","timestamp":"2025-06-23T21:00:00.000Z"}],"createdAt":"2025-06-23T21:00:00.000Z","updatedAt":"2025-06-23T21:00:00.000Z"},
            'customer_007': {"id":"customer_007","companyName":"Sadler Hughes Apothecary","status":"Signed","affiliatePartner":"VOXO","nextStep":"Order Hardware and License","physicalAddress":"102 Jacobs Hwy, Clinton, SC, 29325","billingAddress":"102 Jacobs Hwy, Clinton, SC, 29325","primaryContact":{"name":"Walter Hughes","email":"","phone":""},"authorizedSigner":{"name":"Walter Hughes","email":"whughes@sadlerhughes.com","phone":""},"billingContact":{"name":"","email":"","phone":""},"notes":[{"content":"6/10/2025 -- Sent email to Walter requesting information for SA","timestamp":"2025-06-23T21:00:00.000Z"}],"createdAt":"2025-06-23T21:00:00.000Z","updatedAt":"2025-06-23T21:00:00.000Z"},
            'customer_008': {"id":"customer_008","companyName":"Blanco Pharmacy and Wellness","status":"Lead","affiliatePartner":"VOXO","nextStep":"","physicalAddress":"","billingAddress":"","primaryContact":{"name":"Blakelee Speer","email":"blakelee2006@msn.com","phone":"830-833-4815"},"authorizedSigner":{"name":"","email":"","phone":""},"billingContact":{"name":"","email":"","phone":""},"notes":[{"content":"AT Connect 2025 -- moving to VOXO. One location. VPN has been too slow. Told her we'd troubleshoot before we start changing firewall.","timestamp":"2025-06-23T21:00:00.000Z"}],"createdAt":"2025-06-23T21:00:00.000Z","updatedAt":"2025-06-23T21:00:00.000Z"},
            'customer_009': {"id":"customer_009","companyName":"Vital Care Infusion Services","status":"Lead","affiliatePartner":"","nextStep":"","physicalAddress":"","billingAddress":"","primaryContact":{"name":"Jonathan Sims","email":"","phone":"601-596-2800"},"authorizedSigner":{"name":"Jonathan Sims","email":"","phone":""},"billingContact":{"name":"","email":"","phone":""},"notes":[{"content":"Per Levi at Voxo I called Blake Tubbs to discuss needs for both of these businesses. He has a vital care pharmacy and the compounder here in Hattiesburg. Vital care is a franchise and he also has another one in Baton Rouge.","timestamp":"2025-06-23T21:00:00.000Z"}],"createdAt":"2025-06-23T21:00:00.000Z","updatedAt":"2025-06-23T21:00:00.000Z"},
            'customer_010': {"id":"customer_010","companyName":"The Compounder","status":"Lead","affiliatePartner":"","nextStep":"","physicalAddress":"","billingAddress":"","primaryContact":{"name":"Jonathan Sims","email":"","phone":"601-596-2800"},"authorizedSigner":{"name":"Jonathan Sims","email":"","phone":""},"billingContact":{"name":"","email":"","phone":""},"notes":[],"createdAt":"2025-06-23T21:00:00.000Z","updatedAt":"2025-06-23T21:00:00.000Z"},
            'customer_011': {"id":"customer_011","companyName":"Delta Pharmacy","status":"Lead","affiliatePartner":"VOXO","nextStep":"","physicalAddress":"","billingAddress":"","primaryContact":{"name":"Willis High","email":"WHigh@delta-rx.com","phone":"843-813-7874"},"authorizedSigner":{"name":"","email":"","phone":""},"billingContact":{"name":"","email":"","phone":""},"notes":[{"content":"This is eight locations. They can handle doing the installations themselves although they did ask about Turkey. Each location is going to be a firewall and they need Wi-Fi turned up.","timestamp":"2025-06-23T21:00:00.000Z"}],"createdAt":"2025-06-23T21:00:00.000Z","updatedAt":"2025-06-23T21:00:00.000Z"},
            {"id":"customer_012","companyName":"Mac Pharmacy","status":"Lead","affiliatePartner":"VOXO","nextStep":"","physicalAddress":"","billingAddress":"","primaryContact":{"name":"Sherif Mankaryous","email":"","phone":""},"authorizedSigner":{"name":"","email":"","phone":""},"billingContact":{"name":"","email":"","phone":""},"notes":[],"createdAt":"2025-06-23T21:00:00.000Z","updatedAt":"2025-06-23T21:00:00.000Z"}
        ];

        try {
            console.log(`📦 Importing ${customers.length} customers...`);
            
            let imported = 0;
            for (const customer of customers) {
                // Save directly to localStorage
                localStorage.setItem(customer.id, JSON.stringify(customer));
                console.log(`✅ Saved ${customer.companyName} (${customer.id})`);
                imported++;
            }
            
            console.log(`🎉 Successfully imported ${imported} customers`);
            
            // Update next customer ID after import
            this.nextCustomerId = this.getNextCustomerId();
            
            // Mark as imported
            localStorage.setItem('vantix_data_imported', 'true');
            
        } catch (error) {
            console.error('❌ Import failed:', error);
        }
    }

    // Integration stub methods
    createInQBO(customerId) {
        const customer = this.customers.find(c => c.id === customerId);
        if (!customer) return;
        
        alert(`QuickBooks integration coming soon!\n\nWould create customer: ${customer.companyName}`);
        // TODO: Integrate with QuickBooks Online API
    }

    sendAgreement(customerId) {
        const customer = this.customers.find(c => c.id === customerId);
        if (!customer) return;
        
        alert(`DocuSign integration coming soon!\n\nWould send service agreement to: ${customer.companyName}`);
        // TODO: Integrate with DocuSign API for automated agreement generation
    }
}

// Initialize the app when the page loads
let app;
document.addEventListener("DOMContentLoaded", () => {
    app = new CRMApp();
});
document
    .getElementById("sameAsPhysical")
    .addEventListener("change", function () {
        const isChecked = this.checked;

        const fields = ["street1", "street2", "city", "state", "zip"];
        fields.forEach((field) => {
            const phys = document.getElementById(`phys_${field}`);
            const bill = document.getElementById(`bill_${field}`);

            if (isChecked) {
                bill.value = phys.value;
                bill.readOnly = true;
                bill.disabled = field === "state" ? true : false;
            } else {
                bill.readOnly = false;
                bill.disabled = false;
                bill.value = "";
            }
        });
    });
