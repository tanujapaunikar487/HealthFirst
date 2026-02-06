/**
 * Example usage of GuidedBookingLayout component
 *
 * This file demonstrates how to use the GuidedBookingLayout component
 * for building guided booking wizard pages.
 */

import { useState } from 'react';
import { GuidedBookingLayout } from './GuidedBookingLayout';
import { SymptomChips } from '@/Components/Booking/SymptomChips';
import { FollowUpBanner } from '@/Components/Booking/FollowUpBanner';

// Doctor booking steps
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

// Example 1: Patient Selection Step
export function PatientSelectionStep() {
  const [currentStep, setCurrentStep] = useState('patient');

  const handleBack = () => {
    console.log('Going back');
  };

  const handleContinue = () => {
    setCurrentStep('concerns');
  };

  return (
    <GuidedBookingLayout
      steps={doctorBookingSteps}
      currentStepId={currentStep}
      onBack={handleBack}
      onContinue={handleContinue}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Who is this appointment for?</h1>
          <p className="text-body text-muted-foreground">
            Select a family member or add a new patient
          </p>
        </div>

        {/* Patient selection grid would go here */}
        <div className="grid grid-cols-2 gap-4">
          {/* Patient cards */}
        </div>
      </div>
    </GuidedBookingLayout>
  );
}

// Example 2: Concerns/Symptoms Step
export function ConcernsStep() {
  const [currentStep] = useState('concerns');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [description, setDescription] = useState('');

  const symptoms = [
    { id: 'chest_pain', name: 'Chest pain' },
    { id: 'shortness_breath', name: 'Shortness of breath' },
    { id: 'headache', name: 'Headache' },
    { id: 'fever', name: 'Fever' },
    { id: 'fatigue', name: 'Fatigue' },
    { id: 'cough', name: 'Cough' },
    { id: 'back_pain', name: 'Back pain' },
    { id: 'stomach_pain', name: 'Stomach pain' },
    { id: 'dizziness', name: 'Dizziness' },
    { id: 'skin_rash', name: 'Skin rash' },
  ];

  const handleToggle = (id: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(id)
        ? prev.filter((symptomId) => symptomId !== id)
        : [...prev, id]
    );
  };

  const isValid = selectedSymptoms.length > 0 || description.trim().length > 0;

  return (
    <GuidedBookingLayout
      steps={doctorBookingSteps}
      currentStepId={currentStep}
      onBack={() => console.log('Back')}
      onContinue={() => console.log('Continue')}
      continueDisabled={!isValid}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold mb-2">
            What symptoms are you experiencing?
          </h1>
          <p className="text-body text-muted-foreground">
            Select all that apply, or describe in your own words
          </p>
        </div>

        <SymptomChips
          symptoms={symptoms}
          selectedIds={selectedSymptoms}
          onToggle={handleToggle}
        />

        <textarea
          className="w-full px-3 py-2 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="Describe your symptoms or concerns..."
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div>
          <h2 className="text-xl font-semibold mb-2">
            How soon do you need to see a doctor?
          </h2>
          <p className="text-body text-muted-foreground mb-4">
            This determines which slots you'll see
          </p>

          {/* Urgency selection would go here */}
        </div>
      </div>
    </GuidedBookingLayout>
  );
}

// Example 3: Follow-up Consultation
export function FollowUpConcernsStep() {
  const [currentStep] = useState('concerns');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);

  const symptoms = [
    { id: 'chest_pain', name: 'Chest pain' },
    { id: 'shortness_breath', name: 'Shortness of breath' },
    { id: 'headache', name: 'Headache' },
    { id: 'fever', name: 'Fever' },
    { id: 'fatigue', name: 'Fatigue' },
    { id: 'cough', name: 'Cough' },
    { id: 'back_pain', name: 'Back pain' },
    { id: 'stomach_pain', name: 'Stomach pain' },
    { id: 'dizziness', name: 'Dizziness' },
    { id: 'skin_rash', name: 'Skin rash' },
  ];

  const handleToggle = (id: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(id)
        ? prev.filter((symptomId) => symptomId !== id)
        : [...prev, id]
    );
  };

  return (
    <GuidedBookingLayout
      steps={doctorBookingSteps}
      currentStepId={currentStep}
      onBack={() => console.log('Back')}
      onContinue={() => console.log('Continue')}
    >
      <div className="space-y-6">
        <FollowUpBanner
          symptoms={['Headache', 'dizziness']}
          doctorName="Dr. Meera Iyer"
          date="15 Jan"
        />

        <div>
          <h1 className="text-2xl font-semibold mb-2">
            What symptoms are you experiencing?
          </h1>
          <p className="text-body text-muted-foreground">
            Select all that apply, or describe in your own words
          </p>
        </div>

        <SymptomChips
          symptoms={symptoms}
          selectedIds={selectedSymptoms}
          onToggle={handleToggle}
        />

        <textarea
          className="w-full px-3 py-2 border border-border rounded-lg resize-none"
          placeholder="Describe your symptoms or concerns..."
          rows={4}
        />
      </div>
    </GuidedBookingLayout>
  );
}

