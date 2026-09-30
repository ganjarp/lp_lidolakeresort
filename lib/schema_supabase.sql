-- ═══════════════════════════════════════════════════════════
-- Lido Lake Resort - Linktree Clone
-- PostgreSQL Schema for Supabase
-- ═══════════════════════════════════════════════════════════

-- ── Profile / Bio settings ──
CREATE TABLE IF NOT EXISTS profile (
  id SERIAL PRIMARY KEY,
  display_name VARCHAR(255) NOT NULL DEFAULT 'Lido Lake Resort',
  bio TEXT,
  avatar_url VARCHAR(500) DEFAULT '/uploads/avatar.png',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ── Admin users table ──
CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ── Links table ──
CREATE TABLE IF NOT EXISTS links (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  url VARCHAR(500) NOT NULL,
  description TEXT,
  type VARCHAR(20) DEFAULT 'link',
  is_active SMALLINT DEFAULT 1,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ── Link images table (many images per link) ──
CREATE TABLE IF NOT EXISTS link_images (
  id SERIAL PRIMARY KEY,
  link_id INT NOT NULL REFERENCES links(id) ON DELETE CASCADE,
  image_url VARCHAR(500) NOT NULL,
  caption VARCHAR(255),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ── Insert default admin (password: admin123) ──
INSERT INTO admins (id, username, password) VALUES 
(1, 'admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi')
ON CONFLICT (username) DO NOTHING;

-- ── Insert default profile ──
INSERT INTO profile (id, display_name, bio, avatar_url) VALUES 
(1, 'Lido Lake Resort', 'Selamat datang di Lido Lake Resort. Temukan keindahan alam danau Lido dan nikmati pengalaman liburan terbaik bersama kami.', '/uploads/avatar.png')
ON CONFLICT (id) DO NOTHING;
