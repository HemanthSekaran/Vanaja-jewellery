/**
 * Seed Admin User Script
 * Creates the default admin user in the database
 */

const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
require('dotenv').config();

const seedAdmin = async () => {
    try {
        console.log('🌱 Seeding admin user...');

        const adminEmail = process.env.ADMIN_EMAIL || 'admin@gmail.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin';
        const adminName = process.env.ADMIN_NAME || 'Admin User';
        const adminPhone = process.env.ADMIN_PHONE || '0000000000';

        // Check if admin already exists
        const existingAdmins = await query(
            'SELECT id FROM users WHERE email = ?',
            [adminEmail]
        );

        if (existingAdmins.length > 0) {
            console.log('⚠️  Admin user already exists');
            process.exit(0);
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminPassword, salt);

        // Create admin user
        await query(
            'INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)',
            [adminName, adminEmail, adminPhone, hashedPassword, 'admin']
        );

        console.log('✅ Admin user created successfully');
        console.log(`   Email: ${adminEmail}`);
        console.log(`   Password: ${adminPassword}`);
        console.log('\n⚠️  IMPORTANT: Change the admin password after first login!\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding admin:', error.message);
        process.exit(1);
    }
};

seedAdmin();
