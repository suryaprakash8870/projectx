import { motion } from "motion/react";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const faqs = [
  {
    question: "How does Mark X work?",
    answer: "Mark X is a multi-utility rewards platform. You can earn through direct and indirect referrals, save money using our coupon marketplace, and get instant cashback by scanning QR codes at our partner retail stores."
  },
  {
    question: "How do coupon purchases work?",
    answer: "You can buy coupons from our marketplace using your Coupon Wallet. These coupons allow you to pay for products using a 'Smart Price Split'—for example, paying 50% in cash and 50% using your coupon balance."
  },
  {
    question: "How does QR cashback work?",
    answer: "When you visit a partner retail store, simply scan the Mark X QR code at the counter. After a successful payment, a percentage of the transaction is instantly credited back to your Cashback Wallet."
  },
  {
    question: "How are rewards tracked?",
    answer: "All rewards, whether from referrals or cashback, are tracked in real-time. You can view detailed transaction histories and network growth charts directly in your user dashboard."
  },
  {
    question: "How do partner shops join?",
    answer: "Shop owners can register through our 'Become a Partner Shop' portal. Once verified, we provide the QR kit and dashboard access to start accepting Mark X rewards and attracting new customers."
  },
  {
    question: "How can users withdraw earnings?",
    answer: "Earnings in your Income Wallet can be withdrawn directly to your linked bank account. We process withdrawals within 24-48 hours, ensuring you have quick access to your rewards."
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24 relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl lg:text-5xl font-display font-extrabold mb-6 text-page-text"
          >
            Frequently Asked <span className="text-gradient-blue">Questions</span>
          </motion.h2>
          <p className="text-muted-text">
            Everything you need to know about the MARK X ecosystem.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
              <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
              className={`glass-card overflow-hidden transition-all duration-300 ${openIndex === idx ? 'border-primary/30 bg-page-text/[0.05]' : ''}`}
            >
              <button
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="w-full p-6 flex items-center justify-between text-left"
              >
                <span className="text-lg font-bold text-page-text">{faq.question}</span>
                {openIndex === idx ? (
                  <ChevronUp className="w-5 h-5 text-primary" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-text" />
                )}
              </button>

              <motion.div
                initial={false}
                animate={{ height: openIndex === idx ? "auto" : 0, opacity: openIndex === idx ? 1 : 0 }}
                className="overflow-hidden"
              >
                <div className="p-6 pt-0 text-muted-text leading-relaxed border-t border-glass-border mt-2">
                  {faq.answer}
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
