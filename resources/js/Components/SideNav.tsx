import * as React from 'react';
import { cn } from '@/Lib/utils';
import { Icon } from '@/Components/ui/icon';

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
        'w-48 flex-shrink-0',
        hiddenOnMobile && 'hidden lg:block',
        className
      )}
    >
      <div className={cn('space-y-1', sticky && 'sticky top-6')}>
        {items.map(({ id, label, icon: ItemIcon }) => {
          const isActive = activeId === id;
          return (
            <button
              type="button"
              key={id}
              onClick={() => onSelect(id)}
              className={cn(
                'w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium transition-all text-left rounded-full cursor-pointer',
                isActive
                  ? 'bg-[#F5F8FF] text-[#0052FF]'
                  : 'text-neutral-900 hover:bg-muted'
              )}
            >
              <Icon icon={ItemIcon} className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
