class DevConsole {
    constructor() {
        this.isDevelopment = false;
        this.versionData = [];
        this.init();
    }
    
    async init() {
        await this.checkEnvironment();
        if (!this.isDevelopment) {
            this.redirectToHome();
            return;
        }
        
        await this.loadSystemStatus();
        await this.loadDatabaseStats();
        this.loadVersionData();
        this.loadChangelog();
        this.setupChangelogEditor();
    }
    
    async checkEnvironment() {
        try {
            const response = await fetch('/api/environment');
            const envData = await response.json();
            this.isDevelopment = envData.isDevelopment;
            
            if (this.isDevelopment) {
                this.setupDevelopmentUI();
            }
        } catch (error) {
            console.error('Failed to check environment:', error);
            this.redirectToHome();
        }
    }
    
    setupDevelopmentUI() {
        const banner = document.getElementById('dev-environment-banner');
        if (banner) {
            banner.style.display = 'block';
            document.body.style.paddingTop = '40px';
        }
        
        const currentTitle = document.title;
        if (!currentTitle.includes('[DEV]')) {
            document.title = `[DEV] ${currentTitle}`;
        }
    }
    
    redirectToHome() {
        window.location.href = '/';
    }
    
    async loadSystemStatus() {
        try {
            const [envResponse, dbResponse] = await Promise.all([
                fetch('/api/environment'),
                fetch('/api/database-status')
            ]);
            
            const envData = await envResponse.json();
            const dbData = await dbResponse.json();
            
            document.getElementById('current-environment').textContent = envData.environment.toUpperCase();
            document.getElementById('database-url').textContent = dbData.databaseUrl || 'Not configured';
            document.getElementById('crm-version').textContent = '1.1 (System Notes + Test Mode)';
            
            // Check test mode status (assuming it's stored in localStorage or session)
            const testMode = localStorage.getItem('testMode') === 'true';
            document.getElementById('test-mode-status').textContent = testMode ? 'ENABLED' : 'DISABLED';
            
        } catch (error) {
            console.error('Failed to load system status:', error);
        }
    }
    
    async loadDatabaseStats() {
        try {
            const response = await fetch('/api/dev/database-stats', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const stats = await response.json();
                document.getElementById('customer-count').textContent = stats.customers || 0;
                document.getElementById('file-count').textContent = stats.files || 0;
                document.getElementById('note-count').textContent = stats.notes || 0;
                document.getElementById('user-count').textContent = stats.users || 0;
            } else {
                console.error('Failed to load database stats');
            }
        } catch (error) {
            console.error('Failed to load database stats:', error);
            // Set default values
            document.getElementById('customer-count').textContent = '0';
            document.getElementById('file-count').textContent = '0';
            document.getElementById('note-count').textContent = '0';
            document.getElementById('user-count').textContent = '0';
        }
    }
    
    loadVersionData() {
        this.versionData = [
            {
                version: '1.0',
                name: 'MVP',
                releaseDate: '2025-06-20',
                features: 'Basic CRM, Customer Management, File Upload'
            },
            {
                version: '1.1',
                name: 'System Notes + Test Mode',
                releaseDate: '2025-06-27',
                features: 'System Notes, Test Mode, Enhanced UI, 2FA'
            },
            {
                version: '1.2',
                name: 'Environment Separation',
                releaseDate: '2025-07-02',
                features: 'Dev/Prod Isolation, Database Separation, Dev Console'
            }
        ];
        
        this.renderVersionTable();
        this.populateVersionSelector();
    }
    
