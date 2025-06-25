// Database API client
class DatabaseAPI {
    constructor() {
        this.baseURL = '/api';
    }

    async getCustomers() {
        try {
            console.log('DatabaseAPI: Making fetch request to', `${this.baseURL}/customers`);
            console.log('Current window location:', window.location.href);
            
            const response = await fetch(`${this.baseURL}/customers`);
            
            console.log('DatabaseAPI: Response status:', response.status);
            console.log('DatabaseAPI: Response ok:', response.ok);
            console.log('DatabaseAPI: Response headers:', Object.fromEntries(response.headers.entries()));
            
            if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            
            const data = await response.json();
            console.log('DatabaseAPI: Successfully parsed JSON data');
            
            return data;
        } catch (error) {
            console.error('DatabaseAPI Error Details:');
            console.error('- Error type:', error.constructor.name);
            console.error('- Error message:', error.message);
            console.error('- Error stack:', error.stack);
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
        this.filteredCustomers = [];
        this.currentCustomer = null;
        this.currentCustomerId = null;
        this.sortConfig = { key: null, direction: 'asc' };
        this.filters = { status: '', affiliate: '', search: '' };
        this.isEditingCustomer = false;
        this.init();
    }

    async init() {
        console.log('=== CRM INIT DEBUG START ===');
        
        try {
            console.log('Step 1: CRM App starting initialization...');
            
            console.log('Step 2: Loading customers...');
            await this.loadCustomers();
            
            console.log('Step 3: Binding events...');
            this.bindEvents();
            
            console.log('Step 4: Showing dashboard view...');
            this.showView("dashboard");
            
            console.log("=== CRM INIT SUCCESSFUL ===");
        } catch (error) {
            console.error("CRITICAL: Failed to initialize app:", error);
            console.error("Error stack:", error.stack);
            this.showError("dashboard-error", "Failed to load application data.");
        }
    }

    async loadCustomers() {
        console.log('=== LOAD CUSTOMERS DEBUG START ===');
        
        try {
            console.log('Step 1: Showing loading indicator...');
            const loadingElement = document.getElementById("dashboard-loading");
            if (loadingElement) {
                loadingElement.style.display = "block";
                console.log('Loading element shown');
            } else {
                console.warn('Loading element not found');
            }
            
            console.log('Step 2: Calling API...');
            this.customers = await this.api.getCustomers();
            
            console.log('Step 3: API Response received');
            console.log(`Loaded ${this.customers.length} customers from PostgreSQL`);
            console.log('First customer sample:', this.customers[0]);
            console.log('All customer company names:', this.customers.map(c => c.company_name));
            
            console.log('Step 4: Setting up filtered customers...');
            this.filteredCustomers = [...this.customers];
            
            console.log('Step 5: Calling renderCustomerList...');
            this.renderCustomerList();
            
            console.log('=== LOAD CUSTOMERS DEBUG END ===');
            
        } catch (error) {
            console.error("CRITICAL ERROR in loadCustomers:", error);
            console.error("Error stack:", error.stack);
            this.showError("dashboard-error", `Failed to load customers: ${error.message}`);
        } finally {
            const loadingElement = document.getElementById("dashboard-loading");
            if (loadingElement) {
                loadingElement.style.display = "none";
                console.log('Loading element hidden');
            }
        }
    }

    renderCustomerList() {
        console.log('=== RENDER DEBUG START ===');
        console.log('Customers to render:', this.filteredCustomers.length);
        
        const tableBody = document.getElementById("customers-table-body");
        const emptyState = document.getElementById("empty-state");
        
        console.log('DOM elements found:');
        console.log('- customers-table-body:', !!tableBody);
        console.log('- empty-state element:', !!emptyState);

        if (!tableBody) {
            console.error('CRITICAL: customers-table-body element not found in DOM');
            return;
        }

        if (this.filteredCustomers.length === 0) {
            console.log('No customers found, showing empty state');
            tableBody.innerHTML = "";
            if (emptyState) {
                emptyState.style.display = "block";
                console.log('Empty state element shown');
            }
            return;
        }

        console.log('Hiding empty state, rendering customers...');
        if (emptyState) {
            emptyState.style.display = "none";
            console.log('Empty state element hidden');
        }

        try {
            console.log('Generating table rows for customers...');
            const rowsHTML = this.filteredCustomers.map((customer, index) => {
                console.log(`Processing customer ${index + 1}: ${customer.company_name}`);
                
                const primaryContactName = customer.primary_contact?.name || '';
                const primaryContactPhone = customer.primary_contact?.phone || '';
                const lastNote = this.getLatestNote(customer.notes || []);

                return `
                    <tr>
                        <td>
                            <a href="#" class="company-link" onclick="app.showCustomerDetail('${customer.customer_id}'); return false;">
                                ${this.escapeHtml(customer.company_name)}
                            </a>
                        </td>
                        <td class="status-cell">
                            <select class="status-dropdown" data-customer-id="${customer.customer_id}" data-original-value="${customer.status}" onchange="app.updateCustomerStatus(this)">
                                <option value="Lead" ${customer.status === 'Lead' ? 'selected' : ''}>Lead</option>
                                <option value="Quoted" ${customer.status === 'Quoted' ? 'selected' : ''}>Quoted</option>
                                <option value="Signed" ${customer.status === 'Signed' ? 'selected' : ''}>Signed</option>
                                <option value="Onboarding" ${customer.status === 'Onboarding' ? 'selected' : ''}>Onboarding</option>
                            </select>
                        </td>
                        <td>${this.escapeHtml(customer.affiliate_partner || '')}</td>
                        <td>${this.escapeHtml(primaryContactName)}</td>
                        <td>${this.escapeHtml(primaryContactPhone)}</td>
                        <td>
                            <input type="text" class="next-step-input" 
                                   value="${this.escapeHtml(customer.next_step || '')}" 
                                   data-customer-id="${customer.customer_id}"
                                   onblur="app.updateCustomerNextStep(this)"
                                   onkeypress="if(event.key==='Enter') this.blur()">
                        </td>
                        <td class="last-note">${this.escapeHtml(lastNote)}</td>
                        <td class="table-actions">
                            <button class="action-icon" onclick="app.createInQBO('${customer.customer_id}')" title="Create in QuickBooks">💼</button>
                            <button class="action-icon" onclick="app.sendAgreement('${customer.customer_id}')" title="Send Agreement">📄</button>
                        </td>
                    </tr>
                `;
            }).join('');

            console.log('Setting table innerHTML...');
            tableBody.innerHTML = rowsHTML;
            
            console.log('SUCCESS: Rendered customers table');
            console.log('=== RENDER DEBUG END ===');
            
            // Render next actions
            this.renderNextActions();
            
        } catch (error) {
            console.error('ERROR in renderCustomerList:', error);
            console.error('Error details:', error.stack);
            tableBody.innerHTML = '<tr><td colspan="8" style="color: red; padding: 20px;">Error loading customers. Check console for details.</td></tr>';
        }
    }

    renderNextActions() {
        const nextActionsBody = document.getElementById("next-actions-table-body");
        if (!nextActionsBody) return;

        const customersWithNextSteps = this.customers.filter(c => c.next_step && c.next_step.trim());
        
        if (customersWithNextSteps.length === 0) {
            nextActionsBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-secondary);">No pending next steps</td></tr>';
            return;
        }

        const rowsHTML = customersWithNextSteps.map(customer => `
            <tr>
                <td>
                    <a href="#" class="company-link" onclick="app.showCustomerDetail('${customer.customer_id}'); return false;">
                        ${this.escapeHtml(customer.company_name)}
                    </a>
                </td>
                <td>${this.escapeHtml(customer.next_step)}</td>
                <td>-</td>
                <td class="table-actions">
                    <button class="action-icon" onclick="app.showCustomerDetail('${customer.customer_id}')" title="Edit Customer">✏️</button>
                </td>
            </tr>
        `).join('');

        nextActionsBody.innerHTML = rowsHTML;
    }

