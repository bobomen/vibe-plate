/**
 * Types for Restaurant Claim Flow
 */

export type ClaimType = 'existing' | 'new';

export type ClaimStep = 
  | 'search'           // Step 1: Search for restaurant
  | 'contact-info'     // Step 2A: Contact info for claiming existing
  | 'create-info'      // Step 2B: Full info for creating new
  | 'verification'     // Step 3: Enter OTP code
  | 'success';         // Step 4: Success screen

export interface SearchedRestaurant {
  id: string;
  name: string;
  address: string;
  city?: string | null;
  district?: string | null;
  cuisine_type?: string;
  phone?: string | null;
}

export interface ContactInfoForm {
  email: string;
  phone: string;
}

export interface CreateRestaurantForm {
  name: string;
  address: string;
  phone: string;
  email: string;
  city?: string;
  district?: string;
  cuisine_type?: string;
  website?: string;
  menu_url?: string;
}

export interface VerificationForm {
  code: string;
}

export interface ClaimState {
  currentStep: ClaimStep;
  claimType: ClaimType | null;
  selectedRestaurant: SearchedRestaurant | null;
  contactInfo: ContactInfoForm | null;
  createInfo: CreateRestaurantForm | null;
  verificationCodeSent: boolean;
  isSubmitting: boolean;
  error: string | null;
}
