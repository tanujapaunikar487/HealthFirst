import * as React from 'react';
import { Card } from '@/Components/ui/card';
import { Icon } from '@/Components/ui/icon';

interface DetailSectionProps {
  id: string;
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  action?: React.ReactNode;
  noPadding?: boolean;
}

function DetailSection({
  id,
  title,
  icon: SectionIcon,
  children,
  action,
  noPadding,
}: DetailSectionProps) {
  return (
    <div id={id} className="scroll-mt-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <Icon icon={SectionIcon} className="h-5 w-5 text-foreground" />
          <h2 className="text-section-title text-foreground">{title}</h2>
        </div>
        {action}
      </div>
      <Card className={noPadding ? '' : 'p-6'}>{children}</Card>
    </div>
  );
}

export { DetailSection };
export type { DetailSectionProps };
