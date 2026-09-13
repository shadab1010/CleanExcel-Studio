import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionTemplate } from 'framer-motion';

const SECTION2_VIDEO_URL = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260622_092455_089c54f8-3b03-4966-9df1-e9746063d0ef.mp4";

export const CinematicSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  // useScroll tracks the section with offset ["start end", "end start"]
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  // Spring pipe: stiffness 15, damping 32, mass 1.8
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 15,
    damping: 32,
    mass: 1.8,
  });

  // yScaleValue transforms from 60 to -120 based on smooth scroll progress
  const yScaleValue = useTransform(smoothProgress, [0, 1], [60, -120]);

  // Opacity fades in from 0 to 1 between scroll progress 0.3-0.5
  const textOpacity = useTransform(smoothProgress, [0.25, 0.35, 0.65, 0.85], [0, 1, 1, 0.2]);

  // 3D transform: rotateX(24deg) translateY(${yScaleValue}px) translateZ(15px)
  const transformStyle = useMotionTemplate`rotateX(24deg) translateY(${yScaleValue}px) translateZ(15px)`;

  return (
    <section
      ref={containerRef}
      className="relative w-full h-screen h-[100dvh] overflow-hidden flex items-center justify-center"
    >
      {/* Autoplay loop video */}
      <video
        src={SECTION2_VIDEO_URL}
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      />

      {/* Top gradient overlay: 180px height, linear-gradient from #010103 to transparent, z-10 */}
      <div
        className="absolute top-0 left-0 w-full z-10 pointer-events-none"
        style={{
          height: '180px',
          background: 'linear-gradient(to bottom, #010103 0%, rgba(1, 1, 3, 0) 100%)',
        }}
      />

      {/* 3D Perspective container */}
      <div
        className="relative z-20 max-w-5xl px-6 sm:px-12 flex items-center justify-center text-center"
        style={{ perspective: '400px' }}
      >
        <motion.p
          style={{
            transform: transformStyle,
            opacity: textOpacity,
          }}
          className="font-sans font-normal text-[22px] sm:text-[30px] md:text-[36px] lg:text-[42px] text-white leading-[1.35] tracking-[-0.02em] select-none text-center"
        >
          A neural-AI interface built on the architecture of the human nervous system. SynapseX translates synaptic activity into computational intelligence. Every signal becomes measurable, structured, and visible. It continuously reconstructs internal state as a dynamic neural map. Biological noise is filtered into actionable cognitive patterns.
        </motion.p>
      </div>
    </section>
  );
};
