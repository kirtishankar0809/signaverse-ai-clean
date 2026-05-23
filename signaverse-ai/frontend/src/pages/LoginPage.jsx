import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../hooks/useApi'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [focused, setFocused] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await api.login(form.username, form.password)
      if (res.success) {
        login({ name: res.name, token: res.token, username: form.username })
        navigate('/')
      } else {
        setError(res.message || 'Authentication failed')
      }
    } catch {
      setError('Cannot connect to backend. Make sure the server is running.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen grid-bg flex items-center justify-center relative overflow-hidden">
      {/* Ambient blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl"
        style={{ background: 'radial-gradient(circle, #00e5ff, transparent)' }} />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl"
        style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }} />
      <div className="absolute top-1/2 left-0 w-64 h-64 rounded-full opacity-8 blur-3xl"
        style={{ background: 'radial-gradient(circle, #f59e0b, transparent)' }} />

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo / Brand */}
        <div className="text-center mb-10 fade-in-up">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 relative"
            style={{ background: 'linear-gradient(135deg, #00e5ff22, #7c3aed22)', border: '1px solid #00e5ff44' }}>
            <span className="text-3xl">🤟</span>
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-accent animate-pulse" />
          </div>
          <h1 className="font-display text-4xl font-800 tracking-tight"
            style={{ background: 'linear-gradient(135deg, #00e5ff, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            SignaVerse AI
          </h1>
          <p className="text-text-secondary text-sm mt-2 font-body">
            Real-time Sign Language Recognition System
          </p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-8 glow-accent fade-in-up-1">
          <div className="mb-6">
            <h2 className="font-display text-xl font-semibold text-text-primary">Welcome back</h2>
            <p className="text-text-muted text-sm mt-1">Sign in to access your AI dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="text-xs font-medium text-text-secondary uppercase tracking-widest mb-2 block">
                Username
              </label>
              <div className={`relative rounded-xl transition-all duration-200 ${focused === 'username' ? 'ring-1 ring-accent' : ''}`}
                style={{ background: 'rgba(9,13,26,0.8)', border: '1px solid ' + (focused === 'username' ? '#00e5ff44' : '#1e2d4a') }}>
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="demo"
                  value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  onFocus={() => setFocused('username')}
                  onBlur={() => setFocused(null)}
                  className="w-full bg-transparent pl-10 pr-4 py-3 text-text-primary placeholder-text-muted text-sm outline-none font-body"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-medium text-text-secondary uppercase tracking-widest mb-2 block">
                Password
              </label>
              <div className={`relative rounded-xl transition-all duration-200 ${focused === 'password' ? 'ring-1 ring-accent' : ''}`}
                style={{ background: 'rgba(9,13,26,0.8)', border: '1px solid ' + (focused === 'password' ? '#00e5ff44' : '#1e2d4a') }}>
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <input
                  type="password"
                  placeholder="demo123"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused(null)}
                  className="w-full bg-transparent pl-10 pr-4 py-3 text-text-primary placeholder-text-muted text-sm outline-none font-body"
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-display font-semibold text-sm tracking-wide transition-all duration-200 relative overflow-hidden mt-2"
              style={{
                background: loading ? '#1e2d4a' : 'linear-gradient(135deg, #00e5ff, #0891b2)',
                color: loading ? '#4a6080' : '#050810',
                boxShadow: loading ? 'none' : '0 0 20px rgba(0,229,255,0.3)',
              }}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Authenticating…
                </span>
              ) : 'Sign In →'}
            </button>
          </form>

          {/* Hint */}
          <div className="mt-5 pt-5 border-t border-border text-center">
            <p className="text-text-muted text-xs">Demo credentials: <span className="text-accent font-mono">demo</span> / <span className="text-accent font-mono">demo123</span></p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-text-muted text-xs mt-6 fade-in-up-2">
          SignaVerse AI · Major Project · CSE Department
        </p>
      </div>
    </div>
  )
}
