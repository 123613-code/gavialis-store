import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { supabase } from './supabase'

const inr = (n) => '₹' + Number(n).toLocaleString('en-IN')

export default function Checkout({ bag, onClose, onDone }) {
  const [user, setUser] = useState(undefined)
  const [f, setF] = useState({ full_name: '', phone: '', address_line1: '', address_line2: '', city: '', state: '', pincode: '' })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const [done, setDone] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null))
  }, [])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const subtotal = bag.reduce((s, i) => s + i.price * i.quantity, 0)
  const shipping = subtotal >= 3999 ? 0 : 99
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    setErr(null)
    const phone = f.phone.replace(/\D/g, '').slice(-10)
    if (phone.length !== 10) return setErr('Enter a valid 10-digit phone number.')
    if (!/^\d{6}$/.test(f.pincode)) return setErr('Enter a valid 6-digit pincode.')
    setBusy(true)
    const { data, error } = await supabase.rpc('place_order', {
      p_items: bag.map((i) => ({ product_id: i.productId, quantity: i.quantity, size: i.size })),
      p_address: { ...f, phone },
    })
    setBusy(false)
    if (error) {
      setErr(error.message)
      return
    }
    setDone(data)
    onDone()
  }

  return (
    <div className="acct-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="acct-panel" role="dialog" aria-modal="true" aria-label="Checkout">
        <button type="button" className="acct-close" onClick={onClose} aria-label="Close"><X size={20} /></button>

        {done ? (
          <>
            <h2 className="acct-title">Order placed</h2>
            <p className="acct-sub">ORDER #{done.order_number} / {inr(done.total)} / PAY ON DELIVERY</p>
            <button type="button" className="acct-submit" onClick={onClose}>CONTINUE SHOPPING</button>
          </>
        ) : user === undefined ? null : user === null ? (
          <>
            <h2 className="acct-title">Log in first</h2>
            <p className="acct-sub">Close this, tap LOG IN at the top right, then come back. Your bag is saved.</p>
            <button type="button" className="acct-submit" onClick={onClose}>OK</button>
          </>
        ) : (
          <>
            <h2 className="acct-title">Checkout</h2>
            <p className="acct-sub">CASH ON DELIVERY / SUBTOTAL {inr(subtotal)} / SHIPPING {shipping ? inr(shipping) : 'FREE'} / TOTAL {inr(subtotal + shipping)}</p>
            <form className="acct-form" onSubmit={submit}>
              <input placeholder="Full name" value={f.full_name} onChange={set('full_name')} required autoComplete="name" />
              <input placeholder="Phone (10 digits)" value={f.phone} onChange={set('phone')} required inputMode="tel" autoComplete="tel" />
              <input placeholder="Address line 1" value={f.address_line1} onChange={set('address_line1')} required autoComplete="address-line1" />
              <input placeholder="Address line 2 (optional)" value={f.address_line2} onChange={set('address_line2')} autoComplete="address-line2" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <input placeholder="City" value={f.city} onChange={set('city')} required autoComplete="address-level2" />
                <input placeholder="Pincode" value={f.pincode} onChange={set('pincode')} required inputMode="numeric" maxLength={6} autoComplete="postal-code" />
              </div>
              <input placeholder="State" value={f.state} onChange={set('state')} required autoComplete="address-level1" />
              <button type="submit" className="acct-submit" disabled={busy}>{busy ? 'PLACING ORDER…' : 'PLACE ORDER (COD)'}</button>
            </form>
            {err && <div className="acct-msg error" role="alert">{err}</div>}
          </>
        )}
      </div>
    </div>
  )
}