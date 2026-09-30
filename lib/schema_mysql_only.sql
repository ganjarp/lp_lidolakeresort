-- ═══════════════════════════════════════════════════════════
-- Lido Lake Resort - Linktree Clone
-- MySQL Schema for Laragon (phpMyAdmin)
-- ═══════════════════════════════════════════════════════════

CREATE DATABASE IF NOT EXISTS lido_lake_resort CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE lido_lake_resort;

-- ── Admin users table ──
CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ── Profile / Bio settings ──
CREATE TABLE IF NOT EXISTS profile (
  id INT AUTO_INCREMENT PRIMARY KEY,
  display_name VARCHAR(255) NOT NULL DEFAULT 'Lido Lake Resort',
  bio TEXT,
  avatar_url VARCHAR(500) DEFAULT '/uploads/avatar.png',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ── Links table ──
CREATE TABLE IF NOT EXISTS links (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  url VARCHAR(500) NOT NULL,
  description TEXT,
  is_active TINYINT(1) DEFAULT 1,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ── Link images table (many images per link) ──
CREATE TABLE IF NOT EXISTS link_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  link_id INT NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  caption VARCHAR(255),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (link_id) REFERENCES links(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ── Insert default admin (password: admin123) ──
-- bcrypt hash for 'admin123'
INSERT INTO admins (username, password) VALUES 
('admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi')
ON DUPLICATE KEY UPDATE username=username;

-- ── Insert default profile ──
INSERT INTO profile (id, display_name, bio, avatar_url) VALUES 
(1, 'Lido Lake Resort', 'Selamat datang di Lido Lake Resort. Temukan keindahan alam danau Lido dan nikmati pengalaman liburan terbaik bersama kami.', '/uploads/avatar.png')
ON DUPLICATE KEY UPDATE id=id;
