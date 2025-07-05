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

// Database Comparison Tools
let lastComparisonReport = null;
let selectedSyncItems = new Set();

async function compareDatabase() {
    const button = document.querySelector('button[onclick="compareDatabase()"]');
    const originalText = button.textContent;
    const resultsDiv = document.getElementById('comparison-results');
    const summaryDiv = document.getElementById('comparison-summary');
    const recommendationsDiv = document.getElementById('sync-recommendations');
    
    button.textContent = '🔄 Comparing databases...';
    button.disabled = true;
    
    try {
        const response = await fetch('/api/dev/compare-databases', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const report = await response.json();
        lastComparisonReport = report;
        
        // Display summary
        summaryDiv.innerHTML = `
            <h3>📊 Comparison Summary</h3>
            <div style="background: #2a2a2a; padding: 15px; border-radius: 5px; margin: 10px 0;">
                <div style="color: #ff6b35; font-weight: bold;">⚠️ Missing in Production: ${report.summary.totalMissingInProd}</div>
                <div style="color: #4CAF50; font-weight: bold;">📈 Missing in Development: ${report.summary.totalMissingInDev}</div>
                <div style="color: #ccc; margin-top: 10px;">Generated: ${new Date(report.timestamp).toLocaleString()}</div>
            </div>
        `;
        
        // Display recommendations
        if (report.recommendations && report.recommendations.length > 0) {
            recommendationsDiv.innerHTML = `
                <h3>💡 Recommendations</h3>
                <div style="background: #2a2a2a; padding: 15px; border-radius: 5px; margin: 10px 0;">
                    ${report.recommendations.map(rec => {
                        const priorityColor = rec.priority === 'HIGH' ? '#dc3545' : rec.priority === 'MEDIUM' ? '#ffc107' : '#17a2b8';
                        return `<div style="margin: 8px 0; padding: 8px; background: #1a1a1a; border-left: 4px solid ${priorityColor};">
                            <strong>${rec.type}:</strong> ${rec.message}
                        </div>`;
                    }).join('')}
                </div>
            `;
        }
        
        // Show selective sync options if there are missing records in prod
        if (report.summary.totalMissingInProd > 0) {
            displaySelectiveSyncOptions(report);
        }
        
        resultsDiv.style.display = 'block';
        document.getElementById('view-report-btn').style.display = 'inline-block';
        
    } catch (error) {
        console.error('Error comparing databases:', error);
        summaryDiv.innerHTML = `
            <div style="color: #dc3545; background: #2a2a2a; padding: 15px; border-radius: 5px;">
                ❌ Error comparing databases: ${error.message}
            </div>
        `;
        resultsDiv.style.display = 'block';
    } finally {
        button.textContent = originalText;
        button.disabled = false;
    }
}

function displaySelectiveSyncOptions(report) {
    const syncPanel = document.getElementById('selective-sync-panel');
    const optionsDiv = document.getElementById('sync-options');
    
    let optionsHTML = '<p style="color: #ffc107; margin-bottom: 15px;">⚠️ The following records exist in Development but not in Production:</p>';
    
    for (const [tableName, records] of Object.entries(report.missingInProd)) {
        if (records.length > 0) {
            optionsHTML += `
                <div style="margin-bottom: 20px; padding: 10px; background: #1a1a1a; border-radius: 5px;">
                    <h4 style="color: #ff6b35; margin: 0 0 10px 0;">📦 ${tableName.toUpperCase()} (${records.length} records)</h4>
                    <div style="max-height: 200px; overflow-y: auto;">
                        ${records.map(record => {
                            const recordId = `${tableName}-${record.id}`;
                            const summary = getRecordSummary(tableName, record);
                            return `
                                <label style="display: block; margin: 5px 0; padding: 5px; background: #2a2a2a; border-radius: 3px; cursor: pointer;">
                                    <input type="checkbox" value="${recordId}" onchange="toggleSyncItem('${recordId}')" style="margin-right: 8px;">
                                    <span style="color: #ccc;">${summary}</span>
                                </label>
                            `;
                        }).join('')}
                    </div>
                    <button onclick="selectAllInTable('${tableName}')" style="margin-top: 10px; padding: 4px 8px; background: #17a2b8; color: white; border: none; border-radius: 3px; cursor: pointer;">
                        Select All
                    </button>
                </div>
            `;
        }
    }
    
    optionsDiv.innerHTML = optionsHTML;
    syncPanel.style.display = 'block';
}

function getRecordSummary(tableName, record) {
    switch (tableName) {
        case 'customers':
            return `${record.company_name || 'N/A'} (${record.primary_contact_name || 'N/A'})`;
        case 'customer_files':
            return `${record.original_filename} for ${record.customer_id}`;
        case 'customer_notes':
            return `Note for ${record.customer_id}: ${record.content?.substring(0, 50) || 'N/A'}...`;
        case 'users':
            return `${record.name} (${record.email})`;
        default:
            return `Record ID: ${record.id}`;
    }
}

function toggleSyncItem(recordId) {
    if (selectedSyncItems.has(recordId)) {
        selectedSyncItems.delete(recordId);
    } else {
        selectedSyncItems.add(recordId);
    }
    
    // Update execute button state
    const executeButton = document.querySelector('button[onclick="executeSyncPlan()"]');
    executeButton.disabled = selectedSyncItems.size === 0;
    executeButton.textContent = selectedSyncItems.size > 0 ? 
        `✅ Execute Selected Sync (${selectedSyncItems.size} items)` : 
        '✅ Execute Selected Sync';
}

function selectAllInTable(tableName) {
    const checkboxes = document.querySelectorAll(`input[value^="${tableName}-"]`);
    checkboxes.forEach(checkbox => {
        checkbox.checked = true;
        toggleSyncItem(checkbox.value);
    });
}

async function executeSyncPlan() {
    if (selectedSyncItems.size === 0) {
        alert('Please select at least one record to sync.');
        return;
    }
    
    const confirmation = confirm(
        `⚠️ IMPORTANT: You are about to sync ${selectedSyncItems.size} records from Development to Production.\n\n` +
        'This will ADD these records to the Production database.\n' +
        'Production is the source of truth - existing Production data will NOT be overwritten.\n\n' +
        'Are you sure you want to proceed?'
    );
    
    if (!confirmation) {
        return;
    }
    
    const button = document.querySelector('button[onclick="executeSyncPlan()"]');
    const originalText = button.textContent;
    button.textContent = '🔄 Syncing to Production...';
    button.disabled = true;
    
    try {
        const response = await fetch('/api/dev/sync-to-production', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                selectedItems: Array.from(selectedSyncItems)
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        // Show success message
        alert(
            `✅ Sync completed successfully!\n\n` +
            `Successfully synced: ${result.successful}\n` +
            `Failed: ${result.failed}\n` +
            `Total processed: ${result.total}`
        );
        
        // Clear selections and refresh comparison
        selectedSyncItems.clear();
        compareDatabase();
        
    } catch (error) {
        console.error('Error syncing to production:', error);
        alert(`❌ Error syncing to production: ${error.message}`);
    } finally {
        button.textContent = originalText;
        button.disabled = false;
    }
}

function viewSyncReport() {
    if (!lastComparisonReport) {
        alert('No comparison report available. Please run a comparison first.');
        return;
    }
    
    // Open detailed report in a new window
    const reportWindow = window.open('', '_blank', 'width=800,height=600');
    reportWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Database Sync Report</title>
            <style>
                body { font-family: 'Courier New', monospace; margin: 20px; background: #1a1a1a; color: #f0f0f0; }
                .report-section { margin: 20px 0; padding: 15px; background: #2a2a2a; border-radius: 5px; }
                pre { background: #333; padding: 10px; border-radius: 3px; overflow-x: auto; }
            </style>
        </head>
        <body>
            <h1>🔍 Database Sync Report</h1>
            <div class="report-section">
                <h2>Summary</h2>
                <pre>${JSON.stringify(lastComparisonReport.summary, null, 2)}</pre>
            </div>
            <div class="report-section">
                <h2>Recommendations</h2>
                <pre>${JSON.stringify(lastComparisonReport.recommendations, null, 2)}</pre>
            </div>
            <div class="report-section">
                <h2>Full Report</h2>
                <pre>${JSON.stringify(lastComparisonReport, null, 2)}</pre>
            </div>
        </body>
        </html>
    `);
}

// Initialize dev console
document.addEventListener('DOMContentLoaded', () => {
    window.devConsole = new DevConsole();
});