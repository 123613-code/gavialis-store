import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const faqs = [
  ['Do you offer Cash on Delivery?', 'No. We accept prepaid orders only (UPI, cards, netbanking) through Razorpay. This keeps prices fair and lets us ship faster.'],
  ['How long does delivery take?', 'We dispatch in 1-3 business days. Delivery takes 4-8 business days after dispatch.'],
  ['What are the shipping charges?', 'Shipping is free on orders of ₹1,499 and above. Below that, a flat ₹99 applies.'],
  ['Can I return or exchange?', 'Yes, within 7 days of delivery. Full details are on our Refund & Returns page.'],
  ['How do I pick my size?', 'Use the Size Guide on any product. If you are between sizes, write to us and we will help you choose.'],
  ['How can I check my order status?', 'Log in and open My Orders from your account panel. For anything else, email gavialis6@gmail.com or call +91 9336851607.'],
]

export default function Faq() {
  const [open, setOpen] = useState(0)
  return (
    <section className="faq section-pad" id="faq">
      <p className="eyebrow"><span className="green-dot" /> 04 / QUESTIONS</p>
      <h2>GOOD TO <em>KNOW.</em></h2>
      <div className="faq-list">
        {faqs.map(([q, a], i) => (
          <div key={q} className={open === i ? 'faq-item open' : 'faq-item'}>
            <button type="button" className="faq-q" aria-expanded={open === i} onClick={() => setOpen(open === i ? -1 : i)}>
              <span>{q}</span>
              <ChevronDown size={20} />
            </button>
            {open === i && <p className="faq-a">{a}</p>}
          </div>
        ))}
      </div>
    </section>
  )
}