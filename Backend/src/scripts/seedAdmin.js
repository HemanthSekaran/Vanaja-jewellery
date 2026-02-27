/**
 * Seed Admin User Script
 * Creates the default admin user as a verified account (to avoid OTP during seeding).
 */

const { query } = require('../config/database');
require('dotenv').config();

const seedAdmin = async () => {
    try {
        console.log('🌱 Seeding admin user...');

        const adminEmail = process.env.ADMIN_EMAIL || 'admin@gmail.com';
        const adminName = process.env.ADMIN_NAME || 'Admin User';
        const adminPhone = process.env.ADMIN_PHONE || '0000000000';
        const adminAddress = 'Vanaja Jewellery Shop, Chennai';

        // Check if admin already exists
        const existingAdmins = await query(
            'SELECT id FROM users WHERE email = ?',
            [adminEmail]
        );

        if (existingAdmins.length > 0) {
            console.log('⚠️  Admin user already exists');
            process.exit(0);
        }

        // Create admin user (pre-verified, no password needed in this OTP-only flow)
        await query(
            `INSERT INTO users (name, email, phone, address, password, role, is_verified)
             VALUES (?, ?, ?, ?, NULL, 'admin', TRUE)`,
            [adminName, adminEmail, adminPhone, adminAddress]
        );

        console.log('✅ Admin user created successfully as a verified account');
        console.log(`   Email: ${adminEmail} (Login via OTP only)`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding admin:', error.message);
        process.exit(1);
    }
};

seedAdmin();
