
export type Category = 'Fire' | 'Flood' | 'Accident' | 'Roadblock' | 'Other';
export type Status = 'pending' | 'verified' | 'rejected';
export type MediaType = 'image' | 'video';
export type UserRole = 'Creator' | 'Admin' | 'Authority' | 'User';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
}

export interface Report {
  id: string;
  userId: string;
  userEmail: string; // Only visible to Admins/Creator
  userDisplayName: string; // "Anonymous Guardian" for public
  location: {
    lat: number;
    lng: number;
  };
  imageUrl: string;
  mediaType?: MediaType;
  description: string;
  status: Status;
  severity: number;
  category: Category;
  summary: string;
  timestamp: number;
}

export interface Facility {
  id: string;
  name: string;
  type: 'Hospital' | 'Shelter' | 'Police' | 'Safe Zone';
  location: {
    lat: number;
    lng: number;
  };
  contactNumber: string;
  address: string;
  createdByRole?: UserRole;
}

export interface Shelter {
  id: string;
  name: string;
  type: 'Hospital' | 'Shelter' | 'Police' | 'Safe Zone';
  distance: string;
  address: string;
}

export interface VerificationResult {
  verified: boolean;
  severity: number;
  category: Category;
  summary: string;
  timeCheck?: 'consistent' | 'inconsistent' | 'uncertain';
}

export interface BoundingBox {
  box_2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax]
  label: string;
}

export const canAccessAuthorityDashboard = (role: UserRole) =>
  ['Creator', 'Admin', 'Authority'].includes(role);

export const canViewRealIdentity = (role: UserRole) =>
  ['Creator', 'Admin'].includes(role);

export const canViewClearEvidence = (role: UserRole) =>
  ['Creator', 'Admin', 'Authority'].includes(role);
