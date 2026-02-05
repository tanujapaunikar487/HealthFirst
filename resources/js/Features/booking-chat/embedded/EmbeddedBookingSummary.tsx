import { Button } from '@/Components/ui/button';
import { Card } from '@/Components/ui/card';
import { format, parseISO } from 'date-fns';
import { useState } from 'react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface DoctorSummary {
  doctor?: { name: string; avatar: string | null };
  package?: string;
  patient: { name: string; avatar: string | null };
  type: string;
  datetime: string;
  mode?: string;
  collection?: string;
  address?: string;
  fee: number;
  prepInstructions?: string[];
  supported_modes?: string[];
}

interface Props {
  summary: DoctorSummary;
  onPay: () => void;
  onSelect?: (selection: any) => void;
  disabled: boolean;
  conversationId: string;
}

export function EmbeddedBookingSummary({ summary, onPay, onSelect, disabled, conversationId }: Props) {
  const [isProcessing, setIsProcessing] = useState(false);

  // Safety check: if summary is undefined or invalid, show error
  if (!summary || typeof summary !== 'object') {
    console.error('EmbeddedBookingSummary: Invalid summary data', summary);
    return (
      <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
        <p className="text-destructive font-medium">Unable to load booking summary</p>
        <p className="text-destructive text-[14px] mt-1">Please try again or contact support.</p>
      </div>
    );
  }

  const formatDateTime = (datetime: string) => {
    try {
      const date = parseISO(datetime);
      return format(date, "EEE, d MMM • h:mm a");
    } catch {
      return datetime;
    }
  };

  const handlePayment = async () => {
    if (isProcessing) return;

    setIsProcessing(true);

    try {
      // Step 1: Create Razorpay order
      const response = await fetch(`/booking/${conversationId}/payment/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to create payment order');
      }

      const orderData = await response.json();

      // Check if we're in mock mode
      if (orderData.mock_mode) {
        // Mock payment - skip Razorpay modal and verify directly
        const verifyResponse = await fetch(`/booking/${conversationId}/payment/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          },
          body: JSON.stringify({
            razorpay_payment_id: 'pay_mock_' + Math.random().toString(36).substr(2, 9),
            razorpay_order_id: orderData.order_id,
            razorpay_signature: 'mock_signature',
          }),
        });

        const verifyData = await verifyResponse.json();

        if (verifyData.success && verifyData.redirect) {
          window.location.href = verifyData.redirect;
        } else {
          alert('Payment verification failed. Please contact support.');
          setIsProcessing(false);
        }
        return;
      }

      // Real Razorpay payment - Step 2: Open Razorpay checkout
      const options = {
        key: orderData.key,
        amount: orderData.amount * 100,
        currency: orderData.currency,
        name: 'Healthcare Booking',
        description: 'Booking Payment',
        order_id: orderData.order_id,
        handler: async function (response: any) {
          // Step 3: Verify payment on backend
          try {
            const verifyResponse = await fetch(`/booking/${conversationId}/payment/verify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
              },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyResponse.json();

            if (verifyData.success && verifyData.redirect) {
              // Redirect to confirmation page
              window.location.href = verifyData.redirect;
            } else {
              alert('Payment verification failed. Please contact support.');
              setIsProcessing(false);
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            alert('Payment verification failed. Please contact support.');
            setIsProcessing(false);
          }
        },
        prefill: {
          name: summary.patient.name,
        },
        theme: {
          color: '#0052FF',
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Payment initialization error:', error);
      alert('Failed to initialize payment. Please try again.');
      setIsProcessing(false);
    }
  };

  // Build rows array for proper divider handling
  const rows: { label: string; value: React.ReactNode; showChange?: boolean; onChange?: () => void }[] = [];

  if (summary.doctor) {
    rows.push({ label: 'Doctor', value: summary.doctor.name, showChange: true, onChange: () => onSelect?.({ change_doctor: true }) });
  }
  if (summary.package) {
    rows.push({ label: 'Package', value: summary.package, showChange: true, onChange: () => onSelect?.({ change_package: true }) });
  }
  rows.push({ label: 'Patient', value: summary.patient.name, showChange: true, onChange: () => onSelect?.({ change_patient: true }) });
  rows.push({ label: 'Date & Time', value: formatDateTime(summary.datetime), showChange: true, onChange: () => onSelect?.({ change_datetime: true }) });
  if (summary.type && !summary.collection) {
    rows.push({ label: 'Type', value: summary.type, showChange: true, onChange: () => onSelect?.({ change_type: true }) });
  }
  if (summary.mode) {
    rows.push({
      label: 'Mode',
      value: summary.mode === 'video' ? 'Video Appointment' : 'In-Person Visit',
      showChange: (summary.supported_modes?.length ?? 0) > 1,
      onChange: () => onSelect?.({ change_mode: true }),
    });
  }
  if (summary.collection) {
    rows.push({ label: 'Collection', value: summary.collection, showChange: true, onChange: () => onSelect?.({ change_location: true }) });
  }
  if (summary.address) {
    rows.push({ label: 'Address', value: summary.address, showChange: true, onChange: () => onSelect?.({ change_address: true, display_message: 'Change Address' }) });
  }
  // Fee row - no Change link
  rows.push({ label: 'Appointment Fee', value: `₹${summary.fee.toLocaleString()}`, showChange: false });

  return (
    <div className="space-y-4">
      {/* Summary card */}
      <Card className="overflow-hidden">
        {rows.map((row, index) => (
          <div
            key={row.label}
            className="flex items-center justify-between px-4 py-4"
            style={{
              borderBottom: index < rows.length - 1 ? '1px solid hsl(var(--border))' : 'none'
            }}
          >
            <span className="text-[14px] text-muted-foreground">{row.label}</span>
            <div className="flex items-center gap-3">
              <span className="text-[14px] font-medium text-right">{row.value}</span>
              {row.showChange && (
                <button
                  onClick={row.onChange}
                  className="text-primary text-[14px] hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!row.onChange}
                >
                  Change
                </button>
              )}
            </div>
          </div>
        ))}
      </Card>

      {/* Preparation Instructions (for lab) */}
      {summary.prepInstructions && summary.prepInstructions.length > 0 && (
        <div className="bg-warning/10 border border-warning/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-warning flex items-center justify-center flex-shrink-0">
              <span className="text-white text-[14px] font-bold">!</span>
            </div>
            <div>
              <p className="font-semibold text-warning mb-2">Preparation Instructions</p>
              <ul className="space-y-1">
                {summary.prepInstructions.map((instruction, i) => (
                  <li key={i} className="text-[14px] text-warning flex items-start gap-2">
                    <span>•</span>
                    <span>{instruction}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Pay button */}
      <Button
        onClick={handlePayment}
        disabled={disabled || isProcessing}
        size="lg"
        rounded="full"
        className="bg-[#2563EB] hover:bg-[#1d4ed8] text-white"
      >
        {isProcessing ? 'Processing...' : `Pay ₹${summary.fee.toLocaleString()}`}
      </Button>
    </div>
  );
}

