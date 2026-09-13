import React from 'react';
import { motion } from 'framer-motion';

const LAYERS = [
  {
    layer: "Layer 1",
    action: "Capture",
  },
  {
    layer: "Layer 2",
    action: "Process",
  },
  {
    layer: "Layer 3",
    action: "Interface",
  },
];

export const ArchitectureSection: React.FC = () => {
  return (
    <section className="relative w-full min-h-screen bg-black flex items-center justify-center px-6 py-32">
      <div className="w-full max-w-3xl flex flex-col items-center text-center">
        {/* Heading Block */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 1.0, ease: [0.215, 0.610, 0.355, 1.000] }}
          className="w-full flex flex-col items-center"
        >
          <span className="text-white/40 text-[13px] sm:text-[14px] tracking-[0.2em] uppercase mb-8">
            Architecture
          </span>
          <h2 className="text-white font-light text-[clamp(28px,6vw,56px)] leading-[1.15] tracking-[-0.02em] mb-10 max-w-2xl">
            Three layers. Zero friction.
          </h2>
          <p className="text-white/45 text-[15px] sm:text-[17px] leading-relaxed max-w-xl mx-auto">
            Sensor layer captures raw bioelectric signals. Processing layer isolates intent. Interface layer delivers structured output to any connected system.
          </p>
        </motion.div>

        {/* Layer Cards */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 1.2, delay: 0.4 }}
          className="w-full mt-20 flex flex-col items-center gap-4"
        >
          {LAYERS.map((item, index) => (
            <div
              key={index}
              className="w-full max-w-md h-[72px] border border-white/10 rounded-lg flex items-center justify-between px-6 bg-white/[0.02] hover:border-white/20 transition-colors"
            >
              <span className="text-white/30 text-[12px] tracking-[0.15em] uppercase">
                {item.layer}
              </span>
              <span className="text-white text-[16px] sm:text-[18px] font-light">
                {item.action}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
