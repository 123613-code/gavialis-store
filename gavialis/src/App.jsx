import { useEffect, useMemo, useState } from 'react'
import { supabase } from './supabase'
import Account from './Account.jsx'
import Checkout from './Checkout.jsx'
import {
  ArrowDownRight, ArrowLeft, ArrowRight, Check, Menu, Minus, Plus,
  ShoppingBag, X, Waves, Leaf, Shield, Truck, Heart, Search, MessageCircle
} from 'lucide-react'
import './App.css'
import Faq from './Faq'
const fallbackProducts = [
  { id: 1, name: 'Last River Heavyweight Hoodie', category: 'HOODIES', price: 3499, tag: 'FIELD SERIES 001', color: 'Obsidian', image: '/hoodie.png', number: '01' },
  { id: 2, name: 'Chambal Utility Shorts', category: 'BOTTOMS', price: 1999, tag: 'RIVER SERIES', color: 'Stone', image: '/shorts.png', number: '02' },
  { id: 3, name: 'Ghost — River Dragon Edition', category: 'GRAPHICS', price: 2499, tag: 'LIMITED RUN', color: 'Washed Black', image: '/ghost.png', number: '03' },
]

const categories = ['ALL PIECES', 'HOODIES', 'BOTTOMS', 'GRAPHICS']
// TODO: replace with YOUR real garment measurements (flat, in inches) before launch
const sizeChart = [['S', '22', '27'], ['M', '23', '28'], ['L', '24', '29'], ['XL', '25', '30']]
// TODO: put your WhatsApp number with country code, digits only, e.g. '919876543210'. Empty = button hidden.
const WHATSAPP = '919336851607'
const money = (n) => `₹${n.toLocaleString('en-IN')}`

