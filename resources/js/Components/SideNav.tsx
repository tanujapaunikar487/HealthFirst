import * as React from 'react';
import { cn } from '@/Lib/utils';
import { Icon } from '@/Components/ui/icon';
import { Button } from '@/Components/ui/button';

export interface SideNavItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

export interface SideNavProps {
  items: SideNavItem[];
  activeId: string;
  onSelect: (id: string) => void;
  sticky?: boolean;
  hiddenOnMobile?: boolean;
  className?: string;
}

export function SideNav({
  items,
  activeId,
  onSelect,
  sticky = true,
  hiddenOnMobile = false,
  className,
}: SideNavProps) {
  return (
    <div
      className={cn(
        'w-sidebar shrink-0',
        hiddenOnMobile && 'hidden lg:block',
        className
      )}
    >
      <div className={cn('space-y-1', sticky && 'sticky top-2')}>
        {items.map(({ id, label, icon: ItemIcon }) => {
          const isActive = activeId === id;
          return (
            <Button
              variant="ghost"
              type="button"
              key={id}
              onClick={() => onSelect(id)}
              className={cn(
                'w-full justify-start gap-3 text-label text-left cursor-pointer',
                isActive
                  ? 'bg-primary/5 text-primary'
                  : 'text-foreground hover:bg-muted'
              )}
              style={{ padding: '8px 12px', height: 'auto' }}
            >
              <Icon icon={ItemIcon} className="h-5 w-5 flex-shrink-0" />
              <span className="truncate">{label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
