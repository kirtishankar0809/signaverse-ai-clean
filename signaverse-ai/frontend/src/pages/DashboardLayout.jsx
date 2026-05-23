import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/', label: 'Dashboard', icon: '▦', end: true },
  { to: '/detect', label: 'Live Detection', icon: '◉' },
]

function SidebarLink({ to, label, icon, end }) {
  return (
    <NavLink to={to} end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-r-xl text-sm font-medium transition-all duration-200 cursor-pointer border-l-2 ${
          isActive
            ? 'nav-active'
            : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-surface'
        }`
      }>
      <span className="text-lg">{icon}</span>
      <span className="font-body">{label}</span>
    </NavLink>
  )
}

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--void)' }}>
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 flex flex-col"
        style={{ background: 'var(--deep)', borderRight: '1px solid var(--border)' }}>
        {/* Brand */}
        <div className="px-5 py-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl"
              style={{ background: 'linear-gradient(135deg, #00e5ff22, #7c3aed22)', border: '1px solid #00e5ff33' }}>
              🤟
            </div>
            <div>
              <div className="font-display font-bold text-sm tracking-wide"
                style={{ background: 'linear-gradient(90deg,#00e5ff,#7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                SignaVerse AI
              </div>
              <div className="text-text-muted text-xs">v1.0 · Major Project</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-1">
          {navItems.map(i => <SidebarLink key={i.to} {...i} />)}
        </nav>

        {/* Status */}
        <div className="px-4 py-3 mx-3 mb-3 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-success pulse-ring" />
            <span className="text-xs text-success font-medium font-mono">SYSTEM ONLINE</span>
          </div>
          <div className="text-text-muted text-xs">MediaPipe · TensorFlow · CV2</div>
        </div>

        {/* User */}
        <div className="px-4 pb-5 border-t border-border pt-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: 'linear-gradient(135deg, #00e5ff, #7c3aed)', color: '#050810' }}>
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-text-primary truncate">{user?.name}</div>
              <div className="text-text-muted text-xs">Research User</div>
            </div>
            <button onClick={handleLogout} className="text-text-muted hover:text-red-400 transition-colors" title="Logout">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto grid-bg">
        <Outlet />
      </main>
    </div>
  )
}
