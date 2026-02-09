import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/ui/avatar';
import { Button } from '@/Components/ui/button';
import { cn } from '@/Lib/utils';
import { getAvatarColorByName } from '@/Lib/avatar-colors';

interface Patient {
  id: string | number;
  name: string;
  avatar?: string | null;
  relation?: string;
}

interface PatientSelectorProps {
  patients: Patient[];
  selected?: string | number | null;
  defaultPatientId?: string | number | null;
  onSelect: (id: string | number) => void;
  onAddMember?: () => void;
  disabled?: boolean;
}

export function PatientSelector({
  patients,
  selected,
  defaultPatientId,
  onSelect,
  onAddMember,
  disabled = false,
}: PatientSelectorProps) {
  // Resolve default patient ID: "self" maps to the patient with relation "Self"
  const resolvedDefaultId = React.useMemo(() => {
    if (!defaultPatientId) return null;
    if (defaultPatientId === 'self') {
      const selfPatient = patients.find((p) => p.relation?.toLowerCase() === 'self');
      return selfPatient?.id ?? null;
    }
    const numId = Number(defaultPatientId);
    return isNaN(numId) ? null : numId;
  }, [defaultPatientId, patients]);

  // Pre-highlight: show default when no selection has been made yet
  const highlightedId = selected ?? resolvedDefaultId;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2 max-w-2xl">
        {patients.map((patient) => (
          <Button
            key={patient.id}
            variant="outline"
            onClick={() => !disabled && onSelect(patient.id)}
            disabled={disabled}
              'h-auto flex items-center gap-3 p-3 rounded-full text-left font-normal hover:bg-muted/50'
          >
            <Avatar className="w-9 h-9 flex-shrink-0">
              <AvatarImage src={patient.avatar || undefined} />
              <AvatarFallback
                style={(() => {
                  const color = getAvatarColorByName(patient.name);
                  return { backgroundColor: color.bg, color: color.text };
                })()}
              >
                {patient.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="text-label leading-tight text-foreground truncate">
                {patient.name}
              </div>
              {patient.relation && (
                <div className="text-body leading-tight text-muted-foreground mt-0.5">
                  {patient.relation}
                </div>
              )}
            </div>
          </Button>
        ))}
      </div>

      {onAddMember && (
        <Button
          variant="outline"
          onClick={() => !disabled && onAddMember()}
          disabled={disabled}
          className="h-auto mt-2 px-4 py-2.5 rounded-full text-body hover:bg-muted/50 disabled:opacity-30"
        >
          Add family member or guest &rarr;
        </Button>
      )}
    </div>
  );
}
