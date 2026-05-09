import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import PhotoCard from './PhotoCard'
import UploadForm from './UploadForm'

export default function CityGallery({ city, onClose }) {
  const { user } = useAuth()
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [lightbox, setLightbox] = useState(null)

  const fetchPhotos = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('photos')
      .select('*, profiles(display_name)')
      .eq('city_id', city.id)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setPhotos(data)
    }
    setLoading(false)
  }, [city.id])

  useEffect(() => {
    fetchPhotos()
  }, [fetchPhotos])

  // Realtime subscription for new photos
  useEffect(() => {
    const channel = supabase
      .channel(`photos-${city.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'photos', filter: `city_id=eq.${city.id}` },
        () => { fetchPhotos() }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [city.id, fetchPhotos])

  const handleDelete = async (photoId) => {
    const photo = photos.find((p) => p.id === photoId)
    if (!photo) return

    // Remove from storage
    await supabase.storage.from('photos').remove([photo.storage_path])
    // Remove from database
    await supabase.from('photos').delete().eq('id', photoId)

    setPhotos((prev) => prev.filter((p) => p.id !== photoId))
  }

  const imageUrl = (path) => {
    const { data } = supabase.storage.from('photos').getPublicUrl(path)
    return data.publicUrl
  }

  return (
    <div className="gallery-panel">
      <div className="gallery-header">
        <div>
          <h2>{city.name}</h2>
          <span className="gallery-province">{city.province}</span>
        </div>
        <div className="gallery-header-actions">
          {user && (
            <button className="btn btn-primary" onClick={() => setShowUpload(!showUpload)}>
              {showUpload ? '取消' : '+ 添加照片'}
            </button>
          )}
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
      </div>

      {showUpload && (
        <UploadForm city={city} onSuccess={() => { setShowUpload(false); fetchPhotos() }} />
      )}

      {!user && (
        <div className="gallery-login-hint">
          登录后即可上传照片
        </div>
      )}

      <div className="gallery-body">
        {loading ? (
          <div className="gallery-empty">加载中...</div>
        ) : photos.length === 0 ? (
          <div className="gallery-empty">
            <div className="empty-icon">&#x1F4F7;</div>
            <p>这个城市还没有照片</p>
            {user && <p>点击"+ 添加照片"成为第一个分享的人</p>}
          </div>
        ) : (
          <div className="photo-grid">
            {photos.map((photo) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                imageUrl={imageUrl(photo.storage_path)}
                isOwner={user?.id === photo.user_id}
                onDelete={() => handleDelete(photo.id)}
                onClick={() => setLightbox(photo)}
              />
            ))}
          </div>
        )}
      </div>

      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox(null)}>
          <button className="lightbox-close" onClick={() => setLightbox(null)}>&times;</button>
          <img
            src={imageUrl(lightbox.storage_path)}
            alt={lightbox.caption || ''}
            onClick={(e) => e.stopPropagation()}
          />
          {lightbox.caption && <p className="lightbox-caption">{lightbox.caption}</p>}
        </div>
      )}
    </div>
  )
}