    getLatestNote(notes) {
        if (!notes || notes.length === 0) {
            return "";
        }

        // Sort notes by timestamp, newest first
        const sortedNotes = [...notes].sort(
            (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        );
        const latestNote = sortedNotes[0];

        // Truncate note text if too long
        const maxLength = 60;
        let noteText = latestNote.content;
        if (noteText.length > maxLength) {
            noteText = noteText.substring(0, maxLength) + "...";
        }

        return noteText;
    }

    applyFilters() {
        this.filters.status = document.getElementById("status-filter")?.value || '';
        this.filters.affiliate = document.getElementById("affiliate-filter")?.value || '';
        this.filters.search = document.getElementById("search-filter")?.value.toLowerCase() || '';

        this.filteredCustomers = this.customers.filter(customer => {
            const statusMatch = !this.filters.status || customer.status === this.filters.status;
            const affiliateMatch = !this.filters.affiliate || customer.affiliate_partner === this.filters.affiliate;
            const searchMatch = !this.filters.search || 
                customer.company_name.toLowerCase().includes(this.filters.search) ||
                customer.primary_contact?.name?.toLowerCase().includes(this.filters.search) ||
                customer.primary_contact?.email?.toLowerCase().includes(this.filters.search);

            return statusMatch && affiliateMatch && searchMatch;
        });

        this.renderCustomerList();
    }

    sortTable(key) {
        if (this.sortConfig.key === key) {
            this.sortConfig.direction = this.sortConfig.direction === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortConfig.key = key;
            this.sortConfig.direction = 'asc';
        }

        this.filteredCustomers.sort((a, b) => {
            let aVal = a[key] || '';
            let bVal = b[key] || '';

            if (key === 'primary_contact') {
                aVal = a.primary_contact?.name || '';
                bVal = b.primary_contact?.name || '';
            }

            if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }

            if (aVal < bVal) return this.sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return this.sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        // Update sort indicators
        document.querySelectorAll('.sort-indicator').forEach(indicator => {
            indicator.classList.remove('asc', 'desc');
        });

        const currentHeader = document.querySelector(`th[data-sort="${key}"] .sort-indicator`);
        if (currentHeader) {
            currentHeader.classList.add(this.sortConfig.direction);
        }

        this.renderCustomerList();
    }

    async updateCustomerStatus(selectElement) {
        const customerId = selectElement.dataset.customerId;
        const newStatus = selectElement.value;
        const originalValue = selectElement.dataset.originalValue || selectElement.value;

        // Store original value for rollback
        if (!selectElement.dataset.originalValue) {
            selectElement.dataset.originalValue = originalValue;
        }

        try {
            console.log(`Updating customer ${customerId} status from ${originalValue} to ${newStatus}`);
            
            // Only send the status field to avoid affecting other fields
            const updateData = { status: newStatus };
            
            await this.api.updateCustomer(customerId, updateData);
            console.log(`Successfully updated customer ${customerId} status to ${newStatus}`);
            
            // Update local data
            const customer = this.customers.find(c => c.customer_id === customerId);
            if (customer) {
                customer.status = newStatus;
            }

            // Update filtered customers as well
            const filteredCustomer = this.filteredCustomers.find(c => c.customer_id === customerId);
            if (filteredCustomer) {
                filteredCustomer.status = newStatus;
            }

            // Update the original value
            selectElement.dataset.originalValue = newStatus;
            
        } catch (error) {
            console.error('Failed to update customer status:', error);
            console.error('Error details:', error);
            
            // Revert the dropdown to original value
            selectElement.value = selectElement.dataset.originalValue;
            
            // Show user-friendly error message
            const errorMsg = error.message || 'Failed to update status. Please try again.';
            alert(errorMsg);
        }
    }

    async updateCustomerNextStep(inputElement) {
        const customerId = inputElement.dataset.customerId;
        const newNextStep = inputElement.value.trim();
        const originalValue = inputElement.dataset.originalValue || '';

        // Store original value for rollback
        if (!inputElement.dataset.originalValue) {
            const customer = this.customers.find(c => c.customer_id === customerId);
            inputElement.dataset.originalValue = customer?.next_step || '';
        }

        try {
            // Only send the next_step field
            const updateData = { next_step: newNextStep || null };
            
            await this.api.updateCustomer(customerId, updateData);
            console.log(`Updated customer ${customerId} next step to "${newNextStep}"`);
            
            // Update local data
            const customer = this.customers.find(c => c.customer_id === customerId);
            if (customer) {
                customer.next_step = newNextStep;
            }

            // Update filtered customers as well
            const filteredCustomer = this.filteredCustomers.find(c => c.customer_id === customerId);
            if (filteredCustomer) {
                filteredCustomer.next_step = newNextStep;
            }

            // Update original value
            inputElement.dataset.originalValue = newNextStep;

            // Re-render next actions section
            this.renderNextActions();
        } catch (error) {
            console.error('Failed to update customer next step:', error);
            
            // Revert the input to original value
            inputElement.value = inputElement.dataset.originalValue;
            
            const errorMsg = error.message || 'Failed to update next step. Please try again.';
            alert(errorMsg);
        }
    }

    toggleEditMode(isEditing) {
        this.isEditingCustomer = isEditing;
        this.renderCustomerDetail();
    }

    updateDetailActionButtons() {
        const editBtn = document.getElementById("edit-customer-btn");
        const saveBtn = document.getElementById("save-customer-btn");
        const cancelBtn = document.getElementById("cancel-edit-btn");

        if (editBtn) editBtn.style.display = this.isEditingCustomer ? "none" : "inline-flex";
        if (saveBtn) saveBtn.style.display = this.isEditingCustomer ? "inline-flex" : "none";
        if (cancelBtn) cancelBtn.style.display = this.isEditingCustomer ? "inline-flex" : "none";
    }

    async saveCustomerChanges() {
        if (!this.currentCustomer) return;

        try {
            // Collect form data with validation
            const companyName = document.getElementById("edit-company-name")?.value?.trim();
            if (!companyName) {
                alert('Company name is required.');
                return;
            }

            const updatedData = {
                company_name: companyName,
                status: document.getElementById("edit-status")?.value || this.currentCustomer.status,
                affiliate_partner: document.getElementById("edit-affiliate-partner")?.value || null,
                next_step: document.getElementById("edit-next-step")?.value?.trim() || null,
                physical_address: document.getElementById("edit-physical-address")?.value?.trim() || null,
                billing_address: document.getElementById("edit-billing-address")?.value?.trim() || null,
                primary_contact: {
                    name: document.getElementById("edit-primary-name")?.value?.trim() || null,
                    email: document.getElementById("edit-primary-email")?.value?.trim() || null,
                    phone: document.getElementById("edit-primary-phone")?.value?.trim() || null
                },
                authorized_signer: {
                    name: document.getElementById("edit-signer-name")?.value?.trim() || null,
                    email: document.getElementById("edit-signer-email")?.value?.trim() || null,
                    phone: null
                },
                billing_contact: {
                    name: document.getElementById("edit-billing-name")?.value?.trim() || null,
                    email: document.getElementById("edit-billing-email")?.value?.trim() || null,
                    phone: document.getElementById("edit-billing-phone")?.value?.trim() || null
                }
            };

            console.log('Saving customer data:', updatedData);

            // Save to API
            await this.api.updateCustomer(this.currentCustomerId, updatedData);
            
            // Update local data
            Object.assign(this.currentCustomer, updatedData);
            
            // Update customers list
            const customerIndex = this.customers.findIndex(c => c.customer_id === this.currentCustomerId);
            if (customerIndex >= 0) {
                Object.assign(this.customers[customerIndex], updatedData);
            }

            // Update filtered customers as well
            const filteredIndex = this.filteredCustomers.findIndex(c => c.customer_id === this.currentCustomerId);
            if (filteredIndex >= 0) {
                Object.assign(this.filteredCustomers[filteredIndex], updatedData);
            }

            console.log('Customer updated successfully');
            this.toggleEditMode(false);

        } catch (error) {
            console.error('Failed to save customer changes:', error);
            alert('Failed to save changes. Please try again.');
        }
    }

    async addNote() {
        const noteContent = document.getElementById("new-note-content")?.value.trim();
        if (!noteContent || !this.currentCustomer) return;

        try {
            const newNote = {
                content: noteContent,
                timestamp: new Date().toISOString()
            };

            // Add note to customer's notes array
            const currentNotes = this.currentCustomer.notes || [];
            const updatedNotes = [...currentNotes, newNote];

            // Update customer with new notes
            await this.api.updateCustomer(this.currentCustomerId, { notes: updatedNotes });

            // Update local data
            this.currentCustomer.notes = updatedNotes;
            
            // Update customers list
            const customerIndex = this.customers.findIndex(c => c.customer_id === this.currentCustomerId);
            if (customerIndex >= 0) {
                this.customers[customerIndex].notes = updatedNotes;
            }

            console.log('Note added successfully');
            
            // Clear input and re-render
            document.getElementById("new-note-content").value = '';
            this.renderCustomerDetail();

        } catch (error) {
            console.error('Failed to add note:', error);
            alert('Failed to add note. Please try again.');
        }
    }

    clearNewNote() {
        const noteInput = document.getElementById("new-note-content");
        if (noteInput) {
            noteInput.value = '';
            noteInput.focus();
        }
    }

    formatNoteTimestamp(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }) + ' at ' + date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }

