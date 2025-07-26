const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function seedDevelopmentData() {
  const databaseUrl = process.env.DATABASE_URL_DEV;
  
  if (!databaseUrl) {
    console.error('DATABASE_URL_DEV not found');
    process.exit(1);
  }

  const pool = new Pool({ 
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🌱 Seeding development data...');
    
    // Create test user
    const hashedPassword = await bcrypt.hash('test123', 10);
    
    await pool.query(`
      INSERT INTO users (name, email, password_hash, role, auth_provider) 
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO NOTHING
    `, ['Test User', 'test@test.com', hashedPassword, 'admin', 'local']);
    
    console.log('✅ Test user created: test@test.com / test123');
    console.log('🎉 Development seeding complete!');
    
  } catch (error) {
    console.error('❌ Seeding error:', error);
  } finally {
    await pool.end();
  }
}

seedDevelopmentData(); 