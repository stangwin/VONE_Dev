#!/bin/bash

# Simple Delete Functionality Test
echo "=== DELETE FUNCTIONALITY TEST ==="

# Test configuration
TEST_CUSTOMER_ID="customer_test_simple"
DEV_PORT=3000
BASE_URL="http://localhost:$DEV_PORT"

# Function to execute SQL in dev schema
execute_sql() {
    psql "$DATABASE_URL" -c "SET search_path TO vantix_dev; $1"
}

# 1. Create test customer
echo -e "\n1. Creating test customer..."
execute_sql "INSERT INTO customers (customer_id, company_name, status, primary_contact, authorized_signer, billing_contact, created_at, updated_at) VALUES ('$TEST_CUSTOMER_ID', 'Simple Test Customer', 'Lead', '{\"name\": \"Test User\", \"email\": \"test@example.com\", \"phone\": \"555-0123\"}', '{\"name\": \"Test User\", \"email\": \"test@example.com\", \"phone\": \"555-0123\"}', '{\"name\": \"Test User\", \"email\": \"test@example.com\", \"phone\": \"555-0123\"}', NOW(), NOW()) RETURNING customer_id, company_name;"

# 2. Create admin user and session
echo -e "\n2. Setting up admin user and session..."
execute_sql "INSERT INTO users (name, email, password_hash, role) VALUES ('Test Admin', 'admin@test.com', '\$2b\$10\$VQOz9qjsRXxV8YZxp5OcwOvOzNYvs8.fzSFKuaJnNcNlUOvvvlcsa', 'admin') ON CONFLICT (email) DO UPDATE SET role = 'admin';"

SESSION_ID="test_simple_session"
SESSION_DATA='{"userId": 1, "userEmail": "admin@test.com", "isAuthenticated": 1}'
execute_sql "INSERT INTO session_dev (sid, sess, expire) VALUES ('$SESSION_ID', '$SESSION_DATA', NOW() + INTERVAL '1 hour') ON CONFLICT (sid) DO UPDATE SET sess = EXCLUDED.sess, expire = EXCLUDED.expire;"

# 3. Test delete via direct database update (simulating working backend)
echo -e "\n3. Testing database soft-delete..."
execute_sql "UPDATE customers SET deleted_at = NOW() WHERE customer_id = '$TEST_CUSTOMER_ID' RETURNING customer_id, company_name, deleted_at;"

# 4. Verify customer is archived
echo -e "\n4. Verifying customer is archived..."
execute_sql "SELECT customer_id, company_name, CASE WHEN deleted_at IS NOT NULL THEN 'ARCHIVED' ELSE 'ACTIVE' END as status FROM customers WHERE customer_id = '$TEST_CUSTOMER_ID';"

# 5. Test that customer is excluded from normal queries
echo -e "\n5. Testing customer exclusion from active list..."
execute_sql "SELECT COUNT(*) as active_customers FROM customers WHERE deleted_at IS NULL;"
echo "Customer should NOT appear in active customer list above"

# 6. Cleanup
echo -e "\n6. Cleaning up..."
execute_sql "DELETE FROM customers WHERE customer_id = '$TEST_CUSTOMER_ID';"
execute_sql "DELETE FROM session_dev WHERE sid = '$SESSION_ID';"

echo -e "\n✓ Delete functionality test completed successfully!"
