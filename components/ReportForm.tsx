
import React, { useState, useRef } from 'react';
import {
  Camera, Video, Send, ShieldAlert, Loader2, CheckCircle2,
  MapPin, ShieldCheck, Lock, RefreshCw, WifiOff, AlertTriangle
} from 'lucide-react';
import { verifyWithGemini, detectSensitiveContent } from '../services/geminiService';
import { SmartImageBlur } from './SmartImageBlur';
import { reportService } from '../services/reportService';
import { syncService } from '../services/syncService';
import { authService } from '../services/authService';
import { Report, MediaType } from '../types';
import { ApiKeyModal } from './ApiKeyModal';
import { MediaCapture } from './MediaCapture';

interface Props {
  onSuccess: () => void;
}

export const ReportForm: React.FC<Props> = ({ onSuccess }) => {
  const user = authService.getCurrentUser();
  const [media, setMedia] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<MediaType>('image');
  const [description, setDescription] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  // New States for Redaction & Metadata
  const [boundingBoxes, setBoundingBoxes] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [mediaTimestamp, setMediaTimestamp] = useState<string | undefined>(undefined);



  const handleMediaClick = (type: MediaType) => {
    setMediaType(type);
    setShowCamera(true);
  };

  const handleCapture = async (dataUrl: string, timestamp: string) => {
    setMedia(dataUrl);
    setMediaTimestamp(timestamp);
    setShowCamera(false);

    if (mediaType === 'image') {
      setIsAnalyzing(true);
      try {
        const boxes = await detectSensitiveContent(dataUrl);
        setBoundingBoxes(boxes);
      } catch (err) {
        console.error("Redaction failed", err);
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const fetchLocation = () => {
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setIsLocating(false);
      },
      (err) => {
        setError("Location access required for verification.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!media || !description || !location || !user) {
      if (!location) setError("GPS coordinates are mandatory for verified reports.");
      return;
    }

    if (!navigator.onLine) {
      // Fix: Added userId to offline cache payload for complete report recreation on sync
      syncService.saveOffline({
        media,
        description,
        location,
        mediaType,
        userId: user.id,
        userEmail: user.email,
        userDisplayName: user.displayName
      });
      setSuccess(true);
      setTimeout(() => onSuccess(), 2000);
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const verification = await verifyWithGemini(media, description, mediaTimestamp);

      if (!verification.verified) {
        throw new Error("AI Validator: Submission does not contain a clear, verifiable hazard.");
      }

      const newReport: Report = {
        id: crypto.randomUUID(),
        userId: user.id,
        userEmail: user.email,
        userDisplayName: user.displayName,
        location: location,
        imageUrl: media,
        mediaType,
        description,
        status: 'verified',
        severity: verification.severity,
        category: verification.category,
        summary: verification.summary,
        timestamp: Date.now()
      };

      await reportService.addReport(newReport);
      setSuccess(true);
      setTimeout(() => onSuccess(), 2000);

    } catch (err: any) {
      const msg = err.message || "An error occurred during verification.";
      if (msg.includes("Missing GEMINI_API_KEY")) {
        setShowApiKeyModal(true);
      }
      setError(msg);
    } finally {
      setIsVerifying(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in h-[60vh]">
        <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
          <CheckCircle2 className="w-12 h-12 text-emerald-400" />
        </div>
        <h2 className="text-3xl font-black mb-2 text-white tracking-tight">
          {!navigator.onLine ? "Cached Locally" : "Verified Secure"}
        </h2>
        <p className="text-slate-400 max-w-xs">
          {!navigator.onLine
            ? "Your report will be transmitted to the verification network automatically when you reconnect."
            : "Guardian Protocol has verified your report. It is now visible to the community."}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-4 animate-in slide-in-from-bottom duration-500">
      {!navigator.onLine && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-[2rem] flex items-center gap-3 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
          <WifiOff className="w-5 h-5" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em]">Offline Protocol Engaged</p>
        </div>
      )}

      <div className="glass-card rounded-[3rem] p-10 space-y-8 border-white/5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-900/30">
            <ShieldAlert className="text-white w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Secure Report</h2>
            <p className="text-slate-400 text-xs font-medium">Verify your environment with AI</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Evidence Capture</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleMediaClick('image')}
                className="group relative aspect-square rounded-[2rem] bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex flex-col items-center justify-center gap-3 bouncy"
              >
                <div className="p-4 bg-slate-950 rounded-2xl border border-white/5 group-hover:scale-110 group-hover:border-red-500/30 transition-all">
                  <Camera className="w-6 h-6 text-red-500" />
                </div>
                <span className="text-xs font-bold text-slate-300">Photo</span>
              </button>
              <button
                type="button"
                onClick={() => handleMediaClick('video')}
                className="group relative aspect-square rounded-[2rem] bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex flex-col items-center justify-center gap-3 bouncy"
              >
                <div className="p-4 bg-slate-950 rounded-2xl border border-white/5 group-hover:scale-110 group-hover:border-red-500/30 transition-all">
                  <Video className="w-6 h-6 text-red-500" />
                </div>
                <span className="text-xs font-bold text-slate-300">Video</span>
              </button>
            </div>
            {showCamera && (
              <MediaCapture
                mode={mediaType}
                onCapture={handleCapture}
                onClose={() => setShowCamera(false)}
              />
            )}
          </div>

          {media && (
            <div className="relative aspect-video rounded-[2.5rem] overflow-hidden border border-white/10 group shadow-2xl bg-black">
              {mediaType === 'image' ? (
                <>
                  <SmartImageBlur
                    imageUrl={media}
                    boundingBoxes={boundingBoxes}
                    className="w-full h-full object-cover"
                  />
                  {isAnalyzing && (
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center animate-in fade-in z-50">
                      <Loader2 className="w-10 h-10 text-blue-400 animate-spin mb-2" />
                      <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">Scanning Biometrics...</p>
                    </div>
                  )}
                </>
              ) : (
                <video src={media} className="w-full h-full object-cover" controls />
              )}
            </div>
          )}

          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Contextual Data</label>
            <div className="space-y-4">
              <button
                type="button"
                onClick={fetchLocation}
                disabled={isLocating}
                className={`w-full py-5 rounded-2xl border flex items-center justify-center gap-3 font-black transition-all group ${location
                  ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400'
                  : 'border-white/5 bg-white/5 text-slate-400 hover:bg-white/10'
                  }`}
              >
                {isLocating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <MapPin className={`w-5 h-5 ${location ? 'text-emerald-400' : 'group-hover:text-red-500'}`} />}
                <span className="uppercase tracking-widest text-xs">
                  {isLocating ? 'Capturing Coordinates...' : location ? 'GPS Secured' : 'Lock My Location'}
                </span>
              </button>

              <textarea
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly describe the threat level and immediate impact..."
                className="w-full rounded-2xl bg-white/5 border border-white/5 p-6 focus:ring-2 focus:ring-red-500/30 outline-none transition-all min-h-[140px] text-slate-200 placeholder:text-slate-600 text-sm"
              />
            </div>
          </div>

          {error && (
            <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-black flex items-center gap-3 animate-in slide-in-from-top-2">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              {error.toUpperCase()}
            </div>
          )}

          <button
            type="submit"
            disabled={!media || !description || isVerifying || !location}
            className={`w-full py-6 rounded-3xl flex items-center justify-center gap-4 font-black text-lg tracking-tight shadow-2xl transition-all bouncy ${isVerifying
              ? 'bg-slate-900 text-slate-600 cursor-not-allowed'
              : 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-500 hover:to-red-600 shadow-red-900/20'
              }`}
          >
            {isVerifying ? (
              <><Loader2 className="w-6 h-6 animate-spin" />AI VALIDATION...</>
            ) : (
              <><Send className="w-6 h-6" />{!navigator.onLine ? "CACHE REPORT" : "TRANSMIT DATA"}</>
            )}
          </button>
        </form>
      </div>
      <ApiKeyModal isOpen={showApiKeyModal} onClose={() => setShowApiKeyModal(false)} onSave={() => { setShowApiKeyModal(false); setError(null); }} />
    </div>
  );
};
