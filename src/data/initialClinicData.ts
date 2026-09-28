import { DoctorProfile, TreatmentService, PatientReview } from '../lib/types.js';

export const INITIAL_DOCTOR: DoctorProfile = {
  id: 'dr-ananya-rao',
  name: 'Dr. Ananya Rao',
  title: 'MBBS | BDS | Cardiologist',
  specialties: ['Endodontics', 'Orthodontics', 'Preventive Dentistry', 'Cardiovascular Screening'],
  experienceYears: 10,
  rating: 4.9,
  reviewCount: 284,
  avatarUrl: '/src/assets/images/doctor_ananya_portrait_1790167197977.jpg',
  clinicName: 'Aura Medical & Dental Wellness Centre',
  clinicAddress: 'Suite 402, 100ft Road, Indiranagar, Bangalore, Karnataka 560038',
  clinicOverview: 'Modern multispecialty clinic offering comprehensive dental, orthodontic, and cardiovascular consultation services equipped with digital intraoral imaging, ultrasonic equipment, and cardiac diagnostic facilities.',
  clinicImages: [
    {
      src: '/src/assets/images/clinic_modern_operatory_1790167212308.jpg',
      title: 'Clinic Consultation & Operatory Suite',
      caption: 'Sterile, modern operatory designed for comprehensive patient safety and comfort.'
    },
    {
      src: '/src/assets/images/treatment_root_canal_1790167223532.jpg',
      title: 'Endodontic Precision Operatory',
      caption: 'Advanced digital imaging and rotary endodontic equipment for painless root canal therapies.'
    },
    {
      src: '/src/assets/images/treatment_deep_cleaning_1790167236130.jpg',
      title: 'Hygiene & Preventive Dental Suite',
      caption: 'Ultrasonic scaling instruments with high standards of autoclaved sterilization.'
    },
    {
      src: '/src/assets/images/treatment_orthodontic_braces_1790167247551.jpg',
      title: 'Orthodontic Alignment Suite',
      caption: 'Custom digital aligners and precision ceramic bracket setups.'
    }
  ],
  timings: 'Daily Consultations by Appointment',
  phone: '+91 (080) 4920-8822',
  email: 'appointments@ananyaraoclinic.in'
};

