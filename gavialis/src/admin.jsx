import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { supabase } from './supabase';
import AdminOrders from './AdminOrders';
import './admin.css';

function Login({ onDone, notice }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(notice || '');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError('Login failed: ' + error.message);
    else onDone();
    setBusy(false);
  }

  return (
    <main className="admin">
      <header>
        <p className="eyebrow">GAVIALIS / OPERATIONS</p>
        <h1>CONTROL ROOM<span>.</span></h1>
        <p>Admin login</p>
      </header>
      <section className="panel">
        <div className="fields">
          <label>EMAIL<input type="email" value={email} onChange={e => setEmail(e.target.value)} /></label>
          <label>PASSWORD<input type="password" value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()} /></label>
        </div>
        <button className="save" onClick={submit} disabled={busy}>{busy ? 'WAIT...' : 'LOGIN'}</button>
        {error && <p className="message">{error}</p>}
      </section>
    </main>
  );
}

function Products({ onLogout }) {
  const [products, setProducts] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from('products').select('*').order('created_at');
    if (error) setMessage('Load error: ' + error.message);
    else setProducts(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function updateProduct(index, field, value) {
    setProducts(old => old.map((p, i) => i === index ? { ...p, [field]: value } : p));
  }

  async function saveOne(p) {
    setMessage('Saving...');
    const row = {
      name: p.name,
      price: Number(p.price),
      image_url: p.image_url || null,
      description: p.description || null,
      category: p.category || 'general',
            gender: p.gender || 'unisex',
    };
    const result = p.id
      ? await supabase.from('products').update(row).eq('id', p.id)
      : await supabase.from('products').insert(row);
    if (result.error) setMessage('Save failed: ' + result.error.message);
    else { setMessage('Saved to database.'); load(); }
  }

  async function uploadImage(index, file) {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setMessage('Only JPG, PNG or WEBP images are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage('Image is bigger than 5 MB.');
      return;
    }
    setMessage('Uploading image...');
    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
    const path = crypto.randomUUID() + '.' + ext;
    const { error } = await supabase.storage
      .from('product-images')
      .upload(path, file, { contentType: file.type, cacheControl: '31536000' });
    if (error) { setMessage('Upload failed: ' + error.message); return; }
    const { data } = supabase.storage.from('product-images').getPublicUrl(path);
    updateProduct(index, 'image_url', data.publicUrl);
    setMessage('Image uploaded. Ab "SAVE THIS PRODUCT" dabao.');
  }

  async function removeOne(index) {
    const p = products[index];
    if (!p.id) { setProducts(old => old.filter((_, j) => j !== index)); return; }
    if (!window.confirm('Delete "' + p.name + '" permanently?')) return;
    const { error } = await supabase.from('products').delete().eq('id', p.id);
    if (error) setMessage('Delete failed: ' + error.message);
    else { setMessage('Deleted.'); load(); }
  }

  return (
    <main className="admin">
      <header>
        <p className="eyebrow">GAVIALIS / OPERATIONS</p>
        <h1>CONTROL ROOM<span>.</span></h1>
        <p>THE LAST RIVER DRAGON — Store management</p>
        <button onClick={onLogout}>LOGOUT</button>
      </header>

      <section className="stats">
        <article><small>PRODUCTS</small><strong>{products.length}</strong></article>
        <article><small>ORDERS</small><strong>—</strong></article>
        <article><small>PAYMENTS</small><strong>NOT CONNECTED</strong></article>
      </section>

      <section className="panel">
        <div className="section-title">
          <div><small>INVENTORY / 01</small><h2>Manage products</h2></div>
          <button onClick={() => setProducts(old => [...old, { name: '', price: '', image_url: '', description: '', category: '', gender: 'unisex',}])}>+ ADD PRODUCT</button>
        </div>

        {loading && <p>Loading...</p>}

        {products.map((p, i) => (
          <article className="product" key={p.id || 'new-' + i}>
            <div className="product-number">0{i + 1}</div>
            <div className="fields">
              <label>PRODUCT NAME<input value={p.name || ''} onChange={e => updateProduct(i, 'name', e.target.value)} /></label>
              <label>PRICE<input type="number" min="0" value={p.price ?? ''} onChange={e => updateProduct(i, 'price', e.target.value)} /></label>
              <label>CATEGORY<input value={p.category || ''} onChange={e => updateProduct(i, 'category', e.target.value)} /></label>
                            <label>GENDER<select value={p.gender || 'unisex'} onChange={e => updateProduct(i, 'gender', e.target.value)}><option value="men">Men</option><option value="women">Women</option><option value="unisex">Unisex (dono)</option></select></label>
              <label>DESCRIPTION<input value={p.description || ''} onChange={e => updateProduct(i, 'description', e.target.value)} /></label>
              <label>PRODUCT IMAGE (JPG / PNG / WEBP, max 5 MB)<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => uploadImage(i, e.target.files[0])} /></label>
              {p.image_url && <img className="preview" src={p.image_url} alt={p.name} />}
              <button className="save" onClick={() => saveOne(p)}>SAVE THIS PRODUCT</button>
            </div>
            <button className="remove" onClick={() => removeOne(i)}>REMOVE</button>
          </article>
        ))}

        {message && <p className="message">{message}</p>}
      </section>
      <footer>GAVIALIS © — BUILT AROUND THE RIVER.</footer>
    </main>
  );
}

function Admin() {
  const [state, setState] = useState('checking'); // checking | login | ok
  const [notice, setNotice] = useState('');
  const [tab, setTab] = useState('products');

  async function check() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setState('login'); return; }
    const { data: isAdmin, error } = await supabase.rpc('is_admin');
    if (error || !isAdmin) {
      await supabase.auth.signOut();
      setNotice('This account is not an admin.');
      setState('login');
    } else {
      setState('ok');
    }
  }

  useEffect(() => { check(); }, []);

  async function logout() {
    await supabase.auth.signOut();
    setNotice('');
    setState('login');
  }

  if (state === 'checking') return <main className="admin"><p>Checking...</p></main>;
  if (state === 'login') return <Login onDone={check} notice={notice} />;
  return (
  <>
    <div style={{ padding: '12px 24px', display: 'flex', gap: 12 }}>
      <button type="button" disabled={tab === 'products'} onClick={() => setTab('products')}>PRODUCTS</button>
      <button type="button" disabled={tab === 'orders'} onClick={() => setTab('orders')}>ORDERS</button>
    </div>
    {tab === 'products' ? <Products onLogout={logout} /> : <AdminOrders onLogout={logout} />}
  </>
);
}

createRoot(document.getElementById('root')).render(<Admin />);
