-- CocoScout MySQL Database Schema
CREATE DATABASE IF NOT EXISTS cocoscout CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cocoscout;

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('owner', 'worker') NOT NULL DEFAULT 'worker',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trees (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  label VARCHAR(50),
  latitude DOUBLE NOT NULL,
  longitude DOUBLE NOT NULL,
  young_count INT UNSIGNED NOT NULL DEFAULT 0,
  mature_count INT UNSIGNED NOT NULL DEFAULT 0,
  overmature_count INT UNSIGNED NOT NULL DEFAULT 0,
  ready_for_harvest BOOLEAN NOT NULL DEFAULT FALSE,
  last_scanned_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_trees_location (latitude, longitude)
);

CREATE TABLE IF NOT EXISTS scans (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tree_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NULL,
  image_path VARCHAR(255) NOT NULL,
  latitude DOUBLE NOT NULL,
  longitude DOUBLE NOT NULL,
  altitude DOUBLE NULL,
  captured_at DATETIME NULL,
  young_count INT UNSIGNED NOT NULL DEFAULT 0,
  mature_count INT UNSIGNED NOT NULL DEFAULT 0,
  overmature_count INT UNSIGNED NOT NULL DEFAULT 0,
  total_count INT UNSIGNED NOT NULL DEFAULT 0,
  detections JSON NULL, -- [{ "class": "mature", "confidence": 0.91, "box": [x, y, w, h] }]
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tree_id) REFERENCES trees(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_scans_tree (tree_id)
);
