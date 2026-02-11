import { User, Users, UserPlus, ChevronRight } from '@/Lib/icons';
import { IconCircle } from '@/Components/ui/icon-circle';
import { Button } from '@/Components/ui/button';

export type MemberType = 'new_member' | 'link_existing' | 'guest';

interface TypeSelectorCardProps {
    type: MemberType;
    isExpanded: boolean;
    onClick: () => void;
    disabled?: boolean;
}

const cardConfig: Record<MemberType, { icon: typeof User; title: string; description: string }> = {
    new_member: {
        icon: UserPlus,
        title: 'New Member',
        description: 'Create a full family member profile',
    },
    link_existing: {
        icon: Users,
        title: 'Existing Patient',
        description: 'Connect to an existing hospital patient record',
    },
    guest: {
        icon: User,
        title: 'Guest',
        description: 'One-time booking only',
    },
};

export function TypeSelectorCard({ type, isExpanded, onClick, disabled }: TypeSelectorCardProps) {
    const config = cardConfig[type];

    return (
        <Button
            variant="ghost"
            onClick={onClick}
            disabled={disabled}
            className="flex w-full items-start gap-3 rounded-xl border px-4 py-3.5 text-left transition-colors hover:bg-accent h-auto"
        >
            <IconCircle icon={config.icon} size="sm" variant="primary" />
            <div className="flex-1 min-w-0 text-wrap">
                <p className="text-card-title text-foreground">{config.title}</p>
                <p className="text-body text-muted-foreground break-words">{config.description}</p>
            </div>
            <span className="flex h-8 w-8 items-center justify-center flex-shrink-0 rounded-full border bg-secondary text-foreground">
                <ChevronRight className="h-4 w-4" />
            </span>
        </Button>
    );
}
