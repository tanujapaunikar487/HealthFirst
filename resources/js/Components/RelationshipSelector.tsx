import React from 'react';
import { Heart, Shield, Users, Baby, Home } from '@/Lib/icons';
import { cn } from '@/Lib/utils';

interface RelationOption {
    value: string;
    label: string;
    icon: React.ReactNode;
}

const relationshipOptions: RelationOption[] = [
    { value: 'mother', label: 'Mother', icon: <Heart className="h-5 w-5" /> },
    { value: 'father', label: 'Father', icon: <Shield className="h-5 w-5" /> },
    { value: 'spouse', label: 'Spouse', icon: <Heart className="h-5 w-5" /> },
    { value: 'son', label: 'Son', icon: <Baby className="h-5 w-5" /> },
    { value: 'daughter', label: 'Daughter', icon: <Baby className="h-5 w-5" /> },
    { value: 'brother', label: 'Brother', icon: <Users className="h-5 w-5" /> },
    { value: 'sister', label: 'Sister', icon: <Users className="h-5 w-5" /> },
    { value: 'grandmother', label: 'Grandmother', icon: <Home className="h-5 w-5" /> },
    { value: 'grandfather', label: 'Grandfather', icon: <Home className="h-5 w-5" /> },
    { value: 'other', label: 'Other', icon: <Users className="h-5 w-5" /> },
];

interface RelationshipSelectorProps {
    value: string;
    onChange: (value: string) => void;
}

export function RelationshipSelector({ value, onChange }: RelationshipSelectorProps) {
    return (
        <div className="grid grid-cols-2 gap-3">
            {relationshipOptions.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    onClick={() => onChange(option.value)}
                    className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-xl border transition-all',
                        'hover:bg-muted/50',
                        value === option.value
                            ? 'border-primary bg-primary/5'
                            : 'border-border bg-background'
                    )}
                >
                    <div
                        className={cn(
                            'p-2 rounded-lg',
                            value === option.value
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground'
                        )}
                    >
                        {option.icon}
                    </div>
                    <span className="font-medium">{option.label}</span>
                </button>
            ))}
        </div>
    );
}