    getStatusClass(status) {
        return "status-" + status.toLowerCase().replace(/\s+/g, "-");
    }

    showView(viewName) {
        // Hide all views
        document.querySelectorAll(".view").forEach((view) => view.classList.remove("active"));

        // Show selected view
        const targetView = document.getElementById(`${viewName}-view`);
        if (targetView) targetView.classList.add("active");

        // Update navigation
        document.querySelectorAll(".nav-btn").forEach((btn) => btn.classList.remove("active"));
        if (viewName === "dashboard") {
            const dashboardBtn = document.getElementById("dashboard-btn");
            if (dashboardBtn) dashboardBtn.classList.add("active");
        }

        // Clear any errors
        this.clearErrors();
    }

    bindEvents() {
        // Navigation
        const dashboardBtn = document.getElementById("dashboard-btn");
        if (dashboardBtn) {
            dashboardBtn.addEventListener("click", () => this.showView("dashboard"));
        }

        const addCustomerBtn = document.getElementById("add-customer-btn");
        if (addCustomerBtn) {
            addCustomerBtn.addEventListener("click", () => this.showAddCustomerForm());
        }

        const addFirstCustomer = document.getElementById("add-first-customer");
        if (addFirstCustomer) {
            addFirstCustomer.addEventListener("click", () => this.showAddCustomerForm());
        }

        // Back to dashboard
        const backBtn = document.getElementById("back-to-dashboard");
        if (backBtn) {
            backBtn.addEventListener("click", () => this.showView("dashboard"));
        }

        // Detail page edit controls
        const editBtn = document.getElementById("edit-customer-btn");
        if (editBtn) {
            editBtn.addEventListener("click", () => this.toggleEditMode(true));
        }

        const saveBtn = document.getElementById("save-customer-btn");
        if (saveBtn) {
            saveBtn.addEventListener("click", () => this.saveCustomerChanges());
        }

        const cancelBtn = document.getElementById("cancel-edit-btn");
        if (cancelBtn) {
            cancelBtn.addEventListener("click", () => this.toggleEditMode(false));
        }

        // Filter controls
        const statusFilter = document.getElementById("status-filter");
        if (statusFilter) {
            statusFilter.addEventListener("change", () => this.applyFilters());
        }

        const affiliateFilter = document.getElementById("affiliate-filter");
        if (affiliateFilter) {
            affiliateFilter.addEventListener("change", () => this.applyFilters());
        }

        const searchFilter = document.getElementById("search-filter");
        if (searchFilter) {
            searchFilter.addEventListener("input", () => this.applyFilters());
        }

        // Table sorting
        document.querySelectorAll("th[data-sort]").forEach(th => {
            th.addEventListener("click", () => {
                const sortKey = th.dataset.sort;
                this.sortTable(sortKey);
            });
        });
    }

