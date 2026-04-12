import { motion } from "motion/react";
import { ArrowRight, Star } from "lucide-react";

const products = [
  {
    id: 1,
    name: "Premium Smart Watch",
    image: "https://picsum.photos/seed/watch/400/400",
    price: 4999,
    cash: 2499,
    coupon: 2500,
    category: "Electronics"
  },
  {
    id: 2,
    name: "Noise Cancelling Headphones",
    image: "https://picsum.photos/seed/audio/400/400",
    price: 8999,
    cash: 4499,
    coupon: 4500,
    category: "Audio"
  },
  {
    id: 3,
    name: "Ergonomic Office Chair",
    image: "https://picsum.photos/seed/chair/400/400",
    price: 12999,
    cash: 6499,
    coupon: 6500,
    category: "Furniture"
  },
  {
    id: 4,
    name: "Smart Home Hub",
    image: "https://picsum.photos/seed/home/400/400",
    price: 3499,
    cash: 1749,
    coupon: 1750,
    category: "Smart Home"
  }
];

export default function Marketplace() {
  return (
    <section id="marketplace" className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl lg:text-5xl font-display font-extrabold mb-6 text-page-text"
            >
              Coupon <span className="text-gradient-blue">Marketplace</span>
            </motion.h2>
            <p className="text-muted-text text-lg max-w-xl">
              Use your Coupon Wallet to get up to 50% off on premium products. Smart shopping starts here.
            </p>
          </div>
          <button className="flex items-center gap-2 text-primary font-bold hover:gap-3 transition-all">
            View All Products <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map((product, idx) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="glass-card group overflow-hidden"
            >
              {/* Image Container */}
              <div className="relative aspect-square overflow-hidden">
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-primary text-[10px] font-bold text-white uppercase tracking-widest">
                  50% Coupon Off
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-page-bg/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                  <button className="w-full py-3 bg-page-text text-page-bg font-bold rounded-xl text-sm shadow-xl">
                    Add to Cart
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-muted-text uppercase tracking-widest">{product.category}</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-accent fill-accent" />
                    <span className="text-[10px] font-bold text-muted-text">4.9</span>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-page-text mb-4 line-clamp-1">{product.name}</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-text">Market Price</span>
                    <span className="text-muted-text line-through">₹{product.price}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-page-text/5 border border-glass-border text-center">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-bold text-muted-text uppercase">Pay Cash</span>
                      <span className="text-sm font-bold text-page-text">₹{product.cash}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-accent uppercase">Pay Coupon</span>
                      <span className="text-sm font-bold text-accent">₹{product.coupon}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
