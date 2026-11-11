/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Smile, 
  X, 
  Check, 
  Sparkles, 
  Shield, 
  User, 
  Zap, 
  Star,
  RefreshCw,
  Image as ImageIcon,
  Camera,
  Upload,
  Trash2
} from 'lucide-react';
import { PlayerProfile } from '../game/types';
import { storage } from '../game/storage';
import { CARTOON_CHARACTERS, CartoonCharacter } from '../game/characters';
import { CartoonAvatar } from './CartoonAvatar';
import { sounds } from '../game/audio';
import { i18n, Language } from '../game/i18n';

interface AvatarPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PlayerProfile;
  onProfileUpdate: (updatedProfile: PlayerProfile) => void;
}

export const AvatarPickerModal: React.FC<AvatarPickerModalProps> = ({
  isOpen,
  onClose,
  profile,
  onProfileUpdate,
}) => {
  const [lang, setLang] = useState<Language>(() => i18n.getLanguage());
  const [selectedAvatar, setSelectedAvatar] = useState<string>(profile.avatar);
  const [successToast, setSuccessToast] = useState<string>('');
  const [isProcessingPhoto, setIsProcessingPhoto] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return i18n.subscribe(l => setLang(l));
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSelectedAvatar(profile.avatar);
    }
  }, [isOpen, profile.avatar]);

  if (!isOpen) return null;

  const isAr = lang === 'ar';
  const isCustomPhoto = selectedAvatar && (
    selectedAvatar.startsWith('data:image/') || 
    selectedAvatar.startsWith('http') || 
    selectedAvatar.startsWith('blob:')
  );
  const activeChar = CARTOON_CHARACTERS.find(c => c.avatar === selectedAvatar) || CARTOON_CHARACTERS[0];

  const handleSelectCharacter = (char: CartoonCharacter) => {
    sounds.playClick();
    setSelectedAvatar(char.avatar);
    const updated = { ...profile, avatar: char.avatar };
    storage.saveProfile(updated);
    onProfileUpdate(updated);

    const charName = isAr ? char.nameAr : char.nameEn;
    setSuccessToast(isAr ? `تم اختيار شخصية: ${charName} بنجاح!` : `Avatar updated to: ${charName}!`);
    setTimeout(() => setSuccessToast(''), 2500);
  };

  // Process and crop photo from phone album / gallery
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingPhoto(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        try {
          // Crop and scale to crisp 256x256 square
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
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);

            sounds.playVictory();
            setSelectedAvatar(compressedDataUrl);
            const updated = { ...profile, avatar: compressedDataUrl };
            storage.saveProfile(updated);
            onProfileUpdate(updated);

            setSuccessToast(isAr ? 'تم تعيين صورتك من ألبوم الهاتف بنجاح!' : 'Phone gallery photo set as profile picture!');
            setTimeout(() => setSuccessToast(''), 3000);
          }
        } catch {
          // Fallback direct url if canvas fails
          const rawUrl = event.target?.result as string;
          setSelectedAvatar(rawUrl);
          const updated = { ...profile, avatar: rawUrl };
          storage.saveProfile(updated);
          onProfileUpdate(updated);
        } finally {
          setIsProcessingPhoto(false);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleResetToCartoon = () => {
    sounds.playClick();
    const defaultChar = CARTOON_CHARACTERS[0];
    setSelectedAvatar(defaultChar.avatar);
    const updated = { ...profile, avatar: defaultChar.avatar };
    storage.saveProfile(updated);
    onProfileUpdate(updated);
    setSuccessToast(isAr ? 'تمت العودة للشخصيات الكرتونية!' : 'Switched back to cartoon avatar!');
    setTimeout(() => setSuccessToast(''), 2500);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto select-none"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="relative w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-700/90 shadow-[0_0_50px_rgba(0,0,0,0.85)] p-4 sm:p-6 my-auto max-h-[92vh] flex flex-col overflow-hidden animate-fade-in">
        {/* Hidden File Input for Phone Album Gallery */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoUpload}
        />

        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 text-emerald-400 border border-emerald-500/30 shadow-inner">
              <Smile size={24} />
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-black text-white tracking-wide flex items-center gap-2">
                <span>{isAr ? 'تعديل صورة البروفيل المصغرة' : 'Edit Profile Avatar'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                  {isAr ? 'ألبوم الهاتف + شخصيات' : 'Gallery + Cartoons'}
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                {isAr ? 'اختر صورة من ألبوم صور هاتفك أو شخصية كرتونية مميزة' : 'Pick a photo from your phone gallery or choose a cartoon avatar'}
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

        {/* Active Avatar Preview Banner */}
        <div className="my-3 p-3.5 rounded-2xl bg-gradient-to-r from-slate-850 via-slate-900 to-slate-950 border border-slate-700/80 shadow-lg flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Big Active Avatar Preview */}
            <div className="relative shrink-0">
              <CartoonAvatar
                avatar={selectedAvatar}
                characterId={isCustomPhoto ? undefined : activeChar.id}
                size="xl"
                className="border-3 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
              />
              <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-md bg-emerald-500 text-slate-950 text-[9px] font-black shadow flex items-center gap-0.5">
                <Check size={10} />
                <span>{isAr ? 'نشط' : 'Active'}</span>
              </span>
            </div>

            {/* Character or Photo Info */}
            <div className="overflow-hidden">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-white truncate">
                  {isCustomPhoto 
                    ? (isAr ? 'صورتك الشخصية (ألبوم الهاتف)' : 'Your Photo (Phone Gallery)') 
                    : (isAr ? activeChar.nameAr : activeChar.nameEn)}
                </h3>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  {isCustomPhoto ? (isAr ? 'صورة خاصة' : 'Custom') : (isAr ? 'شخصية' : 'Cartoon')}
                </span>
              </div>
              <div className="text-xs text-amber-400 font-semibold truncate mt-0.5">
                {isCustomPhoto 
                  ? (isAr ? 'تم استيرادها من معرض الصور الخاص بك' : 'Imported from your photo library') 
                  : (isAr ? activeChar.titleAr : activeChar.specialty)}
              </div>
            </div>
          </div>

          <div className="hidden sm:flex flex-col items-end text-right">
            <span className="text-[11px] text-slate-400">{isAr ? 'اسم اللاعب:' : 'Player Name:'}</span>
            <span className="text-sm font-black text-emerald-400">{profile.name}</span>
            <span className="text-[10px] text-amber-400 font-bold">{isAr ? 'المستوى' : 'Level'} {profile.level} ⭐</span>
          </div>
        </div>

        {/* Upload from Phone Album Card */}
        <div className="mb-3 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-sky-950/40 border border-emerald-500/40 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300 shrink-0">
              <ImageIcon size={20} />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                <span>{isAr ? 'اختيار صورة من ألبوم الصور (المعرض)' : 'Choose Photo from Phone Album'}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                  {isAr ? 'صلاحية الوصول متاحة' : 'Gallery Access'}
                </span>
              </h4>
              <p className="text-[11px] text-slate-300">
                {isAr ? 'ضع صورتك الحقيقية أو أي صورة تحبها من هاتفك مباشرة' : 'Upload your real photo or any image from your camera roll'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                sounds.playClick();
                fileInputRef.current?.click();
              }}
              disabled={isProcessingPhoto}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white text-xs font-black shadow-lg flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              {isProcessingPhoto ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
              <span>{isProcessingPhoto ? (isAr ? 'جاري المعالجة...' : 'Processing...') : (isAr ? 'فتح ألبوم الهاتف' : 'Open Gallery')}</span>
            </button>

            {isCustomPhoto && (
              <button
                onClick={handleResetToCartoon}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                title={isAr ? 'العودة للشخصيات الكرتونية' : 'Reset to cartoon'}
              >
                <Trash2 size={13} className="text-rose-400" />
                <span className="hidden sm:inline">{isAr ? 'إزالة' : 'Remove'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Success Feedback Toast */}
        {successToast && (
          <div className="mb-2.5 p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs font-bold text-center animate-fade-in flex items-center justify-center gap-1.5 shrink-0">
            <span>✓</span>
            <span>{successToast}</span>
          </div>
        )}

        {/* Cartoon Characters Gallery Grid */}
        <div className="flex-1 overflow-y-auto pr-1">
          <div className="text-[11px] font-bold text-slate-400 mb-2 px-1 flex items-center justify-between">
            <span>{isAr ? 'انقر على أي شخصية كرتونية لتطبيقها فوراً كصورة لبروفايلك:' : 'Click any cartoon character to immediately apply as your profile picture:'}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {CARTOON_CHARACTERS.map((char) => {
              const isSelected = selectedAvatar === char.avatar;

              return (
                <div
                  key={char.id}
                  onClick={() => handleSelectCharacter(char)}
                  className={`relative p-2.5 rounded-2xl border transition-all duration-200 flex items-center gap-2.5 cursor-pointer group ${
                    isSelected
                      ? 'bg-gradient-to-r from-emerald-500/25 to-slate-900 border-emerald-400 ring-2 ring-emerald-400/60 shadow-lg scale-102'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
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

                  {/* Character Details */}
                  <div className="overflow-hidden flex-1">
                    <div className="text-xs font-black text-white truncate flex items-center justify-between">
                      <span>{isAr ? char.nameAr : char.nameEn}</span>
                      {isSelected && (
                        <span className="text-[8px] px-1.5 py-0.2 rounded bg-emerald-500/30 text-emerald-300 font-bold">
                          {isAr ? 'مختار' : 'Equipped'}
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

        {/* Bottom Actions */}
        <div className="pt-3 mt-2 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={() => { sounds.playClick(); onClose(); }}
            className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 text-white font-black text-xs sm:text-sm shadow-xl flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer"
          >
            <Check size={16} />
            <span>{isAr ? 'تم وحفظ الصورة المصغرة' : 'Done & Apply Avatar'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
