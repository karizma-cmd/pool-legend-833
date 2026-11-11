/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  X, 
  Play, 
  Sparkles, 
  RefreshCw, 
  Banknote, 
  Swords,
  Crown,
  CheckCircle2,
  Lock,
  Flame,
  Users
} from 'lucide-react';
import { TournamentMatch, TournamentRound, PlayerProfile } from '../game/types';
import { sounds } from '../game/audio';
import { i18n, Language } from '../game/i18n';

interface TournamentModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PlayerProfile;
  currentRound: TournamentRound;
  matches: TournamentMatch[];
  onStartTournamentMatch: (opponentName: string, round: TournamentRound) => void;
  onResetTournament?: () => void;
  onOpenGift?: () => void;
}

export const TournamentModal: React.FC<TournamentModalProps> = ({
  isOpen,
  onClose,
  profile,
  currentRound,
  matches,
  onStartTournamentMatch,
  onResetTournament,
  onOpenGift,
}) => {
  const [selectedRoundTab, setSelectedRoundTab] = useState<TournamentRound>(currentRound);
  const [lang, setLang] = useState<Language>(() => i18n.getLanguage());

  useEffect(() => {
    return i18n.subscribe(l => setLang(l));
  }, []);

  useEffect(() => {
    setSelectedRoundTab(currentRound);
  }, [currentRound]);

  if (!isOpen) return null;

  const isAr = lang === 'ar';

  // Find active user match in current round
  const activeUserMatch = matches.find(m => m.round === currentRound && (m.player1.isUser || m.player2.isUser));
  const activeOpponent = activeUserMatch 
    ? (activeUserMatch.player1.isUser ? activeUserMatch.player2 : activeUserMatch.player1) 
    : null;

  // Filter matches for the selected tab
  const displayedMatches = matches.filter(m => m.round === selectedRoundTab);

  const getRoundTitle = (r: TournamentRound) => {
    if (r === 1) return isAr ? 'المرحلة 1: دور الـ 32 (32 متنافساً في 16 خانة)' : 'Stage 1: Round of 32 (16 Match Slots)';
    if (r === 2) return isAr ? 'المرحلة 2: ثمن النهائي / دور الـ 16 (8 خانات)' : 'Stage 2: Round of 16 (8 Match Slots)';
    if (r === 3) return isAr ? 'المرحلة 3: ربع النهائي (8 متأهلين في 4 خانات)' : 'Stage 3: Quarter-Finals (4 Match Slots)';
    if (r === 4) return isAr ? 'المرحلة 4: نصف النهائي (4 متأهلين في خانتين)' : 'Stage 4: Semi-Finals (2 Match Slots)';
    return isAr ? 'المرحلة 5: النهائي الكبير والتتويج بالكأس الأسطوري' : 'Stage 5: Grand Final Championship';
  };

  const getRoundStake = (r: TournamentRound) => {
    if (r === 3) return 2500; // Winning Quarter-Finals qualifies to Semi-Finals (2500 Coins)
    if (r === 5) return 5000; // Winning Grand Final awards Championship (5000 Coins)
    return 0; // Other stages have no coins
  };

  const roundsConfig: { round: TournamentRound; nameAr: string; nameEn: string; icon: React.ReactNode; slots: number }[] = [
    { round: 1, nameAr: 'دور 32', nameEn: 'R32', icon: <Users size={12} />, slots: 16 },
    { round: 2, nameAr: 'دور 16', nameEn: 'R16', icon: <Swords size={12} />, slots: 8 },
    { round: 3, nameAr: 'ربع النهائي', nameEn: 'Quarters', icon: <Users size={12} />, slots: 4 },
    { round: 4, nameAr: 'نصف النهائي', nameEn: 'Semis', icon: <Swords size={12} />, slots: 2 },
    { round: 5, nameAr: 'النهائي الكبير', nameEn: 'Final', icon: <Crown size={12} />, slots: 1 },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto select-none animate-fade-in"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="relative w-full max-w-3xl rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-amber-500/30 shadow-[0_0_50px_rgba(0,0,0,0.8)] p-3 sm:p-5 my-auto max-h-[94vh] flex flex-col overflow-hidden">
        
        {/* Top Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="relative p-2 sm:p-2.5 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.5)]">
              <Trophy size={24} className="text-slate-950 fill-current" />
              <Crown size={13} className="absolute -top-1.5 -right-1 text-yellow-200 fill-current animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-xl font-black text-white tracking-wide">
                  {isAr ? 'بطولة الكؤوس الكبرى (32 لاعباً)' : 'Grand Cup Championship (32 Contenders)'}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase">
                  32 PLAYERS
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                <Sparkles size={12} className="text-amber-400" />
                <span className="text-amber-300 font-bold">
                  {isAr 
                    ? 'جوائز البطولة: 2,500 كوينز عند بلوغ نصف النهائي + 5,000 كوينز عند الفوز بالبطولة' 
                    : 'Prizes: 2,500 Coins on reaching Semis + 5,000 Coins for Championship Victory'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onResetTournament && (
              <button
                onClick={() => { sounds.playClick(); onResetTournament(); }}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition active:scale-95 cursor-pointer"
                title={isAr ? 'بدء بطولة جديدة بـ 32 لاعباً جدد' : 'Start Fresh 32-Player Tournament'}
              >
                <RefreshCw size={16} />
              </button>
            )}
            <button
              onClick={() => { sounds.playClick(); onClose(); }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition active:scale-95 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* 5-Round Tournament Stages Navigation Ribbon */}
        <div className="my-2.5 grid grid-cols-5 gap-1.5 shrink-0">
          {roundsConfig.map(rc => {
            const isSelected = selectedRoundTab === rc.round;
            const isCleared = currentRound > rc.round;
            const isCurrent = currentRound === rc.round;
            const isLocked = currentRound < rc.round;

            return (
              <button
                key={rc.round}
                onClick={() => { sounds.playClick(); setSelectedRoundTab(rc.round); }}
                className={`p-1.5 sm:p-2 rounded-xl border transition-all text-center flex flex-col items-center justify-center cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-b from-amber-500/25 to-amber-950/50 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)] ring-1 ring-amber-400/50'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-black uppercase text-amber-300 truncate">
                  {rc.icon}
                  <span>{isAr ? rc.nameAr : rc.nameEn}</span>
                </div>
                <div className="text-[9px] text-slate-400 font-bold mt-0.5">
                  {isCleared ? (
                    <span className="text-emerald-400 font-black flex items-center gap-0.5">
                      <CheckCircle2 size={10} /> {isAr ? 'تمت' : 'Cleared'}
                    </span>
                  ) : isCurrent ? (
                    <span className="text-amber-400 font-black animate-pulse">
                      {rc.slots} {isAr ? 'خانات' : 'Slots'}
                    </span>
                  ) : (
                    <span className="text-slate-500 flex items-center gap-0.5">
                      <Lock size={9} /> {isAr ? 'مغلقة' : 'Locked'}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Current Round Banner Subheader */}
        <div className="mb-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span className="font-extrabold text-slate-200">
              {getRoundTitle(selectedRoundTab)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 font-bold font-mono">
            {selectedRoundTab === 3 ? (
              <span className="text-emerald-400 flex items-center gap-1 text-[11px] sm:text-xs">
                <Banknote size={15} />
                {isAr ? 'مكافأة بلوغ نصف النهائي: +2,500 كوينز 💰' : 'Semi-Finals Qualification Prize: +2,500 Coins 💰'}
              </span>
            ) : selectedRoundTab === 5 ? (
              <span className="text-yellow-400 flex items-center gap-1 text-[11px] sm:text-xs">
                <Crown size={15} />
                {isAr ? 'جائزة الفوز بالبطولة: +5,000 كوينز فقط 🏆' : 'Championship Victory Prize: +5,000 Coins only 🏆'}
              </span>
            ) : (
              <span className="text-slate-400 text-[10px] sm:text-[11px]">
                {isAr ? 'المكافأة: تأهل للدور القادم (بدون كوينز)' : 'Prize: Qualification only (No coins)'}
              </span>
            )}
          </div>
        </div>

        {/* Interactive Match Slots Container */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {displayedMatches.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-950/70 border border-slate-800 text-center text-slate-400 my-auto">
              <Lock size={36} className="mx-auto mb-2 text-slate-600" />
              <p className="text-sm font-bold text-slate-300 mb-1">
                {isAr ? 'هذه المرحلة غير مفتوحة بعد!' : 'This tournament stage is locked!'}
              </p>
              <p className="text-xs text-slate-500">
                {isAr ? 'يجب أن تفوز في الأدوار السابقة للتأهل لهذه المرحلة' : 'Win previous matches to advance your contender to this stage'}
              </p>
            </div>
          ) : (
            displayedMatches.map((m, idx) => {
              const isUserMatch = m.player1.isUser || m.player2.isUser;
              const isMatchFinished = !!m.winner;
              const isPlayableNow = isUserMatch && m.round === currentRound && !isMatchFinished;
              const matchOpponent = m.player1.isUser ? m.player2 : m.player1;

              return (
                <div
                  key={idx}
                  className={`relative rounded-2xl border transition-all overflow-hidden ${
                    isPlayableNow
                      ? 'bg-gradient-to-r from-amber-950/50 via-slate-900 to-amber-950/50 border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.35)] ring-2 ring-amber-400/50'
                      : isUserMatch
                      ? 'bg-slate-900/90 border-sky-500/70 shadow'
                      : isMatchFinished
                      ? 'bg-slate-950/80 border-slate-800/80 opacity-80'
                      : 'bg-slate-950/60 border-slate-800/60'
                  }`}
                >
                  {/* Slot Top Header Tag */}
                  <div className={`px-3 py-1 flex items-center justify-between text-xs border-b ${
                    isPlayableNow
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-amber-400 text-xs px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-700">
                        {isAr ? `الخانة ${idx + 1}` : `Slot ${idx + 1}`}
                      </span>
                      <span className="font-extrabold text-[11px] text-slate-300">
                        {m.round === 1 
                          ? (isAr ? 'دور الـ 32' : 'Round of 32 Match')
                          : m.round === 2
                          ? (isAr ? 'ثمن النهائي (دور 16)' : 'Round of 16 Match')
                          : m.round === 3
                          ? (isAr ? 'ربع النهائي' : 'Quarter-Final Match')
                          : m.round === 4
                          ? (isAr ? 'نصف النهائي' : 'Semi-Final Match')
                          : (isAr ? 'المباراة النهائية الكبرى' : 'Championship Cup Match')}
                      </span>
                    </div>

                    {isMatchFinished ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-500/40 flex items-center gap-1">
                        <CheckCircle2 size={12} className="text-emerald-400" />
                        <span>{isAr ? `تأهل: ${m.winner}` : `Winner: ${m.winner}`}</span>
                      </span>
                    ) : isPlayableNow ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black animate-pulse shadow flex items-center gap-1">
                        <Flame size={12} className="fill-slate-950" />
                        <span>{isAr ? 'مباراتك الحالية!' : 'Your Match!'}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-bold">
                        {isAr ? 'مباراة قادمة' : 'Upcoming'}
                      </span>
                    )}
                  </div>

                  {/* Competitor Boxes vs Clash View */}
                  <div className="p-2.5 sm:p-3.5">
                    <div className="grid grid-cols-11 gap-2 items-center">
                      
                      {/* Player 1 Box */}
                      <div className={`col-span-5 p-2 sm:p-2.5 rounded-2xl border transition-all ${
                        m.winner === m.player1.name
                          ? 'bg-emerald-950/40 border-emerald-400/80 text-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                          : m.player1.isUser
                          ? 'bg-sky-950/50 border-sky-400 text-white shadow'
                          : isMatchFinished
                          ? 'bg-slate-950/60 border-slate-800 text-slate-500 line-through'
                          : 'bg-slate-900/80 border-slate-700/80 text-slate-200'
                      }`}>
                        <div className="flex items-center gap-2">
                          <span className="text-xl sm:text-2xl shrink-0 p-1 rounded-xl bg-slate-950/50 border border-white/10">
                            {m.player1.avatar}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-black truncate">
                                {m.player1.name}
                              </span>
                              {m.player1.isUser && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 text-[9px] font-black shrink-0">
                                  {isAr ? 'أنت' : 'You'}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                              <span>{m.player1.isUser ? `${isAr ? 'المستوى' : 'Level'} ${profile.level}` : (isAr ? 'منافس' : 'Contender')}</span>
                            </div>
                          </div>
                        </div>

                        {/* Status Label */}
                        <div className="mt-1.5 pt-1.5 border-t border-white/5 flex items-center justify-between text-[10px]">
                          {m.winner === m.player1.name ? (
                            <span className="text-emerald-400 font-black flex items-center gap-1">
                              <Trophy size={11} /> {isAr ? 'تأهل' : 'Qualified'}
                            </span>
                          ) : isMatchFinished ? (
                            <span className="text-rose-400/80 font-bold">
                              {isAr ? 'أُقصي' : 'Eliminated'}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium">
                              {m.player1.isUser ? (isAr ? 'جاهز' : 'Ready') : (isAr ? 'منافس' : 'Contender')}
                            </span>
                          )}
                          <span className="font-mono font-bold text-slate-300">
                            {m.winner === m.player1.name ? '1' : isMatchFinished ? '0' : '-'}
                          </span>
                        </div>
                      </div>

                      {/* Center Clash VS Emblem */}
                      <div className="col-span-1 flex flex-col items-center justify-center">
                        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-black text-[10px] sm:text-xs shadow-md border ${
                          isPlayableNow
                            ? 'bg-amber-500 text-slate-950 border-yellow-300 animate-pulse'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                          VS
                        </div>
                      </div>

                      {/* Player 2 Box */}
                      <div className={`col-span-5 p-2 sm:p-2.5 rounded-2xl border transition-all ${
                        m.winner === m.player2.name
                          ? 'bg-emerald-950/40 border-emerald-400/80 text-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                          : m.player2.isUser
                          ? 'bg-sky-950/50 border-sky-400 text-white shadow'
                          : isMatchFinished
                          ? 'bg-slate-950/60 border-slate-800 text-slate-500 line-through'
                          : 'bg-slate-900/80 border-slate-700/80 text-slate-200'
                      }`}>
                        <div className="flex items-center gap-2">
                          <span className="text-xl sm:text-2xl shrink-0 p-1 rounded-xl bg-slate-950/50 border border-white/10">
                            {m.player2.avatar}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-black truncate">
                                {m.player2.name}
                              </span>
                              {m.player2.isUser && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 text-[9px] font-black shrink-0">
                                  {isAr ? 'أنت' : 'You'}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                              <span>{m.player2.isUser ? `${isAr ? 'المستوى' : 'Level'} ${profile.level}` : (isAr ? 'منافس' : 'Contender')}</span>
                            </div>
                          </div>
                        </div>

                        {/* Status Label */}
                        <div className="mt-1.5 pt-1.5 border-t border-white/5 flex items-center justify-between text-[10px]">
                          {m.winner === m.player2.name ? (
                            <span className="text-emerald-400 font-black flex items-center gap-1">
                              <Trophy size={11} /> {isAr ? 'تأهل' : 'Qualified'}
                            </span>
                          ) : isMatchFinished ? (
                            <span className="text-rose-400/80 font-bold">
                              {isAr ? 'أُقصي' : 'Eliminated'}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium">
                              {m.player2.isUser ? (isAr ? 'جاهز' : 'Ready') : (isAr ? 'منافس' : 'Contender')}
                            </span>
                          )}
                          <span className="font-mono font-bold text-slate-300">
                            {m.winner === m.player2.name ? '1' : isMatchFinished ? '0' : '-'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Prominent Direct Play Button in this Active Slot */}
                    {isPlayableNow && (
                      <div className="mt-2.5 pt-2.5 border-t border-amber-500/40 flex flex-col sm:flex-row items-center justify-between gap-2">
                        <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                          <Flame size={14} className="text-amber-400 fill-amber-400" />
                          <span>{isAr ? `مواجهتك في هذه الخانة ضد ${matchOpponent.name}` : `Your match against ${matchOpponent.name}`}</span>
                        </div>
                        <button
                          onClick={() => {
                            sounds.playClick();
                            onStartTournamentMatch(matchOpponent.name, currentRound);
                            onClose();
                          }}
                          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 text-slate-950 font-black text-xs shadow-[0_0_20px_rgba(245,158,11,0.6)] flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
                        >
                          <Play size={14} fill="currentColor" />
                          <span>{isAr ? 'العب في هذه الخانة الآن 🏆' : 'Play Match in this Slot Now'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Actions Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
          {activeOpponent && !activeUserMatch?.winner ? (
            <button
              onClick={() => {
                sounds.playClick();
                onStartTournamentMatch(activeOpponent.name, currentRound);
                onClose();
              }}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-[0_0_25px_rgba(245,158,11,0.5)] flex items-center gap-2 transition active:scale-95 cursor-pointer"
            >
              <Play size={16} fill="currentColor" />
              <span>{isAr ? `بدء مباراتك ضد ${activeOpponent.name} 🎱` : `Play Match vs ${activeOpponent.name}`}</span>
            </button>
          ) : (
            <div className="text-xs text-slate-400">
              {currentRound === 5 && activeUserMatch?.winner === profile.name ? (
                <span className="text-emerald-400 font-black flex items-center gap-1.5">
                  <Crown size={14} className="text-yellow-400" />
                  {isAr ? 'أنت بطل بطولة الـ 32 لاعباً! تهانينا!' : 'You conquered all 32 players! Congratulations Champion!'}
                </span>
              ) : (
                <span>{isAr ? 'تم استكمال مباريات هذا الدور بنجاح' : 'This round matches are complete'}</span>
              )}
            </div>
          )}

          <div className="flex items-center gap-2">
            {onOpenGift && (
              <button
                onClick={() => { sounds.playClick(); onOpenGift(); }}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-black text-xs border border-amber-400/40 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
              >
                <span>🎁 {isAr ? 'هدية البطولة' : 'Tournament Gift'}</span>
              </button>
            )}
            <button
              onClick={() => { sounds.playClick(); onClose(); }}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition active:scale-95 cursor-pointer"
            >
              {isAr ? 'إغلاق' : 'Close'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