export default function App() {
  const [category, setCategory] = useState('ALL PIECES')
  const [bag, setBag] = useState(() => { try { return JSON.parse(localStorage.getItem('gav-bag') || '[]') } catch { return [] } })
  const [products, setProducts] = useState(fallbackProducts)

  useEffect(() => {
    supabase.from('products').select('*').eq('is_active', true).order('sort_order').then(({ data, error }) => {
      if (error || !data || data.length === 0) return
      setProducts(data.map((p, i) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        price: Number(p.price),
        tag: p.description || '',
        color: p.colour || '',
        image: p.image_url,
        slug: p.slug,
        stock: p.stock,
        number: String(i + 1).padStart(2, '0'),
      })))
    })
  }, [])
  const [sizes, setSizes] = useState({})
  const [wish, setWish] = useState(() => { try { return JSON.parse(localStorage.getItem('gav-wish') || '[]') } catch { return [] } })
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('FEATURED')
  const [quick, setQuick] = useState(null)
  const [zoom, setZoom] = useState(false)
  const [zoomPos, setZoomPos] = useState('50% 50%')
  const [sizeGuide, setSizeGuide] = useState(false)

  useEffect(() => { try { localStorage.setItem('gav-wish', JSON.stringify(wish)) } catch {} }, [wish])
  useEffect(() => { try { localStorage.setItem('gav-bag', JSON.stringify(bag)) } catch {} }, [bag])
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { setSizeGuide(false); setQuick(null); setZoom(false); setBagOpen(false) } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  const [heroVideo, setHeroVideo] = useState(false)
  const [heroVideoOn, setHeroVideoOn] = useState(false)

  useEffect(() => {
    const c = navigator.connection
    const slow = c && (c.saveData || ['slow-2g', '2g'].includes(c.effectiveType))
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!slow && !reduce) setHeroVideo(true)
  }, [])
  const [needSize, setNeedSize] = useState(null)
  const [bagOpen, setBagOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [addedId, setAddedId] = useState(null)

  const filtered = useMemo(() => {
    let list = category === 'ALL PIECES' ? products : category === 'SAVED' ? products.filter(p => wish.includes(p.id)) : products.filter(p => p.category === category)
    const q = query.trim().toLowerCase()
    if (q) list = list.filter(p => (p.name + ' ' + p.color + ' ' + p.tag + ' ' + p.category).toLowerCase().includes(q))
    if (sort === 'PRICE: LOW TO HIGH') list = [...list].sort((a, b) => a.price - b.price)
    if (sort === 'PRICE: HIGH TO LOW') list = [...list].sort((a, b) => b.price - a.price)
    return list
  }, [category, products, query, sort, wish])
  const count = bag.reduce((sum, item) => sum + item.quantity, 0)
  const total = bag.reduce((sum, item) => sum + item.price * item.quantity, 0)

  useEffect(() => { document.body.style.overflow = (quick || bagOpen || sizeGuide) ? 'hidden' : '' }, [quick, bagOpen, sizeGuide])

  useEffect(() => {
    const els = document.querySelectorAll('.reveal')
    if (!('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return }
    document.documentElement.classList.add('js-reveal')
    const io = new IntersectionObserver((entries) => entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target) } }), { threshold: 0.12 })
    els.forEach(e => io.observe(e))
    return () => io.disconnect()
  }, [filtered])

  function openQuick(p) { setQuick(p); setZoom(false) }
  function closeQuick() { setQuick(null); setZoom(false) }
  function toggleWish(id) { setWish(w => w.includes(id) ? w.filter(x => x !== id) : [...w, id]) }
  function onZoomMove(e) {
    if (!zoom) return
    const r = e.currentTarget.getBoundingClientRect()
    setZoomPos(((e.clientX - r.left) / r.width * 100) + '% ' + ((e.clientY - r.top) / r.height * 100) + '%')
  }

  function addToBag(product, size) {
    const lineId = product.id + '-' + size
    setBag(current => {
      const found = current.find(item => item.id === lineId)
      return found
        ? current.map(item => item.id === lineId ? { ...item, quantity: item.quantity + 1 } : item)
        : [...current, { ...product, id: lineId, productId: product.id, size, quantity: 1 }]
    })
    setAddedId(product.id)
    window.setTimeout(() => setAddedId(null), 1100)
  }

  function handleAdd(product) {
    const size = sizes[product.id]
    if (!size) { setNeedSize(product.id); return }
    addToBag(product, size)
  }

  function changeQuantity(id, delta) {
    setBag(current => current.map(item => item.id === id ? { ...item, quantity: item.quantity + delta } : item).filter(item => item.quantity > 0))
  }

  return (
    <div className="site-shell">
      <div className="bg-video" aria-hidden="true">
        {heroVideo && <video className={heroVideoOn ? 'bg-video-el on' : 'bg-video-el'} src="/hero-loop.mp4" poster="/hero-poster.jpg" autoPlay muted loop playsInline preload="metadata" onPlaying={() => setHeroVideoOn(true)} />}
      </div>
      <div className="announcement"><span>BORN FROM THE RIVER. BUILT FOR THE UNWILD.</span><span>FREE SHIPPING ON ORDERS OF ₹1,499 AND ABOVE</span><span>INDIA / EST. 2026</span></div>
      <header className="nav">
        <button className="icon-button mobile-menu" aria-label="Open menu" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
        <a href="#home" className="wordmark">GAVIALIS<span>®</span></a>
        <nav className={menuOpen ? 'nav-links nav-links-open' : 'nav-links'}>
          <a href="#collection" onClick={() => setMenuOpen(false)}>SHOP ALL</a>
          <a href="#story" onClick={() => setMenuOpen(false)}>THE ORIGIN</a>
          <a href="#details" onClick={() => setMenuOpen(false)}>OUR CODE</a>
        </nav>
        <div className="nav-right"><Account /><button className="bag-button" onClick={() => setBagOpen(true)}><span>BAG</span><span className="bag-count">{count}</span><ShoppingBag size={17} strokeWidth={1.6} /></button></div>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero-copy">
            <p className="eyebrow"><span className="green-dot" /> PREMIUM STREETWEAR / MADE IN INDIA</p>
           <h1 className="hero-title">WEAR<br /><em>YOUR</em> STRENGTH.</h1>
<p className="hero-description"><br />Limited drops, inspired by India's endangered gharial.</p>
            <div className="hero-cta">
              <a href="#collection" className="primary-link">SHOP THE COLLECTION <ArrowDownRight size={18} /></a>
              <a href="#story" className="ghost-link">THE ORIGIN</a>
            </div>
          </div>
          <figure className="hero-card">
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Gharial_%28Gavialis_gangeticus%29_male.jpg/1280px-Gharial_%28Gavialis_gangeticus%29_male.jpg" alt="Gharial on the Chambal riverbank" />
            <div className="hero-stamp"><Waves size={20} /><span>PROTECT<br />THE WILD</span></div>
            <figcaption><span>FIELD NOTES — 001</span><span>GAVIALIS GANGETICUS / THE GHARIAL</span></figcaption>
          </figure>
        </section>

        <section className="ticker" aria-label="Brand message"><div>NOT MADE TO BLEND IN <span>✳</span> ROOTED IN THE WILD <span>✳</span> BUILT TO OUTLAST <span>✳</span> NOT MADE TO BLEND IN <span>✳</span> ROOTED IN THE WILD <span>✳</span></div></section>

        <section className="trust" aria-label="Store promises">
          <a href="/policies.html#refund"><Check size={16} /><span>7-DAY RETURNS</span></a>
          <div><Shield size={16} /><span>HEAVYWEIGHT SERIES</span></div>
          <button type="button" onClick={() => setSizeGuide(true)}><span>SIZE GUIDE</span><ArrowRight size={16} /></button>
        </section>

        <section className="collection section-pad" id="collection">
          <div className="section-heading reveal">
            <div><p className="eyebrow muted">01 / THE FIELD COLLECTION</p><h2>GEAR FOR<br /><em>THE UNTAMED.</em></h2></div>
            <p className="section-intro">River-born graphics. Heavyweight layers.<br />Built in the spirit of the last river dragon.</p>
          </div>
          <div className="filters" role="group" aria-label="Filter products">
            {categories.map(item => <button key={item} onClick={() => setCategory(item)} className={category === item ? 'filter active' : 'filter'}>{item}</button>)}
            <button onClick={() => setCategory('SAVED')} className={category === 'SAVED' ? 'filter active' : 'filter'}>♥ SAVED ({wish.length})</button>
            <label className="search-box"><Search size={14} /><input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="SEARCH PIECES" aria-label="Search products" /></label>
            <select className="sort-select" value={sort} onChange={e => setSort(e.target.value)} aria-label="Sort products"><option>FEATURED</option><option>PRICE: LOW TO HIGH</option><option>PRICE: HIGH TO LOW</option></select>
            <span className="result-count">{String(filtered.length).padStart(2, '0')} PIECES</span>
          </div>
          <div className="product-grid">
            {filtered.length === 0 && <p className="no-results">{category === 'SAVED' ? 'NOTHING SAVED YET. TAP THE HEART ON ANY PIECE.' : 'NOTHING MATCHES. TRY ANOTHER SEARCH.'}</p>}
            {filtered.map(product => (
              <article className="product-card reveal" key={product.id}>
                <div className="product-image-wrap">
                  <img src={product.image} alt={product.name} loading="lazy" onClick={() => openQuick(product)} />
                  <span className="product-tag">{product.tag}</span>
                  <span className="product-number">G / {product.number}</span>
                  <button className="qv-chip" onClick={() => openQuick(product)}>QUICK VIEW</button>
                  <button className={wish.includes(product.id) ? 'wish-btn on' : 'wish-btn'} onClick={() => toggleWish(product.id)} aria-label="Save to wishlist"><Heart size={16} /></button>
                  <div className="product-actions">
                    <div className="size-picker" role="group" aria-label="Select size">{['S', 'M', 'L', 'XL'].map(sz => <button key={sz} className={sizes[product.id] === sz ? 'size-btn active' : 'size-btn'} onClick={() => { setSizes(c => ({ ...c, [product.id]: sz })); setNeedSize(null) }}>{sz}</button>)}</div>
                    <button className="quick-add" onClick={() => handleAdd(product)} aria-label={`Add ${product.name} to bag`}>{addedId === product.id ? <Check size={19} /> : <Plus size={19} />}<span>{addedId === product.id ? 'ADDED' : needSize === product.id ? 'SELECT SIZE' : 'ADD TO BAG'}</span></button>
                  </div>
                </div>
                <div className="product-info"><div><h3 className="pname" onClick={() => openQuick(product)}>{product.name}</h3><p>{product.color} / HEAVYWEIGHT SERIES</p></div><span className="product-price">{money(product.price)}</span></div>
              </article>
            ))}
          </div>
          <div className="collection-footer"><span>DESIGNED WITH INTENTION. WORN WITHOUT APOLOGY.</span><span>SCROLL TO DISCOVER <ArrowDownRight size={16} /></span></div>
        </section>

        <section className="manifesto" id="story">
          <div className="manifesto-image"><img src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Gharial_%28Gavialis_gangeticus%29_female.jpg/1280px-Gharial_%28Gavialis_gangeticus%29_female.jpg" alt="Gharials in the National Chambal Sanctuary" loading="lazy" /><span className="image-caption">THE RIVER MADE A SURVIVOR.</span></div>
          <div className="manifesto-copy reveal"><p className="eyebrow"><span className="green-dot" /> 02 / WHERE WE COME FROM</p><h2>BORN OF THE<br />RIVER.<br /><em>BUILT TO BE SEEN.</em></h2><p>GAVIALIS takes its name from <i>Gavialis gangeticus</i> — the gharial, India’s extraordinary long-snouted crocodilian. Once widespread across the river systems of the subcontinent, it now survives in fragmented stretches of clean, flowing rivers. Fishing nets, disturbed nesting banks and changes to river habitat threaten its future. We built this streetwear label around that unmistakable river dragon: its armour-like scales, its quiet power and the wild Indian rivers it calls home. The clothes are the culture; the gharial is the reason.</p><a className="text-link" href="#details">OUR CODE <ArrowRight size={17} /></a><span className="giant-g">G.</span></div>
        </section>

        <section className="values section-pad" id="details">
          <div className="values-heading reveal"><p className="eyebrow muted">03 / THE GAVIALIS CODE</p><h2>LESS NOISE.<br /><em>MORE MEANING.</em></h2></div>
          <div className="value-list">
            <div className="value-row reveal"><span className="value-index">01</span><Shield /><div><h3>BUILT TO LAST</h3><p>Substantial fabrics. Purposeful construction. Pieces worth keeping.</p></div><ArrowDownRight className="value-arrow" /></div>
            <div className="value-row reveal"><span className="value-index">02</span><Leaf /><div><h3>ROOTED IN INDIA</h3><p>Inspired by our wild places, forgotten stories, and living heritage.</p></div><ArrowDownRight className="value-arrow" /></div>
            <div className="value-row reveal"><span className="value-index">03</span><Waves /><div><h3>MOVE WITH INTENT</h3><p>Quiet confidence over loud logos. Function before excess.</p></div><ArrowDownRight className="value-arrow" /></div>
          </div>
        </section>
        <Faq />

        <section className="closing-banner"><img src="https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a7/Gharial_%28Gavialis_gangeticus%29_male.jpg/1280px-Gharial_%28Gavialis_gangeticus%29_male.jpg" alt="Gharial in its river habitat" loading="lazy" /><div className="closing-shade" /><div><p className="eyebrow">NOT A TREND. A LINEAGE.</p><h2>STAY<br /><em>UNTAMED.</em></h2><a href="#collection" className="primary-link">FIND YOUR PIECE <ArrowRight size={18} /></a></div><span className="closing-mark">GAVIALIS® / INDIA</span></section>
      </main>

      <footer className="footer"><a href="#home" className="wordmark">GAVIALIS<span>®</span></a><p>THE LAST RIVER DRAGON. / INSPIRED BY THE GHARIAL.</p><span>INDEPENDENT STREETWEAR / INDIA</span><nav className="footer-links"><a href="/policies.html#shipping">SHIPPING</a><a href="/policies.html#refund">REFUNDS</a><a href="/policies.html#privacy">PRIVACY</a><a href="/policies.html#terms">TERMS</a><a href="/policies.html#contact">CONTACT</a></nav><a href="#home" className="back-top">BACK TO TOP ↑</a><small>© 2026 GAVIALIS. GHARIAL PHOTOGRAPHS: CHARLES J. SHARP, VIA WIKIMEDIA COMMONS, CC BY-SA 4.0. IMAGES ARE NATURAL WILDLIFE PHOTOGRAPHS; THEY ARE NOT BRAND CAMPAIGN OR AI-GENERATED IMAGES.</small></footer>


      {quick && <div className="qv-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) closeQuick() }}>
        <section className="qv-modal" role="dialog" aria-modal="true" aria-label={quick.name}>
          <button className="icon-button qv-close" onClick={closeQuick} aria-label="Close"><X /></button>
          <div className={zoom ? 'qv-image zoomed' : 'qv-image'} onClick={() => setZoom(z => !z)} onMouseMove={onZoomMove}>
            <img src={quick.image} alt={quick.name} style={zoom ? { transformOrigin: zoomPos } : undefined} />
            <span className="qv-hint">{zoom ? 'CLICK TO RESET' : 'CLICK TO ZOOM'}</span>
          </div>
          <div className="qv-info">
            <p className="eyebrow">{quick.tag}</p>
            <h2>{quick.name}</h2>
            <p className="qv-price">{money(quick.price)}</p>
            <p className="qv-meta">{quick.color} / HEAVYWEIGHT SERIES</p>
            <div className="qv-sizes" role="group" aria-label="Select size">{['S', 'M', 'L', 'XL'].map(sz => <button key={sz} className={sizes[quick.id] === sz ? 'size-btn active' : 'size-btn'} onClick={() => { setSizes(c => ({ ...c, [quick.id]: sz })); setNeedSize(null) }}>{sz}</button>)}</div>
            <button type="button" className="sg-link" onClick={() => setSizeGuide(true)}>SIZE GUIDE</button>
            <div className="qv-actions">
              <button className="drawer-cta" onClick={() => { const sz = sizes[quick.id]; if (!sz) { setNeedSize(quick.id); return } addToBag(quick, sz); closeQuick(); setBagOpen(true) }}>{needSize === quick.id ? 'SELECT A SIZE FIRST' : 'ADD TO BAG'} <ArrowRight size={16} /></button>
              <button className="qv-wish" onClick={() => toggleWish(quick.id)}><Heart size={15} fill={wish.includes(quick.id) ? 'currentColor' : 'none'} /> {wish.includes(quick.id) ? 'SAVED' : 'SAVE FOR LATER'}</button>
            </div>
            <p className="qv-note">FREE SHIPPING ON ₹1,499 AND ABOVE / 7-DAY RETURNS</p>
          </div>
        </section>
      </div>}

      {sizeGuide && <div className="qv-backdrop sg-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setSizeGuide(false) }}>
        <section className="sg-modal" role="dialog" aria-modal="true" aria-label="Size guide">
          <button className="icon-button qv-close" onClick={() => setSizeGuide(false)} aria-label="Close"><X /></button>
          <p className="eyebrow">FIT / SIZE GUIDE</p>
          <h2>FIND YOUR SIZE.</h2>
          <table className="sg-table">
            <thead><tr><th>SIZE</th><th>CHEST (IN)</th><th>LENGTH (IN)</th></tr></thead>
            <tbody>{sizeChart.map(r => <tr key={r[0]}><td>{r[0]}</td><td>{r[1]}</td><td>{r[2]}</td></tr>)}</tbody>
          </table>
          <p className="qv-note">Garment measurements, laid flat. Between sizes? Size up for the oversized streetwear fit. Not sure? Message us before you order.</p>
        </section>
      </div>}

      {WHATSAPP && <a className="wa-float" href={'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent('Hi GAVIALIS, I have a question')} target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp"></a>}

      {checkoutOpen && <Checkout bag={bag} onClose={() => setCheckoutOpen(false)} onDone={() => setBag([])} />}
      {bagOpen && <div className="drawer-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setBagOpen(false) }}>
        <aside className="bag-drawer" aria-label="Shopping bag">
          <div className="drawer-header"><div><p className="eyebrow muted">YOUR SELECTION</p><h2>THE BAG <span>({count})</span></h2></div><button className="icon-button" onClick={() => setBagOpen(false)} aria-label="Close bag"><X /></button></div>
          {bag.length === 0 ? <div className="empty-bag"><ShoppingBag size={35} strokeWidth={1} /><h3>NOTHING IN THE BAG. YET.</h3><p>Your next everyday essential is waiting.</p><button className="drawer-cta" onClick={() => setBagOpen(false)}>EXPLORE COLLECTION <ArrowRight size={17} /></button></div> : <>
            <div className="bag-items">{bag.map(item => <div className="bag-item" key={item.id}><img src={item.image} alt={item.name} /><div className="bag-item-info"><h3>{item.name}</h3><p>{item.color} / SIZE {item.size}</p><strong>{money(item.price)}</strong><div className="quantity"><button onClick={() => changeQuantity(item.id, -1)} aria-label="Decrease quantity"><Minus size={13} /></button><span>{item.quantity}</span><button onClick={() => changeQuantity(item.id, 1)} aria-label="Increase quantity"><Plus size={13} /></button></div></div><button className="remove-item" onClick={() => changeQuantity(item.id, -item.quantity)} aria-label={`Remove ${item.name}`}><X size={15} /></button></div>)}</div>
            <div className="drawer-total"><div><span>SUBTOTAL</span><strong>{money(total)}</strong></div><div className="ship-progress" aria-hidden="true"><i style={{ width: Math.min(100, total / 1499 * 100) + '%' }} /></div><p><Truck size={15} /> {total >= 1499 ? 'YOU QUALIFY FOR FREE SHIPPING' : `ADD ${money(1499 - total)} FOR FREE SHIPPING`}</p><button className="drawer-cta" onClick={() => { setBagOpen(false); setCheckoutOpen(true) }}>CONTINUE TO CHECKOUT <ArrowRight size={17} /></button><small>Taxes and shipping calculated at checkout.</small></div>
          </>}
        </aside>
      </div>}
    </div>
  )
}
