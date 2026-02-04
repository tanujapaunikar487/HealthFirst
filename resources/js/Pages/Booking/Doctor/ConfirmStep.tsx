import { router } from '@inertiajs/react';
import { GuidedBookingLayout } from '@/Layouts/GuidedBookingLayout';
import { Avatar, AvatarImage, AvatarFallback } from '@/Components/ui/avatar';
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

  const getInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

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
        <h2 className="text-xl font-semibold mb-6">Booking Summary</h2>

        <Card className="overflow-hidden divide-y bg-white">
          {/* Doctor */}
          <SummaryRow
            label="Doctor"
            value={
              <div className="flex items-center gap-2">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={summary.doctor.avatar || undefined} />
                  <AvatarFallback className="bg-orange-400 text-white text-[14px] font-medium">
                    {getInitial(summary.doctor.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{summary.doctor.name}</span>
              </div>
            }
            onChangeClick={() => handleChange('doctor-time')}
          />

          {/* Patient */}
          <SummaryRow
            label="Patient"
            value={
              <div className="flex items-center gap-2">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={summary.patient.avatar || undefined} />
                  <AvatarFallback className="bg-orange-400 text-white text-[14px] font-medium">
                    {getInitial(summary.patient.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{summary.patient.name}</span>
              </div>
            }
            onChangeClick={() => handleChange('patient')}
          />

          {/* Date & Time */}
          <SummaryRow
            label="Date & Time"
            value={<span className="font-medium">{formatDateTime(summary.datetime)}</span>}
            onChangeClick={() => handleChange('doctor-time')}
          />

          {/* Type */}
          <SummaryRow
            label="Type"
            value={<span className="font-medium">{summary.appointmentType}</span>}
            onChangeClick={() => handleChange('doctor-time')}
          />

          {/* Fee - no Change button */}
          <div className="flex items-center justify-between px-6 py-4">
            <span className="text-muted-foreground">Appointment Fee</span>
            <span className="font-semibold">₹{summary.fee.toLocaleString()}</span>
          </div>
        </Card>
      </div>
    </GuidedBookingLayout>
  );
}

// SummaryRow component
interface SummaryRowProps {
  label: string;
  value: React.ReactNode;
  onChangeClick: () => void;
}

function SummaryRow({ label, value, onChangeClick }: SummaryRowProps) {
  return (
    <div className="flex items-center justify-between px-6 py-4">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-3">
        <div>{value}</div>
        <button onClick={onChangeClick} className="text-primary text-[14px] hover:underline">
          Change
        </button>
      </div>
    </div>
  );
}
