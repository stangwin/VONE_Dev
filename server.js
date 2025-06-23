const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const port = 5000;

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = './uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Initialize database tables
async function initDatabase() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS customers (
                id SERIAL PRIMARY KEY,
                customer_key VARCHAR(50) UNIQUE NOT NULL,
                company_name VARCHAR(255) NOT NULL,
                status VARCHAR(50) DEFAULT 'Lead',
                affiliate_partner VARCHAR(255),
                next_step TEXT,
                physical_address JSONB,
                billing_address JSONB,
                primary_contact JSONB,
                authorized_signer JSONB,
                billing_contact JSONB,
                paste_text TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS notes (
                id SERIAL PRIMARY KEY,
                customer_key VARCHAR(50) NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_key) REFERENCES customers(customer_key) ON DELETE CASCADE
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS photos (
                id SERIAL PRIMARY KEY,
                customer_key VARCHAR(50) NOT NULL,
                filename VARCHAR(255) NOT NULL,
                file_path VARCHAR(500) NOT NULL,
                file_type VARCHAR(50),
                description TEXT,
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_key) REFERENCES customers(customer_key) ON DELETE CASCADE
            );
        `);

        // Create indexes
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_customers_customer_key ON customers(customer_key);`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_notes_customer_key ON notes(customer_key);`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_photos_customer_key ON photos(customer_key);`);

        console.log('Database initialized successfully');
    } catch (err) {
        console.error('Error initializing database:', err);
    }
}

// Customer API Routes
app.get('/api/customers', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT c.*, 
                   COALESCE(json_agg(
                       json_build_object(
                           'id', n.id,
                           'content', n.content,
                           'created_at', n.created_at
                       ) ORDER BY n.created_at DESC
                   ) FILTER (WHERE n.id IS NOT NULL), '[]') as notes
            FROM customers c
            LEFT JOIN notes n ON c.customer_key = n.customer_key
            GROUP BY c.id
            ORDER BY c.updated_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching customers:', err);
        res.status(500).json({ error: 'Failed to fetch customers' });
    }
});

app.get('/api/customers/:customerKey', async (req, res) => {
    try {
        const { customerKey } = req.params;
        const customerResult = await pool.query('SELECT * FROM customers WHERE customer_key = $1', [customerKey]);
        
        if (customerResult.rows.length === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        const notesResult = await pool.query(
            'SELECT * FROM notes WHERE customer_key = $1 ORDER BY created_at DESC',
            [customerKey]
        );

        const photosResult = await pool.query(
            'SELECT * FROM photos WHERE customer_key = $1 ORDER BY uploaded_at DESC',
            [customerKey]
        );

        const customer = customerResult.rows[0];
        customer.notes = notesResult.rows;
        customer.photos = photosResult.rows;

        res.json(customer);
    } catch (err) {
        console.error('Error fetching customer:', err);
        res.status(500).json({ error: 'Failed to fetch customer' });
    }
});

app.post('/api/customers', async (req, res) => {
    try {
        const {
            customerKey,
            companyName,
            status = 'Lead',
            affiliatePartner,
            nextStep,
            physicalAddress,
            billingAddress,
            primaryContact,
            authorizedSigner,
            billingContact,
            pasteText
        } = req.body;

        const result = await pool.query(`
            INSERT INTO customers (
                customer_key, company_name, status, affiliate_partner, next_step,
                physical_address, billing_address, primary_contact, 
                authorized_signer, billing_contact, paste_text
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
        `, [
            customerKey, companyName, status, affiliatePartner, nextStep,
            JSON.stringify(physicalAddress), JSON.stringify(billingAddress),
            JSON.stringify(primaryContact), JSON.stringify(authorizedSigner),
            JSON.stringify(billingContact), pasteText
        ]);

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating customer:', err);
        res.status(500).json({ error: 'Failed to create customer' });
    }
});

app.put('/api/customers/:customerKey', async (req, res) => {
    try {
        const { customerKey } = req.params;
        const {
            companyName,
            status,
            affiliatePartner,
            nextStep,
            physicalAddress,
            billingAddress,
            primaryContact,
            authorizedSigner,
            billingContact,
            pasteText
        } = req.body;

        const result = await pool.query(`
            UPDATE customers SET
                company_name = $2, status = $3, affiliate_partner = $4, next_step = $5,
                physical_address = $6, billing_address = $7, primary_contact = $8,
                authorized_signer = $9, billing_contact = $10, paste_text = $11,
                updated_at = CURRENT_TIMESTAMP
            WHERE customer_key = $1
            RETURNING *
        `, [
            customerKey, companyName, status, affiliatePartner, nextStep,
            JSON.stringify(physicalAddress), JSON.stringify(billingAddress),
            JSON.stringify(primaryContact), JSON.stringify(authorizedSigner),
            JSON.stringify(billingContact), pasteText
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating customer:', err);
        res.status(500).json({ error: 'Failed to update customer' });
    }
});

app.delete('/api/customers/:customerKey', async (req, res) => {
    try {
        const { customerKey } = req.params;
        const result = await pool.query('DELETE FROM customers WHERE customer_key = $1 RETURNING *', [customerKey]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        res.json({ message: 'Customer deleted successfully' });
    } catch (err) {
        console.error('Error deleting customer:', err);
        res.status(500).json({ error: 'Failed to delete customer' });
    }
});

// Notes API Routes
app.post('/api/customers/:customerKey/notes', async (req, res) => {
    try {
        const { customerKey } = req.params;
        const { content } = req.body;

        const result = await pool.query(
            'INSERT INTO notes (customer_key, content) VALUES ($1, $2) RETURNING *',
            [customerKey, content]
        );

        // Update customer's updated_at timestamp
        await pool.query(
            'UPDATE customers SET updated_at = CURRENT_TIMESTAMP WHERE customer_key = $1',
            [customerKey]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error adding note:', err);
        res.status(500).json({ error: 'Failed to add note' });
    }
});

// Photos API Routes
app.post('/api/customers/:customerKey/photos', upload.single('photo'), async (req, res) => {
    try {
        const { customerKey } = req.params;
        const { description = '' } = req.body;
        
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const result = await pool.query(`
            INSERT INTO photos (customer_key, filename, file_path, file_type, description)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `, [customerKey, req.file.originalname, req.file.path, req.file.mimetype, description]);

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error uploading photo:', err);
        res.status(500).json({ error: 'Failed to upload photo' });
    }
});

// Future API stubs for integrations
app.post('/api/integrations/openai/parse', async (req, res) => {
    // Stub for OpenAI email parsing
    res.json({ message: 'OpenAI parsing integration - coming soon' });
});

app.post('/api/integrations/quickbooks/create-customer', async (req, res) => {
    // Stub for QuickBooks customer creation
    res.json({ message: 'QuickBooks integration - coming soon' });
});

app.post('/api/integrations/docusign/send-agreement', async (req, res) => {
    // Stub for DocuSign agreement sending
    res.json({ message: 'DocuSign integration - coming soon' });
});

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Initialize database and start server
initDatabase().then(() => {
    app.listen(port, '0.0.0.0', () => {
        console.log(`CRM Server running on port ${port}`);
    });
});