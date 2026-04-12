import { Mail, Phone, MapPin } from "lucide-react";

const socialLinks = [
  { label: 'f', title: 'Facebook' },
  { label: 'X', title: 'Twitter' },
  { label: 'in', title: 'Instagram' },
  { label: 'Li', title: 'LinkedIn' },
];

export default function Footer() {
  return (
    <footer className="pt-24 pb-12 border-t border-glass-border">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-4 gap-12 mb-20">
          {/* Brand */}
          <div className="lg:col-span-1">
            <a href="#" className="flex items-center gap-2 mb-8">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
                <span className="text-white font-display font-black text-xl">X</span>
              </div>
              <span className="text-page-text font-display font-bold text-2xl tracking-tighter">
                MARK <span className="text-primary">X</span>
              </span>
            </a>
            <p className="text-muted-text text-sm leading-relaxed mb-8">
              The ultimate connected ecosystem for retail rewards, smart commerce, and referral-powered growth. Join the future of shopping.
            </p>
            <div className="flex gap-4">
              {socialLinks.map((s, i) => (
                <a key={i} href="#" title={s.title} className="w-10 h-10 rounded-full bg-page-text/5 flex items-center justify-center text-muted-text hover:text-primary hover:bg-primary/10 transition-all text-xs font-bold">
                  {s.label}
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-page-text font-bold mb-8">Quick Links</h4>
            <ul className="space-y-4">
              {["Home", "How It Works", "Features", "Marketplace", "Partner Shops"].map((link) => (
                <li key={link}>
                  <a href="#" className="text-muted-text hover:text-page-text text-sm transition-colors">{link}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-page-text font-bold mb-8">Legal</h4>
            <ul className="space-y-4">
              {["Terms of Service", "Privacy Policy", "Refund Policy", "Compliance", "Security"].map((link) => (
                <li key={link}>
                  <a href="#" className="text-muted-text hover:text-page-text text-sm transition-colors">{link}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-page-text font-bold mb-8">Contact Us</h4>
            <ul className="space-y-6">
              <li className="flex items-start gap-4">
                <Mail className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-muted-text text-sm">support@markx.com</span>
              </li>
              <li className="flex items-start gap-4">
                <Phone className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-muted-text text-sm">+91 1800 123 4567</span>
              </li>
              <li className="flex items-start gap-4">
                <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-muted-text text-sm">Financial District, Gachibowli, Hyderabad, India</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-12 border-t border-glass-border flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-muted-text text-xs opacity-50">
            © 2026 MARK X Ecosystem. All rights reserved.
          </p>
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-[10px] font-bold text-muted-text uppercase tracking-widest opacity-50">Server Status: Optimal</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-[10px] font-bold text-muted-text uppercase tracking-widest opacity-50">v2.4.0 Stable</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
