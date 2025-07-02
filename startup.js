#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

console.log('🚀 Vantix CRM Environment Selector');
console.log('=====================================');

// Check if .env already exists
const envPath = path.join(__dirname, '.env');
const envExists = fs.existsSync(envPath);

if (envExists) {
    console.log('✅ Environment already configured');
    try {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const isDev = envContent.includes('ENVIRONMENT=development');
        console.log(`🔧 Current mode: ${isDev ? 'DEVELOPMENT' : 'PRODUCTION'}`);
        
        // Ask if user wants to change
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        rl.question('Do you want to change environment? (y/N): ', (answer) => {
            if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
                selectEnvironment();
            } else {
                console.log('🚀 Starting with current environment...');
                startServer();
            }
            rl.close();
        });
    } catch (error) {
        console.error('❌ Error reading .env file:', error.message);
        selectEnvironment();
    }
} else {
    console.log('⚙️  No environment configuration found');
    selectEnvironment();
}

function selectEnvironment() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    console.log('\nSelect environment:');
    console.log('1. 🔧 Development (with dev tools, test data, isolated database)');
    console.log('2. 🚀 Production (clean interface, production database)');
    
    rl.question('\nEnter choice (1 or 2): ', (choice) => {
        if (choice === '1') {
            setupDevelopmentEnvironment();
        } else if (choice === '2') {
            setupProductionEnvironment();
        } else {
            console.log('❌ Invalid choice. Please enter 1 or 2.');
            rl.close();
            selectEnvironment();
            return;
        }
        rl.close();
    });
}

function setupDevelopmentEnvironment() {
    console.log('🔧 Setting up Development environment...');
    
    // Copy .env.example to .env
    try {
        const envExample = fs.readFileSync(path.join(__dirname, '.env.example'), 'utf8');
        fs.writeFileSync(path.join(__dirname, '.env'), envExample);
        console.log('✅ Development environment configured');
        console.log('📝 Created .env file from template');
        console.log('🔴 Development mode: Red banner will appear');
        console.log('💾 Database: Will use DATABASE_URL_DEV (configure in .env)');
        console.log('🛠️  Dev tools: Debug console, test data loader available');
    } catch (error) {
        console.error('❌ Error setting up development environment:', error.message);
        process.exit(1);
    }
    
    startServer();
}

function setupProductionEnvironment() {
    console.log('🚀 Setting up Production environment...');
    
    // Remove .env file if it exists
    try {
        if (fs.existsSync(path.join(__dirname, '.env'))) {
            fs.unlinkSync(path.join(__dirname, '.env'));
            console.log('✅ Removed .env file');
        }
        console.log('✅ Production environment configured');
        console.log('🔷 Clean interface: No development indicators');
        console.log('💾 Database: Will use DATABASE_URL_PROD or DATABASE_URL');
        console.log('🔒 Security: No debug tools or test data access');
    } catch (error) {
        console.error('❌ Error setting up production environment:', error.message);
        process.exit(1);
    }
    
    startServer();
}

function startServer() {
    console.log('\n🚀 Starting Vantix CRM server...');
    console.log('📍 Server will run on http://localhost:5000');
    console.log('⏳ Initializing...\n');
    
    // Start the main server
    require('./server.js');
}

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n👋 Goodbye!');
    process.exit(0);
});