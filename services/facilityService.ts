
import { Facility } from "../types";
import { db } from "./firebaseConfig";
import { collection, getDocs, addDoc, deleteDoc, doc, writeBatch } from "firebase/firestore";

const FACILITIES_COLLECTION = 'facilities';

// Default initial facilities, useful for seeding if empty
const INITIAL_FACILITIES: Facility[] = [
  { id: '1', name: 'City Central Hospital', type: 'Hospital', location: { lat: 40.7128, lng: -74.0060 }, contactNumber: '112', address: '123 Medical Plaza', createdByRole: 'Creator' },
  { id: '2', name: 'Community Center Shelter', type: 'Shelter', location: { lat: 40.7228, lng: -74.0160 }, contactNumber: '112', address: '456 Public Square', createdByRole: 'Creator' },
  { id: '3', name: 'Westside Safe Zone', type: 'Safe Zone', location: { lat: 40.7328, lng: -73.9960 }, contactNumber: '112', address: '789 Safety Blvd', createdByRole: 'Creator' },
];

// Helper
const mapDocToFacility = (doc: any): Facility => ({
  id: doc.id,
  ...doc.data()
});

export const facilityService = {
  getFacilities: async (): Promise<Facility[]> => {
    try {
      const snapshot = await getDocs(collection(db, FACILITIES_COLLECTION));
      if (snapshot.empty) {
        console.log("Seeding initial facilities...");
        const batch = writeBatch(db);
        INITIAL_FACILITIES.forEach(f => {
          // Use the ID from our initial data as the doc ID
          const docRef = doc(db, FACILITIES_COLLECTION, f.id);
          const { id, ...data } = f;
          batch.set(docRef, data);
        });
        await batch.commit();
        return INITIAL_FACILITIES;
      }
      return snapshot.docs.map(mapDocToFacility);
    } catch (error) {
      console.error("Error fetching facilities:", error);
      return [];
    }
  },

  addFacility: async (facility: Facility): Promise<void> => {
    // Firestore generates ID if we use addDoc, but we want to store our ID logic if we have it.
    // However, clean way is to let Firestore generate ID.
    // If we want to preserve the ID passed in 'facility', we should use setDoc with a specific doc(db, col, id).
    // Let's stick to addDoc for simplicity and update the object.
    const { id, ...data } = facility;
    await addDoc(collection(db, FACILITIES_COLLECTION), data);
  },

  deleteFacility: async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, FACILITIES_COLLECTION, id));
    } catch (error) {
      console.error("Error deleting facility", error);
    }
  },

  /**
   * Calculates distance between two coordinates in kilometers using Haversine formula
   */
  calculateDistance: (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  }
};


