/**
 * Route Helper Utilities
 * Consolidates common route patterns and logic
 */

const { Validator, handleValidationError } = require('./validation');

class RouteHelper {
    constructor(pool, authService) {
        this.pool = pool;
        this.authService = authService;
    }

    // Standard authentication check
    requireAuth(req, res) {
        if (!req.session || !req.session.userId) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Authentication required' }));
            return false;
        }
        return true;
    }

    // Admin role check
    async requireAdmin(req, res) {
        if (!this.requireAuth(req, res)) return false;
        
        const user = await this.authService.getUserById(req.session.userId);
        if (!user || user.role !== 'admin') {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Admin access required' }));
            return false;
        }
        return user;
    }

    // Extract customer ID from URL path
    extractCustomerId(pathname) {
        const segments = pathname.split('/');
        const customerIdIndex = segments.indexOf('customers') + 1;
        return segments[customerIdIndex];
    }

    // Standard JSON response helper
    sendJson(res, statusCode, data) {
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
    }

    // Error response helper
    sendError(res, statusCode, message, details = null) {
        const response = { error: message };
        if (details) response.details = details;
        this.sendJson(res, statusCode, response);
    }

    // Database error handler
    handleDbError(res, error, operation = 'database operation') {
        console.error(`Database error during ${operation}:`, error);
        
        // Handle specific database constraint violations
        if (error.code === '23505') {
            if (error.constraint === 'unique_company_billing') {
                this.sendError(res, 409, 'duplicate');
                return;
            }
            this.sendError(res, 409, 'A record with this data already exists');
            return;
        }
        
        if (error.code === '23503') {
            this.sendError(res, 400, 'Referenced record does not exist');
            return;
        }
        
        this.sendError(res, 500, `Database error: ${error.message}`);
    }

    // Customer normalization helper
    normalizeCustomerData(body) {
        return {
            customer_id: body.customer_id || body.customerId,
            company_name: body.company_name || body.companyName,
            status: body.status || 'Lead',
            affiliate_partner: body.affiliate_partner || body.affiliatePartner,
            next_step: body.next_step || body.nextStep,
            physical_address: body.physical_address || body.physicalAddress,
            billing_address: body.billing_address || body.billingAddress,
            primary_contact: body.primary_contact || body.primaryContact,
            authorized_signer: body.authorized_signer || body.authorizedSigner,
            billing_contact: body.billing_contact || body.billingContact,
            notes: body.notes || []
        };
    }

    // System note creation helper
    async createSystemNote(customerId, content, userId) {
        try {
            const user = await this.authService.getUserById(userId);
            const noteQuery = `
                INSERT INTO customer_notes (customer_id, content, note_type, created_by, created_at)
                VALUES ($1, $2, $3, $4, NOW()) RETURNING *
            `;
            await this.pool.query(noteQuery, [customerId, content, 'system', userId]);
            console.log('System note created successfully');
        } catch (error) {
            console.error('Failed to create system note:', error);
        }
    }

    // File validation helper
    validateFile(file) {
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.heic', '.heif', '.pdf', '.mp4', '.mov', '.avi', '.webm'];
        const maxSizeBytes = 50 * 1024 * 1024; // 50MB
        
        Validator.validateFileExtension(file.originalFilename, allowedExtensions);
        Validator.validateFileSize(file.size, maxSizeBytes);
        
        return true;
    }
}

module.exports = { RouteHelper };