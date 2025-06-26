import { pgTable, serial, text, timestamp, integer, jsonb } from 'drizzle-orm/pg-core';
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
    affiliate_partner: text('affiliate_partner'),
    next_step: text('next_step'),
    physical_address: text('physical_address'),
    billing_address: text('billing_address'),
    primary_contact: jsonb('primary_contact'),
    authorized_signer: jsonb('authorized_signer'),
    billing_contact: jsonb('billing_contact'),
    notes: jsonb('notes'),
    created_by: integer('created_by'), // user id for future use
    updated_by: integer('updated_by'), // user id for future use
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
    upload_date: timestamp('upload_date').defaultNow(),
    created_at: timestamp('created_at').defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
    customers_created: many(customers, { relationName: 'created_by' }),
    customers_updated: many(customers, { relationName: 'updated_by' }),
}));

export const customersRelations = relations(customers, ({ many, one }) => ({
    files: many(customer_files),
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

export const customerFilesRelations = relations(customer_files, ({ one }) => ({
    customer: one(customers, {
        fields: [customer_files.customer_id],
        references: [customers.customer_id],
    }),
}));

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;

export type CustomerFile = typeof customer_files.$inferSelect;
export type InsertCustomerFile = typeof customer_files.$inferInsert;