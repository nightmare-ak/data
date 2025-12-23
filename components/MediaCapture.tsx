import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, Video, X, RefreshCw, StopCircle, Disc } from 'lucide-react';

interface Props {
    mode: 'image' | 'video';
    onCapture: (dataUrl: string, timestamp: string) => void;
    onClose: () => void;
}

export const MediaCapture: React.FC<Props> = ({ mode, onCapture, onClose }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

    const startCamera = useCallback(async () => {
        try {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }

            const constraints: MediaStreamConstraints = {
                video: { facingMode },
                audio: mode === 'video'
            };

            try {
                const newStream = await navigator.mediaDevices.getUserMedia(constraints);
                setStream(newStream);
                if (videoRef.current) {
                    videoRef.current.srcObject = newStream;
                }
                setError(null);
            } catch (firstErr) {
                console.warn(`Camera access with ${facingMode} failed, trying default...`, firstErr);
                // Fallback: Try without facingMode constraint (any camera)
                const fallbackStream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: mode === 'video'
                });
                setStream(fallbackStream);
                if (videoRef.current) {
                    videoRef.current.srcObject = fallbackStream;
                }
                setError(null);
            }
        } catch (err) {
            console.error("Camera Fatal Error:", err);
            setError("Unable to access camera. Please check permissions.");
        }
    }, [mode, facingMode]);

    useEffect(() => {
        startCamera();
        return () => {
            // Cleanup stream on unmount
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [startCamera]); // Removed stream dependency loop

    const capturePhoto = () => {
        if (!videoRef.current) return;
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            onCapture(dataUrl, new Date().toString());
        }
    };

    const startRecording = () => {
        if (!stream) return;
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        chunksRef.current = [];

        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        recorder.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: 'video/webm' });
            const reader = new FileReader();
            reader.onloadend = () => {
                onCapture(reader.result as string, new Date().toString()); // Capture end time as effective timestamp
            };
            reader.readAsDataURL(blob);
        };

        recorder.start();
        setIsRecording(true);
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const toggleCamera = () => {
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    };

    return (
        <div className="fixed inset-0 z-[6000] bg-black flex flex-col items-center justify-center animate-in fade-in duration-300">
            <div className="absolute top-4 right-4 z-10">
                <button onClick={onClose} className="p-2 bg-black/50 rounded-full text-white hover:bg-white/20 transition-all">
                    <X className="w-8 h-8" />
                </button>
            </div>

            {error ? (
                <div className="text-red-500 text-center p-6">
                    <p className="font-bold mb-2">Camera Error</p>
                    <p className="text-sm">{error}</p>
                    <button onClick={() => startCamera()} className="mt-4 px-4 py-2 bg-white/10 rounded-xl">Retry</button>
                </div>
            ) : (
                <div className="relative w-full h-full flex flex-col">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="flex-1 w-full h-full object-cover"
                    />

                    <div className="absolute bottom-0 left-0 right-0 p-8 pb-12 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-around">
                        <button onClick={toggleCamera} className="p-4 bg-white/10 rounded-full text-white backdrop-blur-md active:scale-95 transition-all">
                            <RefreshCw className="w-6 h-6" />
                        </button>

                        {mode === 'image' ? (
                            <button
                                onClick={capturePhoto}
                                className="w-20 h-20 bg-white rounded-full border-4 border-slate-300 shadow-2xl active:scale-90 transition-all flex items-center justify-center"
                            >
                                <div className="w-16 h-16 bg-white rounded-full border-2 border-slate-900/10" />
                            </button>
                        ) : (
                            <button
                                onClick={isRecording ? stopRecording : startRecording}
                                className={`w-20 h-20 rounded-full border-4 shadow-2xl active:scale-90 transition-all flex items-center justify-center ${isRecording ? 'bg-slate-900 border-red-500' : 'bg-red-500 border-white'}`}
                            >
                                {isRecording ? <StopCircle className="w-10 h-10 text-red-500" /> : <div className="w-8 h-8 bg-white rounded-sm" />}
                            </button>
                        )}

                        <div className="w-14" /> {/* Spacer for balance */}
                    </div>

                    {isRecording && (
                        <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-red-500/80 px-4 py-1 rounded-full text-white text-xs font-bold animate-pulse">
                            <Disc className="w-3 h-3 fill-current" /> RECORDING
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
