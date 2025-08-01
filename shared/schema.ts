import { pgTable, serial, text, timestamp, integer, jsonb, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    password_hash: text('password_hash'), // nullable for future SSO
    auth_provider: text('auth_provider').notNull().default('local'), // 'local', 'google', 'microsoft'
    role: text('role').notNull().default('user'), // 'admin', 'user'
    two_factor_secret: text('two_factor_secret'),
    two_factor_enabled: timestamp('two_factor_enabled'), // null = disabled, timestamp = enabled
    created_at: timestamp('created_at').defaultNow(),
});

export const customers = pgTable('customers', {
    id: serial('id').primaryKey(),
    customer_id: text('customer_id').notNull().unique(),
    company_name: text('company_name').notNull(),
    status: text('status').notNull(),
    affiliate_partner: text('affiliate_partner'), // Legacy field - to be migrated
    affiliate_account_executive: text('affiliate_account_executive'), // Legacy field - to be migrated
    affiliate_id: uuid('affiliate_id').references(() => affiliates.id), // New v1.3 field
    affiliate_ae_id: uuid('affiliate_ae_id').references(() => affiliate_aes.id), // New v1.3 field
    next_step: text('next_step'),
    physical_address: text('physical_address'),
    billing_address: text('billing_address'),
    premise_locations: jsonb('premise_locations'), // New field for multiple locations
    primary_contact: jsonb('primary_contact'),
    authorized_signer: jsonb('authorized_signer'),
    billing_contact: jsonb('billing_contact'),
    notes: jsonb('notes'),
    docusign_status: jsonb('docusign_status'), // New field for DocuSign tracking
    created_by: integer('created_by'), // user id for future use
    updated_by: integer('updated_by'), // user id for future use
    deleted_at: timestamp('deleted_at'), // soft delete timestamp
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow(),
});

export const customer_files = pgTable('customer_files', {
    id: serial('id').primaryKey(),
    customer_id: text('customer_id').notNull(),
    file_name: text('file_name').notNull(),
    original_name: text('original_name').notNull(),
    file_url: text('file_url').notNull(),
    file_type: text('file_type').notNull(),
    file_size: integer('file_size').notNull(),
    location_tag: text('location_tag'), // New field for tagging files to specific premises
    upload_date: timestamp('upload_date').defaultNow(),
    created_at: timestamp('created_at').defaultNow(),
});

export const customer_notes = pgTable('customer_notes', {
    id: serial('id').primaryKey(),
    customer_id: text('customer_id').notNull(),
    author_id: integer('author_id').references(() => users.id),
    author_name: text('author_name'),
    content: text('content').notNull(),
    timestamp: timestamp('timestamp').defaultNow().notNull(),
    type: text('type').notNull().default('manual'), // 'manual' or 'system'
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull()
});

// New affiliate management tables
export const affiliates = pgTable('affiliates', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull().unique(),
    created_at: timestamp('created_at').defaultNow(),
});

export const affiliate_aes = pgTable('affiliate_aes', {
    id: uuid('id').primaryKey().defaultRandom(),
    affiliate_id: uuid('affiliate_id').references(() => affiliates.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    created_at: timestamp('created_at').defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
    customers_created: many(customers, { relationName: 'created_by' }),
    customers_updated: many(customers, { relationName: 'updated_by' }),
}));

export const customersRelations = relations(customers, ({ many, one }) => ({
    files: many(customer_files),
    notes: many(customer_notes),
    affiliate: one(affiliates, {
        fields: [customers.affiliate_id],
        references: [affiliates.id],
    }),
    affiliate_ae: one(affiliate_aes, {
        fields: [customers.affiliate_ae_id],
        references: [affiliate_aes.id],
    }),
    creator: one(users, {
        fields: [customers.created_by],
        references: [users.id],
        relationName: 'created_by',
    }),
    updater: one(users, {
        fields: [customers.updated_by],
        references: [users.id],
        relationName: 'updated_by',
    }),
}));

export const affiliatesRelations = relations(affiliates, ({ many }) => ({
    customers: many(customers),
    affiliate_aes: many(affiliate_aes),
}));

export const affiliateAesRelations = relations(affiliate_aes, ({ many, one }) => ({
    customers: many(customers),
    affiliate: one(affiliates, {
        fields: [affiliate_aes.affiliate_id],
        references: [affiliates.id],
    }),
}));

export const customerFilesRelations = relations(customer_files, ({ one }) => ({
    customer: one(customers, {
        fields: [customer_files.customer_id],
        references: [customers.customer_id],
    }),
}));

export const customerNotesRelations = relations(customer_notes, ({ one }) => ({
    customer: one(customers, {
        fields: [customer_notes.customer_id],
        references: [customers.customer_id],
    }),
    author: one(users, {
        fields: [customer_notes.author_id],
        references: [users.id],
    })
}));

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;

export type CustomerFile = typeof customer_files.$inferSelect;
export type InsertCustomerFile = typeof customer_files.$inferInsert;

export type CustomerNote = typeof customer_notes.$inferSelect;
export type InsertCustomerNote = typeof customer_notes.$inferInsert;

export type Affiliate = typeof affiliates.$inferSelect;
export type InsertAffiliate = typeof affiliates.$inferInsert;

export type AffiliateAE = typeof affiliate_aes.$inferSelect;
export type InsertAffiliateAE = typeof affiliate_aes.$inferInsert;