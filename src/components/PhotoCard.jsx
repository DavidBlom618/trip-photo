export default function PhotoCard({ photo, imageUrl, isOwner, onDelete, onClick }) {
  return (
    <div className="photo-card" onClick={onClick}>
      <div className="photo-card-image">
        <img src={imageUrl} alt={photo.caption || ''} loading="lazy" />
      </div>
      <div className="photo-card-info">
        {photo.caption && <p className="photo-caption">{photo.caption}</p>}
        <div className="photo-meta">
          <span className="photo-author">{photo.profiles?.display_name || '匿名'}</span>
          {photo.taken_at && (
            <span className="photo-date">{photo.taken_at}</span>
          )}
        </div>
      </div>
      {isOwner && (
        <button
          className="photo-delete-btn"
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          title="删除照片"
        >
          &#x1F5D1;
        </button>
      )}
    </div>
  )
}
