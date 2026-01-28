import { Button } from '@/Components/ui/button';
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
  collection?: string;
  address?: string;
  fee: number;
  prepInstructions?: string[];
}

interface Props {
  summary: DoctorSummary;
  onPay: () => void;
  disabled: boolean;
  conversationId: string;
}

export function EmbeddedBookingSummary({ summary, onPay, disabled, conversationId }: Props) {
  const [isProcessing, setIsProcessing] = useState(false);
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

  return (
    <div className="space-y-4">
      {/* Summary table */}
      <div className="border rounded-xl overflow-hidden divide-y">
        {/* Doctor row */}
        {summary.doctor && (
          <SummaryRow
            label="Doctor"
            value={summary.doctor.name}
            showChange
          />
        )}

        {/* Package row (for lab) */}
        {summary.package && (
          <SummaryRow label="Package" value={summary.package} showChange />
        )}

        {/* Patient row */}
        <SummaryRow
          label="Patient"
          value={summary.patient.name}
          showChange
        />

        {/* Date & Time row */}
        <SummaryRow
          label="Date & Time"
          value={formatDateTime(summary.datetime)}
          showChange
        />

        {/* Type row (for doctor) */}
        {summary.type && !summary.collection && (
          <SummaryRow label="Type" value={summary.type} showChange />
        )}

        {/* Collection row (for lab) */}
        {summary.collection && (
          <SummaryRow label="Collection" value={summary.collection} showChange />
        )}

        {/* Address row (for lab home collection) */}
        {summary.address && (
          <SummaryRow label="Address" value={summary.address} showChange />
        )}

        {/* Fee row - no Change link */}
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm text-muted-foreground">Consultation Fee</span>
          <span className="text-sm font-medium">₹{summary.fee.toLocaleString()}</span>
        </div>
      </div>

      {/* Preparation Instructions (for lab) */}
      {summary.prepInstructions && summary.prepInstructions.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">!</span>
            </div>
            <div>
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

function SummaryRow({
  label,
  value,
  showChange = false,
}: {
  label: string;
  value: React.ReactNode;
  showChange?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-sm text-right">{value}</span>
        {showChange && (
          <button className="text-primary text-sm hover:underline">
            Change
          </button>
        )}
      </div>
    </div>
  );
}
