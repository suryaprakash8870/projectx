import { motion } from "motion/react";
import { ChevronRight, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function CTA() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative bg-primary p-12 lg:p-20 overflow-hidden text-center rounded-[2rem] shadow-2xl shadow-primary/30"
        >
          <div
            className="absolute inset-0 opacity-[0.05] pointer-events-none mix-blend-overlay"
            style={{
              backgroundImage: `url('https://www.transparenttextures.com/patterns/stardust.png')`,
              filter: "contrast(150%) brightness(120%)",
            }}
          />
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-[100px]" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-accent/20 rounded-full blur-[100px]" />

          <h2 className="text-4xl lg:text-6xl font-display font-extrabold mb-8 leading-tight text-white">
            Start Earning Smarter <br />
            <span>with MARK X</span>
          </h2>

          <p className="text-xl text-white/80 max-w-2xl mx-auto mb-12 leading-relaxed">
            Join thousands of users and merchants already growing their wealth through our connected retail ecosystem.
          </p>

          <div className="flex flex-wrap justify-center gap-6">
            <Link
              to="/login"
              className="px-10 py-5 bg-white text-primary hover:bg-opacity-95 font-bold rounded-2xl transition-all shadow-xl shadow-black/10 flex items-center gap-3 group text-lg active:scale-[0.98]"
            >
              Sign Up Now
              <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button className="px-10 py-5 bg-transparent border border-white/30 text-white font-bold rounded-2xl transition-all hover:bg-white/10 flex items-center gap-3 text-lg">
              Become a Partner Shop
              <ArrowUpRight className="w-6 h-6" />
            </button>
          </div>

          <div className="mt-16 flex items-center justify-center gap-8 text-white">
            <div className="flex items-center gap-2 opacity-70">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Secure Platform</span>
            </div>
            <div className="flex items-center gap-2 opacity-70">
              <div className="w-2 h-2 rounded-full bg-blue-300" />
              <span className="text-[10px] font-bold uppercase tracking-widest">24/7 Support</span>
            </div>
            <div className="flex items-center gap-2 opacity-70">
              <div className="w-2 h-2 rounded-full bg-accent" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Instant Payouts</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
