import AppLayout from '@/Layouts/AppLayout';
import { VStack } from '@/Components/ui/stack';
import { EmbeddedAppointmentType } from '@/Features/booking-chat/embedded/EmbeddedAppointmentType';
import { EmbeddedFollowUpReason } from '@/Features/booking-chat/embedded/EmbeddedFollowUpReason';
import { EmbeddedAppointmentMode } from '@/Features/booking-chat/embedded/EmbeddedAppointmentMode';
import { EmbeddedUrgencySelector } from '@/Features/booking-chat/embedded/EmbeddedUrgencySelector';
import { EmbeddedLocationSelector } from '@/Features/booking-chat/embedded/EmbeddedLocationSelector';
import { EmbeddedPackageList } from '@/Features/booking-chat/embedded/EmbeddedPackageList';
import { EmbeddedDoctorList } from '@/Features/booking-chat/embedded/EmbeddedDoctorList';
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

  // Mock data
  const mockAppointmentModes = [
    {
      type: 'video',
      price: 500,
    },
    {
      type: 'in_person',
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
      included_test_names: ['Lipid Profile', 'ECG', 'CRP', 'Blood Pressure', 'Heart Rate Variability'],
      preparation_notes: 'Fasting for 12 hours before the test. Water is allowed during fasting period.',
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
      duration_hours: '1-2',
      tests_count: 24,
      age_range: '25+',
      price: 1499,
      original_price: 1999,
      is_recommended: false,
      requires_fasting: true,
      fasting_hours: 8,
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
      specialty: 'Cardiologist',
      experience_years: 15,
      consultation_fee: 800,
      next_available: '2026-02-10',
      rating: 4.8,
      total_reviews: 234,
      avatar_url: null,
      supported_modes: ['video', 'in_person'],
      slots: [
        { time: '09:00', mode: 'video' as const, is_preferred: true },
        { time: '10:00', mode: 'video' as const, is_preferred: false },
        { time: '14:00', mode: 'in_person' as const, is_preferred: false },
        { time: '15:00', mode: 'in_person' as const, is_preferred: false },
      ],
    },
    {
      id: '2',
      name: 'Dr. Rajesh Kumar',
      specialty: 'General Physician',
      experience_years: 12,
      consultation_fee: 600,
      next_available: '2026-02-09',
      rating: 4.6,
      total_reviews: 189,
      avatar_url: null,
      supported_modes: ['video', 'in_person'],
      slots: [
        { time: '11:00', mode: 'video' as const, is_preferred: false },
        { time: '16:00', mode: 'in_person' as const, is_preferred: true },
      ],
    },
    {
      id: '3',
      name: 'Dr. Priya Sharma',
      specialty: 'Pediatrician',
      experience_years: 10,
      consultation_fee: 700,
      next_available: '2026-02-10',
      rating: 4.9,
      total_reviews: 312,
      avatar_url: null,
      supported_modes: ['video', 'in_person'],
      slots: [
        { time: '09:30', mode: 'video' as const, is_preferred: true },
        { time: '13:00', mode: 'in_person' as const, is_preferred: false },
      ],
    },
  ];

  return (
    <AppLayout title="Booking Components Showcase">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <VStack gap={12}>
          {/* Header */}
          <div>
            <h1 className="text-page-title mb-2">AI Booking Flow Components</h1>
            <p className="text-body text-muted-foreground">
              Showcase of all embedded components used in the AI booking conversation flow
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
                  onSelect={setDoctorId}
                  disabled={false}
                  mode="chat"
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

              {/* Package List */}
              <div>
                <h3 className="text-card-title mb-3 text-muted-foreground">Lab Packages</h3>
                <EmbeddedPackageList
                  packages={mockPackages}
                  selectedPackageId={packageId}
                  onSelect={setPackageId}
                  disabled={false}
                  mode="chat"
                />
              </div>
            </VStack>
          </div>

          {/* Component Patterns */}
          <div className="border-t pt-8">
            <h2 className="text-section-title mb-4">Design Patterns</h2>
            <div className="bg-muted/30 rounded-xl p-6">
              <VStack gap={3}>
                <div>
                  <h4 className="text-label mb-1">Blue Circular Icon Style</h4>
                  <p className="text-body text-muted-foreground">
                    Icons always <code className="bg-background px-1.5 py-0.5 rounded">text-primary</code> (blue).
                    Container changes: <code className="bg-background px-1.5 py-0.5 rounded">bg-primary/10</code> when selected,
                    <code className="bg-background px-1.5 py-0.5 rounded ml-1">bg-muted</code> when unselected.
                  </p>
                </div>
                <div>
                  <h4 className="text-label mb-1">Selection State</h4>
                  <p className="text-body text-muted-foreground">
                    Selected cards: <code className="bg-background px-1.5 py-0.5 rounded">bg-primary/10 border-l-2 border-l-primary</code>
                  </p>
                </div>
                <div>
                  <h4 className="text-label mb-1">Card Lists</h4>
                  <p className="text-body text-muted-foreground">
                    All use <code className="bg-background px-1.5 py-0.5 rounded">Card + divide-y + Button variant="ghost"</code> with
                    <code className="bg-background px-1.5 py-0.5 rounded ml-1">px-6 py-4 rounded-none</code>
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
