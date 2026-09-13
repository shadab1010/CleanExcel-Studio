import React from 'react';
import { motion } from 'framer-motion';

interface SquashHamburgerProps {
  isOpen: boolean;
  isMobile?: boolean;
}

export const SquashHamburger: React.FC<SquashHamburgerProps> = ({
  isOpen,
  isMobile = false,
}) => {
  // Desktop: container 18x12px, bar height 1.5px
  // Mobile: container 15x10px, bar height 1.2px
  const containerW = isMobile ? 15 : 18;
  const containerH = isMobile ? 10 : 12;
  const barH = isMobile ? 1.2 : 1.5;

  const topOffset = 0;
  const centerOffset = (containerH - barH) / 2;
  const bottomOffset = containerH - barH;

  const spring = {
    type: 'spring',
    stiffness: 300,
    damping: 20,
  };

  return (
    <div
      style={{ width: `${containerW}px`, height: `${containerH}px` }}
      className="relative flex items-center justify-center cursor-pointer pointer-events-none"
    >
      {/* Top Bar */}
      <motion.span
        className="absolute left-0 w-full bg-white rounded-full"
        style={{ height: `${barH}px` }}
        initial={false}
        animate={
          isOpen
            ? {
                top: centerOffset,
                rotate: 45,
              }
            : {
                top: topOffset,
                rotate: 0,
              }
        }
        transition={spring}
      />

      {/* Middle Bar */}
      <motion.span
        className="absolute left-0 w-full bg-white rounded-full"
        style={{ height: `${barH}px`, top: centerOffset }}
        initial={false}
        animate={
          isOpen
            ? {
                opacity: 0,
                scale: 0,
              }
            : {
                opacity: 1,
                scale: 1,
              }
        }
        transition={spring}
      />

      {/* Bottom Bar */}
      <motion.span
        className="absolute left-0 w-full bg-white rounded-full"
        style={{ height: `${barH}px` }}
        initial={false}
        animate={
          isOpen
            ? {
                top: centerOffset,
                rotate: -45,
              }
            : {
                top: bottomOffset,
                rotate: 0,
              }
        }
        transition={spring}
      />
    </div>
  );
};
