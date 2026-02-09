import AppLayout from '@/Layouts/AppLayout';
import { VStack } from '@/Components/ui/stack';
import { Card } from '@/Components/ui/card';
import { EmbeddedAppointmentType } from '@/Features/booking-chat/embedded/EmbeddedAppointmentType';
import { EmbeddedFollowUpReason } from '@/Features/booking-chat/embedded/EmbeddedFollowUpReason';
import { EmbeddedAppointmentMode } from '@/Features/booking-chat/embedded/EmbeddedAppointmentMode';
import { EmbeddedUrgencySelector } from '@/Features/booking-chat/embedded/EmbeddedUrgencySelector';
import { EmbeddedLocationSelector } from '@/Features/booking-chat/embedded/EmbeddedLocationSelector';
import { EmbeddedPackageList } from '@/Features/booking-chat/embedded/EmbeddedPackageList';
import { EmbeddedDoctorList } from '@/Features/booking-chat/embedded/EmbeddedDoctorList';
import { EmbeddedCenterList } from '@/Features/booking-chat/embedded/EmbeddedCenterList';
import { EmbeddedPreviousDoctorsList } from '@/Features/booking-chat/embedded/EmbeddedPreviousDoctorsList';
import { EmbeddedFamilyMemberForm } from '@/Features/booking-chat/embedded/EmbeddedFamilyMemberForm';
import { EmbeddedAddressForm } from '@/Features/booking-chat/embedded/EmbeddedAddressForm';
import { EmbeddedPreviousVisit } from '@/Features/booking-chat/embedded/EmbeddedPreviousVisit';
import { DetectionCard } from '@/Features/booking-chat/embedded/DetectionCard';
import { EmbeddedFollowUpFlow } from '@/Features/booking-chat/embedded/EmbeddedFollowUpFlow';
import { EmbeddedAddressSelector } from '@/Features/booking-chat/embedded/EmbeddedAddressSelector';
import { EmbeddedCollectionMethod } from '@/Features/booking-chat/embedded/EmbeddedCollectionMethod';
import { EmbeddedBookingSummary } from '@/Features/booking-chat/embedded/EmbeddedBookingSummary';
import { EmbeddedDateTimePicker } from '@/Features/booking-chat/embedded/EmbeddedDateTimePicker';
import { TypeSelectorCard } from '@/Features/booking-chat/embedded/TypeSelectorCard';
import { Collapsible, CollapsibleContent } from '@/Components/ui/collapsible';
import { Input } from '@/Components/ui/input';
import { Button } from '@/Components/ui/button';
import { PhoneInput } from '@/Components/ui/phone-input';
import { useState } from 'react';

