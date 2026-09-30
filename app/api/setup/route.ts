import pool from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const connection = await pool.getConnection();

    // Create tables
    await connection.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS profile (
        id INT AUTO_INCREMENT PRIMARY KEY,
        display_name VARCHAR(255) NOT NULL DEFAULT 'Lido Lake Resort',
        bio TEXT,
        avatar_url VARCHAR(500) DEFAULT '/uploads/avatar.png',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS links (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        url VARCHAR(500) NOT NULL,
        description TEXT,
        is_active TINYINT(1) DEFAULT 1,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS link_images (
        id INT AUTO_INCREMENT PRIMARY KEY,
        link_id INT NOT NULL,
        image_url VARCHAR(500) NOT NULL,
        caption VARCHAR(255),
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (link_id) REFERENCES links(id) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);

    // Insert default admin (password: admin123)
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await connection.query(
      `INSERT INTO admins (username, password) VALUES (?, ?) ON DUPLICATE KEY UPDATE password=VALUES(password)`,
      ['admin', hashedPassword]
    );

    // Insert default profile
    await connection.query(
      `INSERT INTO profile (id, display_name, bio, avatar_url) VALUES (1, ?, ?, ?) ON DUPLICATE KEY UPDATE id=id`,
      [
        'Lido Lake Resort',
        'Selamat datang di Lido Lake Resort. Temukan keindahan alam danau Lido dan nikmati pengalaman liburan terbaik bersama kami.',
        '/uploads/avatar.png',
      ]
    );

    // Insert sample links
    const [existingLinks] = await connection.query('SELECT COUNT(*) as count FROM links');
    if ((existingLinks as Array<{ count: number }>)[0].count === 0) {
      await connection.query(
        `INSERT INTO links (title, url, description, sort_order, is_active) VALUES 
        ('Website Resmi', 'https://lidolakeresort.com', 'Kunjungi website resmi kami', 1, 1),
        ('Instagram', 'https://instagram.com/lidolakeresort', 'Follow kami di Instagram', 2, 1),
        ('Reservasi Online', 'https://booking.lidolakeresort.com', 'Pesan kamar dan fasilitas', 3, 1),
        ('WhatsApp', 'https://wa.me/628123456789', 'Hubungi kami via WhatsApp', 4, 1),
        ('YouTube', 'https://youtube.com/@lidolakeresort', 'Tonton video kami', 5, 1)`
      );
    }

    connection.release();

    return Response.json({ success: true, message: 'Database setup completed successfully!' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
