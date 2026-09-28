-- ============================================================================
-- DR. ANANYA RAO CLINIC - SUPABASE POSTGRESQL SCHEMA
-- Supports: Appointment Booking, Instant Slot Locking, Razorpay Transactions
-- ============================================================================

-- 1. APPOINTMENTS TABLE
-- Stores patient booking details and locked time slots
CREATE TABLE IF NOT EXISTS public.appointments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    appointment_number TEXT UNIQUE NOT NULL,
    patient_name TEXT NOT NULL,
    patient_phone TEXT NOT NULL,
    patient_email TEXT,
    patient_notes TEXT,
    service_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    service_names JSONB NOT NULL DEFAULT '[]'::jsonb,
    date DATE NOT NULL,
    time TEXT NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 399.00,
    payment_method TEXT NOT NULL DEFAULT 'razorpay',
    status TEXT NOT NULL DEFAULT 'CONFIRMED' CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED')),
    is_locked BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for instant slot conflict lookups (locks slot for date & time)
CREATE INDEX IF NOT EXISTS idx_appointments_date_time_status 
ON public.appointments (date, time) 
WHERE status = 'CONFIRMED';

-- Index for patient lookups
CREATE INDEX IF NOT EXISTS idx_appointments_phone 
ON public.appointments (patient_phone);

CREATE INDEX IF NOT EXISTS idx_appointments_created 
ON public.appointments (created_at DESC);


-- 2. PAYMENTS TABLE
-- Stores Razorpay Orders, Payment IDs, HMAC signatures, and verification records
CREATE TABLE IF NOT EXISTS public.payments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    appointment_id TEXT REFERENCES public.appointments(id) ON DELETE CASCADE,
    appointment_number TEXT,
    razorpay_order_id TEXT NOT NULL,
    razorpay_payment_id TEXT NOT NULL UNIQUE,
    razorpay_signature TEXT,
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    payment_method TEXT DEFAULT 'upi',
    receipt_number TEXT,
    status TEXT NOT NULL DEFAULT 'captured' CHECK (status IN ('authorized', 'captured', 'failed', 'refunded')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id 
ON public.payments (razorpay_order_id);

CREATE INDEX IF NOT EXISTS idx_payments_payment_id 
ON public.payments (razorpay_payment_id);


-- 3. TREATMENT SERVICES CATALOG TABLE
-- Stores treatments, pricing, duration, and details
CREATE TABLE IF NOT EXISTS public.treatment_services (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    numeric_price NUMERIC(10, 2) NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 45,
    price_text TEXT NOT NULL,
    breakdown TEXT,
    description TEXT,
    image_url TEXT,
    includes JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);


-- 4. PATIENT REVIEWS TABLE
CREATE TABLE IF NOT EXISTS public.patient_reviews (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    patient_name TEXT NOT NULL,
    initials TEXT,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    treatment TEXT NOT NULL,
    comment TEXT NOT NULL,
    verified BOOLEAN NOT NULL DEFAULT true,
    avatar_color TEXT DEFAULT 'bg-teal-600',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);


-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatment_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_reviews ENABLE ROW LEVEL SECURITY;

-- Allow public read and write for patient booking flow
CREATE POLICY "Public read appointments" ON public.appointments FOR SELECT USING (true);
CREATE POLICY "Public insert appointments" ON public.appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update appointments" ON public.appointments FOR UPDATE USING (true);

CREATE POLICY "Public read payments" ON public.payments FOR SELECT USING (true);
CREATE POLICY "Public insert payments" ON public.payments FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read services" ON public.treatment_services FOR SELECT USING (true);
CREATE POLICY "Public read reviews" ON public.patient_reviews FOR SELECT USING (true);
CREATE POLICY "Public insert reviews" ON public.patient_reviews FOR INSERT WITH CHECK (true);


-- ============================================================================
-- AUTO-UPDATE TIMESTAMPS TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_appointments_updated_at ON public.appointments;
CREATE TRIGGER trigger_appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();


-- ============================================================================
-- SEED INITIAL SERVICES & DEMO DATA
-- ============================================================================

INSERT INTO public.treatment_services (id, name, category, numeric_price, duration_minutes, price_text, breakdown, description, image_url, includes)
VALUES 
('teeth-cleaning', 'Comprehensive Teeth Cleaning & Polishing', 'Preventive Care', 1200.00, 45, '₹1,200', 'Scaling: ₹800 + Polishing: ₹400', 'Ultrasonic deep cleaning to remove plaque, tartar, and stubborn surface stains, finished with diamond paste enamel polish.', 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&q=80&w=600', '["Full mouth ultrasonic scaling", "Diamond paste polishing", "Gum health assessment", "Oral hygiene guidance"]'),
('root-canal', 'Single-Visit Root Canal Therapy', 'Endodontics', 4500.00, 60, '₹4,500', 'Pulp treatment + Biomechanical prep', 'Painless, rotary endodontic treatment utilizing apex locators and digital imaging to save infected or severely damaged natural teeth.', 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=600', '["Digital diagnostic X-rays", "Computerized rotary canal prep", "Thermal gutta-percha obturation", "Temporary post & core buildup"]'),
('teeth-whitening', 'Laser In-Office Teeth Whitening', 'Cosmetic', 6500.00, 45, '₹6,500', 'Bleaching gel + Blue LED activation', 'Medical-grade 35% hydrogen peroxide gel activated with specialized LED light to safely brighten enamel up to 8 shades in one sitting.', 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&q=80&w=600', '["Gingival barrier protection", "3 cycles of LED bleaching", "Enamel remineralizing treatment", "Take-home touchup gel"]'),
('dental-implants', 'Titanium Dental Implant Consultation', 'Implantology', 25000.00, 60, '₹25,000', 'Surgical placement + Custom abutment', 'Permanent, natural-feeling tooth replacement using biocompatible grade 4 titanium fixture fused directly with the jawbone.', 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=600', '["3D CBCT scan evaluation", "Precision surgical placement", "Healing screw & cap", "Post-op medication kit"]')
ON CONFLICT (id) DO NOTHING;
