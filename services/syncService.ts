
import { Report } from "../types";
import { verifyWithGemini } from "./geminiService";
import { reportService } from "./reportService";

const PENDING_REPORTS_KEY = 'guardian_pending_sync';

export const syncService = {
  saveOffline: (reportData: any) => {
    const pending = syncService.getPending();
    pending.push({
      ...reportData,
      tempId: crypto.randomUUID(),
      timestamp: Date.now()
    });
    localStorage.setItem(PENDING_REPORTS_KEY, JSON.stringify(pending));
  },

  getPending: (): any[] => {
    const saved = localStorage.getItem(PENDING_REPORTS_KEY);
    return saved ? JSON.parse(saved) : [];
  },

  clearPending: () => {
    localStorage.removeItem(PENDING_REPORTS_KEY);
  },

  syncPending: async (onProgress?: (msg: string) => void) => {
    const pending = syncService.getPending();
    if (pending.length === 0) return;

    if (!navigator.onLine) return;

    onProgress?.(`Syncing ${pending.length} offline reports...`);

    const results = [];
    for (const item of pending) {
      try {
        // Re-verify with Gemini now that we are online
        const verification = await verifyWithGemini(item.media, item.description);

        if (verification.verified) {
          // Fix: Ensure all required Report fields are populated from the cached item
          const report: Report = {
            id: crypto.randomUUID(),
            userId: item.userId || ('user_offline_' + Math.random().toString(36).substring(2, 7)),
            userEmail: item.userEmail || 'anon@guardian.protocol',
            userDisplayName: item.userDisplayName || 'Anonymous Guardian',
            location: item.location,
            imageUrl: item.media,
            mediaType: item.mediaType,
            description: item.description,
            status: 'verified',
            severity: verification.severity,
            category: verification.category,
            summary: verification.summary,
            timestamp: item.timestamp
          };
          await reportService.addReport(report);
          results.push(item.tempId);
        }
      } catch (error) {
        console.error("Failed to sync offline report", error);
      }
    }

    // Remove successfully synced reports
    const remaining = pending.filter(p => !results.includes(p.tempId));
    if (remaining.length > 0) {
      localStorage.setItem(PENDING_REPORTS_KEY, JSON.stringify(remaining));
    } else {
      syncService.clearPending();
    }

    onProgress?.("Sync complete.");
  }
};
