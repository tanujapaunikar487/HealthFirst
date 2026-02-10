import { router } from '@inertiajs/react';
import { useNavigation } from '@/Hooks/useNavigation';
import { GuidedBookingLayout } from '@/Layouts/GuidedBookingLayout';
import { Button } from '@/Components/ui/button';
import { Card } from '@/Components/ui/card';
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
  const rows = [
    { label: 'Doctor', value: summary.doctor.name, showChange: true, step: 'doctor-time' },
    { label: 'Patient', value: summary.patient.name, showChange: true, step: 'patient' },
    { label: 'Date & Time', value: formatDateTime(summary.datetime), showChange: true, step: 'doctor-time' },
    { label: 'Type', value: summary.appointmentType, showChange: true, step: 'doctor-time' },
    { label: 'Appointment Fee', value: `₹${summary.fee.toLocaleString()}`, showChange: false, step: '' },
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

        <Card className="overflow-hidden">
          <div className="divide-y">
            {rows.map((row) => (
              <div key={row.label} className="flex items-center justify-between px-6 py-4">
                <span className="text-body text-muted-foreground">{row.label}</span>
                <div className="flex items-center gap-3">
                  <span className="text-label text-right">{row.value}</span>
                  {row.showChange && (
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => handleChange(row.step)}
                      className="h-auto p-0 text-primary text-body hover:underline"
                    >
                      change
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </GuidedBookingLayout>
  );
}

