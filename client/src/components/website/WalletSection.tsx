import { motion } from "motion/react";
import { Wallet, CreditCard, History, ArrowUpRight, ArrowDownLeft } from "lucide-react";

const wallets = [
  {
    title: "Income Wallet",
    balance: "₹28,450.00",
    desc: "Direct earnings from referrals and network growth.",
    color: "from-blue-600 to-primary",
    icon: Wallet,
    trend: "+12.5%"
  },
  {
    title: "Coupon Wallet",
    balance: "₹12,000.00",
    desc: "Purchased coupons ready to be used for shopping.",
    color: "from-orange-500 to-accent",
    icon: CreditCard,
    trend: "Active"
  },
  {
    title: "Cashback Wallet",
    balance: "₹4,830.00",
    desc: "Instant rewards from retail QR scans.",
    color: "from-green-500 to-emerald-600",
    icon: History,
    trend: "+₹450 today"
  }
];

export default function WalletSection() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl lg:text-5xl font-display font-extrabold mb-6"
          >
            One App. <span className="text-gradient-blue">Three Wallets.</span>
          </motion.h2>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            Stay organized with dedicated wallets for every type of earning. Clear, transparent, and always accessible.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {wallets.map((wallet, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ y: -10 }}
              className="glass-card p-8 group relative overflow-hidden"
            >
              {/* Card Header */}
              <div className="flex justify-between items-start mb-12">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${wallet.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                  <wallet.icon className="w-7 h-7 text-white" />
                </div>
                <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                  {wallet.trend}
                </div>
              </div>

              {/* Balance */}
              <div className="mb-8">
                <div className="text-white/40 text-xs uppercase tracking-widest mb-1">{wallet.title}</div>
                <div className="text-4xl font-display font-extrabold text-white">{wallet.balance}</div>
              </div>

              <p className="text-white/50 text-sm leading-relaxed mb-8">
                {wallet.desc}
              </p>

              {/* Mini Transactions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-2">
                    <ArrowUpRight className="w-3 h-3 text-green-500" />
                    <span className="text-white/60">Recent Credit</span>
                  </div>
                  <span className="font-bold text-green-500">+₹250.00</span>
                </div>
                <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-white/5 border border-white/5 opacity-50">
                  <div className="flex items-center gap-2">
                    <ArrowDownLeft className="w-3 h-3 text-red-500" />
                    <span className="text-white/60">Last Usage</span>
                  </div>
                  <span className="font-bold text-white/80">-₹1,200.00</span>
                </div>
              </div>

              {/* Decorative Background */}
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${wallet.color} opacity-[0.03] rounded-bl-full`} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
