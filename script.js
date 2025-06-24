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

    async init() {
        try {
            console.log('Initializing CRM...');
            await this.loadCustomers();
            this.bindEvents();
            this.showView("dashboard");
            console.log("CRM App initialized successfully");
        } catch (error) {
            console.error("Failed to initialize app:", error);
            this.showError("dashboard-error", "Failed to load application data.");
        }
    }

    async loadCustomers() {
        try {
            console.log('Loading customers from database...');
            
            const loadingElement = document.getElementById("dashboard-loading");
            if (loadingElement) loadingElement.style.display = "block";
            
            this.customers = await this.api.getCustomers();
            console.log(`Loaded ${this.customers.length} customers from PostgreSQL`);
            console.log('Sample customer:', this.customers[0]);
            
            this.renderCustomerList();
            
        } catch (error) {
            console.error("Failed to load customers:", error);
            this.showError("dashboard-error", `Failed to load customers: ${error.message}`);
        } finally {
            const loadingElement = document.getElementById("dashboard-loading");
            if (loadingElement) loadingElement.style.display = "none";
        }
    }

    renderCustomerList() {
        const listContainer = document.getElementById("customer-list");
        const emptyState = document.getElementById("empty-state");

        if (!listContainer) {
            console.error('customer-list element not found');
            return;
        }

        if (this.customers.length === 0) {
            listContainer.innerHTML = "";
            if (emptyState) emptyState.style.display = "block";
            return;
        }

        if (emptyState) emptyState.style.display = "none";

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
            (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
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
        const noteTimestamp = noteDate.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        }) + " @ " + noteDate.toLocaleTimeString("en-US", {
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

            // Simple customer detail display - can be enhanced later
            alert(`Customer Details:\n\nCompany: ${this.currentCustomer.company_name}\nStatus: ${this.currentCustomer.status}\nContact: ${this.currentCustomer.primary_contact?.name || 'N/A'}`);

        } catch (error) {
            console.error("Failed to show customer detail:", error);
            this.showError("dashboard-error", "Failed to load customer details.");
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

// Initialize the app when the page loads
let app;
document.addEventListener("DOMContentLoaded", () => {
    console.log('DOM loaded, initializing CRM app...');
    app = new CRMApp();
});