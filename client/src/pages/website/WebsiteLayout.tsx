import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { motion } from 'motion/react';
import Navbar from '../../components/website/Navbar';
import Footer from '../../components/website/Footer';
import ScrollToTop from '../../components/website/ScrollToTop';
import Loader from '../../components/website/Loader';
import { useTheme } from '../../context/ThemeContext';

export default function WebsiteLayout() {
  const [loading, setLoading] = useState(true);
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  return (
    <main className="relative bg-page-bg text-page-text selection:bg-primary/30 selection:text-white transition-colors duration-300">
      <ScrollToTop />

      <AnimatePresence mode="wait">
        {loading && <Loader key="loader" onComplete={() => setLoading(false)} />}
      </AnimatePresence>

      {!loading && (
        <>
          <Navbar theme={theme} toggleTheme={toggleTheme} />
          <div className="site-gradient-glow" aria-hidden="true" />

          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>

          <Footer />
        </>
      )}
    </main>
  );
}
