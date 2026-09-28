import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.js';
import { StepNavigation } from './components/StepNavigation.js';
import { DoctorProfileView } from './components/DoctorProfileView.js';
import { ServicesSelectionView } from './components/ServicesSelectionView.js';
import { ScheduleView } from './components/ScheduleView.js';
import { PaymentView } from './components/PaymentView.js';
import { ConfirmationModal } from './components/ConfirmationModal.js';
import { ReviewsModal } from './components/ReviewsModal.js';
import { LightboxModal } from './components/LightboxModal.js';
import { BookingsHistoryModal } from './components/BookingsHistoryModal.js';
import { NotificationScheduler } from './components/NotificationScheduler.js';
import * as db from './lib/data.js';
import { DoctorProfile, TreatmentService, PatientReview, Appointment } from './lib/types.js';
import { AlertCircle } from 'lucide-react';
import { INITIAL_DOCTOR, INITIAL_SERVICES, INITIAL_REVIEWS } from './data/initialClinicData.js';

export default function App() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [doctor, setDoctor] = useState<DoctorProfile>(INITIAL_DOCTOR);
  const [services, setServices] = useState<TreatmentService[]>(INITIAL_SERVICES);
  const [reviews, setReviews] = useState<PatientReview[]>(INITIAL_REVIEWS);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Booking selection state
  const [selectedServicesMap, setSelectedServicesMap] = useState<Record<string, TreatmentService>>({});
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1); // default to tomorrow
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [selectedTime, setSelectedTime] = useState<string>('04:15 PM');

  // Modals state
  const [isReviewsOpen, setIsReviewsOpen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isBookingsOpen, setIsBookingsOpen] = useState(false);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [confirmedAppointment, setConfirmedAppointment] = useState<Appointment | null>(null);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Fetch initial data from local data provider
  useEffect(() => {
    setDoctor(db.getDoctor());
    setServices(db.getServices());
    setReviews(db.getReviews());
    setAppointments(db.getAppointments());
  }, []);

  // Service toggle handler
  const handleToggleService = (service: TreatmentService) => {
    setToastMessage(null);
    setSelectedServicesMap((prev) => {
      const next = { ...prev };
      if (next[service.id]) {
        delete next[service.id];
      } else {
        next[service.id] = service;
      }
      return next;
    });
  };

  // Navigation handlers with validations
  const navigateTo = (step: number) => {
    setToastMessage(null);
    if (step > 2 && Object.keys(selectedServicesMap).length === 0) {
      showToast('Please select at least one treatment before scheduling.');
      return;
    }
    if (step > 3 && (!selectedDate || !selectedTime)) {
      showToast('Please select both a date and time before proceeding to payment.');
      return;
    }
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateBack = () => {
    setToastMessage(null);
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Review submission
  const handleAddReview = async (reviewData: {
    patientName: string;
    rating: number;
    treatment: string;
    comment: string;
  }) => {
    const newRev = db.addReview(reviewData);
    setReviews((prev) => [newRev, ...prev]);
    if (doctor) {
      setDoctor({
        ...doctor,
        reviewCount: doctor.reviewCount + 1
      });
    }
  };

  // Appointment cancellation
  const handleCancelAppointment = async (id: string, reason?: string) => {
    const cancelled = db.cancelAppointment(id, reason || '');
    setAppointments((prev) =>
      prev.map((apt) => (apt.id === id ? cancelled : apt))
    );
    showToast('Appointment cancelled. The clinic time slot is now open.');
  };

  // Reopen slot immediately when treatment completes
  const handleReopenSlot = async (id: string) => {
    try {
      const reopened = db.reopenSlot(id);
      setAppointments((prev) =>
        prev.map((apt) => (apt.id === id ? reopened : apt))
      );
      showToast('Treatment concluded! The clinic time slot has reopened.');
    } catch (err: any) {
      showToast(err.message || 'Failed to reopen slot');
    }
  };

  const handleOpenBookings = async () => {
    setAppointments(db.getAppointments());
    setIsBookingsOpen(true);
  };

  // Payment success handler
  const handlePaymentSuccess = (newApt: Appointment) => {
    setAppointments((prev) => [newApt, ...prev]);
    setConfirmedAppointment(newApt);
    setIsConfirmationOpen(true);
    // Reset services selection for fresh next booking
    setSelectedServicesMap({});
  };

  const selectedServicesList = Object.values(selectedServicesMap);
  const confirmedAppointmentsCount = appointments.filter(
    (a) => a.status.toUpperCase() === 'CONFIRMED'
  ).length;

  return (
    <div className="min-h-screen bg-slate-100 sm:py-6 flex flex-col items-center justify-start text-slate-900 w-full overflow-x-hidden">
      <NotificationScheduler appointments={appointments} />
      <div className="w-full max-w-md sm:max-w-lg bg-white min-h-screen sm:min-h-[860px] sm:max-h-[920px] sm:rounded-3xl shadow-xl flex flex-col overflow-hidden relative border-0 sm:border sm:border-slate-200">
        
        {/* Header with back navigation and bookings drawer trigger */}
        <Header
          currentStep={currentStep}
          onBack={navigateBack}
          onOpenBookings={handleOpenBookings}
          bookingCount={confirmedAppointmentsCount}
        />

        {/* 4-Step Stepper Navigation */}
        <StepNavigation
          currentStep={currentStep}
          onNavigate={navigateTo}
          hasSelectedServices={selectedServicesList.length > 0}
          hasSelectedSchedule={selectedDate !== null && Boolean(selectedTime)}
        />

        {/* Notification Toast */}
        {toastMessage && (
          <div className="mx-4 mt-3 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-2xl flex items-center gap-2 shadow-xs transition animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Main Step Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-5 pb-8 no-scrollbar">
          {currentStep === 1 && (
            <DoctorProfileView
              doctor={doctor}
              onOpenReviews={() => setIsReviewsOpen(true)}
              onOpenLightbox={(idx) => {
                setLightboxIndex(idx);
                setIsLightboxOpen(true);
              }}
              onChooseServices={() => navigateTo(2)}
            />
          )}

          {currentStep === 2 && (
            <ServicesSelectionView
              services={services}
              selectedServices={selectedServicesMap}
              onToggleService={handleToggleService}
              onContinue={() => navigateTo(3)}
            />
          )}

          {currentStep === 3 && (
            <ScheduleView
              selectedServices={selectedServicesList}
              onChangeServices={() => navigateTo(2)}
              selectedDate={selectedDate}
              onSelectDate={(d) => setSelectedDate(d)}
              selectedTime={selectedTime}
              onSelectTime={(t) => setSelectedTime(t)}
              onProceedToPayment={() => navigateTo(4)}
              showToast={showToast}
            />
          )}

          {currentStep === 4 && selectedDate && (
            <PaymentView
              selectedServices={selectedServicesList}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              onPaymentSuccess={handlePaymentSuccess}
              showToast={showToast}
            />
          )}
        </main>
      </div>

      {/* Lightbox Modal */}
      <LightboxModal
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        images={doctor.clinicImages}
        currentIndex={lightboxIndex}
        onNavigate={(idx) => setLightboxIndex(idx)}
      />

      {/* Patient Reviews & Feedback Modal */}
      <ReviewsModal
        isOpen={isReviewsOpen}
        onClose={() => setIsReviewsOpen(false)}
        reviews={reviews}
        onAddReview={handleAddReview}
      />

      {/* Bookings History & Cancellation Drawer */}
      <BookingsHistoryModal
        isOpen={isBookingsOpen}
        onClose={() => setIsBookingsOpen(false)}
        appointments={appointments}
        onCancelAppointment={handleCancelAppointment}
        onReopenSlot={handleReopenSlot}
        onSelectBookingForReceipt={(apt) => {
          setConfirmedAppointment(apt);
          setIsConfirmationOpen(true);
        }}
      />

      {/* Appointment Confirmation & Digital Receipt Modal */}
      <ConfirmationModal
        isOpen={isConfirmationOpen}
        onClose={() => {
          setIsConfirmationOpen(false);
          setCurrentStep(1);
        }}
        appointment={confirmedAppointment}
        onViewAllBookings={() => {
          setIsConfirmationOpen(false);
          handleOpenBookings();
        }}
      />
    </div>
  );
}
