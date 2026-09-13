import React from 'react';
import { motion } from 'framer-motion';

const METRICS_VIDEO_URL = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260622_095810_ecea3dd2-fc5e-4e41-8696-4219290b6589.mp4";

const METRICS_DATA = [
  {
    value: "2.4ms",
    label: "Synaptic Latency",
  },
  {
    value: "99.7%",
    label: "Signal Accuracy",
  },
  {
    value: "140B",
    label: "Neural Parameters",
  },
];

export const MetricsSection: React.FC = () => {
  return (
    <section className="relative w-full min-h-screen overflow-hidden flex items-center justify-center">
      {/* Background Video */}
      <video
        src={METRICS_VIDEO_URL}
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      />

      {/* Dark overlay for contrast */}
      <div className="absolute inset-0 bg-black/40 pointer-events-none" />

      {/* Layout Content */}
      <div className="relative z-10 w-full max-w-6xl pt-32 pb-32 px-6 flex flex-col items-center">
        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="text-white/40 text-[13px] sm:text-[14px] tracking-[0.2em] uppercase mb-20 text-center"
        >
          Performance Metrics
        </motion.p>

        {/* Metrics Grid */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-8 text-center">
          {METRICS_DATA.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{
                duration: 0.8,
                delay: index * 0.15,
                ease: [0.215, 0.610, 0.355, 1.000],
              }}
              className="flex flex-col items-center justify-center"
            >
              <span className="text-white text-[clamp(48px,10vw,96px)] font-light tracking-[-0.04em] leading-none">
                {item.value}
              </span>
              <span className="text-white/40 text-[13px] sm:text-[15px] mt-4 tracking-wide">
                {item.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
