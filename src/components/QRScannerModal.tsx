/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import jsQR from 'jsqr';
import { Camera, X, RefreshCw, AlertCircle, Keyboard, Zap, Upload } from 'lucide-react';
import { sounds } from '../game/audio';
import { i18n, Language } from '../game/i18n';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (data: string) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [hasCameraError, setHasCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [showManualInput, setShowManualInput] = useState<boolean>(false);
  const [manualCode, setManualCode] = useState<string>('');
  const [lang, setLang] = useState<Language>(() => i18n.getLanguage());

  useEffect(() => {
    return i18n.subscribe(l => setLang(l));
  }, []);

  const isAr = lang === 'ar';

  const stopCamera = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try { track.stop(); } catch {}
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Continuous frame scanning loop
  const scanLoop = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.readyState >= 2) { // HAVE_CURRENT_DATA or higher
      const w = video.videoWidth;
      const h = video.videoHeight;
      if (w > 0 && h > 0) {
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(video, 0, 0, w, h);
          const imageData = ctx.getImageData(0, 0, w, h);

          // Fast pure offline QR decode
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'attemptBoth',
          });

          if (code && code.data && code.data.trim().length > 0) {
            sounds.playClick();
            if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
              try { navigator.vibrate(80); } catch {}
            }
            stopCamera();
            onScanSuccess(code.data.trim());
            return;
          }
        }
      }
    }

    animFrameRef.current = requestAnimationFrame(scanLoop);
  }, [onScanSuccess, stopCamera]);

  // Robust Progressive Multi-Tier Camera Startup
  const startCamera = useCallback(async () => {
    setHasCameraError(null);
    setIsInitializing(true);
    stopCamera();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('NO_MEDIA_DEVICES');
      }

      // Try constraints sequentially:
      // 1. Environment (back) camera
      // 2. User (front) camera
      // 3. Fallback any video stream
      const constraintTiers: MediaStreamConstraints[] = [
        { video: { facingMode: { ideal: 'environment' } }, audio: false },
        { video: { facingMode: 'environment' }, audio: false },
        { video: { facingMode: 'user' }, audio: false },
        { video: true, audio: false },
      ];

      let stream: MediaStream | null = null;
      let lastError: any = null;

      for (const constraints of constraintTiers) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          if (stream) break;
        } catch (e) {
          lastError = e;
        }
      }

      if (!stream) {
        throw lastError || new Error('CAMERA_FAILED');
      }

      streamRef.current = stream;

      if (videoRef.current) {
        const v = videoRef.current;
        v.srcObject = stream;
        v.muted = true;
        v.playsInline = true;
        v.setAttribute('playsinline', 'true');
        v.setAttribute('muted', 'true');
        v.setAttribute('autoplay', 'true');

        await v.play().catch(() => {});
        setIsInitializing(false);
        animFrameRef.current = requestAnimationFrame(scanLoop);
      }
    } catch (err: any) {
      setIsInitializing(false);
      const msg = String(err?.message || err?.name || '');
      if (msg.includes('NotAllowedError') || msg.includes('Permission') || err?.name === 'NotAllowedError') {
        setHasCameraError(
          isAr
            ? 'تم رفض إذن الكاميرا. يرجى تفعيل إذن الكاميرا من إعدادات المتصفح، أو استخدم زر "التقاط صورة" بالأسفل.'
            : 'Camera permission denied. Please allow camera access in browser settings, or use the "Take Photo" button below.'
        );
      } else {
        setHasCameraError(
          isAr
            ? 'تعذر تشغيل البث المباشر للكاميرا. يمكنك استخدام زر التقاط صورة أو إدخال الرمز المكون من 6 أرقام.'
            : 'Could not access live camera. You can snap a photo of the QR code or enter the 6-character code manually.'
        );
      }
    }
  }, [isAr, scanLoop, stopCamera]);

  // Decode QR code from a snapped photo or file upload
  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current || document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'attemptBoth',
          });

          if (code && code.data && code.data.trim().length > 0) {
            sounds.playClick();
            stopCamera();
            onScanSuccess(code.data.trim());
          } else {
            setHasCameraError(
              isAr
                ? 'لم يتم التعرف على رمز QR في الصورة. يرجى التأكد من وضوح الرمز وإعادة المحاولة.'
                : 'Could not detect QR code in photo. Please ensure good lighting and try again.'
            );
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (isOpen && !showManualInput) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, showManualInput, startCamera, stopCamera]);

  if (!isOpen) return null;

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    sounds.playClick();
    stopCamera();
    onScanSuccess(manualCode.trim().toUpperCase());
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md select-none animate-fade-in"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl p-5 sm:p-6 flex flex-col items-center overflow-hidden">
        {/* Top Header */}
        <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Camera size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                {isAr ? 'مسح رمز QR للغرفة' : 'Scan Room QR Code'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {isAr ? 'وجّه الكاميرا نحو شاشة صديقك للاتصال فوراً' : 'Point camera at Friend\'s screen to join'}
              </p>
            </div>
          </div>
          <button
            onClick={() => { sounds.playClick(); stopCamera(); onClose(); }}
            className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Hidden processing canvas & hidden file input for native camera capture */}
        <canvas ref={canvasRef} className="hidden" />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handlePhotoCapture}
        />

        {/* Viewfinder Mode vs Manual Code Mode */}
        {!showManualInput && !hasCameraError && (
          <div className="relative w-full aspect-square max-w-[320px] rounded-2xl overflow-hidden bg-slate-950 border-2 border-slate-700 flex items-center justify-center shadow-inner">
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              muted
              playsInline
              autoPlay
            />

            {/* Glowing Reticle & Laser Sweep Animation */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-6">
              <div className="relative w-full h-full border-2 border-emerald-400/70 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.35)]">
                {/* 4 Corner Targeting Marks */}
                <div className="absolute -top-1.5 -left-1.5 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                <div className="absolute -top-1.5 -right-1.5 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                <div className="absolute -bottom-1.5 -left-1.5 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />

                {/* Animated Horizontal Laser Scan Line */}
                <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-300 to-transparent shadow-[0_0_12px_rgba(52,211,153,1)] animate-bounce" />
              </div>
            </div>

            {isInitializing && (
              <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center text-emerald-400 gap-2">
                <RefreshCw size={28} className="animate-spin" />
                <span className="text-xs font-bold">{isAr ? 'جاري فتح الكاميرا...' : 'Starting Camera...'}</span>
              </div>
            )}
          </div>
        )}

        {/* Error State if Camera Blocked or Live Stream Denied */}
        {hasCameraError && (
          <div className="w-full p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs text-center space-y-3 mb-3 animate-fade-in">
            <AlertCircle size={26} className="mx-auto text-amber-400" />
            <p className="font-semibold leading-relaxed">{hasCameraError}</p>

            <div className="flex flex-col sm:flex-row gap-2 justify-center pt-1">
              <button
                onClick={() => { setHasCameraError(null); startCamera(); }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition flex items-center justify-center gap-1.5 cursor-pointer text-xs"
              >
                <RefreshCw size={14} /> {isAr ? 'إعادة طلب الصلاحية' : 'Retry Live Camera'}
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 text-white font-black transition flex items-center justify-center gap-1.5 cursor-pointer text-xs shadow-lg"
              >
                <Camera size={14} /> {isAr ? 'التقاط صورة للرمز بالكاميرا' : 'Take Photo of QR'}
              </button>
            </div>
          </div>
        )}

        {/* Secondary Instant Native Camera Photo Option */}
        {!hasCameraError && !showManualInput && (
          <div className="w-full mt-2.5 flex justify-center">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-slate-400 hover:text-emerald-400 font-bold flex items-center gap-1.5 py-1 px-3 rounded-lg hover:bg-slate-800/60 transition cursor-pointer"
            >
              <Upload size={13} />
              <span>{isAr ? 'أو التقط صورة للرمز / اختر من المعرض' : 'Or Snap Photo / Upload QR Image'}</span>
            </button>
          </div>
        )}

        {/* Manual 6-character Code Entry View */}
        {(showManualInput || hasCameraError) && (
          <form onSubmit={handleManualSubmit} className="w-full space-y-3 my-2">
            <div className="text-center">
              <label className="text-xs font-bold text-slate-300 block mb-1">
                {isAr ? 'أو أدخل رمز الغرفة المكون من 6 خانات:' : 'Or Enter 6-Character Room Code:'}
              </label>
              <p className="text-[11px] text-slate-400 mb-2">
                {isAr ? 'اطلب الرمز المكون من 6 أرقام الظاهر على شاشة صديقك' : 'Ask your friend for their 6-character room code'}
              </p>
            </div>

            <div className="flex justify-center">
              <input
                type="text"
                maxLength={8}
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                placeholder="ABC123"
                className="w-48 text-center uppercase tracking-widest text-2xl font-mono font-black py-2.5 px-4 rounded-2xl bg-slate-950 border-2 border-emerald-400/80 text-emerald-300 shadow-xl focus:outline-none focus:ring-2 focus:ring-emerald-400"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={!manualCode.trim()}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 disabled:opacity-50 text-white font-extrabold text-sm shadow-xl flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer"
            >
              <Zap size={16} /> {isAr ? 'انضمام للمباراة الآن' : 'Join Match Now'}
            </button>
          </form>
        )}

        {/* Toggle between Camera and Manual Code */}
        <div className="w-full mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
          {!showManualInput && !hasCameraError ? (
            <button
              onClick={() => { sounds.playClick(); stopCamera(); setShowManualInput(true); }}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Keyboard size={15} /> {isAr ? 'كتابة الرمز المكون من 6 أرقام يدوياً' : 'Or Type 6-Digit Code Manually'}
            </button>
          ) : (
            <button
              onClick={() => { sounds.playClick(); setShowManualInput(false); startCamera(); }}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Camera size={15} /> {isAr ? 'العودة لمسح الكاميرا' : 'Back to Camera Scanner'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
