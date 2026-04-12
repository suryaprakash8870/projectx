import { motion } from "motion/react";
import { TrendingUp, Users, ArrowRight, BarChart3, ShieldCheck } from "lucide-react";

export default function MerchantSection() {
  return (
    <section id="for-shops" className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <div className="relative">
            {/* Merchant Dashboard Preview */}
            <div className="relative z-10 space-y-6">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="glass-card p-8 shadow-2xl border-primary/20"
              >
                <div className="flex justify-between items-center mb-8">
                  <h4 className="text-lg font-bold text-page-text">Merchant Dashboard</h4>
                  <div className="px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-[10px] font-bold uppercase">Live</div>
                </div>
                
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div>
                    <div className="text-muted-text text-[10px] uppercase tracking-widest mb-1">Daily Revenue</div>
                    <div className="text-2xl font-display font-bold text-page-text">₹18,450</div>
                  </div>
                  <div>
                    <div className="text-muted-text text-[10px] uppercase tracking-widest mb-1">QR Scans</div>
                    <div className="text-2xl font-display font-bold text-page-text">142</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="h-2 w-full bg-page-text/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      whileInView={{ width: "75%" }}
                      viewport={{ once: true }}
                      className="h-full bg-primary" 
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-muted-text uppercase">
                    <span>Monthly Goal</span>
                    <span>75% Achieved</span>
                  </div>
                </div>
              </motion.div>

              <div className="grid grid-cols-2 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                  className="glass-card p-6"
                >
                  <Users className="w-6 h-6 text-accent mb-4" />
                  <div className="text-xl font-bold mb-1 text-page-text">850+</div>
                  <div className="text-[10px] text-muted-text uppercase">New Customers</div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                  className="glass-card p-6"
                >
                  <TrendingUp className="w-6 h-6 text-green-500 mb-4" />
                  <div className="text-xl font-bold mb-1 text-page-text">24%</div>
                  <div className="text-[10px] text-muted-text uppercase">Sales Boost</div>
                </motion.div>
              </div>
            </div>

            {/* Decorative Orbs */}
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/10 rounded-full blur-[100px] -z-10" />
          </div>

          <div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl lg:text-5xl font-display font-extrabold mb-8 leading-tight text-page-text">
                Grow Your Store with <br />
                <span className="text-gradient-blue">Smart QR Rewards</span>
              </h2>
              <p className="text-lg text-muted-text mb-10 leading-relaxed">
                Join the MARK X merchant network and transform your local business. Attract repeat customers and boost sales with our exclusive QR-based reward campaigns.
              </p>

              <div className="space-y-8 mb-12">
                {[
                  { icon: Users, title: "Attract Repeat Customers", desc: "Our ecosystem drives users to your store through targeted rewards." },
                  { icon: BarChart3, title: "Dashboard Analytics", desc: "Track every scan, transaction, and customer trend in real-time." },
                  { icon: ShieldCheck, title: "Pincode Exclusivity", desc: "Be the preferred partner in your area with our exclusive merchant slots." }
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold mb-1 text-page-text">{item.title}</h4>
                      <p className="text-sm text-muted-text">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button className="px-8 py-4 bg-primary hover:bg-blue-600 text-white font-bold rounded-2xl transition-all shadow-xl shadow-primary/25 flex items-center gap-3 group">
                Register Your Shop
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
