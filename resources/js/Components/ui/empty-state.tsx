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
      className="text-center flex flex-col items-center justify-center"
      style={{
        backgroundColor: '#F5F5F5',
        padding: '60px',
        height: '400px',
        borderRadius: '20px',
      }}
    >
      {image ? (
        <img src={image} alt="" className="h-40 w-auto mb-6" />
      ) : EmptyIcon ? (
        <Icon icon={EmptyIcon} className="h-12 w-12 text-muted-foreground/30 mb-4" />
      ) : null}
      <h3 className="text-lg font-semibold" style={{ color: '#00184D' }}>{message}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mt-2 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
