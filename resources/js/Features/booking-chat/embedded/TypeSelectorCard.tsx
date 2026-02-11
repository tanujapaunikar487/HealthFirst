import { User, Users, Link2, ChevronDown } from '@/Lib/icons';
import { Icon } from '@/Components/ui/icon';
import { IconCircle } from '@/Components/ui/icon-circle';
import { cn } from '@/Lib/utils';
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
        <Button
            variant="ghost"
            onClick={onClick}
            disabled={disabled}
            className={cn(
                'w-full h-auto justify-start px-6 py-4 text-body',
                'flex items-center gap-4 text-left transition-all',
                'disabled:cursor-not-allowed',
                isExpanded
                    ? 'relative z-10 rounded-3xl border-2 border-primary bg-primary/10 [&:not(:first-child)]:-mt-px [&+*]:border-t-transparent'
                    : 'rounded-none hover:bg-muted/50',
                disabled && isExpanded && '[opacity:1!important]',
                disabled && !isExpanded && 'opacity-40'
            )}
        >
            <IconCircle icon={TypeIcon} size="sm" variant="primary" />
            <div className="flex-1 min-w-0 text-left">
                <h4 className="text-label">{config.title}</h4>
                <p className="text-body text-muted-foreground">{config.description}</p>
            </div>
            <Icon icon={ChevronDown} size={20} className={cn(
                'shrink-0 text-foreground transition-transform duration-200',
                isExpanded && 'rotate-180 text-primary'
            )} />
        </Button>
    );
}
