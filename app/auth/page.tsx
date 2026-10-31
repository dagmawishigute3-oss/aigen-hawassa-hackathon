'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        if (data.session) {
          window.location.href = '/submit'
        } else {
          setMessage('Account registered! If confirmation is enabled, check your email, or toggle to Login.')
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        window.location.href = '/submit'
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace' }}>
      <div style={{ border: '1px solid #333', padding: '40px', width: '400px', backgroundColor: '#111' }}>
        <h1 style={{ fontSize: '18px', marginBottom: '24px', letterSpacing: '1px' }}>
          {isSignUp ? '[REGISTRATION]' : '[CONTESTANT LOGIN]'}
        </h1>

        {error && (
          <div style={{ backgroundColor: 'rgba(255, 0, 0, 0.2)', border: '1px solid red', padding: '10px', marginBottom: '15px', fontSize: '12px', color: '#ff6b6b' }}>
            [ERROR]: {error}
          </div>
        )}

        {message && (
          <div style={{ backgroundColor: 'rgba(0, 255, 0, 0.2)', border: '1px solid green', padding: '10px', marginBottom: '15px', fontSize: '12px', color: '#6bff6b' }}>
            [SUCCESS]: {message}
          </div>
        )}

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '10px', letterSpacing: '1px', marginBottom: '5px', color: '#888' }}>
              EMAIL ADDRESS
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', backgroundColor: '#222', border: '1px solid #444', color: '#fff', fontSize: '14px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '10px', letterSpacing: '1px', marginBottom: '5px', color: '#888' }}>
              PASSWORD
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', backgroundColor: '#222', border: '1px solid #444', color: '#fff', fontSize: '14px' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ marginTop: '10px', padding: '12px', backgroundColor: '#00e676', color: '#000', border: 'none', fontWeight: 'bold', cursor: 'pointer', letterSpacing: '1px' }}
          >
            {loading ? 'PROCESSING...' : isSignUp ? 'CREATE ACCOUNT' : 'AUTHENTICATE'}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '12px' }}>
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'monospace' }}
          >
            {isSignUp ? 'Already registered? Log in →' : "Need an account? Sign up →"}
          </button>
        </div>
      </div>
    </div>
  )
}