// Example 4: With Price Estimate
export function DoctorSelectionStep() {
  const [currentStep] = useState('doctor_time');

  return (
    <GuidedBookingLayout
      steps={doctorBookingSteps}
      currentStepId={currentStep}
      onBack={() => console.log('Back')}
      onContinue={() => console.log('Continue')}
      priceEstimate="Estimated: ₹500"
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Choose your doctor</h1>
          <p className="text-body text-muted-foreground">
            12 doctors available for your appointment
          </p>
        </div>

        {/* Doctor list would go here */}
      </div>
    </GuidedBookingLayout>
  );
}

// Example 5: Processing State
export function ProcessingStep() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep] = useState('confirm');

  const handleContinue = () => {
    setIsProcessing(true);
    // Simulate async operation
    setTimeout(() => {
      setIsProcessing(false);
      console.log('Booking confirmed!');
    }, 2000);
  };

  return (
    <GuidedBookingLayout
      steps={doctorBookingSteps}
      currentStepId={currentStep}
      onBack={() => console.log('Back')}
      onContinue={handleContinue}
      continueLabel="Confirm Booking"
      isProcessing={isProcessing}
      priceEstimate="Total: ₹500"
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Confirm your booking</h1>
          <p className="text-body text-muted-foreground">
            Review your appointment details before confirming
          </p>
        </div>

        {/* Booking summary would go here */}
      </div>
    </GuidedBookingLayout>
  );
}

// Example 6: Lab Test Flow
export function LabTestTypeStep() {
  const [currentStep] = useState('test_type');

  return (
    <GuidedBookingLayout
      steps={labTestBookingSteps}
      currentStepId={currentStep}
      onBack={() => console.log('Back')}
      onContinue={() => console.log('Continue')}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold mb-2">What test do you need?</h1>
          <p className="text-body text-muted-foreground">
            Search or select from popular tests
          </p>
        </div>

        {/* Test selection would go here */}
      </div>
    </GuidedBookingLayout>
  );
}

// Example 7: Custom Continue Label
export function CustomLabelStep() {
  const [currentStep] = useState('patient');

  return (
    <GuidedBookingLayout
      steps={doctorBookingSteps}
      currentStepId={currentStep}
      onBack={() => console.log('Back')}
      onContinue={() => console.log('Continue')}
      continueLabel="Next Step"
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Who is this appointment for?</h1>
        </div>
      </div>
    </GuidedBookingLayout>
  );
}

// Example 8: With Custom Content Styling
export function CustomContentStep() {
  const [currentStep] = useState('patient');

  return (
    <GuidedBookingLayout
      steps={doctorBookingSteps}
      currentStepId={currentStep}
      onBack={() => console.log('Back')}
      onContinue={() => console.log('Continue')}
      className="py-12"
    >
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-3">Who is this appointment for?</h1>
          <p className="text-base text-muted-foreground">
            Select a family member or add a new patient
          </p>
        </div>
      </div>
    </GuidedBookingLayout>
  );
}

// Example 9: Multi-step Wizard with State Management
export function MultiStepWizard() {
  const [currentStep, setCurrentStep] = useState('patient');
  const [formData, setFormData] = useState({
    patientId: '',
    symptoms: [] as string[],
    doctorId: '',
  });

  const handleBack = () => {
    const stepOrder = ['patient', 'concerns', 'doctor_time', 'confirm'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  };

  const handleContinue = () => {
    const stepOrder = ['patient', 'concerns', 'doctor_time', 'confirm'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
    }
  };

  const isContinueDisabled = () => {
    switch (currentStep) {
      case 'patient':
        return !formData.patientId;
      case 'concerns':
        return formData.symptoms.length === 0;
      case 'doctor_time':
        return !formData.doctorId;
      default:
        return false;
    }
  };

  return (
    <GuidedBookingLayout
      steps={doctorBookingSteps}
      currentStepId={currentStep}
      onBack={handleBack}
      onContinue={handleContinue}
      continueDisabled={isContinueDisabled()}
      priceEstimate={formData.doctorId ? 'Estimated: ₹500' : undefined}
    >
      {/* Render different content based on currentStep */}
      {currentStep === 'patient' && <div>Patient selection content</div>}
      {currentStep === 'concerns' && <div>Concerns content</div>}
      {currentStep === 'doctor_time' && <div>Doctor selection content</div>}
      {currentStep === 'confirm' && <div>Confirmation content</div>}
    </GuidedBookingLayout>
  );
}
