import * as React from 'react';
import { Icon } from '@/Components/ui/icon';

interface EmptyStateProps {
  image?: string;
  icon?: React.ElementType;
  message: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ image, icon: EmptyIcon, message, description, action }: EmptyStateProps) {
  return (
    <div
      className="text-center flex flex-col items-center justify-center rounded-3xl"
      style={{
        backgroundColor: 'hsl(var(--secondary))',
        padding: '24px 24px 48px 24px',
      }}
    >
      {image ? (
        <img src={image} alt="" className="h-48 w-auto mb-2" />
      ) : EmptyIcon ? (
        <Icon icon={EmptyIcon} className="h-12 w-12 text-muted-foreground/30 mb-4" />
      ) : null}
      <h3 className="text-[16px] font-semibold leading-6 text-foreground">{message}</h3>
      {description && (
        <p className="text-[14px] text-muted-foreground mt-2 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