export default function BookingComponents() {
  // Mock state for components
  const [appointmentType, setAppointmentType] = useState<'new' | 'followup' | null>(null);
  const [followUpReason, setFollowUpReason] = useState<string | null>(null);
  const [appointmentMode, setAppointmentMode] = useState<string | null>(null);
  const [urgency, setUrgency] = useState<string | null>(null);
  const [locationId, setLocationId] = useState<string | null>(null);
  const [packageId, setPackageId] = useState<string | null>(null);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [doctorTime, setDoctorTime] = useState<string | null>(null);
  const [centerId, setCenterId] = useState<number | null>(null);
  const [previousDoctorId, setPreviousDoctorId] = useState<string | null>(null);
  const [previousDoctorTime, setPreviousDoctorTime] = useState<string | null>(null);
  const [addressId, setAddressId] = useState<number | null>(null);
  const [collectionMethod, setCollectionMethod] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedTestIds, setSelectedTestIds] = useState<string[]>([]);
  const [typeSelectorExpanded, setTypeSelectorExpanded] = useState<'new_member' | 'link_existing' | 'guest' | null>(null);

  // Mock data
  const mockAppointmentModes = [
    {
      type: 'video' as const,
      price: 500,
    },
    {
      type: 'in_person' as const,
      price: 800,
    },
  ];

  const mockLocations = [
    {
      id: '1',
      type: 'home' as const,
      address: '123 Main Street, Apartment 4B, Mumbai, Maharashtra 400001',
      fee: 200,
    },
    {
      id: '2',
      type: 'center' as const,
      name: 'HealthFirst Diagnostic Center',
      address: '456 Park Avenue, Andheri West, Mumbai 400058',
      distance_km: 2.5,
      fee: 'free' as const,
    },
    {
      id: '3',
      type: 'center' as const,
      name: 'CareWell Lab & Diagnostics',
      address: '789 Link Road, Malad West, Mumbai 400064',
      distance_km: 5.8,
      fee: 'free' as const,
    },
  ];

  const mockIndividualTests = [
    {
      id: '1',
      name: 'Complete Blood Count (CBC)',
      description: 'Measures different components of blood including RBC, WBC, and platelets',
      category: 'Hematology',
      price: 299,
      turnaround_hours: 24,
      requires_fasting: false,
      fasting_hours: null,
      sub_tests: ['Red Blood Cell Count', 'White Blood Cell Count', 'Platelet Count', 'Hemoglobin', 'Hematocrit'],
    },
    {
      id: '2',
      name: 'Lipid Profile',
      description: 'Measures cholesterol levels including HDL, LDL, and triglycerides',
      category: 'Cardiology',
      price: 499,
      turnaround_hours: 24,
      requires_fasting: true,
      fasting_hours: 12,
      sub_tests: ['Total Cholesterol', 'HDL Cholesterol', 'LDL Cholesterol', 'Triglycerides', 'VLDL Cholesterol', 'TC/HDL Ratio', 'LDL/HDL Ratio'],
    },
    {
      id: '3',
      name: 'Thyroid Profile (TSH, T3, T4)',
      description: 'Comprehensive thyroid function assessment',
      category: 'Endocrinology',
      price: 599,
      turnaround_hours: 48,
      requires_fasting: false,
      fasting_hours: null,
      sub_tests: ['Triiodothyronine (T3), Total - Serum', 'Thyroxine (T4), Total - Serum', 'Thyroid-Stimulating Hormone (TSH)'],
    },
    {
      id: '4',
      name: 'Vitamin D (25-OH)',
      description: 'Measures vitamin D levels in blood',
      category: 'Vitamins',
      price: 899,
      turnaround_hours: 72,
      requires_fasting: false,
      fasting_hours: null,
    },
    {
      id: '5',
      name: 'HbA1c (Glycated Hemoglobin)',
      description: 'Average blood sugar levels over the past 3 months',
      category: 'Diabetes',
      price: 399,
      turnaround_hours: 24,
      requires_fasting: true,
      fasting_hours: 8,
    },
  ];

  const mockPackages = [
    {
      id: '1',
      name: 'Heart Health Package',
      description: 'Comprehensive cardiac screening including lipid profile, ECG, and CRP',
      duration_hours: '2',
      tests_count: 35,
      age_range: '30+',
      price: 3499,
      original_price: 4499,
      is_recommended: true,
      requires_fasting: true,
      fasting_hours: 12,
      collection_time: '7 AM today',
      report_turnaround: '8 hours',
      test_groups: [
        {
          name: 'Lipid Profile',
          tests_included: ['Total Cholesterol', 'HDL Cholesterol', 'LDL Cholesterol', 'Triglycerides', 'VLDL Cholesterol'],
        },
        {
          name: 'ECG (Electrocardiogram)',
          tests_included: [],
        },
        {
          name: 'CRP (C-Reactive Protein)',
          tests_included: [],
        },
        {
          name: 'Blood Pressure Monitoring',
          tests_included: [],
        },
        {
          name: 'Heart Rate Variability',
          tests_included: [],
        },
      ],
      preparation_instructions: [
        {
          icon: 'fasting' as const,
          text: 'Fasting for 12 hours required',
        },
        {
          icon: 'water' as const,
          text: 'Water is allowed',
        },
        {
          icon: 'medication' as const,
          text: 'Continue heart medications as prescribed',
        },
      ],
    },
    {
      id: '2',
      name: "Women's Health Package",
      description: 'Tailored health screening for women including thyroid, iron, vitamin D, and CBC',
      duration_hours: '2',
      tests_count: 45,
      age_range: '18+',
      price: 3999,
      original_price: 4999,
      is_recommended: true,
      requires_fasting: false,
      fasting_hours: null,
      included_test_names: ['Thyroid Profile', 'Iron Studies', 'Vitamin D', 'CBC', 'Calcium'],
    },
    {
      id: '3',
      name: 'Complete Health Checkup',
      description: 'Comprehensive tests for overall health assessment including CBC, lipid, thyroid, liver, kidney, and more',
      duration_hours: '2-3',
      tests_count: 72,
      age_range: '18-60',
      price: 4999,
      original_price: 5999,
      is_recommended: true,
      requires_fasting: true,
      fasting_hours: 10,
    },
    {
      id: '4',
      name: 'Diabetes Screening Package',
      description: 'Blood sugar, HbA1c, kidney function, and related tests for diabetes monitoring',
      duration_hours: '2-3',
      tests_count: 36,
      age_range: '25+',
      price: 1499,
      original_price: 1999,
      is_recommended: false,
      requires_fasting: true,
      fasting_hours: 12,
      collection_time: '6 AM tomorrow',
      report_turnaround: '10 hours',
      test_groups: [
        {
          name: 'FBS (Fasting Blood Sugar) Test',
          tests_included: [],
        },
        {
          name: 'ESR Test (Erythrocyte Sedimentation Rate)',
          tests_included: [],
        },
        {
          name: 'CBC Test (Complete Blood Count)',
          tests_included: ['Red Blood Cell Count', 'White Blood Cell Count', 'Platelet Count'],
        },
        {
          name: 'Thyroid Profile (T3 T4 TSH) Test',
          tests_included: ['Triiodothyronine (T3), Total - Serum', 'Thyroxine (T4), Total - Serum', 'Thyroid-Stimulating Hormone (TSH)'],
        },
        {
          name: 'Lipid Profile Test',
          tests_included: ['Total Cholesterol', 'HDL Cholesterol', 'LDL Cholesterol', 'Triglycerides', 'VLDL Cholesterol', 'TC/HDL Ratio', 'LDL/HDL Ratio', 'Non-HDL Cholesterol'],
        },
        {
          name: 'LFT (Liver Function) Test',
          tests_included: ['Bilirubin Total', 'Bilirubin Direct', 'Bilirubin Indirect', 'SGOT', 'SGPT', 'Alkaline Phosphatase', 'Total Protein', 'Albumin', 'Globulin', 'A/G Ratio', 'GGT'],
        },
        {
          name: 'KFT with Electrolytes (Kidney Function)',
          tests_included: ['Blood Urea', 'Serum Creatinine', 'Blood Urea Nitrogen', 'BUN/Creatinine Ratio', 'Uric Acid', 'Sodium', 'Potassium', 'Chloride', 'Bicarbonate', 'Calcium', 'Phosphorus', 'Magnesium', 'Anion Gap', 'eGFR'],
        },
      ],
      preparation_instructions: [
        {
          icon: 'fasting' as const,
          text: 'Fasting for 10-12 hours required',
        },
        {
          icon: 'water' as const,
          text: 'Water is allowed',
        },
        {
          icon: 'alcohol' as const,
          text: 'Avoid alcohol 24 hours before',
        },
        {
          icon: 'medication' as const,
          text: 'Continue regular medications unless advised otherwise',
        },
      ],
    },
    {
      id: '5',
      name: 'Basic Health Panel',
      description: 'Essential tests for routine health monitoring including CBC, blood sugar, and kidney function',
      duration_hours: '1',
      tests_count: 18,
      age_range: '18+',
      price: 2499,
      original_price: 2999,
      is_recommended: false,
      requires_fasting: false,
      fasting_hours: null,
    },
  ];

  const mockDoctors = [
    {
      id: '1',
      name: 'Dr. Sarah Johnson',
      avatar: null,
      specialization: 'Cardiologist',
      experience_years: 15,
      consultation_fee: 800,
      next_available: '2026-02-10',
      rating: 4.8,
      total_reviews: 234,
      consultation_modes: ['video', 'in_person'],
      video_fee: 800,
      in_person_fee: 1000,
      education: ['MBBS', 'MD (Cardiology)', 'DM (Cardiology)'],
      languages: ['English', 'Hindi'],
      slots: [
        { time: '09:00', mode: 'video' as const, available: true, preferred: true },
        { time: '10:00', mode: 'video' as const, available: true, preferred: false },
        { time: '14:00', mode: 'in_person' as const, available: true, preferred: false },
        { time: '15:00', mode: 'in_person' as const, available: true, preferred: false },
      ],
    },
    {
      id: '2',
      name: 'Dr. Rajesh Kumar',
      avatar: null,
      specialization: 'General Physician',
      experience_years: 12,
      consultation_fee: 600,
      next_available: '2026-02-09',
      rating: 4.6,
      total_reviews: 189,
      consultation_modes: ['video', 'in_person'],
      video_fee: 600,
      in_person_fee: 800,
      education: ['MBBS', 'MD (General Medicine)'],
      languages: ['English', 'Hindi', 'Marathi'],
      slots: [
        { time: '11:00', mode: 'video' as const, available: true, preferred: false },
        { time: '16:00', mode: 'in_person' as const, available: true, preferred: true },
      ],
    },
    {
      id: '3',
      name: 'Dr. Priya Sharma',
      avatar: null,
      specialization: 'Pediatrician',
      experience_years: 10,
      consultation_fee: 700,
      next_available: '2026-02-10',
      rating: 4.9,
      total_reviews: 312,
      consultation_modes: ['video', 'in_person'],
      video_fee: 700,
      in_person_fee: 900,
      education: ['MBBS', 'MD (Pediatrics)'],
      languages: ['English', 'Hindi'],
      slots: [
        { time: '09:30', mode: 'video' as const, available: true, preferred: true },
        { time: '13:00', mode: 'in_person' as const, available: true, preferred: false },
      ],
    },
  ];

  const mockCenters = [
    {
      id: 1,
      name: 'HealthFirst Diagnostic Center',
      address: '456 Park Avenue, Andheri West',
      city: 'Mumbai',
      rating: 4.8,
      distance_km: 2.5,
    },
    {
      id: 2,
      name: 'CareWell Lab & Diagnostics',
      address: '789 Link Road, Malad West',
      city: 'Mumbai',
      rating: 4.6,
      distance_km: 5.8,
    },
  ];

  const mockPreviousDoctors = {
    primary: {
      id: '1',
      name: 'Dr. Sarah Johnson',
      avatar: null,
      specialization: 'Cardiologist',
      experience_years: 15,
      rating: 4.8,
      reviewCount: 234,
      last_visit: '2026-01-15',
      available_on_date: true,
      availability_message: 'Available',
      quick_times: ['09:00', '10:00', '14:00'],
      consultation_modes: ['video', 'in_person'],
      video_fee: 800,
      in_person_fee: 1000,
    },
    others: [
      {
        id: '2',
        name: 'Dr. Rajesh Kumar',
        avatar: null,
        specialization: 'General Physician',
        experience_years: 12,
        rating: 4.6,
        reviewCount: 189,
        last_visit: '2025-12-20',
        available_on_date: true,
        quick_times: ['11:00', '16:00'],
        consultation_modes: ['video'],
        video_fee: 600,
      },
    ],
  };

  const mockAddresses = [
    {
      id: 1,
      label: 'Home',
      address: '123 Main Street, Apartment 4B, Mumbai, Maharashtra 400001',
      is_default: true,
    },
    {
      id: 2,
      label: 'Office',
      address: '456 Business Park, Andheri East, Mumbai 400093',
      is_default: false,
    },
  ];

  const mockCollectionMethods = [
    {
      type: 'home' as const,
      label: 'Home Collection',
      address: '123 Main Street, Apartment 4B',
      price: 200,
    },
    {
      type: 'center' as const,
      label: 'At Diagnostic Center',
      address: 'HealthFirst Diagnostic Center',
      price: 'free' as const,
    },
  ];

  const mockPreviousVisit = {
    doctor: {
      id: '1',
      name: 'Dr. Sarah Johnson',
      avatar: null,
      specialization: 'Cardiologist',
    },
    date: '2026-01-15',
    reason: 'Routine checkup and heart monitoring',
    doctorNotes: 'Patient showing improvement. Continue current medication. Follow up recommended in 3 weeks.',
  };

  const mockDetectedMember = {
    id: 123,
    name: 'John Doe',
    age: 45,
    gender: 'male',
    patient_id: 'PT-000123',
  };

  const mockBookingSummary = {
    doctor: { name: 'Dr. Sarah Johnson', avatar: null },
    patient: { name: 'John Doe', avatar: null },
    type: 'New Appointment',
    datetime: '2026-02-15T09:00:00',
    mode: 'video',
    fee: 800,
    supported_modes: ['video', 'in_person'],
  };

  const mockDateOptions = [
    { date: '2026-02-10', label: 'Today', sublabel: 'Mon' },
    { date: '2026-02-11', label: 'Tomorrow', sublabel: 'Tue' },
    { date: '2026-02-12', label: 'Wed', sublabel: '12 Feb' },
  ];

  const mockTimeSlots = [
    { time: '9:00 AM', available: true, preferred: true },
    { time: '10:00 AM', available: true, preferred: true },
    { time: '11:00 AM', available: true, preferred: false },
    { time: '2:00 PM', available: true, preferred: false },
    { time: '3:00 PM', available: false, preferred: false },
  ];

  return (
    <AppLayout title="Booking Components Showcase">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <VStack gap={12}>
          {/* Header */}
          <div>
            <h1 className="text-page-title mb-2">AI Booking Flow Components</h1>
            <p className="text-body text-muted-foreground">
              Complete showcase of all 22 embedded components used in the AI booking conversation flow
            </p>
          </div>

          {/* Doctor Booking Components */}
          <div>
            <h2 className="text-section-title mb-6">Doctor Booking Components</h2>
            <VStack gap={8}>
              {/* Appointment Type */}
              <div>
                <h3 className="text-card-title mb-3 text-muted-foreground">Appointment Type</h3>
                <EmbeddedAppointmentType
                  selectedType={appointmentType}
                  onSelect={setAppointmentType}
                  disabled={false}
                />
              </div>

              {/* Follow-up Reason */}
              <div>
                <h3 className="text-card-title mb-3 text-muted-foreground">Follow-up Reason</h3>
                <EmbeddedFollowUpReason
                  selectedReason={followUpReason}
                  onSelect={setFollowUpReason}
                  disabled={false}
                />
              </div>

              {/* Appointment Mode */}
              <div>
                <h3 className="text-card-title mb-3 text-muted-foreground">Appointment Mode</h3>
                <EmbeddedAppointmentMode
                  modes={mockAppointmentModes}
                  selectedMode={appointmentMode}
                  onSelect={setAppointmentMode}
                  disabled={false}
                />
              </div>

              {/* Urgency Selector */}
              <div>
                <h3 className="text-card-title mb-3 text-muted-foreground">Urgency Selector</h3>
                <EmbeddedUrgencySelector
                  selectedUrgency={urgency}
                  onSelect={setUrgency}
                  disabled={false}
                />
              </div>

              {/* Doctor List */}
              <div>
                <h3 className="text-card-title mb-3 text-muted-foreground">Doctor List</h3>
                <EmbeddedDoctorList
                  doctors={mockDoctors}
                  selectedDoctorId={doctorId}
                  selectedTime={doctorTime}
                  onSelect={(id, time) => {
                    setDoctorId(id);
                    setDoctorTime(time);
                  }}
                  disabled={false}
                />
              </div>

              {/* Previous Doctors List */}
              <div>
                <h3 className="text-card-title mb-3 text-muted-foreground">Previous Doctors List</h3>
                <EmbeddedPreviousDoctorsList
                  primaryDoctor={mockPreviousDoctors.primary}
                  otherDoctors={mockPreviousDoctors.others}
                  selectedDoctorId={previousDoctorId}
                  selectedTime={previousDoctorTime}
                  onSelect={(doctorId, time) => {
                    setPreviousDoctorId(doctorId);
                    setPreviousDoctorTime(time);
                  }}
                  onSeeOtherDoctors={() => console.log('See other doctors')}
                  disabled={false}
                />
              </div>

              {/* Previous Visit Card */}
              <div>
                <h3 className="text-card-title mb-3 text-muted-foreground">Previous Visit Card</h3>
                <EmbeddedPreviousVisit visit={mockPreviousVisit} />
              </div>

              {/* Follow-up Flow */}
              <div>
                <h3 className="text-card-title mb-3 text-muted-foreground">Follow-up Flow</h3>
                <EmbeddedFollowUpFlow
                  previousVisit={mockPreviousVisit}
                  selectedReason={followUpReason}
                  onSelect={setFollowUpReason}
                  disabled={false}
                />
              </div>
            </VStack>
          </div>

          {/* Lab Test Booking Components */}
          <div>
            <h2 className="text-section-title mb-6">Lab Test Booking Components</h2>
            <VStack gap={8}>
              {/* Location Selector */}
              <div>
                <h3 className="text-card-title mb-3 text-muted-foreground">Location Selector</h3>
                <EmbeddedLocationSelector
                  locations={mockLocations}
                  selectedLocationId={locationId}
                  onSelect={setLocationId}
                  disabled={false}
                />
              </div>

              {/* Package List with Tabs */}
              <div>
                <h3 className="text-card-title mb-3 text-muted-foreground">Lab Packages & Individual Tests (with tabs)</h3>
                <EmbeddedPackageList
                  packages={mockPackages}
                  individualTests={mockIndividualTests}
                  selectedPackageId={packageId}
                  selectedTestIds={selectedTestIds}
                  onSelect={setPackageId}
                  onSelectTests={setSelectedTestIds}
                  disabled={false}
                  mode="chat"
                />
              </div>

              {/* Center List */}
              <div>
                <h3 className="text-card-title mb-3 text-muted-foreground">Diagnostic Centers</h3>
                <EmbeddedCenterList
                  centers={mockCenters}
                  selectedCenterId={centerId}
                  onSelect={setCenterId}
                  disabled={false}
                />
              </div>

              {/* Collection Method */}
              <div>
                <h3 className="text-card-title mb-3 text-muted-foreground">Collection Method</h3>
                <EmbeddedCollectionMethod
                  methods={mockCollectionMethods}
                  selectedMethod={collectionMethod}
                  onSelect={setCollectionMethod}
                  disabled={false}
                />
              </div>
            </VStack>
          </div>

          {/* Patient & Address Components */}
          <div>
            <h2 className="text-section-title mb-6">Patient & Address Components</h2>
            <VStack gap={8}>
              {/* Address Selector */}
              <div>
                <h3 className="text-card-title mb-3 text-muted-foreground">Address Selector</h3>
                <EmbeddedAddressSelector
                  addresses={mockAddresses}
                  selectedAddressId={addressId}
                  onSelect={(id, label, address) => {
                    setAddressId(id);
                    console.log('Selected:', { id, label, address });
                  }}
                  onAddAddress={() => console.log('Add new address')}
                  disabled={false}
                />
              </div>

              {/* Address Form */}
              <div>
                <h3 className="text-card-title mb-3 text-muted-foreground">Address Form</h3>
                <EmbeddedAddressForm
                  onSelect={(data) => console.log('Address added:', data)}
                  disabled={false}
                />
              </div>

              {/* Family Member Form */}
              <div>
                <h3 className="text-card-title mb-3 text-muted-foreground">Family Member Form</h3>
                <EmbeddedFamilyMemberForm
                  onSelect={(data) => console.log('Member added:', data)}
                  disabled={false}
                />
              </div>

              {/* Detection Card */}
              <div>
                <h3 className="text-card-title mb-3 text-muted-foreground">Member Detection Card</h3>
                <DetectionCard
                  member={mockDetectedMember}
                  onAccept={() => console.log('Member accepted')}
                  disabled={false}
                />
              </div>
            </VStack>
          </div>

          {/* Date/Time & Summary Components */}
          <div>
            <h2 className="text-section-title mb-6">Date/Time & Summary Components</h2>
            <VStack gap={8}>
              {/* Date Time Selector */}
              <div>
                <h3 className="text-card-title mb-3 text-muted-foreground">Date Time Picker (with custom dates/slots)</h3>
                <EmbeddedDateTimePicker
                  dates={mockDateOptions}
                  slots={mockTimeSlots}
                  fastingRequired={true}
                  fastingHours={12}
                  selectedDate={selectedDate}
                  selectedTime={selectedTime}
                  onSelect={(date: string, time: string) => {
                    setSelectedDate(date);
                    setSelectedTime(time);
                  }}
                  disabled={false}
                />
              </div>

              {/* Date Time Picker with auto-generated dates */}
              <div>
                <h3 className="text-card-title mb-3 text-muted-foreground">Date Time Picker (auto-generated)</h3>
                <EmbeddedDateTimePicker
                  selectedDate={selectedDate}
                  selectedTime={selectedTime}
                  onSelect={(date: string, time: string) => {
                    setSelectedDate(date);
                    setSelectedTime(time);
                  }}
                  disabled={false}
                  warning={{
                    title: 'Fasting Required',
                    description: '12 hours fasting required before test. Morning slots recommended.',
                  }}
                />
              </div>

              {/* Booking Summary */}
              <div>
                <h3 className="text-card-title mb-3 text-muted-foreground">Booking Summary</h3>
                <EmbeddedBookingSummary
                  summary={mockBookingSummary}
                  onPay={() => console.log('Payment initiated')}
                  onSelect={(selection) => console.log('Change requested:', selection)}
                  disabled={false}
                  conversationId="mock-conversation-id"
                />
              </div>
            </VStack>
          </div>

          {/* Helper Components */}
          <div>
            <h2 className="text-section-title mb-6">Helper Components</h2>
            <VStack gap={8}>
              {/* Adding New Member Cards */}
              <div>
                <h3 className="text-card-title mb-3 text-muted-foreground">Adding New Member Cards</h3>
                <Card className="overflow-hidden">
                  <div className="divide-y">
                    {/* New Member */}
                    <div>
                      <TypeSelectorCard
                        type="new_member"
                        isExpanded={typeSelectorExpanded === 'new_member'}
                        onClick={() => setTypeSelectorExpanded(typeSelectorExpanded === 'new_member' ? null : 'new_member')}
                        disabled={false}
                      />
                      <Collapsible open={typeSelectorExpanded === 'new_member'}>
                        <CollapsibleContent className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2">
                          <div className="px-6 pb-6 pt-4 space-y-4">
                            <div className="space-y-2">
                              <label className="text-label text-foreground">Full Name <span className="text-destructive">*</span></label>
                              <Input placeholder="Enter full name" />
                            </div>
                            <div className="space-y-2">
                              <label className="text-label text-foreground">Phone Number <span className="text-destructive">*</span></label>
                              <PhoneInput value="+91" onChange={() => {}} />
                            </div>
                            <div className="space-y-2">
                              <label className="text-label text-foreground">Relationship <span className="text-destructive">*</span></label>
                              <Input placeholder="e.g., Mother, Father, Sister" />
                            </div>
                            <Button variant="accent" size="md">Add Member</Button>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>

                    {/* Existing Patient */}
                    <div>
                      <TypeSelectorCard
                        type="link_existing"
                        isExpanded={typeSelectorExpanded === 'link_existing'}
                        onClick={() => setTypeSelectorExpanded(typeSelectorExpanded === 'link_existing' ? null : 'link_existing')}
                        disabled={false}
                      />
                      <Collapsible open={typeSelectorExpanded === 'link_existing'}>
                        <CollapsibleContent className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2">
                          <div className="px-6 pb-6 pt-4 space-y-4">
                            <div className="space-y-2">
                              <label className="text-label text-foreground">Search by phone, email, or patient ID</label>
                              <Input placeholder="e.g., 9876543210, email@example.com, or PT-000001" />
                            </div>
                            <Button variant="accent" size="md">Search</Button>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>

                    {/* Guest */}
                    <div>
                      <TypeSelectorCard
                        type="guest"
                        isExpanded={typeSelectorExpanded === 'guest'}
                        onClick={() => setTypeSelectorExpanded(typeSelectorExpanded === 'guest' ? null : 'guest')}
                        disabled={false}
                      />
                      <Collapsible open={typeSelectorExpanded === 'guest'}>
                        <CollapsibleContent className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2">
                          <div className="px-6 pb-6 pt-4 space-y-4">
                            <div className="space-y-2">
                              <label className="text-label text-foreground">Guest Name <span className="text-destructive">*</span></label>
                              <Input placeholder="Enter guest name" />
                            </div>
                            <div className="space-y-2">
                              <label className="text-label text-foreground">Phone Number <span className="text-destructive">*</span></label>
                              <PhoneInput value="+91" onChange={() => {}} />
                            </div>
                            <Button variant="accent" size="md">Add Guest</Button>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  </div>
                </Card>
              </div>
            </VStack>
          </div>

          {/* Component Patterns */}
          <div className="border-t pt-8">
            <h2 className="text-section-title mb-4">Design System Patterns</h2>
            <div className="bg-muted/30 rounded-xl p-6">
              <VStack gap={4}>
                <div>
                  <h4 className="text-label mb-1">Component Standardization</h4>
                  <p className="text-body text-muted-foreground">
                    All 22 components follow the global design system with <code className="bg-background px-1.5 py-0.5 rounded">Card</code> component,
                    <code className="bg-background px-1.5 py-0.5 rounded ml-1">Icon</code> component, design tokens, and zero arbitrary values.
                  </p>
                </div>
                <div>
                  <h4 className="text-label mb-1">Blue Circular Icon Style</h4>
                  <p className="text-body text-muted-foreground">
                    Icons always <code className="bg-background px-1.5 py-0.5 rounded">text-blue-800</code> in <code className="bg-background px-1.5 py-0.5 rounded">bg-blue-200</code> circular containers.
                    Selected card: <code className="bg-background px-1.5 py-0.5 rounded">bg-primary/10</code>. Unselected: default background.
                  </p>
                </div>
                <div>
                  <h4 className="text-label mb-1">Selection State</h4>
                  <p className="text-body text-muted-foreground">
                    Selected: <code className="bg-background px-1.5 py-0.5 rounded">bg-primary/10 border-l-2 border-l-primary</code> |
                    Hover: <code className="bg-background px-1.5 py-0.5 rounded">hover:bg-muted/50</code>
                  </p>
                </div>
                <div>
                  <h4 className="text-label mb-1">Card-Based Lists</h4>
                  <p className="text-body text-muted-foreground">
                    All selectors use <code className="bg-background px-1.5 py-0.5 rounded">Card + divide-y + Button variant="ghost"</code> with
                    <code className="bg-background px-1.5 py-0.5 rounded ml-1">px-6 py-4 rounded-none</code>
                  </p>
                </div>
                <div>
                  <h4 className="text-label mb-1">Typography</h4>
                  <p className="text-body text-muted-foreground">
                    Design tokens only: <code className="bg-background px-1.5 py-0.5 rounded">text-label</code>,
                    <code className="bg-background px-1.5 py-0.5 rounded ml-1">text-body</code>,
                    <code className="bg-background px-1.5 py-0.5 rounded ml-1">text-card-title</code> - Never text-sm, text-base, etc.
                  </p>
                </div>
              </VStack>
            </div>
          </div>
        </VStack>
      </div>
    </AppLayout>
  );
}
