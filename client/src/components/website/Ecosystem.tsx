import { motion } from "motion/react";
import { Share2, ShoppingBag, QrCode, ArrowRight, CheckCircle2 } from "lucide-react";

const engines = [
  {
    icon: Share2,
    title: "Referral Rewards",
    desc: "Build a sustainable income stream by inviting others to the ecosystem. Earn from every transaction in your network.",
    features: ["Multi-level rewards", "Real-time tracking", "Direct withdrawals"],
    color: "blue",
    classes: {
      border: "hover:border-blue-500/30",
      shadow: "hover:shadow-blue-500/10",
      glowBg: "bg-blue-500/10",
      glowHover: "group-hover:bg-blue-500/20",
      iconBg: "bg-blue-500/10",
      iconText: "text-blue-400",
      bullet: "bg-blue-400",
      btnText: "text-blue-400"
    }
  },
  {
    icon: ShoppingBag,
    title: "Coupon Marketplace",
    desc: "Access exclusive deals from top brands. Use your coupon wallet to slash prices on products you love.",
    features: ["Exclusive brand deals", "Smart price split", "Digital delivery"],
    color: "orange",
    classes: {
      border: "hover:border-orange-500/30",
      shadow: "hover:shadow-orange-500/10",
      glowBg: "bg-orange-500/10",
      glowHover: "group-hover:bg-orange-500/20",
      iconBg: "bg-orange-500/10",
      iconText: "text-orange-400",
      bullet: "bg-orange-400",
      btnText: "text-orange-400"
    }
  },
  {
    icon: QrCode,
    title: "Retail QR Cashback",
    desc: "The bridge between online rewards and offline shopping. Scan and save at thousands of local partner stores.",
    features: ["Instant cashback", "UPI integrated", "Merchant exclusivity"],
    color: "green",
    classes: {
      border: "hover:border-green-500/30",
      shadow: "hover:shadow-green-500/10",
      glowBg: "bg-green-500/10",
      glowHover: "group-hover:bg-green-500/20",
      iconBg: "bg-green-500/10",
      iconText: "text-green-400",
      bullet: "bg-green-400",
      btnText: "text-green-400"
    }
  }
];

export default function Ecosystem() {
  return (
    <section id="features" className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-16 gap-8">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-primary font-bold tracking-widest uppercase text-sm mb-4"
            >
              The Core Engines
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl lg:text-5xl font-display font-extrabold"
            >
              A Triple-Engine <br />
              <span className="text-gradient-blue">Growth Ecosystem</span>
            </motion.h2>
          </div>
          <p className="text-muted-text max-w-md lg:text-right">
            MARK X combines three powerful systems into one seamless experience, ensuring you earn from every angle of commerce.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {engines.map((engine, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -10, zIndex: 20 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className={`glass-card p-10 group relative overflow-hidden transition-all duration-300 transform-gpu will-change-transform ${engine.classes.border} hover:shadow-2xl ${engine.classes.shadow}`}
            >
              {/* Hover Background Glow */}
              <div className={`absolute -bottom-20 -right-20 w-64 h-64 ${engine.classes.glowBg} rounded-full blur-[80px] ${engine.classes.glowHover} transition-all duration-500`} />

              <div className={`w-16 h-16 rounded-2xl ${engine.classes.iconBg} flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500`}>
                <engine.icon className={`w-8 h-8 ${engine.classes.iconText}`} />
              </div>

              <h3 className="text-2xl font-display font-bold mb-4 text-page-text">{engine.title}</h3>
              <p className="text-muted-text mb-8 leading-relaxed">
                {engine.desc}
              </p>

              <ul className="space-y-4 mb-10">
                {engine.features.map((feat, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-page-text/70">
                    <CheckCircle2 className={`w-4 h-4 ${engine.classes.iconText} flex-shrink-0`} />
                    {feat}
                  </li>
                ))}
              </ul>

              <button className={`flex items-center gap-2 text-sm font-bold ${engine.classes.btnText} group/btn`}>
                Learn More
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
