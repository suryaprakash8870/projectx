import { motion } from "motion/react";
import { Users, TrendingUp, Network, UserPlus } from "lucide-react";

export default function ReferralNetwork() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-primary font-bold tracking-widest uppercase text-sm mb-4"
            >
              Network Growth
            </motion.div>
            <h2 className="text-4xl lg:text-5xl font-display font-extrabold mb-8 leading-tight text-page-text">
              Structured Rewards. <br />
              <span className="text-gradient-blue">Total Transparency.</span>
            </h2>
            <p className="text-lg text-muted-text mb-10 leading-relaxed">
              Our referral system is built for long-term sustainability. Track your network's growth and earnings with a clean, data-driven interface.
            </p>

            <div className="grid grid-cols-2 gap-6">
              <div className="glass-card p-6 text-center group">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <UserPlus className="w-6 h-6 text-primary" />
                </div>
                <div className="text-3xl font-display font-bold text-page-text mb-1">15%</div>
                <div className="text-[10px] text-muted-text uppercase tracking-widest font-bold">Direct Referral</div>
              </div>
              <div className="glass-card p-6 text-center group">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Network className="w-6 h-6 text-blue-500" />
                </div>
                <div className="text-3xl font-display font-bold text-page-text mb-1">5%</div>
                <div className="text-[10px] text-muted-text uppercase tracking-widest font-bold">Indirect Level 1</div>
              </div>
            </div>
          </div>

          <div className="relative">
            {/* Network Tree Visualization */}
            <div className="glass-card p-8 aspect-square flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
              
              <div className="relative z-10 w-full h-full flex items-center justify-center">
                {/* Central Node */}
                <motion.div 
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="w-20 h-20 rounded-full bg-primary flex items-center justify-center shadow-[0_0_40px_rgba(30,144,255,0.5)] z-20"
                >
                  <Users className="text-white w-8 h-8" />
                </motion.div>

                {/* Orbiting Nodes */}
                {[0, 60, 120, 180, 240, 300].map((angle, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="absolute"
                    style={{
                      transform: `rotate(${angle}deg) translateY(-120px) rotate(-${angle}deg)`
                    }}
                  >
                    <div className="w-12 h-12 rounded-full bg-page-text/5 border border-glass-border flex items-center justify-center overflow-hidden">
                      <img src={`https://picsum.photos/seed/${i+50}/48/48`} alt="user" referrerPolicy="no-referrer" />
                    </div>
                    {/* Connection Line */}
                    <div 
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-20 bg-gradient-to-b from-primary/40 to-transparent -z-10"
                      style={{ transform: `rotate(${angle + 180}deg) translateY(60px)` }}
                    />
                  </motion.div>
                ))}

                {/* Outer Orbit */}
                {[30, 90, 150, 210, 270, 330].map((angle, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    className="absolute"
                    style={{
                      transform: `rotate(${angle}deg) translateY(-180px) rotate(-${angle}deg)`
                    }}
                  >
                    <div className="w-8 h-8 rounded-full bg-page-text/5 border border-glass-border flex items-center justify-center opacity-40">
                      <div className="w-1 h-1 rounded-full bg-primary" />
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Floating Stat */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="absolute bottom-8 right-8 glass-card p-4 shadow-2xl border-primary/20"
              >
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-3 h-3 text-green-500" />
                  <span className="text-[10px] font-bold text-muted-text uppercase">Network Earnings</span>
                </div>
                <div className="text-xl font-display font-bold text-page-text">₹12,450.00</div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
