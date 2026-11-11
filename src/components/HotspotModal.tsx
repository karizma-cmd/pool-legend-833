/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  QrCode, 
  Smartphone, 
  Copy, 
  Check, 
  ArrowRight, 
  X, 
  Users, 
  HelpCircle,
  Play,
  Camera,
  Share2,
  RefreshCw,
  Trophy,
  Coins
} from 'lucide-react';
import { multiplayer } from '../game/multiplayer';
import { sounds } from '../game/audio';
import { storage } from '../game/storage';
import { i18n, Language } from '../game/i18n';
import { QRScannerModal } from './QRScannerModal';

interface HotspotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartHotspotGame: (role: 'host' | 'guest', stakeAmount?: number, stakeLabel?: string) => void;
  onStartPassAndPlay: (p1Name: string, p2Name: string, stakeAmount?: number, stakeLabel?: string) => void;
  onOpenHotspotTournament?: () => void;
}

export const HotspotModal: React.FC<HotspotModalProps> = ({
  isOpen,
  onClose,
  onStartHotspotGame,
  onStartPassAndPlay,
  onOpenHotspotTournament,
}) => {
  const [activeTab, setActiveTab] = useState<'hotspot' | 'pass_play' | 'guide'>('hotspot');
  const [lang, setLang] = useState<Language>(() => i18n.getLanguage());
  
  // Stake selection for friends match (0, 250, 1500, 2500, 10000)
  const [selectedStake, setSelectedStake] = useState<number>(0);
  const [selectedStakeLabel, setSelectedStakeLabel] = useState<string>('0');
  
  // Host state
  const [hostRoomCode, setHostRoomCode] = useState<string>('');
  const [hostQrUrl, setHostQrUrl] = useState<string>('');
  const [guestAnswerInput, setGuestAnswerInput] = useState<string>('');
  const [isCreatingRoom, setIsCreatingRoom] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Scanner modal state
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);

  // Guest state
  const [guestInputOffer, setGuestInputOffer] = useState<string>('');
  const [guestAnswerCode, setGuestAnswerCode] = useState<string>('');
  const [guestQrUrl, setGuestQrUrl] = useState<string>('');
  const [isJoining, setIsJoining] = useState<boolean>(false);

  // Pass and Play names
  const [p1Name, setP1Name] = useState<string>('Player 1');
  const [p2Name, setP2Name] = useState<string>('Player 2');

  const [errorMessage, setErrorMessage] = useState<string>('');

  const FRIEND_STAKES = [
    { value: 0, label: '0', titleAr: 'مجاني', titleEn: 'Free' },
    { value: 50, label: '50', titleAr: '50', titleEn: '50' },
    { value: 250, label: '250', titleAr: '250', titleEn: '250' },
    { value: 1500, label: '1,500', titleAr: '1,500', titleEn: '1,500' },
    { value: 2500, label: '2,500', titleAr: '2,500', titleEn: '2,500' },
    { value: 10000, label: '10,000', titleAr: '10,000', titleEn: '10,000' },
  ];

  const userCoins = storage.getProfile().coins;

  const renderStakeSelector = () => (
    <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs text-amber-400 font-extrabold flex items-center gap-1.5">
          <Coins size={14} className="text-amber-400" />
          <span>{isAr ? 'مبلغ الرهان للمباراة:' : 'Match Bet Amount:'}</span>
        </label>
        <span className="text-[11px] text-slate-400 font-bold">
          {isAr ? `رصيدك: ${userCoins.toLocaleString()} كوينز` : `Balance: ${userCoins.toLocaleString()}`}
        </span>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
        {FRIEND_STAKES.map((stk) => {
          const isSelected = selectedStake === stk.value;
          const isTooExpensive = stk.value > 0 && userCoins < stk.value;
          return (
            <button
              key={stk.value}
              type="button"
              disabled={isTooExpensive}
              onClick={() => {
                sounds.playClick();
                setSelectedStake(stk.value);
                setSelectedStakeLabel(stk.label);
              }}
              className={`py-1.5 px-1 rounded-xl text-xs font-black transition flex flex-col items-center justify-center cursor-pointer ${
                isSelected
                  ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-300'
                  : isTooExpensive
                  ? 'bg-slate-900/60 text-slate-600 border border-slate-800 cursor-not-allowed'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              <span>{isAr ? stk.titleAr : stk.titleEn}</span>
              {stk.value > 0 && <span className="text-[9px] opacity-80">{isAr ? 'كوينز' : 'coins'}</span>}
            </button>
          );
        })}
      </div>
      {selectedStake > 0 ? (
        <div className="mt-2 text-[10px] text-emerald-400 font-medium bg-emerald-950/40 border border-emerald-500/20 rounded-lg p-1.5 text-center">
          {isAr 
            ? `⚡ في حال الفوز: تربح ضعف الرهان (+${(selectedStake * 2).toLocaleString()}) ولا يُخصم منك شيء! في حال الخسارة: يُخصم فقط (-${selectedStake.toLocaleString()}).`
            : `⚡ On win: Double stake won (+${(selectedStake * 2).toLocaleString()}) and 0 deducted! On loss: stake lost (-${selectedStake.toLocaleString()}).`}
        </div>
      ) : (
        <div className="mt-2 text-[10px] text-slate-400 font-medium text-center">
          {isAr ? 'مباراة ودية مجانية (بدون رهان كوينز)' : 'Free friendly match (no stake)'}
        </div>
      )}
    </div>
  );

  useEffect(() => {
    return i18n.subscribe(l => setLang(l));
  }, []);

  // Auto-start match immediately as soon as peer connection is established on Host or Guest side
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      if (multiplayer.isConnected()) {
        sounds.playRack();
        const rawRole = multiplayer.getRole();
        const role: 'host' | 'guest' = (rawRole === 'host' || rawRole === 'guest') ? rawRole : (hostRoomCode ? 'host' : 'guest');
        onStartHotspotGame(role, selectedStake, selectedStakeLabel);
        onClose();
      }
    }, 250);
    return () => clearInterval(interval);
  }, [isOpen, hostRoomCode, selectedStake, selectedStakeLabel, onStartHotspotGame, onClose]);

  if (!isOpen) return null;

  const isAr = lang === 'ar';

  // 1. Host creates room with 6-character code
  const handleCreateRoom = async () => {
    try {
      sounds.playClick();
      setIsCreatingRoom(true);
      setErrorMessage('');
      const { roomCode, qrUrl } = await multiplayer.createRoom();
      setHostRoomCode(roomCode);
      setHostQrUrl(qrUrl);
    } catch (err: any) {
      setErrorMessage(err?.message || (isAr ? 'فشل إنشاء الغرفة المحلية' : 'Failed to initialize local hotspot room'));
    } finally {
      setIsCreatingRoom(false);
    }
  };

  // 2. Guest connects to Host's room code or scanned data
  const handleJoinWithCodeOrData = async (data: string) => {
    try {
      sounds.playClick();
      setIsJoining(true);
      setErrorMessage('');
      const { answerCode, qrUrl } = await multiplayer.joinRoom(data);
      setGuestAnswerCode(answerCode);
      setGuestQrUrl(qrUrl);
      setIsScannerOpen(false);

      // If connected via server signaling or BroadcastChannel, auto start!
      if (multiplayer.isConnected()) {
        onStartHotspotGame('guest', selectedStake, selectedStakeLabel);
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err?.message || (isAr ? 'رمز غرفة غير صالح. يرجى التأكد والمحاولة مجدداً.' : 'Invalid room code. Please verify and try again.'));
    } finally {
      setIsJoining(false);
    }
  };

  // 3. Host confirms Guest Answer
  const handleAcceptGuestAnswer = async () => {
    if (!guestAnswerInput.trim()) return;
    try {
      sounds.playClick();
      setErrorMessage('');
      await multiplayer.acceptGuestAnswer(guestAnswerInput);
      onStartHotspotGame('host', selectedStake, selectedStakeLabel);
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || (isAr ? 'فشل إتمام الاتصال المباشر.' : 'Failed to complete direct connection.'));
    }
  };

  const copyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    sounds.playClick();
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyShortLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?room=${hostRoomCode}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    sounds.playClick();
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto select-none"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl p-5 sm:p-6 my-auto max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Wifi size={22} />
              </div>
              <div>
                <h2 className="text-base sm:text-xl font-black text-white tracking-wide">
                  {isAr ? 'اللعب مع صديق أوفلاين' : 'Play with Friend (Offline)'}
                </h2>
                <p className="text-xs text-slate-400">
                  {isAr ? 'لعب مشترك عبر نقطة اتصال الهوتسبوت بدون أي إنترنت' : 'Play together over local Wi-Fi / Hotspot with 0 internet'}
                </p>
              </div>
            </div>
            <button
              onClick={() => { sounds.playClick(); onClose(); }}
              className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Hotspot Tournament Special Banner */}
          {onOpenHotspotTournament && (
            <button
              onClick={() => { sounds.playClick(); onClose(); onOpenHotspotTournament(); }}
              className="mt-3 py-2.5 px-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 text-slate-950 font-black text-xs shadow-md flex items-center justify-between transition active:scale-95 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Trophy size={16} fill="currentColor" />
                <span>{isAr ? '🏆 تنظيم بطولة الأصدقاء عبر الهوتسبوت (2 - 4 لاعبين)' : '🏆 Host Friends Tournament (2 - 4 Players)'}</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-950 text-amber-300 font-bold uppercase">
                {isAr ? 'دخول' : 'ENTER'}
              </span>
            </button>
          )}

          {/* Tab Selection */}
          <div className="flex rounded-2xl bg-slate-950 p-1 my-3 border border-slate-800 text-xs sm:text-sm font-semibold">
            <button
              onClick={() => { sounds.playClick(); setActiveTab('hotspot'); }}
              className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'hotspot' ? 'bg-sky-600 text-white shadow-lg font-black' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone size={15} /> {isAr ? 'هاتفين (هوتسبوت)' : '2 Phones Hotspot'}
            </button>
            <button
              onClick={() => { sounds.playClick(); setActiveTab('pass_play'); }}
              className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'pass_play' ? 'bg-emerald-600 text-white shadow-lg font-black' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users size={15} /> {isAr ? 'هاتف واحد (Pass & Play)' : 'Pass & Play (1 Phone)'}
            </button>
            <button
              onClick={() => { sounds.playClick(); setActiveTab('guide'); }}
              className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer ${
                activeTab === 'guide' ? 'bg-amber-600 text-white shadow-lg font-black' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <HelpCircle size={15} /> {isAr ? 'الشرح' : 'Guide'}
            </button>
          </div>

          {errorMessage && (
            <div className="mb-3 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs text-center font-bold">
              {errorMessage}
            </div>
          )}

          {/* Tab 1: Hotspot Direct P2P */}
          {activeTab === 'hotspot' && (
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
              {/* Stake Selector for 2-phone match */}
              {renderStakeSelector()}

              {/* Mode selection: Host or Guest */}
              <div className="grid grid-cols-2 gap-3">
                {/* Host Box (Phone 1) */}
                <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-sky-400 text-xs sm:text-sm font-bold mb-1">
                      <Wifi size={15} /> {isAr ? 'الهاتف 1 (إنشاء)' : 'Phone 1 (Host)'}
                    </div>
                    <p className="text-[11px] text-slate-400 mb-2.5">
                      {isAr ? 'إنشاء غرفة محلية برمز 6 أحرف' : 'Create room with 6-digit code'}
                    </p>
                  </div>
                  <button
                    onClick={handleCreateRoom}
                    disabled={isCreatingRoom}
                    className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-black shadow-md transition active:scale-95 cursor-pointer"
                  >
                    {isCreatingRoom
                      ? (isAr ? 'جاري الإنشاء...' : 'Creating...')
                      : hostRoomCode
                      ? (isAr ? 'رمز جديد' : 'New Code')
                      : (isAr ? 'إنشاء الغرفة' : 'Create Room')}
                  </button>
                </div>

                {/* Guest Box (Phone 2) - Directly opens Camera on Click! */}
                <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-emerald-400 text-xs sm:text-sm font-bold mb-1">
                      <Camera size={15} /> {isAr ? 'الهاتف 2 (انضمام)' : 'Phone 2 (Join)'}
                    </div>
                    <p className="text-[11px] text-slate-400 mb-2.5">
                      {isAr ? 'مسح رمز QR بالكاميرا مباشرة' : 'Scan QR code with camera'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      sounds.playClick();
                      setIsScannerOpen(true);
                    }}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 text-white text-xs font-black shadow-md flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                  >
                    <Camera size={14} />
                    <span>{isAr ? 'JOIN ROOM (كاميرا)' : 'JOIN ROOM'}</span>
                  </button>
                </div>
              </div>

              {/* Host Section active */}
              {hostRoomCode && (
                <div className="p-4 rounded-2xl bg-slate-950/90 border border-sky-500/40 text-center animate-fade-in">
                  <span className="inline-block px-3 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-[11px] font-black uppercase tracking-wider mb-2">
                    {isAr ? 'الغرفة نشطة وجاهزة' : 'Host Room Active'}
                  </span>

                  {/* Prominent 6-Character Room Code */}
                  <div className="my-2 p-3 rounded-2xl bg-slate-900 border border-sky-400/50 flex flex-col items-center justify-center shadow-lg">
                    <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">
                      {isAr ? 'رمز الغرفة (6 خانات):' : 'Room Code (6 Characters):'}
                    </span>
                    <div className="text-3xl sm:text-4xl font-mono font-black text-amber-400 tracking-[0.25em] py-1">
                      {hostRoomCode}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        onClick={() => copyCode(hostRoomCode)}
                        className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                      >
                        {copiedCode ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                        <span>{copiedCode ? (isAr ? 'تم النسخ' : 'Copied!') : (isAr ? 'نسخ الرمز' : 'Copy Code')}</span>
                      </button>
                      <button
                        onClick={copyShortLink}
                        className="px-3 py-1 rounded-lg bg-sky-900/60 hover:bg-sky-800 text-sky-300 text-xs font-bold flex items-center gap-1 border border-sky-500/30 transition cursor-pointer"
                        title="Copy short link"
                      >
                        {copiedLink ? <Check size={14} className="text-emerald-400" /> : <Share2 size={14} />}
                        <span>{copiedLink ? (isAr ? 'تم نسخ الرابط' : 'Link Copied!') : (isAr ? 'نسخ الرابط القصير' : 'Short Link')}</span>
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 mb-2">
                    {isAr ? 'أو دع صديقك يوجّه كاميرا هاتفه نحو رمز QR التالي:' : 'Or let Friend scan this QR code with their camera:'}
                  </p>

                  {hostQrUrl && (
                    <div className="flex justify-center mb-3">
                      <div className="p-2.5 bg-white rounded-2xl shadow-2xl">
                        <img src={hostQrUrl} alt="Room QR Code" className="w-44 h-44 sm:w-48 sm:h-48 object-contain" />
                      </div>
                    </div>
                  )}

                  {/* Accept guest answer step if offline manual exchange */}
                  <div className="pt-3 border-t border-slate-800 text-left rtl:text-right">
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      {isAr ? 'إذا كنتما أوفلاين كلياً: أدخل رمز رد الصديق (إن وجد):' : 'Offline Direct: Paste Friend\'s Answer Code (if offline):'}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder={isAr ? 'رمز الرد من الهاتف 2...' : 'Answer code from Phone 2...'}
                        value={guestAnswerInput}
                        onChange={(e) => setGuestAnswerInput(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                      <button
                        onClick={handleAcceptGuestAnswer}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition flex items-center gap-1 cursor-pointer"
                      >
                        <span>{isAr ? 'اتصال' : 'Connect'}</span>
                        <ArrowRight size={14} className="rtl:rotate-180" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Guest Section without Host code active */}
              {!hostRoomCode && (
                <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <Camera size={28} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white">
                        {isAr ? 'انضم للمباراة فوراً بالكاميرا أو الرمز' : 'Join Match Instantly with Camera or Code'}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                        {isAr ? 'انقر على الزر الأخضر بالأسفل لفتح الكاميرا ومسح شاشة صديقك' : 'Tap below to open camera and scan Friend\'s screen'}
                      </p>
                    </div>
                    <button
                      onClick={() => { sounds.playClick(); setIsScannerOpen(true); }}
                      className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 text-white text-sm font-extrabold shadow-xl flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
                    >
                      <Camera size={18} />
                      <span>{isAr ? 'فتح الكاميرا لمسح الرمز (JOIN ROOM)' : 'Open Camera to Scan QR (JOIN ROOM)'}</span>
                    </button>
                  </div>

                  {/* Manual 6-character code fallback */}
                  <div className="mt-4 pt-4 border-t border-slate-800">
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">
                      {isAr ? 'أو أدخل رمز الغرفة المكون من 6 أرقام:' : 'Or enter 6-digit room code:'}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={8}
                        placeholder="ABC123"
                        value={guestInputOffer}
                        onChange={(e) => setGuestInputOffer(e.target.value.toUpperCase())}
                        className="flex-1 text-center uppercase tracking-widest font-mono font-black bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-amber-300"
                      />
                      <button
                        onClick={() => handleJoinWithCodeOrData(guestInputOffer)}
                        disabled={isJoining || !guestInputOffer.trim()}
                        className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-black transition cursor-pointer"
                      >
                        {isJoining ? (isAr ? 'جاري الاتصال...' : 'Joining...') : (isAr ? 'دخول' : 'Join')}
                      </button>
                    </div>
                  </div>

                  {/* Guest answer code display if manual exchange */}
                  {guestAnswerCode && (
                    <div className="mt-3 p-3 rounded-xl bg-slate-900 border border-emerald-500/30 text-center animate-fade-in">
                      <p className="text-xs text-emerald-300 font-bold mb-2">
                        {isAr ? 'تم إنشاء كود الرد! أظهره للمضيف لتأكيد الربط:' : 'Answer Generated! Show QR to Host or copy:'}
                      </p>
                      {guestQrUrl && (
                        <div className="flex justify-center mb-2">
                          <div className="p-2 bg-white rounded-xl">
                            <img src={guestQrUrl} alt="Answer QR" className="w-36 h-36 object-contain" />
                          </div>
                        </div>
                      )}
                      <button
                        onClick={() => {
                          onStartHotspotGame('guest');
                          onClose();
                        }}
                        className="w-full mt-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition cursor-pointer"
                      >
                        {isAr ? 'بدء المباراة الآن' : 'Start Match Now'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Pass & Play (Same Phone Hotseat) */}
          {activeTab === 'pass_play' && (
            <div className="flex-1 space-y-4 py-2">
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                <h3 className="text-sm font-black text-white mb-1">
                  {isAr ? 'اللعب على هاتف واحد (تمرير الهاتف)' : 'Play on 1 Phone'}
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  {isAr ? 'تبادل الأدوار والتسديد على نفس الشاشة. مثالية للعب مع صديقك بجانبك في أي مكان بدون إعدادات!' : 'Take turns shooting on the same screen. Perfect for playing with a friend anywhere without any setup!'}
                </p>

                <div className="space-y-3 mb-5">
                  <div>
                    <label className="text-xs text-slate-300 font-bold block mb-1">
                      {isAr ? 'اسم اللاعب الأول' : 'Player 1 Name'}
                    </label>
                    <input
                      type="text"
                      value={p1Name}
                      onChange={(e) => setP1Name(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-300 font-bold block mb-1">
                      {isAr ? 'اسم اللاعب الثاني' : 'Player 2 Name'}
                    </label>
                    <input
                      type="text"
                      value={p2Name}
                      onChange={(e) => setP2Name(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                    />
                  </div>
                </div>

                {/* Stake Selector for 1-phone match */}
                <div className="mb-4">
                  {renderStakeSelector()}
                </div>

                <button
                  onClick={() => {
                    sounds.playClick();
                    onStartPassAndPlay(p1Name, p2Name, selectedStake, selectedStakeLabel);
                    onClose();
                  }}
                  className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-xl flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer"
                >
                  <Play size={16} fill="currentColor" />
                  <span>{isAr ? 'بدء مباراة هاتف واحد الآن' : 'Start Pass & Play Match'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Tab 3: Easy Step-by-Step Guide */}
          {activeTab === 'guide' && (
            <div className="flex-1 overflow-y-auto space-y-3 py-2 text-xs text-slate-300 pr-1">
              <div className="p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700">
                <span className="font-black text-sky-400 text-sm block mb-1">
                  {isAr ? 'الخطوة 1: تشغيل نقطة الاتصال (Hotspot)' : 'Step 1: Turn on Hotspot'}
                </span>
                {isAr
                  ? 'يقوم اللاعب 1 بفتح إعدادات الهاتف > نقطة الاتصال المحمولة (Portable Hotspot) وتشغيلها. (لا حاجة لأي رصيد إنترنت أو بيانات خلوية إطلاقاً!).'
                  : 'Player 1 goes to Android Settings > Portable Hotspot and turns it on. (Zero mobile data or internet required!).'}
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700">
                <span className="font-black text-emerald-400 text-sm block mb-1">
                  {isAr ? 'الخطوة 2: اتصال الصديق بشبكة الواي فاي' : 'Step 2: Friend Connects'}
                </span>
                {isAr
                  ? 'يقوم اللاعب 2 بفتح الواي فاي في هاتفه والاتصال بنقطة اتصال اللاعب 1.'
                  : 'Player 2 connects to Player 1\'s Wi-Fi hotspot in settings.'}
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700">
                <span className="font-black text-amber-400 text-sm block mb-1">
                  {isAr ? 'الخطوة 3: فتح الكاميرا لمسح الرمز أو إدخال 6 خانات' : 'Step 3: Scan QR with Camera'}
                </span>
                {isAr
                  ? 'اللاعب 1 يضغط "إنشاء الغرفة"، واللاعب 2 يضغط "JOIN ROOM" لتفتح الكاميرا ويصوّر رمز QR على شاشة الهاتف الأول، وتبدأ اللعبة فوراً!'
                  : 'Player 1 taps "Create Room", and Player 2 taps "JOIN ROOM" to open the camera, point at the screen, and connect instantly!'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Live Camera QR Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={(scannedData) => {
          handleJoinWithCodeOrData(scannedData);
        }}
      />
    </>
  );
};
