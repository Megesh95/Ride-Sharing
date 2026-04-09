-- Smart Bicycle Sharing System (MySQL) schema
-- Run this on a MySQL 8+ database.

CREATE DATABASE IF NOT EXISTS bike_sharing CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE bike_sharing;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('user','admin') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cycles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  location JSON NOT NULL,
  status ENUM('available','unavailable','reserved','active') NOT NULL DEFAULT 'available'
);

CREATE TABLE IF NOT EXISTS bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  cycle_id INT NOT NULL,
  start_time DATETIME NOT NULL,
  status ENUM('confirmed','cancelled','completed') NOT NULL DEFAULT 'confirmed',
  CONSTRAINT fk_bookings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_bookings_cycle FOREIGN KEY (cycle_id) REFERENCES cycles(id) ON DELETE CASCADE,
  INDEX idx_bookings_user_time (user_id, start_time),
  INDEX idx_bookings_cycle_time (cycle_id, start_time)
);

CREATE TABLE IF NOT EXISTS rides (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  cycle_id INT NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NULL,
  fare DECIMAL(10,2) NULL,
  CONSTRAINT fk_rides_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_rides_cycle FOREIGN KEY (cycle_id) REFERENCES cycles(id) ON DELETE CASCADE,
  INDEX idx_rides_user_time (user_id, start_time),
  INDEX idx_rides_cycle_time (cycle_id, start_time)
);

CREATE TABLE IF NOT EXISTS wallet (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  balance DECIMAL(10,2) NOT NULL DEFAULT 0,
  CONSTRAINT fk_wallet_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  type ENUM('credit','debit') NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_transactions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_transactions_user_created (user_id, created_at)
);

-- Example cycles (optional but recommended for first run)
-- Insert only if cycles table is empty.
INSERT INTO cycles (name, location, status)
SELECT
  c.name,
  c.location,
  c.status
FROM (
  SELECT 'Standard City Bike' AS name,
         JSON_OBJECT('lat', 12.9716, 'lng', 77.5946, 'type', 'standard', 'ratePerMinute', 1.5) AS location,
         'available' AS status
  UNION ALL
  SELECT 'Premium Electric Bike',
         JSON_OBJECT('lat', 12.9720, 'lng', 77.6100, 'type', 'electric', 'ratePerMinute', 3.5),
         'available'
  UNION ALL
  SELECT 'Premium Comfort Bike',
         JSON_OBJECT('lat', 12.9750, 'lng', 77.6000, 'type', 'premium', 'ratePerMinute', 2.5),
         'available'
) AS c
WHERE NOT EXISTS (SELECT 1 FROM cycles);

