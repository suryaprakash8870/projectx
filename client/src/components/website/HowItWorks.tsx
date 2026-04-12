import { motion } from "motion/react";
import { UserPlus, ShoppingCart, QrCode, TrendingUp } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    title: "Join & Activate",
    desc: "Create your account and activate your multi-utility wallet in seconds.",
    color: "from-blue-500 to-primary",
    iconColor: "text-blue-500"
  },
  {
    icon: ShoppingCart,
    title: "Shop with Coupons",
    desc: "Browse our marketplace and purchase exclusive coupons for huge savings.",
    color: "from-purple-500 to-indigo-600",
    iconColor: "text-purple-500"
  },
  {
    icon: QrCode,
    title: "Scan at Stores",
    desc: "Visit any partner retail shop and scan the MARK X QR code to pay.",
    color: "from-orange-500 to-accent",
    iconColor: "text-orange-500"
  },
  {
    icon: TrendingUp,
    title: "Earn & Grow",
    desc: "Get instant cashback and earn referral rewards as your network shops.",
    color: "from-green-500 to-emerald-600",
    iconColor: "text-green-500"
  }
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl lg:text-5xl font-display font-extrabold mb-6"
          >
            Simple Steps to <span className="text-gradient-blue">Smart Earnings</span>
          </motion.h2>
          <p className="text-muted-text text-lg">
            We've streamlined the process of earning and saving. No complex hurdles, just real rewards for real shopping.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden lg:block absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-y-1/2 z-0" />

          {steps.map((step, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.15 }}
              className="relative z-10 flex flex-col items-center text-center group"
            >
              <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${step.color} p-0.5 mb-8 group-hover:scale-110 transition-transform duration-500 shadow-xl shadow-black/20`}>
                <div className="w-full h-full rounded-[22px] bg-page-bg flex items-center justify-center">
                  <step.icon className={`w-8 h-8 ${step.iconColor}`} />
                </div>
              </div>
              
              <div className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-page-text/5 border border-glass-border flex items-center justify-center font-display font-bold text-page-text/20 text-sm">
                0{idx + 1}
              </div>

              <h3 className="text-xl font-display font-bold mb-4 text-page-text">{step.title}</h3>
              <p className="text-muted-text text-sm leading-relaxed px-4">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
