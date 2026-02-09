import * as React from 'react';
import { cn } from '@/Lib/utils';
import { User, Info, Check } from '@/Lib/icons';
import { Icon } from '@/Components/ui/icon';
import { Button } from '@/Components/ui/button';

interface DetectionCardProps {
    member: {
        id: number;
        name: string;
        age?: number;
        gender?: string;
        patient_id?: string;
        phone?: string;
    };
    onAccept: () => void;
    disabled?: boolean;
}

export function DetectionCard({ member, onAccept, disabled }: DetectionCardProps) {
    const suggestRelationship = () => {
        // Simple age-based relationship suggestion
        if (member.age) {
            if (member.age >= 50) {
                if (member.gender === 'female') return 'mother';
                if (member.gender === 'male') return 'father';
            } else if (member.age >= 20 && member.age < 50) {
                if (member.gender === 'female') return 'sister';
                if (member.gender === 'male') return 'brother';
            }
        }
        return null;
    };

    const relationship = suggestRelationship();
    const relationshipText = relationship ? `Is this your ${relationship}?` : 'Is this the person?';

    return (
        <div className="border border-primary/20 bg-primary/10 rounded-xl p-4 space-y-3">
            <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0">
                    <Icon icon={User} size={20} className="text-blue-800" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <Icon icon={Info} size={16} className="text-primary flex-shrink-0" />
                        <p className="text-label text-primary">We found an existing patient record</p>
                    </div>
                    <div className="mt-2 space-y-1">
                        <p className="text-card-title text-foreground">{member.name}</p>
                        <div className="flex flex-wrap gap-2 text-body text-muted-foreground">
                            {member.patient_id && <span>{member.patient_id}</span>}
                            {member.age && <span>Age {member.age}</span>}
                            {member.gender && <span className="capitalize">{member.gender}</span>}
                        </div>
                    </div>
                </div>
            </div>

            <Button
                variant="outline"
                onClick={onAccept}
                disabled={disabled}
                className={cn(
                    "w-full h-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg",
                    "border-primary/20 text-primary text-label",
                    "hover:bg-primary/10 transition-colors",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
            >
                <Icon icon={Check} size={16} />
                {relationshipText}
            </Button>
        </div>
    );
}
