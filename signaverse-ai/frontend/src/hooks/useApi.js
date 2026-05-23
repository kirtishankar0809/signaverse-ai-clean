const BASE = 'http://localhost:8000'

export const api = {
  login: (username, password) =>
    fetch(`${BASE}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    }).then(r => r.json()),

  stats: () => fetch(`${BASE}/api/stats`).then(r => r.json()),

  speak: (gesture) =>
    fetch(`${BASE}/api/speak`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gesture }),
    }).then(r => r.json()),

  gestures: () => fetch(`${BASE}/api/gestures`).then(r => r.json()),
}

export const WS_URL = 'ws://localhost:8000/ws/detect'
