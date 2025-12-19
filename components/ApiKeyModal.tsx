
import React, { useState, useEffect } from 'react';
import { Key, Save, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSave: (key: string) => void;
}

export const ApiKeyModal: React.FC<Props> = ({ isOpen, onClose, onSave }) => {
    const [key, setKey] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const storedKey = localStorage.getItem('gemini_api_key');
        if (storedKey) setKey(storedKey);
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!key.trim()) {
            setError("API Key cannot be empty");
            return;
        }
        if (!key.startsWith('AIza')) {
            setError("Invalid API Key format (should start with AIza)");
            return;
        }

        localStorage.setItem('gemini_api_key', key);
        onSave(key);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-md glass-card p-8 rounded-[2.5rem] border-red-500/20 shadow-2xl shadow-red-900/40 animate-in zoom-in-95 space-y-6">
                <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                        <Key className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">System Access</h2>
                    <p className="text-slate-400 text-xs font-medium max-w-xs mx-auto">
                        Authorized Gemini API credentials required for neural network activation.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">API Credential</label>
                        <div className="relative group">
                            <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-red-500 transition-colors" />
                            <input
                                type="password"
                                value={key}
                                onChange={(e) => { setKey(e.target.value); setError(null); }}
                                placeholder="Paste AIza..."
                                className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:ring-2 focus:ring-red-500/30 font-mono text-sm transition-all"
                            />
                        </div>
                        {error && (
                            <div className="flex items-center gap-2 text-red-400 text-[10px] uppercase font-black tracking-wider pl-2 animate-bounce">
                                <AlertTriangle className="w-3 h-3" /> {error}
                            </div>
                        )}
                        <p className="text-[10px] text-slate-600 pl-2">
                            Keys are stored locally and never transmitted to our servers.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 bg-white/5 text-slate-400 font-bold rounded-2xl hover:bg-white/10 transition-all uppercase text-[10px] tracking-widest"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-[2] py-4 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold rounded-2xl shadow-xl shadow-red-900/20 hover:from-red-500 hover:to-red-600 transition-all uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"
                        >
                            <Save className="w-4 h-4" /> Save Configuration
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
