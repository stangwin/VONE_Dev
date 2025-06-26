// Database API client
class DatabaseAPI {
    constructor() {
        this.baseURL = '/api';
        this.currentUser = null;
    }

    async checkAuth() {
        try {
            const response = await fetch(`${this.baseURL}/auth/me`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                const result = await response.json();
                this.currentUser = result.user;
                return result.user;
            } else {
                this.currentUser = null;
                window.location.href = '/auth.html';
                return null;
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            this.currentUser = null;
            window.location.href = '/auth.html';
            return null;
        }
    }

    async logout() {
        try {
            await fetch(`${this.baseURL}/auth/logout`, {
                method: 'POST',
                credentials: 'include'
            });
            this.currentUser = null;
            window.location.href = '/auth.html';
        } catch (error) {
            console.error('Logout failed:', error);
        }
    }

    async getCustomers() {
        try {
            console.log('DatabaseAPI: Making fetch request to', `${this.baseURL}/customers`);
            console.log('Current window location:', window.location.href);
            
            const response = await fetch(`${this.baseURL}/customers`, {
                credentials: 'include'
            });
            
            console.log('DatabaseAPI: Response status:', response.status);
            console.log('DatabaseAPI: Response ok:', response.ok);
            console.log('DatabaseAPI: Response headers:', Object.fromEntries(response.headers.entries()));
            
            if (response.status === 401) {
                console.log('User not authenticated, redirecting to auth page...');
                window.location.href = '/auth.html';
                return [];
            }
            
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

    // File management methods
    async uploadFiles(customerId, files) {
        try {
            const formData = new FormData();
            
            console.log('Creating FormData with', files.length, 'files');
            for (let i = 0; i < files.length; i++) {
                console.log('Adding file:', files[i].name, 'size:', files[i].size);
                formData.append('files', files[i]);
            }

            console.log('Sending upload request to:', `${this.baseURL}/customers/${customerId}/files`);
            const response = await fetch(`${this.baseURL}/customers/${customerId}/files`, {
                method: 'POST',
                body: formData
            });

            console.log('Upload response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Upload error response:', errorText);
                let error;
                try {
                    error = JSON.parse(errorText);
                } catch {
                    error = { error: errorText };
                }
                throw new Error(error.error || 'Failed to upload files');
            }

            const result = await response.json();
            console.log('Upload successful:', result);
            return result;
        } catch (error) {
            console.error('Error uploading files:', error);
            throw error;
        }
    }

    async getCustomerFiles(customerId) {
        try {
            console.log('Fetching files from:', `${this.baseURL}/customers/${customerId}/files`);
            const response = await fetch(`${this.baseURL}/customers/${customerId}/files`);
            
            console.log('Files response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Files fetch error response:', errorText);
                let error;
                try {
                    error = JSON.parse(errorText);
                } catch {
                    error = { error: errorText };
                }
                throw new Error(error.error || 'Failed to fetch files');
            }

            const files = await response.json();
            console.log('Files fetched successfully:', files);
            return files;
        } catch (error) {
            console.error('Error fetching files:', error);
            throw error;
        }
    }

    async deleteFile(customerId, fileId) {
        try {
            console.log('Deleting file:', fileId, 'for customer:', customerId);
            const response = await fetch(`${this.baseURL}/customers/${customerId}/files/${fileId}`, {
                method: 'DELETE'
            });

            console.log('Delete response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Delete error response:', errorText);
                let error;
                try {
                    error = JSON.parse(errorText);
                } catch {
                    error = { error: errorText };
                }
                throw new Error(error.error || 'Failed to delete file');
            }

            const result = await response.json();
            console.log('File deleted successfully:', result);
            return result;
        } catch (error) {
            console.error('Error deleting file:', error);
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
        this.currentUser = null;
        this.sortConfig = { key: null, direction: 'asc' };
        this.editingSections = new Set();
        this.filters = { status: '', affiliate: '', search: '' };
        this.isEditingCustomer = false;
        this.editingSections = new Set(); // Track which sections are in edit mode
        this.init();
    }

    async init() {
        console.log('=== CRM INIT DEBUG START ===');
        
        try {
            console.log('Step 1: CRM App starting initialization...');
            
            console.log('Step 2: Loading user data...');
            await this.loadUserData();
            
            console.log('Step 3: Loading customers...');
            await this.loadCustomers();
            
            console.log('Step 4: Binding events...');
            this.bindEvents();
            
            console.log('Step 5: Showing dashboard view...');
            this.showView("dashboard");
            
            console.log("=== CRM INIT SUCCESSFUL ===");
        } catch (error) {
            console.error("CRITICAL: Failed to initialize app:", error);
            console.error("Error stack:", error.stack);
            this.showError("dashboard-error", "Failed to load application data.");
        }
    }

    async loadUserData() {
        try {
            const response = await fetch('/api/user', {
                credentials: 'include'
            });

            if (!response.ok) {
                console.log('User not authenticated, redirecting to auth page...');
                // Prevent infinite redirect loop in iframe
                if (window.location.pathname !== '/auth.html') {
                    window.location.href = '/auth.html';
                }
                return;
            }

            this.currentUser = await response.json();
            this.updateUserUI();
        } catch (error) {
            console.error('Failed to load user data:', error);
            // Prevent infinite redirect loop in iframe
            if (window.location.pathname !== '/auth.html') {
                window.location.href = '/auth.html';
            }
        }
    }

    updateUserUI() {
        const userNameElement = document.getElementById('user-name');
        const manageUsersLink = document.getElementById('manage-users');
        
        if (userNameElement && this.currentUser) {
            userNameElement.textContent = this.currentUser.name;
        }
        
        if (manageUsersLink && this.currentUser) {
            if (this.currentUser.role === 'admin') {
                manageUsersLink.style.display = 'block';
            } else {
                manageUsersLink.style.display = 'none';
            }
        }
    }

    showUserProfile() {
        if (!this.currentUser) return;
        
        document.getElementById('profile-name').value = this.currentUser.name;
        document.getElementById('profile-email').value = this.currentUser.email;
        document.getElementById('profile-role').value = this.currentUser.role;
        
        this.update2FAStatus();
        document.getElementById('user-profile-modal').style.display = 'flex';
    }

    closeUserProfile() {
        document.getElementById('user-profile-modal').style.display = 'none';
    }

    update2FAStatus() {
        const statusEl = document.getElementById('profile-2fa-status');
        const statusText = statusEl.querySelector('.status-text');
        const enableBtn = document.getElementById('enable-profile-2fa-btn');
        const disableBtn = document.getElementById('disable-profile-2fa-btn');

        if (this.currentUser.twoFactorEnabled) {
            statusEl.className = 'status-indicator enabled';
            statusText.textContent = 'Enabled';
            enableBtn.style.display = 'none';
            disableBtn.style.display = 'inline-block';
        } else {
            statusEl.className = 'status-indicator disabled';
            statusText.textContent = 'Disabled';
            enableBtn.style.display = 'inline-block';
            disableBtn.style.display = 'none';
        }
    }

    async enable2FA() {
        document.getElementById('setup-2fa-modal').style.display = 'flex';
        document.getElementById('password-verification-section').style.display = 'block';
        document.getElementById('qr-setup-section').style.display = 'none';
    }

    close2FASetup() {
        document.getElementById('setup-2fa-modal').style.display = 'none';
        document.getElementById('verify-password').value = '';
        document.getElementById('profile-verify-token').value = '';
    }

    async verifyPasswordFor2FA() {
        const password = document.getElementById('verify-password').value;
        if (!password) {
            this.showError('main-error', 'Please enter your password');
            return;
        }

        try {
            const response = await this.api.setup2FA(password);
            
            document.getElementById('password-verification-section').style.display = 'none';
            document.getElementById('qr-setup-section').style.display = 'block';
            
            document.getElementById('profile-qr-code').src = response.qrCode;
            document.getElementById('profile-manual-key').textContent = response.manualEntryKey;
            
        } catch (error) {
            this.showError('main-error', 'Invalid password. Please try again.');
        }
    }

    async complete2FASetup() {
        const token = document.getElementById('profile-verify-token').value;
        if (!token || token.length !== 6) {
            this.showError('main-error', 'Please enter a valid 6-digit code');
            return;
        }

        try {
            await this.api.enable2FA(token);
            this.showError('main-error', '2FA enabled successfully!', 'success');
            
            await this.loadUserData();
            this.update2FAStatus();
            this.close2FASetup();
        } catch (error) {
            this.showError('main-error', 'Invalid verification code. Please try again.');
        }
    }

    disable2FA() {
        document.getElementById('disable-2fa-modal').style.display = 'flex';
    }

    closeDisable2FA() {
        document.getElementById('disable-2fa-modal').style.display = 'none';
        document.getElementById('disable-verify-token').value = '';
    }

    async confirmDisable2FA() {
        const token = document.getElementById('disable-verify-token').value;
        if (!token || token.length !== 6) {
            this.showError('main-error', 'Please enter a valid 6-digit code');
            return;
        }

        try {
            await this.api.disable2FA(token);
            this.showError('main-error', '2FA disabled successfully!', 'success');
            
            await this.loadUserData();
            this.update2FAStatus();
            this.closeDisable2FA();
        } catch (error) {
            this.showError('main-error', 'Invalid verification code. Please try again.');
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

        // Show selected view - handle both naming conventions
        let targetView = document.getElementById(`${viewName}-view`);
        if (!targetView) {
            targetView = document.getElementById(viewName);
        }
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

        // User dropdown events
        this.setupUserDropdown();

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

    setupUserDropdown() {
        const userAvatar = document.getElementById('user-avatar');
        const userDropdown = document.querySelector('.user-dropdown');
        const logoutBtn = document.getElementById('logout-btn');

        if (userAvatar) {
            userAvatar.addEventListener('click', (e) => {
                e.stopPropagation();
                userDropdown.classList.toggle('open');
            });
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (userDropdown && !userDropdown.contains(e.target)) {
                userDropdown.classList.remove('open');
            }
        });

        // Handle logout
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                await this.logout();
            });
        }
    }

    async logout() {
        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });

            // Clear any local state regardless of server response
            this.currentUser = null;
            this.customers = [];
            this.filteredCustomers = [];
            
            // Always redirect to login page
            window.location.href = '/auth.html';
        } catch (error) {
            console.error('Logout error:', error);
            // Still redirect on error
            window.location.href = '/auth.html';
        }
    }

    showAddCustomerForm() {
        this.showView("customer-form");
    }

    async showCustomerDetail(customerId) {
        try {
            console.log("showCustomerDetail called with:", customerId);
            this.currentCustomer = await this.api.getCustomer(customerId);
            this.currentCustomerId = customerId;
            console.log("Customer loaded:", this.currentCustomer);

            if (!this.currentCustomer) {
                this.showError("customer-detail-error", "Customer not found.");
                return;
            }

            // Initialize edit mode
            this.editMode = false;
            
            this.showView("customer-detail");
            console.log("View switched to customer-detail");
            
            // Small delay to ensure DOM is ready
            setTimeout(() => {
                this.renderCustomerDetail();
            }, 100);

        } catch (error) {
            console.error("Failed to show customer detail:", error);
            this.showError("dashboard-error", "Failed to load customer details.");
        }
    }

    renderCustomerDetail() {
        console.log("renderCustomerDetail called");
        const contentContainer = document.getElementById("customer-detail-content");
        console.log("contentContainer:", contentContainer);
        console.log("currentCustomer:", this.currentCustomer);
        
        if (!contentContainer || !this.currentCustomer) {
            console.log("Early return: missing container or customer");
            return;
        }

        const customer = this.currentCustomer;
        const primaryContact = customer.primary_contact || {};
        const authorizedSigner = customer.authorized_signer || {};
        const billingContact = customer.billing_contact || {};
        // Load customer notes from the new API
        let notes = [];
        // Notes will be loaded asynchronously after render
        const isEditing = this.editMode || false;

        console.log("About to get next step options for status:", customer.status);
        const nextStepOptions = this.getNextStepOptions(customer.status);
        console.log("Next step options:", nextStepOptions);
        
        const nextStepOptionsHtml = nextStepOptions.map(option => 
            `<option value="${option}" ${customer.next_step === option ? 'selected' : ''}>${option}</option>`
        ).join('');

        contentContainer.innerHTML = `
            <div class="customer-detail-view">
                <div class="customer-detail-content">
                    <!-- Header with breadcrumb -->
                    <div class="detail-header">
                        <button class="back-btn" onclick="app.showView('dashboard')">← Back to Dashboard</button>
                        <h1>${this.escapeHtml(customer.company_name)}</h1>
                    </div>

                    <!-- General Information -->
                    <div class="detail-section" id="general-section">
                        <div class="section-header">
                            <h3>General Information</h3>
                            <button class="section-edit-btn" onclick="app.toggleSectionEdit('general')" id="general-edit-btn">
                                ${this.editingSections.has('general') ? '✕' : '✏️'}
                            </button>
                        </div>
                        <div class="detail-grid">
                            <div class="detail-field">
                                <label>Company Name</label>
                                ${this.editingSections.has('general') ? 
                                    `<input type="text" id="edit-company-name" value="${this.escapeHtml(customer.company_name)}">` :
                                    `<span class="field-value">${this.escapeHtml(customer.company_name)}</span>`
                                }
                            </div>
                            <div class="detail-field">
                                <label>Status</label>
                                ${this.editingSections.has('general') ? 
                                    `<select id="edit-status" onchange="app.updateNextStepOptions()">
                                        <option value="Lead" ${customer.status === 'Lead' ? 'selected' : ''}>Lead</option>
                                        <option value="Quoted" ${customer.status === 'Quoted' ? 'selected' : ''}>Quoted</option>
                                        <option value="Signed" ${customer.status === 'Signed' ? 'selected' : ''}>Signed</option>
                                        <option value="Onboarding" ${customer.status === 'Onboarding' ? 'selected' : ''}>Onboarding</option>
                                        <option value="Active" ${customer.status === 'Active' ? 'selected' : ''}>Active</option>
                                    </select>` :
                                    `<span class="field-value status-badge ${customer.status?.toLowerCase()}">${this.escapeHtml(customer.status)}</span>`
                                }
                            </div>
                            <div class="detail-field">
                                <label>Affiliate Partner</label>
                                ${this.editingSections.has('general') ? 
                                    `<select id="edit-affiliate-partner">
                                        <option value="">None</option>
                                        <option value="VOXO" ${customer.affiliate_partner === 'VOXO' ? 'selected' : ''}>VOXO</option>
                                    </select>` :
                                    `<span class="field-value">${this.escapeHtml(customer.affiliate_partner) || 'None'}</span>`
                                }
                            </div>
                            <div class="detail-field">
                                <label>Next Step</label>
                                ${this.editingSections.has('general') ? 
                                    `<select id="edit-next-step">
                                        <option value="">Select Next Step</option>
                                        ${nextStepOptionsHtml}
                                    </select>` :
                                    `<span class="field-value">${this.escapeHtml(customer.next_step) || 'None'}</span>`
                                }
                            </div>
                        </div>
                        ${this.editingSections.has('general') ? 
                            `<div class="section-actions">
                                <button class="btn btn-primary btn-sm" onclick="app.saveSectionChanges('general')">Save</button>
                                <button class="btn btn-secondary btn-sm" onclick="app.cancelSectionEdit('general')">Cancel</button>
                            </div>` : 
                            ''
                        }
                    </div>

                    <!-- Contact Information -->
                    <div class="detail-section" id="contact-section">
                        <div class="section-header">
                            <h3>Contact Information</h3>
                            <button class="section-edit-btn" onclick="app.toggleSectionEdit('contact')" id="contact-edit-btn">
                                ${this.editingSections.has('contact') ? '✕' : '✏️'}
                            </button>
                        </div>
                        <div class="detail-grid">
                            <div class="detail-field full-width">
                                <label>Physical Address</label>
                                ${this.editingSections.has('contact') ? 
                                    `<textarea id="edit-physical-address" rows="3">${this.escapeHtml(customer.physical_address) || ''}</textarea>` :
                                    `<span class="field-value">${this.escapeHtml(customer.physical_address) || 'Not provided'}</span>`
                                }
                            </div>
                            <div class="detail-field full-width">
                                <label>Billing Address</label>
                                ${this.editingSections.has('contact') ? 
                                    `<textarea id="edit-billing-address" rows="3">${this.escapeHtml(customer.billing_address) || ''}</textarea>` :
                                    `<span class="field-value">${this.escapeHtml(customer.billing_address) || 'Not provided'}</span>`
                                }
                            </div>
                        </div>
                        ${this.editingSections.has('contact') ? 
                            `<div class="section-actions">
                                <button class="btn btn-primary btn-sm" onclick="app.saveSectionChanges('contact')">Save</button>
                                <button class="btn btn-secondary btn-sm" onclick="app.cancelSectionEdit('contact')">Cancel</button>
                            </div>` : 
                            ''
                        }
                    </div>

                    <!-- Primary Contact -->
                    <div class="detail-section" id="primary-contact-section">
                        <div class="section-header">
                            <h3>Primary Contact</h3>
                            <button class="section-edit-btn" onclick="app.toggleSectionEdit('primary-contact')" id="primary-contact-edit-btn">
                                ${this.editingSections.has('primary-contact') ? '✕' : '✏️'}
                            </button>
                        </div>
                        <div class="detail-grid">
                            <div class="detail-field">
                                <label>Name</label>
                                ${this.editingSections.has('primary-contact') ? 
                                    `<input type="text" id="edit-primary-name" value="${this.escapeHtml(primaryContact.name) || ''}">` :
                                    `<span class="field-value">${this.escapeHtml(primaryContact.name) || 'Not provided'}</span>`
                                }
                            </div>
                            <div class="detail-field">
                                <label>Email</label>
                                ${this.editingSections.has('primary-contact') ? 
                                    `<input type="email" id="edit-primary-email" value="${this.escapeHtml(primaryContact.email) || ''}">` :
                                    `<span class="field-value">${this.escapeHtml(primaryContact.email) || 'Not provided'}</span>`
                                }
                            </div>
                            <div class="detail-field">
                                <label>Phone</label>
                                ${this.editingSections.has('primary-contact') ? 
                                    `<input type="tel" id="edit-primary-phone" value="${this.escapeHtml(primaryContact.phone) || ''}">` :
                                    `<span class="field-value">${this.escapeHtml(primaryContact.phone) || 'Not provided'}</span>`
                                }
                            </div>
                        </div>
                        ${this.editingSections.has('primary-contact') ? 
                            `<div class="section-actions">
                                <button class="btn btn-primary btn-sm" onclick="app.saveSectionChanges('primary-contact')">Save</button>
                                <button class="btn btn-secondary btn-sm" onclick="app.cancelSectionEdit('primary-contact')">Cancel</button>
                            </div>` : 
                            ''
                        }
                    </div>

                    <!-- Authorized Signer -->
                    <div class="detail-section" id="authorized-signer-section">
                        <div class="section-header">
                            <h3>Authorized Signer</h3>
                            <button class="section-edit-btn" onclick="app.toggleSectionEdit('authorized-signer')" id="authorized-signer-edit-btn">
                                ${this.editingSections.has('authorized-signer') ? '✕' : '✏️'}
                            </button>
                        </div>
                        <div class="detail-grid">
                            <div class="detail-field">
                                <label>Name</label>
                                ${this.editingSections.has('authorized-signer') ? 
                                    `<input type="text" id="edit-signer-name" value="${this.escapeHtml(authorizedSigner.name) || ''}">` :
                                    `<span class="field-value">${this.escapeHtml(authorizedSigner.name) || 'Not provided'}</span>`
                                }
                            </div>
                            <div class="detail-field">
                                <label>Email</label>
                                ${this.editingSections.has('authorized-signer') ? 
                                    `<input type="email" id="edit-signer-email" value="${this.escapeHtml(authorizedSigner.email) || ''}">` :
                                    `<span class="field-value">${this.escapeHtml(authorizedSigner.email) || 'Not provided'}</span>`
                                }
                            </div>
                            <div class="detail-field">
                                <label>Phone</label>
                                ${this.editingSections.has('authorized-signer') ? 
                                    `<input type="tel" id="edit-signer-phone" value="${this.escapeHtml(authorizedSigner.phone) || ''}">` :
                                    `<span class="field-value">${this.escapeHtml(authorizedSigner.phone) || 'Not provided'}</span>`
                                }
                            </div>
                        </div>
                        ${this.editingSections.has('authorized-signer') ? 
                            `<div class="section-actions">
                                <button class="btn btn-primary btn-sm" onclick="app.saveSectionChanges('authorized-signer')">Save</button>
                                <button class="btn btn-secondary btn-sm" onclick="app.cancelSectionEdit('authorized-signer')">Cancel</button>
                            </div>` : 
                            ''
                        }
                    </div>

                    <!-- Billing Contact -->
                    <div class="detail-section" id="billing-contact-section">
                        <div class="section-header">
                            <h3>Billing Contact</h3>
                            <button class="section-edit-btn" onclick="app.toggleSectionEdit('billing-contact')" id="billing-contact-edit-btn">
                                ${this.editingSections.has('billing-contact') ? '✕' : '✏️'}
                            </button>
                        </div>
                        <div class="detail-grid">
                            <div class="detail-field">
                                <label>Name</label>
                                ${this.editingSections.has('billing-contact') ? 
                                    `<input type="text" id="edit-billing-name" value="${this.escapeHtml(billingContact.name) || ''}">` :
                                    `<span class="field-value">${this.escapeHtml(billingContact.name) || 'Not provided'}</span>`
                                }
                            </div>
                            <div class="detail-field">
                                <label>Email</label>
                                ${this.editingSections.has('billing-contact') ? 
                                    `<input type="email" id="edit-billing-email" value="${this.escapeHtml(billingContact.email) || ''}">` :
                                    `<span class="field-value">${this.escapeHtml(billingContact.email) || 'Not provided'}</span>`
                                }
                            </div>
                            <div class="detail-field">
                                <label>Phone</label>
                                ${this.editingSections.has('billing-contact') ? 
                                    `<input type="tel" id="edit-billing-phone" value="${this.escapeHtml(billingContact.phone) || ''}">` :
                                    `<span class="field-value">${this.escapeHtml(billingContact.phone) || 'Not provided'}</span>`
                                }
                            </div>
                        </div>
                        ${this.editingSections.has('billing-contact') ? 
                            `<div class="section-actions">
                                <button class="btn btn-primary btn-sm" onclick="app.saveSectionChanges('billing-contact')">Save</button>
                                <button class="btn btn-secondary btn-sm" onclick="app.cancelSectionEdit('billing-contact')">Cancel</button>
                            </div>` : 
                            ''
                        }
                    </div>

                    <!-- Notes -->
                    <div class="detail-section" id="notes-section" data-section="notes">
                        <div class="section-header">
                            <h3>Notes</h3>
                            <button class="section-edit-btn" onclick="app.toggleSectionEdit('notes')" id="notes-edit-btn">
                                ${this.editingSections.has('notes') ? '✕' : '✏️'}
                            </button>
                        </div>
                        <div class="notes-section">
                            <div class="notes-list">
                                <!-- Notes will be loaded here dynamically -->
                            </div>
                            
                            ${this.editingSections.has('notes') ? `
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
                        ${this.editingSections.has('notes') ? 
                            `<div class="section-actions">
                                <button class="btn btn-primary btn-sm" onclick="app.saveSectionChanges('notes')">Done</button>
                                <button class="btn btn-secondary btn-sm" onclick="app.cancelSectionEdit('notes')">Cancel</button>
                            </div>` : 
                            ''
                        }
                    </div>

                    <!-- Actions -->
                    <div class="detail-section">
                        <h3>Actions</h3>
                        <div class="actions-section">
                            <button class="btn btn-primary" onclick="app.createInQBO('${customer.customer_id}')">Create in QuickBooks</button>
                            <button class="btn btn-primary" onclick="app.sendAgreement('${customer.customer_id}')">Send Agreement</button>
                        </div>
                    </div>

                    <!-- Files & Media -->
                    <div class="detail-section" id="files-section">
                        <div class="section-header">
                            <h3>Files & Media</h3>
                            <button class="section-edit-btn" onclick="app.toggleSectionEdit('files')" id="files-edit-btn">
                                ${this.editingSections.has('files') ? '✕' : '✏️'}
                            </button>
                        </div>
                        <div class="files-section">
                            ${this.editingSections.has('files') ? `
                                <div class="file-upload-section">
                                    <div class="upload-dropzone" id="upload-dropzone">
                                        <input type="file" id="file-input" multiple accept="image/*,.pdf" style="display: none;">
                                        <div class="upload-text">
                                            <p>Drop files here or click to upload</p>
                                            <p class="upload-hint">Images and PDFs only, max 5MB per file</p>
                                        </div>
                                    </div>
                                </div>
                            ` : ''}
                            <div class="files-grid" id="files-grid">
                                <!-- Files will be loaded here -->
                            </div>
                        </div>
                        ${this.editingSections.has('files') ? 
                            `<div class="section-actions">
                                <button class="btn btn-primary btn-sm" onclick="app.saveSectionChanges('files')">Done</button>
                                <button class="btn btn-secondary btn-sm" onclick="app.cancelSectionEdit('files')">Cancel</button>
                            </div>` : 
                            ''
                        }
                    </div>
                </div>
            </div>
        `;

        console.log("Customer detail HTML generated, setting innerHTML");
        
        // Load customer files and notes asynchronously
        this.loadCustomerFiles();
        this.loadCustomerNotes();
        
        // Setup file upload functionality after render
        setTimeout(() => {
            this.setupFileUpload();
        }, 100);
        
        // Update detail action buttons based on edit mode
        this.updateDetailActionButtons();
    }

    async loadCustomerFiles() {
        if (!this.currentCustomer) {
            console.log('No current customer, skipping file load');
            return;
        }

        console.log('Loading files for customer:', this.currentCustomer.customer_id);
        try {
            const files = await this.api.getCustomerFiles(this.currentCustomer.customer_id);
            console.log('Files loaded successfully:', files);
            this.renderFilesGrid(files);
        } catch (error) {
            console.error('Failed to load customer files:', error);
            console.error('Error details:', error.message, error.stack);
        }
    }

    async loadCustomerNotes() {
        if (!this.currentCustomer) {
            console.log('No current customer, skipping notes load');
            return;
        }

        console.log('Loading notes for customer:', this.currentCustomer.customer_id);
        try {
            const notes = await this.api.getCustomerNotes(this.currentCustomer.customer_id);
            console.log('Notes loaded successfully:', notes);
            this.renderNotesSection(notes);
        } catch (error) {
            console.error('Failed to load customer notes:', error);
            // Show empty notes section if loading fails
            this.renderNotesSection([]);
        }
    }

    renderNotesSection(notes) {
        const notesSection = document.querySelector('#notes-section .notes-list');
        if (!notesSection) return;

        if (notes.length === 0) {
            notesSection.innerHTML = '<p style="color: #6c757d; text-align: center; padding: 24px;">No notes available.</p>';
            return;
        }

        const notesHtml = notes.map(note => `
            <div class="note-item ${note.type === 'system' ? 'system-note' : 'manual-note'}">
                <div class="note-meta">
                    ${this.formatNoteTimestamp(note.timestamp)}
                    ${note.author_name ? ` by ${note.author_name}` : ''}
                    ${note.type === 'system' ? ' <span class="system-indicator">🤖 System</span>' : ''}
                </div>
                <div class="note-content">${this.escapeHtml(note.content)}</div>
                ${note.type === 'manual' && this.currentUser && (this.currentUser.role === 'admin' || note.author_id === this.currentUser.id) && this.editingSections.has('notes') ? 
                    `<div class="note-actions">
                        <button class="btn-sm btn-danger" onclick="app.deleteNote(${note.id})">Delete</button>
                    </div>` : ''
                }
            </div>
        `).join('');

        notesSection.innerHTML = notesHtml;
    }

    renderFilesGrid(files) {
        const filesGrid = document.getElementById('files-grid');
        if (!filesGrid) return;

        if (files.length === 0) {
            filesGrid.innerHTML = '<p class="no-files">No files uploaded yet.</p>';
            return;
        }

        const filesHtml = files.map(file => {
            const isImage = file.file_type.startsWith('image/');
            const fileIcon = isImage ? 
                `<img src="${file.file_url}" alt="${file.original_name}" class="file-thumbnail">` :
                `<div class="file-icon pdf-icon">📄</div>`;

            return `
                <div class="file-item" data-file-id="${file.id}">
                    <div class="file-preview" onclick="app.openFileModal('${file.file_url}', '${file.original_name}', '${file.file_type}')">
                        ${fileIcon}
                    </div>
                    <div class="file-info">
                        <div class="file-name" title="${file.original_name}">${file.original_name}</div>
                        <div class="file-meta">
                            ${this.formatFileSize(file.file_size)} • ${this.formatFileDate(file.upload_date)}
                        </div>
                    </div>
                    ${this.editingSections && this.editingSections.has('files') ? 
                        `<button class="file-delete-btn" onclick="app.deleteCustomerFile(${file.id})" title="Delete file">×</button>` : 
                        ''
                    }
                </div>
            `;
        }).join('');

        filesGrid.innerHTML = filesHtml;
    }

    setupFileUpload() {
        const dropzone = document.getElementById('upload-dropzone');
        const fileInput = document.getElementById('file-input');

        if (!dropzone || !fileInput) {
            console.warn('File upload elements not found');
            return;
        }

        // Remove existing listeners by cloning elements
        const newDropzone = dropzone.cloneNode(true);
        const newFileInput = fileInput.cloneNode(true);
        dropzone.parentNode.replaceChild(newDropzone, dropzone);
        fileInput.parentNode.replaceChild(newFileInput, fileInput);

        // Click to upload
        newDropzone.addEventListener('click', () => {
            newFileInput.click();
        });

        // File input change
        newFileInput.addEventListener('change', (e) => {
            this.handleFileUpload(e.target.files);
        });

        // Drag and drop
        newDropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            newDropzone.classList.add('dragover');
        });

        newDropzone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            newDropzone.classList.remove('dragover');
        });

        newDropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            newDropzone.classList.remove('dragover');
            this.handleFileUpload(e.dataTransfer.files);
        });
    }

    async handleFileUpload(files) {
        if (!files || files.length === 0) return;

        const validFiles = Array.from(files).filter(file => {
            const isValidType = file.type.startsWith('image/') || file.type === 'application/pdf';
            const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB

            if (!isValidType) {
                alert(`${file.name}: Only images and PDFs are allowed.`);
                return false;
            }
            if (!isValidSize) {
                alert(`${file.name}: File size must be less than 5MB.`);
                return false;
            }
            return true;
        });

        if (validFiles.length === 0) return;

        try {
            const dropzone = document.getElementById('upload-dropzone');
            if (dropzone) {
                dropzone.classList.add('uploading');
                const uploadText = dropzone.querySelector('.upload-text p');
                if (uploadText) uploadText.textContent = 'Uploading...';
            }

            console.log('Starting upload for customer:', this.currentCustomer.customer_id);
            console.log('Valid files to upload:', validFiles.length);
            
            const result = await this.api.uploadFiles(this.currentCustomer.customer_id, validFiles);
            console.log('Upload result:', result);
            
            // Reload files
            await this.loadCustomerFiles();

            // Reset file input
            const fileInput = document.getElementById('file-input');
            if (fileInput) fileInput.value = '';

        } catch (error) {
            console.error('Upload failed:', error);
            alert('Upload failed: ' + error.message);
        } finally {
            const dropzone = document.getElementById('upload-dropzone');
            if (dropzone) {
                dropzone.classList.remove('uploading');
                const uploadText = dropzone.querySelector('.upload-text p');
                if (uploadText) uploadText.textContent = 'Drop files here or click to upload';
            }
        }
    }

    async deleteCustomerFile(fileId) {
        if (!confirm('Are you sure you want to delete this file?')) return;

        try {
            await this.api.deleteFile(this.currentCustomer.customer_id, fileId);
            await this.loadCustomerFiles();
        } catch (error) {
            console.error('Failed to delete file:', error);
            alert('Failed to delete file: ' + error.message);
        }
    }

    openFileModal(fileUrl, fileName, fileType) {
        const modal = document.createElement('div');
        modal.className = 'file-modal';
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };

        const isImage = fileType.startsWith('image/');
        const content = isImage ?
            `<div class="image-container">
                <img src="${fileUrl}" alt="${fileName}" class="modal-image" id="modal-image">
            </div>` :
            `<iframe src="${fileUrl}" class="modal-pdf"></iframe>`;

        const zoomControls = isImage ? `
            <div class="zoom-controls">
                <button class="zoom-btn" onclick="app.zoomImage(-0.2)" title="Zoom Out">−</button>
                <span class="zoom-level" id="zoom-level">100%</span>
                <button class="zoom-btn" onclick="app.zoomImage(0.2)" title="Zoom In">+</button>
                <button class="zoom-btn" onclick="app.resetZoom()" title="Reset Zoom">Reset</button>
            </div>
        ` : '';

        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${fileName}</h3>
                    <button class="modal-close" onclick="this.closest('.file-modal').remove()">×</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
                <div class="modal-footer">
                    <a href="${fileUrl}" download="${fileName}" class="btn btn-primary">Download</a>
                </div>
                ${zoomControls}
            </div>
        `;

        document.body.appendChild(modal);
        
        // Initialize zoom for images
        if (isImage) {
            this.currentZoom = 1;
            this.setupImageZoom();
        }
    }

    setupImageZoom() {
        const image = document.getElementById('modal-image');
        const container = image.parentElement;
        
        // Initialize pan state
        this.panState = {
            isDragging: false,
            startX: 0,
            startY: 0,
            imageX: 0,
            imageY: 0,
            initialImageX: 0,
            initialImageY: 0
        };

        // Set initial position
        this.centerImage();

        // Mouse wheel zoom
        container.addEventListener('wheel', (e) => {
            e.preventDefault();
            const rect = container.getBoundingClientRect();
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            this.zoomImageAtPoint(delta, centerX, centerY);
        });

        // Double-click to reset zoom
        image.addEventListener('dblclick', () => {
            this.resetZoom();
        });

        // Cursor management
        container.addEventListener('mousemove', (e) => {
            if (!this.panState.isDragging) {
                image.style.cursor = this.currentZoom > 1 ? 'grab' : 'default';
            }
        });

        container.addEventListener('mouseleave', () => {
            if (!this.panState.isDragging) {
                image.style.cursor = 'default';
            }
        });

        // Mouse pan functionality
        image.addEventListener('mousedown', (e) => {
            if (this.currentZoom > 1) {
                e.preventDefault();
                this.startPan(e.clientX, e.clientY);
                image.style.cursor = 'grabbing';
                
                // Prevent text selection during drag
                document.body.style.userSelect = 'none';
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (this.panState.isDragging && this.currentZoom > 1) {
                e.preventDefault();
                this.updatePan(e.clientX, e.clientY);
            }
        });

        document.addEventListener('mouseup', () => {
            if (this.panState.isDragging) {
                this.endPan();
                image.style.cursor = this.currentZoom > 1 ? 'grab' : 'default';
                document.body.style.userSelect = '';
            }
        });

        // Touch support for mobile
        let initialDistance = 0;
        let initialZoom = 1;

        image.addEventListener('touchstart', (e) => {
            e.preventDefault();
            
            if (e.touches.length === 1 && this.currentZoom > 1) {
                // Single touch pan
                const touch = e.touches[0];
                this.startPan(touch.clientX, touch.clientY);
            } else if (e.touches.length === 2) {
                // Two finger pinch zoom
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                initialDistance = this.getTouchDistance(touch1, touch2);
                initialZoom = this.currentZoom;
            }
        });

        image.addEventListener('touchmove', (e) => {
            e.preventDefault();
            
            if (e.touches.length === 1 && this.panState.isDragging) {
                // Single touch pan
                const touch = e.touches[0];
                this.updatePan(touch.clientX, touch.clientY);
            } else if (e.touches.length === 2) {
                // Two finger pinch zoom
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                const currentDistance = this.getTouchDistance(touch1, touch2);
                const scale = currentDistance / initialDistance;
                const newZoom = Math.max(0.5, Math.min(3, initialZoom * scale));
                
                // Calculate center point between fingers
                const centerX = (touch1.clientX + touch2.clientX) / 2;
                const centerY = (touch1.clientY + touch2.clientY) / 2;
                const rect = container.getBoundingClientRect();
                const relativeX = centerX - rect.left;
                const relativeY = centerY - rect.top;
                
                this.setZoom(newZoom);
                this.updateZoomDisplay();
            }
        });

        image.addEventListener('touchend', (e) => {
            if (this.panState.isDragging) {
                this.endPan();
            }
        });
    }

    getTouchDistance(touch1, touch2) {
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    startPan(clientX, clientY) {
        this.panState.isDragging = true;
        this.panState.startX = clientX;
        this.panState.startY = clientY;
        this.panState.initialImageX = this.panState.imageX;
        this.panState.initialImageY = this.panState.imageY;
    }

    updatePan(clientX, clientY) {
        if (!this.panState.isDragging) return;

        const deltaX = clientX - this.panState.startX;
        const deltaY = clientY - this.panState.startY;
        
        const newX = this.panState.initialImageX + deltaX;
        const newY = this.panState.initialImageY + deltaY;
        
        // Apply bounds checking
        const bounded = this.applyBounds(newX, newY);
        this.panState.imageX = bounded.x;
        this.panState.imageY = bounded.y;
        
        this.updateImagePosition();
    }

    endPan() {
        this.panState.isDragging = false;
    }

    applyBounds(x, y) {
        const image = document.getElementById('modal-image');
        const container = image.parentElement;
        
        const containerRect = container.getBoundingClientRect();
        const imageRect = image.getBoundingClientRect();
        
        const scaledWidth = image.naturalWidth * this.currentZoom;
        const scaledHeight = image.naturalHeight * this.currentZoom;
        
        // Calculate bounds - prevent image from being dragged completely outside container
        const minX = Math.min(0, containerRect.width - scaledWidth);
        const maxX = Math.max(0, containerRect.width - scaledWidth);
        const minY = Math.min(0, containerRect.height - scaledHeight);
        const maxY = Math.max(0, containerRect.height - scaledHeight);
        
        return {
            x: Math.max(minX, Math.min(maxX, x)),
            y: Math.max(minY, Math.min(maxY, y))
        };
    }

    centerImage() {
        this.panState.imageX = 0;
        this.panState.imageY = 0;
        this.updateImagePosition();
    }

    updateImagePosition() {
        const image = document.getElementById('modal-image');
        if (image) {
            image.style.transform = `scale(${this.currentZoom}) translate(${this.panState.imageX / this.currentZoom}px, ${this.panState.imageY / this.currentZoom}px)`;
        }
    }

    zoomImage(delta) {
        const newZoom = Math.max(0.5, Math.min(3, this.currentZoom + delta));
        this.setZoom(newZoom);
        this.updateZoomDisplay();
    }

    zoomImageAtPoint(delta, pointX, pointY) {
        const oldZoom = this.currentZoom;
        const newZoom = Math.max(0.5, Math.min(3, this.currentZoom + delta));
        
        if (oldZoom !== newZoom) {
            // Calculate zoom center offset
            const zoomRatio = newZoom / oldZoom;
            const container = document.getElementById('modal-image').parentElement;
            const rect = container.getBoundingClientRect();
            
            // Adjust pan position to zoom towards the point
            const offsetX = (pointX - rect.width / 2) * (1 - zoomRatio);
            const offsetY = (pointY - rect.height / 2) * (1 - zoomRatio);
            
            this.panState.imageX = this.panState.imageX * zoomRatio + offsetX;
            this.panState.imageY = this.panState.imageY * zoomRatio + offsetY;
            
            this.setZoom(newZoom);
            
            // Apply bounds after zoom
            const bounded = this.applyBounds(this.panState.imageX, this.panState.imageY);
            this.panState.imageX = bounded.x;
            this.panState.imageY = bounded.y;
        }
        
        this.updateZoomDisplay();
    }

    setZoom(zoom) {
        this.currentZoom = zoom;
        this.updateImagePosition();
        
        const image = document.getElementById('modal-image');
        if (image) {
            image.style.cursor = this.currentZoom > 1 ? 'grab' : 'default';
        }
    }

    updateZoomDisplay() {
        const zoomLevel = document.getElementById('zoom-level');
        if (zoomLevel) {
            zoomLevel.textContent = Math.round(this.currentZoom * 100) + '%';
        }
    }

    resetZoom() {
        this.currentZoom = 1;
        this.centerImage();
        this.updateZoomDisplay();
        
        const image = document.getElementById('modal-image');
        if (image) {
            image.style.cursor = 'default';
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    formatFileDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    getNextStepOptions(status) {
        const statusNextStepMapping = {
            "Lead": ["Initial Contact", "Send Info", "Schedule Demo"],
            "Quoted": ["Follow Up", "Send Contract", "Schedule Meeting"],
            "Signed": ["Order Hardware and License", "Schedule Install"],
            "Onboarding": ["Schedule Install", "Perform Install", "Verify Network"],
            "Active": ["Support", "Renewal", "Follow-up"]
        };
        return statusNextStepMapping[status] || [];
    }

    toggleEditMode(editing) {
        this.editMode = editing;
        this.renderCustomerDetail();
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
            // Create note via new API
            await this.api.createCustomerNote(this.currentCustomer.customer_id, noteContent);
            
            // Clear the input
            noteInput.value = '';
            
            // Reload notes to show the new note
            await this.loadCustomerNotes();

            console.log('Note added successfully');
        } catch (error) {
            console.error('Failed to add note:', error);
            alert('Failed to add note. Please try again.');
        }
    }

    async saveCustomerChanges() {
        if (!this.currentCustomer) return;

        try {
            // Collect form data
            const updates = {
                company_name: document.getElementById('edit-company-name')?.value || '',
                status: document.getElementById('edit-status')?.value || '',
                affiliate_partner: document.getElementById('edit-affiliate-partner')?.value || '',
                next_step: document.getElementById('edit-next-step')?.value || '',
                physical_address: document.getElementById('edit-physical-address')?.value || '',
                billing_address: document.getElementById('edit-billing-address')?.value || '',
                primary_contact: {
                    name: document.getElementById('edit-primary-name')?.value || '',
                    email: document.getElementById('edit-primary-email')?.value || '',
                    phone: document.getElementById('edit-primary-phone')?.value || ''
                },
                authorized_signer: {
                    name: document.getElementById('edit-signer-name')?.value || '',
                    email: document.getElementById('edit-signer-email')?.value || ''
                },
                billing_contact: {
                    name: document.getElementById('edit-billing-name')?.value || '',
                    email: document.getElementById('edit-billing-email')?.value || '',
                    phone: document.getElementById('edit-billing-phone')?.value || ''
                }
            };

            await this.api.updateCustomer(this.currentCustomer.customer_id, updates);
            
            // Update local data
            Object.assign(this.currentCustomer, updates);
            
            // Exit edit mode and refresh display
            this.editMode = false;
            this.renderCustomerDetail();
            
            console.log('Customer updated successfully');
        } catch (error) {
            console.error('Failed to save customer:', error);
            alert('Failed to save changes. Please try again.');
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

    toggleSectionEdit(sectionName) {
        if (this.editingSections.has(sectionName)) {
            this.editingSections.delete(sectionName);
        } else {
            this.editingSections.add(sectionName);
        }
        
        // Re-render the customer detail to update the UI
        this.renderCustomerDetail();
        
        // Reload notes to show/hide edit controls
        if (sectionName === 'notes') {
            this.loadCustomerNotes();
        }
    }

    saveSectionChanges(sectionName) {
        // Exit edit mode for the section
        this.editingSections.delete(sectionName);
        this.renderCustomerDetail();
        
        // Reload content to hide edit controls
        if (sectionName === 'notes') {
            this.loadCustomerNotes();
        }
        console.log(`Saving changes for ${sectionName} section`);
    }

    cancelSectionEdit(sectionName) {
        // Exit edit mode without saving
        this.editingSections.delete(sectionName);
        this.renderCustomerDetail();
        
        // Reload content to hide edit controls
        if (sectionName === 'notes') {
            this.loadCustomerNotes();
        }
        console.log(`Cancelling edit for ${sectionName} section`);
    }

    async deleteNote(noteId) {
        if (!confirm('Are you sure you want to delete this note?')) return;
        
        try {
            await this.api.deleteCustomerNote(this.currentCustomer.customer_id, noteId);
            await this.loadCustomerNotes();
            console.log('Note deleted successfully');
        } catch (error) {
            console.error('Failed to delete note:', error);
            alert('Failed to delete note. Please try again.');
        }
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