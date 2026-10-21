import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './policies.css';

const EMAIL = 'gavialis6@gmail.com';

const pages = {
  shipping: {
    title: 'Shipping Policy',
    sections: [
      ['Where we ship', 'We currently ship within India only.'],
      ['Processing time', 'Orders are packed and handed to the courier within 1 to 3 business days after payment is confirmed.'],
      ['Delivery time', 'Delivery usually takes 4 to 8 business days after dispatch, depending on your pincode. Remote areas may take longer.'],
      ['Shipping charges', 'Orders of ₹1,499 and above ship free. For smaller orders, the shipping charge is shown at checkout before you pay.'],
      ['Tracking', 'Once your order ships, we will email you the tracking details.'],
      ['Delays or problems', 'If your parcel is delayed or marked delivered but not received, write to ' + EMAIL + ' with your order number and we will look into it.'],
    ],
  },
  refund: {
    title: 'Refund & Returns Policy',
    sections: [
      ['Return window', 'You can request a return or size exchange within 7 days of delivery.'],
      ['Condition', 'Items must be unworn, unwashed, and have all tags and packaging intact.'],
      ['Damaged or wrong item', 'If you receive a damaged, defective or wrong item, email ' + EMAIL + ' within 48 hours of delivery with your order number and photos. We will replace it or refund you.'],
      ['How to request', 'Email ' + EMAIL + ' with your order number and the reason for return. We will reply with the next steps.'],
      ['Refunds', 'Approved refunds go back to the original payment method within 5 to 7 business days after we receive and check the item.'],
      ['Not returnable', 'Items that are worn, washed, altered, or returned without tags cannot be accepted.'],
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    sections: [
      ['What we collect', 'When you create an account or place an order, we collect your name, email, phone number, delivery address and order details.'],
      ['How we use it', 'We use this information only to process and deliver your orders, send order updates, and reply to your messages.'],
      ['Payments', 'Payments are processed by Razorpay. We never see or store your card, UPI or bank details.'],
      ['Where data is stored', 'Your account and order data is stored with our database provider, Supabase.'],
      ['Sharing', 'We do not sell your personal data. We share it only with services needed to fulfil your order, such as the payment gateway and the courier.'],
      ['Your choices', 'To see, correct or delete your data, email ' + EMAIL + '.'],
    ],
  },
  terms: {
    title: 'Terms of Service',
    sections: [
      ['About these terms', 'By using this website and placing an order, you agree to these terms.'],
      ['Products and prices', 'Prices are in Indian Rupees (₹). We try to keep product details and photos accurate, but colours may look slightly different on different screens. We may correct errors in prices or listings and cancel affected orders with a full refund.'],
      ['Orders', 'An order is confirmed only after successful payment. We may cancel an order if an item is out of stock, with a full refund.'],
      ['Accounts', 'You are responsible for keeping your login details private.'],
      ['Intellectual property', 'All GAVIALIS designs, logos, text and images on this site belong to GAVIALIS and may not be copied without permission.'],
      ['Contact', 'Questions about these terms: ' + EMAIL + '.'],
    ],
  },
  contact: {
    title: 'Contact Us',
    sections: [
      ['Email', 'Write to us at ' + EMAIL + '. We reply within 2 business days.'],
            ['Phone', 'Call us on +91 9336851607.'],
      ['For order help', 'Please include your order number and the email you used at checkout.'],
    ],
  },
};

const order = ['shipping', 'refund', 'privacy', 'terms', 'contact'];

function Policies() {
  const read = () => {
    const k = window.location.hash.replace('#', '');
    return pages[k] ? k : 'shipping';
  };
  const [key, setKey] = useState(read());
  useEffect(() => {
    const on = () => { setKey(read()); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  const page = pages[key];
  return (
    <main className="pol">
      <div className="pol-top">
        <a className="pol-brand" href="/">GAVIALIS</a>
        <a href="/">← Back to store</a>
      </div>
      <nav className="pol-tabs">
        {order.map(k => (
          <a key={k} href={'#' + k} className={k === key ? 'on' : ''}>{pages[k].title}</a>
        ))}
      </nav>
      <h1>{page.title}</h1>
      <small>Last updated: October 2026</small>
      {page.sections.map(([h, t]) => (
        <section key={h}><h2>{h}</h2><p>{t}</p></section>
      ))}
    </main>
  );
}

createRoot(document.getElementById('root')).render(<Policies />);
