import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { CinematicSection } from './components/CinematicSection';
import { MetricsSection } from './components/MetricsSection';
import { TechnologySection } from './components/TechnologySection';
import { ArchitectureSection } from './components/ArchitectureSection';
import { FooterSection } from './components/FooterSection';

export function App() {
  const [entranceComplete, setEntranceComplete] = useState<boolean>(false);

  useEffect(() => {
    // Entrance animation: After 800ms delay, entranceComplete state becomes true
    const timer = setTimeout(() => {
      setEntranceComplete(true);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className="relative w-full bg-black text-white min-h-screen selection:bg-white selection:text-black"
      style={{ fontFamily: '"Space Mono", monospace' }}
    >
      {/* Navbar (fixed, z-50) */}
      <Navbar entranceComplete={entranceComplete} />

      {/* Main Page Sections */}
      <main className="w-full flex flex-col">
        {/* Section 1: Hero (full viewport height, mouse-scrubbed) */}
        <HeroSection entranceComplete={entranceComplete} />

        {/* Section 2: Cinematic Text (full viewport height, 3D perspective scroll) */}
        <CinematicSection />

        {/* Section 3: Metrics (min-h-screen) */}
        <MetricsSection />

        {/* Section 4: Technology / Adaptive Intelligence (full viewport height) */}
        <TechnologySection />

        {/* Section 5: Architecture (min-h-screen, pure black) */}
        <ArchitectureSection />
      </main>

      {/* Footer */}
      <FooterSection />
    </div>
  );
}

export default App;

