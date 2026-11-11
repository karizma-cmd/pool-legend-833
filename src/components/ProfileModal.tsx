/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  Trophy, 
  Award, 
  X, 
  Edit2, 
  Check, 
  Smile, 
  Sparkles,
  Star,
  CheckCircle2,
  RefreshCw,
  Camera,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { PlayerProfile } from '../game/types';
import { storage, Achievement } from '../game/storage';
import { CARTOON_CHARACTERS, CartoonCharacter } from '../game/characters';
import { CartoonAvatar } from './CartoonAvatar';
import { sounds } from '../game/audio';
import { i18n, Language } from '../game/i18n';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PlayerProfile;
  onProfileUpdate: (profile: PlayerProfile) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onProfileUpdate,
}) => {
  const [tab, setTab] = useState<'avatars' | 'stats' | 'achievements'>('avatars');
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile.name);
  const [achievements] = useState<Achievement[]>(() => storage.getAchievements());
  const [lang, setLang] = useState<Language>(() => i18n.getLanguage());
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return i18n.subscribe(l => setLang(l));
  }, []);

  if (!isOpen) return null;

  const isAr = lang === 'ar';
  const totalMatches = profile.matchesWon + profile.matchesLost;
  const winRate = totalMatches > 0 ? Math.round((profile.matchesWon / totalMatches) * 100) : 0;
  const xpNeeded = profile.level * 250;
  const xpPercent = Math.min(100, Math.round((profile.xp / xpNeeded) * 100));

  // Find active character if matched
  const activeChar = CARTOON_CHARACTERS.find(c => c.avatar === profile.avatar);

  const handleSaveName = () => {
    if (!nameInput.trim()) return;
    const updated = { ...profile, name: nameInput.trim() };
    storage.saveProfile(updated);
    onProfileUpdate(updated);
    setIsEditingName(false);
    sounds.playClick();
  };

  const handleSelectCharacter = (char: CartoonCharacter) => {
    const updated = { ...profile, avatar: char.avatar };
    storage.saveProfile(updated);
    onProfileUpdate(updated);
    sounds.playClick();
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const size = 256;
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const minDim = Math.min(img.width, img.height);
            const startX = (img.width - minDim) / 2;
            const startY = (img.height - minDim) / 2;
            ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, size, size);
            const compressed = canvas.toDataURL('image/jpeg', 0.85);
            sounds.playVictory();
            const updated = { ...profile, avatar: compressed };
            storage.saveProfile(updated);
            onProfileUpdate(updated);
          }
        } catch {
          const raw = event.target?.result as string;
          const updated = { ...profile, avatar: raw };
          storage.saveProfile(updated);
          onProfileUpdate(updated);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto select-none" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="relative w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl p-4 sm:p-6 my-auto max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-inner">
              <User size={22} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
                {i18n.t('profileTitle')}
              </h2>
              <p className="text-xs text-slate-400">
                {i18n.t('profileSubtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={() => { sounds.playClick(); onClose(); }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Profile Card & Avatar Switcher Highlight */}
        <div className="my-3 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-slate-850 via-slate-900 to-slate-950 border border-slate-700/80 shadow-lg shrink-0">
          <div className="flex items-center gap-3.5 mb-2.5">
            {/* Active Cartoon Avatar with Edit Badge */}
            <div 
              className="relative group cursor-pointer"
              onClick={() => { sounds.playClick(); setTab('avatars'); }}
              title={i18n.t('editProfilePic')}
            >
              <CartoonAvatar
                avatar={profile.avatar}
                size="xl"
                className="border-2 border-emerald-400 shadow-xl group-hover:scale-105 transition-transform"
              />
              <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-md bg-emerald-500 text-slate-950 text-[9px] font-black shadow flex items-center gap-0.5">
                <RefreshCw size={9} className="animate-spin" />
                <span>{i18n.t('editProfilePic')}</span>
              </span>
            </div>

            {/* Name & Title & Active Character info */}
            <div className="flex-1 min-w-0">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    maxLength={16}
                    className="bg-slate-950 border border-sky-500 rounded-lg px-2.5 py-1 text-sm text-white font-bold w-full"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveName}
                    className="p-1.5 rounded-lg bg-sky-600 text-white hover:bg-sky-500 cursor-pointer"
                    title={i18n.t('saveName')}
                  >
                    <Check size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black text-white truncate">{profile.name}</h3>
                  <button
                    onClick={() => { setNameInput(profile.name); setIsEditingName(true); sounds.playClick(); }}
                    className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                    title={i18n.t('editName')}
                  >
                    <Edit2 size={13} />
                  </button>
                </div>
              )}

              <div className="text-xs font-bold text-sky-400 flex items-center gap-2 mt-0.5">
                <span>{i18n.t('level')} {profile.level}</span>
                <span className="text-slate-500">·</span>
                <span className="text-amber-400 font-mono font-bold">
                  {profile.coins.toLocaleString()} {i18n.t('coins')}
                </span>
              </div>

              {activeChar && (
                <div className="text-[11px] text-emerald-400 font-bold truncate mt-0.5">
                  {isAr ? activeChar.nameAr : activeChar.nameEn} · {isAr ? activeChar.titleAr : activeChar.specialty}
                </div>
              )}
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-bold text-slate-400">
              <span>{i18n.t('xpProgress')}</span>
              <span className="font-mono">{profile.xp} / {xpNeeded} XP ({xpPercent}%)</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-sky-500 to-emerald-400 rounded-full transition-all"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex rounded-2xl bg-slate-950 p-1 mb-3 border border-slate-800 text-xs sm:text-sm font-bold shrink-0">
          <button
            onClick={() => { sounds.playClick(); setTab('avatars'); }}
            className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              tab === 'avatars' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smile size={15} />
            <span>{i18n.t('cartoonCharactersTab')} ({CARTOON_CHARACTERS.length})</span>
          </button>
          <button
            onClick={() => { sounds.playClick(); setTab('stats'); }}
            className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              tab === 'stats' ? 'bg-sky-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Star size={15} />
            <span>{i18n.t('statsTab')}</span>
          </button>
          <button
            onClick={() => { sounds.playClick(); setTab('achievements'); }}
            className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              tab === 'achievements' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Trophy size={15} />
            <span>{i18n.t('achievementsTab')}</span>
          </button>
        </div>

        {/* Hidden File Input for Phone Album */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoUpload}
        />

        {/* Tab 1: Cartoon Avatars Selector & Phone Album Upload */}
        {tab === 'avatars' && (
          <div className="flex-1 overflow-y-auto pr-1 space-y-2.5">
            {/* Phone Gallery Upload Banner */}
            <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/40 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <ImageIcon size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white">
                    {isAr ? 'صورة خاصة من ألبوم الهاتف' : 'Photo from Phone Album'}
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    {isAr ? 'يمكنك وضع صورتك الحقيقية من معرض الصور' : 'Upload your own photo from your camera roll'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => { sounds.playClick(); fileInputRef.current?.click(); }}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white text-xs font-black shadow transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <Upload size={13} />
                <span>{isAr ? 'فتح المعرض' : 'Open Album'}</span>
              </button>
            </div>

            <div className="text-[11px] font-bold text-slate-400 flex items-center justify-between px-1">
              <span>{i18n.t('chooseCartoonAvatar')}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {CARTOON_CHARACTERS.map((char) => {
                const isSelected = profile.avatar === char.avatar;

                return (
                  <div
                    key={char.id}
                    onClick={() => handleSelectCharacter(char)}
                    className={`relative p-2.5 rounded-2xl border transition-all duration-200 flex items-center gap-2.5 cursor-pointer group ${
                      isSelected
                        ? 'bg-gradient-to-r from-emerald-500/25 to-slate-900 border-emerald-400 ring-2 ring-emerald-400/60 shadow-lg scale-102'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                    }`}
                  >
                    {/* Cartoon Avatar */}
                    <div className="relative shrink-0">
                      <CartoonAvatar
                        characterId={char.id}
                        avatar={char.avatar}
                        size="md"
                        className="shadow group-hover:scale-105 transition-transform"
                      />
                      {isSelected && (
                        <span className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-[10px] font-black shadow">
                          ✓
                        </span>
                      )}
                    </div>

                    {/* Details */}
                    <div className="overflow-hidden flex-1">
                      <div className="text-xs font-black text-white truncate flex items-center justify-between">
                        <span>{isAr ? char.nameAr : char.nameEn}</span>
                        {isSelected && (
                          <span className="text-[8px] px-1 py-0.2 rounded bg-emerald-500/30 text-emerald-300 font-bold">
                            {i18n.t('active')}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-amber-400 font-semibold truncate">
                        {isAr ? char.titleAr : char.specialty}
                      </div>
                      <div className="text-[9px] text-slate-400 font-medium truncate mt-0.5">
                        {char.accessory}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Career Stats */}
        {tab === 'stats' && (
          <div className="flex-1 overflow-y-auto pr-1 space-y-3">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
                <div className="text-xs text-slate-400 font-bold">{i18n.t('totalMatches')}</div>
                <div className="text-xl font-black text-white mt-1 font-mono">{totalMatches}</div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
                <div className="text-xs text-slate-400 font-bold">{i18n.t('winRate')}</div>
                <div className="text-xl font-black text-emerald-400 mt-1 font-mono">{winRate}%</div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
                <div className="text-xs text-slate-400 font-bold">{i18n.t('matchesWon')}</div>
                <div className="text-xl font-black text-sky-400 mt-1 font-mono">{profile.matchesWon}</div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
                <div className="text-xs text-slate-400 font-bold">{i18n.t('ballsPotted')}</div>
                <div className="text-xl font-black text-amber-400 mt-1 font-mono">{profile.ballsPottedTotal}</div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
                <div className="text-xs text-slate-400 font-bold">{i18n.t('winStreak')}</div>
                <div className="text-xl font-black text-rose-400 mt-1 font-mono">{profile.highestStreak} 🔥</div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
                <div className="text-xs text-slate-400 font-bold">{i18n.t('tournamentsWon')}</div>
                <div className="text-xl font-black text-yellow-400 mt-1 font-mono">{profile.tournamentsWon} 🏆</div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Trophies & Achievements */}
        {tab === 'achievements' && (
          <div className="flex-1 overflow-y-auto pr-1 space-y-2">
            {achievements.map((ach) => (
              <div
                key={ach.id}
                className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                  ach.unlocked
                    ? 'bg-slate-900 border-amber-500/40 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800/80 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl p-2 rounded-xl bg-slate-950 border border-slate-800">
                    {ach.icon}
                  </div>
                  <div>
                    <div className="text-xs font-black text-white">{ach.title}</div>
                    <div className="text-[10px] text-slate-400">{ach.desc}</div>
                  </div>
                </div>
                <div className="text-xs font-black text-amber-400 font-mono flex items-center gap-1 shrink-0">
                  <span>+{ach.rewardCoins}</span>
                  <span>🪙</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
