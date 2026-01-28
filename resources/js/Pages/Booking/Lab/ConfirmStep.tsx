import { useState } from 'react';
import { router } from '@inertiajs/react';
import { GuidedBookingLayout } from '@/Layouts/GuidedBookingLayout';
import { Avatar, AvatarImage, AvatarFallback } from '@/Components/ui/avatar';
import { format, parseISO } from 'date-fns';

const labSteps = [
  { id: 'patient_test', label: 'Patient & Test' },
  { id: 'packages_schedule', label: 'Packages & Schedule' },
  { id: 'confirm', label: 'Confirm' },
];

interface Props {
  summary: {
    package: { id: string; name: string };
    patient: { id: string; name: string; avatar: string | null };
    datetime: string;
    collection: string;
    address: string;
    fee: number;
    prepInstructions: string[];
  };
}

export default function ConfirmStep({ summary }: Props) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleBack = () => {
    router.get('/booking/lab/packages-schedule');
  };

  const handlePay = () => {
    setIsProcessing(true);
    // Trigger payment flow
    router.post('/booking/lab/confirm');
  };

  const handleChange = (step: string) => {
    router.get(`/booking/lab/${step}`);
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
      steps={labSteps}
      currentStepId="confirm"
      onBack={handleBack}
      onContinue={handlePay}
      continueLabel={`Pay ₹${summary.fee.toLocaleString()}`}
      isProcessing={isProcessing}
    >
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Booking Summary</h2>

        {/* Summary Table */}
        <div className="border rounded-xl overflow-hidden divide-y bg-white">
          <SummaryRow
            label="Package"
            value={<span className="font-medium">{summary.package.name}</span>}
            onChangeClick={() => handleChange('packages-schedule')}
          />

          <SummaryRow
            label="Patient"
            value={
              <div className="flex items-center gap-2">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={summary.patient.avatar || undefined} />
                  <AvatarFallback className="bg-orange-400 text-white text-xs font-medium">
                    {getInitial(summary.patient.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{summary.patient.name}</span>
              </div>
            }
            onChangeClick={() => handleChange('patient-test')}
          />

          <SummaryRow
            label="Date & Time"
            value={<span className="font-medium">{formatDateTime(summary.datetime)}</span>}
            onChangeClick={() => handleChange('packages-schedule')}
          />

          <SummaryRow
            label="Collection"
            value={<span className="font-medium">{summary.collection}</span>}
            onChangeClick={() => handleChange('packages-schedule')}
          />

          <SummaryRow
            label="Address"
            value={<span className="font-medium">{summary.address}</span>}
            onChangeClick={() => handleChange('packages-schedule')}
          />

          {/* Fee - no Change button */}
          <div className="flex items-center justify-between p-4">
            <span className="text-muted-foreground">Consultation Fee</span>
            <span className="font-semibold">₹{summary.fee.toLocaleString()}</span>
          </div>
        </div>

        {/* Preparation Instructions */}
        {summary.prepInstructions.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">!</span>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-amber-900 mb-2">Preparation Instructions</p>
                <ul className="space-y-1">
                  {summary.prepInstructions.map((instruction, i) => (
                    <li key={i} className="text-sm text-amber-800 flex items-start gap-2">
                      <span>•</span>
                      <span>{instruction}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
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
    <div className="flex items-center justify-between p-4">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-3">
        <div>{value}</div>
        <button onClick={onChangeClick} className="text-primary text-sm hover:underline">
          Change
        </button>
      </div>
    </div>
  );
}
