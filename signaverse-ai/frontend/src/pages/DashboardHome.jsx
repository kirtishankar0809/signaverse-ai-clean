import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { api } from '../hooks/useApi'
import { useAuth } from '../context/AuthContext'

const GESTURES = ['Hello', 'Thank You', 'Help', 'Yes', 'No']
const COLORS = ['#00e5ff', '#7c3aed', '#f59e0b', '#10b981', '#f43f5e']
const HINDI = { Hello: 'नमस्ते', 'Thank You': 'धन्यवाद', Help: 'मदद करो', Yes: 'हाँ', No: 'नहीं' }

function StatCard({ icon, label, value, sub, color, delay }) {
  return (
    <div className={`glass rounded-2xl p-5 stat-card fade-in-up-${delay}`}
      style={{ borderColor: color + '33' }}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
          style={{ background: color + '18', border: `1px solid ${color}33` }}>
          {icon}
        </div>
        <div className="text-right">
          <div className="font-display text-2xl font-bold" style={{ color }}>{value}</div>
          <div className="text-text-muted text-xs">{sub}</div>
        </div>
      </div>
      <div className="text-text-secondary text-sm font-medium">{label}</div>
    </div>
  )
}

const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    return (
      <div className="glass rounded-lg px-3 py-2 text-xs">
        <div className="text-accent font-mono">{payload[0].value}%</div>
        <div className="text-text-muted">t = {payload[0].payload.t}s</div>
      </div>
    )
  }
  return null
}

export default function DashboardHome() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const fetch_stats = () => api.stats().then(setStats).catch(() => {})
    fetch_stats()
    const id = setInterval(() => { fetch_stats(); setTick(t => t + 1) }, 2000)
    return () => clearInterval(id)
  }, [])

  const totalDet = stats?.total_detections ?? 0
  const avgAcc = stats?.average_accuracy ?? 0
  const duration = stats?.session_duration ?? 0
  const gestCounts = stats?.gesture_counts ?? {}
  const accHistory = stats?.accuracy_history ?? []

  const maxCount = Math.max(...GESTURES.map(g => gestCounts[g] ?? 0), 1)

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8 fade-in-up">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-text-primary">
              Welcome, <span style={{ color: '#00e5ff' }}>{user?.name}</span>
            </h1>
            <p className="text-text-secondary text-sm mt-1">SignaVerse AI · Real-time Sign Language Recognition Dashboard</p>
          </div>
          <button onClick={() => navigate('/detect')}
            className="px-5 py-2.5 rounded-xl font-display font-semibold text-sm transition-all duration-200"
            style={{ background: 'linear-gradient(135deg,#00e5ff,#0891b2)', color: '#050810', boxShadow: '0 0 20px rgba(0,229,255,0.3)' }}>
            ◉ Start Detection
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon="🔍" label="Total Detections" value={totalDet} sub="gestures found" color="#00e5ff" delay={1} />
        <StatCard icon="🎯" label="Avg Accuracy" value={`${avgAcc}%`} sub="confidence score" color="#7c3aed" delay={2} />
        <StatCard icon="⏱" label="Session Time" value={`${Math.floor(duration / 60)}m ${duration % 60}s`} sub="elapsed" color="#f59e0b" delay={3} />
        <StatCard icon="🤟" label="Gestures Tracked" value={GESTURES.length} sub="ASL signs" color="#10b981" delay={4} />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Accuracy Chart */}
        <div className="lg:col-span-2 glass rounded-2xl p-6 fade-in-up-1">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-display text-lg font-semibold text-text-primary">Accuracy Timeline</h2>
              <p className="text-text-muted text-xs mt-0.5">Detection confidence over session</p>
            </div>
            <div className="text-xs font-mono px-3 py-1 rounded-full"
              style={{ background: '#00e5ff15', border: '1px solid #00e5ff33', color: '#00e5ff' }}>
              LIVE
            </div>
          </div>

          {accHistory.length > 1 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={accHistory} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00e5ff" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" />
                <XAxis dataKey="t" stroke="#4a6080" tick={{ fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                <YAxis domain={[0, 100]} stroke="#4a6080" tick={{ fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="accuracy" stroke="#00e5ff" strokeWidth={2} fill="url(#accGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-56 flex items-center justify-center flex-col gap-3">
              <div className="text-4xl opacity-30">📊</div>
              <p className="text-text-muted text-sm">Start detection to see live accuracy graph</p>
              <button onClick={() => navigate('/detect')}
                className="text-xs px-4 py-2 rounded-lg transition-colors"
                style={{ background: '#00e5ff15', border: '1px solid #00e5ff33', color: '#00e5ff' }}>
                Open Camera
              </button>
            </div>
          )}
        </div>

        {/* Gesture Counts */}
        <div className="glass rounded-2xl p-6 fade-in-up-2">
          <h2 className="font-display text-lg font-semibold text-text-primary mb-1">Gesture Breakdown</h2>
          <p className="text-text-muted text-xs mb-5">Detections per gesture type</p>
          <div className="space-y-3">
            {GESTURES.map((g, i) => {
              const count = gestCounts[g] ?? 0
              const pct = maxCount > 0 ? (count / maxCount) * 100 : 0
              return (
                <div key={g}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="flex items-center gap-2">
                      <span style={{ color: COLORS[i] }}>●</span>
                      <span className="text-text-secondary font-body">{g}</span>
                      <span className="text-text-muted font-mono">{HINDI[g]}</span>
                    </span>
                    <span className="font-mono text-text-muted">{count}</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: '#1e2d4a' }}>
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: COLORS[i], boxShadow: `0 0 6px ${COLORS[i]}66` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Gesture Reference Card */}
      <div className="mt-6 glass rounded-2xl p-6 fade-in-up-3">
        <h2 className="font-display text-lg font-semibold text-text-primary mb-5">Gesture Reference · Supported Signs</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {GESTURES.map((g, i) => (
            <div key={g} className="rounded-xl p-4 text-center transition-all duration-200 hover:scale-105"
              style={{ background: COLORS[i] + '10', border: `1px solid ${COLORS[i]}30` }}>
              <div className="text-3xl mb-2">
                {['👋', '🙏', '🆘', '👍', '👎'][i]}
              </div>
              <div className="font-display font-semibold text-sm" style={{ color: COLORS[i] }}>{g}</div>
              <div className="text-text-muted text-xs mt-1">{HINDI[g]}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
