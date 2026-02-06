/**
 * Example usage of SymptomChips component
 *
 * This file demonstrates how to use the SymptomChips component
 * in the guided booking flow for symptom selection.
 */

import { useState } from 'react';
import { SymptomChips } from './SymptomChips';

// Common symptoms list
const commonSymptoms = [
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

// Example 1: Basic usage with state management
export function BasicSymptomSelection() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleToggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((symptomId) => symptomId !== id)
        : [...prev, id]
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">What symptoms are you experiencing?</h3>
        <p className="text-body text-muted-foreground mb-4">
          Select all that apply, or describe in your own words
        </p>
      </div>

      <SymptomChips
        symptoms={commonSymptoms}
        selectedIds={selectedIds}
        onToggle={handleToggle}
      />

      <div className="text-body text-muted-foreground">
        Selected: {selectedIds.length} symptom(s)
      </div>
    </div>
  );
}

// Example 2: With custom styling
export function CustomStyledSymptomSelection() {
  const [selectedIds, setSelectedIds] = useState<string[]>(['headache', 'fever']);

  const handleToggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((symptomId) => symptomId !== id)
        : [...prev, id]
    );
  };

  return (
    <div className="p-6 bg-muted rounded-lg">
      <SymptomChips
        symptoms={commonSymptoms}
        selectedIds={selectedIds}
        onToggle={handleToggle}
        className="gap-3"
      />
    </div>
  );
}

// Example 3: Follow-up consultation symptoms
export function FollowUpSymptomSelection() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleToggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((symptomId) => symptomId !== id)
        : [...prev, id]
    );
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <p className="text-body">
          <span className="font-semibold">Following up on:</span> Headache, dizziness
          <br />
          <span className="text-muted-foreground">
            From Dr. Meera Iyer on 15 Jan. Add any new symptoms below.
          </span>
        </p>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">What symptoms are you experiencing?</h3>
        <p className="text-body text-muted-foreground mb-4">
          Select all that apply, or describe in your own words
        </p>
      </div>

      <SymptomChips
        symptoms={commonSymptoms}
        selectedIds={selectedIds}
        onToggle={handleToggle}
      />
    </div>
  );
}

// Example 4: With form integration
export function SymptomSelectionForm() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [customSymptoms, setCustomSymptoms] = useState('');

  const handleToggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((symptomId) => symptomId !== id)
        : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Selected symptoms:', selectedIds);
    console.log('Custom description:', customSymptoms);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">What symptoms are you experiencing?</h3>
        <p className="text-body text-muted-foreground mb-4">
          Select all that apply, or describe in your own words
        </p>
      </div>

      <SymptomChips
        symptoms={commonSymptoms}
        selectedIds={selectedIds}
        onToggle={handleToggle}
      />

      <div>
        <textarea
          className="w-full px-3 py-2 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="Describe your symptoms or concerns..."
          rows={4}
          value={customSymptoms}
          onChange={(e) => setCustomSymptoms(e.target.value)}
        />
      </div>

      <button
        type="submit"
        className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
      >
        Continue
      </button>
    </form>
  );
}

// Example 5: Category-based symptoms
export function CategorizedSymptomSelection() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const respiratorySymptoms = [
    { id: 'cough', name: 'Cough' },
    { id: 'shortness_breath', name: 'Shortness of breath' },
  ];

  const painSymptoms = [
    { id: 'chest_pain', name: 'Chest pain' },
    { id: 'back_pain', name: 'Back pain' },
    { id: 'stomach_pain', name: 'Stomach pain' },
    { id: 'headache', name: 'Headache' },
  ];

  const generalSymptoms = [
    { id: 'fever', name: 'Fever' },
    { id: 'fatigue', name: 'Fatigue' },
    { id: 'dizziness', name: 'Dizziness' },
    { id: 'skin_rash', name: 'Skin rash' },
  ];

  const handleToggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((symptomId) => symptomId !== id)
        : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-card-title mb-3 text-muted-foreground">Respiratory</h4>
        <SymptomChips
          symptoms={respiratorySymptoms}
          selectedIds={selectedIds}
          onToggle={handleToggle}
        />
      </div>

      <div>
        <h4 className="text-card-title mb-3 text-muted-foreground">Pain</h4>
        <SymptomChips
          symptoms={painSymptoms}
          selectedIds={selectedIds}
          onToggle={handleToggle}
        />
      </div>

      <div>
        <h4 className="text-card-title mb-3 text-muted-foreground">General</h4>
        <SymptomChips
          symptoms={generalSymptoms}
          selectedIds={selectedIds}
          onToggle={handleToggle}
        />
      </div>
    </div>
  );
}
