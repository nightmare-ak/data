
import { Report } from "../types";
import { authService } from "./authService";
import { db } from "./firebaseConfig";
import { collection, getDocs, addDoc, query, where, orderBy } from "firebase/firestore";

const REPORTS_COLLECTION = 'reports';

// Helper to convert Firestore doc to Report
const mapDocToReport = (doc: any): Report => ({
  id: doc.id,
  ...doc.data()
});

export const reportService = {
  // Now async
  getReports: async (): Promise<Report[]> => {
    try {
      const q = query(collection(db, REPORTS_COLLECTION), orderBy("timestamp", "desc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(mapDocToReport);
    } catch (error) {
      console.error("Error fetching reports:", error);
      return [];
    }
  },

  addReport: async (report: Report): Promise<void> => {
    // Firestore creates ID, but we have one generated already in createReportTemplate.
    // We can use it or let Firestore generate one. Storing explicitly for now.
    const { id, ...reportData } = report;
    await addDoc(collection(db, REPORTS_COLLECTION), { ...reportData, id });
  },

  getVerifiedReports: async (): Promise<Report[]> => {
    try {
      // Filtering verified on backend
      const q = query(
        collection(db, REPORTS_COLLECTION),
        where("status", "==", "verified")
      );
      const snapshot = await getDocs(q);
      // Sort in memory or add composite index for orderBy timestamp
      return snapshot.docs.map(mapDocToReport).sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error("Error fetching verified reports:", error);
      return [];
    }
  },

  createReportTemplate: (data: any): Report => {
    const user = authService.getCurrentUser();
    return {
      id: crypto.randomUUID(), // Will serve as a reference separate from Doc ID
      userId: user?.id || 'anon',
      userEmail: user?.email || 'anon@guardian.protocol',
      userDisplayName: user?.displayName || 'Anonymous Guardian',
      location: data.location,
      imageUrl: data.media,
      mediaType: data.mediaType,
      description: data.description,
      status: 'verified',
      severity: data.verification.severity,
      category: data.verification.category,
      summary: data.verification.summary,
      timestamp: Date.now()
    };
  }
};


