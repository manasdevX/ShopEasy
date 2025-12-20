import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram, Youtube, Phone, MessageSquare, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-[#030712] border-t border-slate-200 dark:border-slate-800 pt-16 pb-8 transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* --- MAIN FOOTER GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* Column 1: Brand & Social */}
          <div className="space-y-6">
            <Link to="/" className="text-2xl font-bold text-orange-500 tracking-tighter">
              ShopEasy
            </Link>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
              Your one-stop destination for the latest electronics, fashion, and lifestyle essentials. Quality products, delivered fast.
            </p>
            <div className="flex gap-3">
              <SocialIcon icon={<Facebook size={18} />} />
              <SocialIcon icon={<Twitter size={18} />} />
              <SocialIcon icon={<Instagram size={18} />} />
              <SocialIcon icon={<Youtube size={18} />} />
            </div>
          </div>

          {/* Column 2: Quick Shop */}
          <div>
            <h3 className="text-slate-900 dark:text-white font-bold mb-6 text-sm uppercase tracking-wider">Shop</h3>
            <ul className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
              <li><FooterLink to="/products" label="All Products" /></li>
              <li><FooterLink to="/categories" label="Featured Collections" /></li>
              <li><FooterLink to="/offers" label="Today's Deals" /></li>
              <li><FooterLink to="/seller" label="Become a Seller" /></li>
            </ul>
          </div>

          {/* Column 3: Customer Support */}
          <div>
            <h3 className="text-slate-900 dark:text-white font-bold mb-6 text-sm uppercase tracking-wider">Support</h3>
            <ul className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
              <li><FooterLink to="/track" label="Track Order" /></li>
              <li><FooterLink to="/shipping" label="Shipping Policy" /></li>
              <li><FooterLink to="/returns" label="Returns & Refunds" /></li>
              <li><FooterLink to="/faq" label="FAQs" /></li>
            </ul>
          </div>

          {/* Column 4: Contact Us */}
          <div>
            <h3 className="text-slate-900 dark:text-white font-bold mb-6 text-sm uppercase tracking-wider">Get in Touch</h3>
            <div className="space-y-4">
              <Link 
                to="/contact" 
                className="group flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-orange-500 dark:hover:border-orange-500 transition-all"
              >
                <div className="p-2 bg-orange-100 dark:bg-orange-500/10 text-orange-600 rounded-lg group-hover:bg-orange-500 group-hover:text-white transition-colors">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-500">Have questions?</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Contact Us</p>
                </div>
              </Link>
              
              <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400 pl-1">
                <Phone size={16} className="text-orange-500" />
                <span>+1 (234) 567-890</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400 pl-1">
                <MapPin size={16} className="text-orange-500" />
                <span>New York, NY 10001</span>
              </div>
            </div>
          </div>
        </div>

        {/* --- BOTTOM BAR (REVISED TO MATCH AUTHFOOTER) --- */}
        <div className="pt-8 border-t border-slate-100 dark:border-slate-900 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            © {new Date().getFullYear()} ShopEasy. All rights reserved.
          </p>
          <div className="mt-2 flex justify-center gap-6 text-sm text-slate-500 dark:text-slate-500">
            <Link to="/terms" className="hover:underline hover:text-orange-500 transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:underline hover:text-orange-500 transition-colors">Privacy</Link>
            <Link to="/help" className="hover:underline hover:text-orange-500 transition-colors">Help</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Sub-components remain the same...
function FooterLink({ to, label }) {
  return (
    <Link to={to} className="hover:text-orange-500 hover:translate-x-1 transition-all inline-block">
      {label}
    </Link>
  );
}

function SocialIcon({ icon }) {
  return (
    <a href="#" className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-orange-500 hover:text-white dark:hover:bg-orange-500 dark:hover:text-white transition-all shadow-sm">
      {icon}
    </a>
  );
}