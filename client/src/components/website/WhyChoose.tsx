import { motion } from "motion/react";
import { CheckCircle2, XCircle, Zap, Shield, Smartphone, Globe } from "lucide-react";

const benefits = [
  {
    icon: Zap,
    title: "Multiple Earning Channels",
    desc: "From referrals to QR cashback, earn from every angle of the retail ecosystem.",
    color: "blue"
  },
  {
    icon: Shield,
    title: "Real-World Utility",
    desc: "Not just digital numbers. Use your rewards at thousands of physical partner stores.",
    color: "orange"
  },
  {
    icon: Smartphone,
    title: "Easy User Experience",
    desc: "A clean, intuitive app designed for everyone. No complex crypto hurdles.",
    color: "green"
  },
  {
    icon: Globe,
    title: "Transparent Wallets",
    desc: "Dedicated wallets for different earnings ensure you always know where you stand.",
    color: "purple"
  }
];

export default function WhyChoose() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl lg:text-5xl font-display font-extrabold mb-6 text-page-text"
          >
            Why Choose <span className="text-gradient-blue">MARK X?</span>
          </motion.h2>
          <p className="text-muted-text text-lg max-w-2xl mx-auto">
            We're redefining the rewards landscape by combining fintech precision with retail utility.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.05, y: -5 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className={`glass-card p-8 group transition-all duration-300 hover:border-${benefit.color}-500/30 hover:shadow-2xl hover:shadow-${benefit.color}-500/10`}
            >
              <div className={`w-14 h-14 rounded-2xl bg-${benefit.color}-500/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500`}>
                <benefit.icon className={`w-7 h-7 text-${benefit.color}-400`} />
              </div>
              <h3 className="text-xl font-display font-bold mb-4 text-page-text">{benefit.title}</h3>
              <p className="text-muted-text text-sm leading-relaxed">
                {benefit.desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Comparison Bento Grid */}
        <div className="mt-20 grid lg:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-2 glass-card p-10 relative overflow-hidden"
          >
            <h4 className="text-2xl font-display font-bold mb-8 text-page-text">The Mark X Advantage</h4>
            <div className="space-y-6">
              {[
                "Direct & Indirect Referral Rewards",
                "Instant Offline QR Cashback",
                "Dedicated Multi-Utility Wallets",
                "Exclusive Merchant Partner Network",
                "Smart Price Split Marketplace"
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span className="text-page-text font-medium">{item}</span>
                </div>
              ))}
            </div>
            <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-primary/5 rounded-full blur-[80px]" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass-card p-10 bg-red-500/5 border-red-500/10"
          >
            <h4 className="text-2xl font-display font-bold mb-8 text-page-text">Others</h4>
            <div className="space-y-6 opacity-50">
              {[
                "Vague Reward Systems",
                "No Offline Utility",
                "Complex Withdrawal Rules",
                "Hidden Fees & Charges",
                "Limited Partner Network"
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <XCircle className="w-5 h-5 text-red-500/50" />
                  <span className="text-muted-text font-medium">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
