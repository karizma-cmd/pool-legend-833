/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Banknote, 
  Check, 
  Lock, 
  Zap, 
  Target, 
  RotateCw, 
  X, 
  Sparkles, 
  Flame,
  LayoutGrid,
  Palette
} from 'lucide-react';
import { PlayerProfile, CueItem, TableSkin } from '../game/types';
import { storage } from '../game/storage';
import { sounds } from '../game/audio';
import { i18n, Language } from '../game/i18n';

interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PlayerProfile;
  onProfileUpdate: (newProfile: PlayerProfile) => void;
  onTableChange?: (tableSkin: TableSkin) => void;
}

const TIER_CONFIG: Record<string, { labelAr: string; labelEn: string; bg: string; text: string; border: string }> = {
  starter: { labelAr: 'بداية', labelEn: 'Starter', bg: 'bg-slate-800/80', text: 'text-slate-300', border: 'border-slate-700' },
  common: { labelAr: 'شائع', labelEn: 'Common', bg: 'bg-sky-950/60', text: 'text-sky-300', border: 'border-sky-500/40' },
  rare: { labelAr: 'نادر', labelEn: 'Rare', bg: 'bg-cyan-950/60', text: 'text-cyan-300', border: 'border-cyan-500/40' },
  epic: { labelAr: 'ملحمي', labelEn: 'Epic', bg: 'bg-purple-950/60', text: 'text-purple-300', border: 'border-purple-500/40' },
  legendary: { labelAr: 'أسطوري', labelEn: 'Legendary', bg: 'bg-amber-950/60', text: 'text-amber-300', border: 'border-amber-500/50' },
  mythic: { labelAr: 'خرافي', labelEn: 'Mythic', bg: 'bg-rose-950/60', text: 'text-rose-300', border: 'border-rose-500/50' },
};

