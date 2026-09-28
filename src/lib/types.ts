export interface DoctorProfile {
  id: string;
  name: string;
  title: string;
  specialties: string[];
  experienceYears: number;
  rating: number;
  reviewCount: number;
  avatarUrl: string;
  clinicName: string;
  clinicAddress: string;
  clinicOverview: string;
  clinicImages: { src: string; title: string; caption: string }[];
  timings: string;
  phone: string;
  email: string;
}

export interface TreatmentService {
  id: string;
  name: string;
  category: string;
  numericPrice: number;
  durationMinutes: number;
  priceText: string;
  breakdown: string;
  description: string;
  imageUrl: string;
  includes: string[];
}

export interface PatientReview {
  id: string;
  patientName: string;
  initials: string;
  rating: number;
  date: string;
  treatment: string;
  comment: string;
  verified: boolean;
  avatarColor: string;
}

export interface Appointment {
  id: string;
  appointmentNumber: string;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  patientNotes?: string;
  serviceIds: string[];
  serviceNames: string[];
  date: string;
  time: string;
  totalAmount: number;
  paymentMethod: string;
  paymentDetails: {
    transactionRef: string;
    transactionId?: string;
    receiptNumber?: string;
    upiApp?: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
  };
  isLocked?: boolean;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
}
