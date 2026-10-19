import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { User, X } from 'lucide-react'
import { supabase } from './supabase'
import MyOrders from './MyOrders'
function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" />
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
    </svg>
  )
}

export default function Account() {
  const [user, setUser] = useState(null)
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null))
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (event === 'PASSWORD_RECOVERY') { setMode('newpass'); setMsg(null); setOpen(true) }
    })
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  function openModal() {
    setMsg(null)
    if (!user) setMode('login')
    setOpen(true)
  }

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    try {
      if (mode === 'signup') {
        if (password.length < 6) throw new Error('Password must be at least 6 characters.')
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        })
        if (error) throw error
        if (data.session) setOpen(false)
        else setMsg({ type: 'ok', text: 'Check your email to confirm your account, then log in.' })
      } else if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        setPassword('')
        setOpen(false)
      } else if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin })
        if (error) throw error
        setMsg({ type: 'ok', text: 'Password reset link sent. Check your email.' })
      } else if (mode === 'newpass') {
        if (password.length < 6) throw new Error('Password must be at least 6 characters.')
        const { error } = await supabase.auth.updateUser({ password })
        if (error) throw error
        setPassword('')
        setMode('login')
        setMsg({ type: 'ok', text: 'Password updated. You are logged in.' })
      }
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Something went wrong. Try again.' })
    } finally {
      setBusy(false)
    }
  }

  async function google() {
    setMsg(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) setMsg({ type: 'error', text: error.message })
  }

  async function logout() {
    await supabase.auth.signOut()
    setOpen(false)
  }

  const loggedIn = user && mode !== 'newpass'

  return (
    <>
      <button type="button" className="acct-btn" onClick={openModal} aria-label={user ? 'Account' : 'Log in or sign up'}>
        <User size={16} />
        <span>{user ? 'ACCOUNT' : 'LOG IN'}</span>
      </button>

            {open && createPortal(
        <div className="acct-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}>
          <div className="acct-panel" style={{ maxHeight: "90vh", overflowY: "auto" }} role="dialog" aria-modal="true" aria-label="Account">
            <button type="button" className="acct-close" onClick={() => setOpen(false)} aria-label="Close">
              <X size={20} />
            </button>

            {loggedIn ? (
              <>
                <h2 className="acct-title">Your account</h2>
                <p className="acct-sub">{user.email}</p>
                <MyOrders userId={user.id} />
                <button type="button" className="acct-submit" onClick={logout}>LOG OUT</button>
              </>
            ) : (
              <>
                <h2 className="acct-title">
                  {mode === 'signup' ? 'Join the river' : mode === 'reset' ? 'Reset password' : mode === 'newpass' ? 'New password' : 'Welcome back'}
                </h2>
                <p className="acct-sub">
                  {mode === 'signup' ? 'Create your GAVIALIS account.' : mode === 'reset' ? 'We will email you a reset link.' : mode === 'newpass' ? 'Choose a new password.' : 'Log in to your account.'}
                </p>

                {(mode === 'login' || mode === 'signup') && (
                  <>
                    <div className="acct-tabs">
                      <button type="button" className={mode === 'login' ? 'acct-tab active' : 'acct-tab'} onClick={() => { setMode('login'); setMsg(null) }}>LOG IN</button>
                      <button type="button" className={mode === 'signup' ? 'acct-tab active' : 'acct-tab'} onClick={() => { setMode('signup'); setMsg(null) }}>SIGN UP</button>
                    </div>
                    <button type="button" className="acct-google" onClick={google}>
                      <GoogleLogo /> CONTINUE WITH GOOGLE
                    </button>
                    <div className="acct-or">OR USE EMAIL</div>
                  </>
                )}

                <form className="acct-form" onSubmit={submit}>
                  {mode !== 'newpass' && (
                    <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
                  )}
                  {mode !== 'reset' && (
                    <input type="password" placeholder={mode === 'newpass' ? 'New password' : 'Password'} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
                  )}
                  <button type="submit" className="acct-submit" disabled={busy}>
                    {busy ? 'PLEASE WAIT…' : mode === 'signup' ? 'CREATE ACCOUNT' : mode === 'reset' ? 'SEND RESET LINK' : mode === 'newpass' ? 'UPDATE PASSWORD' : 'LOG IN'}
                  </button>
                </form>

                {mode === 'login' && (
                  <button type="button" className="acct-link" onClick={() => { setMode('reset'); setMsg(null) }}>Forgot password?</button>
                )}
                {mode === 'reset' && (
                  <button type="button" className="acct-link" onClick={() => { setMode('login'); setMsg(null) }}>Back to log in</button>
                )}
              </>
            )}

            {msg && <div className={'acct-msg ' + msg.type} role="status">{msg.text}</div>}
          </div>
        </div>
            , document.body)}
    
    </>
  )
}
