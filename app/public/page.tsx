'use client';

import { useEffect, useState, useCallback } from 'react';

interface LinkImage {
  id: number;
  image_url: string;
  caption: string;
}

interface LinkItem {
  id: number;
  type: 'link' | 'gallery';
  title: string;
  url: string;
  description: string;
  is_active: number;
  images: LinkImage[];
}

interface Profile {
  display_name: string;
  bio: string;
  avatar_url: string;
}

export default function PublicPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Bottom Sheet State
  const [activeSheet, setActiveSheet] = useState<LinkItem | null>(null);
  const [isClosingSheet, setIsClosingSheet] = useState(false);

  // Lightbox State
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [lightboxImages, setLightboxImages] = useState<LinkImage[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      const [profileRes, linksRes] = await Promise.all([
        fetch('/api/profile'),
        fetch('/api/links'),
      ]);
      const profileData = await profileRes.json();
      const linksData = await linksRes.json();
      setProfile(profileData);
      setLinks(Array.isArray(linksData) ? linksData : []);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openSheet = (item: LinkItem) => {
    setActiveSheet(item);
    setIsClosingSheet(false);
  };

  const closeSheet = () => {
    setIsClosingSheet(true);
    setTimeout(() => {
      setActiveSheet(null);
      setIsClosingSheet(false);
    }, 300);
  };

  const openLightbox = (images: LinkImage[], index: number) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    setLightboxImage(images[index].image_url);
  };

  const navigateLightbox = (e: React.MouseEvent, direction: 'prev' | 'next') => {
    e.stopPropagation();
    let newIndex = direction === 'next' ? lightboxIndex + 1 : lightboxIndex - 1;
    if (newIndex < 0) newIndex = lightboxImages.length - 1;
    if (newIndex >= lightboxImages.length) newIndex = 0;
    setLightboxIndex(newIndex);
    setLightboxImage(lightboxImages[newIndex].image_url);
  };

  const closeLightbox = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLightboxImage(null);
    setLightboxImages([]);
    setLightboxIndex(0);
  };

  if (loading) {
    return (
      <div className="app-shell flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-3 border-t-transparent animate-spin"
            style={{ borderColor: '#ffffff', borderTopColor: 'transparent' }} />
          <p className="text-sm text-white/70">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <div className="app-shell">
        <div className="app-content pb-12 flex flex-col items-center pt-16">
        
        {/* Avatar */}
        <div className="mb-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="w-[100px] h-[100px] rounded-full bg-[#e6d5b8] flex items-center justify-center overflow-hidden p-1">
            <div className="w-full h-full rounded-full overflow-hidden">
              <img
                src={profile?.avatar_url || '/uploads/avatar.png'}
                alt={profile?.display_name || 'Avatar'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.display_name || 'L')}&background=e6d5b8&color=141b4d&size=128`;
                }}
              />
            </div>
          </div>
        </div>

        {/* Name */}
        <div className="text-center mb-10 animate-fade-in w-full" style={{ animationDelay: '0.2s' }}>
          <h1 className="text-xl font-bold text-white tracking-wide">
            {profile?.display_name || 'Lido Lake Resort'}
          </h1>
          {profile?.bio && (
            <p className="text-sm text-white/80 mt-2 max-w-sm mx-auto leading-relaxed">
              {profile.bio}
            </p>
          )}
        </div>

        {/* Content Items */}
        <div className="w-full space-y-3.5 px-2">
          {links.map((item, index) => (
            <div
              key={item.id}
              className="animate-slide-up"
              style={{ animationDelay: `${0.3 + index * 0.06}s`, opacity: 0, animationFillMode: 'forwards' }}
            >
              {item.type === 'gallery' ? (
                /* ── Gallery: Open Bottom Sheet ── */
                <button
                  onClick={() => openSheet(item)}
                  className="card-btn"
                >
                  <span className="card-btn-text">{item.title}</span>
                  <div className="card-dots">⋮</div>
                </button>
              ) : (
                /* ── Link: Open in same tab (no target="_blank") ── */
                <a
                  href={item.url}
                  className="card-btn"
                >
                  <span className="card-btn-text">{item.title}</span>
                  <div className="card-dots">⋮</div>
                </a>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom Sheet ── */}
      {activeSheet && (
        <>
          <div className="sheet-overlay" onClick={closeSheet} />
          <div className={`sheet-container ${isClosingSheet ? 'closing' : ''}`}>
            <div className="sheet-panel">
              <div className="sheet-handle" />
              <div className="sheet-header">
                <div className="min-w-0 pr-4">
                  <h2 className="sheet-title truncate">{activeSheet.title}</h2>
                  {activeSheet.description && (
                    <p className="sheet-subtitle truncate">{activeSheet.description}</p>
                  )}
                </div>
                <button onClick={closeSheet} className="sheet-close">✕</button>
              </div>
              
              <div className="sheet-body">
                {activeSheet.type === 'gallery' && (
                  activeSheet.images && activeSheet.images.length > 0 ? (
                    activeSheet.images.map((img, idx) => (
                      <div 
                        key={img.id} 
                        className="sheet-image-item"
                        onClick={() => openLightbox(activeSheet.images, idx)}
                      >
                        <img src={img.image_url} alt={img.caption || `Foto ${idx + 1}`} loading="lazy" />
                        {img.caption && <div className="sheet-image-caption">{img.caption}</div>}
                      </div>
                    ))
                  ) : (
                    <div className="sheet-empty">
                      <div className="text-3xl mb-2">📷</div>
                      <p>Belum ada foto dalam galeri ini</p>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Lightbox for Gallery inside Sheet ── */}
      {lightboxImage && (
        <div
          className="lightbox-overlay"
          onClick={closeLightbox}
        >
          {lightboxImages.length > 1 && (
            <button
              className="lightbox-nav prev"
              onClick={(e) => navigateLightbox(e, 'prev')}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}

          <img
            src={lightboxImage}
            alt="Full view"
            onClick={(e) => e.stopPropagation()}
          />

          {lightboxImages.length > 1 && (
            <button
              className="lightbox-nav next"
              onClick={(e) => navigateLightbox(e, 'next')}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}

          <button
            className="lightbox-close"
            onClick={closeLightbox}
          >
            ✕
          </button>

          {lightboxImages.length > 1 && (
            <div className="lightbox-counter">
              {lightboxIndex + 1} / {lightboxImages.length}
            </div>
          )}
        </div>
      )}
    </div>
  </div>
  );
}
