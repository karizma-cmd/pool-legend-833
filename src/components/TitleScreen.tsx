/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Wifi, 
  Bot, 
  Trophy, 
  Target, 
  ShoppingBag, 
  Banknote, 
  Sparkles,
  Flame, 
  Zap, 
  ChevronRight,
  Shield, 
  Volume2, 
  VolumeX, 
  Music,
  Globe,
  Settings,
  RefreshCw,
  Gift,
  Users
} from 'lucide-react';
import { PlayerProfile, GameMode, AIDifficulty, MatchType, CueItem } from '../game/types';
import { AI_PERSONAS } from '../game/ai';
import { storage } from '../game/storage';
import { CartoonAvatar } from './CartoonAvatar';
import { sounds } from '../game/audio';
import { i18n, Language } from '../game/i18n';

interface TitleScreenProps {
  profile: PlayerProfile;
  onStartMatch: (mode: GameMode, matchType: MatchType, difficulty?: AIDifficulty) => void;
  onOpenHotspot: () => void;
  onOpenTournament: () => void;
  onOpenHotspotTournament?: () => void;
  onOpenShop: () => void;
  onOpenProfile: () => void;
  onOpenAvatarPicker?: () => void;
  onOpenTournamentGift?: () => void;
  onShowSplash?: () => void;
}

const TIER_COLORS: Record<string, { labelAr: string; labelEn: string; border: string; bg: string; text: string }> = {
  starter: { labelAr: 'بداية', labelEn: 'Starter', border: 'border-slate-600', bg: 'bg-slate-800', text: 'text-slate-300' },
  common: { labelAr: 'شائع', labelEn: 'Common', border: 'border-sky-500/40', bg: 'bg-sky-950/60', text: 'text-sky-300' },
  rare: { labelAr: 'نادر', labelEn: 'Rare', border: 'border-cyan-500/40', bg: 'bg-cyan-950/60', text: 'text-cyan-300' },
  epic: { labelAr: 'ملحمي', labelEn: 'Epic', border: 'border-purple-500/40', bg: 'bg-purple-950/60', text: 'text-purple-300' },
  legendary: { labelAr: 'أسطوري', labelEn: 'Legendary', border: 'border-amber-500/50', bg: 'bg-amber-950/60', text: 'text-amber-300' },
  mythic: { labelAr: 'خرافي', labelEn: 'Mythic', border: 'border-rose-500/50', bg: 'bg-rose-950/60', text: 'text-rose-300' },
};

