// Database API client
class DatabaseAPI {
    constructor() {
        this.baseURL = '';
        this.currentUser = null;
    }

    // Helper method to get headers with session token for iframe contexts
    getAuthHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        // Check for session tokens in localStorage (both dev and prod)
        const devSessionToken = localStorage.getItem('devSessionToken');
        const prodSessionToken = localStorage.getItem('prodSessionToken');
        
        if (devSessionToken) {
            headers['X-Dev-Session'] = devSessionToken;
            console.log('Using development session token for authentication');
        }
        if (prodSessionToken) {
            headers['X-Dev-Session'] = prodSessionToken; // Use same header for both
            console.log('Using production session token for authentication:', prodSessionToken);
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
            const url = endpoint.startsWith('/api/') ? endpoint : `/api${endpoint}`;
            console.log('DatabaseAPI: Making fetch request to', url);
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
            const response = await fetch('/api/auth/me', this.getFetchOptions('GET'));
            
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
            await fetch('/api/auth/logout', this.getFetchOptions('POST'));
            this.currentUser = null;
            window.location.href = '/auth.html';
        } catch (error) {
            console.error('Logout failed:', error);
        }
    }

    async getCustomers() {
        try {
            console.log('DatabaseAPI: Making fetch request to', '/api/customers');
            console.log('Current window location:', window.location.href);
            
            const response = await fetch('/api/customers', this.getFetchOptions('GET'));
            
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
            const response = await fetch(`/api/customers/${customerId}`);
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
            
            const response = await fetch('/api/customers', {
                ...this.getFetchOptions('POST', customerData)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Server error response:', errorText);
                
                // Handle duplicate customer error
                if (response.status === 409) {
                    const error = JSON.parse(errorText);
                    if (error.error === 'duplicate') {
                        throw new Error('DUPLICATE_CUSTOMER');
                    }
                }
                
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
            const response = await fetch(`/api/customers/${customerId}`, {
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
        if (!customerId) {
            throw new Error('Customer ID is required');
        }
        
        console.log('🌐 DatabaseAPI: DELETE REQUEST STARTING');
        console.log('A. Customer ID:', customerId);
        
        const fetchOptions = {
            method: 'DELETE',
            credentials: 'include'
        };
        
        const fetchUrl = `/api/customers/${customerId}`;
        
        console.log('B. Fetch URL:', fetchUrl);
        console.log('C. Fetch Options:', fetchOptions);
        console.log('D. Fetch method:', fetchOptions.method);
        console.log('E. Fetch credentials:', fetchOptions.credentials);
        
        console.log('F. Sending fetch request...');
        
        const response = await fetch(fetchUrl, fetchOptions);
        
        console.log('G. Response received');
        console.log('H. Response status:', response.status);
        console.log('I. Response statusText:', response.statusText);
        console.log('J. Response ok:', response.ok);
        console.log('K. Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
            console.log('L. Response NOT OK - getting error text...');
            const responseText = await response.text();
            console.error('M. Error response body:', responseText);
            throw new Error(`${response.status} ${responseText}`);
        }
        
        console.log('N. Response OK - parsing JSON...');
        const result = await response.json();
        console.log('O. JSON parsed successfully:', result);
        return result;
    }

    // File management methods
    async uploadFiles(customerId, files, locationTag = null) {
        try {
            const formData = new FormData();
            
            console.log('Creating FormData with', files.length, 'files');
            for (let i = 0; i < files.length; i++) {
                console.log('Adding file:', files[i].name, 'size:', files[i].size);
                formData.append('files', files[i]);
            }
            
            // Add location tag if provided
            if (locationTag) {
                console.log('Adding location tag:', locationTag);
                formData.append('locationTag', locationTag);
            }

            console.log('Sending upload request to:', `/api/customers/${customerId}/files`);
            const response = await fetch(`/api/customers/${customerId}/files`, {
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
            console.log('Fetching files from:', `/api/customers/${customerId}/files`);
            const response = await fetch(`/api/customers/${customerId}/files`);
            
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
            const response = await fetch(`/api/customers/${customerId}/files/${fileId}`, {
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

    // Affiliate management methods
    // v1.3 Affiliate Management APIs
    async getAffiliates() {
        return await this.makeRequest('GET', '/api/affiliates');
    }

    async createAffiliate(name) {
        return await this.makeRequest('POST', '/api/affiliates', { name });
    }

    async getAffiliateAEs(affiliateId = null) {
        if (affiliateId) {
            return await this.makeRequest('GET', `/api/affiliates/${affiliateId}/aes`);
        } else {
            return await this.makeRequest('GET', `/api/affiliate-aes`);
        }
    }

    async createAffiliateAE(affiliateId, name) {
        return await this.makeRequest('POST', '/api/affiliate-aes', { affiliate_id: affiliateId, name });
    }

    async updateCustomerAffiliate(customerId, affiliateId, affiliateAeId) {
        return await this.makeRequest('PUT', `/api/customers/${customerId}`, { 
            affiliate_id: affiliateId, 
            affiliate_ae_id: affiliateAeId 
        });
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
            
            console.log('Step 6: Initializing sidebar...');
            this.initializeSidebar();
            
            console.log('Step 7: Loading affiliate data...');
            await this.loadAffiliates();
            
            console.log('Step 8: Showing dashboard view...');
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
        // Add dev-environment class to body for styling adjustments
        document.body.classList.add('dev-environment');
        
        // Show development banner
        const banner = document.getElementById('dev-environment-banner');
        if (banner) {
            banner.style.display = 'block';
        }
        
        // Update page title for development with VONE branding
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
            console.log('Loading user data from /api/user...');
            
            // Use the same authentication method as other API calls
            const response = await this.api.makeRequest('GET', '/api/user');
            
            console.log('User data loaded successfully:', response);
            this.currentUser = response;
            this.userData = this.currentUser; // Ensure consistency
            this.updateUserUI();
            
            // Show admin button for admin users
            const adminBtn = document.getElementById('admin-btn');
            if (adminBtn && this.currentUser.role === 'admin') {
                adminBtn.style.display = 'block';
            }
        } catch (error) {
            console.error('Failed to load user data:', error);
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
                            <a href="#" class="company-link" onclick="app.showCustomerDetail('${customer.customer_id}'); return false;" 
                               title="${this.escapeHtml(customer.company_name)}">
                                ${this.truncateCompanyName(customer.company_name)}
                            </a>
                        </td>
                        <td class="status-cell">
                            <select class="status-dropdown" data-customer-id="${customer.customer_id}" data-original-value="${customer.status}" onchange="app.updateCustomerStatus(this)">
                                <option value="Lead" ${customer.status === 'Lead' ? 'selected' : ''}>Lead</option>
                                <option value="Quoted" ${customer.status === 'Quoted' ? 'selected' : ''}>Quoted</option>
                                <option value="Signed" ${customer.status === 'Signed' ? 'selected' : ''}>Signed</option>
                                <option value="Onboarding" ${customer.status === 'Onboarding' ? 'selected' : ''}>Onboarding</option>
                                <option value="Hypercare" ${customer.status === 'Hypercare' ? 'selected' : ''}>Hypercare</option>
                                <option value="Active" ${customer.status === 'Active' ? 'selected' : ''}>Active</option>
                                <option value="Closed" ${customer.status === 'Closed' ? 'selected' : ''}>Closed</option>
                            </select>
                        </td>
                        <td>
                            <div class="next-step-container">
                                <select class="next-step-dropdown ${customer.next_step && !this.getNextStepOptionsForStatus(customer.status).includes(customer.next_step) && customer.next_step !== '' ? 'has-custom' : ''}" 
                                        data-customer-id="${customer.customer_id}" 
                                        data-original-value="${customer.next_step || ''}" 
                                        onchange="app.updateCustomerNextStepFromDropdown(this)">
                                    <option value="">Select Next Step</option>
                                    ${this.getNextStepOptionsForStatus(customer.status).map(option => 
                                        `<option value="${option}" ${customer.next_step === option ? 'selected' : ''}>${option}</option>`
                                    ).join('')}
                                    <option value="Other" ${customer.next_step && !this.getNextStepOptionsForStatus(customer.status).includes(customer.next_step) && customer.next_step !== '' ? 'selected' : ''}>Other (Custom)</option>
                                </select>
                                ${customer.next_step && !this.getNextStepOptionsForStatus(customer.status).includes(customer.next_step) && customer.next_step !== '' ? 
                                    `<input type="text" class="custom-next-step-input" 
                                           value="${this.escapeHtml(customer.next_step)}" 
                                           data-customer-id="${customer.customer_id}"
                                           onblur="app.updateCustomerNextStep(this)"
                                           onkeypress="if(event.key==='Enter') this.blur()"
                                           placeholder="Enter custom next step">` : 
                                    ''
                                }
                            </div>
                        </td>
                        <td>
                            ${this.renderAffiliateCell(customer)}
                        </td>
                        <td>
                            ${this.renderAffiliateAECell(customer)}
                        </td>
                        <td>${this.escapeHtml(primaryContactName)}</td>
                        <td>${this.escapeHtml(primaryContactPhone)}</td>
                        <td class="files-cell">
                            ${this.renderFileAttachmentIndicator(customer)}
                        </td>
                        <td class="last-note">${this.escapeHtml(lastNote)}</td>
                        <td class="table-actions">
                            <button class="action-icon" onclick="app.createInQBO('${customer.customer_id}')" title="Create in QuickBooks">💼</button>
                            <button class="action-icon" onclick="app.sendAgreement('${customer.customer_id}')" title="Send Agreement">📄</button>
                            ${this.currentUser?.role === 'admin' ? 
                                `<button class="action-icon delete-btn" data-customer-id="${customer.customer_id}" title="Delete Customer">🗑</button>` : 
                                ''
                            }
                        </td>
                    </tr>
                `;
            }).join('');

            console.log('Setting table innerHTML...');
            tableBody.innerHTML = rowsHTML;
            
            // Add event listeners for delete buttons with proper context binding
            const deleteButtons = tableBody.querySelectorAll('.delete-btn');
            console.log('Found delete buttons:', deleteButtons.length);
            console.log('Current user:', this.currentUser);
            
            deleteButtons.forEach(button => {
                console.log('Attaching event listener to button:', button.getAttribute('data-customer-id'));
                button.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    console.log('🗑️ DELETE BUTTON CLICKED - BEFORE CONFIRM');
                    console.log('1. Customer ID captured:', button.getAttribute('data-customer-id'));
                    
                    console.log('2. Showing confirm dialog...');
                    const confirmResult = confirm('Archive this customer?');
                    console.log('3. Confirm result:', confirmResult);
                    
                    if (!confirmResult) {
                        console.log('❌ User cancelled delete');
                        return;
                    }
                    
                    console.log('✅ User confirmed delete - AFTER CONFIRM');
                    
                    const customerId = button.getAttribute('data-customer-id');
                    const row = button.closest('tr');
                    
                    console.log('4. Proceeding with delete for customer:', customerId);
                    console.log('5. Row element found:', !!row);
                    console.log('6. window.app exists:', !!window.app);
                    console.log('7. window.app.api exists:', !!window.app?.api);
                    console.log('8. window.app.api.deleteCustomer exists:', typeof window.app?.api?.deleteCustomer);
                    
                    console.log('9. About to call delete method...');
                    
                    try {
                        // Use the API instance directly from this context
                        const apiInstance = window.app.api;
                        console.log('10. API instance:', apiInstance);
                        console.log('11. Calling deleteCustomer method...');
                        
                        const result = await apiInstance.deleteCustomer(customerId);
                        
                        console.log('✅ DELETE SUCCESS - Result:', result);
                        console.log('12. Removing row from table...');
                        window.app.showToast('Customer archived');
                        row.remove();
                        console.log('13. Row removed successfully');
                        
                        // Refresh the customer list
                        await window.app.loadCustomers();
                        console.log('14. Customer list refreshed');
                        
                    } catch (err) {
                        console.error('❌ DELETE FAILED');
                        console.error('Error object:', err);
                        console.error('Error message:', err.message);
                        console.error('Error stack:', err.stack);
                        window.app.showToast('Delete failed: ' + err.message, 'error');
                    }
                });
            });
            
            console.log('SUCCESS: Rendered customers table');
            console.log('=== RENDER DEBUG END ===');
            
            // Render next actions
            this.renderNextActions();
            
            // Update sidebar stats
            this.updateSidebarStats();
            
        } catch (error) {
            console.error('ERROR in renderCustomerList:', error);
            console.error('Error details:', error.stack);
            tableBody.innerHTML = '<tr><td colspan="10" style="color: red; padding: 20px;">Error loading customers. Check console for details.</td></tr>';
        }
    }

    renderNextActions() {
        const nextActionsBody = document.getElementById("next-actions-table-body");
        if (!nextActionsBody) return;

        const customersWithNextSteps = this.customers.filter(c => c.next_step && c.next_step.trim() !== '');
        
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
            
            // DYNAMIC UPDATE: Update the corresponding next step dropdown
            this.updateNextStepDropdownForCustomer(customerId, newStatus);
            
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

    updateNextStepDropdownForCustomer(customerId, newStatus) {
        // Find the next step dropdown for this customer in the main table
        const nextStepDropdown = document.querySelector(`select.next-step-dropdown[data-customer-id="${customerId}"]`);
        
        if (nextStepDropdown) {
            const currentNextStep = nextStepDropdown.value;
            const newOptions = this.getNextStepOptionsForStatus(newStatus);
            
            // Clear existing options
            nextStepDropdown.innerHTML = '<option value="">Select Next Step</option>';
            
            // Add new options based on the new status
            newOptions.forEach(option => {
                const optionElement = document.createElement('option');
                optionElement.value = option;
                optionElement.textContent = option;
                
                // Keep current selection if it's still valid
                if (option === currentNextStep) {
                    optionElement.selected = true;
                }
                
                nextStepDropdown.appendChild(optionElement);
            });
            
            // Add "Other" option
            const otherOption = document.createElement('option');
            otherOption.value = 'Other';
            otherOption.textContent = 'Other (Custom)';
            nextStepDropdown.appendChild(otherOption);
            
            // Handle custom next steps that are no longer valid
            if (currentNextStep && !newOptions.includes(currentNextStep) && currentNextStep !== '') {
                // If current next step is not in new options, set to "Other" and show custom input
                nextStepDropdown.value = 'Other';
                
                // Find and update/create custom input field
                const row = nextStepDropdown.closest('tr');
                const nextStepCell = nextStepDropdown.closest('td');
                
                // Remove existing custom input if present
                const existingCustomInput = nextStepCell.querySelector('.custom-next-step-input');
                if (existingCustomInput) {
                    existingCustomInput.remove();
                }
                
                // Add custom input with current value
                const customInput = document.createElement('input');
                customInput.type = 'text';
                customInput.className = 'custom-next-step-input';
                customInput.value = currentNextStep;
                customInput.setAttribute('data-customer-id', customerId);
                customInput.setAttribute('placeholder', 'Enter custom next step');
                customInput.addEventListener('blur', (e) => this.updateCustomerNextStep(e.target));
                customInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') e.target.blur();
                });
                
                nextStepCell.appendChild(customInput);
            } else {
                // Remove custom input if it exists and not needed
                const nextStepCell = nextStepDropdown.closest('td');
                const existingCustomInput = nextStepCell.querySelector('.custom-next-step-input');
                if (existingCustomInput) {
                    existingCustomInput.remove();
                }
            }
            
            console.log(`Updated next step dropdown for customer ${customerId} based on new status: ${newStatus}`);
        }
        
        // Also update customer detail view if it's currently open for this customer
        if (this.currentCustomerId === customerId) {
            const detailStatusSelect = document.getElementById('edit-status');
            if (detailStatusSelect) {
                detailStatusSelect.value = newStatus;
                this.updateNextStepOptions(); // This updates the detail view next step dropdown
            }
        }
    }

    async updateAccountExecutive(inputElement) {
        const customerId = inputElement.dataset.customerId;
        const newAccountExec = inputElement.value.trim();
        const originalValue = inputElement.dataset.originalValue;

        // If unchanged, don't update
        if (newAccountExec === originalValue) {
            return;
        }

        try {
            const updateData = { affiliate_account_executive: newAccountExec };
            await this.api.updateCustomer(customerId, updateData);
            
            // Update local data
            const customerIndex = this.customers.findIndex(c => c.customer_id === customerId);
            if (customerIndex !== -1) {
                this.customers[customerIndex].affiliate_account_executive = newAccountExec;
                this.filteredCustomers = [...this.customers];
            }
            
            // Update original value for future comparisons
            inputElement.dataset.originalValue = newAccountExec;
            
            // Show brief success indicator
            inputElement.style.backgroundColor = '#d4edda';
            setTimeout(() => {
                inputElement.style.backgroundColor = '';
            }, 1000);
            
            console.log(`Updated account executive for ${customerId}: ${newAccountExec}`);
        } catch (error) {
            console.error('Failed to update account executive:', error);
            inputElement.value = originalValue; // Revert on error
            inputElement.style.backgroundColor = '#f8d7da';
            setTimeout(() => {
                inputElement.style.backgroundColor = '';
            }, 2000);
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
            // Only send the next_step field, ensuring empty strings are stored as empty strings
            const updateData = { next_step: newNextStep === '' ? '' : (newNextStep || null) };
            
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
        } else if (viewName === "admin") {
            const adminBtn = document.getElementById("admin-btn");
            if (adminBtn) adminBtn.classList.add("active");
            this.loadAdminData();
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

        const adminBtn = document.getElementById("admin-btn");
        if (adminBtn) {
            adminBtn.addEventListener("click", () => this.showView("admin"));
        }

        const adminBackBtn = document.getElementById("admin-back-btn");
        if (adminBackBtn) {
            adminBackBtn.addEventListener("click", () => this.showView("dashboard"));
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
        
        // Initialize form next step options on page load
        this.updateFormNextStepOptions();
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
            this.userData = null;
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
        // Load affiliates when showing form
        this.loadAffiliates();
    }

    // Affiliate Management Methods
    async loadAffiliates() {
        try {
            const affiliates = await this.api.getAffiliates();
            this.affiliates = affiliates || [];
            this.populateAffiliateDropdown(affiliates);
        } catch (error) {
            console.error('Failed to load affiliates:', error);
            this.affiliates = [];
        }
    }

    populateAffiliateDropdown(affiliates) {
        const dropdown = document.getElementById('affiliate-partner');
        if (!dropdown) return;

        // Clear existing options except the first one
        dropdown.innerHTML = '<option value="">Select Affiliate Partner</option>';
        
        affiliates.forEach(affiliate => {
            const option = document.createElement('option');
            option.value = affiliate.id;
            option.textContent = affiliate.name;
            dropdown.appendChild(option);
        });

        // Show/hide add button based on admin status
        const addBtn = document.querySelector('[onclick="app.showAddAffiliateModal()"]');
        if (addBtn) {
            addBtn.style.display = this.currentUser?.role === 'admin' ? 'inline-block' : 'none';
        }
    }

    async loadAffiliateAEs() {
        const affiliateSelect = document.getElementById('affiliate-partner');
        const aeSelect = document.getElementById('affiliate-account-executive');
        const addAEBtn = document.getElementById('add-ae-btn');
        
        if (!affiliateSelect.value) {
            aeSelect.innerHTML = '<option value="">Select Affiliate AE</option>';
            aeSelect.disabled = true;
            addAEBtn.disabled = true;
            return;
        }

        try {
            const aes = await this.api.getAffiliateAEs(affiliateSelect.value);
            
            aeSelect.innerHTML = '<option value="">Select Affiliate AE</option>';
            aes.forEach(ae => {
                const option = document.createElement('option');
                option.value = ae.id;
                option.textContent = ae.name;
                aeSelect.appendChild(option);
            });
            
            aeSelect.disabled = false;
            addAEBtn.disabled = false;
        } catch (error) {
            console.error('Failed to load affiliate AEs:', error);
            aeSelect.innerHTML = '<option value="">Error loading AEs</option>';
        }
    }

    showAddAffiliateModal() {
        document.getElementById('new-affiliate-name').value = '';
        document.getElementById('add-affiliate-modal').style.display = 'flex';
    }

    closeAddAffiliateModal() {
        document.getElementById('add-affiliate-modal').style.display = 'none';
    }

    async handleAddAffiliate(event) {
        event.preventDefault();
        const name = document.getElementById('new-affiliate-name').value.trim();
        
        if (!name) return;

        try {
            await this.api.createAffiliate(name);
            this.closeAddAffiliateModal();
            await this.loadAffiliates();
            this.showToast('Affiliate added successfully', 'success');
        } catch (error) {
            console.error('Failed to add affiliate:', error);
            this.showToast('Failed to add affiliate', 'error');
        }
    }

    showAddAffiliateAEModal() {
        const affiliateSelect = document.getElementById('affiliate-partner');
        const selectedOption = affiliateSelect.options[affiliateSelect.selectedIndex];
        
        if (!selectedOption || !selectedOption.value) {
            this.showToast('Please select an affiliate first', 'error');
            return;
        }

        document.getElementById('selected-affiliate-display').value = selectedOption.text;
        document.getElementById('new-affiliate-ae-name').value = '';
        document.getElementById('add-affiliate-ae-modal').style.display = 'flex';
    }

    closeAddAffiliateAEModal() {
        document.getElementById('add-affiliate-ae-modal').style.display = 'none';
    }

    async handleAddAffiliateAE(event) {
        event.preventDefault();
        const affiliateSelect = document.getElementById('affiliate-partner');
        const name = document.getElementById('new-affiliate-ae-name').value.trim();
        
        if (!name || !affiliateSelect.value) return;

        try {
            await this.api.createAffiliateAE(affiliateSelect.value, name);
            this.closeAddAffiliateAEModal();
            await this.loadAffiliateAEs();
            this.showToast('Account Executive added successfully', 'success');
        } catch (error) {
            console.error('Failed to add affiliate AE:', error);
            this.showToast('Failed to add Account Executive', 'error');
        }
    }

    // Affiliate cell rendering for dashboard table
    renderAffiliateCell(customer) {
        return `
            <div class="inline-edit-cell" data-field="affiliate_partner" data-customer-id="${customer.customer_id}">
                <span class="display-value" onclick="app.startInlineEdit(this)">${this.escapeHtml(customer.affiliate_partner || 'None')}</span>
                <select class="edit-input affiliate-dropdown" style="display: none;" data-customer-id="${customer.customer_id}" onchange="app.updateAffiliateInline(this)" onblur="app.cancelInlineEdit(this)">
                    <option value="">None</option>
                    ${(this.affiliates || []).map(affiliate => 
                        `<option value="${affiliate.name}" ${customer.affiliate_partner === affiliate.name ? 'selected' : ''}>
                            ${this.escapeHtml(affiliate.name)}
                        </option>`
                    ).join('')}
                    ${this.currentUser?.role === 'admin' ? '<option value="add_new">➕ Add New Affiliate</option>' : ''}
                </select>
            </div>
        `;
    }

    renderAffiliateAECell(customer) {
        const currentAffiliate = this.affiliates?.find(a => a.name === customer.affiliate_partner);
        const availableAEs = currentAffiliate ? 
            (this.affiliateAEs || []).filter(ae => ae.affiliate_id === currentAffiliate.id) : 
            [];
        
        return `
            <div class="inline-edit-cell" data-field="affiliate_account_executive" data-customer-id="${customer.customer_id}">
                <span class="display-value" onclick="app.startInlineEdit(this)">${this.escapeHtml(customer.affiliate_account_executive || 'None')}</span>
                <select class="edit-input affiliate-ae-dropdown" style="display: none;" data-customer-id="${customer.customer_id}" onchange="app.updateAffiliateAEInline(this)" onblur="app.cancelInlineEdit(this)">
                    <option value="">None</option>
                    ${availableAEs.map(ae => 
                        `<option value="${ae.name}" ${customer.affiliate_account_executive === ae.name ? 'selected' : ''}>
                            ${this.escapeHtml(ae.name)}
                        </option>`
                    ).join('')}
                    ${currentAffiliate ? '<option value="add_new">➕ Add New AE</option>' : ''}
                </select>
            </div>
        `;
    }

    // New dropdown rendering and management functions for v1.3
    renderAffiliateDropdown(customer) {
        const isAdmin = this.currentUser?.role === 'admin';
        const currentAffiliate = this.getAffiliateById(customer.affiliate_id) || this.getAffiliateByName(customer.affiliate_partner);
        
        let options = (this.affiliates || []).map(affiliate => 
            `<option value="${affiliate.id}" ${customer.affiliate_id === affiliate.id ? 'selected' : ''}>
                ${this.escapeHtml(affiliate.name)}
            </option>`
        ).join('');
        
        // Add "Add New Affiliate" option for admin users only
        if (isAdmin) {
            options += '<option value="add_new">➕ Add New Affiliate</option>';
        }
        
        return `
            <select class="affiliate-dropdown" 
                    data-customer-id="${customer.customer_id}" 
                    data-original-value="${customer.affiliate_id || ''}"
                    onchange="app.handleAffiliateChange(this)">
                <option value="">Select Affiliate</option>
                ${options}
            </select>
        `;
    }

    renderAffiliateAEDropdown(customer) {
        const currentAffiliate = this.getAffiliateById(customer.affiliate_id) || this.getAffiliateByName(customer.affiliate_partner);
        const availableAEs = currentAffiliate ? 
            (this.affiliateAEs || []).filter(ae => ae.affiliate_id === currentAffiliate.id) : 
            [];
        
        let options = availableAEs.map(ae => 
            `<option value="${ae.id}" ${customer.affiliate_ae_id === ae.id ? 'selected' : ''}>
                ${this.escapeHtml(ae.name)}
            </option>`
        ).join('');
        
        // Add "Add New AE" option (available to all users)
        if (currentAffiliate) {
            options += '<option value="add_new">➕ Add New AE</option>';
        }
        
        return `
            <select class="affiliate-ae-dropdown" 
                    data-customer-id="${customer.customer_id}" 
                    data-original-value="${customer.affiliate_ae_id || ''}"
                    data-affiliate-id="${currentAffiliate?.id || ''}"
                    onchange="app.handleAffiliateAEChange(this)"
                    ${!currentAffiliate ? 'disabled' : ''}>
                <option value="">Select Account Executive</option>
                ${options}
            </select>
        `;
    }

    // Helper functions for affiliate management
    getAffiliateById(id) {
        return (this.affiliates || []).find(affiliate => affiliate.id === id);
    }

    getAffiliateByName(name) {
        return (this.affiliates || []).find(affiliate => affiliate.name === name);
    }

    getAffiliateAEById(id) {
        return (this.affiliateAEs || []).find(ae => ae.id === id);
    }

    // Inline editing functions for dashboard table
    startInlineEdit(displayElement) {
        const cell = displayElement.closest('.inline-edit-cell');
        const select = cell.querySelector('.edit-input');
        
        displayElement.style.display = 'none';
        select.style.display = 'inline-block';
        select.focus();
    }

    cancelInlineEdit(selectElement) {
        const cell = selectElement.closest('.inline-edit-cell');
        const display = cell.querySelector('.display-value');
        
        selectElement.style.display = 'none';
        display.style.display = 'inline';
    }

    async updateAffiliateInline(selectElement) {
        const customerId = selectElement.dataset.customerId;
        const value = selectElement.value;
        
        if (value === 'add_new') {
            this.showAddAffiliateModal();
            this.cancelInlineEdit(selectElement);
            return;
        }

        try {
            await this.api.updateCustomer(customerId, { affiliate_partner: value });
            
            // Update local data
            const customer = this.customers.find(c => c.customer_id === customerId);
            if (customer) {
                customer.affiliate_partner = value;
                // Clear AE when affiliate changes
                customer.affiliate_account_executive = '';
                await this.api.updateCustomer(customerId, { affiliate_account_executive: '' });
            }
            
            // Refresh the view
            this.renderCustomerList();
            this.showToast('Affiliate updated successfully', 'success');
        } catch (error) {
            console.error('Failed to update affiliate:', error);
            this.showToast('Failed to update affiliate', 'error');
            this.cancelInlineEdit(selectElement);
        }
    }

    async updateAffiliateAEInline(selectElement) {
        const customerId = selectElement.dataset.customerId;
        const value = selectElement.value;
        
        if (value === 'add_new') {
            // Find current affiliate for this customer
            const customer = this.customers.find(c => c.customer_id === customerId);
            if (customer && customer.affiliate_partner) {
                this.showAddAffiliateAEModal();
            }
            this.cancelInlineEdit(selectElement);
            return;
        }

        try {
            await this.api.updateCustomer(customerId, { affiliate_account_executive: value });
            
            // Update local data
            const customer = this.customers.find(c => c.customer_id === customerId);
            if (customer) {
                customer.affiliate_account_executive = value;
            }
            
            // Refresh the view
            this.renderCustomerList();
            this.showToast('Account Executive updated successfully', 'success');
        } catch (error) {
            console.error('Failed to update affiliate AE:', error);
            this.showToast('Failed to update Account Executive', 'error');
            this.cancelInlineEdit(selectElement);
        }
    }

    // Helper functions for customer detail affiliate dropdowns
    getAffiliateAEOptionsForDetail(customer) {
        const currentAffiliate = this.affiliates?.find(a => a.name === customer.affiliate_partner);
        const availableAEs = currentAffiliate ? 
            (this.affiliateAEs || []).filter(ae => ae.affiliate_id === currentAffiliate.id) : 
            [];
        
        return availableAEs.map(ae => 
            `<option value="${ae.name}" ${customer.affiliate_account_executive === ae.name ? 'selected' : ''}>
                ${this.escapeHtml(ae.name)}
            </option>`
        ).join('');
    }

    handleAffiliateDetailChange(selectElement) {
        const value = selectElement.value;
        const aeSelect = document.getElementById('edit-affiliate-account-executive');
        
        if (value === 'add_new') {
            this.showAddAffiliateModal();
            selectElement.value = this.currentCustomer.affiliate_partner || '';
            return;
        }

        // Clear and update AE dropdown when affiliate changes
        if (aeSelect) {
            aeSelect.innerHTML = '<option value="">None</option>';
            
            if (value) {
                const affiliate = this.affiliates?.find(a => a.name === value);
                if (affiliate) {
                    const availableAEs = (this.affiliateAEs || []).filter(ae => ae.affiliate_id === affiliate.id);
                    const aeOptions = availableAEs.map(ae => 
                        `<option value="${ae.name}">${this.escapeHtml(ae.name)}</option>`
                    ).join('');
                    aeSelect.innerHTML += aeOptions + '<option value="add_new">➕ Add New AE</option>';
                }
            }
        }
    }

    // Handle affiliate dropdown changes
    async handleAffiliateChange(selectElement) {
        const customerId = selectElement.dataset.customerId;
        const newAffiliateId = selectElement.value;
        const originalValue = selectElement.dataset.originalValue;

        if (newAffiliateId === 'add_new') {
            // Admin only - show add affiliate modal
            if (this.currentUser?.role !== 'admin') {
                alert('Only administrators can add new affiliates');
                selectElement.value = originalValue;
                return;
            }
            
            const name = prompt('Enter new affiliate name:');
            if (name && name.trim()) {
                try {
                    const newAffiliate = await this.api.createAffiliate(name.trim());
                    this.affiliates.push(newAffiliate);
                    
                    // Update the dropdown and select the new affiliate
                    selectElement.value = newAffiliate.id;
                    await this.updateCustomerAffiliate(customerId, newAffiliate.id, null);
                    this.showToast('New affiliate added successfully', 'success');
                } catch (error) {
                    console.error('Failed to add affiliate:', error);
                    selectElement.value = originalValue;
                    this.showToast('Failed to add affiliate', 'error');
                }
            } else {
                selectElement.value = originalValue;
            }
            return;
        }

        // Update customer affiliate
        await this.updateCustomerAffiliate(customerId, newAffiliateId, null);
    }

    // Handle affiliate AE dropdown changes
    async handleAffiliateAEChange(selectElement) {
        const customerId = selectElement.dataset.customerId;
        const newAEId = selectElement.value;
        const affiliateId = selectElement.dataset.affiliateId;
        const originalValue = selectElement.dataset.originalValue;

        if (newAEId === 'add_new') {
            // Show add AE modal (available to all users)
            const name = prompt('Enter new Account Executive name:');
            if (name && name.trim()) {
                try {
                    const newAE = await this.api.createAffiliateAE(affiliateId, name.trim());
                    this.affiliateAEs.push(newAE);
                    
                    // Update the dropdown and select the new AE
                    selectElement.value = newAE.id;
                    await this.updateCustomerAffiliate(customerId, affiliateId, newAE.id);
                    this.showToast('New Account Executive added successfully', 'success');
                } catch (error) {
                    console.error('Failed to add AE:', error);
                    selectElement.value = originalValue;
                    this.showToast('Failed to add Account Executive', 'error');
                }
            } else {
                selectElement.value = originalValue;
            }
            return;
        }

        // Update customer AE
        await this.updateCustomerAffiliate(customerId, affiliateId, newAEId);
    }

    // Update customer affiliate and AE assignments
    async updateCustomerAffiliate(customerId, affiliateId, aeId) {
        try {
            const updateData = {
                affiliate_id: affiliateId || null,
                affiliate_ae_id: aeId || null
            };
            
            await this.api.updateCustomerAffiliate(customerId, affiliateId, aeId);
            
            // Update local data
            const customer = this.customers.find(c => c.customer_id === customerId);
            if (customer) {
                customer.affiliate_id = affiliateId;
                customer.affiliate_ae_id = aeId;
            }

            const filteredCustomer = this.filteredCustomers.find(c => c.customer_id === customerId);
            if (filteredCustomer) {
                filteredCustomer.affiliate_id = affiliateId;
                filteredCustomer.affiliate_ae_id = aeId;
            }

            // Re-render the table to update all dropdowns
            this.renderCustomerList();
            
            // Show success indicator
            const affiliate = this.getAffiliateById(affiliateId);
            const ae = this.getAffiliateAEById(aeId);
            
            this.showToast(`Updated assignment: ${affiliate?.name || 'None'} - ${ae?.name || 'None'}`, 'success');
            
        } catch (error) {
            console.error('Failed to update customer affiliate:', error);
            this.showToast('Failed to update assignment', 'error');
            
            // Revert dropdowns
            this.renderCustomerList();
        }
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
                                    `<select id="edit-status" onchange="app.handleStatusChange()">
                                        <option value="Lead" ${customer.status === 'Lead' ? 'selected' : ''}>Lead</option>
                                        <option value="Quoted" ${customer.status === 'Quoted' ? 'selected' : ''}>Quoted</option>
                                        <option value="Signed" ${customer.status === 'Signed' ? 'selected' : ''}>Signed</option>
                                        <option value="Onboarding" ${customer.status === 'Onboarding' ? 'selected' : ''}>Onboarding</option>
                                        <option value="Hypercare" ${customer.status === 'Hypercare' ? 'selected' : ''}>Hypercare</option>
                                        <option value="Active" ${customer.status === 'Active' ? 'selected' : ''}>Active</option>
                                        <option value="Closed" ${customer.status === 'Closed' ? 'selected' : ''}>Closed</option>
                                    </select>` :
                                    `<span class="field-value status-badge ${customer.status?.toLowerCase()}">${this.escapeHtml(customer.status)}</span>`
                                }
                            </div>
                            <div class="detail-field">
                                <label>Next Step</label>
                                ${this.editingSections.has('general') ? 
                                    `<select id="edit-next-step">
                                        <option value="">Select Next Step</option>
                                        ${nextStepOptionsHtml}
                                        <option value="Other">Other (Custom)</option>
                                    </select>` :
                                    `<span class="field-value">${this.escapeHtml(customer.next_step) || 'None'}</span>`
                                }
                            </div>
                            <div class="detail-field">
                                <label>Affiliate Company</label>
                                ${this.editingSections.has('general') ? 
                                    `<select id="edit-affiliate-partner" onchange="app.handleAffiliateDetailChange(this)">
                                        <option value="">None</option>
                                        ${(this.affiliates || []).map(affiliate => 
                                            `<option value="${affiliate.name}" ${customer.affiliate_partner === affiliate.name ? 'selected' : ''}>
                                                ${this.escapeHtml(affiliate.name)}
                                            </option>`
                                        ).join('')}
                                        ${this.currentUser?.role === 'admin' ? '<option value="add_new">➕ Add New Affiliate</option>' : ''}
                                    </select>` :
                                    `<span class="field-value">${this.escapeHtml(customer.affiliate_partner) || 'None'}</span>`
                                }
                            </div>
                            <div class="detail-field">
                                <label>Affiliate Account Executive</label>
                                ${this.editingSections.has('general') ? 
                                    `<select id="edit-affiliate-account-executive">
                                        <option value="">None</option>
                                        ${this.getAffiliateAEOptionsForDetail(customer)}
                                        ${customer.affiliate_partner ? '<option value="add_new">➕ Add New AE</option>' : ''}
                                    </select>` :
                                    `<span class="field-value">${this.escapeHtml(customer.affiliate_account_executive) || 'Not assigned'}</span>`
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

                    <!-- Multiple Premises Locations -->
                    <div class="detail-section" id="premises-section">
                        <div class="section-header">
                            <h3>Premises Locations</h3>
                            <button class="section-edit-btn" onclick="app.toggleSectionEdit('premises')" id="premises-edit-btn">
                                ${this.editingSections.has('premises') ? '✕' : '✏️'}
                            </button>
                        </div>
                        ${this.renderPremisesLocations(customer.premise_locations || [])}
                        ${this.editingSections.has('premises') ? 
                            `<div class="section-actions">
                                <button class="btn btn-primary btn-sm" onclick="app.saveSectionChanges('premises')">Save</button>
                                <button class="btn btn-secondary btn-sm" onclick="app.cancelSectionEdit('premises')">Cancel</button>
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
                                    <div class="location-tag-selector">
                                        <label for="file-location-tag">Tag files to location:</label>
                                        <select id="file-location-tag">
                                            <option value="">Main/General Location</option>
                                            ${(customer.premise_locations || []).map((location, index) => 
                                                `<option value="${this.escapeHtml(location.name || `Site ${index + 1}`)}">${this.escapeHtml(location.name || `Site ${index + 1}`)}</option>`
                                            ).join('')}
                                            <option value="custom">Custom Location (type below)</option>
                                        </select>
                                        <input type="text" id="custom-location-tag" placeholder="Enter custom location name" style="display: none; margin-top: 8px;">
                                    </div>
                                    <div class="upload-dropzone" id="upload-dropzone">
                                        <input type="file" id="file-input" multiple accept="image/*,.heic,.heif,.pdf,video/*" style="display: none;">
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
            this.setupLocationTagging();
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
                            ${file.location_tag ? `<br><span class="location-tag">📍 ${this.escapeHtml(file.location_tag)}</span>` : ''}
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

    setupLocationTagging() {
        const locationSelect = document.getElementById('file-location-tag');
        const customLocationInput = document.getElementById('custom-location-tag');
        
        if (!locationSelect || !customLocationInput) return;
        
        locationSelect.addEventListener('change', function() {
            if (this.value === 'custom') {
                customLocationInput.style.display = 'block';
                customLocationInput.focus();
            } else {
                customLocationInput.style.display = 'none';
                customLocationInput.value = '';
            }
        });
    }

    getSelectedLocationTag() {
        const locationSelect = document.getElementById('file-location-tag');
        const customLocationInput = document.getElementById('custom-location-tag');
        
        if (!locationSelect) return null;
        
        if (locationSelect.value === 'custom') {
            return customLocationInput?.value?.trim() || null;
        }
        
        return locationSelect.value || null;
    }

    async handleFileUpload(files) {
        if (!files || files.length === 0) return;

        const validFiles = Array.from(files).filter(file => {
            const isValidType = file.type.startsWith('image/') || file.type === 'application/pdf' || file.type.startsWith('video/');
            const maxSize = 50 * 1024 * 1024; // 50MB for all file types

            if (!isValidType) {
                alert(`${file.name}: Only images, PDFs, and videos are allowed.`);
                return false;
            }
            if (file.size > maxSize) {
                alert(`${file.name}: File must be less than 50MB.`);
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
            
            // Get selected location tag
            const locationTag = this.getSelectedLocationTag();
            console.log('Location tag for files:', locationTag);
            
            const result = await this.api.uploadFiles(this.currentCustomer.customer_id, validFiles, locationTag);
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
            "Lead": ["Schedule Call", "Send Quote", "Follow with Affiliate AE"],
            "Quoted": ["Follow Up", "Send Contract"],
            "Signed": ["Order Hardware", "Configure in Dashboard", "Schedule Install"],
            "Onboarding": ["Perform Install and Test", "Place in Billing"],
            "Hypercare": ["Confirm Success", "Initial Support Check-in", "Transition to Active"],
            "Active": ["Support", "Expansion Opportunity"],
            "Closed": ["Exit Survey", "Engage", "None"]
        };
        return statusNextStepMapping[status] || [];
    }

    getNextStepOptionsForStatus(status) {
        return this.getNextStepOptions(status);
    }

    // Sidebar functionality
    initializeSidebar() {
        console.log('Initializing quick action sidebar...');
        
        // Bind sidebar toggle
        const sidebarToggle = document.getElementById('sidebar-toggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => this.toggleSidebar());
        }

        // Bind quick action buttons
        this.bindQuickActionButtons();
        
        // Update sidebar stats
        this.updateSidebarStats();
        
        console.log('Sidebar initialized successfully');
    }

    toggleSidebar() {
        const sidebar = document.getElementById('quick-action-sidebar');
        const toggleIcon = document.querySelector('.toggle-icon');
        
        if (sidebar) {
            sidebar.classList.toggle('collapsed');
            
            // Update toggle icon
            if (toggleIcon) {
                if (sidebar.classList.contains('collapsed')) {
                    toggleIcon.textContent = '→';
                } else {
                    toggleIcon.textContent = '←';
                }
            }
        }
    }

    bindQuickActionButtons() {
        // Customer Management Actions
        const quickAddCustomer = document.getElementById('quick-add-customer');
        if (quickAddCustomer) {
            quickAddCustomer.addEventListener('click', () => {
                this.showAddCustomerForm();
            });
        }

        const quickImportCustomers = document.getElementById('quick-import-customers');
        if (quickImportCustomers) {
            quickImportCustomers.addEventListener('click', () => {
                this.showImportView();
            });
        }

        const quickExportCustomers = document.getElementById('quick-export-customers');
        if (quickExportCustomers) {
            quickExportCustomers.addEventListener('click', () => {
                this.exportCustomerData();
            });
        }

        // Bulk Operations
        const bulkStatusUpdate = document.getElementById('bulk-status-update');
        if (bulkStatusUpdate) {
            bulkStatusUpdate.addEventListener('click', () => {
                this.showBulkStatusDialog();
            });
        }

        const bulkNextStep = document.getElementById('bulk-next-step');
        if (bulkNextStep) {
            bulkNextStep.addEventListener('click', () => {
                this.showBulkNextStepDialog();
            });
        }

        const bulkAssignAffiliate = document.getElementById('bulk-assign-affiliate');
        if (bulkAssignAffiliate) {
            bulkAssignAffiliate.addEventListener('click', () => {
                this.showBulkAffiliateDialog();
            });
        }

        // Quick Navigation
        const filterLeads = document.getElementById('filter-leads');
        if (filterLeads) {
            filterLeads.addEventListener('click', () => {
                this.applyQuickFilter('status', 'Lead');
            });
        }

        const filterActive = document.getElementById('filter-active');
        if (filterActive) {
            filterActive.addEventListener('click', () => {
                this.applyQuickFilter('status', 'Active');
            });
        }

        const filterPending = document.getElementById('filter-pending');
        if (filterPending) {
            filterPending.addEventListener('click', () => {
                this.filterPendingActions();
            });
        }

        const clearFilters = document.getElementById('clear-filters');
        if (clearFilters) {
            clearFilters.addEventListener('click', () => {
                this.clearAllFilters();
            });
        }
    }

    updateSidebarStats() {
        if (!this.customers) return;

        const totalCustomers = this.customers.length;
        const activeCustomers = this.customers.filter(c => c.status === 'Active').length;
        const leadsCount = this.customers.filter(c => c.status === 'Lead').length;
        const pendingActions = this.customers.filter(c => c.next_step && c.next_step.trim() !== '').length;

        // Update stat elements
        this.updateStatElement('total-customers', totalCustomers);
        this.updateStatElement('active-customers', activeCustomers);
        this.updateStatElement('leads-count', leadsCount);
        this.updateStatElement('pending-actions', pendingActions);
    }

    updateStatElement(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }

    applyQuickFilter(filterType, value) {
        const filterElement = document.getElementById(`${filterType}-filter`);
        if (filterElement) {
            filterElement.value = value;
            this.filters[filterType] = value;
            this.applyFilters();
            this.showView('dashboard');
        }
    }

    filterPendingActions() {
        // Filter customers with next steps
        this.filteredCustomers = this.customers.filter(customer => 
            customer.next_step && customer.next_step.trim() !== ''
        );
        this.renderCustomerList();
        this.showView('dashboard');
    }

    clearAllFilters() {
        // Reset all filter inputs
        const statusFilter = document.getElementById('status-filter');
        const affiliateFilter = document.getElementById('affiliate-filter');
        const searchFilter = document.getElementById('search-filter');

        if (statusFilter) statusFilter.value = '';
        if (affiliateFilter) affiliateFilter.value = '';
        if (searchFilter) searchFilter.value = '';

        // Reset filters object
        this.filters = { status: '', affiliate: '', search: '' };
        
        // Apply filters to show all customers
        this.applyFilters();
    }

    exportCustomerData() {
        try {
            const dataToExport = this.customers.map(customer => ({
                customer_id: customer.customer_id,
                company_name: customer.company_name,
                status: customer.status,
                next_step: customer.next_step,
                affiliate_partner: customer.affiliate_partner,
                primary_contact_name: customer.primary_contact?.name || '',
                primary_contact_email: customer.primary_contact?.email || '',
                primary_contact_phone: customer.primary_contact?.phone || '',
                physical_address: `${customer.phys_street1 || ''} ${customer.phys_street2 || ''} ${customer.phys_city || ''} ${customer.phys_state || ''} ${customer.phys_zip || ''}`.trim(),
                billing_address: `${customer.bill_street1 || ''} ${customer.bill_street2 || ''} ${customer.bill_city || ''} ${customer.bill_state || ''} ${customer.bill_zip || ''}`.trim(),
                created_at: customer.created_at,
                updated_at: customer.updated_at
            }));

            // Convert to CSV
            const headers = Object.keys(dataToExport[0] || {});
            const csvContent = [
                headers.join(','),
                ...dataToExport.map(row => 
                    headers.map(header => {
                        const value = row[header] || '';
                        // Escape commas and quotes in CSV
                        return `"${value.toString().replace(/"/g, '""')}"`;
                    }).join(',')
                )
            ].join('\n');

            // Download file
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `vone-customers-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            this.showToast('Customer data exported successfully', 'success');
        } catch (error) {
            console.error('Failed to export customer data:', error);
            this.showToast('Failed to export customer data', 'error');
        }
    }

    showBulkStatusDialog() {
        // Create modal for bulk status update
        const modal = this.createBulkActionModal('Update Status', [
            { label: 'New Status:', type: 'select', id: 'bulk-status', options: [
                'Lead', 'Quoted', 'Signed', 'Onboarding', 'Hypercare', 'Active', 'Closed'
            ]}
        ], (formData) => this.executeBulkStatusUpdate(formData.status));
        
        document.body.appendChild(modal);
    }

    showBulkNextStepDialog() {
        const modal = this.createBulkActionModal('Set Next Steps', [
            { label: 'Status Filter:', type: 'select', id: 'filter-status', options: [
                '', 'Lead', 'Quoted', 'Signed', 'Onboarding', 'Hypercare', 'Active', 'Closed'
            ]},
            { label: 'Next Step:', type: 'text', id: 'bulk-next-step', placeholder: 'Enter next step...' }
        ], (formData) => this.executeBulkNextStepUpdate(formData));
        
        document.body.appendChild(modal);
    }

    showBulkAffiliateDialog() {
        const modal = this.createBulkActionModal('Assign Affiliate', [
            { label: 'Affiliate Partner:', type: 'select', id: 'bulk-affiliate', options: [
                '', 'VOXO', 'Network Tigers', 'Rhino Networks', 'Direct', 'Other'
            ]}
        ], (formData) => this.executeBulkAffiliateUpdate(formData.affiliate));
        
        document.body.appendChild(modal);
    }

    createBulkActionModal(title, fields, onSubmit) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <p>This will update all customers currently visible in the table.</p>
                    <form id="bulk-action-form">
                        ${fields.map(field => {
                            if (field.type === 'select') {
                                return `
                                    <div class="form-group">
                                        <label for="${field.id}">${field.label}</label>
                                        <select id="${field.id}" name="${field.id.replace('bulk-', '').replace('filter-', '')}">
                                            ${field.options.map(option => 
                                                `<option value="${option}">${option || 'All/None'}</option>`
                                            ).join('')}
                                        </select>
                                    </div>
                                `;
                            } else {
                                return `
                                    <div class="form-group">
                                        <label for="${field.id}">${field.label}</label>
                                        <input type="${field.type}" id="${field.id}" name="${field.id.replace('bulk-', '')}" placeholder="${field.placeholder || ''}">
                                    </div>
                                `;
                            }
                        }).join('')}
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">Update ${this.filteredCustomers.length} Customer(s)</button>
                            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        // Handle form submission
        modal.querySelector('#bulk-action-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            onSubmit(data);
            modal.remove();
        });

        return modal;
    }

    async executeBulkStatusUpdate(newStatus) {
        if (!newStatus) return;

        try {
            const updates = [];
            for (const customer of this.filteredCustomers) {
                updates.push(this.api.updateCustomer(customer.customer_id, { status: newStatus }));
                // Update local data
                customer.status = newStatus;
            }

            await Promise.all(updates);
            this.renderCustomerList();
            this.updateSidebarStats();
            this.showToast(`Updated status to "${newStatus}" for ${this.filteredCustomers.length} customer(s)`, 'success');
        } catch (error) {
            console.error('Bulk status update failed:', error);
            this.showToast('Bulk status update failed', 'error');
        }
    }

    async executeBulkNextStepUpdate(data) {
        if (!data.nextstep) return;

        try {
            let customersToUpdate = this.filteredCustomers;
            
            // Filter by status if specified
            if (data.status) {
                customersToUpdate = customersToUpdate.filter(c => c.status === data.status);
            }

            const updates = [];
            for (const customer of customersToUpdate) {
                updates.push(this.api.updateCustomer(customer.customer_id, { next_step: data.nextstep }));
                // Update local data
                customer.next_step = data.nextstep;
            }

            await Promise.all(updates);
            this.renderCustomerList();
            this.updateSidebarStats();
            this.showToast(`Updated next step for ${customersToUpdate.length} customer(s)`, 'success');
        } catch (error) {
            console.error('Bulk next step update failed:', error);
            this.showToast('Bulk next step update failed', 'error');
        }
    }

    async executeBulkAffiliateUpdate(newAffiliate) {
        if (!newAffiliate) return;

        try {
            const updates = [];
            for (const customer of this.filteredCustomers) {
                updates.push(this.api.updateCustomer(customer.customer_id, { affiliate_partner: newAffiliate }));
                // Update local data
                customer.affiliate_partner = newAffiliate;
            }

            await Promise.all(updates);
            this.renderCustomerList();
            this.updateSidebarStats();
            this.showToast(`Updated affiliate to "${newAffiliate}" for ${this.filteredCustomers.length} customer(s)`, 'success');
        } catch (error) {
            console.error('Bulk affiliate update failed:', error);
            this.showToast('Bulk affiliate update failed', 'error');
        }
    }

    toggleEditMode(editing) {
        this.editMode = editing;
        this.renderCustomerDetail();
    }

    // NEW: Handle status changes with closure note enforcement
    handleStatusChange() {
        const statusSelect = document.getElementById('edit-status');
        if (!statusSelect) return;
        
        const newStatus = statusSelect.value;
        const oldStatus = this.currentCustomer?.status;
        
        // If changing to "Closed", require closure note
        if (newStatus === 'Closed' && oldStatus !== 'Closed') {
            // Store the intended status change
            this.pendingStatusChange = {
                newStatus: newStatus,
                oldStatus: oldStatus
            };
            
            // Reset the dropdown to old status temporarily
            statusSelect.value = oldStatus;
            
            // Show the closure note modal
            this.showClosureNoteModal();
            return;
        }
        
        // For other status changes, proceed normally
        this.updateNextStepOptions();
    }

    showClosureNoteModal() {
        document.getElementById('closure-note-modal').style.display = 'flex';
        document.getElementById('closure-note-text').value = '';
        document.getElementById('closure-note-text').focus();
        
        // Bind form submission if not already bound
        const form = document.getElementById('closure-note-form');
        if (form && !form.hasAttribute('data-bound')) {
            form.setAttribute('data-bound', 'true');
            form.addEventListener('submit', (e) => this.submitClosureNote(e));
        }
    }

    async submitClosureNote(e) {
        e.preventDefault();
        const noteText = document.getElementById('closure-note-text').value.trim();
        
        if (!noteText) {
            this.showToast('Closing note is required', 'error');
            return;
        }
        
        try {
            // First, add the closing note
            await this.api.createNote(this.currentCustomer.customer_id, {
                content: `🔒 Closure: ${noteText}`,
                type: 'closure'
            });
            
            // Then update the status to Closed
            const statusSelect = document.getElementById('edit-status');
            if (statusSelect && this.pendingStatusChange) {
                statusSelect.value = this.pendingStatusChange.newStatus;
                this.updateNextStepOptions();
            }
            
            // Close modal and clear pending change
            this.cancelClosureNote();
            
            this.showToast('Closing note added and status updated', 'success');
            
        } catch (error) {
            console.error('Failed to add closure note:', error);
            this.showToast('Failed to add closure note', 'error');
        }
    }

    cancelClosureNote() {
        document.getElementById('closure-note-modal').style.display = 'none';
        this.pendingStatusChange = null;
        
        // Reset status dropdown to original value if needed
        const statusSelect = document.getElementById('edit-status');
        if (statusSelect && this.currentCustomer) {
            statusSelect.value = this.currentCustomer.status;
        }
    }

    updateNextStepOptions() {
        const statusSelect = document.getElementById('edit-status');
        const nextStepSelect = document.getElementById('edit-next-step');
        
        if (!statusSelect || !nextStepSelect) return;
        
        const selectedStatus = statusSelect.value;
        const currentNextStep = nextStepSelect.value; // Preserve current selection
        const nextStepOptions = this.getNextStepOptions(selectedStatus);
        
        // Clear current options
        nextStepSelect.innerHTML = '<option value="">Select Next Step</option>';
        
        // Add new options
        nextStepOptions.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = option;
            // Restore selection if the option is still available
            if (option === currentNextStep) {
                optionElement.selected = true;
            }
            nextStepSelect.appendChild(optionElement);
        });
        
        // Add "Other" option for custom next steps
        const otherOption = document.createElement('option');
        otherOption.value = 'Other';
        otherOption.textContent = 'Other (Custom)';
        nextStepSelect.appendChild(otherOption);
        
        // If current selection is not in new options, set to Other and show custom input
        if (currentNextStep && !nextStepOptions.includes(currentNextStep) && currentNextStep !== '') {
            nextStepSelect.value = 'Other';
            this.showCustomNextStepInput(true, currentNextStep);
        } else if (currentNextStep === 'Other') {
            nextStepSelect.value = 'Other';
            this.showCustomNextStepInput(true);
        } else {
            this.showCustomNextStepInput(false);
        }
        
        // If current selection is not in new options, try to keep the current customer's next_step
        if (currentNextStep && !nextStepOptions.includes(currentNextStep) && this.currentCustomer) {
            const customerNextStep = this.currentCustomer.next_step;
            if (customerNextStep && nextStepOptions.includes(customerNextStep)) {
                nextStepSelect.value = customerNextStep;
            }
        }
    }

    showCustomNextStepInput(show, value = '') {
        const container = document.getElementById('edit-next-step').parentNode;
        let customInput = container.querySelector('.custom-next-step-input');
        
        if (show) {
            if (!customInput) {
                customInput = document.createElement('input');
                customInput.type = 'text';
                customInput.className = 'custom-next-step-input';
                customInput.placeholder = 'Enter custom next step';
                customInput.style.marginTop = '5px';
                customInput.style.width = '100%';
                container.appendChild(customInput);
            }
            customInput.value = value;
            customInput.style.display = 'block';
        } else {
            if (customInput) {
                customInput.style.display = 'none';
            }
        }
    }

    async updateCustomerNextStepFromDropdown(selectElement) {
        const customerId = selectElement.dataset.customerId;
        const selectedValue = selectElement.value;
        const originalValue = selectElement.dataset.originalValue || '';

        try {
            let nextStepValue = selectedValue;
            
            if (selectedValue === 'Other') {
                // Don't update database yet - wait for custom input
                selectElement.classList.add('has-custom');
                
                // Find the container and add custom input
                const container = selectElement.closest('.next-step-container');
                if (container) {
                    // Remove existing custom input if any
                    const existingInput = container.querySelector('.custom-next-step-input');
                    if (existingInput) {
                        existingInput.remove();
                    }
                    
                    // Create and add new custom input
                    const customInput = document.createElement('input');
                    customInput.type = 'text';
                    customInput.className = 'custom-next-step-input';
                    customInput.value = originalValue && originalValue !== 'Other' ? originalValue : '';
                    customInput.dataset.customerId = customerId;
                    customInput.placeholder = 'Enter custom next step';
                    
                    // Add event handlers
                    customInput.onblur = () => this.updateCustomerNextStep(customInput);
                    customInput.onkeypress = (e) => {
                        if (e.key === 'Enter') customInput.blur();
                    };
                    
                    container.appendChild(customInput);
                    
                    // Focus and select text
                    setTimeout(() => {
                        customInput.focus();
                        customInput.select();
                    }, 10);
                }
                return;
            } else {
                // Remove has-custom class and any custom input
                selectElement.classList.remove('has-custom');
                const container = selectElement.closest('.next-step-container');
                if (container) {
                    const existingInput = container.querySelector('.custom-next-step-input');
                    if (existingInput) {
                        existingInput.remove();
                    }
                }
            }

            // Validate: Next Step is required unless status is "Closed"
            const customer = this.customers.find(c => c.customer_id === customerId);
            if (customer && customer.status !== 'Closed' && (!nextStepValue || nextStepValue.trim() === '')) {
                alert('Next Step is required unless status is "Closed"');
                selectElement.value = originalValue;
                return;
            }

            console.log(`Updating customer ${customerId} next step to "${nextStepValue}"`);
            
            const updateData = { next_step: nextStepValue };
            await this.api.updateCustomer(customerId, updateData);
            
            // Create system note for next step change
            if (originalValue !== nextStepValue) {
                const content = originalValue ? 
                    `Next step updated from "${originalValue}" to "${nextStepValue}"` : 
                    `Next step set to "${nextStepValue}"`;
                await this.api.createSystemNote(customerId, content);
            }
            
            // Update local data
            if (customer) {
                customer.next_step = nextStepValue;
            }

            // Update filtered customers as well
            const filteredCustomer = this.filteredCustomers.find(c => c.customer_id === customerId);
            if (filteredCustomer) {
                filteredCustomer.next_step = nextStepValue;
            }

            // Update original value
            selectElement.dataset.originalValue = nextStepValue;

            // Re-render next actions section
            this.renderNextActions();
            
        } catch (error) {
            console.error('Failed to update customer next step:', error);
            
            // Revert the dropdown to original value
            selectElement.value = originalValue;
            
            const errorMsg = error.message || 'Failed to update next step. Please try again.';
            alert(errorMsg);
        }
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

    async sendAgreement(customerId) {
        const customer = this.customers.find(c => c.customer_id === customerId);
        if (!customer) return;
        
        // Create simple DocuSign integration modal
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content docusign-modal">
                <div class="modal-header">
                    <h3>📋 Send Service Agreement</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                </div>
                <div class="modal-body">
                    <p><strong>Customer:</strong> ${this.escapeHtml(customer.company_name)}</p>
                    <p><strong>Primary Contact:</strong> ${this.escapeHtml(customer.primary_contact?.email || 'No email on file')}</p>
                    
                    <div class="form-group">
                        <label for="agreement-type">Agreement Type:</label>
                        <select id="agreement-type">
                            <option value="service">Standard Service Agreement</option>
                            <option value="affiliate">Affiliate Partnership Agreement</option>
                            <option value="custom">Custom Agreement</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="signer-email">Signer Email:</label>
                        <input type="email" id="signer-email" value="${customer.primary_contact?.email || ''}" placeholder="Enter signer email">
                    </div>
                    
                    <div class="form-group">
                        <label for="agreement-notes">Additional Notes:</label>
                        <textarea id="agreement-notes" placeholder="Any special instructions or notes for the agreement..."></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                    <button class="btn btn-primary" onclick="app.processDocuSignAgreement('${customerId}')">Send Agreement via DocuSign</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    async processDocuSignAgreement(customerId) {
        const customer = this.customers.find(c => c.customer_id === customerId);
        if (!customer) return;
        
        const agreementType = document.getElementById('agreement-type')?.value;
        const signerEmail = document.getElementById('signer-email')?.value;
        const notes = document.getElementById('agreement-notes')?.value;
        
        if (!signerEmail) {
            alert('Please enter a signer email address.');
            return;
        }
        
        try {
            // Create system note about DocuSign request
            const systemNote = `DocuSign agreement initiated: ${agreementType} agreement sent to ${signerEmail}`;
            if (notes) {
                systemNote += `\nNotes: ${notes}`;
            }
            
            await this.api.createSystemNote(customerId, systemNote);
            
            // Close modal
            document.querySelector('.modal-overlay')?.remove();
            
            // Show success message
            this.showToast(`Agreement sent via DocuSign to ${signerEmail}`, 'success');
            
            // Refresh notes to show the system note
            if (this.currentCustomer && this.currentCustomer.customer_id === customerId) {
                await this.loadCustomerNotes();
            }
            
            // In a real implementation, this would integrate with DocuSign API
            console.log('DocuSign integration placeholder:', {
                customerId,
                customerName: customer.company_name,
                agreementType,
                signerEmail,
                notes
            });
            
        } catch (error) {
            console.error('Error processing DocuSign agreement:', error);
            this.showToast('Failed to send agreement. Please try again.', 'error');
        }
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
            affiliate_id: formData.get('affiliatePartner') || formData.get('affiliate-partner') || null,
            affiliate_ae_id: formData.get('affiliateAccountExecutive') || formData.get('affiliate-account-executive') || null,
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

        // Double-click protection
        const submitButton = e.target.querySelector('button[type="submit"]');
        if (submitButton && submitButton.disabled) {
            return; // Prevent double submission
        }
        
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Saving...';
        }

        const formData = new FormData(e.target);
        const testMode = document.getElementById('test-mode-toggle')?.checked;
        
        // Prevent saving if in test mode
        if (testMode) {
            alert('Test Mode is enabled. Please disable Test Mode to save the customer to the database.');
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = 'Save Customer';
            }
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

            const response = await fetch('/api/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(customerData)
            });
            
            console.log('Response status:', response.status);
            console.log('Response ok:', response.ok);
            
            if (response.ok) {
                const newCustomer = await response.json();
                console.log('Customer created:', newCustomer);
                
                this.customers.push(newCustomer);
                this.applyFilters();
                this.showView('dashboard');
                
                // Show success toast
                this.showToast('Customer saved successfully.', 'success');
                
                // Reset form
                e.target.reset();
            } else {
                // Parse error response
                let errorData;
                try {
                    errorData = await response.json();
                } catch (parseError) {
                    errorData = { error: response.statusText };
                }
                
                console.log('Error response:', response.status, errorData);
                
                // Handle duplicate customer error
                if (response.status === 409 && errorData.error === 'duplicate') {
                    this.showToast('Customer already exists', 'error');
                    return;
                }
                
                // Handle "already exists" gracefully
                if (errorData.error && errorData.error.toLowerCase().includes('already exists')) {
                    this.showToast('Customer already exists — info updated or duplicate skipped.', 'info');
                } else {
                    this.showToast(`Failed to save customer: ${errorData.error || response.statusText}`, 'error');
                }
            }
            
        } catch (error) {
            console.error('Error saving customer:', error);
            if (error.message === 'DUPLICATE_CUSTOMER') {
                this.showToast('Customer already exists', 'error');
            } else {
                this.showToast('Failed to save customer: ' + error.message, 'error');
            }
        } finally {
            // Re-enable submit button
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = 'Save Customer';
            }
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

    async saveSectionChanges(sectionName) {
        if (!this.currentCustomer) return;

        try {
            let updatedData = {};
            let changes = [];

            if (sectionName === 'general') {
                // Collect general section updates
                const companyName = document.getElementById('edit-company-name')?.value?.trim();
                const status = document.getElementById('edit-status')?.value;
                const affiliatePartner = document.getElementById('edit-affiliate-partner')?.value;
                const nextStep = document.getElementById('edit-next-step')?.value?.trim();

                if (!companyName) {
                    this.showToast('Company name is required.', 'error');
                    return;
                }

                const affiliateAccountExecutive = document.getElementById('edit-affiliate-account-executive')?.value?.trim();

                updatedData = {
                    company_name: companyName,
                    status: status || this.currentCustomer.status,
                    affiliate_partner: affiliatePartner || null,
                    affiliate_account_executive: affiliateAccountExecutive || null,
                    next_step: nextStep || null
                };

                // Track changes for system notes
                if (this.currentCustomer.company_name !== companyName) {
                    changes.push({ field: 'Company Name', oldValue: this.currentCustomer.company_name, newValue: companyName });
                }
                if (this.currentCustomer.status !== status) {
                    changes.push({ field: 'Status', oldValue: this.currentCustomer.status, newValue: status });
                }
                if (this.currentCustomer.affiliate_partner !== affiliatePartner) {
                    changes.push({ field: 'Affiliate Partner', oldValue: this.currentCustomer.affiliate_partner || 'None', newValue: affiliatePartner || 'None' });
                }
                if (this.currentCustomer.next_step !== nextStep) {
                    changes.push({ field: 'Next Step', oldValue: this.currentCustomer.next_step || 'None', newValue: nextStep || 'None' });
                }
                if (this.currentCustomer.affiliate_account_executive !== affiliateAccountExecutive) {
                    changes.push({ field: 'Affiliate AE', oldValue: this.currentCustomer.affiliate_account_executive || 'None', newValue: affiliateAccountExecutive || 'None' });
                }

            } else if (sectionName === 'contact') {
                // Collect contact section updates
                const physicalAddress = document.getElementById('edit-physical-address')?.value?.trim();
                const billingAddress = document.getElementById('edit-billing-address')?.value?.trim();

                updatedData = {
                    physical_address: physicalAddress || null,
                    billing_address: billingAddress || null
                };

                // Track changes
                if (this.currentCustomer.physical_address !== physicalAddress) {
                    changes.push({ field: 'Physical Address', oldValue: this.currentCustomer.physical_address || 'None', newValue: physicalAddress || 'None' });
                }
                if (this.currentCustomer.billing_address !== billingAddress) {
                    changes.push({ field: 'Billing Address', oldValue: this.currentCustomer.billing_address || 'None', newValue: billingAddress || 'None' });
                }

            } else if (sectionName === 'primary-contact') {
                // Collect primary contact updates
                const primaryName = document.getElementById('edit-primary-name')?.value?.trim();
                const primaryEmail = document.getElementById('edit-primary-email')?.value?.trim();
                const primaryPhone = document.getElementById('edit-primary-phone')?.value?.trim();

                updatedData = {
                    primary_contact: {
                        name: primaryName || null,
                        email: primaryEmail || null,
                        phone: primaryPhone || null
                    }
                };

                // Track changes for primary contact
                const currentPrimary = this.currentCustomer.primary_contact || {};
                if (currentPrimary.name !== primaryName) {
                    changes.push({ field: 'Primary Contact Name', oldValue: currentPrimary.name || 'None', newValue: primaryName || 'None' });
                }
                if (currentPrimary.email !== primaryEmail) {
                    changes.push({ field: 'Primary Contact Email', oldValue: currentPrimary.email || 'None', newValue: primaryEmail || 'None' });
                }
                if (currentPrimary.phone !== primaryPhone) {
                    changes.push({ field: 'Primary Contact Phone', oldValue: currentPrimary.phone || 'None', newValue: primaryPhone || 'None' });
                }

            } else if (sectionName === 'premises') {
                // Collect premise locations data
                const locations = [];
                let index = 0;
                
                while (document.getElementById(`premise-name-${index}`)) {
                    const name = document.getElementById(`premise-name-${index}`)?.value?.trim();
                    const address = document.getElementById(`premise-address-${index}`)?.value?.trim();
                    const contact = document.getElementById(`premise-contact-${index}`)?.value?.trim();
                    const phone = document.getElementById(`premise-phone-${index}`)?.value?.trim();
                    
                    // Only add location if it has meaningful data
                    if (name || address || contact || phone) {
                        locations.push({
                            name: name || '',
                            address: address || '',
                            contact: contact || '',
                            phone: phone || ''
                        });
                    }
                    index++;
                }
                
                updatedData = {
                    premise_locations: locations.length > 0 ? locations : null
                };
                
                changes.push({ field: 'Premise Locations', oldValue: 'Updated', newValue: `${locations.length} location(s)` });
            }

            console.log('Saving section changes:', sectionName, updatedData);

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
                await this.api.createSystemNote(this.currentCustomerId, `${sectionName.charAt(0).toUpperCase() + sectionName.slice(1)} section updated: ${changesSummary}`);
            }

            // Exit edit mode for this section
            this.editingSections.delete(sectionName);
            
            // Re-render to show updated data
            this.renderCustomerDetail();
            
            // Show success message
            this.showToast(`${sectionName.charAt(0).toUpperCase() + sectionName.slice(1)} section updated successfully.`, 'success');

            // Update dashboard if needed
            if (sectionName === 'general') {
                this.renderCustomerList();
                this.renderNextActions();
            }

        } catch (error) {
            console.error(`Failed to save ${sectionName} changes:`, error);
            this.showToast(`Failed to save ${sectionName} changes. Please try again.`, 'error');
        }
    }

    cancelSectionEdit(sectionName) {
        // Exit edit mode without saving
        this.editingSections.delete(sectionName);
        
        // Re-render to restore original data
        this.renderCustomerDetail();
    }

    updateFormNextStepOptions() {
        const statusSelect = document.getElementById('status');
        const nextStepSelect = document.getElementById('next-step');
        
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
        
        // Add "Other" option for custom next steps
        const otherOption = document.createElement('option');
        otherOption.value = 'Other';
        otherOption.textContent = 'Other (Custom)';
        nextStepSelect.appendChild(otherOption);
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

    renderPremisesLocations(locations) {
        const isEditing = this.editingSections.has('premises');
        
        if (!locations || locations.length === 0) {
            return `
                <div class="premises-content">
                    <p class="empty-state">No additional premises locations added yet.</p>
                    ${isEditing ? `
                        <button class="btn btn-outline btn-sm" onclick="app.addPremiseLocation()">
                            + Add Location
                        </button>
                    ` : ''}
                </div>
            `;
        }

        const locationsHtml = locations.map((location, index) => `
            <div class="premise-location" data-index="${index}">
                <div class="location-header">
                    <h4>Location ${index + 1}: ${this.escapeHtml(location.name || `Site ${index + 1}`)}</h4>
                    ${isEditing ? `
                        <button class="btn btn-outline btn-sm" onclick="app.removePremiseLocation(${index})">
                            Remove
                        </button>
                    ` : ''}
                </div>
                <div class="location-details">
                    ${isEditing ? `
                        <div class="detail-field">
                            <label>Location Name</label>
                            <input type="text" id="premise-name-${index}" value="${this.escapeHtml(location.name || '')}" placeholder="Main Office, Warehouse, Branch 1, etc.">
                        </div>
                        <div class="detail-field">
                            <label>Address</label>
                            <textarea id="premise-address-${index}" rows="3" placeholder="Street address, city, state, zip">${this.escapeHtml(location.address || '')}</textarea>
                        </div>
                        <div class="detail-field">
                            <label>Contact Person</label>
                            <input type="text" id="premise-contact-${index}" value="${this.escapeHtml(location.contact || '')}" placeholder="Site manager or primary contact">
                        </div>
                        <div class="detail-field">
                            <label>Phone</label>
                            <input type="tel" id="premise-phone-${index}" value="${this.escapeHtml(location.phone || '')}" placeholder="Location phone number">
                        </div>
                    ` : `
                        <div class="location-info">
                            <div class="detail-field">
                                <label>Address</label>
                                <span class="field-value">${this.escapeHtml(location.address || 'Not provided')}</span>
                            </div>
                            ${location.contact ? `
                                <div class="detail-field">
                                    <label>Contact</label>
                                    <span class="field-value">${this.escapeHtml(location.contact)}</span>
                                </div>
                            ` : ''}
                            ${location.phone ? `
                                <div class="detail-field">
                                    <label>Phone</label>
                                    <span class="field-value">${this.escapeHtml(location.phone)}</span>
                                </div>
                            ` : ''}
                        </div>
                    `}
                </div>
            </div>
        `).join('');

        return `
            <div class="premises-content">
                ${locationsHtml}
                ${isEditing ? `
                    <button class="btn btn-outline btn-sm" onclick="app.addPremiseLocation()">
                        + Add Another Location
                    </button>
                ` : ''}
            </div>
        `;
    }

    addPremiseLocation() {
        if (!this.currentCustomer.premise_locations) {
            this.currentCustomer.premise_locations = [];
        }
        
        this.currentCustomer.premise_locations.push({
            name: '',
            address: '',
            contact: '',
            phone: ''
        });
        
        this.renderCustomerDetail();
    }

    removePremiseLocation(index) {
        if (this.currentCustomer.premise_locations && this.currentCustomer.premise_locations.length > index) {
            this.currentCustomer.premise_locations.splice(index, 1);
            this.renderCustomerDetail();
        }
    }

    escapeHtml(text) {
        if (typeof text !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    truncateCompanyName(companyName) {
        if (!companyName || typeof companyName !== 'string') return '';
        const maxLength = 25;
        if (companyName.length <= maxLength) {
            return this.escapeHtml(companyName);
        }
        return this.escapeHtml(companyName.substring(0, maxLength) + '...');
    }

    // Toast notification system
    showToast(message, type) {
        const toast = document.createElement("div");
        toast.className = `toast ${type}`;
        toast.innerText = message;
        
        // Style the toast
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 4px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            max-width: 350px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        `;
        
        // Set background color based on type
        if (type === 'success') {
            toast.style.backgroundColor = '#28a745';
        } else if (type === 'error') {
            toast.style.backgroundColor = '#dc3545';
        } else if (type === 'info') {
            toast.style.backgroundColor = '#17a2b8';
        } else {
            toast.style.backgroundColor = '#6c757d';
        }
        
        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        }, 10);
        
        // Animate out and remove
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
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

    // v1.3 Admin Management Functions
    async loadAdminData() {
        try {
            // Load affiliates and account executives
            const [affiliates, allAEs] = await Promise.all([
                this.api.getAffiliates(),
                this.api.getAffiliateAEs()
            ]);
            
            this.renderAdminAffiliates(affiliates);
            this.renderAdminAEs(allAEs);
        } catch (error) {
            console.error('Failed to load admin data:', error);
            this.showToast('Failed to load admin data', 'error');
        }
    }

    renderAdminAffiliates(affiliates) {
        const tbody = document.getElementById('admin-affiliates-table');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        affiliates.forEach(affiliate => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${this.escapeHtml(affiliate.name)}</td>
                <td>${affiliate.customer_count || 0}</td>
                <td>${affiliate.ae_count || 0}</td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="app.editAffiliate('${affiliate.id}')">
                        Edit
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="app.deleteAffiliate('${affiliate.id}')">
                        Delete
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    renderAdminAEs(aes) {
        const tbody = document.getElementById('admin-aes-table');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        aes.forEach(ae => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${this.escapeHtml(ae.name)}</td>
                <td>${this.escapeHtml(ae.affiliate_name || 'N/A')}</td>
                <td>${ae.customer_count || 0}</td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="app.editAE('${ae.id}')">
                        Edit
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="app.deleteAE('${ae.id}')">
                        Delete
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    async editAffiliate(affiliateId) {
        // Implementation for editing affiliate
        console.log('Edit affiliate:', affiliateId);
        this.showToast('Edit affiliate feature coming soon', 'info');
    }

    async deleteAffiliate(affiliateId) {
        if (confirm('Are you sure you want to delete this affiliate? This action cannot be undone.')) {
            try {
                // Add delete API call when implemented
                console.log('Delete affiliate:', affiliateId);
                this.showToast('Delete affiliate feature coming soon', 'info');
                // this.loadAdminData();
            } catch (error) {
                console.error('Failed to delete affiliate:', error);
                this.showToast('Failed to delete affiliate', 'error');
            }
        }
    }

    async editAE(aeId) {
        // Implementation for editing AE
        console.log('Edit AE:', aeId);
        this.showToast('Edit AE feature coming soon', 'info');
    }

    async deleteAE(aeId) {
        if (confirm('Are you sure you want to delete this account executive? This action cannot be undone.')) {
            try {
                // Add delete API call when implemented
                console.log('Delete AE:', aeId);
                this.showToast('Delete AE feature coming soon', 'info');
                // this.loadAdminData();
            } catch (error) {
                console.error('Failed to delete AE:', error);
                this.showToast('Failed to delete AE', 'error');
            }
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
    window.app = new CRMApp();
    
    // Make app globally accessible for debugging (legacy reference)
    window.debugApp = window.app;
    console.log('App instance created and available as window.app and window.debugApp');
    
    // Additional debugging for iframe environments
    if (env.isIframe) {
        console.log('IFRAME DETECTED - Adding fallback measures');
        
        // Set up authentication token for iframe context
        if (window.location.href.includes(':3000')) {
            // Development environment
            const devToken = 'dev_session_token_placeholder';
            localStorage.setItem('devSessionToken', devToken);
            console.log('Development iframe authentication token set');
        } else {
            // Production environment
            const prodToken = 'XRBwNU_jPk1OuFV9eeig70nEtI-PAlRL';
            localStorage.setItem('prodSessionToken', prodToken);
            console.log('Production iframe authentication token set');
        }
        
        // Add a delay for iframe rendering
        setTimeout(() => {
            console.log('Iframe fallback: Re-checking DOM after delay');
            if (window.app && window.app.customers && window.app.customers.length > 0) {
                console.log('Iframe fallback: Re-rendering customers');
                window.app.renderCustomerList();
            }
        }, 1000);
    }
});