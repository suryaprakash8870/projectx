import { motion } from "motion/react";
import { ShieldCheck, Zap, Globe, RefreshCw } from "lucide-react";

const trustCards = [
  {
    icon: ShieldCheck,
    title: "Secure Wallet",
    desc: "Bank-grade encryption for all your earnings and transactions.",
    color: "text-blue-400",
    bg: "bg-blue-400/10"
  },
  {
    icon: RefreshCw,
    title: "Real-time Cashback",
    desc: "Instant rewards credited to your wallet after every scan.",
    color: "text-green-400",
    bg: "bg-green-400/10"
  },
  {
    icon: Globe,
    title: "Global Ecosystem",
    desc: "A connected network of retail partners and smart commerce.",
    color: "text-purple-400",
    bg: "bg-purple-400/10"
  },
  {
    icon: Zap,
    title: "Instant Utility",
    desc: "Use your coupons and rewards immediately at partner stores.",
    color: "text-orange-400",
    bg: "bg-orange-400/10"
  }
];

export default function TrustSection() {
  return (
    <section className="py-20 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {trustCards.map((card, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="glass-card p-8 group"
            >
              <div className={`w-12 h-12 rounded-xl ${card.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>
              <h3 className="text-xl font-display font-bold mb-3 text-page-text">{card.title}</h3>
              <p className="text-muted-text text-sm leading-relaxed">
                {card.desc}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-20 flex flex-wrap justify-center items-center gap-12 opacity-30 grayscale hover:grayscale-0 transition-all duration-500 text-page-text"
        >
          <div className="text-2xl font-display font-black tracking-tighter">VISA</div>
          <div className="text-2xl font-display font-black tracking-tighter">STRIPE</div>
          <div className="text-2xl font-display font-black tracking-tighter">RAZORPAY</div>
          <div className="text-2xl font-display font-black tracking-tighter">AMAZON</div>
          <div className="text-2xl font-display font-black tracking-tighter">FLIPKART</div>
        </motion.div>
      </div>
    </section>
  );
}
