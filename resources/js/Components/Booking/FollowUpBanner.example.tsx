/**
 * Example usage of FollowUpBanner component
 *
 * This file demonstrates how to use the FollowUpBanner component
 * in the guided booking flow for follow-up consultations.
 */

import { FollowUpBanner } from './FollowUpBanner';

// Example 1: Basic usage
export function BasicFollowUpBanner() {
  return (
    <FollowUpBanner
      symptoms={['Headache', 'dizziness']}
      doctorName="Dr. Meera Iyer"
      date="15 Jan"
    />
  );
}

// Example 2: Single symptom
export function SingleSymptomBanner() {
  return (
    <FollowUpBanner
      symptoms={['Fever']}
      doctorName="Dr. Sarah Johnson"
      date="20 Jan"
    />
  );
}

// Example 3: Multiple symptoms
export function MultipleSymptomsBanner() {
  return (
    <FollowUpBanner
      symptoms={['Chest pain', 'Shortness of breath', 'Fatigue']}
      doctorName="Dr. Michael Chen"
      date="18 Jan"
    />
  );
}

// Example 4: With custom styling
export function CustomStyledBanner() {
  return (
    <FollowUpBanner
      symptoms={['Back pain', 'Stomach pain']}
      doctorName="Dr. Emily Davis"
      date="22 Jan"
      className="mb-6"
    />
  );
}

// Example 5: In context with symptom selection
export function FollowUpSymptomSelectionPage() {
  return (
    <div className="space-y-6">
      {/* Follow-up banner */}
      <FollowUpBanner
        symptoms={['Headache', 'dizziness']}
        doctorName="Dr. Meera Iyer"
        date="15 Jan"
      />

      {/* Symptom selection section */}
      <div>
        <h2 className="text-xl font-semibold mb-2">
          What symptoms are you experiencing?
        </h2>
        <p className="text-[14px] text-muted-foreground mb-4">
          Select all that apply, or describe in your own words
        </p>

        {/* SymptomChips would go here */}
      </div>

      {/* Custom description */}
      <div>
        <textarea
          className="w-full px-3 py-2 border border-border rounded-lg resize-none"
          placeholder="Describe your symptoms or concerns..."
          rows={4}
        />
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button className="px-6 py-2 border border-border rounded-lg">
          Back
        </button>
        <button className="px-6 py-2 bg-primary text-white rounded-lg">
          Continue
        </button>
      </div>
    </div>
  );
}

// Example 6: With full-length date
export function FullDateBanner() {
  return (
    <FollowUpBanner
      symptoms={['Cough', 'Fever']}
      doctorName="Dr. Robert Williams"
      date="15 January 2026"
    />
  );
}

// Example 7: In a card layout
export function BannerInCard() {
  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-sm">
      <h1 className="text-2xl font-bold mb-6">Book Follow-up Appointment</h1>

      <FollowUpBanner
        symptoms={['Headache', 'dizziness']}
        doctorName="Dr. Meera Iyer"
        date="15 Jan"
        className="mb-6"
      />

      <div className="space-y-4">
        <p className="text-[14px] text-muted-foreground">
          Continue with the same doctor or choose a different one.
        </p>
        {/* Rest of the booking form */}
      </div>
    </div>
  );
}

// Example 8: Dynamic data from props
export function DynamicFollowUpBanner({ previousVisit }: {
  previousVisit: {
    symptoms: string[];
    doctor: {
      name: string;
    };
    date: string;
  };
}) {
  return (
    <FollowUpBanner
      symptoms={previousVisit.symptoms}
      doctorName={previousVisit.doctor.name}
      date={previousVisit.date}
    />
  );
}

// Example 9: With state management
export function StatefulBanner() {
  // In real usage, this data would come from props or context
  const previousVisit = {
    symptoms: ['Headache', 'dizziness'],
    doctorName: 'Dr. Meera Iyer',
    visitDate: '15 Jan',
  };

  return (
    <div className="p-6">
      <FollowUpBanner
        symptoms={previousVisit.symptoms}
        doctorName={previousVisit.doctorName}
        date={previousVisit.visitDate}
      />
    </div>
  );
}

// Example 10: Integrated with step indicator
export function FollowUpWithStepIndicator() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Step indicator would go here */}
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <FollowUpBanner
          symptoms={['Headache', 'dizziness']}
          doctorName="Dr. Meera Iyer"
          date="15 Jan"
        />

        <div className="bg-white rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-2">
            What symptoms are you experiencing?
          </h2>
          <p className="text-[14px] text-muted-foreground mb-4">
            Select all that apply, or describe in your own words
          </p>

          {/* Symptom chips and form would go here */}
        </div>
      </div>
    </div>
  );
}
