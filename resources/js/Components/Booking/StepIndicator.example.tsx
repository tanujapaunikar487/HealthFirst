/**
 * Example usage of StepIndicator component
 *
 * This file demonstrates how to use the StepIndicator component
 * in different booking flows (doctor appointment, lab test).
 */

import { StepIndicator } from './StepIndicator';

// Doctor appointment booking steps
const doctorBookingSteps = [
  { id: 'patient', label: 'Patient' },
  { id: 'concerns', label: 'Concerns' },
  { id: 'doctor_time', label: 'Doctor & Time' },
  { id: 'confirm', label: 'Confirm' },
];

// Lab test booking steps
const labTestBookingSteps = [
  { id: 'patient', label: 'Patient' },
  { id: 'test_type', label: 'Test Type' },
  { id: 'location_time', label: 'Location & Time' },
  { id: 'confirm', label: 'Confirm' },
];

// Example 1: Doctor appointment flow - Step 1 (Patient)
export function DoctorBookingStep1() {
  return (
    <div>
      <StepIndicator
        steps={doctorBookingSteps}
        currentStepId="patient"
      />
      <div className="p-6">
        {/* Patient selection content */}
        <h2>Who is this appointment for?</h2>
      </div>
    </div>
  );
}

// Example 2: Doctor appointment flow - Step 2 (Concerns)
export function DoctorBookingStep2() {
  return (
    <div>
      <StepIndicator
        steps={doctorBookingSteps}
        currentStepId="concerns"
      />
      <div className="p-6">
        {/* Concerns/symptoms content */}
        <h2>What brings you in today?</h2>
      </div>
    </div>
  );
}

// Example 3: Doctor appointment flow - Step 3 (Doctor & Time)
export function DoctorBookingStep3() {
  return (
    <div>
      <StepIndicator
        steps={doctorBookingSteps}
        currentStepId="doctor_time"
      />
      <div className="p-6">
        {/* Doctor and time selection content */}
        <h2>Choose your doctor and appointment time</h2>
      </div>
    </div>
  );
}

// Example 4: Lab test booking flow - Step 1
export function LabTestBookingStep1() {
  return (
    <div>
      <StepIndicator
        steps={labTestBookingSteps}
        currentStepId="patient"
      />
      <div className="p-6">
        {/* Patient selection content */}
        <h2>Who is this test for?</h2>
      </div>
    </div>
  );
}

// Example 5: Using with custom className
export function CustomStyledStep() {
  return (
    <div>
      <StepIndicator
        steps={doctorBookingSteps}
        currentStepId="confirm"
        className="shadow-md"
      />
      <div className="p-6">
        {/* Confirmation content */}
        <h2>Review your appointment</h2>
      </div>
    </div>
  );
}

// Example 6: Dynamic step determination based on booking type
export function DynamicBookingFlow({ bookingType, currentStep }: {
  bookingType: 'doctor' | 'lab_test';
  currentStep: string;
}) {
  const steps = bookingType === 'doctor' ? doctorBookingSteps : labTestBookingSteps;

  return (
    <div>
      <StepIndicator
        steps={steps}
        currentStepId={currentStep}
      />
      <div className="p-6">
        {/* Dynamic content based on booking type and step */}
      </div>
    </div>
  );
}
