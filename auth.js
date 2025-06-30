class AuthManager {
    constructor() {
        this.isLoginMode = true;
        this.isDevelopment = false; // Will be set after environment check
        this.init();
    }

    async init() {
        await this.checkEnvironment();
        this.bindEvents();
        this.updateUI();
        this.checkAuthStatus();
    }

    async checkEnvironment() {
        try {
            const response = await fetch('/api/environment');
            const envData = await response.json();
            this.isDevelopment = envData.isDevelopment;
            
            if (this.isDevelopment) {
                console.log('Development environment detected');
                this.setupDevelopmentUI();
            } else {
                console.log('Production environment detected');
            }
        } catch (error) {
            console.error('Failed to check environment:', error);
            // Default to production if check fails
            this.isDevelopment = false;
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
        
        console.log('Development UI setup complete');
    }

    bindEvents() {
        const form = document.getElementById('auth-form');
        const toggle = document.getElementById('auth-toggle');

        form.addEventListener('submit', (e) => this.handleSubmit(e));
        toggle.addEventListener('click', () => this.toggleMode());
    }

    updateUI() {
        const title = document.getElementById('auth-title');
        const subtitle = document.getElementById('auth-subtitle');
        const nameGroup = document.getElementById('name-group');
        const buttonText = document.getElementById('button-text');
        const switchText = document.getElementById('switch-text');
        const toggle = document.getElementById('auth-toggle');

        if (this.isLoginMode) {
            title.textContent = 'Sign In';
            subtitle.textContent = 'Access your customer management dashboard';
            nameGroup.style.display = 'none';
            buttonText.textContent = 'Sign In';
            switchText.textContent = "Don't have an account?";
            toggle.textContent = 'Sign Up';
        } else {
            title.textContent = 'Create Account';
            subtitle.textContent = 'Join Vantix CRM to manage your customers';
            nameGroup.style.display = 'block';
            buttonText.textContent = 'Create Account';
            switchText.textContent = 'Already have an account?';
            toggle.textContent = 'Sign In';
        }
    }

    toggleMode() {
        this.isLoginMode = !this.isLoginMode;
        this.updateUI();
        this.clearMessages();
        document.getElementById('auth-form').reset();
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        const data = {
            email: formData.get('email'),
            password: formData.get('password')
        };

        if (!this.isLoginMode) {
            data.name = formData.get('name');
            if (!data.name || data.name.trim() === '') {
                this.showError('Please enter your full name');
                return;
            }
        }

        if (!data.email || !data.password) {
            this.showError('Please fill in all required fields');
            return;
        }

        this.setLoading(true);
        this.clearMessages();

        try {
            const endpoint = this.isLoginMode ? '/api/auth/login' : '/api/auth/register';
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
                credentials: 'include'
            });

            const result = await response.json();

            if (response.ok) {
                this.showSuccess(this.isLoginMode ? 'Signed in successfully!' : 'Account created successfully!');
                setTimeout(() => {
                    window.location.href = '/';
                }, 1000);
            } else {
                this.showError(result.error || 'Authentication failed');
            }
        } catch (error) {
            console.error('Auth error:', error);
            this.showError('Connection error. Please try again.');
        } finally {
            this.setLoading(false);
        }
    }

    async checkAuthStatus() {
        try {
            const response = await fetch('/api/auth/me', {
                credentials: 'include'
            });

            if (response.ok) {
                // User is already authenticated, redirect to dashboard
                window.location.href = '/';
            }
        } catch (error) {
            // User is not authenticated, stay on auth page
            console.log('User not authenticated');
        }
    }

    setLoading(loading) {
        const button = document.getElementById('auth-submit');
        const buttonText = document.getElementById('button-text');
        const buttonLoading = document.getElementById('button-loading');

        button.disabled = loading;
        buttonText.style.display = loading ? 'none' : 'inline';
        buttonLoading.style.display = loading ? 'inline-block' : 'none';
    }

    showError(message) {
        const container = document.getElementById('error-container');
        container.innerHTML = `<div class="error-message">${message}</div>`;
    }

    showSuccess(message) {
        const container = document.getElementById('success-container');
        container.innerHTML = `<div class="success-message">${message}</div>`;
    }

    clearMessages() {
        document.getElementById('error-container').innerHTML = '';
        document.getElementById('success-container').innerHTML = '';
    }
}

// Initialize auth manager when page loads
document.addEventListener('DOMContentLoaded', () => {
    new AuthManager();
});