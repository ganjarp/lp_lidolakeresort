-- ═══════════════════════════════════════════════════════════
-- Lido Lake Resort - Linktree Clone
-- Database Schema for MySQL (Laragon phpMyAdmin)
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

-- ── Insert default admin ──
-- PENTING: Gunakan /api/setup untuk insert admin dengan hash bcrypt yang benar
-- Password default: admin123
-- Jalankan: GET http://localhost:3000/api/setup

-- ── Insert default profile ──
INSERT INTO profile (id, display_name, bio, avatar_url) VALUES 
(1, 'Lido Lake Resort', 'Selamat datang di Lido Lake Resort. Temukan keindahan alam danau Lido dan nikmati pengalaman liburan terbaik bersama kami.', '/uploads/avatar.png')
ON DUPLICATE KEY UPDATE id=id;


-- ═══════════════════════════════════════════════════════════
-- SUPABASE EQUIVALENT (PostgreSQL)
-- Use these queries in Supabase SQL Editor when migrating
-- ═══════════════════════════════════════════════════════════
/*

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Admin users table
CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profile / Bio settings
CREATE TABLE IF NOT EXISTS profile (
  id SERIAL PRIMARY KEY,
  display_name VARCHAR(255) NOT NULL DEFAULT 'Lido Lake Resort',
  bio TEXT,
  avatar_url VARCHAR(500) DEFAULT '/uploads/avatar.png',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Links table
CREATE TABLE IF NOT EXISTS links (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  url VARCHAR(500) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link images table
CREATE TABLE IF NOT EXISTS link_images (
  id SERIAL PRIMARY KEY,
  link_id INT NOT NULL REFERENCES links(id) ON DELETE CASCADE,
  image_url VARCHAR(500) NOT NULL,
  caption VARCHAR(255),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to profile
CREATE TRIGGER update_profile_updated_at
  BEFORE UPDATE ON profile
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to links  
CREATE TRIGGER update_links_updated_at
  BEFORE UPDATE ON links
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin (password: admin123)
-- Use /api/setup endpoint or manually hash with bcrypt
INSERT INTO admins (username, password) VALUES 
('admin', '$2b$10$GENERATED_HASH_HERE')
ON CONFLICT (username) DO NOTHING;

-- Insert default profile
INSERT INTO profile (id, display_name, bio, avatar_url) VALUES 
(1, 'Lido Lake Resort', 'Selamat datang di Lido Lake Resort. Temukan keindahan alam danau Lido dan nikmati pengalaman liburan terbaik bersama kami.', '/uploads/avatar.png')
ON CONFLICT (id) DO NOTHING;

-- Row Level Security (RLS)
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE links ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_images ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Public read profile" ON profile FOR SELECT USING (true);
CREATE POLICY "Public read active links" ON links FOR SELECT USING (is_active = true);
CREATE POLICY "Public read link images" ON link_images FOR SELECT USING (true);

-- Admin full access (via service role key, bypasses RLS)

*/
