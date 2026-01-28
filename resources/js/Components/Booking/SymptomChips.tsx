import { cn } from '@/Lib/utils';

interface Symptom {
  id: string;
  name: string;
}

interface SymptomChipsProps {
  symptoms: Symptom[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  className?: string;
}

export function SymptomChips({ symptoms, selectedIds, onToggle, className }: SymptomChipsProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {symptoms.map((symptom) => {
        const isSelected = selectedIds.includes(symptom.id);

        return (
          <button
            key={symptom.id}
            type="button"
            onClick={() => onToggle(symptom.id)}
            className={cn(
              "px-4 py-2 rounded-full border text-sm transition-all",
              "hover:border-primary/50 hover:bg-primary/5",
              isSelected
                ? "bg-primary/10 border-primary text-primary font-medium"
                : "bg-background border-border text-foreground"
            )}
          >
            {symptom.name}
          </button>
        );
      })}
    </div>
  );
}
