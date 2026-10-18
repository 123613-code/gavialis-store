import { useEffect, useMemo, useState } from 'react'
import { supabase } from './supabase'
import {
  ArrowDownRight, ArrowLeft, ArrowRight, Check, Menu, Minus, Plus,
  ShoppingBag, X, Waves, Leaf, Shield, Truck
} from 'lucide-react'
import './App.css'

const fallbackProducts = [
  { id: 1, name: 'Last River Heavyweight Hoodie', category: 'HOODIES', price: 3499, tag: 'FIELD SERIES 001', color: 'Obsidian', image: '/hoodie.png', number: '01' },
  { id: 2, name: 'Chambal Utility Shorts', category: 'BOTTOMS', price: 1999, tag: 'RIVER SERIES', color: 'Stone', image: '/shorts.png', number: '02' },
  { id: 3, name: 'Ghost — River Dragon Edition', category: 'GRAPHICS', price: 2499, tag: 'LIMITED RUN', color: 'Washed Black', image: '/ghost.png', number: '03' },
]

const categories = ['ALL PIECES', 'HOODIES', 'BOTTOMS', 'GRAPHICS']
const money = (n) => `₹${n.toLocaleString('en-IN')}`

export default function App() {
  const [category, setCategory] = useState('ALL PIECES')
  const [bag, setBag] = useState([])
  const [products, setProducts] = useState(fallbackProducts)

  useEffect(() => {
    supabase.from('products').select('*').eq('is_active', true).order('created_at').then(({ data, error }) => {
      if (error || !data || data.length === 0) return
      setProducts(data.map((p, i) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        price: Number(p.price),
        tag: p.description || '',
        color: p.colour || '',
        image: p.image_url,
        number: String(i + 1).padStart(2, '0'),
      })))
    })
  }, [])
  const [sizes, setSizes] = useState({})
  const [needSize, setNeedSize] = useState(null)
  const [bagOpen, setBagOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [addedId, setAddedId] = useState(null)

  const filtered = useMemo(() => category === 'ALL PIECES' ? products : products.filter(p => p.category === category), [category, products])
  const count = bag.reduce((sum, item) => sum + item.quantity, 0)
  const total = bag.reduce((sum, item) => sum + item.price * item.quantity, 0)

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
      <div className="announcement"><span>BORN FROM THE RIVER. BUILT FOR THE UNWILD.</span><span>FREE SHIPPING ON ORDERS OVER ₹3,999</span><span>INDIA / EST. 2026</span></div>
      <header className="nav">
        <button className="icon-button mobile-menu" aria-label="Open menu" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
        <a href="#home" className="wordmark">GAVIALIS<span>®</span></a>
        <nav className={menuOpen ? 'nav-links nav-links-open' : 'nav-links'}>
          <a href="#collection" onClick={() => setMenuOpen(false)}>SHOP ALL</a>
          <a href="#story" onClick={() => setMenuOpen(false)}>THE ORIGIN</a>
          <a href="#details" onClick={() => setMenuOpen(false)}>OUR CODE</a>
        </nav>
        <button className="bag-button" onClick={() => setBagOpen(true)}><span>BAG</span><span className="bag-count">{count}</span><ShoppingBag size={17} strokeWidth={1.6} /></button>
      </header>

      <main>
        <section className="hero" id="home">
          <img className="hero-image" src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Gharial_%28Gavialis_gangeticus%29_male.jpg/1280px-Gharial_%28Gavialis_gangeticus%29_male.jpg" alt="Gharial on the Chambal riverbank" />
          <div className="hero-overlay" />
          <div className="hero-topline"><span>FIELD NOTES — 001</span><span>29° 50' N / CHAMBAL BASIN</span></div>
          <div className="hero-copy">
            <p className="eyebrow"><span className="green-dot" /> INDEPENDENT STREETWEAR / INDIA</p>
            <h1>THE LAST<br /><em>RIVER</em> DRAGON.</h1>
            <p className="hero-description">Born from ancient waters.<br />Made for those who move differently.</p>
            <a href="#collection" className="primary-link">EXPLORE THE COLLECTION <ArrowDownRight size={18} /></a>
          </div>
          <div className="hero-bottom"><span>GAVIALIS GANGETICUS / THE GHARIAL</span><span>01 — 06 / FIELD SERIES</span></div>
          <div className="hero-stamp"><Waves size={20} /><span>PROTECT<br />THE WILD</span></div>
        </section>

        <section className="ticker" aria-label="Brand message"><div>NOT MADE TO BLEND IN <span>✳</span> ROOTED IN THE WILD <span>✳</span> BUILT TO OUTLAST <span>✳</span> NOT MADE TO BLEND IN <span>✳</span> ROOTED IN THE WILD <span>✳</span></div></section>

        <section className="collection section-pad" id="collection">
          <div className="section-heading">
            <div><p className="eyebrow muted">01 / THE FIELD COLLECTION</p><h2>GEAR FOR<br /><em>THE UNTAMED.</em></h2></div>
            <p className="section-intro">River-born graphics. Heavyweight layers.<br />Built in the spirit of the last river dragon.</p>
          </div>
          <div className="filters" role="group" aria-label="Filter products">
            {categories.map(item => <button key={item} onClick={() => setCategory(item)} className={category === item ? 'filter active' : 'filter'}>{item}</button>)}
            <span className="result-count">{String(filtered.length).padStart(2, '0')} PIECES</span>
          </div>
          <div className="product-grid">
            {filtered.map(product => (
              <article className="product-card" key={product.id}>
                <div className="product-image-wrap">
                  <img src={product.image} alt={product.name} loading="lazy" />
                  <span className="product-tag">{product.tag}</span>
                  <span className="product-number">G / {product.number}</span>
                  <div className="product-actions">
                    <div className="size-picker" role="group" aria-label="Select size">{['S', 'M', 'L', 'XL'].map(sz => <button key={sz} className={sizes[product.id] === sz ? 'size-btn active' : 'size-btn'} onClick={() => { setSizes(c => ({ ...c, [product.id]: sz })); setNeedSize(null) }}>{sz}</button>)}</div>
                    <button className="quick-add" onClick={() => handleAdd(product)} aria-label={`Add ${product.name} to bag`}>{addedId === product.id ? <Check size={19} /> : <Plus size={19} />}<span>{addedId === product.id ? 'ADDED' : needSize === product.id ? 'SELECT SIZE' : 'ADD TO BAG'}</span></button>
                  </div>
                </div>
                <div className="product-info"><div><h3>{product.name}</h3><p>{product.color} / HEAVYWEIGHT SERIES</p></div><span className="product-price">{money(product.price)}</span></div>
              </article>
            ))}
          </div>
          <div className="collection-footer"><span>DESIGNED WITH INTENTION. WORN WITHOUT APOLOGY.</span><span>SCROLL TO DISCOVER <ArrowDownRight size={16} /></span></div>
        </section>

        <section className="manifesto" id="story">
          <div className="manifesto-image"><img src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Gharial_%28Gavialis_gangeticus%29_female.jpg/1280px-Gharial_%28Gavialis_gangeticus%29_female.jpg" alt="Gharials in the National Chambal Sanctuary" loading="lazy" /><span className="image-caption">THE RIVER MADE A SURVIVOR.</span></div>
          <div className="manifesto-copy"><p className="eyebrow"><span className="green-dot" /> 02 / WHERE WE COME FROM</p><h2>BORN OF THE<br />RIVER.<br /><em>BUILT TO BE SEEN.</em></h2><p>GAVIALIS takes its name from <i>Gavialis gangeticus</i> — the gharial, India’s extraordinary long-snouted crocodilian. Once widespread across the river systems of the subcontinent, it now survives in fragmented stretches of clean, flowing rivers. Fishing nets, disturbed nesting banks and changes to river habitat threaten its future. We built this streetwear label around that unmistakable river dragon: its armour-like scales, its quiet power and the wild Indian rivers it calls home. The clothes are the culture; the gharial is the reason.</p><a className="text-link" href="#details">OUR CODE <ArrowRight size={17} /></a><span className="giant-g">G.</span></div>
        </section>

        <section className="values section-pad" id="details">
          <div className="values-heading"><p className="eyebrow muted">03 / THE GAVIALIS CODE</p><h2>LESS NOISE.<br /><em>MORE MEANING.</em></h2></div>
          <div className="value-list">
            <div className="value-row"><span className="value-index">01</span><Shield /><div><h3>BUILT TO LAST</h3><p>Substantial fabrics. Purposeful construction. Pieces worth keeping.</p></div><ArrowDownRight className="value-arrow" /></div>
            <div className="value-row"><span className="value-index">02</span><Leaf /><div><h3>ROOTED IN INDIA</h3><p>Inspired by our wild places, forgotten stories, and living heritage.</p></div><ArrowDownRight className="value-arrow" /></div>
            <div className="value-row"><span className="value-index">03</span><Waves /><div><h3>MOVE WITH INTENT</h3><p>Quiet confidence over loud logos. Function before excess.</p></div><ArrowDownRight className="value-arrow" /></div>
          </div>
        </section>

        <section className="closing-banner"><img src="https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a7/Gharial_%28Gavialis_gangeticus%29_male.jpg/1280px-Gharial_%28Gavialis_gangeticus%29_male.jpg" alt="Gharial in its river habitat" loading="lazy" /><div className="closing-shade" /><div><p className="eyebrow">NOT A TREND. A LINEAGE.</p><h2>STAY<br /><em>UNTAMED.</em></h2><a href="#collection" className="primary-link">FIND YOUR PIECE <ArrowRight size={18} /></a></div><span className="closing-mark">GAVIALIS® / INDIA</span></section>
      </main>

      <footer className="footer"><a href="#home" className="wordmark">GAVIALIS<span>®</span></a><p>THE LAST RIVER DRAGON. / INSPIRED BY THE GHARIAL.</p><span>INDEPENDENT STREETWEAR / INDIA</span><nav className="footer-links"><a href="/policies.html#shipping">SHIPPING</a><a href="/policies.html#refund">REFUNDS</a><a href="/policies.html#privacy">PRIVACY</a><a href="/policies.html#terms">TERMS</a><a href="/policies.html#contact">CONTACT</a></nav><a href="#home" className="back-top">BACK TO TOP ↑</a><small>© 2026 GAVIALIS. GHARIAL PHOTOGRAPHS: CHARLES J. SHARP, VIA WIKIMEDIA COMMONS, CC BY-SA 4.0. IMAGES ARE NATURAL WILDLIFE PHOTOGRAPHS; THEY ARE NOT BRAND CAMPAIGN OR AI-GENERATED IMAGES.</small></footer>


      {bagOpen && <div className="drawer-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setBagOpen(false) }}>
        <aside className="bag-drawer" aria-label="Shopping bag">
          <div className="drawer-header"><div><p className="eyebrow muted">YOUR SELECTION</p><h2>THE BAG <span>({count})</span></h2></div><button className="icon-button" onClick={() => setBagOpen(false)} aria-label="Close bag"><X /></button></div>
          {bag.length === 0 ? <div className="empty-bag"><ShoppingBag size={35} strokeWidth={1} /><h3>NOTHING IN THE BAG. YET.</h3><p>Your next everyday essential is waiting.</p><button className="drawer-cta" onClick={() => setBagOpen(false)}>EXPLORE COLLECTION <ArrowRight size={17} /></button></div> : <>
            <div className="bag-items">{bag.map(item => <div className="bag-item" key={item.id}><img src={item.image} alt={item.name} /><div className="bag-item-info"><h3>{item.name}</h3><p>{item.color} / SIZE {item.size}</p><strong>{money(item.price)}</strong><div className="quantity"><button onClick={() => changeQuantity(item.id, -1)} aria-label="Decrease quantity"><Minus size={13} /></button><span>{item.quantity}</span><button onClick={() => changeQuantity(item.id, 1)} aria-label="Increase quantity"><Plus size={13} /></button></div></div><button className="remove-item" onClick={() => changeQuantity(item.id, -item.quantity)} aria-label={`Remove ${item.name}`}><X size={15} /></button></div>)}</div>
            <div className="drawer-total"><div><span>SUBTOTAL</span><strong>{money(total)}</strong></div><p><Truck size={15} /> {total >= 3999 ? 'YOU QUALIFY FOR FREE SHIPPING' : `ADD ${money(3999 - total)} FOR FREE SHIPPING`}</p><button className="drawer-cta" onClick={() => alert('Checkout is not connected yet. Your bag is saved for this session.')}>CONTINUE TO CHECKOUT <ArrowRight size={17} /></button><small>Taxes and shipping calculated at checkout.</small></div>
          </>}
        </aside>
      </div>}
    </div>
  )
}
