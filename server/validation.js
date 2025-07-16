/**
 * Centralized Validation Utilities
 * Provides consistent validation patterns across all routes
 */

class ValidationError extends Error {
    constructor(field, message) {
        super(message);
        this.name = 'ValidationError';
        this.field = field;
    }
}

class Validator {
    static validateRequired(value, fieldName) {
        if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
            throw new ValidationError(fieldName, `${fieldName} is required`);
        }
        return value;
    }

    static validateString(value, fieldName, options = {}) {
        const { minLength = 0, maxLength = null, allowEmpty = false } = options;
        
        if (!allowEmpty) {
            this.validateRequired(value, fieldName);
        }
        
        if (typeof value !== 'string') {
            throw new ValidationError(fieldName, `${fieldName} must be a string`);
        }
        
        if (value.length < minLength) {
            throw new ValidationError(fieldName, `${fieldName} must be at least ${minLength} characters`);
        }
        
        if (maxLength && value.length > maxLength) {
            throw new ValidationError(fieldName, `${fieldName} must be no more than ${maxLength} characters`);
        }
        
        return value.trim();
    }

    static validateEmail(email, fieldName = 'email') {
        this.validateRequired(email, fieldName);
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new ValidationError(fieldName, `${fieldName} must be a valid email address`);
        }
        return email.toLowerCase().trim();
    }

    static validateCustomerId(customerId, fieldName = 'customer_id') {
        this.validateRequired(customerId, fieldName);
        const customerIdRegex = /^[a-zA-Z0-9_-]+$/;
        if (!customerIdRegex.test(customerId)) {
            throw new ValidationError(fieldName, `${fieldName} contains invalid characters`);
        }
        return customerId;
    }

    static validateFileExtension(filename, allowedExtensions) {
        const ext = filename.split('.').pop()?.toLowerCase();
        if (!ext || !allowedExtensions.includes(`.${ext}`)) {
            throw new ValidationError('file', `File extension .${ext} not allowed. Allowed: ${allowedExtensions.join(', ')}`);
        }
        return ext;
    }

    static validateFileSize(size, maxSizeBytes, fieldName = 'file') {
        if (size > maxSizeBytes) {
            const maxSizeMB = Math.round(maxSizeBytes / (1024 * 1024));
            throw new ValidationError(fieldName, `File must be less than ${maxSizeMB}MB`);
        }
        return size;
    }

    static validateCustomerData(data) {
        const errors = [];
        
        try {
            this.validateString(data.company_name || data.companyName, 'company_name', { minLength: 1, maxLength: 255 });
        } catch (error) {
            errors.push(error.message);
        }

        if (data.status && !['Lead', 'Quoted', 'Signed', 'Onboarding', 'Hypercare', 'Active', 'Closed'].includes(data.status)) {
            errors.push('Invalid status value');
        }

        if (data.primary_contact?.email) {
            try {
                this.validateEmail(data.primary_contact.email, 'primary_contact.email');
            } catch (error) {
                errors.push(error.message);
            }
        }

        if (errors.length > 0) {
            const error = new Error('Validation failed');
            error.name = 'ValidationError';
            error.errors = errors;
            throw error;
        }

        return true;
    }

    static validatePasswordStrength(password) {
        const errors = [];
        
        if (password.length < 8) {
            errors.push('Password must be at least 8 characters long');
        }
        
        if (!/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        
        if (!/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }
        
        if (!/\d/.test(password)) {
            errors.push('Password must contain at least one number');
        }
        
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push('Password must contain at least one special character');
        }

        if (errors.length > 0) {
            const error = new Error('Password validation failed');
            error.name = 'ValidationError';
            error.errors = errors;
            throw error;
        }

        return true;
    }
}

// Helper function to handle validation errors in routes
function handleValidationError(res, error) {
    if (error.name === 'ValidationError') {
        const response = {
            error: error.message,
            field: error.field || null
        };
        
        if (error.errors) {
            response.errors = error.errors;
        }
        
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
        return true;
    }
    return false;
}

module.exports = {
    Validator,
    ValidationError,
    handleValidationError
};