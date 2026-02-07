import { cn } from '@/Lib/utils';
import { HStack } from '@/Components/ui/stack';
import { Button } from '@/Components/ui/button';

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
    <HStack gap={2} className={cn("flex-wrap", className)}>
      {symptoms.map((symptom) => {
        const isSelected = selectedIds.includes(symptom.id);

        return (
          <Button
            key={symptom.id}
            variant="outline"
            size="sm"
            type="button"
            onClick={() => onToggle(symptom.id)}
            className={cn(
              "h-auto px-6 py-2 rounded-full text-body transition-all",
              "hover:border-primary/50 hover:bg-primary/5",
              isSelected
                ? "bg-primary/10 border-primary text-primary text-label"
                : "bg-card border-border text-foreground"
            )}
          >
            {symptom.name}
          </Button>
        );
      })}
    </HStack>
  );
}
