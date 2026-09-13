import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SynapseXLogo } from './SynapseXLogo';
import { SquashHamburger } from './SquashHamburger';
import { ScrambleText } from './ScrambleText';

interface NavbarProps {
  entranceComplete: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ entranceComplete }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const [downloadHovered, setDownloadHovered] = useState(false);

  const scrollTo = (y: number) => {
    window.scrollTo({
      top: y,
      behavior: 'smooth',
    });
    setMenuOpen(false);
  };

  const menuPillSpring = {
    type: 'spring',
    stiffness: 350,
    damping: 28,
  };

  return (
    <motion.header
      initial={{ opacity: 0 }}
      animate={{ opacity: entranceComplete ? 1 : 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="fixed top-0 left-0 w-full h-20 z-50 flex items-center px-4 sm:px-6 md:px-8 bg-transparent pointer-events-none"
    >
      <div className="w-full flex items-center justify-between pointer-events-auto">
        {/* ================= DESKTOP NAV (hidden below sm) ================= */}
        <div className="hidden sm:flex items-center gap-2">
          {/* Logo Pill */}
          <motion.div
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(255, 255, 255, 0.22)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => scrollTo(0)}
            className="h-12 px-5 bg-white/15 backdrop-blur-md rounded-[14px] flex items-center gap-2.5 cursor-pointer select-none transition-colors duration-200"
          >
            <SynapseXLogo size={18} className="text-white" />
            <span className="text-[16px] font-medium tracking-tight text-white">
              SynapseX
            </span>
          </motion.div>

          {/* Expanding Menu Pill */}
          <motion.div
            initial={false}
            animate={{ width: menuOpen ? 290 : 48 }}
            transition={menuPillSpring}
            className="h-12 rounded-[14px] bg-white/15 backdrop-blur-md flex items-center overflow-hidden"
          >
            {/* Hamburger Button */}
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className={`flex items-center justify-center transition-all duration-200 cursor-pointer ${
                menuOpen
                  ? 'w-9 h-9 rounded-[11px] bg-white/10 hover:bg-white/20 ml-1.5'
                  : 'w-12 h-12 rounded-[14px] hover:bg-white/10'
              }`}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              <SquashHamburger isOpen={menuOpen} isMobile={false} />
            </button>

            {/* Nav Links (fade in when open, offset x:15->0) */}
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="flex items-center gap-6 pl-4 pr-3 whitespace-nowrap"
                >
                  <button
                    type="button"
                    onMouseEnter={() => setHoveredLink('about')}
                    onMouseLeave={() => setHoveredLink(null)}
                    onClick={() => scrollTo(window.innerHeight)}
                    className="text-[16px] font-normal text-white/85 hover:text-white transition-colors cursor-pointer bg-transparent border-0"
                  >
                    <ScrambleText
                      text="About"
                      isHovered={hoveredLink === 'about'}
                    />
                  </button>

                  <button
                    type="button"
                    onMouseEnter={() => setHoveredLink('metrics')}
                    onMouseLeave={() => setHoveredLink(null)}
                    onClick={() => scrollTo(window.innerHeight * 2)}
                    className="text-[16px] font-normal text-white/85 hover:text-white transition-colors cursor-pointer bg-transparent border-0"
                  >
                    <ScrambleText
                      text="Metrics"
                      isHovered={hoveredLink === 'metrics'}
                    />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* ================= MOBILE NAV (visible below sm) ================= */}
        <div className="flex sm:hidden items-center gap-2 flex-1 mr-3">
          {/* Logo Pill (collapses width to 0 when menu open) */}
          <motion.div
            initial={false}
            animate={{
              width: menuOpen ? 0 : 'auto',
              opacity: menuOpen ? 0 : 1,
              paddingLeft: menuOpen ? 0 : 12,
              paddingRight: menuOpen ? 0 : 12,
            }}
            transition={menuPillSpring}
            onClick={() => scrollTo(0)}
            className="h-9 bg-white/15 backdrop-blur-md rounded-[10px] flex items-center gap-1.5 cursor-pointer overflow-hidden whitespace-nowrap shrink-0"
          >
            <SynapseXLogo size={14} className="text-white" />
            <span className="text-[13px] font-medium tracking-tight text-white">
              SynapseX
            </span>
          </motion.div>

          {/* Expanding Menu Pill */}
          <motion.div
            initial={false}
            animate={{
              flex: menuOpen ? 1 : 'none',
              width: menuOpen ? '100%' : 36,
            }}
            transition={menuPillSpring}
            className="h-9 rounded-[10px] bg-white/15 backdrop-blur-md flex items-center overflow-hidden"
          >
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-9 h-9 flex items-center justify-center shrink-0"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              <SquashHamburger isOpen={menuOpen} isMobile={true} />
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 5 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-4 px-2 whitespace-nowrap overflow-hidden text-[13px]"
                >
                  <button
                    type="button"
                    onClick={() => scrollTo(window.innerHeight)}
                    className="text-white/85 hover:text-white font-normal bg-transparent border-0"
                  >
                    About
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollTo(window.innerHeight * 2)}
                    className="text-white/85 hover:text-white font-normal bg-transparent border-0"
                  >
                    Metrics
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Right: Download Button */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.03, backgroundColor: '#e2e2e6' }}
          whileTap={{ scale: 0.97 }}
          onMouseEnter={() => setDownloadHovered(true)}
          onMouseLeave={() => setDownloadHovered(false)}
          className="h-9 px-3.5 sm:h-12 sm:px-6 bg-white rounded-full text-black flex items-center gap-2 cursor-pointer font-medium select-none shadow-md shrink-0 border-0"
        >
          <i className="bi bi-apple text-[15px] sm:text-[18px]" />
          <span className="text-[13px] sm:text-[15px] font-medium tracking-tight">
            <ScrambleText text="Download" isHovered={downloadHovered} />
          </span>
        </motion.button>
      </div>
    </motion.header>
  );
};
