/**
 * Database Configuration and Connection Pool
 * Handles MySQL connection with proper error handling and connection pooling
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

// Create connection pool for better performance and scalability
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'jewelry_ecommerce',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

/**
 * Test database connection
 */
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✓ Database connected successfully');
        connection.release();
        return true;
    } catch (error) {
        console.error('✗ Database connection failed:', error.message);
        return false;
    }
};

/**
 * Execute a query with error handling
 * @param {string} sql - SQL query
 * @param {array} params - Query parameters
 * @returns {Promise} Query result
 */
const query = async (sql, params = []) => {
    try {
        const [results] = await pool.execute(sql, params);
        return results;
    } catch (error) {
        console.error('Database query error:', error.message);
        throw error;
    }
};

/**
 * Get a connection from the pool
 * Useful for transactions
 */
const getConnection = async () => {
    return await pool.getConnection();
};

module.exports = {
    pool,
    query,
    getConnection,
    testConnection
};
