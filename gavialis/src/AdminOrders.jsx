import { useEffect, useState } from 'react'
import { supabase } from './supabase'

const STATUSES = ['pending', 'shipped', 'delivered']

const flat = (obj) =>
  obj
    ? Object.entries(obj)
        .filter(([k, v]) => v && !/(^id$|_id$|_at$)/.test(k))
        .map(([k, v]) => `${k}: ${v}`)
        .join(' | ')
    : ''

export default function AdminOrders({ onLogout }) {
  const [orders, setOrders] = useState(null)
  const [err, setErr] = useState(null)

  async function load() {
    const { data, error } = await supabase.rpc('admin_list_orders')
    if (error) setErr(error.message)
    else { setErr(null); setOrders(data) }
  }
  useEffect(() => { load() }, [])

  async function setStatus(id, status) {
    const { error } = await supabase.rpc('admin_set_order_status', { p_order_id: id, p_status: status })
    if (error) setErr(error.message)
    else load()
  }

  return (
    <main className="admin">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Orders</h1>
        <button type="button" onClick={onLogout}>LOG OUT</button>
      </div>
      {err && <p role="alert" style={{ color: 'crimson' }}>{err}</p>}
      {!err && orders === null && <p>Loading...</p>}
      {orders && orders.length === 0 && <p>No orders yet.</p>}
      {orders && orders.map((o) => (
        <div key={o.id} style={{ border: '1px solid #888', padding: 12, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <strong>Order #{o.order_number}</strong>
            <span>{new Date(o.created_at).toLocaleString('en-IN')}</span>
            <span>₹{Number(o.total).toLocaleString('en-IN')}</span>
            <span>Payment: {o.payment ? `${o.payment.provider} / ${o.payment.status}` : o.payment_status}</span>
            <select value={o.status} onChange={(e) => setStatus(o.id, e.target.value)}>
              {[...new Set([o.status, ...STATUSES])].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <details style={{ marginTop: 8 }}>
            <summary>Details</summary>
            <p>Customer: {flat(o.customer)}</p>
            <p>Address: {flat(o.address)}</p>
            {(o.items || []).map((it, i) => <p key={i}>Item: {flat(it)}</p>)}
          </details>
        </div>
      ))}
    </main>
  )
}