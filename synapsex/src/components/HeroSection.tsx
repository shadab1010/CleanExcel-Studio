import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ScrambleIn } from './ScrambleIn';

interface HeroSectionProps {
  entranceComplete: boolean;
}

const HERO_VIDEO_URL = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260622_083515_290e5a10-0b95-41af-a5e2-32b6389baa4d.mp4";

export const HeroSection: React.FC<HeroSectionProps> = ({ entranceComplete }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isSeekingRef = useRef(false);
  const targetTimeRef = useRef(0);
  const lastMouseXRef = useRef<number | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Ensure video is paused on load
    video.pause();
    video.currentTime = 0;

    const onSeeked = () => {
      isSeekingRef.current = false;
      if (Math.abs(video.currentTime - targetTimeRef.current) > 0.05) {
        isSeekingRef.current = true;
        video.currentTime = targetTimeRef.current;
      }
    };

    video.addEventListener('seeked', onSeeked);

    const handleMouseMove = (e: MouseEvent) => {
      if (!video.duration || isNaN(video.duration)) return;

      if (lastMouseXRef.current === null) {
        lastMouseXRef.current = e.clientX;
        return;
      }

      const deltaX = e.clientX - lastMouseXRef.current;
      lastMouseXRef.current = e.clientX;

      // Sensitivity factor 0.8
      // Convert viewport delta to scrub time
      const scrubDelta = (deltaX / window.innerWidth) * video.duration * 0.8;
      let newTime = targetTimeRef.current + scrubDelta;
      newTime = Math.max(0, Math.min(video.duration, newTime));
      targetTimeRef.current = newTime;

      if (!isSeekingRef.current) {
        isSeekingRef.current = true;
        video.currentTime = newTime;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      video.removeEventListener('seeked', onSeeked);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <section className="relative w-full h-screen h-[100dvh] overflow-hidden flex flex-col justify-between select-none">
      {/* Background Video (paused, mouse scrubbed) */}
      <video
        ref={videoRef}
        src={HERO_VIDEO_URL}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        preload="auto"
        muted
        playsInline
      />

      {/* Dot Grid Overlay: radial-gradient(#ffffff 1px, transparent 1px) 24x24px, opacity 0.05 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          opacity: 0.05,
        }}
      />

      {/* Large Background Watermark: TRANSCENDENCE */}
      <div
        className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none overflow-hidden"
        style={{ marginTop: '50px' }}
      >
        <span
          className="font-anton uppercase select-none tracking-[-4px] text-center"
          style={{
            fontSize: 'clamp(120px, 30vw, 521px)',
            opacity: 0.10,
            background: 'radial-gradient(circle, rgba(142,127,148,0) 0%, #8E7F94 70%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: 0.85,
          }}
        >
          TRANSCENDENCE
        </span>
      </div>

      {/* Content wrapper fading in with entranceComplete */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: entranceComplete ? 1 : 0 }}
        transition={{ duration: 1.0, ease: 'easeOut' }}
        className="relative z-10 w-full h-full flex flex-col px-4 sm:px-6 md:px-8 pt-20 sm:pt-24 pb-8 sm:pb-12"
      >
        {/* Spacer to push content to bottom */}
        <div className="flex-1" />

        {/* Bottom Row */}
        <div className="w-full flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          {/* Left Column */}
          <div className="flex flex-col gap-4 max-w-xl">
            <h1 className="text-white font-light leading-[0.95] tracking-[-0.03em] text-[clamp(40px,10vw,100px)]">
              <ScrambleIn
                text="Brain"
                delay={200}
                triggered={entranceComplete}
              />
              <br />
              <ScrambleIn
                text="And Body"
                delay={500}
                triggered={entranceComplete}
              />
            </h1>

            {/* Description Paragraph */}
            <motion.p
              initial={{ y: 25, opacity: 0 }}
              animate={entranceComplete ? { y: 0, opacity: 1 } : { y: 25, opacity: 0 }}
              transition={{
                duration: 0.9,
                delay: 0.2,
                ease: [0.215, 0.610, 0.355, 1.000],
              }}
              className="max-w-sm text-[13px] sm:text-[15px] text-white/60 leading-relaxed font-mono"
            >
              Built at the intersection of neuroscience and artificial intelligence. SynapseX continuously maps neural pathways, cognitive load, and physiological states into a single adaptive intelligence layer.
            </motion.p>
          </div>

          {/* Right H1 */}
          <div className="text-left md:text-right">
            <h1 className="text-white font-light leading-[0.95] tracking-[-0.03em] text-[clamp(40px,10vw,100px)]">
              <ScrambleIn
                text="One"
                delay={700}
                triggered={entranceComplete}
              />
              <br />
              <ScrambleIn
                text="Network"
                delay={1000}
                triggered={entranceComplete}
              />
            </h1>
          </div>
        </div>
      </motion.div>
    </section>
  );
};
