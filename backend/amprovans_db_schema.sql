-- ========================
-- DATABASE: amprovans
-- CLEAN VERSION
-- ========================

SET FOREIGN_KEY_CHECKS = 0;

-- ========================
-- USERS
-- ========================
DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin','agent') DEFAULT 'agent',
  status ENUM('active','inactive','suspended') DEFAULT 'active',
  is_verified TINYINT(1) DEFAULT 0,
  verification_code VARCHAR(255),
  reset_code VARCHAR(255),
  reset_expires DATETIME,
  last_active DATETIME,
  force_password_reset TINYINT(1) DEFAULT 0,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);

-- ========================
-- CARS
-- ========================
DROP TABLE IF EXISTS cars;
CREATE TABLE cars (
  id INT AUTO_INCREMENT PRIMARY KEY,
  plate_number VARCHAR(50) NOT NULL UNIQUE,
  make VARCHAR(255) NOT NULL,
  model VARCHAR(255) NOT NULL,
  year INT NOT NULL,
  transmission VARCHAR(255) NOT NULL,
  fuel VARCHAR(255) NOT NULL,
  body VARCHAR(255) NOT NULL,
  `condition` VARCHAR(255) NOT NULL,
  color VARCHAR(255) NOT NULL,
  mileage INT NOT NULL,
  engine INT NOT NULL,
  location VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  cost DECIMAL(10,2),
  ownership ENUM('company','client') DEFAULT 'company',
  status ENUM('available','sold','booked') DEFAULT 'available',
  description TEXT,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  updated_by INT
);

-- ========================
-- CAR IMAGES
-- ========================
DROP TABLE IF EXISTS car_images;
CREATE TABLE car_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  car_id INT NOT NULL,
  image_path VARCHAR(255) NOT NULL,
  FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE
);

-- ========================
-- CAR HIRES
-- ========================
DROP TABLE IF EXISTS car_hires;
CREATE TABLE car_hires (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(150),
  car_id INT NOT NULL,
  car_name VARCHAR(150),
  daily_rate DECIMAL(10,2) NOT NULL,
  total_cost DECIMAL(10,2) NOT NULL,
  total_days INT NOT NULL,
  pickup_date DATE NOT NULL,
  return_date DATE NOT NULL,
  pickup_location VARCHAR(255) NOT NULL,
  notes TEXT,
  status ENUM('pending','approved','rejected') DEFAULT 'pending',
  approved_by INT,
  approved_at DATETIME,
  rejection_reason TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE
);

-- ========================
-- CLIENT CARS (SELLING)
-- ========================
DROP TABLE IF EXISTS client_cars;
CREATE TABLE client_cars (
  id INT AUTO_INCREMENT PRIMARY KEY,
  owner_name VARCHAR(255) NOT NULL,
  owner_phone VARCHAR(20) NOT NULL,
  owner_email VARCHAR(255),
  plate_number VARCHAR(50) NOT NULL,
  make VARCHAR(255) NOT NULL,
  model VARCHAR(255) NOT NULL,
  year INT NOT NULL,
  mileage INT,
  engine INT,
  transmission VARCHAR(50),
  fuel_type VARCHAR(50),
  body VARCHAR(50),
  `condition` VARCHAR(50),
  color VARCHAR(50),
  location VARCHAR(255),
  expected_price DECIMAL(12,2) NOT NULL,
  agreed_price DECIMAL(12,2),
  commission_rate DECIMAL(5,2) DEFAULT 0.08,
  commission_amount DECIMAL(12,2),
  description TEXT,
  images JSON,
  status ENUM('pending','approved','rejected','sold') DEFAULT 'pending',
  car_id INT,
  reviewed_by INT,
  reviewed_at DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  admin_notes TEXT,
  FOREIGN KEY (car_id) REFERENCES cars(id)
);

-- ========================
-- CLIENT MESSAGES
-- ========================
DROP TABLE IF EXISTS client_messages;
CREATE TABLE client_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(255),
  message TEXT NOT NULL,
  status ENUM('pending','resolved') DEFAULT 'pending',
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL
);

-- ========================
-- SALES
-- ========================
DROP TABLE IF EXISTS sales;
CREATE TABLE sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  car_id INT NOT NULL,
  agent_id INT,
  sold_price DECIMAL(10,2) NOT NULL,
  profit DECIMAL(10,2) NOT NULL,
  commission DECIMAL(10,2) DEFAULT 0.00,
  net_profit DECIMAL(10,2) NOT NULL,
  sold_by_role ENUM('admin','agent') NOT NULL,
  created_at DATETIME NOT NULL,
  FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE,
  FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE SET NULL
);

SET FOREIGN_KEY_CHECKS = 1;