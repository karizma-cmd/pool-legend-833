/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from 'react';
import { sounds } from '../game/audio';

interface SplashScreenProps {
  onComplete: () => void;
  durationSeconds?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onComplete,
  durationSeconds = 7,
}) => {
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);
  const completedRef = useRef<boolean>(false);

  const handleFinish = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    setIsFadingOut(true);
    sounds.playCueStrike(0.7);
    setTimeout(() => {
      onComplete();
    }, 700);
  };

  useEffect(() => {
    // Exactly 7 seconds total display:
    // Begins smooth fade out at (durationSeconds - 0.7)s, completes at durationSeconds
    const fadeOutDelayMs = Math.max(0, (durationSeconds * 1000) - 700);
    const fadeTimer = setTimeout(() => {
      if (!completedRef.current) {
        setIsFadingOut(true);
      }
    }, fadeOutDelayMs);

    const completeTimer = setTimeout(() => {
      if (!completedRef.current) {
        completedRef.current = true;
        onComplete();
      }
    }, durationSeconds * 1000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [durationSeconds, onComplete]);

  return (
    <div
      onClick={handleFinish}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[#050811] select-none overflow-hidden touch-none transition-opacity duration-700 ease-in-out ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
      }`}
    >
      {/* 
        Ambient blurred background mirror of the artwork:
        Seamlessly extends the deep pool-hall lighting, warm lamps, and neon blue reflections
        to fill any mobile screen ratio, whether vertical (portrait) or horizontal (landscape).
      */}
      <div
        className="absolute inset-0 bg-cover bg-center filter blur-2xl opacity-40 scale-110 pointer-events-none"
        style={{
          backgroundImage: `url('/assets/aistudio/Pool_Legend__Neon_8-Ball_Showdown_1__b1809b5e.png')`,
        }}
      />

      {/* Dark vignette to blend edges naturally with device viewport */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/80 pointer-events-none" />

      {/* 
        Pure splash artwork:
        - In portrait (عمودي): Centers and scales to the phone screen with object-contain.
        - In landscape (أفقي): Fits within viewport height cleanly, centered, without stretching or clipping.
        - NO buttons, NO skip badges, NO overlays: 100% pure image as requested.
      */}
      <img
        src="/assets/aistudio/Pool_Legend__Neon_8-Ball_Showdown_1__b1809b5e.png"
        alt="Pool Legend 8"
        className="relative z-10 w-full h-full max-w-full max-h-full object-contain pointer-events-none drop-shadow-[0_0_35px_rgba(0,0,0,0.9)]"
      />
    </div>
  );
};
