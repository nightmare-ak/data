
import { auth, googleProvider } from "./firebaseConfig";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile
} from "firebase/auth";
import { UserProfile, UserRole } from "../types";
import { CREATOR_EMAIL } from "../constants";

// Helper to map Firebase User to our UserProfile
export const mapUser = (user: FirebaseUser): UserProfile => {
  const role: UserRole = user.email?.toLowerCase() === CREATOR_EMAIL.toLowerCase() ? 'Creator' : 'User';
  return {
    id: user.uid,
    email: user.email || '',
    displayName: user.displayName || 'Guardian',
    photoURL: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'Guardian')}&background=random`,
    role
  };
};

export const authService = {
  signUp: async (email: string, password: string, name: string): Promise<UserProfile> => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });
    return mapUser(userCredential.user);
  },

  signIn: async (email: string, password: string): Promise<UserProfile> => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return mapUser(userCredential.user);
  },

  loginWithGoogle: async (): Promise<UserProfile> => {
    const result = await signInWithPopup(auth, googleProvider);
    return mapUser(result.user);
  },

  logout: async () => {
    await signOut(auth);
  },

  // Note: For real-time state, we should use onAuthStateChanged listener in a React Context/Hook
  // This function is kept for compatibility with existing imperative code awaiting migration
  getCurrentUser: (): UserProfile | null => {
    const user = auth.currentUser;
    return user ? mapUser(user) : null;
  },

  // Placeholder updates (Roles should ideally be stored in Firestore 'users' collection)
  updateRole: async (userId: string, newRole: UserRole) => {
    console.warn("Role updates need backend admin SDK or Firestore trigger. Not implemented strictly on client for security.");
  }
};

