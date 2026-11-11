/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CARTOON_CHARACTERS, CartoonCharacter } from '../game/characters';

interface CartoonAvatarProps {
  characterId?: string;
  avatar?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showBorder?: boolean;
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'w-8 h-8 text-base rounded-xl',
  md: 'w-11 h-11 text-xl rounded-2xl',
  lg: 'w-14 h-14 text-2xl rounded-2xl',
  xl: 'w-18 h-18 text-4xl rounded-3xl',
  '2xl': 'w-24 h-24 text-5xl rounded-3xl',
};

export const CartoonAvatar: React.FC<CartoonAvatarProps> = ({
  characterId,
  avatar,
  size = 'md',
  showBorder = true,
  className = '',
}) => {
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;

  // 1. Check if avatar is a custom image from phone photo album (Base64 data URL or image path)
  const isCustomImage = avatar && (
    avatar.startsWith('data:image/') || 
    avatar.startsWith('http://') || 
    avatar.startsWith('https://') || 
    avatar.startsWith('blob:') ||
    avatar.includes('/')
  );

  if (isCustomImage) {
    return (
      <div
        className={`relative ${sizeClass} bg-slate-900 flex items-center justify-center shadow-lg transition-transform overflow-hidden select-none shrink-0 ${
          showBorder ? 'border-2 border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.35)]' : ''
        } ${className}`}
      >
        <img
          src={avatar}
          alt="Player Avatar"
          className="w-full h-full object-cover rounded-inherit"
          crossOrigin="anonymous"
        />
        {/* Subtle glass reflection highlight */}
        <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
      </div>
    );
  }

  // 2. Find matching cartoon character
  const char = CARTOON_CHARACTERS.find(c => c.id === characterId || c.avatar === avatar);

  if (char) {
    return (
      <div
        className={`relative ${sizeClass} bg-gradient-to-br ${char.bgColor} flex items-center justify-center shadow-lg transition-transform overflow-hidden select-none shrink-0 ${
          showBorder ? `border-2 ${char.borderColor}` : ''
        } ${className}`}
      >
        {/* Soft background light spot */}
        <div className="absolute inset-0 bg-white/10 rounded-full scale-125 blur-sm pointer-events-none" />

        {/* Cartoon Character Emoji / Illustration */}
        <span className="relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] transform hover:scale-110 transition-transform">
          {char.avatar}
        </span>

        {/* Subtle glass reflection bevel */}
        <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent pointer-events-none" />
      </div>
    );
  }

  // 3. Fallback for generic emojis
  return (
    <div
      className={`relative ${sizeClass} bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center shadow-lg transition-transform overflow-hidden select-none shrink-0 ${
        showBorder ? 'border-2 border-slate-700' : ''
      } ${className}`}
    >
      <span className="relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
        {avatar || '🎱'}
      </span>
      <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />
    </div>
  );
};
