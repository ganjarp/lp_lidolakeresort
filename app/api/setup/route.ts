import { supabase } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    // Insert default admin (password: admin123)
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const { error: adminError } = await supabase
      .from('admins')
      .upsert(
        { id: 1, username: 'admin', password: hashedPassword },
        { onConflict: 'username' }
      );

    if (adminError) throw adminError;

    // Insert default profile
    const { error: profileError } = await supabase
      .from('profile')
      .upsert(
        {
          id: 1,
          display_name: 'Lido Lake Resort',
          bio: 'Lido Lake Resort by MNC Hotel',
          avatar_url: '/uploads/avatar.png',
        },
        { onConflict: 'id' }
      );

    if (profileError) throw profileError;

    // Insert sample links if none exist
    const { count } = await supabase
      .from('links')
      .select('*', { count: 'exact', head: true });

    if (count === 0) {
      const { error: linksError } = await supabase.from('links').insert([
        { title: 'Website Resmi', url: 'https://lidolakeresort.com', description: 'Kunjungi website resmi kami', sort_order: 1, is_active: 1 },
        { title: 'Instagram', url: 'https://instagram.com/lidolakeresort', description: 'Follow kami di Instagram', sort_order: 2, is_active: 1 },
        { title: 'Reservasi Online', url: 'https://booking.lidolakeresort.com', description: 'Pesan kamar dan fasilitas', sort_order: 3, is_active: 1 },
        { title: 'WhatsApp', url: 'https://wa.me/628123456789', description: 'Hubungi kami via WhatsApp', sort_order: 4, is_active: 1 },
        { title: 'YouTube', url: 'https://youtube.com/@lidolakeresort', description: 'Tonton video kami', sort_order: 5, is_active: 1 },
      ]);

      if (linksError) throw linksError;
    }

    return Response.json({ success: true, message: 'Database setup completed successfully!' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
