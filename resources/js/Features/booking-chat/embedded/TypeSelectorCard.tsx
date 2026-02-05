import { User, Users, Link2, ChevronDown } from '@/Lib/icons';
import { cn } from '@/Lib/utils';

export type MemberType = 'new_member' | 'link_existing' | 'guest';

interface TypeSelectorCardProps {
    type: MemberType;
    isExpanded: boolean;
    onClick: () => void;
    disabled?: boolean;
}

const cardConfig: Record<MemberType, { icon: typeof User; title: string; description: string }> = {
    new_member: {
        icon: Users,
        title: 'New Member',
        description: 'Create a new family member profile',
    },
    link_existing: {
        icon: Link2,
        title: 'Existing Patient',
        description: 'Connect to their hospital record',
    },
    guest: {
        icon: User,
        title: 'Guest',
        description: 'One-time booking only',
    },
};

export function TypeSelectorCard({ type, isExpanded, onClick, disabled }: TypeSelectorCardProps) {
    const config = cardConfig[type];
    const Icon = config.icon;

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={cn(
                'flex items-center gap-4 p-4 rounded-xl border transition-all text-left w-full',
                isExpanded
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50 hover:bg-primary/5',
                disabled && 'opacity-50 cursor-not-allowed'
            )}
        >
            <div className={cn(
                'h-12 w-12 rounded-lg flex items-center justify-center shrink-0',
                isExpanded ? 'bg-primary/10' : 'bg-muted'
            )}>
                <Icon className={cn('h-6 w-6', isExpanded && 'text-primary')} />
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="font-semibold">{config.title}</h4>
                <p className="text-[14px] text-muted-foreground">{config.description}</p>
            </div>
            <ChevronDown
                className={cn(
                    'h-5 w-5 shrink-0 text-neutral-900 transition-transform duration-200',
                    isExpanded && 'rotate-180 text-primary'
                )}
            />
        </button>
    );
}
