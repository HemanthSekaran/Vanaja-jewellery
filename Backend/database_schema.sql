-- ============================================
-- E-commerce Jewelry Database Schema
-- ============================================

-- Create database
CREATE DATABASE IF NOT EXISTS jewelry_ecommerce;
USE jewelry_ecommerce;

-- ============================================
-- Users Table
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Custom Designs Table
-- ============================================
CREATE TABLE IF NOT EXISTS custom_designs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    design_name NVARCHAR(255) NOT NULL,
    material_preference NVARCHAR(255) NOT NULL,
    approximate_weight FLOAT NOT NULL,
    description NVARCHAR(2000),
    reference_image NVARCHAR(255),
    status ENUM('pending', 'in_progress', 'completed', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Products Table
-- ============================================
CREATE TABLE IF NOT EXISTS products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name NVARCHAR(255) NOT NULL,
    grams NVARCHAR(50) NOT NULL,
    wastage INT NOT NULL,
    category NVARCHAR(100) NOT NULL,
    description NVARCHAR(2000),
    availability ENUM('YES', 'NO') DEFAULT 'YES',
    image NVARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_availability (availability),
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Sample Product Data (Optional)
-- Note: Run 'npm run seed-admin' to create the default admin user
-- ============================================
INSERT INTO products (name, grams, wastage, category, description, availability) VALUES
('ANTIQUE MAANGA FLOWER SET', '39/21', 10, 'ANTIQUE SET', 'Beautiful antique maanga flower set with intricate design', 'YES'),
('TRADITIONAL NECKLACE', '45', 12, 'NECKLACE', 'Classic traditional gold necklace', 'YES'),
('DIAMOND EARRINGS', '8', 5, 'EARRINGS', 'Elegant diamond studded earrings', 'YES')
ON DUPLICATE KEY UPDATE name=name;

-- ============================================
-- End of Schema
-- ============================================
