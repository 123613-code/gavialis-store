import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { supabase } from './supabase'

const inr = (n) => '₹' + Number(n).toLocaleString('en-IN')

function loadRazorpay() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve()
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload = resolve
    s.onerror = () => reject(new Error('Could not load Razorpay checkout script'))
    document.body.appendChild(s)
  })
}

// Show the real error body from an Edge Function instead of the generic message
async function fnError(error) {
  try {
    const body = await error.context.json()
    return body.error || JSON.stringify(body)
  } catch {
    return error.message
  }
}

export default function Checkout({ bag, onClose, onDone }) {
  const [user, setUser] = useState(undefined)
  const [f, setF] = useState({ full_name: '', phone: '', address_line1: '', address_line2: '', city: '', state: '', pincode: '' })
  const [method, setMethod] = useState('online')
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
  const shipping = subtotal >= 1499 ? 0 : 99
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  async function payOnline(items, address) {
    const { data, error } = await supabase.functions.invoke('razorpay-create', { body: { items, address } })
    if (error) throw new Error(await fnError(error))
    if (data?.error) throw new Error(data.error)

    await loadRazorpay()
    const rzp = new window.Razorpay({
      key: data.key_id,
      amount: data.amount,
      currency: 'INR',
      order_id: data.razorpay_order_id,
      name: 'GAVIALIS',
      description: 'Order #' + data.order_number,
      prefill: { name: address.full_name, contact: address.phone, email: user?.email },
      handler: async (resp) => {
        const { data: v, error: vErr } = await supabase.functions.invoke('razorpay-verify', {
          body: {
            razorpay_order_id: resp.razorpay_order_id,
            razorpay_payment_id: resp.razorpay_payment_id,
            razorpay_signature: resp.razorpay_signature,
          },
        })
        if (vErr || v?.error) {
          const msg = vErr ? await fnError(vErr) : v.error
          setErr('Payment received but verification failed: ' + msg + ' (payment id ' + resp.razorpay_payment_id + ')')
          setBusy(false)
          return
        }
        setDone({ order_number: data.order_number, total: data.amount / 100, method: 'online' })
        setBusy(false)
        onDone()
      },
      modal: {
        ondismiss: () => {
          setBusy(false)
          setErr('Payment not completed. Order #' + data.order_number + ' is saved as pending.')
        },
      },
    })
    rzp.on('payment.failed', (r) => {
      setBusy(false)
      setErr('Payment failed: ' + (r.error?.description || 'unknown error'))
    })
    rzp.open()
  }

  async function submit(e) {
    e.preventDefault()
    setErr(null)
    const phone = f.phone.replace(/\D/g, '').slice(-10)
    if (phone.length !== 10) return setErr('Enter a valid 10-digit phone number.')
    if (!/^\d{6}$/.test(f.pincode)) return setErr('Enter a valid 6-digit pincode.')
    const items = bag.map((i) => ({ product_id: i.productId, quantity: i.quantity, size: i.size }))
    const address = { ...f, phone }
    setBusy(true)

    if (method === 'online') {
      try {
        await payOnline(items, address)
      } catch (ex) {
        setBusy(false)
        setErr(ex.message)
      }
      return
    }

    const { data, error } = await supabase.rpc('place_order', { p_items: items, p_address: address })
    setBusy(false)
    if (error) {
      setErr(error.message)
      return
    }
    setDone({ ...data, method: 'cod' })
    onDone()
  }

  return (
    <div className="acct-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="acct-panel" style={{ maxHeight: "90vh", overflowY: "auto" }} role="dialog" aria-modal="true" aria-label="Checkout">
        <button type="button" className="acct-close" onClick={onClose} aria-label="Close"><X size={20} /></button>

        {done ? (
          <>
            <h2 className="acct-title">Order placed</h2>
            <p className="acct-sub">
              ORDER #{done.order_number} / {inr(done.total)} / {done.method === 'online' ? 'PAID ONLINE' : 'PAY ON DELIVERY'}
            </p>
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
            <p className="acct-sub">
              {method === 'online' ? 'PAY ONLINE' : 'CASH ON DELIVERY'} / SUBTOTAL {inr(subtotal)} / SHIPPING {shipping ? inr(shipping) : 'FREE'} / TOTAL {inr(subtotal + shipping)}
            </p>
            <div className="acct-tabs">
              <button type="button" className={method === 'online' ? 'acct-tab active' : 'acct-tab'} onClick={() => setMethod('online')}>PAY ONLINE</button>
            </div>
            <form className="acct-form" onSubmit={submit}>
              <input placeholder="Full name" value={f.full_name} onChange={set('full_name')} required />
              <input placeholder="Phone (10 digits)" value={f.phone} onChange={set('phone')} required />
              <input placeholder="Address line 1" value={f.address_line1} onChange={set('address_line1')} required />
              <input placeholder="Address line 2 (optional)" value={f.address_line2} onChange={set('address_line2')} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <input placeholder="City" value={f.city} onChange={set('city')} required />
                <input placeholder="Pincode" value={f.pincode} onChange={set('pincode')} required />
              </div>
              <input placeholder="State" value={f.state} onChange={set('state')} required />
              <button type="submit" className="acct-submit" disabled={busy}>
                {busy ? 'PLEASE WAIT...' : method === 'online' ? 'PAY ' + inr(subtotal + shipping) : 'PLACE ORDER (COD)'}
              </button>
            </form>
            {err && <div className="acct-msg error" role="alert">{err}</div>}
          </>
        )}
      </div>
    </div>
  )
}