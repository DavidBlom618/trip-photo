import { useAuth } from '../context/AuthContext'

export default function Navbar({ onLogin }) {
  const { user, loading, signOut } = useAuth()

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="navbar-logo">&#x1F30D;</span>
        <span className="navbar-title">旅途相册</span>
      </div>
      <div className="navbar-auth">
        {loading ? (
          <span className="navbar-loading">...</span>
        ) : user ? (
          <div className="navbar-user">
            <span className="navbar-email">{user.email}</span>
            <button className="btn btn-outline" onClick={signOut}>退出</button>
          </div>
        ) : (
          <button className="btn btn-primary" onClick={onLogin}>登录 / 注册</button>
        )}
      </div>
    </nav>
  )
}
