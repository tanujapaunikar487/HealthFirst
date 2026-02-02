import * as React from 'react';
import { Icon } from '@/Components/ui/icon';

interface EmptyStateProps {
  icon: React.ElementType;
  message: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: EmptyIcon, message, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-8 px-4 rounded-lg border border-dashed">
      <Icon icon={EmptyIcon} className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
      <p className="text-sm text-muted-foreground">{message}</p>
      {description && (
        <p className="text-xs text-muted-foreground/70 mt-1 max-w-xs mx-auto">{description}</p>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
