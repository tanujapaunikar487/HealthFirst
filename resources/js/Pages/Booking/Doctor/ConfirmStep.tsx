import { router } from '@inertiajs/react';
import { GuidedBookingLayout } from '@/Layouts/GuidedBookingLayout';
import { Button } from '@/Components/ui/button';
import { Card } from '@/Components/ui/card';
import { DetailRow } from '@/Components/ui/detail-row';
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
  const handleBack = () => {
    router.get('/booking/doctor/doctor-time');
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
  const rows = [
    { label: 'Doctor', value: summary.doctor.name, step: 'doctor-time' },
    { label: 'Patient', value: summary.patient.name, step: 'patient' },
    { label: 'Date & Time', value: formatDateTime(summary.datetime), step: 'doctor-time' },
    { label: 'Type', value: summary.appointmentType, step: 'doctor-time' },
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

        <Card>
          <div className="divide-y">
            {rows.map((row) => (
              <DetailRow key={row.label} label={row.label}>
                <div className="flex items-center justify-between">
                  <span>{row.value}</span>
                  <Button
                    variant="link"
                    onClick={() => handleChange(row.step)}
                    className="h-auto p-0 text-primary text-body hover:underline"
                  >
                    Change
                  </Button>
                </div>
              </DetailRow>
            ))}
            <DetailRow label="Appointment Fee">
              ₹{summary.fee.toLocaleString()}
            </DetailRow>
          </div>
        </Card>
      </div>
    </GuidedBookingLayout>
  );
}

