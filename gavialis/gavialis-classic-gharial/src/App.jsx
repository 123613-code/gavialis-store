import { useMemo, useState } from 'react'
import {
  ArrowDownRight, ArrowLeft, ArrowRight, Check, Menu, Minus, Plus,
  ShoppingBag, X, Waves, Leaf, Shield, Truck
} from 'lucide-react'
import './App.css'
import heroImage from './assets/hero.png'

const products = [
  { id: 1, name: 'Gharial Zip Hoodie', category: 'HOODIES', price: 3499, tag: 'FIELD SERIES 001', color: 'Washed Charcoal', image: '/hoodie.png', number: '01' },
  { id: 2, name: 'Chambal Utility Shorts', category: 'SHORTS', price: 1999, tag: 'CHAMBAL ISSUE', color: 'River Black', image: '/shorts.png', number: '02' },
  { id: 3, name: 'Ghost — Last River Tee', category: 'TEES', price: 1499, tag: 'ARCHIVE GRAPHIC', color: 'Faded Black', image: '/ghost.png', number: '03' },
]

const categories = ['ALL PIECES', 'HOODIES', 'SHORTS', 'TEES']
const money = (n) => `₹${n.toLocaleString('en-IN')}`

export default function App() {
  const [category, setCategory] = useState('ALL PIECES')
  const [bag, setBag] = useState([])
  const [bagOpen, setBagOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [addedId, setAddedId] = useState(null)

  const filtered = useMemo(() => category === 'ALL PIECES' ? products : products.filter(p => p.category === category), [category])
  const count = bag.reduce((sum, item) => sum + item.quantity, 0)
  const total = bag.reduce((sum, item) => sum + item.price * item.quantity, 0)

  function addToBag(product) {
    setBag(current => {
      const found = current.find(item => item.id === product.id)
      return found
        ? current.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
        : [...current, { ...product, quantity: 1 }]
    })
    setAddedId(product.id)
    window.setTimeout(() => setAddedId(null), 1100)
  }

  function changeQuantity(id, delta) {
    setBag(current => current.map(item => item.id === id ? { ...item, quantity: item.quantity + delta } : item).filter(item => item.quantity > 0))
  }

  return (
    <div className="site-shell">
      <div className="announcement"><span>BUILT FOR THE UNWILD.</span><span>FREE SHIPPING ON ORDERS OVER ₹3,999</span><span>INDIA / EST. 2026</span></div>
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
          <img className="hero-image" src={heroImage} alt="GAVIALIS gharial streetwear campaign" />
          <div className="hero-overlay" />
          <div className="hero-topline"><span>FIELD NOTES — 001</span><span>CHAMBAL BASIN / INDIA</span></div>
          <div className="hero-copy">
            <p className="eyebrow"><span className="green-dot" /> SPECIES 001 / CHAMBAL, INDIA</p>
            <h1>THE LAST<br /><em>RIVER</em> DRAGON.</h1>
            <p className="hero-description">Born from ancient waters.<br />Made for those who move differently.</p>
            <a href="#collection" className="primary-link">EXPLORE THE COLLECTION <ArrowDownRight size={18} /></a>
          </div>
          <div className="hero-bottom"><span>GAVIALIS GANGETICUS / THE LAST RIVER DRAGON</span><span>THREATENED. NEVER FORGOTTEN.</span></div>
          <div className="hero-stamp"><Waves size={20} /><span>PROTECT<br />THE WILD</span></div>
        </section>

        <section className="ticker" aria-label="Brand message"><div>THE LAST RIVER DRAGON <span>✳</span> CHAMBAL TO THE STREETS <span>✳</span> BUILT LIKE AN ANCIENT SURVIVOR <span>✳</span> THE LAST RIVER DRAGON <span>✳</span> CHAMBAL TO THE STREETS <span>✳</span></div></section>

        <section className="collection section-pad" id="collection">
          <div className="section-heading">
            <div><p className="eyebrow muted">01 / SPECIES 001 — CHAMBAL</p><h2>RIVER-BORN.<br /><em>STREET-RAISED.</em></h2></div>
            <p className="section-intro">Gharial graphics. Washed-out blacks.<br />Three pieces. One ancient attitude.</p>
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
                  <button className="quick-add" onClick={() => addToBag(product)} aria-label={`Add ${product.name} to bag`}>{addedId === product.id ? <Check size={19} /> : <Plus size={19} />}<span>{addedId === product.id ? 'ADDED' : 'ADD TO BAG'}</span></button>
                </div>
                <div className="product-info"><div><h3>{product.name}</h3><p>{product.color} / HEAVYWEIGHT SERIES</p></div><span className="product-price">{money(product.price)}</span></div>
              </article>
            ))}
          </div>
          <div className="collection-footer"><span>DESIGNED WITH INTENTION. WORN WITHOUT APOLOGY.</span><span>SCROLL TO DISCOVER <ArrowDownRight size={16} /></span></div>
        </section>

        <section className="manifesto" id="story">
          <div className="manifesto-image"><img src={heroImage} alt="GAVIALIS gharial artwork" loading="lazy" /><span className="image-caption">GAVIALIS GANGETICUS / CHAMBAL BASIN</span></div>
          <div className="manifesto-copy"><p className="eyebrow"><span className="green-dot" /> 02 / WHERE WE COME FROM</p><h2>ANCIENT<br />INSTINCT.<br /><em>MODERN ARMOUR.</em></h2><p>Named for Gavialis gangeticus — the gharial, an ancient river predator whose silhouette belongs to the Chambal. We turn that unmistakable snout, armour-like scales and threatened-river legacy into heavyweight streetwear. Not a mascot. A symbol of survival.</p><a className="text-link" href="#details">READ OUR STORY <ArrowRight size={17} /></a><span className="giant-g">G.</span></div>
        </section>

        <section className="values section-pad" id="details">
          <div className="values-heading"><p className="eyebrow muted">03 / THE GAVIALIS CODE</p><h2>LESS NOISE.<br /><em>MORE MEANING.</em></h2></div>
          <div className="value-list">
            <div className="value-row"><span className="value-index">01</span><Shield /><div><h3>BUILT TO LAST</h3><p>Substantial fabrics. Purposeful construction. Pieces worth keeping.</p></div><ArrowDownRight className="value-arrow" /></div>
            <div className="value-row"><span className="value-index">02</span><Leaf /><div><h3>ROOTED IN INDIA</h3><p>Inspired by the Chambal river, gharial armour, and the wild heritage we refuse to forget.</p></div><ArrowDownRight className="value-arrow" /></div>
            <div className="value-row"><span className="value-index">03</span><Waves /><div><h3>MOVE WITH INTENT</h3><p>Quiet confidence over loud logos. Function before excess.</p></div><ArrowDownRight className="value-arrow" /></div>
          </div>
        </section>

        <section className="closing-banner"><img src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2000&q=85" alt="Open wilderness landscape" loading="lazy" /><div className="closing-shade" /><div><p className="eyebrow">AN ANCIENT SURVIVOR. A NEW UNIFORM.</p><h2>STAY<br /><em>UNTAMED.</em></h2><a href="#collection" className="primary-link">FIND YOUR PIECE <ArrowRight size={18} /></a></div><span className="closing-mark">GAVIALIS® / INDIA</span></section>
      </main>

      <footer className="footer"><a href="#home" className="wordmark">GAVIALIS<span>®</span></a><p>THE LAST RIVER DRAGON.</p><span>INDEPENDENT STREETWEAR / INDIA</span><a href="#home" className="back-top">BACK TO TOP ↑</a><small>© 2026 GAVIALIS. ALL RIGHTS RESERVED.</small></footer>

      {bagOpen && <div className="drawer-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setBagOpen(false) }}>
        <aside className="bag-drawer" aria-label="Shopping bag">
          <div className="drawer-header"><div><p className="eyebrow muted">YOUR SELECTION</p><h2>THE BAG <span>({count})</span></h2></div><button className="icon-button" onClick={() => setBagOpen(false)} aria-label="Close bag"><X /></button></div>
          {bag.length === 0 ? <div className="empty-bag"><ShoppingBag size={35} strokeWidth={1} /><h3>NOTHING IN THE BAG. YET.</h3><p>Your next everyday essential is waiting.</p><button className="drawer-cta" onClick={() => setBagOpen(false)}>EXPLORE COLLECTION <ArrowRight size={17} /></button></div> : <>
            <div className="bag-items">{bag.map(item => <div className="bag-item" key={item.id}><img src={item.image} alt={item.name} /><div className="bag-item-info"><h3>{item.name}</h3><p>{item.color}</p><strong>{money(item.price)}</strong><div className="quantity"><button onClick={() => changeQuantity(item.id, -1)} aria-label="Decrease quantity"><Minus size={13} /></button><span>{item.quantity}</span><button onClick={() => changeQuantity(item.id, 1)} aria-label="Increase quantity"><Plus size={13} /></button></div></div><button className="remove-item" onClick={() => changeQuantity(item.id, -item.quantity)} aria-label={`Remove ${item.name}`}><X size={15} /></button></div>)}</div>
            <div className="drawer-total"><div><span>SUBTOTAL</span><strong>{money(total)}</strong></div><p><Truck size={15} /> {total >= 3999 ? 'YOU QUALIFY FOR FREE SHIPPING' : `ADD ${money(3999 - total)} FOR FREE SHIPPING`}</p><button className="drawer-cta" onClick={() => alert('Checkout is not connected yet. Your bag is saved for this session.')}>CONTINUE TO CHECKOUT <ArrowRight size={17} /></button><small>Taxes and shipping calculated at checkout.</small></div>
          </>}
        </aside>
      </div>}
    </div>
  )
}