export const TitleScreen: React.FC<TitleScreenProps> = ({
  profile,
  onStartMatch,
  onOpenHotspot,
  onOpenTournament,
  onOpenHotspotTournament,
  onOpenShop,
  onOpenProfile,
  onOpenAvatarPicker,
  onOpenTournamentGift,
  onShowSplash,
}) => {
  const [selectedDifficulty, setSelectedDifficulty] = useState<AIDifficulty>('normal');
  const [showAiPicker, setShowAiPicker] = useState(false);
  const [sfxMuted, setSfxMuted] = useState(!sounds.sfxEnabled);
  const [musicActive, setMusicActive] = useState(sounds.musicEnabled);
  const [lang, setLang] = useState<Language>(() => i18n.getLanguage());

  useEffect(() => {
    return i18n.subscribe(l => setLang(l));
  }, []);

  const isAr = lang === 'ar';

  // Equipped cue
  const cues = storage.getCues();
  const equippedCue: CueItem = cues.find(c => c.id === profile.selectedCueId) || cues[0];
  const tierInfo = TIER_COLORS[equippedCue.tier || 'starter'] || TIER_COLORS.starter;

  const toggleSfx = () => {
    sounds.sfxEnabled = !sounds.sfxEnabled;
    setSfxMuted(!sounds.sfxEnabled);
    sounds.playClick();
  };

  const toggleMusic = () => {
    const state = sounds.toggleMusic();
    setMusicActive(state);
    sounds.playClick();
  };

  const handleToggleLanguage = () => {
    sounds.playClick();
    i18n.toggleLanguage();
  };

  const handleFreeCoins = () => {
    sounds.playVictory();
    storage.addCoins(250);
  };

  type BgTheme = 'championship' | 'cyber' | 'emerald';
  const [bgTheme, setBgTheme] = useState<BgTheme>(() => {
    try {
      const s = localStorage.getItem('pool_legends_bg_theme') as BgTheme;
      if (s === 'cyber' || s === 'emerald') return s;
    } catch {}
    return 'championship';
  });

  const cycleTheme = () => {
    sounds.playClick();
    const next: BgTheme = bgTheme === 'championship' ? 'cyber' : bgTheme === 'cyber' ? 'emerald' : 'championship';
    setBgTheme(next);
    try {
      localStorage.setItem('pool_legends_bg_theme', next);
    } catch {}
  };

  return (
    <div 
      className="absolute inset-0 z-30 flex flex-col justify-between p-2.5 sm:p-5 overflow-y-auto select-none bg-slate-950 font-['Outfit',sans-serif]"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* 
        ========================================================================
        NEW DYNAMIC LUXURY GAME BACKGROUND
        Pristine vector gradients, ambient spotlights, and atmospheric arena depth
        ========================================================================
      */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {bgTheme === 'championship' && (
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a1124] via-[#070b16] to-[#04060c]">
            {/* Top Center Golden Championship Spotlight */}
            <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[550px] bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.28)_0%,rgba(217,119,6,0.12)_45%,transparent_75%)] blur-2xl" />
            {/* Subtle Royal Blue Side Accent Glows */}
            <div className="absolute top-1/4 -left-32 w-96 h-96 bg-sky-500/15 rounded-full blur-3xl" />
            <div className="absolute top-1/3 -right-32 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl" />
            {/* Subtle illuminated arena grid lines */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_35%,#000_70%,transparent_100%)]" />
          </div>
        )}

        {bgTheme === 'cyber' && (
          <div className="absolute inset-0 bg-gradient-to-b from-[#080d1e] via-[#05060f] to-[#020205]">
            <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[650px] h-[500px] bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.3)_0%,rgba(168,85,247,0.15)_50%,transparent_75%)] blur-2xl" />
            <div className="absolute top-1/3 -left-20 w-80 h-80 bg-cyan-500/18 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-fuchsia-500/18 rounded-full blur-3xl" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(6,182,212,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(168,85,247,0.04)_1px,transparent_1px)] bg-[size:3.5rem_3.5rem]" />
          </div>
        )}

        {bgTheme === 'emerald' && (
          <div className="absolute inset-0 bg-gradient-to-b from-[#041a14] via-[#02100d] to-[#010605]">
            <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[550px] bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.25)_0%,rgba(5,150,105,0.1)_50%,transparent_75%)] blur-2xl" />
            <div className="absolute top-1/3 -left-32 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl" />
            <div className="absolute top-1/3 -right-32 w-96 h-96 bg-amber-500/12 rounded-full blur-3xl" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)]" />
          </div>
        )}

        {/* Global Cinematic Vignette for crisp text contrast */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(2,6,23,0.75)_100%)] pointer-events-none" />
      </div>

      {/* Top Header Bar */}
      <div className="relative z-10 w-full flex items-center justify-between gap-2 max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          {/* Tournament Gift Slot (هدية البطولة) as explicitly requested by user */}
          <button
            onClick={() => {
              sounds.playClick();
              if (onOpenTournamentGift) {
                onOpenTournamentGift();
              } else {
                handleFreeCoins();
              }
            }}
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-b from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-[0_0_15px_rgba(245,158,11,0.5)] border-2 border-yellow-200 active:scale-95 transition cursor-pointer"
            title={isAr ? 'هدية البطولة الكبرى' : 'Tournament Gift'}
          >
            <Trophy size={14} className="text-slate-950" />
            <Gift size={14} className="text-slate-950 animate-bounce" />
            <span className="font-extrabold">{isAr ? 'هدية البطولة' : 'Tournament Gift'}</span>
            {storage.getPendingTournamentGift() && !storage.getPendingTournamentGift()?.claimed && (
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-600 border border-white animate-ping" />
            )}
          </button>

          {/* Background Theme Switcher Button */}
          <button
            onClick={cycleTheme}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-amber-300 font-bold text-xs border border-amber-400/40 shadow active:scale-95 transition cursor-pointer"
            title="Change Game Background Theme"
          >
            <span>🎨</span>
            <span className="hidden sm:inline font-mono font-bold text-[11px]">
              {bgTheme === 'championship' ? (isAr ? 'ذهبي' : 'Arena') : bgTheme === 'cyber' ? (isAr ? 'نيون' : 'Cyber') : (isAr ? 'كلاسيك' : 'Club')}
            </span>
          </button>

          <button
            onClick={handleToggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white font-black text-xs shadow-lg border border-sky-400/40 active:scale-95 transition cursor-pointer"
            title="Change Language / تغيير اللغة"
          >
            <Globe size={15} className="text-sky-400" />
            <span className="text-sky-300 font-bold">{lang === 'en' ? 'العربية' : 'English'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleSfx}
            className={`p-2 rounded-xl border transition cursor-pointer ${
              sfxMuted ? 'bg-red-500/20 border-red-500/40 text-red-300' : 'bg-slate-900/90 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title="Sound Effects"
          >
            {sfxMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>
          <button
            onClick={toggleMusic}
            className={`p-2 rounded-xl border transition cursor-pointer ${
              musicActive ? 'bg-sky-500/20 border-sky-400 text-sky-300' : 'bg-slate-900/90 border-slate-700 text-slate-400'
            }`}
            title="Music"
          >
            <Music size={15} />
          </button>

          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600/30 via-emerald-500/20 to-emerald-950/80 border border-emerald-400/60 text-emerald-300 font-mono-numbers text-xs sm:text-sm font-black shadow-lg">
            <Banknote size={16} className="text-emerald-400 animate-pulse" />
            <span>{profile.coins.toLocaleString()} {isAr ? 'كوينز' : 'Coins'}</span>
          </div>
        </div>
      </div>

      {/* Main Center Area */}
      <div className="relative z-10 w-full max-w-4xl mx-auto my-auto py-2 sm:py-4 flex flex-col items-center text-center">
        <div className="mb-4 flex flex-col items-center">
          <button
            onClick={() => {
              if (onShowSplash) {
                sounds.playClick();
                onShowSplash();
              }
            }}
            className="relative flex items-center justify-center gap-2 mb-1 p-2 rounded-2xl hover:bg-slate-900/40 transition-all cursor-pointer group active:scale-95"
            title="عرض بوستر البداية الترحيبي | View Intro Poster"
          >
            <div className="relative w-12 sm:w-16 h-12 sm:h-16 rounded-full bg-slate-950 border-3 border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.8)] flex items-center justify-center text-2xl sm:text-3xl font-black text-white shrink-0 group-hover:scale-105 transition-transform">
              <span className="relative z-10 font-mono">8</span>
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500/40 to-transparent pointer-events-none" />
            </div>

            <div className="text-left">
              <div className="text-3xl sm:text-5xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-red-500 drop-shadow-[0_4px_12px_rgba(220,38,38,0.8)] group-hover:brightness-110 transition-all">
                {i18n.t('gameTitle')}
              </div>
              <div className="text-[10px] sm:text-xs font-black tracking-widest text-amber-200 uppercase drop-shadow flex items-center gap-1.5">
                <Flame size={13} className="text-red-500 fill-red-500" />
                <span>{i18n.t('tagline')}</span>
              </div>
            </div>
          </button>
        </div>

        {/* Action Cards - 4 Core Game Modes */}
        <div className="w-full max-w-4xl grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5 mb-4">
          {/* 1. Quick Play / Staked match */}
          <button
            onClick={() => { sounds.playClick(); onStartMatch('8ball', 'ai', selectedDifficulty); }}
            className="relative p-3.5 sm:p-4 rounded-3xl bg-gradient-to-b from-emerald-500 via-emerald-600 to-green-700 hover:from-emerald-400 hover:to-green-600 text-white font-black shadow-[0_8px_25px_rgba(16,185,129,0.45)] border-2 border-emerald-300/70 transition-all duration-200 active:scale-95 cursor-pointer group flex flex-col items-center justify-center text-center overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
            <div className="w-11 h-11 rounded-2xl bg-white/20 border border-white/40 flex items-center justify-center text-xl shadow-inner mb-2 group-hover:scale-110 transition-transform">
              <Play size={22} fill="currentColor" className="ml-1" />
            </div>
            <div className="text-sm sm:text-base font-black tracking-wide drop-shadow line-clamp-1">
              {i18n.t('quickPlay')}
            </div>
            <div className="text-[10px] sm:text-[11px] text-emerald-100 font-medium mt-0.5 line-clamp-1">
              {isAr ? 'رهان وتحدي فوري' : 'Staked AI Match'}
            </div>
          </button>

          {/* 2. Hotspot Friends Tournament (2 to 4 Players) */}
          <button
            onClick={() => {
              sounds.playClick();
              if (onOpenHotspotTournament) onOpenHotspotTournament();
              else onOpenHotspot();
            }}
            className="relative p-3.5 sm:p-4 rounded-3xl bg-gradient-to-b from-amber-500 via-orange-600 to-rose-700 hover:from-amber-400 hover:to-orange-500 text-white font-black shadow-[0_8px_25px_rgba(245,158,11,0.5)] border-2 border-amber-300/80 transition-all duration-200 active:scale-95 cursor-pointer group flex flex-col items-center justify-center text-center overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
            <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full bg-red-600 text-[9px] font-black tracking-wider text-white shadow animate-pulse">
              {isAr ? '2-4 لاعبين' : '2-4 P'}
            </div>
            <div className="w-11 h-11 rounded-2xl bg-white/20 border border-white/40 flex items-center justify-center text-xl shadow-inner mb-2 group-hover:scale-110 transition-transform">
              <Users size={22} className="text-yellow-200" />
            </div>
            <div className="text-sm sm:text-base font-black tracking-wide drop-shadow line-clamp-1">
              {isAr ? 'بطولة الهوتسبوت' : 'Hotspot Tourney'}
            </div>
            <div className="text-[10px] sm:text-[11px] text-amber-100 font-medium mt-0.5 line-clamp-1">
              {isAr ? 'بين الأصدقاء (أقصى 4)' : 'Friends (Max 4)'}
            </div>
          </button>

          {/* 3. Cups Tournament (32 Contenders) */}
          <button
            onClick={() => { sounds.playClick(); onOpenTournament(); }}
            className="relative p-3.5 sm:p-4 rounded-3xl bg-gradient-to-b from-sky-500 via-sky-600 to-blue-700 hover:from-sky-400 hover:to-blue-600 text-white font-black shadow-[0_8px_25px_rgba(14,165,233,0.45)] border-2 border-sky-300/70 transition-all duration-200 active:scale-95 cursor-pointer group flex flex-col items-center justify-center text-center overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
            <div className="w-11 h-11 rounded-2xl bg-white/20 border border-white/40 flex items-center justify-center text-xl shadow-inner mb-2 group-hover:scale-110 transition-transform">
              <Trophy size={22} className="text-yellow-300" />
            </div>
            <div className="text-sm sm:text-base font-black tracking-wide drop-shadow line-clamp-1">
              {i18n.t('tournament')}
            </div>
            <div className="text-[10px] sm:text-[11px] text-sky-100 font-medium mt-0.5 line-clamp-1">
              {isAr ? '32 لاعباً (جوائز 5000)' : '32 Contenders'}
            </div>
          </button>

          {/* 4. Hotspot 1v1 & Pass-and-Play */}
          <button
            onClick={() => { sounds.playClick(); onOpenHotspot(); }}
            className="relative p-3.5 sm:p-4 rounded-3xl bg-gradient-to-b from-teal-500 via-teal-600 to-cyan-700 hover:from-teal-400 hover:to-cyan-600 text-white font-black shadow-[0_8px_25px_rgba(20,184,166,0.45)] border-2 border-teal-300/70 transition-all duration-200 active:scale-95 cursor-pointer group flex flex-col items-center justify-center text-center overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
            <div className="w-11 h-11 rounded-2xl bg-white/20 border border-white/40 flex items-center justify-center text-xl shadow-inner mb-2 group-hover:scale-110 transition-transform">
              <Wifi size={22} className="text-cyan-200" />
            </div>
            <div className="text-sm sm:text-base font-black tracking-wide drop-shadow line-clamp-1">
              {isAr ? 'شبكة وتحدي محلي' : 'Local 1v1'}
            </div>
            <div className="text-[10px] sm:text-[11px] text-teal-100 font-medium mt-0.5 line-clamp-1">
              {isAr ? 'هوتسبوت أو هاتف واحد' : 'Hotspot & Pass'}
            </div>
          </button>
        </div>

        {/* AI & Practice Bar */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-2">
          <div className="relative">
            <button
              onClick={() => { sounds.playClick(); setShowAiPicker(!showAiPicker); }}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900/95 border border-slate-700 hover:border-purple-400 text-xs font-bold text-slate-200 flex items-center gap-2 cursor-pointer shadow transition"
            >
              <Bot size={15} className="text-purple-400" />
              <span>{i18n.t('difficulty')}:</span>
              <span className="text-amber-400 uppercase font-black">{selectedDifficulty}</span>
            </button>

            {showAiPicker && (
              <div className="absolute bottom-11 left-1/2 -translate-x-1/2 z-50 p-2 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl flex flex-col gap-1 w-44 animate-fade-in text-left">
                {(['beginner', 'easy', 'normal', 'pro', 'legend'] as AIDifficulty[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => {
                      sounds.playClick();
                      setSelectedDifficulty(d);
                      setShowAiPicker(false);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                      selectedDifficulty === d ? 'bg-purple-600 text-white' : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <span>{d}</span>
                    <span>{AI_PERSONAS[d].avatar}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => { sounds.playClick(); onStartMatch('practice', 'solo'); }}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900/95 border border-slate-700 hover:border-emerald-400 text-xs font-bold text-emerald-300 flex items-center gap-1.5 cursor-pointer shadow transition"
          >
            <Target size={14} className="text-emerald-400" />
            <span>{i18n.t('practiceMode')}</span>
          </button>
        </div>
      </div>

      {/* Bottom Dock Bar */}
      <div className="relative z-10 w-full max-w-5xl mx-auto flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
        <div className="flex items-center gap-2">
          <button
            onClick={() => { sounds.playClick(); onOpenProfile(); }}
            className="p-2.5 rounded-2xl bg-slate-900/95 border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            title="Settings"
          >
            <Settings size={18} />
          </button>

          <div 
            onClick={() => { sounds.playClick(); onOpenShop(); }}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-900/95 border border-slate-700 hover:border-amber-400/60 cursor-pointer transition"
          >
            <div
              className="w-5 h-5 rounded-lg flex items-center justify-center text-xs shadow"
              style={{
                background: `linear-gradient(135deg, ${equippedCue.primaryColor}, ${equippedCue.accentColor})`
              }}
            >
              ⚡
            </div>
            <div className="text-left leading-tight">
              <div className="text-[11px] font-black text-white truncate max-w-[100px]">
                {isAr ? (equippedCue.arabicName || equippedCue.name) : equippedCue.name}
              </div>
              <div className="text-[9px] text-amber-400 font-bold">
                {equippedCue.power}/5 PWR
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => { sounds.playClick(); onOpenShop(); }}
          className="flex items-center gap-2.5 px-6 sm:px-8 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-black text-sm sm:text-base shadow-[0_6px_25px_rgba(16,185,129,0.4)] border-2 border-emerald-300/60 transition-all active:scale-95 cursor-pointer"
        >
          <ShoppingBag size={20} className="text-white" />
          <span>{i18n.t('cuesStore')}</span>
        </button>

        <div className="flex items-center gap-2">
          <div 
            onClick={() => { sounds.playClick(); onOpenProfile(); }}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-slate-900/95 border-2 border-slate-700 hover:border-slate-500 transition shadow-xl cursor-pointer group"
            title={i18n.t('profileTitle')}
          >
            <div className="text-right leading-tight hidden xs:block">
              <div className="text-xs font-black text-white group-hover:text-emerald-300 transition flex items-center justify-end gap-1">
                <span>{profile.name}</span>
              </div>
              <div className="text-[10px] text-amber-400 font-mono font-bold">
                {i18n.t('level')} {profile.level} ⭐
              </div>
            </div>
          </div>

          <button
            onClick={() => { 
              sounds.playClick(); 
              if (onOpenAvatarPicker) onOpenAvatarPicker(); 
              else onOpenProfile(); 
            }}
            className="relative flex items-center gap-2 px-2 py-1 rounded-2xl bg-gradient-to-r from-emerald-950/80 to-slate-900/95 border-2 border-emerald-400/80 hover:border-emerald-300 shadow-[0_4px_16px_rgba(16,185,129,0.3)] hover:scale-103 transition-all cursor-pointer group"
            title={i18n.t('editProfilePic')}
          >
            <div className="relative">
              <CartoonAvatar
                avatar={profile.avatar}
                size="md"
                className="border-2 border-emerald-400 shadow-md group-hover:scale-105 transition-transform"
              />
              <span className="absolute -bottom-1 -left-1 w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-[9px] font-black shadow ring-1 ring-slate-900">
                ✎
              </span>
            </div>
            <div className="text-left flex flex-col justify-center">
              <span className="text-[11px] font-black text-emerald-400 tracking-tight flex items-center gap-1">
                <RefreshCw size={11} className="text-emerald-400" />
                <span>{lang === 'ar' ? 'تبديل الصورة' : 'Change Avatar'}</span>
              </span>
              <span className="text-[9px] text-slate-400 font-medium hidden sm:inline">
                {lang === 'ar' ? 'شخصيات كرتونية' : 'Cartoon Pic'}
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
