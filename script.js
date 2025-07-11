// Database API client
class DatabaseAPI {
    constructor() {
        this.baseURL = '/api';
        this.currentUser = null;
    }

    // Helper method to get headers with development session token for iframe contexts
    getAuthHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        // In development mode, check for dev session token in localStorage
        const devSessionToken = localStorage.getItem('devSessionToken');
        if (devSessionToken) {
            headers['X-Dev-Session'] = devSessionToken;
        }
        
        return headers;
    }

    // Helper method to get fetch options with authentication
    getFetchOptions(method = 'GET', body = null) {
        const options = {
            method,
            headers: this.getAuthHeaders(),
            credentials: 'include'
        };
        
        if (body) {
            options.body = JSON.stringify(body);
        }
        
        return options;
    }

    async makeRequest(method, endpoint, body = null) {
        try {
            // Fix URL construction to avoid double /api/
            const url = endpoint.startsWith('/api/') ? `${this.baseURL}${endpoint}` : `${this.baseURL}/api${endpoint}`;
            console.log('makeRequest URL:', url); // Debug logging
            const response = await fetch(url, this.getFetchOptions(method, body));
            
            if (response.status === 401) {
                console.log('User not authenticated, redirecting to auth page...');
                window.location.href = '/auth.html';
                return null;
            }
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('DatabaseAPI makeRequest error:', error);
            throw error;
        }
    }

    async checkAuth() {
        try {
            const response = await fetch(`${this.baseURL}/auth/me`, this.getFetchOptions('GET'));
            
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
            await fetch(`${this.baseURL}/auth/logout`, this.getFetchOptions('POST'));
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
            
            const response = await fetch(`${this.baseURL}/customers`, this.getFetchOptions('GET'));
            
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
            // Generate customer ID if not provided
            if (!customerData.customerId) {
                customerData.customerId = 'customer_' + String(Date.now()).slice(-6).padStart(3, '0');
            }

            console.log('Creating customer with data:', customerData);
            
            const response = await fetch(`${this.baseURL}/customers`, {
                ...this.getFetchOptions('POST', customerData)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Server error response:', errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
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
                body: formData,
                credentials: 'include'
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

    async getCustomerFileCount(customerId) {
        try {
            const files = await this.getCustomerFiles(customerId);
            return files ? files.length : 0;
        } catch (error) {
            console.error('Error getting file count for customer', customerId, ':', error);
            return 0;
        }
    }

    async getAllCustomerFileCounts() {
        try {
            const response = await this.makeRequest('GET', '/api/customers/file-counts');
            return response || {};
        } catch (error) {
            console.error('Error getting all customer file counts:', error);
            return {};
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

    async createNote(customerId, noteData) {
        console.log('DatabaseAPI: Creating note for customer', customerId);
        console.log('DatabaseAPI: Note data', noteData);
        
        const response = await fetch(`/api/customers/${customerId}/notes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(noteData)
        });

        console.log('DatabaseAPI: Note creation response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('DatabaseAPI: Note creation failed:', errorText);
            throw new Error(errorText || 'Failed to create note');
        }

        const result = await response.json();
        console.log('DatabaseAPI: Note created successfully:', result);
        return result;
    }

    async createSystemNote(customerId, content) {
        console.log('DatabaseAPI: Creating system note for customer', customerId);
        const response = await this.makeRequest('POST', `/customers/${customerId}/system-notes`, {
            content: content
        });
        return response;
    }

    async deleteNote(customerId, noteId) {
        console.log('DatabaseAPI: Deleting note', noteId, 'for customer', customerId);
        
        const response = await fetch(`/api/customers/${customerId}/notes/${noteId}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        console.log('DatabaseAPI: Note deletion response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('DatabaseAPI: Note deletion failed:', errorText);
            throw new Error(errorText || 'Failed to delete note');
        }

        const result = await response.json();
        console.log('DatabaseAPI: Note deleted successfully:', result);
        return result;
    }

    async getCustomerNotes(customerId) {
        console.log('DatabaseAPI: Fetching notes for customer', customerId);
        
        const response = await fetch(`/api/customers/${customerId}/notes`, {
            method: 'GET',
            credentials: 'include'
        });

        console.log('DatabaseAPI: Notes fetch response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('DatabaseAPI: Notes fetch failed:', errorText);
            throw new Error(errorText || 'Failed to fetch notes');
        }

        const result = await response.json();
        console.log('DatabaseAPI: Notes fetched successfully:', result.length, 'notes');
        return result;
    }

    async parseTextWithAI(text) {
        console.log('DatabaseAPI: Parsing text with OpenAI');
        try {
            const response = await fetch('/api/parse-text', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ text })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('DatabaseAPI: Text parsed successfully:', result);
            return result;
        } catch (error) {
            console.error('DatabaseAPI: Failed to parse text:', error);
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
        this.isDevelopment = false; // Will be set after environment check
        
        // Initialize zoom and pan state
        this.currentZoom = 1;
        this.panState = {
            isDragging: false,
            startX: 0,
            startY: 0,
            imageX: 0,
            imageY: 0
        };
        
        this.init();
    }

    async init() {
        console.log('=== CRM INIT DEBUG START ===');
        
        try {
            console.log('Step 1: CRM App starting initialization...');
            
            console.log('Step 2: Checking environment...');
            await this.checkEnvironment();
            
            console.log('Step 3: Loading user data...');
            await this.loadUserData();
            
            console.log('Step 4: Loading customers...');
            await this.loadCustomers();
            
            console.log('Step 5: Binding events...');
            this.bindEvents();
            
            console.log('Step 6: Showing dashboard view...');
            this.showView("dashboard");
            
            console.log("=== CRM INIT SUCCESSFUL ===");
        } catch (error) {
            console.error("CRITICAL: Failed to initialize app:", error);
            console.error("Error stack:", error.stack);
            this.showError("dashboard-error", "Failed to load application data.");
        }
    }

    async checkEnvironment() {
        try {
            const response = await fetch('/api/environment', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const envData = await response.json();
                this.isDevelopment = envData.isDevelopment;
                
                console.log('Environment API response:', envData);
                
                if (this.isDevelopment) {
                    console.log('Development environment detected');
                    this.setupDevelopmentUI();
                    // Show test mode section in development
                    const testModeSection = document.getElementById('test-mode-section');
                    if (testModeSection) {
                        testModeSection.style.display = 'block';
                    }
                } else {
                    console.log('Production environment detected');
                    // Ensure test mode is disabled in production
                    const testModeToggle = document.getElementById('test-mode-toggle');
                    if (testModeToggle) {
                        testModeToggle.checked = false;
                    }
                }
            } else {
                console.log('Environment API not available, defaulting to production');
                this.isDevelopment = false;
                // Default to production behavior - disable test mode
                const testModeToggle = document.getElementById('test-mode-toggle');
                if (testModeToggle) {
                    testModeToggle.checked = false;
                }
            }
        } catch (error) {
            console.error('Failed to check environment:', error);
            // Default to production if check fails
            this.isDevelopment = false;
            // Default to production behavior - disable test mode
            const testModeToggle = document.getElementById('test-mode-toggle');
            if (testModeToggle) {
                testModeToggle.checked = false;
            }
        }
    }

    setupDevelopmentUI() {
        // Show development banner
        const banner = document.getElementById('dev-environment-banner');
        if (banner) {
            banner.style.display = 'block';
            
            // Adjust body padding to account for banner
            document.body.style.paddingTop = '40px';
        }
        
        // Update page title
        const currentTitle = document.title;
        if (!currentTitle.includes('[DEV]')) {
            document.title = `[DEV] ${currentTitle}`;
        }
        
        // Show debug info in development mode
        if (window.createDebugInfo) {
            window.createDebugInfo(true);
        }
        
        // Add dev console link to navigation
        this.addDevConsoleLink();
        
        console.log('Development UI setup complete');
    }

    addDevConsoleLink() {
        const nav = document.querySelector('nav');
        if (nav && !document.getElementById('dev-console-btn')) {
            const devConsoleBtn = document.createElement('button');
            devConsoleBtn.id = 'dev-console-btn';
            devConsoleBtn.className = 'nav-btn';
            devConsoleBtn.innerHTML = '🛠️ Dev Console';
            devConsoleBtn.style.backgroundColor = '#ff6b35';
            devConsoleBtn.style.color = 'white';
            devConsoleBtn.addEventListener('click', () => {
                window.location.href = '/dev-console';
            });
            nav.appendChild(devConsoleBtn);
        }
    }

    async loadUserData() {
        try {
            const response = await fetch('/api/user', {
                credentials: 'include'
            });

            if (!response.ok) {
                console.log('User not authenticated, redirecting to auth page...');
                // In iframe, show login instructions instead of redirecting
                if (window.top !== window.self) {
                    const errorDiv = document.getElementById('dashboard-error');
                    if (errorDiv) {
                        errorDiv.innerHTML = '<strong>Login Required:</strong> <a href="/auth.html" target="_blank" style="color: #007bff; text-decoration: underline;">Click here to login</a> (test@test.com / test123) then refresh this page to access the CRM.';
                        errorDiv.style.display = 'block';
                    }
                } else {
                    window.location.href = '/auth.html';
                }
                return;
            }

            this.currentUser = await response.json();
            this.updateUserUI();
        } catch (error) {
            console.error('Failed to load user data:', error);
            // In iframe, show login instructions instead of redirecting
            if (window.top !== window.self) {
                const errorDiv = document.getElementById('dashboard-error');
                if (errorDiv) {
                    errorDiv.innerHTML = '<strong>Login Required:</strong> <a href="/auth.html" target="_blank" style="color: #007bff; text-decoration: underline;">Click here to login</a> (test@test.com / test123) then refresh this page to access the CRM.';
                    errorDiv.style.display = 'block';
                }
            } else {
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
            
            console.log('Step 2: Calling APIs...');
            // Load customers first
            const customers = await this.api.getCustomers();
            
            // Only load file counts if we're authenticated (customers call succeeded)
            let fileCounts = {};
            if (customers && customers.length > 0) {
                try {
                    fileCounts = await this.api.getAllCustomerFileCounts();
                    console.log('File counts loaded successfully:', fileCounts);
                } catch (error) {
                    console.log('File counts failed (likely authentication issue), using empty counts');
                    fileCounts = {};
                }
            }
            
            // Add file counts to customer data
            this.customers = customers.map(customer => ({
                ...customer,
                fileCount: fileCounts[customer.customer_id] || 0
            }));
            
            console.log('Step 3: API Responses received');
            console.log(`Loaded ${this.customers.length} customers from PostgreSQL`);
            console.log('File counts loaded:', fileCounts);
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
                        <td class="files-cell">
                            ${this.renderFileAttachmentIndicator(customer)}
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

    renderFileAttachmentIndicator(customer) {
        const fileCount = customer.fileCount || 0;
        
        if (fileCount === 0) {
            return '';
        }

        return `
            <div class="file-attachment-indicator" 
                 onclick="app.showCustomerDetail('${customer.customer_id}', 'files')" 
                 title="Customer has ${fileCount} uploaded file${fileCount === 1 ? '' : 's'}">
                <span class="file-icon">📎</span>
                <span class="file-count">${fileCount}</span>
            </div>
        `;
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
            
            // Create system note for status change
            if (originalValue !== newStatus) {
                await this.api.createSystemNote(customerId, `Status changed from "${originalValue}" to "${newStatus}"`);
            }
            
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
            
            // Create system note for next step change
            if (originalValue !== newNextStep) {
                const content = originalValue ? 
                    `Next step updated from "${originalValue}" to "${newNextStep}"` : 
                    `Next step set to "${newNextStep}"`;
                await this.api.createSystemNote(customerId, content);
            }
            
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

            // Track field changes for system notes
            const changes = this.detectFieldChanges(this.currentCustomer, updatedData);
            
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

            // Create system notes for field changes
            if (changes.length > 0) {
                const changesSummary = changes.map(change => `${change.field}: "${change.oldValue}" → "${change.newValue}"`).join('; ');
                await this.createSystemNote(this.currentCustomerId, `Customer information updated: ${changesSummary}`);
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
        console.log('=== BINDING EVENTS START ===');
        
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

        // Auto-fill functionality events - CRITICAL FOR TEXT PARSING
        console.log('Binding auto-fill events...');
        const pasteTextArea = document.getElementById('paste-note-email');
        const autoFillBtn = document.getElementById('auto-fill-btn');
        const clearPasteBtn = document.getElementById('clear-paste-btn');
        
        console.log('Elements found:', {
            pasteTextArea: !!pasteTextArea,
            autoFillBtn: !!autoFillBtn,
            clearPasteBtn: !!clearPasteBtn
        });
        
        if (pasteTextArea) {
            pasteTextArea.addEventListener('input', (e) => {
                console.log('Text changed - input event triggered');
                this.handlePasteTextChange(e);
            });
            console.log('Paste text area input event bound successfully');
        } else {
            console.error('CRITICAL: paste-note-email textarea not found!');
        }
        
        if (autoFillBtn) {
            autoFillBtn.addEventListener('click', () => {
                console.log('Auto-fill button clicked');
                this.autoFillForm();
            });
            console.log('Auto-fill button click event bound successfully');
        } else {
            console.error('CRITICAL: auto-fill-btn button not found!');
        }
        
        if (clearPasteBtn) {
            clearPasteBtn.addEventListener('click', () => {
                console.log('Clear paste button clicked');
                this.clearPasteText();
            });
            console.log('Clear paste button click event bound successfully');
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

        // Customer form submission - CRITICAL FIX
        const customerForm = document.getElementById('customer-form');
        if (customerForm) {
            customerForm.addEventListener('submit', (e) => {
                console.log('Customer form submit event triggered');
                this.handleSaveCustomer(e);
            });
            console.log('Customer form submit event bound successfully');
        } else {
            console.error('CRITICAL: customer-form not found!');
        }
        
        console.log('=== BINDING EVENTS COMPLETE ===');
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

    async showCustomerDetail(customerId, scrollToSection = null) {
        try {
            console.log("showCustomerDetail called with:", customerId, "section:", scrollToSection);
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
                
                // Scroll to specific section if requested
                if (scrollToSection) {
                    setTimeout(() => {
                        const section = document.getElementById(`${scrollToSection}-section`);
                        if (section) {
                            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            // Add visual highlight
                            section.style.background = '#f0f8ff';
                            setTimeout(() => {
                                section.style.background = '';
                            }, 2000);
                        }
                    }, 200);
                }
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
                            <h3>Notes & Activity</h3>
                            <div class="notes-filter">
                                <select id="notes-filter-select" onchange="app.onNotesFilterChange(this.value)">
                                    <option value="all">All Notes</option>
                                    <option value="user">User Notes</option>
                                    <option value="system">System Notes</option>
                                </select>
                            </div>
                            <button class="section-edit-btn" onclick="app.toggleSectionEdit('notes')" id="notes-edit-btn">
                                ${this.editingSections.has('notes') ? '✕' : '✏️'}
                            </button>
                        </div>
                        <div class="notes-section">
                            <div class="notes-list" id="customer-notes-list">
                                <div class="loading-notes">Loading notes...</div>
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
                                        <input type="file" id="file-input" multiple accept="image/*,.pdf,video/*" style="display: none;">
                                        <div class="upload-text">
                                            <p>Drop files here or click to upload</p>
                                            <p class="upload-hint">Images, PDFs, and videos only, max 50MB per file</p>
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

        console.log('=== LOADING CUSTOMER NOTES ===');
        console.log('Loading notes for customer:', this.currentCustomer.customer_id);
        
        // Show loading indicator
        const notesSection = document.querySelector('#customer-notes-list');
        if (notesSection) {
            notesSection.innerHTML = '<div class="loading-notes">Loading notes...</div>';
        }
        
        try {
            const response = await fetch(`/api/customers/${this.currentCustomer.customer_id}/notes`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('=== NOTES API RESPONSE ===');
            console.log('Notes response status:', response.status);
            console.log('Notes response ok:', response.ok);
            console.log('Notes response headers:', Object.fromEntries(response.headers.entries()));
            
            if (!response.ok) {
                if (response.status === 401) {
                    console.log('Authentication required to load notes');
                    this.renderNotesSection([]);
                    return;
                }
                const errorText = await response.text();
                console.error('Notes fetch failed:', response.status, errorText);
                throw new Error(`Failed to load notes (${response.status}): ${errorText}`);
            }
            
            const responseText = await response.text();
            console.log('=== RAW RESPONSE ===');
            console.log('Raw notes response length:', responseText.length);
            console.log('Raw notes response preview:', responseText.substring(0, 300));
            
            if (!responseText.trim()) {
                console.warn('Empty response body from notes API');
                this.renderNotesSection([]);
                return;
            }
            
            let notes;
            try {
                notes = JSON.parse(responseText);
                console.log('=== PARSED NOTES ===');
                console.log('Parsed notes type:', typeof notes);
                console.log('Is array:', Array.isArray(notes));
                console.log('Notes length:', notes?.length);
                console.log('Raw notes object:', notes);
            } catch (parseError) {
                console.error('Failed to parse notes JSON:', parseError, 'Raw response:', responseText);
                throw new Error('Invalid JSON response from notes API');
            }
            
            console.log('Notes loaded successfully:', notes?.length || 0, 'notes found');
            if (notes && notes.length > 0) {
                console.log('First note sample:', {
                    id: notes[0].id,
                    author: notes[0].author_name,
                    contentLength: notes[0].content?.length,
                    preview: notes[0].content?.substring(0, 50) + '...'
                });
            }
            
            this.currentCustomer.notes = notes || [];
            this.renderNotesSection(notes || []);
            
        } catch (error) {
            console.error('=== NOTES LOADING ERROR ===');
            console.error('Error type:', typeof error);
            console.error('Error message:', error.message || error);
            console.error('Error stack:', error.stack);
            console.error('Full error object:', error);
            this.renderNotesSection([]);
        }
    }

    renderNotesSection(notes) {
        console.log('Rendering notes section with', notes?.length || 0, 'notes');
        
        // Try multiple possible selectors for the notes section
        let notesSection = document.querySelector('#customer-notes-list');
        if (!notesSection) {
            notesSection = document.querySelector('#notes-list');
        }
        if (!notesSection) {
            notesSection = document.querySelector('.notes-list');
        }
        if (!notesSection) {
            notesSection = document.querySelector('#notes-section .notes-list');
        }
        if (!notesSection) {
            notesSection = document.querySelector('.notes-section .notes-list');
        }
        
        if (!notesSection) {
            console.log('Notes section not found in DOM - available elements:', 
                Array.from(document.querySelectorAll('[class*="notes"], [id*="notes"]')).map(el => el.id || el.className));
            return;
        }

        console.log('Found notes section:', notesSection.id || notesSection.className);

        // Store all notes for filtering
        this.allNotes = notes || [];
        this.currentNotesFilter = this.currentNotesFilter || 'all';
        
        // Update filter dropdown
        const filterSelect = document.getElementById('notes-filter-select');
        if (filterSelect) {
            filterSelect.value = this.currentNotesFilter;
        }
        
        // Apply current filter
        let filteredNotes = notes || [];
        if (this.currentNotesFilter === 'user') {
            filteredNotes = notes.filter(note => note.type === 'manual');
        } else if (this.currentNotesFilter === 'system') {
            filteredNotes = notes.filter(note => note.type === 'system');
        }

        if (!filteredNotes || filteredNotes.length === 0) {
            notesSection.innerHTML = '<p class="no-notes">No notes available for this filter.</p>';
            return;
        }

        const notesHtml = filteredNotes.map(note => {
            const noteDate = new Date(note.timestamp).toLocaleString();
            const isSystemNote = note.type === 'system';
            const noteClass = isSystemNote ? 'system-note' : 'user-note';
            
            console.log('Rendering note:', note.id, 'type:', note.type, 'isSystemNote:', isSystemNote);
            
            const displayAuthor = isSystemNote ? '🤖 System' : this.escapeHtml(note.author_name || 'Unknown');
            
            return `
                <div class="note-item ${noteClass}">
                    <div class="note-header">
                        <span class="note-author">${displayAuthor}</span>
                        <span class="note-date">${noteDate}</span>
                        ${this.currentUser && this.currentUser.role === 'admin' ? 
                            `<button class="note-delete-btn" onclick="app.deleteNote(${note.id})" title="Delete note">×</button>` : 
                            ''
                        }
                    </div>
                    <div class="note-content">${this.escapeHtml(note.content)}</div>
                </div>
            `;
        }).join('');

        notesSection.innerHTML = notesHtml;
        console.log('Notes rendered successfully');
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
            const isVideo = file.file_type.startsWith('video/');
            const isPDF = file.file_type === 'application/pdf';
            
            let fileIcon;
            if (isImage) {
                fileIcon = `<img src="${file.file_url}" alt="${file.original_name}" class="file-thumbnail">`;
            } else if (isVideo) {
                fileIcon = `<div class="file-icon video-icon">🎥</div>`;
            } else if (isPDF) {
                fileIcon = `<div class="file-icon pdf-icon">📄</div>`;
            } else {
                fileIcon = `<div class="file-icon generic-icon">📁</div>`;
            }

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
            const isValidType = file.type.startsWith('image/') || file.type === 'application/pdf' || file.type.startsWith('video/');
            const maxSize = file.type.startsWith('video/') ? 50 * 1024 * 1024 : 5 * 1024 * 1024; // 50MB for videos, 5MB for others

            if (!isValidType) {
                alert(`${file.name}: Only images, PDFs, and videos are allowed.`);
                return false;
            }
            if (file.size > maxSize) {
                const limit = file.type.startsWith('video/') ? '50MB' : '5MB';
                alert(`${file.name}: File size must be less than ${limit}.`);
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
            
            // Create system note for file uploads
            const fileNames = validFiles.map(f => f.name);
            const uploadContent = validFiles.length === 1 ? 
                `File uploaded: ${fileNames[0]}` : 
                `${validFiles.length} files uploaded: ${fileNames.join(', ')}`;
            
            await this.api.createSystemNote(this.currentCustomer.customer_id, uploadContent);
            
            // Reload files and notes
            await this.loadCustomerFiles();
            await this.loadCustomerNotes();
            
            // Refresh customer file counts for dashboard
            await this.refreshCustomerFileCounts();

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

    async refreshCustomerFileCounts() {
        try {
            const fileCounts = await this.api.getAllCustomerFileCounts();
            
            // Update file counts in customer data
            this.customers = this.customers.map(customer => ({
                ...customer,
                fileCount: fileCounts[customer.customer_id] || 0
            }));
            
            this.filteredCustomers = this.filteredCustomers.map(customer => ({
                ...customer,
                fileCount: fileCounts[customer.customer_id] || 0
            }));
            
            // Re-render customer list if on dashboard
            if (document.getElementById('dashboard-view').style.display !== 'none') {
                this.renderCustomerList();
            }
        } catch (error) {
            console.error('Failed to refresh file counts:', error);
        }
    }

    async deleteCustomerFile(fileId) {
        if (!confirm('Are you sure you want to delete this file?')) return;

        try {
            await this.api.deleteFile(this.currentCustomer.customer_id, fileId);
            await this.loadCustomerFiles();
            
            // Refresh customer file counts for dashboard
            await this.refreshCustomerFileCounts();
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
        const isVideo = fileType.startsWith('video/');
        
        let content;
        if (isImage) {
            content = `<div style="position: relative; width: 100%; height: 80vh; background: #000; display: flex; align-items: center; justify-content: center; border-radius: 8px;">
                <img src="${fileUrl}" alt="${fileName}" 
                     style="max-width: 100%; max-height: 100%; object-fit: contain; cursor: zoom-in;"
                     id="modal-zoom-image">
                <div style="position: absolute; bottom: 10px; left: 10px; background: rgba(0,0,0,0.7); color: white; padding: 8px 12px; border-radius: 6px; display: flex; gap: 8px; align-items: center;">
                    <button onclick="app.zoomImage(-0.2)" style="background: none; border: none; color: white; cursor: pointer; font-size: 18px;">−</button>
                    <span id="zoom-percentage">100%</span>
                    <button onclick="app.zoomImage(0.2)" style="background: none; border: none; color: white; cursor: pointer; font-size: 18px;">+</button>
                    <button onclick="app.resetZoom()" style="background: none; border: none; color: white; cursor: pointer; font-size: 14px;">Reset</button>
                </div>
            </div>`;
        } else if (isVideo) {
            content = `<div style="width: 100%; height: 80vh; background: #000; display: flex; align-items: center; justify-content: center; border-radius: 8px;">
                <video controls style="max-width: 100%; max-height: 100%; border-radius: 8px;">
                    <source src="${fileUrl}" type="${fileType}">
                    Your browser does not support the video tag.
                </video>
            </div>`;
        } else {
            content = `<div style="padding: 40px; text-align: center; color: #666;">
                <p>Cannot preview this file type.</p>
                <p>Click the download button below to view the file.</p>
            </div>`;
        }

        modal.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); display: flex; align-items: center; justify-content: center; z-index: 10000;">
                <div style="position: relative; width: 90%; height: 90%; max-width: 1200px; background: white; border-radius: 8px; display: flex; flex-direction: column;">
                    <div style="padding: 20px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
                        <h3 style="margin: 0; color: #333;">${fileName}</h3>
                        <button onclick="this.closest('.file-modal').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #666;">×</button>
                    </div>
                    <div style="flex: 1; padding: 20px; overflow: hidden;">
                        ${content}
                    </div>
                    <div style="padding: 20px; border-top: 1px solid #eee; text-align: center;">
                        <a href="${fileUrl}" download="${fileName}" style="background: #007bff; color: white; padding: 10px 20px; border-radius: 4px; text-decoration: none;">Download</a>
                    </div>
                </div>
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

    async loadCustomerNotes() {
        if (!this.currentCustomer) return;
        
        try {
            const response = await fetch(`/api/customers/${this.currentCustomer.customer_id}/notes`, {
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error('Failed to load notes');
            }
            
            const notes = await response.json();
            console.log('Notes loaded:', notes.length, 'notes found');
            this.currentCustomer.notes = notes; // Store notes in customer object
            this.renderNotesSection(notes);
        } catch (error) {
            console.error('Failed to load customer notes:', error);
        }
    }

    async addNote() {
        const newNoteTextarea = document.getElementById('new-note-content');
        if (!newNoteTextarea) {
            console.error('Note textarea not found');
            return;
        }
        
        const content = newNoteTextarea.value.trim();
        
        if (!content) {
            alert('Please enter a note before adding.');
            return;
        }

        if (!this.currentCustomer || !this.currentCustomer.customer_id) {
            alert('No customer selected.');
            return;
        }

        try {
            console.log('Adding note for customer:', this.currentCustomer.customer_id);
            console.log('Note content:', content);
            
            const noteData = {
                content: content,
                author_name: this.currentUser ? this.currentUser.name : 'Unknown User',
                timestamp: new Date().toISOString()
            };

            const result = await this.api.createNote(this.currentCustomer.customer_id, noteData);
            console.log('Note added successfully:', result);
            
            // Show success feedback
            console.log('Note added successfully, refreshing display');
            
            // Refresh the notes display
            await this.loadCustomerNotes();
            this.clearNewNote();
            
            // Show success message
            const noteInput = document.getElementById('new-note-content');
            if (noteInput) {
                noteInput.placeholder = 'Note added successfully! Add another note...';
                setTimeout(() => {
                    noteInput.placeholder = 'Enter your note here...';
                }, 3000);
            }
        } catch (error) {
            console.error('Failed to add note:', error);
            alert('Failed to add note: ' + error.message);
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

    extractCustomerData(formData) {
        // Helper function to safely get and trim form data
        const getField = (name) => {
            const value = formData.get(name);
            return value ? value.trim() : '';
        };
        
        // Debug: Log all form data
        console.log('=== FORM DATA DEBUG ===');
        for (let [key, value] of formData.entries()) {
            console.log(`FormData: ${key} = "${value}"`);
        }

        // Build physical address from individual fields
        const physicalAddress = [
            getField('phys_street1'),
            getField('phys_street2'),
            getField('phys_city'),
            getField('phys_state'),
            getField('phys_zip')
        ].filter(Boolean).join(', ') || null;

        // Build billing address from individual fields  
        const billingAddress = [
            getField('bill_street1'),
            getField('bill_street2'),
            getField('bill_city'),
            getField('bill_state'),
            getField('bill_zip')
        ].filter(Boolean).join(', ') || null;

        return {
            company_name: getField('companyName') || getField('company-name') || formData.get('company-name'),
            status: formData.get('status') || 'Lead',
            affiliate_partner: formData.get('affiliatePartner') || formData.get('affiliate-partner'),
            next_step: getField('nextStep') || getField('next-step'),
            physical_address: physicalAddress,
            billing_address: billingAddress,
            primary_contact: {
                name: getField('primaryContact.name') || getField('primary-name'),
                email: getField('primaryContact.email') || getField('primary-email'),
                phone: getField('primaryContact.phone') || getField('primary-phone')
            },
            authorized_signer: {
                name: getField('authorizedSigner.name') || getField('signer-name'),
                email: getField('authorizedSigner.email') || getField('signer-email'),
                phone: getField('authorizedSigner.phone') || null
            },
            billing_contact: {
                name: getField('billingContact.name') || getField('billing-name'),
                email: getField('billingContact.email') || getField('billing-email'),
                phone: getField('billingContact.phone') || getField('billing-phone')
            }
        };
    }

    checkDuplicatesBeforeSave(customerData) {
        // Simple duplicate check - can be enhanced
        const duplicates = this.customers.filter(customer => 
            customer.company_name.toLowerCase() === customerData.company_name.toLowerCase()
        );
        return duplicates.length > 0;
    }

    async handleSaveCustomer(e) {
        e.preventDefault();
        this.clearErrors();

        const formData = new FormData(e.target);
        const testMode = document.getElementById('test-mode-toggle')?.checked;
        
        // Prevent saving if in test mode
        if (testMode) {
            alert('Test Mode is enabled. Please disable Test Mode to save the customer to the database.');
            return;
        }
        
        try {
            const customerData = this.extractCustomerData(formData);
            console.log('Extracted customer data:', customerData);
            
            // Validate required fields
            if (!customerData.company_name || customerData.company_name.trim() === '') {
                this.showMessage('Company Name is required', 'error');
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }

            // Check for duplicates
            if (this.checkDuplicatesBeforeSave(customerData)) {
                if (!confirm('A customer with this company name already exists. Continue anyway?')) {
                    return;
                }
            }

            const newCustomer = await this.api.createCustomer(customerData);
            console.log('Customer created:', newCustomer);
            
            // Create system note for customer creation
            await this.createSystemNote(newCustomer.customer_id, `Customer record created`);
            
            this.customers.push(newCustomer);
            this.applyFilters();
            this.showView('dashboard');
            
            // Show success message
            this.showMessage('Customer saved successfully!', 'success');
            
            // Reset form
            e.target.reset();
            
        } catch (error) {
            console.error('Error saving customer:', error);
            this.showMessage('Failed to save customer: ' + error.message, 'error');
            
            // Scroll to top to show error message
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
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

    // Auto-fill functionality
    handlePasteTextChange(e) {
        console.log('handlePasteTextChange called - Text changed event triggered!');
        const text = e.target.value.trim();
        const autoFillBtn = document.getElementById('auto-fill-btn');
        
        console.log('Current text content:', text.substring(0, 50) + '...');
        console.log('Text length:', text.length);
        console.log('Auto-fill button found:', !!autoFillBtn);
        
        if (autoFillBtn) {
            const shouldEnable = text.length > 0;
            autoFillBtn.disabled = !shouldEnable;
            console.log('Auto-fill button disabled state:', autoFillBtn.disabled);
            console.log('Button should be enabled:', shouldEnable);
            
            // Force visual update
            if (shouldEnable) {
                autoFillBtn.classList.remove('disabled');
                autoFillBtn.style.opacity = '1';
            } else {
                autoFillBtn.classList.add('disabled');
                autoFillBtn.style.opacity = '0.5';
            }
        } else {
            console.error('CRITICAL: Auto-fill button not found in handlePasteTextChange!');
        }
    }

    clearPasteText() {
        const pasteTextArea = document.getElementById('paste-note-email');
        const autoFillBtn = document.getElementById('auto-fill-btn');
        
        if (pasteTextArea) pasteTextArea.value = '';
        if (autoFillBtn) autoFillBtn.disabled = true;
    }

    async autoFillForm() {
        const pasteText = document.getElementById('paste-note-email').value.trim();
        const testMode = document.getElementById('test-mode-toggle')?.checked;
        
        if (!pasteText) {
            alert('Please paste some text first');
            return;
        }

        // Show loading indicator
        const autoFillBtn = document.getElementById('auto-fill-btn');
        const originalText = autoFillBtn.textContent;
        autoFillBtn.textContent = 'Parsing with AI...';
        autoFillBtn.disabled = true;

        try {
            console.log('Starting AI parsing for text:', pasteText.substring(0, 100) + '...');
            const extractedData = await this.api.parseTextWithAI(pasteText);
            
            // Log the raw GPT response for debugging
            console.log('Raw GPT-4 response:', extractedData);
            
            // Validate extracted data has minimum required fields
            if (!this.validateExtractedData(extractedData)) {
                throw new Error('Insufficient data extracted. Please ensure the text contains customer information including company name and contact details.');
            }
            
            this.populateFormFromExtractedData(extractedData);
            this.clearPasteText();
            
            // Show success message with test mode indicator
            const modeMsg = testMode ? ' (Test Mode - will not save to database)' : '';
            this.showMessage(`Form populated successfully with AI-parsed data!${modeMsg}`, 'success');
            
        } catch (error) {
            console.error('AI auto-fill error:', error);
            this.showMessage(`AI parsing failed: ${error.message}`, 'error');
        } finally {
            // Restore button
            autoFillBtn.textContent = originalText;
            autoFillBtn.disabled = false;
        }
    }

    populateFormFromExtractedData(data) {
        console.log('Populating form with AI-extracted data:', data);

        // Map AI response fields to ACTUAL form field IDs from the HTML
        const fieldMappings = {
            // Company information (use the correct HTML field ID)
            'company-name': data.customer_name || data.company_name || data.companyName,
            'physical-address': data.company_address || data.address,
            
            // Primary contact
            'primary-name': data.contact_name || data.primaryContact?.name,
            'primary-email': data.contact_email || data.primaryContact?.email,
            'primary-phone': data.contact_phone || data.primaryContact?.phone,
            
            // Authorized signer (use same contact info if not specified)
            'signer-name': data.signer_name || data.contact_name,
            'signer-email': data.signer_email || data.contact_email,
            'signer-phone': data.signer_phone || data.contact_phone,
            
            // Billing contact
            'billing-name': data.billing_contact?.name || data.contact_name,
            'billing-email': data.billing_contact?.email || data.contact_email,
            'billing-phone': data.billing_contact?.phone || data.contact_phone,
            'billing-address': data.billing_address || data.company_address,
            
            // Service and business info
            'number-of-locations': data.number_of_locations,
            'paste-text': data.notes_summary || data.notes || data.additional_info
        };

        // Populate each field with detailed logging
        console.log('=== DETAILED FIELD POPULATION ===');
        for (const [fieldId, value] of Object.entries(fieldMappings)) {
            console.log(`Checking field: ${fieldId}, value: ${value}`);
            
            if (value) {
                const field = document.getElementById(fieldId);
                if (field) {
                    field.value = value;
                    // Trigger change events
                    field.dispatchEvent(new Event('change', { bubbles: true }));
                    field.dispatchEvent(new Event('input', { bubbles: true }));
                    console.log(`✓ Successfully populated ${fieldId}: "${value}"`);
                } else {
                    console.error(`✗ Field ID '${fieldId}' not found in DOM!`);
                    
                    // Try to find similar field names
                    const allFields = document.querySelectorAll('input, textarea, select');
                    const similarFields = Array.from(allFields)
                        .filter(f => f.id && f.id.toLowerCase().includes(fieldId.split('-')[0]))
                        .map(f => f.id);
                    
                    if (similarFields.length > 0) {
                        console.log(`   Similar field IDs found: ${similarFields.join(', ')}`);
                    }
                }
            } else {
                console.log(`○ Skipping ${fieldId} - no value provided`);
            }
        }

        // Handle dropdown fields
        if (data.service_requested) {
            const serviceSelect = document.getElementById('service-requested');
            if (serviceSelect) {
                // Try to match the service to existing options
                for (let option of serviceSelect.options) {
                    if (option.text.toLowerCase().includes(data.service_requested.toLowerCase()) ||
                        data.service_requested.toLowerCase().includes(option.text.toLowerCase())) {
                        serviceSelect.value = option.value;
                        console.log('Matched service:', option.text);
                        break;
                    }
                }
            }
        }

        if (data.urgency_level) {
            const urgencySelect = document.getElementById('urgency');
            if (urgencySelect) {
                // Map urgency levels
                const urgencyMap = {
                    'high': 'high',
                    'urgent': 'high',
                    'medium': 'medium',
                    'normal': 'medium',
                    'low': 'low'
                };
                const mappedUrgency = urgencyMap[data.urgency_level.toLowerCase()];
                if (mappedUrgency) {
                    urgencySelect.value = mappedUrgency;
                    console.log('Set urgency:', mappedUrgency);
                }
            }
        }

        // Log what went into notes for user awareness
        if (data.notes_summary) {
            console.log('Additional information captured in notes:', data.notes_summary);
        }
        
        console.log('Form populated successfully with AI data');
    }

    showMessage(text, type) {
        // Remove any existing messages first
        const existingMessages = document.querySelectorAll('.success-message, .error-message');
        existingMessages.forEach(msg => msg.remove());
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `${type}-message`;
        messageDiv.textContent = text;
        
        if (type === 'success') {
            messageDiv.style.cssText = 'background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 10px; border-radius: 4px; margin: 10px 0; position: relative; z-index: 1000;';
        } else if (type === 'error') {
            messageDiv.style.cssText = 'background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 10px; border-radius: 4px; margin: 10px 0; position: relative; z-index: 1000; font-weight: bold;';
        }
        
        // Insert at the top of the form view
        const formView = document.getElementById('customer-form-view');
        if (formView) {
            const formHeader = formView.querySelector('.form-header');
            if (formHeader) {
                formHeader.parentNode.insertBefore(messageDiv, formHeader.nextSibling);
            } else {
                formView.insertBefore(messageDiv, formView.firstChild);
            }
        } else {
            // Fallback: insert at top of active view
            const activeView = document.querySelector('.view.active');
            if (activeView) {
                activeView.insertBefore(messageDiv, activeView.firstChild);
            }
        }
        
        // Auto-remove success messages after 5 seconds
        if (type === 'success') {
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.remove();
                }
            }, 5000);
        }
    }

    escapeHtml(text) {
        if (typeof text !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Add new utility methods for Version 1.1
    validateExtractedData(data) {
        // Check for minimum required fields
        const hasCompanyName = data.customer_name || data.company_name;
        const hasContactInfo = data.contact_name || data.contact_email || data.contact_phone;
        
        return hasCompanyName && hasContactInfo;
    }
    
    detectFieldChanges(originalData, updatedData) {
        const changes = [];
        
        // Check simple fields
        const fieldsToCheck = {
            'company_name': 'Company Name',
            'status': 'Status',
            'affiliate_partner': 'Affiliate Partner',
            'next_step': 'Next Step',
            'physical_address': 'Physical Address',
            'billing_address': 'Billing Address'
        };
        
        for (const [key, label] of Object.entries(fieldsToCheck)) {
            if (originalData[key] !== updatedData[key]) {
                changes.push({
                    field: label,
                    oldValue: originalData[key] || 'None',
                    newValue: updatedData[key] || 'None'
                });
            }
        }
        
        // Check contact objects
        const contactFields = {
            'primary_contact': 'Primary Contact',
            'authorized_signer': 'Authorized Signer',
            'billing_contact': 'Billing Contact'
        };
        
        for (const [key, label] of Object.entries(contactFields)) {
            const original = originalData[key] || {};
            const updated = updatedData[key] || {};
            
            if (JSON.stringify(original) !== JSON.stringify(updated)) {
                changes.push({
                    field: label,
                    oldValue: this.formatContactInfo(original),
                    newValue: this.formatContactInfo(updated)
                });
            }
        }
        
        return changes;
    }
    
    formatContactInfo(contact) {
        if (!contact || (!contact.name && !contact.email && !contact.phone)) {
            return 'None';
        }
        const parts = [];
        if (contact.name) parts.push(contact.name);
        if (contact.email) parts.push(contact.email);
        if (contact.phone) parts.push(contact.phone);
        return parts.join(', ');
    }

    async createSystemNote(customerId, content) {
        try {
            console.log('Creating system note for customer:', customerId, 'Content:', content);
            const result = await this.api.createSystemNote(customerId, content);
            console.log('System note created successfully:', result);
            return result;
        } catch (error) {
            console.error('Failed to create system note:', error);
            throw error;
        }
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
    
    // Debug info only in development mode (will be set by CRMApp after environment check)
    window.createDebugInfo = function(isDevelopment) {
        if (!isDevelopment) {
            return; // Hide debug info in production
        }
        
        const debugInfo = document.createElement('div');
        debugInfo.id = 'debug-info';
        debugInfo.style.cssText = 'position: fixed; top: 0; right: 0; background: rgba(0,0,0,0.8); color: white; padding: 10px; font-size: 12px; z-index: 9999; max-width: 300px;';
        debugInfo.innerHTML = `
            <strong>🔧 Dev Debug Info:</strong><br>
            Iframe: ${env.isIframe}<br>
            Replit: ${env.isReplit}<br>
            URL: ${window.location.hostname}<br>
            <button onclick="window.debugApp && window.debugApp.loadCustomers()" style="margin-top: 5px;">Reload Customers</button>
            <button onclick="this.parentElement.style.display='none'" style="margin-top: 5px;">Hide</button>
            <a href="/dev-console" style="display: block; color: #4CAF50; margin-top: 5px; text-decoration: none;">🛠️ Dev Console</a>
        `;
        document.body.appendChild(debugInfo);
    };
    
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