    showAddCustomerForm() {
        this.showView("customer-form");
    }

    async showCustomerDetail(customerId) {
        try {
            this.currentCustomer = await this.api.getCustomer(customerId);
            this.currentCustomerId = customerId;

            if (!this.currentCustomer) {
                this.showError("customer-detail-error", "Customer not found.");
                return;
            }

            this.renderCustomerDetail();
            this.showView("customer-detail");

        } catch (error) {
            console.error("Failed to show customer detail:", error);
            this.showError("dashboard-error", "Failed to load customer details.");
        }
    }

    renderCustomerDetail() {
        const contentContainer = document.getElementById("customer-detail-content");
        if (!contentContainer || !this.currentCustomer) return;

        const customer = this.currentCustomer;
        const primaryContact = customer.primary_contact || {};
        const authorizedSigner = customer.authorized_signer || {};
        const billingContact = customer.billing_contact || {};
        const notes = customer.notes || [];
        const isEditing = this.editMode;

        const nextStepOptions = this.getNextStepOptions(customer.status);
        const nextStepOptionsHtml = nextStepOptions.map(option => 
            `<option value="${option}" ${customer.next_step === option ? 'selected' : ''}>${option}</option>`
        ).join('');

        contentContainer.innerHTML = `
            <div class="customer-detail-view">
                <div class="customer-detail-content">
                    <!-- Header with breadcrumb and edit button -->
                    <div class="detail-header">
                        <button class="back-btn" onclick="app.showView('dashboard')">← Back to Dashboard</button>
                        <div class="detail-actions">
                            <button class="btn btn-primary" onclick="app.toggleEditMode(!app.editMode)" id="edit-btn">
                                ${isEditing ? 'Cancel' : 'Edit'}
                            </button>
                            ${isEditing ? '<button class="btn btn-primary" onclick="app.saveCustomerChanges()">Save</button>' : ''}
                        </div>
                    </div>

                    <!-- General Information -->
                    <div class="detail-section">
                        <h3>General Information</h3>
                        <div class="detail-grid">
                            <div class="detail-field">
                                <label>Company Name</label>
                                <input type="text" id="edit-company-name" value="${this.escapeHtml(customer.company_name)}" ${isEditing ? '' : 'disabled'}>
                            </div>
                            <div class="detail-field">
                                <label>Status</label>
                                <select id="edit-status" ${isEditing ? '' : 'disabled'} onchange="app.updateNextStepOptions()">
                                    <option value="Lead" ${customer.status === 'Lead' ? 'selected' : ''}>Lead</option>
                                    <option value="Quoted" ${customer.status === 'Quoted' ? 'selected' : ''}>Quoted</option>
                                    <option value="Signed" ${customer.status === 'Signed' ? 'selected' : ''}>Signed</option>
                                    <option value="Onboarding" ${customer.status === 'Onboarding' ? 'selected' : ''}>Onboarding</option>
                                    <option value="Active" ${customer.status === 'Active' ? 'selected' : ''}>Active</option>
                                </select>
                            </div>
                            <div class="detail-field">
                                <label>Affiliate Partner</label>
                                <select id="edit-affiliate-partner" ${isEditing ? '' : 'disabled'}>
                                    <option value="">None</option>
                                    <option value="VOXO" ${customer.affiliate_partner === 'VOXO' ? 'selected' : ''}>VOXO</option>
                                </select>
                            </div>
                            <div class="detail-field">
                                <label>Next Step</label>
                                <select id="edit-next-step" ${isEditing ? '' : 'disabled'}>
                                    <option value="">Select Next Step</option>
                                    ${nextStepOptionsHtml}
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- Contact Information -->
                    <div class="detail-section">
                        <h3>Contact Information</h3>
                        <div class="detail-grid">
                            <div class="detail-field">
                                <label>Primary Contact Name</label>
                                <input type="text" id="edit-primary-name" value="${this.escapeHtml(primaryContact.name || '')}" ${isEditing ? '' : 'disabled'}>
                            </div>
                            <div class="detail-field">
                                <label>Primary Email</label>
                                <input type="email" id="edit-primary-email" value="${this.escapeHtml(primaryContact.email || '')}" ${isEditing ? '' : 'disabled'}>
                            </div>
                            <div class="detail-field">
                                <label>Primary Phone</label>
                                <input type="tel" id="edit-primary-phone" value="${this.escapeHtml(primaryContact.phone || '')}" ${isEditing ? '' : 'disabled'}>
                            </div>
                            <div class="detail-field">
                                <label>Authorized Signer Name</label>
                                <input type="text" id="edit-signer-name" value="${this.escapeHtml(authorizedSigner.name || '')}" ${isEditing ? '' : 'disabled'}>
                            </div>
                            <div class="detail-field">
                                <label>Signer Email</label>
                                <input type="email" id="edit-signer-email" value="${this.escapeHtml(authorizedSigner.email || '')}" ${isEditing ? '' : 'disabled'}>
                            </div>
                            <div class="detail-field">
                                <label>Billing Contact Name</label>
                                <input type="text" id="edit-billing-name" value="${this.escapeHtml(billingContact.name || '')}" ${isEditing ? '' : 'disabled'}>
                            </div>
                            <div class="detail-field">
                                <label>Billing Contact Email</label>
                                <input type="email" id="edit-billing-email" value="${this.escapeHtml(billingContact.email || '')}" ${isEditing ? '' : 'disabled'}>
                            </div>
                            <div class="detail-field">
                                <label>Billing Contact Phone</label>
                                <input type="tel" id="edit-billing-phone" value="${this.escapeHtml(billingContact.phone || '')}" ${isEditing ? '' : 'disabled'}>
                            </div>
                        </div>
                    </div>

                    <!-- Addresses -->
                    <div class="detail-section">
                        <h3>Addresses</h3>
                        <div class="detail-grid">
                            <div class="detail-field">
                                <label>Physical Address</label>
                                <textarea id="edit-physical-address" rows="3" ${isEditing ? '' : 'disabled'}>${this.escapeHtml(customer.physical_address || '')}</textarea>
                            </div>
                            <div class="detail-field">
                                <label>Billing Address</label>
                                <textarea id="edit-billing-address" rows="3" ${isEditing ? '' : 'disabled'}>${this.escapeHtml(customer.billing_address || '')}</textarea>
                            </div>
                        </div>
                    </div>

            <!-- Contact Information -->
            <div class="detail-section">
                <h3>Contact Information</h3>
                <div class="detail-grid">
                    <div class="detail-field">
                        <label>Primary Contact Name</label>
                        <input type="text" id="edit-primary-name" value="${this.escapeHtml(primaryContact.name || '')}" ${isEditing ? '' : 'disabled'}>
                    </div>
                    <div class="detail-field">
                        <label>Primary Email</label>
                        <input type="email" id="edit-primary-email" value="${this.escapeHtml(primaryContact.email || '')}" ${isEditing ? '' : 'disabled'}>
                    </div>
                    <div class="detail-field">
                        <label>Primary Phone</label>
                        <input type="tel" id="edit-primary-phone" value="${this.escapeHtml(primaryContact.phone || '')}" ${isEditing ? '' : 'disabled'}>
                    </div>
                    <div class="detail-field">
                        <label>Authorized Signer Name</label>
                        <input type="text" id="edit-signer-name" value="${this.escapeHtml(authorizedSigner.name || '')}" ${isEditing ? '' : 'disabled'}>
                    </div>
                    <div class="detail-field">
                        <label>Signer Email</label>
                        <input type="email" id="edit-signer-email" value="${this.escapeHtml(authorizedSigner.email || '')}" ${isEditing ? '' : 'disabled'}>
                    </div>
                    <div class="detail-field">
                        <label>Billing Contact Name</label>
                        <input type="text" id="edit-billing-name" value="${this.escapeHtml(billingContact.name || '')}" ${isEditing ? '' : 'disabled'}>
                    </div>
                    <div class="detail-field">
                        <label>Billing Contact Email</label>
                        <input type="email" id="edit-billing-email" value="${this.escapeHtml(billingContact.email || '')}" ${isEditing ? '' : 'disabled'}>
                    </div>
                    <div class="detail-field">
                        <label>Billing Contact Phone</label>
                        <input type="tel" id="edit-billing-phone" value="${this.escapeHtml(billingContact.phone || '')}" ${isEditing ? '' : 'disabled'}>
                    </div>
                </div>
            </div>

            <!-- Addresses -->
            <div class="detail-section">
                <h3>Addresses</h3>
                <div class="detail-grid">
                    <div class="detail-field">
                        <label>Physical Address</label>
                        <textarea id="edit-physical-address" rows="3" ${isEditing ? '' : 'disabled'}>${this.escapeHtml(customer.physical_address || '')}</textarea>
                    </div>
                    <div class="detail-field">
                        <label>Billing Address</label>
                        <textarea id="edit-billing-address" rows="3" ${isEditing ? '' : 'disabled'}>${this.escapeHtml(customer.billing_address || '')}</textarea>
                    </div>
                </div>
            </div>

                    <!-- Notes -->
                    <div class="detail-section">
                        <h3>Notes</h3>
                        <div class="notes-section">
                            <div class="notes-list">
                                ${notes.length > 0 ? notes
                                    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                                    .map(note => `
                                        <div class="note-item">
                                            <div class="note-meta">${this.formatNoteTimestamp(note.timestamp)}</div>
                                            <div class="note-content">${this.escapeHtml(note.content)}</div>
                                        </div>
                                    `).join('') : '<p style="color: #6c757d; text-align: center; padding: 24px;">No notes available.</p>'}
                            </div>
                            
                            ${isEditing ? `
                                <div class="add-note-section">
                                    <h4>Add New Note</h4>
                                    <div class="note-input-group">
                                        <textarea id="new-note-content" class="note-input" placeholder="Enter your note here..."></textarea>
                                        <div class="note-actions">
                                            <button class="btn btn-outline btn-sm" onclick="app.clearNewNote()">Clear</button>
                                            <button class="btn btn-primary btn-sm" onclick="app.addNote()">Add Note</button>
                                        </div>
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    </div>

                    <!-- Actions -->
                    <div class="detail-section">
                        <h3>Actions</h3>
                        <div class="actions-section">
                            <button class="btn btn-primary" onclick="app.createInQBO('${customer.customer_id}')">Create in QuickBooks</button>
                            <button class="btn btn-primary" onclick="app.sendAgreement('${customer.customer_id}')">Send Agreement</button>
                        </div>
                    </div>

                    <!-- Files & Media Placeholder -->
                    <div class="detail-section">
                        <h3>Files & Media</h3>
                        <div class="placeholder-section">
                            You'll be able to upload files and photos here in a future update.
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Update detail action buttons based on edit mode
        this.updateDetailActionButtons();
    }

