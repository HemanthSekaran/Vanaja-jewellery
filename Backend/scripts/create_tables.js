
require('dotenv').config();
const mysql = require('mysql2/promise');

const createTables = async () => {
    let connection;
    try {
        const dbConfig = {
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 3306
        };

        console.log('Connecting to database...', dbConfig.database);
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected.');

        const createOrdersTable = `
            CREATE TABLE IF NOT EXISTS orders (
                order_id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                total_amount DECIMAL(10, 2) NOT NULL,
                total_gst DECIMAL(10, 2) NOT NULL,
                grand_total DECIMAL(10, 2) NOT NULL,
                order_status ENUM('pending', 'completed', 'cancelled', 'shipped', 'delivered') DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;

        const createOrderItemsTable = `
            CREATE TABLE IF NOT EXISTS order_items (
                id INT PRIMARY KEY AUTO_INCREMENT,
                order_id INT NOT NULL,
                product_id INT NOT NULL,
                product_name VARCHAR(255) NOT NULL,
                product_category VARCHAR(100),
                metal VARCHAR(50),
                metal_purity VARCHAR(50),
                weight DECIMAL(10, 3),
                wastage_percentage DECIMAL(5, 2),
                wastage_weight DECIMAL(10, 3),
                total_weight DECIMAL(10, 3),
                metal_rate_per_gram DECIMAL(10, 2),
                metal_value DECIMAL(10, 2),
                wastage_value DECIMAL(10, 2),
                base_price DECIMAL(10, 2),
                gst_percentage DECIMAL(5, 2),
                gst_amount DECIMAL(10, 2),
                final_price DECIMAL(10, 2),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES products(id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;

        console.log('Creating orders table...');
        await connection.execute(createOrdersTable);
        console.log('orders table created/verified.');

        console.log('Creating order_items table...');
        await connection.execute(createOrderItemsTable);
        console.log('order_items table created/verified.');

    } catch (error) {
        console.error('Error creating tables:', error);
    } finally {
        if (connection) await connection.end();
    }
};

createTables();
