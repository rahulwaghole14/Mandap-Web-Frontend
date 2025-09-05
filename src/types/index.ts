export interface User {
  id: string;
  name: string;
  mobile: string;
  district: string;
  associationName?: string;
  category: string;
  profileImage?: string;
  whatsappLink?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Association {
  id: string;
  name: string;
  address: {
    city: string;
    state: string;
    district: string;
  };
  status: string;
  memberCount: number;
  createdAt: Date;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  image?: string;
  date: Date;
  type: string;
  city: string;
  associationName: string;
  isRegistered?: boolean;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  category: 'Events' | 'Member Updates' | 'Celebrations' | 'News';
  isRead: boolean;
  createdAt: Date;
}

export interface BODMember {
  id: string;
  name: string;
  role: string;
  photo?: string;
  associationName: string;
  type: 'BOD' | 'NBOD';
}

export interface MemberSearchFilters {
  district?: string;
  association?: string;
  category?: string;
  searchText?: string;
}

export type Language = 'en' | 'mr' | 'hi';

