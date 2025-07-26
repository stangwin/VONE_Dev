// Authentication Flow Debugger
class AuthFlowDebugger {
    constructor() {
        this.steps = [];
        this.startTime = Date.now();
    }

    log(step, data = {}) {
        const timestamp = Date.now() - this.startTime;
        const logEntry = {
            step,
            timestamp: `${timestamp}ms`,
            time: new Date().toISOString(),
            data
        };
        
        this.steps.push(logEntry);
        console.log(`🔍 AUTH DEBUG [${timestamp}ms]:`, step, data);
    }

    async testFullAuthFlow() {
        this.log('START', { url: window.location.href });
        
        // Step 1: Check what cookies exist
        this.log('COOKIES_CHECK', { 
            allCookies: document.cookie,
            cookieCount: document.cookie.split(';').length
        });

        // Step 2: Test /api/auth/me endpoint directly
        try {
            this.log('DIRECT_AUTH_TEST_START');
            const response = await fetch('/api/auth/me', {
                method: 'GET',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' }
            });
            
            this.log('DIRECT_AUTH_RESPONSE', {
                status: response.status,
                ok: response.ok,
                headers: Object.fromEntries(response.headers.entries())
            });

            if (response.ok) {
                const data = await response.json();
                this.log('DIRECT_AUTH_SUCCESS', { userData: data });
            } else {
                const errorText = await response.text();
                this.log('DIRECT_AUTH_FAILED', { errorText });
            }
        } catch (error) {
            this.log('DIRECT_AUTH_ERROR', { error: error.message });
        }

        // Step 3: Test what happens during page load
        this.log('PAGE_LOAD_TEST');
        if (window.app) {
            this.log('APP_EXISTS', { 
                currentUser: window.app.currentUser,
                apiExists: !!window.app.api
            });
            
            // Test the API checkAuth method
            try {
                this.log('API_CHECKAUTH_START');
                const user = await window.app.api.checkAuth();
                this.log('API_CHECKAUTH_SUCCESS', { user });
            } catch (error) {
                this.log('API_CHECKAUTH_ERROR', { error: error.message });
            }
        } else {
            this.log('APP_NOT_READY');
        }

        // Step 4: Summary
        console.log('🔍 AUTH FLOW COMPLETE - Full Debug Report:');
        console.table(this.steps);
        
        return this.steps;
    }
}

// Auto-run when page loads
window.addEventListener('load', () => {
    setTimeout(() => {
        console.log('🔍 Starting Authentication Flow Debug...');
        window.authDebugger = new AuthFlowDebugger();
        window.authDebugger.testFullAuthFlow();
    }, 1000);
});

// Manual trigger function
window.debugAuth = () => {
    const authDebugger = new AuthFlowDebugger();
    return authDebugger.testFullAuthFlow();
}; 