    renderVersionTable() {
        const tbody = document.getElementById('version-table-body');
        tbody.innerHTML = '';
        
        this.versionData.forEach(version => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${version.version}</td>
                <td>${version.name}</td>
                <td>${version.releaseDate}</td>
                <td>${version.features}</td>
            `;
            tbody.appendChild(row);
        });
    }
    
    populateVersionSelector() {
        const selector = document.getElementById('version-selector');
        selector.innerHTML = '<option value="">Select version...</option>';
        
        this.versionData.forEach(version => {
            const option = document.createElement('option');
            option.value = version.version;
            option.textContent = `${version.version} - ${version.name}`;
            selector.appendChild(option);
        });
    }
    
    async loadChangelog() {
        try {
            const response = await fetch('/api/dev/changelog');
            if (response.ok) {
                const data = await response.json();
                document.getElementById('changelog-editor').value = data.content || '';
                this.updateChangelogPreview();
            }
        } catch (error) {
            console.error('Failed to load changelog:', error);
        }
    }
    
    setupChangelogEditor() {
        const editor = document.getElementById('changelog-editor');
        editor.addEventListener('input', () => {
            this.updateChangelogPreview();
        });
    }
    
    updateChangelogPreview() {
        const content = document.getElementById('changelog-editor').value;
        const preview = document.getElementById('changelog-preview-content');
        
        if (content.trim()) {
            // Simple markdown-like formatting
            const formatted = content
                .replace(/^# (.*$)/gm, '<h1>$1</h1>')
                .replace(/^## (.*$)/gm, '<h2>$1</h2>')
                .replace(/^### (.*$)/gm, '<h3>$1</h3>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/\n/g, '<br>');
            
            preview.innerHTML = formatted;
        } else {
            preview.textContent = 'Enter changelog text above to see preview...';
        }
    }
}

// Global functions for button actions
async function syncDevFromProd() {
    if (!confirm('This will permanently overwrite all Development data with Production data. Continue?')) {
        return;
    }
    
    const statusEl = document.getElementById('sync-status');
    statusEl.textContent = 'Syncing database... This may take a moment.';
    statusEl.style.color = '#ff6b35';
    
    try {
        const response = await fetch('/api/dev/sync-from-prod', {
            method: 'POST',
            credentials: 'include'
        });
        
        if (response.ok) {
            const result = await response.json();
            statusEl.textContent = `✅ Sync completed successfully at ${new Date().toLocaleString()}`;
            statusEl.style.color = '#4CAF50';
            
            // Reload database stats
            window.devConsole.loadDatabaseStats();
        } else {
            const error = await response.text();
            statusEl.textContent = `❌ Sync failed: ${error}`;
            statusEl.style.color = '#dc3545';
        }
    } catch (error) {
        statusEl.textContent = `❌ Sync failed: ${error.message}`;
        statusEl.style.color = '#dc3545';
    }
}

async function loadSampleData() {
    if (!confirm('This will add sample test data to the development database. Continue?')) {
        return;
    }
    
    const statusEl = document.getElementById('sync-status');
    statusEl.textContent = 'Loading sample data...';
    statusEl.style.color = '#ff6b35';
    
    try {
        const response = await fetch('/api/dev/load-sample-data', {
            method: 'POST',
            credentials: 'include'
        });
        
        if (response.ok) {
            const result = await response.json();
            statusEl.textContent = `✅ Sample data loaded successfully: ${result.message}`;
            statusEl.style.color = '#4CAF50';
            
            // Reload database stats
            window.devConsole.loadDatabaseStats();
        } else {
            const error = await response.text();
            statusEl.textContent = `❌ Failed to load sample data: ${error}`;
            statusEl.style.color = '#dc3545';
        }
    } catch (error) {
        statusEl.textContent = `❌ Failed to load sample data: ${error.message}`;
        statusEl.style.color = '#dc3545';
    }
}

function switchVersion() {
    const selector = document.getElementById('version-selector');
    const selectedVersion = selector.value;
    
    if (!selectedVersion) {
        alert('Please select a version first.');
        return;
    }
    
    alert(`Version switching is not implemented yet. Selected: ${selectedVersion}\n\nThis would typically:\n- Switch to a different git branch\n- Restart the server with different configuration\n- Load version-specific features`);
}

async function saveChangelog() {
    const content = document.getElementById('changelog-editor').value;
    const statusEl = document.getElementById('changelog-status');
    
    try {
        const response = await fetch('/api/dev/changelog', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ content })
        });
        
        if (response.ok) {
            statusEl.textContent = `✅ Saved at ${new Date().toLocaleString()}`;
            statusEl.style.color = '#4CAF50';
        } else {
            statusEl.textContent = '❌ Failed to save';
            statusEl.style.color = '#dc3545';
        }
    } catch (error) {
        statusEl.textContent = '❌ Failed to save';
        statusEl.style.color = '#dc3545';
    }
}

// Initialize dev console
document.addEventListener('DOMContentLoaded', () => {
    window.devConsole = new DevConsole();
});