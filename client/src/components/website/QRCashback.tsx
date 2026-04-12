import { motion } from "motion/react";
import { QrCode, Smartphone, Store, CheckCircle2, Zap } from "lucide-react";

export default function QRCashback() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[40%] h-[60%] bg-primary/10 rounded-full blur-[120px]" />
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[40%] h-[60%] bg-accent/5 rounded-full blur-[120px]" />

      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          {/* Visual Side */}
          <div className="relative order-2 lg:order-1 scale-90 sm:scale-100 transition-transform duration-500">
            <div className="relative z-10 max-w-[280px] sm:max-w-[320px] lg:max-w-[400px] mx-auto">
              {/* Phone Mockup */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="relative z-20 w-full aspect-[9/19] bg-page-bg rounded-[2.5rem] sm:rounded-[3rem] border-[6px] sm:border-[8px] border-glass-border overflow-hidden shadow-2xl"
              >
                {/* App Interface */}
                <div className="absolute inset-0 flex flex-col">
                  <div className="p-4 sm:p-6 pt-10 sm:pt-12 flex justify-between items-center">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-page-text/10" />
                    <div className="text-[8px] sm:text-[10px] font-bold text-muted-text uppercase tracking-widest">Scan & Pay</div>
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-page-text/10" />
                  </div>

                  <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8">
                    <div className="relative w-full aspect-square glass-card flex items-center justify-center p-3 sm:p-4 border-primary/30">
                      <QrCode className="w-full h-full text-primary opacity-80" />
                      {/* Scanning Line */}
                      <motion.div 
                        animate={{ top: ["0%", "100%", "0%"] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="absolute left-0 right-0 h-0.5 bg-primary shadow-[0_0_15px_rgba(30,144,255,0.8)] z-10"
                      />
                    </div>
                    <p className="mt-6 sm:mt-8 text-center text-[10px] sm:text-xs text-muted-text">Align QR code within the frame to scan</p>
                  </div>

                  <div className="p-6 sm:p-8 bg-page-text/5 border-t border-glass-border">
                    <div className="flex items-center gap-3 sm:gap-4 mb-4">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                        <Store className="text-accent w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div>
                        <div className="text-xs sm:text-sm font-bold text-page-text">Starbucks Coffee</div>
                        <div className="text-[8px] sm:text-[10px] text-muted-text">Partner Store #482</div>
                      </div>
                    </div>
                    <button className="w-full py-3 sm:py-4 bg-primary rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold text-white shadow-lg shadow-primary/20">
                      Confirm Payment
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Success Popup (Floating) */}
              <motion.div
                initial={{ opacity: 0, scale: 0.5, x: 20 }}
                whileInView={{ opacity: 1, scale: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5, type: "spring" }}
                className="absolute -right-4 sm:-right-8 lg:-right-12 top-1/3 z-30 glass-card p-4 sm:p-6 shadow-2xl border-green-500/30 w-48 sm:w-56 scale-90 sm:scale-100"
              >
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <CheckCircle2 className="text-green-400 w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <div className="text-[10px] sm:text-xs font-bold text-green-500">Success!</div>
                    <div className="text-[8px] sm:text-[10px] text-muted-text">Payment Complete</div>
                  </div>
                </div>
                <div className="text-center py-2 border-t border-glass-border mt-2">
                  <div className="text-[8px] sm:text-[10px] text-muted-text uppercase tracking-widest">Cashback Earned</div>
                  <div className="text-xl sm:text-2xl font-display font-bold text-page-text">₹45.00</div>
                </div>
                <motion.div 
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -top-1.5 -right-1.5"
                >
                  <Zap className="w-4 h-4 sm:w-6 sm:h-6 text-accent fill-accent" />
                </motion.div>
              </motion.div>
            </div>
          </div>

          {/* Content Side */}
          <div className="order-1 lg:order-2">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-8">
                <QrCode className="w-4 h-4 text-accent" />
                <span className="text-xs font-bold tracking-wider text-accent uppercase">Retail QR Cashback</span>
              </div>

              <h2 className="text-4xl lg:text-5xl font-display font-extrabold mb-8 leading-tight text-page-text">
                Shop Offline. <br />
                <span className="text-gradient-orange">Earn Instantly.</span>
              </h2>

              <p className="text-lg text-muted-text mb-10 leading-relaxed">
                MARK X bridges the gap between digital rewards and physical retail. Our QR-based system allows you to pay and earn at your favorite local stores with zero friction.
              </p>

              <div className="space-y-6">
                {[
                  { icon: Store, title: "Visit Partner Shop", desc: "Find thousands of local stores in our app." },
                  { icon: Smartphone, title: "Scan Mark X QR", desc: "Use our built-in scanner for instant recognition." },
                  { icon: Zap, title: "Get Instant Cashback", desc: "Rewards are credited to your wallet immediately." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-6">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-page-text/5 border border-glass-border flex items-center justify-center">
                      <item.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold mb-1 text-page-text">{item.title}</h4>
                      <p className="text-sm text-muted-text">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
