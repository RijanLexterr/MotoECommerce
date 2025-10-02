-- CREATE DATABASE
CREATE DATABASE MotoECommerce;
USE MotoECommerce;

-- ======================
-- LOOKUP TABLES
-- ======================

-- ROLES
CREATE TABLE roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

-- ORDER STATUS
CREATE TABLE order_status (
    status_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

-- INVENTORY TRANSACTION TYPES
CREATE TABLE transaction_types (
    type_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

-- PAYMENT TYPES
CREATE TABLE payment_types (
    payment_type_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    is_active TINYINT(1) DEFAULT 1
);

-- ======================
-- MAIN TABLES
-- ======================

-- USERS
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- USER SHIPPING DETAILS
CREATE TABLE user_shipping_details (
    user_shipping_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    fullname VARCHAR(150) NOT NULL,
    phonenumber VARCHAR(150) NOT NULL,
    address VARCHAR(250) NOT NULL,
    postalcode VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_default_address INT,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- USER ↔ ROLE (junction table for many-to-many)
CREATE TABLE user_roles (
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE
);

-- BRANDS
CREATE TABLE brands (
    brand_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CATEGORIES
CREATE TABLE categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PRODUCTS
CREATE TABLE products (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    brand_id INT NULL,
    category_id INT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    stock INT DEFAULT 0,
    expiration_date DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    image_location VARCHAR(200) NULL,
    filePath VARCHAR(255) NULL,
    FOREIGN KEY (brand_id) REFERENCES brands(brand_id) ON DELETE SET NULL,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE SET NULL
);

-- INVENTORY TRANSACTIONS
CREATE TABLE inventory_transactions (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    user_id INT NULL,
    type_id INT NOT NULL,
    qty INT NOT NULL,
    remarks VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (type_id) REFERENCES transaction_types(type_id)
);

-- CART
CREATE TABLE cart (
    cart_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    qty INT DEFAULT 1,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

-- ORDERS (✅ now includes payment_type_id)
CREATE TABLE orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    status_id INT NOT NULL, 
    total DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    shipped_at DATETIME NULL,
    user_shipping_id INT NULL,
    payment_type_id INT NULL,
    payment_img VARCHAR(255) NULL, -- Path to payment image
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (status_id) REFERENCES order_status(status_id),
    FOREIGN KEY (user_shipping_id) REFERENCES user_shipping_details(user_shipping_id),
    FOREIGN KEY (payment_type_id) REFERENCES payment_types(payment_type_id)
);

-- ORDER ITEMS
CREATE TABLE order_items (
    order_item_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    qty INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);

-- ======================
-- SAMPLE DATA
-- ======================

-- Roles
INSERT INTO roles (name) VALUES
('Admin'), ('Staff'), ('Customer');

-- Order Status
INSERT INTO order_status (name) VALUES
('Paid'),('To Ship'),('For Delivery'),('Delivered');

-- Transaction Types
INSERT INTO transaction_types (name) VALUES
('In'), ('Out'), ('Adjustment');

-- Payment Types
INSERT INTO payment_types (name, is_active) VALUES
('Cash on Delivery', 1),
('GCash', 1)


-- Users
INSERT INTO users (name, email, password) VALUES
('Admin User', 'admin@shop.com', 'admin123'),
('Staff User', 'staff@shop.com', 'staff123'),
('John Doe', 'john@example.com', 'password');

-- Assign Roles
INSERT INTO user_roles (user_id, role_id) VALUES
(1, 1),  -- Admin
(2, 2),  -- Staff
(3, 3);  -- Customer

-- Brands
INSERT INTO brands (name) VALUES
('Nike'), ('Samsung'), ('Nestle'), ('Sony');

-- Categories
INSERT INTO categories (name) VALUES
('Clothing'), ('Electronics'), ('Food & Beverage'), ('Health & Beauty');

-- Products
INSERT INTO products (brand_id, category_id, name, description, price, stock, expiration_date) VALUES
(1, 1, 'Nike Air Max', 'Running Shoes', 4500.00, 20, NULL),
(2, 2, 'Samsung Galaxy S22', 'Latest Smartphone', 35000.00, 10, NULL),
(3, 3, 'Nescafe Coffee', 'Instant Coffee 100g', 150.00, 50, '2026-12-31'),
(3, 3, 'Nestle Milk 1L', 'Fresh Milk', 75.00, 100, '2025-10-01'),
(4, 2, 'Sony Headphones', 'Wireless Noise Cancelling', 8000.00, 15, NULL),
(3, 4, 'Vitamin C Tablets', 'Immune Booster 500mg', 250.00, 200, '2027-01-15');

-- Orders
INSERT INTO orders (user_id, status_id, total, payment_type_id) VALUES
(3, 1, 4725.00, 1),  -- Pending, Cash
(3, 2, 35000.00, 2); -- Paid, Credit Card

-- Order Items
INSERT INTO order_items (order_id, product_id, qty, price) VALUES
(1, 1, 1, 4500.00),
(1, 3, 5, 225.00),
(2, 2, 1, 35000.00);

-- Inventory Transactions
INSERT INTO inventory_transactions (product_id, user_id, type_id, qty, remarks) VALUES
(1, 1, 1, 20, 'Initial stock of Nike Shoes'),
(2, 1, 1, 10, 'Initial stock Samsung phones'),
(3, 1, 1, 50, 'Initial stock Coffee'),
(4, 1, 1, 100, 'Initial stock Milk'),
(5, 1, 1, 15, 'Initial stock Headphones'),
(6, 1, 1, 200, 'Initial stock Vitamins');