export const ShopModal: React.FC<ShopModalProps> = ({
  isOpen,
  onClose,
  profile,
  onProfileUpdate,
  onTableChange,
}) => {
  const [activeTab, setActiveTab] = useState<'cues' | 'tables'>('cues');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [cues, setCues] = useState<CueItem[]>(() => storage.getCues());
  const [tables, setTables] = useState<TableSkin[]>(() => storage.getTables());
  const [purchaseError, setPurchaseError] = useState<string>('');
  const [successToast, setSuccessToast] = useState<string>('');
  const [lang, setLang] = useState<Language>(() => i18n.getLanguage());

  useEffect(() => {
    return i18n.subscribe(l => setLang(l));
  }, []);

  // Sync cues and tables whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setCues(storage.getCues());
      setTables(storage.getTables());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isAr = lang === 'ar';

  // Equip Cue
  const handleEquipCue = (cueId: string) => {
    sounds.playClick();
    const updated = { ...profile, selectedCueId: cueId };
    storage.saveProfile(updated);
    onProfileUpdate(updated);
    const cue = cues.find(c => c.id === cueId);
    const cueName = isAr ? (cue?.arabicName || cue?.name) : (cue?.name || cue?.arabicName);
    setSuccessToast(isAr ? `تم تجهيز: ${cueName}` : `Equipped: ${cueName}`);
    setTimeout(() => setSuccessToast(''), 2500);
  };

  // Buy Cue
  const handleBuyCue = (cue: CueItem) => {
    if (profile.coins < cue.price) {
      const diff = cue.price - profile.coins;
      setPurchaseError(
        isAr
          ? `رصيدك غير كافٍ! تحتاج إلى ${diff.toLocaleString()} كوينز إضافية.`
          : `Not enough coins! You need ${diff.toLocaleString()} more coins.`
      );
      sounds.playFoul();
      setTimeout(() => setPurchaseError(''), 4000);
      return;
    }

    const success = storage.unlockCue(cue.id);
    if (success) {
      sounds.playVictory();
      setCues(storage.getCues());
      const updatedProfile = storage.getProfile();
      updatedProfile.selectedCueId = cue.id;
      storage.saveProfile(updatedProfile);
      onProfileUpdate(updatedProfile);
      const cueName = isAr ? (cue.arabicName || cue.name) : cue.name;
      setSuccessToast(
        isAr 
          ? `تهانينا! تم شراء وتجهيز ${cueName} بنجاح! 🎱` 
          : `Congratulations! Purchased and equipped ${cueName}! 🎱`
      );
      setTimeout(() => setSuccessToast(''), 3000);
    }
  };

  // Equip Table
  const handleEquipTable = (table: TableSkin) => {
    sounds.playClick();
    const updated = {
      ...profile,
      selectedTableFelt: table.id,
      selectedTableFrame: table.id,
    };
    storage.saveProfile(updated);
    onProfileUpdate(updated);
    onTableChange?.(table);
    const tableName = isAr ? (table.arabicName || table.name) : table.name;
    setSuccessToast(isAr ? `تم تجهيز طاولة: ${tableName}` : `Equipped table: ${tableName}`);
    setTimeout(() => setSuccessToast(''), 2500);
  };

  // Buy Table
  const handleBuyTable = (table: TableSkin) => {
    if (profile.coins < table.price) {
      const diff = table.price - profile.coins;
      setPurchaseError(
        isAr
          ? `رصيدك غير كافٍ! تحتاج إلى ${diff.toLocaleString()} كوينز إضافية لشراء هذه الطاولة.`
          : `Not enough coins! You need ${diff.toLocaleString()} more coins to purchase this table.`
      );
      sounds.playFoul();
      setTimeout(() => setPurchaseError(''), 4000);
      return;
    }

    const success = storage.unlockTable(table.id);
    if (success) {
      sounds.playVictory();
      const updatedTables = storage.getTables();
      setTables(updatedTables);
      const updatedProfile = storage.getProfile();
      updatedProfile.selectedTableFelt = table.id;
      updatedProfile.selectedTableFrame = table.id;
      storage.saveProfile(updatedProfile);
      onProfileUpdate(updatedProfile);
      onTableChange?.(table);
      const tableName = isAr ? (table.arabicName || table.name) : table.name;
      setSuccessToast(
        isAr
          ? `تهانينا! تم شراء وتجهيز ${tableName} بنجاح! 🟩`
          : `Congratulations! Purchased and equipped ${tableName}! 🟩`
      );
      setTimeout(() => setSuccessToast(''), 3000);
    }
  };

  const filteredCues = cues.filter(cue => {
    if (tierFilter === 'all') return true;
    return cue.tier === tierFilter;
  });

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md select-none animate-fade-in"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-700/80 shadow-2xl p-3 sm:p-5 flex flex-col overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 right-1/4 w-72 h-36 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-72 h-36 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 sm:p-2.5 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-600/10 text-emerald-400 border border-emerald-500/30 shadow-inner">
              <ShoppingBag size={22} className="sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-xl font-black text-white tracking-wide">
                  {isAr ? 'المتجر الملكي (عصي & طاولات)' : 'Pro Billiards Pro Shop'}
                </h2>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 font-medium line-clamp-1">
                {isAr ? 'تخصيص عصي البلياردو الاحترافية وأشكال طاولات اللعب الفاخرة' : 'Equip custom cues and premium table felt & frame designs.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Live Cash Banknote Balance Pill */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-emerald-500/20 to-green-500/10 border border-emerald-500/40 text-emerald-300 font-mono-numbers text-xs sm:text-sm font-black shadow">
              <Banknote size={16} className="text-emerald-400 animate-pulse" />
              <span>{profile.coins.toLocaleString()}</span>
              <span className="text-[10px] font-bold text-emerald-400/80">{isAr ? 'كوينز' : 'Coins'}</span>
            </div>

            <button
              onClick={() => { sounds.playClick(); onClose(); }}
              className="p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Top Category Tabs: Cues vs Tables */}
        <div className="flex rounded-2xl bg-slate-950 p-1 my-2 border border-slate-800 text-xs sm:text-sm font-bold shrink-0">
          <button
            onClick={() => { sounds.playClick(); setActiveTab('cues'); }}
            className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'cues'
                ? 'bg-gradient-to-r from-sky-600 to-sky-500 text-white shadow-lg font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap size={15} />
            <span>{isAr ? 'عصي البلياردو الاحترافية' : 'Cue Sticks'}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">{cues.length}</span>
          </button>
          <button
            onClick={() => { sounds.playClick(); setActiveTab('tables'); }}
            className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'tables'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-lg font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Palette size={15} />
            <span>{isAr ? 'أشكال طاولات اللعب الفاخرة' : 'Table Felt & Frames'}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">{tables.length}</span>
          </button>
        </div>

        {/* Feedback Notifications */}
        {purchaseError && (
          <div className="mb-2 p-2 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs font-semibold text-center animate-fade-in flex items-center justify-center gap-2 shrink-0">
            <span>⚠️</span>
            <span>{purchaseError}</span>
          </div>
        )}
        {successToast && (
          <div className="mb-2 p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs font-semibold text-center animate-fade-in flex items-center justify-center gap-2 shrink-0">
            <span>✨</span>
            <span>{successToast}</span>
          </div>
        )}

        {/* TAB 1: CUES SECTION */}
        {activeTab === 'cues' && (
          <>
            {/* Rarity Tier Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto w-full pb-1 mb-2 text-[10px] font-bold shrink-0">
              {[
                { id: 'all', label: i18n.t('allTiers') },
                { id: 'starter', label: isAr ? 'عادي' : 'Starter' },
                { id: 'common', label: isAr ? 'شائع' : 'Common' },
                { id: 'rare', label: isAr ? 'نادر' : 'Rare' },
                { id: 'epic', label: isAr ? 'ملحمي' : 'Epic' },
                { id: 'legendary', label: isAr ? 'أسطوري' : 'Legendary' },
                { id: 'mythic', label: isAr ? 'خرافي' : 'Mythic' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => { sounds.playClick(); setTierFilter(f.id); }}
                  className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
                    tierFilter === f.id
                      ? 'bg-gradient-to-r from-sky-600 to-sky-500 text-white border border-sky-400/50 shadow'
                      : 'bg-slate-950 text-slate-400 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Cues Grid */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {filteredCues.map((cue) => {
                  const isEquipped = profile.selectedCueId === cue.id;
                  const canAfford = profile.coins >= cue.price;
                  const cueName = isAr ? (cue.arabicName || cue.name) : cue.name;
                  const tierInfo = TIER_CONFIG[cue.tier || 'common'] || TIER_CONFIG.common;

                  return (
                    <div
                      key={cue.id}
                      className={`p-3 rounded-2xl border transition-all duration-200 flex flex-col justify-between group ${
                        isEquipped
                          ? 'bg-gradient-to-b from-sky-950/70 via-slate-900 to-slate-950 border-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.25)] ring-1 ring-sky-400/40'
                          : cue.unlocked
                          ? 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                          : 'bg-slate-950/50 border-slate-850 hover:border-slate-800'
                      }`}
                    >
                      <div>
                        {/* Header: Title + Tier Badge */}
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <div className="overflow-hidden">
                            <h3 className="font-black text-xs sm:text-sm text-white truncate group-hover:text-amber-300 transition">
                              {cueName}
                            </h3>
                            <div className="text-[10px] text-slate-400 font-medium line-clamp-1">
                              {isAr ? cue.arabicDescription : cue.description}
                            </div>
                          </div>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider shrink-0 border ${tierInfo.bg} ${tierInfo.text} ${tierInfo.border}`}>
                            {isAr ? tierInfo.labelAr : tierInfo.labelEn}
                          </span>
                        </div>

                        {/* Equipped Badge */}
                        {isEquipped && (
                          <div className="mb-1">
                            <span className="px-1.5 py-0.5 rounded-full bg-sky-500 text-slate-950 text-[9px] font-black uppercase tracking-wider flex items-center gap-0.5 inline-flex shadow">
                              <Check size={10} /> {i18n.t('equipped')}
                            </span>
                          </div>
                        )}

                        {/* Visual Cue Stick Representation */}
                        <div className="relative w-full my-2 p-0.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center shadow-inner">
                          <div
                            className="w-full h-2 rounded-md transition-all duration-300 group-hover:brightness-110"
                            style={{
                              background: `linear-gradient(90deg, ${cue.primaryColor} 0%, ${cue.accentColor} 50%, ${cue.primaryColor} 100%)`,
                              boxShadow: `0 0 8px ${cue.accentColor}30`,
                            }}
                          />
                        </div>

                        {/* Compact Stats Badges in One Single Row */}
                        <div className="flex items-center justify-between gap-1 px-2 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-[10px] font-mono-numbers mb-2">
                          <span className="flex items-center gap-1 text-amber-300 font-bold" title={i18n.t('powerStat')}>
                            <Zap size={11} className="text-amber-400" />
                            <span>{cue.power}/5</span>
                          </span>
                          <span className="text-slate-600">|</span>
                          <span className="flex items-center gap-1 text-sky-300 font-bold" title={i18n.t('aimStat')}>
                            <Target size={11} className="text-sky-400" />
                            <span>{cue.aimLength}/5</span>
                          </span>
                          <span className="text-slate-600">|</span>
                          <span className="flex items-center gap-1 text-emerald-300 font-bold" title={i18n.t('spinStat')}>
                            <RotateCw size={11} className="text-emerald-400" />
                            <span>{cue.spinControl}/5</span>
                          </span>
                        </div>
                      </div>

                      {/* Action Button */}
                      {cue.unlocked ? (
                        <button
                          onClick={() => handleEquipCue(cue.id)}
                          disabled={isEquipped}
                          className={`w-full py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                            isEquipped
                              ? 'bg-slate-800 text-slate-400 cursor-default border border-slate-700/60'
                              : 'bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white shadow active:scale-98'
                          }`}
                        >
                          {isEquipped ? i18n.t('equipped') : i18n.t('equipThisCue')}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBuyCue(cue)}
                          className={`w-full py-1.5 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 shadow transition cursor-pointer active:scale-98 ${
                            canAfford
                              ? 'bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 text-slate-950'
                              : 'bg-slate-800 text-slate-400 hover:bg-slate-750 border border-slate-700'
                          }`}
                        >
                          <Lock size={12} />
                          <Banknote size={13} />
                          <span>{cue.price.toLocaleString()}</span>
                          {!canAfford && (
                            <span className="text-[10px] text-red-400 font-normal">
                              ({ (cue.price - profile.coins).toLocaleString() } {isAr ? 'ناقص' : 'needed'})
                            </span>
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* TAB 2: DISTINCTIVE TABLES SECTION */}
        {activeTab === 'tables' && (
          <div className="flex-1 overflow-y-auto pr-1 space-y-2">
            <div className="text-[11px] font-bold text-slate-400 flex items-center justify-between px-1 mb-1">
              <span>{isAr ? 'أشكال طاولات اللعب المميزة (الجوخ + إطار الخشب):' : 'Select a custom table felt and rail design:'}</span>
              <span className="text-emerald-400 font-mono text-[10px]">{tables.length} {isAr ? 'طاولات متاحة' : 'Tables Available'}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {tables.map((table) => {
                const isEquipped = profile.selectedTableFelt === table.id;
                const canAfford = profile.coins >= table.price;
                const tableName = isAr ? (table.arabicName || table.name) : table.name;

                return (
                  <div
                    key={table.id}
                    className={`p-3.5 rounded-2xl border transition-all duration-200 flex flex-col justify-between group ${
                      isEquipped
                        ? 'bg-gradient-to-b from-emerald-950/70 via-slate-900 to-slate-950 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] ring-1 ring-emerald-400/40'
                        : table.unlocked
                        ? 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                        : 'bg-slate-950/50 border-slate-850 hover:border-slate-800'
                    }`}
                  >
                    <div>
                      {/* Table Header */}
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <div className="overflow-hidden">
                          <h3 className="font-black text-xs sm:text-sm text-white truncate group-hover:text-emerald-300 transition">
                            {tableName}
                          </h3>
                        </div>
                        {isEquipped && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[9px] font-black uppercase tracking-wider flex items-center gap-0.5 shadow">
                            <Check size={10} /> {isAr ? 'نشطة حالياً' : 'Active'}
                          </span>
                        )}
                      </div>

                      {/* Realistic Mini Table Preview */}
                      <div 
                        className="relative w-full h-24 rounded-xl border-4 shadow-inner flex items-center justify-center overflow-hidden mb-3"
                        style={{
                          backgroundColor: table.feltColor,
                          borderColor: table.frameColor,
                          boxShadow: `inset 0 0 15px rgba(0,0,0,0.6), 0 0 10px ${table.accentColor}25`,
                        }}
                      >
                        {/* 6 Miniature Pockets */}
                        <div className="absolute top-1 left-1 w-3.5 h-3.5 rounded-full bg-slate-950 border border-amber-500/80 shadow" />
                        <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-slate-950 border border-amber-500/80 shadow" />
                        <div className="absolute bottom-1 left-1 w-3.5 h-3.5 rounded-full bg-slate-950 border border-amber-500/80 shadow" />
                        <div className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-slate-950 border border-amber-500/80 shadow" />
                        <div className="absolute top-1/2 -translate-y-1/2 left-0.5 w-3 h-3 rounded-full bg-slate-950 border border-amber-500/80 shadow" />
                        <div className="absolute top-1/2 -translate-y-1/2 right-0.5 w-3 h-3 rounded-full bg-slate-950 border border-amber-500/80 shadow" />

                        {/* Table Center Felt Texture and Decorative Line */}
                        <div className="w-16 h-8 rounded-full border border-white/20 flex items-center justify-center">
                          <span className="text-[10px] font-mono font-black text-white/70">8BP</span>
                        </div>
                      </div>

                      {/* Table Specifications Pill */}
                      <div className="flex items-center justify-between text-[10px] text-slate-400 bg-slate-900/80 rounded-lg p-2 border border-slate-800 mb-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full shadow" style={{ backgroundColor: table.feltColor }} />
                          <span className="text-slate-300 font-bold">{isAr ? 'لون الجوخ' : 'Felt'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded shadow" style={{ backgroundColor: table.frameColor }} />
                          <span className="text-slate-300 font-bold">{isAr ? 'الإطار' : 'Frame'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Table Action Button */}
                    {table.unlocked ? (
                      <button
                        onClick={() => handleEquipTable(table)}
                        disabled={isEquipped}
                        className={`w-full py-2 rounded-xl font-bold text-xs transition cursor-pointer ${
                          isEquipped
                            ? 'bg-slate-800 text-slate-400 cursor-default border border-slate-700/60'
                            : 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 text-white shadow-lg active:scale-98'
                        }`}
                      >
                        {isEquipped ? (isAr ? 'الطاولة مجهزة' : 'Equipped') : (isAr ? 'تجهيز هذه الطاولة' : 'Equip Table')}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBuyTable(table)}
                        className={`w-full py-2 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 shadow transition cursor-pointer active:scale-98 ${
                          canAfford
                            ? 'bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 text-slate-950 font-black'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-750 border border-slate-700'
                        }`}
                      >
                        <Lock size={12} />
                        <Banknote size={14} />
                        <span>{table.price.toLocaleString()}</span>
                        {!canAfford && (
                          <span className="text-[10px] text-red-400 font-normal">
                            ({ (table.price - profile.coins).toLocaleString() } {isAr ? 'ناقص' : 'needed'})
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
