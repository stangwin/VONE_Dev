// Force load customers script - run this in browser console
(function() {
    console.log('Force loading customers...');
    
    // Check localStorage
    const allKeys = Object.keys(localStorage);
    const customerKeys = allKeys.filter(key => key.startsWith('customer_'));
    console.log('Found customer keys:', customerKeys);
    
    if (customerKeys.length === 0) {
        console.log('No customer data found in localStorage');
        return;
    }
    
    // Force reload the app if it exists
    if (window.app && window.app.loadCustomers) {
        console.log('Forcing app to reload customers...');
        window.app.loadCustomers();
    } else {
        console.log('App not found, manually displaying data...');
        
        // Get customer list container
        const listContainer = document.getElementById('customer-list');
        const emptyState = document.getElementById('empty-state');
        
        if (listContainer && emptyState) {
            let html = '';
            customerKeys.forEach(key => {
                const customerData = localStorage.getItem(key);
                if (customerData) {
                    const customer = JSON.parse(customerData);
                    html += `<div style="border: 1px solid #ccc; padding: 10px; margin: 10px 0; border-radius: 4px;">
                        <h4>${customer.companyName}</h4>
                        <p>Status: ${customer.status}</p>
                        <p>Partner: ${customer.affiliatePartner || 'None'}</p>
                        <p>Contact: ${customer.primaryContact?.name || 'No contact'}</p>
                    </div>`;
                }
            });
            
            if (html) {
                listContainer.innerHTML = html;
                emptyState.style.display = 'none';
                console.log('Manually displayed customers');
            }
        }
    }
})();