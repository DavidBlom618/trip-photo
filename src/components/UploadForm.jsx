import { useState, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'

function compressImage(file) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const maxWidth = 1920
      let width = img.width
      let height = img.height
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.8)
    }
    img.src = URL.createObjectURL(file)
  })
}

export default function UploadForm({ city, onSuccess }) {
  const { user } = useAuth()
  const fileRef = useRef(null)
  const [caption, setCaption] = useState('')
  const [takenAt, setTakenAt] = useState('')
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(null)
  const [file, setFile] = useState(null)

  const handleFileChange = (e) => {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file || !user) return

    setUploading(true)
    try {
      const compressed = await compressImage(file)
      const ext = file.name.split('.').pop()
      const storagePath = `${city.slug}/${user.id}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(storagePath, compressed, {
          contentType: 'image/jpeg',
          upsert: false,
        })

      if (uploadError) throw uploadError

      const { error: insertError } = await supabase.from('photos').insert({
        city_id: city.id,
        user_id: user.id,
        storage_path: storagePath,
        caption: caption.trim() || null,
        taken_at: takenAt || null,
      })

      if (insertError) throw insertError

      onSuccess()
    } catch (err) {
      alert('上传失败: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <form className="upload-form" onSubmit={handleSubmit}>
      <div className="upload-preview">
        {preview ? (
          <img src={preview} alt="预览" />
        ) : (
          <div className="upload-placeholder" onClick={() => fileRef.current?.click()}>
            &#x1F4F7;
            <p>点击选择照片</p>
          </div>
        )}
      </div>
      <div className="upload-fields">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <button type="button" className="btn btn-outline" onClick={() => fileRef.current?.click()}>
          {file ? '更换照片' : '选择照片'}
        </button>
        <input
          type="text"
          className="input"
          placeholder="照片描述（可选）"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />
        <input
          type="date"
          className="input"
          value={takenAt}
          onChange={(e) => setTakenAt(e.target.value)}
        />
        <button type="submit" className="btn btn-primary" disabled={!file || uploading}>
          {uploading ? '上传中...' : '上传照片'}
        </button>
      </div>
    </form>
  )
}
