import { User, Users, Link2, ChevronRight } from '@/Lib/icons';
import { IconCircle } from '@/Components/ui/icon-circle';
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
    const TypeIcon = config.icon;

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={cn(
                'flex items-center justify-start gap-4 w-full h-auto px-6 py-4',
                'text-left transition-colors',
                'rounded-2xl border border-border bg-card hover:bg-muted/50',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                'disabled:cursor-not-allowed disabled:opacity-40'
            )}
        >
            <IconCircle icon={TypeIcon} size="md" variant="primary" />
            <div className="flex-1 min-w-0">
                <h4 className="text-card-title text-left text-foreground mb-0.5">{config.title}</h4>
                <p className="text-body text-muted-foreground text-left">{config.description}</p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
        </button>
    );
}
