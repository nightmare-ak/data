
import React, { useState, useEffect } from 'react';
import { SHELTER_ICONS, EMERGENCY_NUMBERS } from '../constants';
import { facilityService } from '../services/facilityService';
import { authService } from '../services/authService';
import { Facility, canAccessAuthorityDashboard } from '../types';
import { MapPin, ChevronRight, PhoneCall, AlertCircle, Info, Navigation, Globe, Landmark, ShieldCheck } from 'lucide-react';

interface Props {
  onNavigate?: (tab: number) => void;
}

export const FindHelpTab: React.FC<Props> = ({ onNavigate }) => {
  const user = authService.getCurrentUser();
  const [emergencyPhone, setEmergencyPhone] = useState(EMERGENCY_NUMBERS.DEFAULT);
  const [facilities, setFacilities] = useState<(Facility & { distKm: number })[]>([]);
  const [userLoc, setUserLoc] = useState<{ lat: number, lng: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const RADIUS_KM = 50; // Filter facilities within 50km
  const canManage = user ? canAccessAuthorityDashboard(user.role) : false;

  useEffect(() => {
    // Forcing 112 for demo purposes as requested
    setEmergencyPhone('112');

    const loadNearbyFacilities = async () => {
      const data = await facilityService.getFacilities();

      navigator.geolocation.getCurrentPosition((pos) => {
        const uLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLoc(uLoc);

        const withDist = data.map(f => ({
          ...f,
          distKm: facilityService.calculateDistance(uLoc.lat, uLoc.lng, f.location.lat, f.location.lng)
        }));

        const nearby = withDist
          .filter(f => f.distKm <= RADIUS_KM)
          .sort((a, b) => a.distKm - b.distKm);

        setFacilities(nearby);
        setIsLoading(false);
      }, () => {
        setFacilities(data.map(f => ({ ...f, distKm: -1 })));
        setIsLoading(false);
      });
    };

    loadNearbyFacilities();
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase">Safe <span className="text-blue-400">Nodes</span></h2>
          <p className="text-slate-500 font-medium leading-relaxed">Verified local emergency infrastructure and relief zones.</p>
        </div>
        {canManage && onNavigate && (
          <button
            onClick={() => onNavigate(4)}
            className="flex items-center gap-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 px-4 py-2 rounded-2xl transition-all shadow-lg shadow-purple-900/10 bouncy"
          >
            <Landmark className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Manage Nodes</span>
          </button>
        )}
      </div>

      {/* Primary Emergency Action */}
      <div className="relative group overflow-hidden bg-gradient-to-br from-red-600 to-red-800 rounded-[3rem] p-10 shadow-2xl shadow-red-900/30 bouncy">
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-8">
          <div className="space-y-2 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 bg-black/20 px-3 py-1 rounded-full mb-2">
              <AlertCircle className="w-3 h-3 text-red-200" />
              <span className="text-[10px] font-black uppercase tracking-widest text-red-200">Critical Priority</span>
            </div>
            <h3 className="text-4xl font-black text-white leading-tight">Emergency Call</h3>
            <p className="text-red-100/70 text-sm font-medium">Immediate voice link to first responders.</p>
          </div>
          <a
            href={`tel:${emergencyPhone}`}
            className="w-full sm:w-auto bg-white text-red-700 font-black px-10 py-5 rounded-[2rem] text-2xl flex items-center justify-center gap-4 hover:bg-slate-100 transition-all shadow-xl"
          >
            <PhoneCall className="w-8 h-8" />
            {emergencyPhone}
          </a>
        </div>
        <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform duration-1000">
          <PhoneCall className="w-64 h-64" />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Nearby Resources</h4>
          <div className="flex items-center gap-1 text-[10px] font-black text-blue-400 uppercase tracking-widest bg-blue-500/10 px-3 py-1 rounded-full">
            {userLoc ? <Navigation className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
            {userLoc ? `Sorted by Nearest (${RADIUS_KM}km)` : 'Location Restricted'}
          </div>
        </div>

        <div className="grid gap-4">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-4 text-slate-600">
              <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-widest">Scanning Network Nodes...</p>
            </div>
          ) : facilities.length === 0 ? (
            <div className="glass-card p-10 rounded-[2.5rem] text-center space-y-4 border-white/5">
              <Info className="w-12 h-12 text-slate-700 mx-auto" />
              <p className="text-slate-500 text-sm">No verified facilities found within {RADIUS_KM}km.</p>
            </div>
          ) : facilities.map((facility) => (
            <div
              key={facility.id}
              className="glass-card p-6 rounded-[2.5rem] flex items-center justify-between hover:bg-white/5 transition-all border-white/5 group m3-shadow bouncy"
            >
              <div className="flex items-center gap-6">
                <div className="p-4 bg-slate-900/50 rounded-2xl group-hover:scale-110 transition-transform border border-white/5 shadow-inner">
                  {SHELTER_ICONS[facility.type]}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white group-hover:text-blue-400 transition-colors">{facility.name}</h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1 font-medium">
                    {facility.distKm >= 0 && (
                      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full text-[10px] font-black">
                        {facility.distKm.toFixed(1)} km
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-red-500/50" />
                      <span>{facility.address}</span>
                    </div>
                  </div>
                </div>
              </div>
              <a
                href={`tel:${facility.contactNumber}`}
                className="bg-white/5 p-4 rounded-full group-hover:bg-blue-500/20 transition-colors border border-white/5"
              >
                <PhoneCall className="w-5 h-5 text-slate-500 group-hover:text-blue-400 transition-colors" />
              </a>
            </div>
          ))}
        </div>
      </div>

      <div className="p-8 rounded-[2.5rem] border border-white/5 bg-white/[0.02] flex items-start gap-5 shadow-inner relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <ShieldCheck className="w-24 h-24" />
        </div>
        <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 relative z-10">
          <Info className="w-6 h-6 text-blue-400" />
        </div>
        <div className="relative z-10">
          <h5 className="font-bold text-white mb-1">Node Privacy Policy</h5>
          <p className="text-slate-500 text-[10px] font-medium leading-relaxed uppercase tracking-wide">
            Public node visibility is limited to locations. Personal node identities are masked behind Guardian Neural Protocols to prevent secondary target identification.
          </p>
        </div>
      </div>
    </div>
  );
};
