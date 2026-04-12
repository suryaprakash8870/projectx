import { motion } from "motion/react";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Rahul Sharma",
    role: "Power User",
    content: "MARK X has completely changed how I shop. The QR cashback is instant, and the referral rewards have become a steady side income for me.",
    avatar: "https://picsum.photos/seed/user1/64/64"
  },
  {
    name: "Priya Patel",
    role: "Shop Owner",
    content: "As a merchant, joining the MARK X network was the best decision. I've seen a 30% increase in footfall thanks to their reward ecosystem.",
    avatar: "https://picsum.photos/seed/user2/64/64"
  },
  {
    name: "Anish Gupta",
    role: "Business Partner",
    content: "The transparency of the wallets and the structured referral growth make this platform stand out from any other rewards app.",
    avatar: "https://picsum.photos/seed/user3/64/64"
  }
];

export default function Testimonials() {
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
            Trusted by <span className="text-gradient-blue">Thousands</span>
          </motion.h2>
          <p className="text-muted-text text-lg max-w-2xl mx-auto">
            Hear from our community of users and partner merchants who are already winning with MARK X.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="glass-card p-8 relative group"
            >
              <Quote className="absolute top-6 right-8 w-12 h-12 text-primary/10 group-hover:text-primary/20 transition-colors" />
              
              <div className="flex items-center gap-1 mb-6">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className="w-4 h-4 text-accent fill-accent" />
                ))}
              </div>

              <p className="text-muted-text italic mb-8 leading-relaxed relative z-10">
                "{t.content}"
              </p>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full border-2 border-primary/20 overflow-hidden">
                  <img src={t.avatar} alt={t.name} referrerPolicy="no-referrer" />
                </div>
                <div>
                  <div className="text-page-text font-bold">{t.name}</div>
                  <div className="text-muted-text text-xs uppercase tracking-widest">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
