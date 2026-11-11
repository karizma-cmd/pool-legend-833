/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { X, RotateCcw } from 'lucide-react';
import { sounds } from '../game/audio';

interface SpinModalProps {
  isOpen: boolean;
  onClose: () => void;
  spinOffset: { x: number; y: number };
  onSpinChange: (offset: { x: number; y: number }) => void;
}

export const SpinModal: React.FC<SpinModalProps> = ({
  isOpen,
  onClose,
  spinOffset,
  onSpinChange,
}) => {
  const ballRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    updateFromPointer(e);
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);

    const onPointerMove = (moveEvent: PointerEvent) => {
      updateFromClientCoords(moveEvent.clientX, moveEvent.clientY);
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const updateFromPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    updateFromClientCoords(e.clientX, e.clientY);
  };

  const updateFromClientCoords = (clientX: number, clientY: number) => {
    if (!ballRef.current) return;
    const rect = ballRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const radius = rect.width / 2;

    const dx = (clientX - centerX) / radius;
    const dy = (centerY - clientY) / radius; // Invert Y so up is positive (topspin)

    const dist = Math.sqrt(dx * dx + dy * dy);
    // Limit spin point within 0.85 of cue ball radius to prevent miscue
    const maxRadius = 0.85;
    if (dist > maxRadius) {
      onSpinChange({
        x: (dx / dist) * maxRadius,
        y: (dy / dist) * maxRadius,
      });
    } else {
      onSpinChange({ x: dx, y: dy });
    }
    sounds.playClick();
  };

  const resetSpin = () => {
    onSpinChange({ x: 0, y: 0 });
    sounds.playClick();
  };

  // Convert spin coordinates (-1 to 1) to CSS percentage
  const indicatorLeft = 50 + spinOffset.x * 50;
  const indicatorTop = 50 - spinOffset.y * 50;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80">
      <div className="relative w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white tracking-wide">Cue Ball Spin</h3>
            <p className="text-xs text-slate-400">English, Follow (Top) & Draw (Back)</p>
          </div>
          <button
            onClick={() => { sounds.playClick(); onClose(); }}
            className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Spin Cue Ball Display */}
        <div className="flex flex-col items-center justify-center py-6">
          <div className="text-xs text-slate-400 mb-2 font-mono-numbers">
            Topspin: {(spinOffset.y * 100).toFixed(0)}% · English: {(spinOffset.x * 100).toFixed(0)}%
          </div>

          <div
            ref={ballRef}
            onPointerDown={handlePointerDown}
            className="relative w-48 h-48 rounded-full cursor-crosshair touch-none select-none border-4 border-slate-600 shadow-[inset_0_10px_25px_rgba(255,255,255,0.7),0_15px_30px_rgba(0,0,0,0.8)] bg-gradient-to-b from-white via-slate-100 to-slate-300"
          >
            {/* Crosshair guide lines */}
            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-slate-400/40 -translate-y-1/2 pointer-events-none" />
            <div className="absolute left-1/2 top-0 h-full w-[1px] bg-slate-400/40 -translate-x-1/2 pointer-events-none" />

            {/* Inner miscue boundary ring */}
            <div className="absolute inset-4 rounded-full border border-dashed border-red-400/30 pointer-events-none" />

            {/* Cue Tip Impact Red Dot */}
            <div
              className="absolute w-5 h-5 -ml-2.5 -mt-2.5 rounded-full bg-red-600 border-2 border-white shadow-lg pointer-events-none transition-transform"
              style={{
                left: `${indicatorLeft}%`,
                top: `${indicatorTop}%`,
              }}
            />
          </div>

          {/* Labels */}
          <div className="grid grid-cols-2 gap-2 w-full mt-4 text-center text-xs text-slate-400 font-medium">
            <div className="p-2 rounded-xl bg-slate-800/60">
              <span className="text-sky-400 font-bold">Top:</span> Follow Forward
            </div>
            <div className="p-2 rounded-xl bg-slate-800/60">
              <span className="text-amber-400 font-bold">Bottom:</span> Draw Backspin
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={resetSpin}
            className="flex items-center justify-center gap-1.5 flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold transition"
          >
            <RotateCcw size={16} /> Center Tip
          </button>
          <button
            onClick={() => { sounds.playClick(); onClose(); }}
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg transition"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};
