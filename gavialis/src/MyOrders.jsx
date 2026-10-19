import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export default function MyOrders({ userId }) {
  const [orders, setOrders] = useState(null)
  const [err, setErr] = useState(null)

  useEffect(() => {
    let alive = true
    supabase
      .from('orders')
      .select('order_number, status, payment_status, total, created_at')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!alive) return
        if (error) setErr(error.message)
        else setOrders(data)
      })
    return () => { alive = false }
  }, [userId])

  return (
    <div style={{ marginTop: 20, maxHeight: 260, overflowY: 'auto' }}>
      <p className="acct-sub" style={{ marginBottom: 8 }}>MY ORDERS</p>
      {err && <div className="acct-msg error" role="alert">{err}</div>}
      {!err && orders === null && <p className="acct-sub">Loading...</p>}
      {!err && orders && orders.length === 0 && <p className="acct-sub">No orders yet.</p>}
      {orders && orders.map((o) => (
        <div key={o.order_number} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(0,0,0,0.15)', fontSize: 13 }}>
          <div>
            <strong>Order #{o.order_number}</strong>
            <div>{new Date(o.created_at).toLocaleDateString('en-IN')}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div>₹{Number(o.total).toLocaleString('en-IN')}</div>
            <div style={{ textTransform: 'uppercase' }}>{o.status}</div>
          </div>
        </div>
      ))}
    </div>
  )
}