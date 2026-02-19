const { pool } = require('../src/config/database');

async function migrate() {
    try {
        console.log('Starting migration...');
        const connection = await pool.getConnection();

        // Alter order_status enum to include new statuses and match user request (case insensitive usually but let's be safe)
        // We include both lowercase and Title Case to be safe, or just Title Case if that's what validator enforces.
        // Validator enforces: ['Pending', 'Acknowledge', 'Completed', 'Rejected']
        // Existing DB has: 'pending', 'completed', 'cancelled', 'shipped', 'delivered'
        // We will change it to support the new ones.

        const query = "ALTER TABLE orders MODIFY COLUMN order_status ENUM('Pending', 'Acknowledge', 'Completed', 'Rejected', 'pending', 'completed', 'cancelled', 'shipped', 'delivered') DEFAULT 'Pending'";

        await connection.query(query);
        console.log('Migration successful: order_status ENUM updated.');

        // Update existing 'pending' to 'Pending' etc to normalize? 
        // Optional, but might be good.
        await connection.query("UPDATE orders SET order_status = 'Pending' WHERE order_status = 'pending'");
        await connection.query("UPDATE orders SET order_status = 'Completed' WHERE order_status = 'completed'");

        console.log('Data normalization successful.');
        connection.release();
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