    updateNextStepOptions() {
        const statusSelect = document.getElementById('edit-status');
        const nextStepSelect = document.getElementById('edit-next-step');
        
        if (!statusSelect || !nextStepSelect) return;
        
        const selectedStatus = statusSelect.value;
        const nextStepOptions = this.getNextStepOptions(selectedStatus);
        
        // Clear current options
        nextStepSelect.innerHTML = '<option value="">Select Next Step</option>';
        
        // Add new options
        nextStepOptions.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = option;
            nextStepSelect.appendChild(optionElement);
        });
    }

    clearNewNote() {
        const noteInput = document.getElementById('new-note-content');
        if (noteInput) {
            noteInput.value = '';
        }
    }

    async addNote() {
        const noteInput = document.getElementById('new-note-content');
        if (!noteInput || !this.currentCustomer) return;

        const noteContent = noteInput.value.trim();
        if (!noteContent) {
            alert('Please enter a note before adding.');
            return;
        }

        try {
            const newNote = {
                content: noteContent,
                timestamp: new Date().toISOString()
            };

            const updatedNotes = [...(this.currentCustomer.notes || []), newNote];
            
            await this.api.updateCustomer(this.currentCustomer.customer_id, {
                notes: updatedNotes
            });

            // Update local data
            this.currentCustomer.notes = updatedNotes;
            
            // Re-render the detail view
            this.renderCustomerDetail();

            console.log('Note added successfully');
        } catch (error) {
            console.error('Failed to add note:', error);
            alert('Failed to add note. Please try again.');
        }
    }

    createInQBO(customerId) {
        const customer = this.customers.find(c => c.customer_id === customerId);
        if (!customer) return;
        
        alert(`QuickBooks integration coming soon!\n\nWould create customer: ${customer.company_name}`);
    }

    sendAgreement(customerId) {
        const customer = this.customers.find(c => c.customer_id === customerId);
        if (!customer) return;
        
        alert(`DocuSign integration coming soon!\n\nWould send service agreement to: ${customer.company_name}`);
    }

    showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.innerHTML = `<p style="color: red; font-weight: bold;">${message}</p>`;
            errorElement.style.display = "block";
        }
        console.error(`Error in ${elementId}:`, message);
    }

    clearErrors() {
        document.querySelectorAll("[id$='-error']").forEach((element) => {
            element.style.display = "none";
            element.innerHTML = "";
        });
    }

    escapeHtml(text) {
        if (typeof text !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Environment detection
function detectEnvironment() {
    const env = {
        isIframe: window !== window.top,
        isReplit: window.location.hostname.includes('replit') || window.location.hostname.includes('repl.co'),
        userAgent: navigator.userAgent,
        url: window.location.href,
        referrer: document.referrer
    };
    
    console.log('=== ENVIRONMENT DETECTION ===');
    console.log('Environment details:', env);
    console.log('Is iframe:', env.isIframe);
    console.log('Is Replit:', env.isReplit);
    
    return env;
}

// Initialize the app when the page loads
let app;
document.addEventListener("DOMContentLoaded", () => {
    console.log('=== DOM LOADED ===');
    
    // Detect environment issues
    const env = detectEnvironment();
    
    console.log('Available elements in DOM:');
    console.log('- customer-list:', !!document.getElementById('customer-list'));
    console.log('- empty-state:', !!document.getElementById('empty-state'));
    console.log('- dashboard-loading:', !!document.getElementById('dashboard-loading'));
    console.log('- dashboard-error:', !!document.getElementById('dashboard-error'));
    
    // Add environment info to page for debugging
    const debugInfo = document.createElement('div');
    debugInfo.id = 'debug-info';
    debugInfo.style.cssText = 'position: fixed; top: 0; right: 0; background: rgba(0,0,0,0.8); color: white; padding: 10px; font-size: 12px; z-index: 9999; max-width: 300px;';
    debugInfo.innerHTML = `
        <strong>Debug Info:</strong><br>
        Iframe: ${env.isIframe}<br>
        Replit: ${env.isReplit}<br>
        URL: ${window.location.hostname}<br>
        <button onclick="window.debugApp && window.debugApp.loadCustomers()" style="margin-top: 5px;">Reload Customers</button>
        <button onclick="this.parentElement.style.display='none'" style="margin-top: 5px;">Hide</button>
    `;
    document.body.appendChild(debugInfo);
    
    console.log('Creating CRM app instance...');
    app = new CRMApp();
    
    // Make app globally accessible for debugging
    window.debugApp = app;
    console.log('App instance created and available as window.debugApp');
    
    // Additional debugging for iframe environments
    if (env.isIframe) {
        console.log('IFRAME DETECTED - Adding fallback measures');
        
        // Add a delay for iframe rendering
        setTimeout(() => {
            console.log('Iframe fallback: Re-checking DOM after delay');
            if (app && app.customers && app.customers.length > 0) {
                console.log('Iframe fallback: Re-rendering customers');
                app.renderCustomerList();
            }
        }, 1000);
    }
});