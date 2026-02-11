import { router } from '@inertiajs/react';
import { useNavigation } from '@/Hooks/useNavigation';
import { GuidedBookingLayout } from '@/Layouts/GuidedBookingLayout';
import { BookingSummary, type BookingSummaryRow } from '@/Components/BookingSummary';
import { format, parseISO } from 'date-fns';

const doctorSteps = [
  { id: 'concerns', label: 'Concerns' },
  { id: 'doctor_time', label: 'Doctor & Time' },
  { id: 'confirm', label: 'Confirm' },
];

interface Doctor {
  id: string;
  name: string;
  avatar: string | null;
}

interface Patient {
  id: string;
  name: string;
  avatar: string | null;
}

interface Summary {
  doctor: Doctor;
  patient: Patient;
  datetime: string;
  appointmentType: string;
  fee: number;
}

interface Props {
  summary: Summary;
}

export default function ConfirmStep({ summary }: Props) {
  const { goBack } = useNavigation();

  const handleBack = () => {
    goBack('/booking/doctor/doctor-time');
  };

  const handleContinue = () => {
    // Trigger payment flow
    router.post('/booking/doctor/confirm');
  };

  const handleChange = (step: string) => {
    router.get(`/booking/doctor/${step}`);
  };

  const formatDateTime = (datetime: string) => {
    try {
      const date = parseISO(datetime);
      return format(date, 'EEE, d MMM • h:mm a');
    } catch {
      return datetime;
    }
  };

  // Build rows array for proper divider handling
  const rows: BookingSummaryRow[] = [
    { label: 'Doctor', value: summary.doctor.name, onChange: () => handleChange('doctor-time') },
    { label: 'Patient', value: summary.patient.name, onChange: () => handleChange('patient') },
    { label: 'Date & Time', value: formatDateTime(summary.datetime), onChange: () => handleChange('doctor-time') },
    { label: 'Type', value: summary.appointmentType, onChange: () => handleChange('doctor-time') },
    { label: 'Appointment Fee', value: `₹${summary.fee.toLocaleString()}` },
  ];

  return (
    <GuidedBookingLayout
      steps={doctorSteps}
      currentStepId="confirm"
      onBack={handleBack}
      onContinue={handleContinue}
      continueLabel="Continue"
      priceEstimate={`Total: ₹${summary.fee.toLocaleString()}`}
    >
      <div>
        <h2 className="text-step-title mb-6">Booking Summary</h2>
        <BookingSummary rows={rows} className="overflow-hidden" />
      </div>
    </GuidedBookingLayout>
  );
}

