import { motion } from "motion/react";
import { ChevronRight, ArrowUpRight, QrCode, Wallet, ShoppingBag, Users } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function Hero() {
  const containerRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <section ref={containerRef} className="relative min-h-screen flex items-center pt-24 md:pt-32 pb-16 md:pb-20 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0 bg-page-bg">
        <img
          src="/hero-bg.jpg?v=1.2"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-0 dark:opacity-100 pointer-events-none"
        />
        <div className="absolute inset-0 dark:hidden">
          <div
            className="absolute top-0 right-0 w-[70%] h-full opacity-40 blur-[120px]"
            style={{ background: "radial-gradient(circle at 80% 50%, var(--primary) 0%, transparent 70%)" }}
          />
          <div
            className="absolute inset-0 opacity-20 blur-[100px]"
            style={{ background: "radial-gradient(circle at 50% 50%, #00008B 0%, transparent 80%)" }}
          />
        </div>
        <div
          className="absolute inset-0 opacity-[0.08] pointer-events-none mix-blend-overlay"
          style={{
            backgroundImage: `url('https://www.transparenttextures.com/patterns/stardust.png')`,
            filter: "contrast(120%)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-page-bg via-transparent to-transparent opacity-80 dark:opacity-0" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-page-bg opacity-100 dark:opacity-60" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* Content */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-center lg:text-left pt-8 lg:pt-0"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-page-text/5 border border-glass-border mb-6 md:mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] md:text-xs font-bold tracking-wider text-muted-text uppercase">The Future of Retail Rewards</span>
          </motion.div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-extrabold leading-[1.1] mb-6 md:mb-8">
            Earn. Save. Shop. <br className="hidden sm:block" />
            <span className="text-gradient-blue">Repeat.</span>
          </h1>

          <p className="text-base md:text-lg text-muted-text max-w-lg mx-auto lg:mx-0 mb-8 md:mb-10 leading-relaxed">
            MARK X is a connected ecosystem for rewards, cashback, and smart commerce.
            Turn your everyday shopping into a growth engine with our referral-powered platform.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-4 bg-primary hover:bg-blue-600 text-white font-bold rounded-2xl transition-all shadow-xl shadow-primary/25 hover:shadow-primary/40 flex items-center justify-center gap-3 group"
            >
              Sign Up Now
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button className="w-full sm:w-auto px-8 py-4 bg-page-text/5 hover:bg-page-text/10 border border-glass-border text-page-text font-bold rounded-2xl transition-all flex items-center justify-center gap-3">
              Become a Partner
              <ArrowUpRight className="w-5 h-5" />
            </button>
          </div>

          {/* Stats */}
          <div className="mt-12 md:mt-16 flex flex-wrap justify-center lg:justify-start gap-x-12 gap-y-8 border-t border-glass-border pt-8 mb-12 sm:mb-0">
            <div className="text-center lg:text-left">
              <div className="text-xl md:text-2xl font-display font-bold text-page-text">500+</div>
              <div className="text-[10px] md:text-xs text-muted-text uppercase tracking-widest mt-1">Partner Shops</div>
            </div>
            <div className="text-center lg:text-left">
              <div className="text-xl md:text-2xl font-display font-bold text-page-text">₹2.5Cr+</div>
              <div className="text-[10px] md:text-xs text-muted-text uppercase tracking-widest mt-1">Cashback Paid</div>
            </div>
            <div className="text-center lg:text-left">
              <div className="text-xl md:text-2xl font-display font-bold text-page-text">100k+</div>
              <div className="text-[10px] md:text-xs text-muted-text uppercase tracking-widest mt-1">Active Users</div>
            </div>
          </div>
        </motion.div>

        {/* Visual Showcase */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="relative px-4 sm:px-0 hidden lg:block"
        >
          <div className="relative z-10 w-full aspect-square max-w-[500px] mx-auto">
            <motion.div className="absolute top-0 left-0 w-full h-full glass-card p-8 flex flex-col justify-between overflow-hidden shadow-2xl">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Wallet className="text-primary w-6 h-6" />
                </div>
                <div className="text-right">
                  <div className="text-muted-text text-xs uppercase tracking-widest">Total Balance</div>
                  <div className="text-2xl font-display font-bold text-page-text">₹45,280.00</div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-page-text/5 border border-glass-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <ArrowUpRight className="text-green-500 w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-page-text">Cashback</div>
                      <div className="text-[10px] text-muted-text">Today, 2:45 PM</div>
                    </div>
                  </div>
                  <div className="text-green-500 text-sm font-bold">+₹120</div>
                </div>
                <div className="p-4 rounded-xl bg-page-text/5 border border-glass-border flex items-center justify-between opacity-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <ShoppingBag className="text-primary w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-page-text">Coupon</div>
                      <div className="text-[10px] text-muted-text">Yesterday</div>
                    </div>
                  </div>
                  <div className="text-page-text/60 text-sm font-bold">-₹500</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 relative group/qr overflow-hidden">
                <div className="relative p-4 rounded-2xl bg-gradient-to-br from-primary to-blue-600 text-white overflow-hidden">
                  <QrCode className="w-6 h-6 mb-2" />
                  <div className="text-xs font-bold">Scan QR</div>
                  <motion.div
                    animate={{ top: ["-10%", "110%"] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute left-0 right-0 h-[2px] bg-white/80 shadow-[0_0_15px_rgba(255,255,255,0.8)] z-20"
                  />
                </div>
                <div className="p-4 rounded-2xl bg-page-text/10 border border-glass-border text-page-text">
                  <Users className="w-6 h-6 mb-2 text-primary" />
                  <div className="text-xs font-bold text-page-text">Referral</div>
                </div>
              </div>
            </motion.div>

            {/* Floating Elements */}
            <motion.div
              animate={isMobile ? {} : { y: [10, -10, 10] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="-top-24 -right-20 w-40 h-40 glass-card p-4 absolute flex flex-col items-center justify-center text-center shadow-xl border-accent/20 z-20"
            >
              <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center mb-2">
                <span className="text-accent text-lg font-bold">GTC</span>
              </div>
              <div className="text-xs text-muted-text">Reward Token</div>
              <div className="text-lg font-bold text-accent">1,250.00</div>
            </motion.div>

            <motion.div
              animate={isMobile ? {} : { y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="-bottom-28 -left-24 w-48 glass-card p-4 absolute shadow-xl border-primary/20 z-20"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <Users className="text-primary w-4 h-4" />
                </div>
                <div className="text-[10px] font-bold text-page-text">People</div>
              </div>
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-6 h-6 rounded-full border-2 border-page-bg bg-page-text/10 overflow-hidden">
                    <img src={`https://picsum.photos/seed/${i + 10}/32/32`} alt="user" referrerPolicy="no-referrer" />
                  </div>
                ))}
                <div className="w-6 h-6 rounded-full border-2 border-page-bg bg-primary flex items-center justify-center text-[8px] font-bold text-white">
                  +12
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
