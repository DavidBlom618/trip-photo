import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function AuthModal({ onClose }) {
  const [mode, setMode] = useState('sign_in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'sign_in') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setError('注册成功！如需邮箱验证，请检查收件箱。')
        setMode('sign_in')
        setLoading(false)
        return
      }
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h2>{mode === 'sign_in' ? '登录' : '注册'}</h2>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>邮箱</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
            />
          </div>
          <div className="form-group">
            <label>密码</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="至少6位"
              minLength={6}
            />
          </div>
          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? '处理中...' : mode === 'sign_in' ? '登录' : '注册'}
          </button>
        </form>

        <p className="auth-switch">
          {mode === 'sign_in' ? (
            <>没有账号？<button className="link-btn" onClick={() => { setMode('sign_up'); setError('') }}>去注册</button></>
          ) : (
            <>已有账号？<button className="link-btn" onClick={() => { setMode('sign_in'); setError('') }}>去登录</button></>
          )}
        </p>
      </div>
    </div>
  )
}
