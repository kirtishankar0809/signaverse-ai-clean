import { useEffect, useRef, useState, useCallback } from 'react'
import { WS_URL, api } from '../hooks/useApi'

const GESTURE_EMOJIS = { Hello: '👋', 'Thank You': '🙏', Help: '🆘', Yes: '👍', No: '👎' }
const GESTURE_COLORS = { Hello: '#00e5ff', 'Thank You': '#7c3aed', Help: '#f59e0b', Yes: '#10b981', No: '#f43f5e' }

export default function DetectionPage() {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const wsRef = useRef(null)
  const streamRef = useRef(null)
  const sendRef = useRef(null)

  const [isActive, setIsActive] = useState(false)
  const [gesture, setGesture] = useState(null)
  const [confidence, setConfidence] = useState(0)
  const [hindi, setHindi] = useState(null)
  const [annotatedFrame, setAnnotatedFrame] = useState(null)
  const [log, setLog] = useState([])
  const [fps, setFps] = useState(0)
  const [wsConnected, setWsConnected] = useState(false)
  const [error, setError] = useState(null)
  const [speaking, setSpeaking] = useState(false)

  const fpsCounter = useRef({ frames: 0, last: Date.now() })

  // Capture frame from video → send to WS
  const captureAndSend = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    const ws = wsRef.current
    if (!video || !canvas || !ws || ws.readyState !== WebSocket.OPEN) return

    const ctx = canvas.getContext('2d')
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
    ctx.drawImage(video, 0, 0)

    canvas.toBlob(blob => {
      if (!blob || ws.readyState !== WebSocket.OPEN) return
      blob.arrayBuffer().then(buf => {
        ws.send(buf)
        // FPS counter
        fpsCounter.current.frames++
        const now = Date.now()
        if (now - fpsCounter.current.last >= 1000) {
          setFps(fpsCounter.current.frames)
          fpsCounter.current.frames = 0
          fpsCounter.current.last = now
        }
      })
    }, 'image/jpeg', 0.75)
  }, [])

  const startDetection = async () => {
    setError(null)
    try {
     if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
  alert("Camera API not supported");
  return;
}

const stream = await navigator.mediaDevices.getUserMedia({
  video: true,
});
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      const ws = new WebSocket(WS_URL)
      ws.binaryType = 'arraybuffer'

      ws.onopen = () => {
        setWsConnected(true)
        // Send 10 fps
        sendRef.current = setInterval(captureAndSend, 100)
      }

      ws.onmessage = (evt) => {
        const data = JSON.parse(evt.data)
        if (data.frame) setAnnotatedFrame('data:image/jpeg;base64,' + data.frame)
        if (data.gesture) {
          setGesture(data.gesture)
          setConfidence(data.confidence)
          setHindi(data.hindi)
          setLog(prev => [
            { gesture: data.gesture, hindi: data.hindi, conf: data.confidence, time: new Date().toLocaleTimeString() },
            ...prev.slice(0, 9)
          ])
        }
      }

      ws.onerror = () => setError('WebSocket error. Is the backend running on port 8000?')
      ws.onclose = () => { setWsConnected(false) }
      wsRef.current = ws
      setIsActive(true)
    } catch (err) {
      setError('Camera access denied or backend offline: ' + err.message)
    }
  }

  const stopDetection = () => {
    clearInterval(sendRef.current)
    if (wsRef.current) wsRef.current.close()
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    if (videoRef.current) videoRef.current.srcObject = null
    setIsActive(false)
    setAnnotatedFrame(null)
    setGesture(null)
    setWsConnected(false)
    setFps(0)
  }

  const handleSpeak = async () => {
    if (!gesture || speaking) return
    setSpeaking(true)
    await api.speak(gesture).catch(() => {})
    setTimeout(() => setSpeaking(false), 2000)
  }

  useEffect(() => () => stopDetection(), [])

  const color = gesture ? (GESTURE_COLORS[gesture] || '#00e5ff') : '#00e5ff'

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6 fade-in-up flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary">Live Detection</h1>
          <p className="text-text-muted text-sm mt-0.5">Real-time hand gesture recognition via webcam</p>
        </div>
        <div className="flex items-center gap-3">
          {wsConnected && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono"
              style={{ background: '#10b98115', border: '1px solid #10b98140', color: '#10b981' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              {fps} FPS · LIVE
            </div>
          )}
          <button
            onClick={isActive ? stopDetection : startDetection}
            className="px-5 py-2.5 rounded-xl font-display font-semibold text-sm transition-all duration-200"
            style={isActive
              ? { background: '#f43f5e18', border: '1px solid #f43f5e44', color: '#f43f5e' }
              : { background: 'linear-gradient(135deg,#00e5ff,#0891b2)', color: '#050810', boxShadow: '0 0 20px rgba(0,229,255,0.3)' }}>
            {isActive ? '⏹ Stop Camera' : '◉ Start Camera'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl px-4 py-3 text-sm fade-in-up"
          style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', color: '#fb7185' }}>
          ⚠ {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Webcam Panel */}
        <div className="lg:col-span-2">
          <div className="glass rounded-2xl overflow-hidden relative" style={{ aspectRatio: '4/3' }}>
            {/* Corner decorations */}
            <div className="corner-tl" /><div className="corner-tr" />
            <div className="corner-bl" /><div className="corner-br" />

            {/* Hidden real video element */}
            <video ref={videoRef} className="hidden" playsInline muted />
            {/* Hidden canvas for capture */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Show annotated frame from backend */}
            {annotatedFrame ? (
              <img src={annotatedFrame} alt="Detection" className="w-full h-full object-cover"
                style={{ filter: 'contrast(1.05) saturate(1.1)' }} />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <div className="w-24 h-24 rounded-full flex items-center justify-center text-5xl"
                  style={{ background: '#00e5ff08', border: '2px dashed #00e5ff33' }}>
                  📷
                </div>
                <p className="text-text-muted text-sm">
                  {isActive ? 'Connecting to backend…' : 'Click "Start Camera" to begin'}
                </p>
                {isActive && (
                  <div className="flex gap-1">
                    {[0,1,2].map(i => (
                      <div key={i} className="w-2 h-2 rounded-full bg-accent animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Scan line when active */}
            {isActive && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="scan-line absolute left-0 right-0 h-0.5"
                  style={{ background: 'linear-gradient(90deg, transparent, #00e5ff44, transparent)' }} />
              </div>
            )}
          </div>

          {/* Gesture Display */}
          {gesture && (
            <div className="mt-4 glass rounded-2xl p-5 fade-in-up"
              style={{ borderColor: color + '44', boxShadow: `0 0 30px ${color}15` }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-5xl">{GESTURE_EMOJIS[gesture] || '🤟'}</div>
                  <div>
                    <div className="font-display text-2xl font-bold" style={{ color }}>{gesture}</div>
                    <div className="text-text-secondary text-sm mt-0.5 font-body">{hindi}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-3xl font-bold" style={{ color }}>{confidence}%</div>
                  <div className="text-text-muted text-xs mt-0.5">Confidence</div>
                  {/* Confidence bar */}
                  <div className="mt-2 w-24 h-1.5 rounded-full ml-auto" style={{ background: '#1e2d4a' }}>
                    <div className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${confidence}%`, background: color, boxShadow: `0 0 8px ${color}88` }} />
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-4 flex gap-3">
                <button onClick={handleSpeak} disabled={speaking}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
                  style={{ background: speaking ? '#1e2d4a' : color + '18', border: `1px solid ${color}44`, color: speaking ? '#4a6080' : color }}>
                  {speaking ? '🔊 Speaking…' : '🔊 Speak'}
                </button>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
                  style={{ background: '#7c3aed18', border: '1px solid #7c3aed44' }}>
                  <span className="text-text-secondary">Hindi:</span>
                  <span className="font-bold" style={{ color: '#a78bfa' }}>{hindi}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div className="space-y-5">
          {/* Instructions */}
          <div className="glass rounded-2xl p-5">
            <h3 className="font-display font-semibold text-sm text-text-primary mb-4">How to Use</h3>
            <ol className="space-y-3">
              {[
                'Click "Start Camera" to open webcam',
                'Position your hand clearly in the frame',
                'Hold a gesture for 1-2 seconds',
                'View detected gesture + Hindi translation',
                'Press "Speak" to hear audio output',
              ].map((step, i) => (
                <li key={i} className="flex gap-3 text-xs text-text-secondary">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                    style={{ background: '#00e5ff15', border: '1px solid #00e5ff33', color: '#00e5ff' }}>
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {/* Supported gestures */}
          <div className="glass rounded-2xl p-5">
            <h3 className="font-display font-semibold text-sm text-text-primary mb-4">Supported Gestures</h3>
            <div className="space-y-2">
              {Object.entries(GESTURE_EMOJIS).map(([g, emoji]) => (
                <div key={g} className="flex items-center gap-3 px-3 py-2 rounded-lg"
                  style={{ background: (GESTURE_COLORS[g] || '#00e5ff') + '0a', border: `1px solid ${(GESTURE_COLORS[g] || '#00e5ff')}20` }}>
                  <span className="text-lg">{emoji}</span>
                  <span className="text-sm font-medium text-text-primary">{g}</span>
                  <span className="ml-auto text-xs text-text-muted">
                    {{ Hello: 'नमस्ते', 'Thank You': 'धन्यवाद', Help: 'मदद करो', Yes: 'हाँ', No: 'नहीं' }[g]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Detection Log */}
          <div className="glass rounded-2xl p-5">
            <h3 className="font-display font-semibold text-sm text-text-primary mb-4">Detection Log</h3>
            {log.length === 0 ? (
              <p className="text-text-muted text-xs text-center py-4">No detections yet…</p>
            ) : (
              <div className="space-y-2">
                {log.map((entry, i) => (
                  <div key={i} className="flex items-center justify-between text-xs rounded-lg px-3 py-2"
                    style={{ background: i === 0 ? '#00e5ff08' : 'transparent', opacity: 1 - i * 0.08 }}>
                    <span className="font-medium text-text-primary">{GESTURE_EMOJIS[entry.gesture]} {entry.gesture}</span>
                    <span className="text-text-muted font-mono">{entry.conf}%</span>
                    <span className="text-text-muted">{entry.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
