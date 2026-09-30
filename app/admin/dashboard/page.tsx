'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface LinkImage {
  id: number;
  image_url: string;
  caption: string;
  link_id: number;
}

interface LinkItem {
  id: number;
  type: 'link' | 'gallery';
  title: string;
  url: string;
  description: string;
  is_active: number;
  sort_order: number;
  images: LinkImage[];
}

interface Profile {
  display_name: string;
  bio: string;
  avatar_url: string;
}

interface Toast {
  message: string;
  type: 'success' | 'error';
}

export default function AdminDashboard() {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [profile, setProfile] = useState<Profile>({ display_name: '', bio: '', avatar_url: '' });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'links' | 'profile'>('links');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'link' | 'gallery'>('link');
  const [editingLink, setEditingLink] = useState<LinkItem | null>(null);
  const [expandedImages, setExpandedImages] = useState<number | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [uploadingImages, setUploadingImages] = useState<number | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [formOrder, setFormOrder] = useState(0);

  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const getToken = () => localStorage.getItem('admin_token') || '';

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchLinks = useCallback(async () => {
    try {
      const res = await fetch('/api/links', {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      setLinks(Array.isArray(data) ? data : []);
    } catch {
      showToast('Gagal memuat data', 'error');
    }
  }, [showToast]);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/profile');
      const data = await res.json();
      setProfile(data);
    } catch {
      showToast('Gagal memuat profil', 'error');
    }
  }, [showToast]);

  const checkAuth = useCallback(async () => {
    const token = getToken();
    if (!token) { router.replace('/admin'); return; }

    try {
      const res = await fetch('/api/auth/verify', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { localStorage.removeItem('admin_token'); router.replace('/admin'); return; }
    } catch { router.replace('/admin'); return; }

    await Promise.all([fetchLinks(), fetchProfile()]);
    setLoading(false);
  }, [router, fetchLinks, fetchProfile]);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  // ── CRUD: Open Modals ──
  const openCreateModal = (type: 'link' | 'gallery') => {
    setEditingLink(null);
    setModalType(type);
    setFormTitle('');
    setFormUrl('');
    setFormDescription('');
    setFormActive(true);
    setFormOrder(links.length + 1);
    setShowModal(true);
  };

  const openEditModal = (link: LinkItem) => {
    setEditingLink(link);
    setModalType(link.type);
    setFormTitle(link.title);
    setFormUrl(link.url);
    setFormDescription(link.description);
    setFormActive(link.is_active === 1);
    setFormOrder(link.sort_order);
    setShowModal(true);
  };

  // ── CRUD: Save ──
  const handleSaveLink = async () => {
    if (!formTitle) { showToast('Judul diperlukan', 'error'); return; }
    if (modalType === 'link' && !formUrl) { showToast('URL diperlukan untuk link', 'error'); return; }

    const body = {
      type: modalType,
      title: formTitle,
      url: modalType === 'link' ? formUrl : '',
      description: formDescription,
      is_active: formActive ? 1 : 0,
      sort_order: formOrder,
    };

    try {
      const url = editingLink ? `/api/links/${editingLink.id}` : '/api/links';
      const method = editingLink ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        showToast(editingLink ? 'Berhasil diperbarui' : 'Berhasil ditambahkan', 'success');
        setShowModal(false);
        await fetchLinks();
      } else {
        showToast('Gagal menyimpan', 'error');
      }
    } catch { showToast('Terjadi kesalahan', 'error'); }
  };

  // ── CRUD: Delete ──
  const handleDeleteLink = async (id: number) => {
    if (!confirm('Yakin ingin menghapus item ini beserta semua gambarnya?')) return;
    try {
      const res = await fetch(`/api/links/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) { showToast('Berhasil dihapus', 'success'); await fetchLinks(); }
      else { showToast('Gagal menghapus', 'error'); }
    } catch { showToast('Terjadi kesalahan', 'error'); }
  };

  // ── Toggle Active ──
  const handleToggleActive = async (link: LinkItem) => {
    try {
      await fetch(`/api/links/${link.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ ...link, is_active: link.is_active === 1 ? 0 : 1 }),
      });
      await fetchLinks();
    } catch { showToast('Gagal mengubah status', 'error'); }
  };

  // ── Image Upload ──
  const handleImageUpload = async (linkId: number, files: FileList) => {
    setUploadingImages(linkId);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
      formData.append('captions', '');
    }

    try {
      const res = await fetch(`/api/links/${linkId}/images`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });
      if (res.ok) { showToast(`${files.length} gambar berhasil diupload`, 'success'); await fetchLinks(); }
      else { showToast('Gagal mengupload gambar', 'error'); }
    } catch { showToast('Terjadi kesalahan upload', 'error'); }
    finally { setUploadingImages(null); }
  };

  // ── Image Delete ──
  const handleDeleteImage = async (linkId: number, imageId: number) => {
    try {
      const res = await fetch(`/api/links/${linkId}/images/${imageId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) { showToast('Gambar berhasil dihapus', 'success'); await fetchLinks(); }
      else { showToast('Gagal menghapus gambar', 'error'); }
    } catch { showToast('Terjadi kesalahan', 'error'); }
  };

  // ── Profile ──
  const handleSaveProfile = async () => {
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(profile),
      });
      if (res.ok) { showToast('Profil berhasil disimpan', 'success'); }
      else { showToast('Gagal menyimpan profil', 'error'); }
    } catch { showToast('Terjadi kesalahan', 'error'); }
  };

  const handleAvatarUpload = async (files: FileList) => {
    const formData = new FormData();
    formData.append('file', files[0]);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });
      const data = await res.json();
      if (res.ok) { setProfile({ ...profile, avatar_url: data.url }); showToast('Avatar berhasil diupload', 'success'); }
      else { showToast('Gagal mengupload avatar', 'error'); }
    } catch { showToast('Terjadi kesalahan', 'error'); }
  };

  const handleLogout = () => { localStorage.removeItem('admin_token'); router.push('/admin'); };

  // ── Stats ──
  const totalLinks = links.filter(l => l.type === 'link').length;
  const totalGalleries = links.filter(l => l.type === 'gallery').length;
  const totalImages = links.reduce((sum, l) => sum + (l.images?.length || 0), 0);
  const activeItems = links.filter(l => l.is_active === 1).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-3 border-t-transparent animate-spin"
            style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
          <p style={{ color: 'var(--text-muted)' }}>Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Toast */}
      {toast && (
        <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <header className="glass sticky top-0 z-50" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                Lido Lake Resort
              </h1>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Admin Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a href="/public" target="_blank" className="btn btn-ghost text-sm hidden sm:flex">
              Lihat Halaman
            </a>
            <button onClick={handleLogout} className="btn btn-ghost text-sm">
              Keluar
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Tab nav */}
        <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit" style={{ background: 'var(--surface)' }}>
          <button onClick={() => setActiveTab('links')}
            className="px-5 py-2.5 rounded-lg text-sm font-medium transition-all"
            style={{
              background: activeTab === 'links' ? '#ffffff' : 'transparent',
              color: activeTab === 'links' ? '#0f172a' : 'var(--text-muted)',
              boxShadow: activeTab === 'links' ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
            }}>
            Kelola Konten
          </button>
          <button onClick={() => setActiveTab('profile')}
            className="px-5 py-2.5 rounded-lg text-sm font-medium transition-all"
            style={{
              background: activeTab === 'profile' ? '#ffffff' : 'transparent',
              color: activeTab === 'profile' ? '#0f172a' : 'var(--text-muted)',
              boxShadow: activeTab === 'profile' ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
            }}>
            Profil &amp; Bio
          </button>
        </div>

        {/* ═══════ LINKS TAB ═══════ */}
        {activeTab === 'links' && (
          <div className="animate-fade-in">
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="glass rounded-xl p-4">
                <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Link</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--primary-light)' }}>{totalLinks}</p>
              </div>
              <div className="glass rounded-xl p-4">
                <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Galeri</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--accent-light)' }}>{totalGalleries}</p>
              </div>
              <div className="glass rounded-xl p-4">
                <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Gambar</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--warning)' }}>{totalImages}</p>
              </div>
              <div className="glass rounded-xl p-4">
                <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Aktif</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--success)' }}>{activeItems}</p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 mb-5">
              <button onClick={() => openCreateModal('link')} className="btn btn-primary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Tambah Link
              </button>
              <button onClick={() => openCreateModal('gallery')} className="btn btn-secondary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Tambah Galeri
              </button>
            </div>

            {/* Items list */}
            <div className="space-y-3">
              {links.map((link, index) => (
                <div key={link.id} className="glass rounded-xl overflow-hidden animate-fade-in"
                  style={{ animationDelay: `${index * 0.03}s` }}>
                  <div className="p-4">
                    <div className="flex items-center gap-3">
                      {/* Order */}
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                        style={{ background: 'var(--surface-light)', color: 'var(--text-muted)' }}>
                        {link.sort_order}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`type-badge ${link.type === 'gallery' ? 'type-badge-gallery' : 'type-badge-link'}`}>
                            {link.type === 'gallery' ? 'Galeri' : 'Link'}
                          </span>
                          <h3 className="font-semibold text-sm truncate">{link.title}</h3>
                          <span className="text-xs px-2 py-0.5 rounded-full"
                            style={{
                              background: link.is_active ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                              color: link.is_active ? 'var(--success)' : 'var(--danger)',
                            }}>
                            {link.is_active ? 'Aktif' : 'Nonaktif'}
                          </span>
                          {link.type === 'gallery' && link.images?.length > 0 && (
                            <span className="text-xs px-2 py-0.5 rounded-full"
                              style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--warning)' }}>
                              {link.images.length} gambar
                            </span>
                          )}
                        </div>
                        {link.type === 'link' && link.url && (
                          <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>{link.url}</p>
                        )}
                        {link.type === 'gallery' && link.description && (
                          <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>{link.description}</p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button onClick={() => handleToggleActive(link)}
                          className={`toggle ${link.is_active ? 'active' : ''}`}
                          title={link.is_active ? 'Nonaktifkan' : 'Aktifkan'} />

                        {/* Upload images (for gallery type) */}
                        {link.type === 'gallery' && (
                          <button
                            onClick={() => {
                              if (fileInputRef.current) {
                                fileInputRef.current.dataset.linkId = String(link.id);
                                fileInputRef.current.click();
                              }
                            }}
                            className="btn btn-ghost p-2" title="Upload gambar"
                            disabled={uploadingImages === link.id}>
                            {uploadingImages === link.id ? (
                              <span className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                                style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
                            ) : (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                              </svg>
                            )}
                          </button>
                        )}

                        {/* Expand images */}
                        {link.type === 'gallery' && link.images?.length > 0 && (
                          <button
                            onClick={() => setExpandedImages(expandedImages === link.id ? null : link.id)}
                            className="btn btn-ghost p-2" title="Lihat gambar">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                              style={{ transform: expandedImages === link.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
                          </button>
                        )}

                        {/* Edit */}
                        <button onClick={() => openEditModal(link)} className="btn btn-ghost p-2" title="Edit">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>

                        {/* Delete */}
                        <button onClick={() => handleDeleteLink(link.id)} className="btn btn-ghost p-2" title="Hapus"
                          style={{ color: 'var(--danger)' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded images for gallery */}
                  {expandedImages === link.id && link.type === 'gallery' && link.images?.length > 0 && (
                    <div className="px-4 pb-4 animate-fade-in" style={{ borderTop: '1px solid var(--border)' }}>
                      <div className="pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                            Galeri Gambar ({link.images.length})
                          </p>
                          <button
                            onClick={() => {
                              if (fileInputRef.current) {
                                fileInputRef.current.dataset.linkId = String(link.id);
                                fileInputRef.current.click();
                              }
                            }}
                            className="text-xs font-medium cursor-pointer"
                            style={{ color: 'var(--accent-light)', background: 'none', border: 'none' }}>
                            + Tambah Gambar
                          </button>
                        </div>
                        <div className="image-gallery">
                          {link.images.map((img) => (
                            <div key={img.id} className="image-gallery-item">
                              <img src={img.image_url} alt={img.caption || 'Image'} />
                              <button
                                className="delete-btn"
                                onClick={() => handleDeleteImage(link.id, img.id)}
                                title="Hapus gambar">
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {links.length === 0 && (
                <div className="glass rounded-xl p-12 text-center">
                  <p className="text-4xl mb-4">📋</p>
                  <p className="font-semibold mb-1">Belum ada konten</p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Tambahkan link atau galeri untuk memulai
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════ PROFILE TAB ═══════ */}
        {activeTab === 'profile' && (
          <div className="animate-fade-in max-w-2xl">
            <h2 className="text-xl font-bold mb-6" style={{ fontFamily: 'var(--font-display)' }}>
              Pengaturan Profil
            </h2>

            <div className="glass rounded-xl p-6 space-y-6">
              {/* Avatar */}
              <div>
                <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-muted)' }}>Avatar</label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2" style={{ borderColor: 'var(--border)' }}>
                    <img src={profile.avatar_url || '/uploads/avatar.png'} alt="Avatar"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.display_name || 'L')}&background=1e293b&color=fff&size=128`;
                      }} />
                  </div>
                  <button onClick={() => avatarInputRef.current?.click()} className="btn btn-ghost">
                    Upload Avatar
                  </button>
                  <input ref={avatarInputRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => { if (e.target.files?.length) handleAvatarUpload(e.target.files); }} />
                </div>
              </div>

              {/* Display name */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Nama Tampilan</label>
                <input type="text" value={profile.display_name}
                  onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                  className="input-field" placeholder="Nama yang ditampilkan" />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Bio</label>
                <textarea value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  className="input-field" rows={4} placeholder="Deskripsi singkat..." style={{ resize: 'vertical' }} />
              </div>

              {/* Avatar URL */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Avatar URL (manual)</label>
                <input type="text" value={profile.avatar_url}
                  onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })}
                  className="input-field" placeholder="/uploads/avatar.png" />
              </div>

              <button onClick={handleSaveProfile} className="btn btn-primary">
                Simpan Profil
              </button>
            </div>

            {/* Preview */}
            <div className="mt-6">
              <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-muted)' }}>Preview</h3>
              <div className="glass rounded-xl p-8 flex flex-col items-center">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 mb-4" style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
                  <img src={profile.avatar_url || '/uploads/avatar.png'} alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.display_name || 'L')}&background=1e293b&color=fff&size=128`;
                    }} />
                </div>
                <h3 className="text-lg font-bold text-white">{profile.display_name || 'Nama'}</h3>
                <p className="text-sm text-center mt-1 max-w-sm" style={{ color: 'var(--text-muted)' }}>
                  {profile.bio || 'Bio akan muncul di sini'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hidden file input for gallery image uploads */}
      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
        onChange={(e) => {
          const linkId = e.target.dataset.linkId;
          if (linkId && e.target.files?.length) { handleImageUpload(Number(linkId), e.target.files); }
          e.target.value = '';
        }} />

      {/* ═══════ MODAL ═══════ */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                  {editingLink ? 'Edit' : 'Tambah'} {modalType === 'gallery' ? 'Galeri' : 'Link'}
                </h2>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  {modalType === 'gallery'
                    ? 'Container untuk menampilkan koleksi gambar'
                    : 'Link ke website, sosial media, atau halaman lain'}
                </p>
              </div>
              <button onClick={() => setShowModal(false)} className="btn btn-ghost p-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                  {modalType === 'gallery' ? 'Nama Galeri' : 'Judul'} <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)}
                  className="input-field"
                  placeholder={modalType === 'gallery' ? 'contoh: Foto Resort, Fasilitas' : 'contoh: Instagram, Website'} />
              </div>

              {/* URL (only for links) */}
              {modalType === 'link' && (
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                    URL <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <input type="url" value={formUrl} onChange={(e) => setFormUrl(e.target.value)}
                    className="input-field" placeholder="https://..." />
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Deskripsi</label>
                <textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)}
                  className="input-field" rows={3}
                  placeholder={modalType === 'gallery' ? 'Deskripsi galeri...' : 'Deskripsi singkat link...'}
                  style={{ resize: 'vertical' }} />
              </div>

              {/* Order & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Urutan</label>
                  <input type="number" value={formOrder} onChange={(e) => setFormOrder(Number(e.target.value))}
                    className="input-field" min={0} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Status</label>
                  <div className="flex items-center gap-3 h-[46px]">
                    <button type="button" onClick={() => setFormActive(!formActive)}
                      className={`toggle ${formActive ? 'active' : ''}`} />
                    <span className="text-sm" style={{ color: formActive ? 'var(--success)' : 'var(--text-muted)' }}>
                      {formActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Hint for gallery */}
              {modalType === 'gallery' && !editingLink && (
                <div className="p-3 rounded-xl text-xs" style={{ background: 'rgba(6,182,212,0.08)', color: 'var(--accent-light)', border: '1px solid rgba(6,182,212,0.15)' }}>
                  💡 Setelah galeri dibuat, Anda bisa mengupload gambar dari daftar konten.
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
              <button onClick={() => setShowModal(false)} className="btn btn-ghost flex-1">Batal</button>
              <button onClick={handleSaveLink}
                className={`btn flex-1 ${modalType === 'gallery' ? 'btn-secondary' : 'btn-primary'}`}>
                {editingLink ? 'Simpan Perubahan' : `Tambah ${modalType === 'gallery' ? 'Galeri' : 'Link'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