export const INITIAL_SERVICES: TreatmentService[] = [
  {
    id: 'rc',
    name: 'Root Canal',
    category: 'Endodontics',
    numericPrice: 4500,
    durationMinutes: 60,
    priceText: 'Starting from ₹4,500',
    breakdown: 'Est. ₹4,500 - ₹6,500 (Incl. Specialist Consultation & RVG X-Ray; Crown extra)',
    description: 'Infection treatment and restorative care for compromised tooth roots using computerized apex locators and painless anesthesia.',
    imageUrl: '/src/assets/images/treatment_root_canal_1790167223532.jpg',
    includes: [
      'Pre-op Digital RVG X-Ray',
      'Computerized Apex Locator canal shaping',
      'Biocompatible Gutta-Percha obturation',
      'Temporary restorative seal'
    ]
  },
  {
    id: 'dc',
    name: 'Deep Cleaning',
    category: 'Preventive',
    numericPrice: 1800,
    durationMinutes: 45,
    priceText: 'Fixed Cost ₹1,800',
    breakdown: 'Clinic Confirmed ₹1,800 (Incl. Specialist Consultation, Scaling & Polishing)',
    description: 'Professional ultrasonic scaling, subgingival plaque and tartar removal, followed by gentle prophylactic enamel polishing.',
    imageUrl: '/src/assets/images/treatment_deep_cleaning_1790167236130.jpg',
    includes: [
      'Comprehensive Gum Health Assessment',
      'Full-mouth Ultrasonic Piezo Scaling',
      'Air-flow Polishing for stain removal',
      'Fluoride enamel strengthening coat'
    ]
  },
  {
    id: 'braces',
    name: 'Orthodontic Braces',
    category: 'Orthodontics',
    numericPrice: 25000,
    durationMinutes: 90,
    priceText: 'Starting from ₹25,000',
    breakdown: 'Est. ₹25,000 - ₹45,000 (Incl. Consultation, Digital Alignment Plan & Setup)',
    description: 'Orthodontic alignment for smile correction using premium ceramic brackets or clear aligner options designed for all age groups.',
    imageUrl: '/src/assets/images/treatment_orthodontic_braces_1790167247551.jpg',
    includes: [
      'Digital Smile Scan & Cephalometric Analysis',
      'Full Bracket Bonding session',
      'Initial Nickel-Titanium archwires',
      'Orthodontic hygiene kit & emergency wax'
    ]
  },
  {
    id: 'cardio',
    name: 'Cardiac Health Consultation',
    category: 'Cardiology',
    numericPrice: 3200,
    durationMinutes: 45,
    priceText: 'Fixed Cost ₹3,200',
    breakdown: 'Package ₹3,200 (Incl. 12-Lead ECG, Blood Pressure & Cardiologist Review)',
    description: 'Comprehensive preventive heart checkup, resting 12-lead electrocardiogram, blood pressure evaluation, and cardiac risk assessment.',
    imageUrl: '/src/assets/images/clinic_modern_operatory_1790167212308.jpg',
    includes: [
      '12-Lead Digital Electrocardiogram (ECG)',
      'Multi-point Blood Pressure monitoring',
      'Cardiovascular Risk Profile analysis',
      'Personalized dietary & medication review'
    ]
  },
  {
    id: 'whitening',
    name: 'Laser Teeth Whitening',
    category: 'Cosmetic',
    numericPrice: 6000,
    durationMinutes: 60,
    priceText: 'Fixed Cost ₹6,000',
    breakdown: 'Special Session ₹6,000 (Incl. Desensitizer & Shade Comparison)',
    description: 'In-clinic advanced LED laser activation for lightening enamel stains up to 5-8 shades in a single comfortable sitting.',
    imageUrl: '/src/assets/images/treatment_deep_cleaning_1790167236130.jpg',
    includes: [
      'Gingival barrier protection',
      'Medical-grade carbamide peroxide gel',
      'Triple-pass LED light activation',
      'Post-treatment sensitivity guard'
    ]
  }
];

export const INITIAL_REVIEWS: PatientReview[] = [
  {
    id: 'rev-1',
    patientName: 'Rahul K.',
    initials: 'RK',
    rating: 5,
    date: '2 weeks ago',
    treatment: 'Root Canal Treatment',
    comment: 'Dr. Ananya was exceptionally polite and explained every step of the Root Canal procedure. Painless experience with zero discomfort afterwards!',
    verified: true,
    avatarColor: 'bg-blue-600'
  },
  {
    id: 'rev-2',
    patientName: 'Priya Sharma',
    initials: 'PS',
    rating: 5,
    date: '1 month ago',
    treatment: 'Deep Cleaning & Scaling',
    comment: 'Impeccably clean clinic and courteous front desk staff. Scaling and polishing was handled with utmost gentleness and care.',
    verified: true,
    avatarColor: 'bg-emerald-600'
  },
  {
    id: 'rev-3',
    patientName: 'Dr. Arvind Nair',
    initials: 'AN',
    rating: 5,
    date: '3 weeks ago',
    treatment: 'Cardiac Health Consultation',
    comment: 'As a fellow physician, I was thoroughly impressed by Dr. Rao’s thorough cardiovascular evaluation and clear, evidence-based recommendations.',
    verified: true,
    avatarColor: 'bg-amber-600'
  },
  {
    id: 'rev-4',
    patientName: 'Sneha Menon',
    initials: 'SM',
    rating: 5,
    date: '1 month ago',
    treatment: 'Orthodontic Braces Setup',
    comment: 'Started my ceramic braces journey here. The digital simulation of my teeth alignment was incredible, and the pricing was completely transparent.',
    verified: true,
    avatarColor: 'bg-indigo-600'
  },
  {
    id: 'rev-5',
    patientName: 'Vikram Patel',
    initials: 'VP',
    rating: 4,
    date: '2 months ago',
    treatment: 'Root Canal & Laser Whitening',
    comment: 'Great clinical expertise and state-of-the-art facility. Appointment started right on time without waiting.',
    verified: true,
    avatarColor: 'bg-purple-600'
  }
];
