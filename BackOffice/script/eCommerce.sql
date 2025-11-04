-- CREATE DATABASE
CREATE DATABASE eCommerce;
USE eCommerce;

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



CREATE TABLE Muni (
    Muni_ID INT AUTO_INCREMENT PRIMARY KEY,
    Muni_Name VARCHAR(100) NOT NULL
);

CREATE TABLE Barangay (
    Brgy_ID INT AUTO_INCREMENT PRIMARY KEY,
    Brgy_Name VARCHAR(100) NOT NULL,
    Muni_ID INT NOT NULL,
    Rates DECIMAL(10,2) DEFAULT 0.00,
    FOREIGN KEY (Muni_ID) REFERENCES Muni(Muni_ID)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);


-- USER ↔ ROLE (junction table for many-to-many)
CREATE TABLE user_roles (
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE
);



CREATE TABLE  user_shipping_details  (
  user_shipping_id int(11) NOT NULL,
   user_id  int(11) NOT NULL,
   fullname  varchar(150) NOT NULL,
   phonenumber  varchar(150) NOT NULL,
   address  varchar(250) NOT NULL,
   postalcode  varchar(10) NOT NULL,
   created_at  timestamp NOT NULL DEFAULT current_timestamp(),
    is_default_address  int(11) DEFAULT NULL,
    Brgy_ID INT NOT NULL,
    Muni_ID INT NOT NULL,    
    FOREIGN KEY (Muni_ID) REFERENCES Muni(Muni_ID)
    FOREIGN KEY (Brgy_ID) REFERENCES Barangay(Brgy_ID)

) ;


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

-- ORDERS
CREATE TABLE orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    status_id INT NOT NULL, 
    rates DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (status_id) REFERENCES order_status(status_id)
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
('Pending'), ('Paid'), ('Shipped'), ('Delivered');

-- Transaction Types
INSERT INTO transaction_types (name) VALUES
('Stock In'), ('Stock Out'), ('Return');

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
INSERT INTO orders (user_id, status_id, total) VALUES
(3, 1, 4725.00),  -- Pending
(3, 2, 35000.00); -- Paid

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

INSERT INTO transaction_types (type_id, name) VALUES
(0, 'Stock In'),
(1, 'Stock Out'),
(2, 'Return');

-- ========================================
-- Create Municipality and Barangay Tables
-- ========================================


-- ========================================
-- Seed Data for Municipality
-- ========================================

INSERT INTO Muni (Muni_Name) VALUES
('San Pedro, Laguna'),
('Biñan, Laguna'),
('Santa Rosa, Laguna'),
('Muntinlupa City');

-- ========================================
-- Seed Data for Barangay
-- ========================================

-- San Pedro, Laguna (Muni_ID = 1)
INSERT INTO Barangay (Brgy_Name, Muni_ID, Rates) VALUES
('San Antonio', 1, 10.50),
('Landayan', 1, 11.00),
('Santo Niño', 1, 9.75),
('Fatima', 1, 10.25),
('Nueva', 1, 9.50),
('Cuyab', 1, 10.00),
('Chrysanthemum', 1, 9.80),
('San Vicente', 1, 11.25),
('San Lorenzo Ruiz', 1, 9.90),
('Magsaysay', 1, 10.30);

-- Biñan, Laguna (Muni_ID = 2)
INSERT INTO Barangay (Brgy_Name, Muni_ID, Rates) VALUES
('Sto. Domingo', 2, 11.50),
('San Antonio', 2, 10.75),
('Dela Paz', 2, 9.85),
('Canlalay', 2, 10.10),
('Langkiwa', 2, 10.20),
('Poblacion', 2, 11.00),
('Zapote', 2, 10.60),
('San Francisco', 2, 9.95),
('Platero', 2, 10.15),
('Malaban', 2, 10.40);

-- Santa Rosa, Laguna (Muni_ID = 3)
INSERT INTO Barangay (Brgy_Name, Muni_ID, Rates) VALUES
('Balibago', 3, 11.80),
('Market Area', 3, 11.25),
('Dila', 3, 10.60),
('Malitlit', 3, 10.75),
('Macabling', 3, 9.95),
('Tagapo', 3, 11.10),
('Sinalhan', 3, 10.20),
('Labas', 3, 10.50),
('Aplaya', 3, 10.00),
('Ibaba', 3, 9.85);

-- Muntinlupa City (Muni_ID = 4)
INSERT INTO Barangay (Brgy_Name, Muni_ID, Rates) VALUES
('Alabang', 4, 12.50),
('Ayala Alabang', 4, 13.00),
('Bayanan', 4, 11.20),
('Buli', 4, 10.80),
('Cupang', 4, 11.00),
('Poblacion', 4, 10.90),
('Putatan', 4, 11.10),
('Sucat', 4, 11.40),
('Tunasan', 4, 10.70);
