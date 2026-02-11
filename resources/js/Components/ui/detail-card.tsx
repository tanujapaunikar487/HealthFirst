import * as React from 'react';
import { cn } from '@/Lib/utils';
import { Card } from '@/Components/ui/card';
import { DetailRow } from '@/Components/ui/detail-row';
import { DetailSection } from '@/Components/ui/detail-section';

/**
 * DetailCard Component
 *
 * Global wrapper component for the common pattern of Card/DetailSection + divide-y + DetailRow.
 * Standardizes the display of detail information across all detail pages.
 *
 * Replaces the duplicated pattern of Card or DetailSection containing a div with divide-y
 * and multiple DetailRow components.
 *
 * Used on: booking confirmations, insurance claims, appointments, billing, health records,
 * family members, and all other detail pages.
 *
 * @example
 * // Simple Card wrapper (no section header)
 * <DetailCard
 *   rows={[
 *     { label: 'Patient', children: 'John Doe' },
 *     { label: 'Doctor', children: 'Dr. Sarah Johnson' },
 *     { label: 'Date', children: 'Mon, 10 Feb 2026' },
 *   ]}
 * />
 *
 * @example
 * // With DetailSection wrapper (section with title and icon)
 * <DetailCard
 *   id="overview"
 *   title="Appointment Details"
 *   icon={Calendar}
 *   rows={[
 *     { label: 'Patient', children: 'John Doe' },
 *     { label: 'Doctor', children: <div>Dr. Smith<br/>Cardiology</div> },
 *   ]}
 * />
 *
 * @example
 * // With complex DetailRow content
 * <DetailCard
 *   id="details"
 *   title="Policy Information"
 *   icon={Shield}
 *   rows={[
 *     {
 *       label: 'Provider',
 *       children: (
 *         <div>
 *           <p className="text-label">Blue Cross</p>
 *           <p className="text-body text-muted-foreground">Group Plan</p>
 *         </div>
 *       ),
 *     },
 *     { label: 'Status', children: <Badge variant="success">Active</Badge> },
 *   ]}
 * />
 */

/* ─── Types ─── */

export interface DetailCardRow {
  /** Label text displayed on the left */
  label: string;
  /** Content displayed on the right (matches DetailRow children prop) */
  children: React.ReactNode;
}

export interface DetailCardProps {
  /** Array of rows to display */
  rows: DetailCardRow[];

  /** Optional DetailSection props (if provided, wraps in DetailSection instead of Card) */
  id?: string;
  title?: string;
  icon?: React.ElementType;
  action?: React.ReactNode;

  /** Optional styling overrides */
  className?: string;
  iconClassName?: string;
  cardClassName?: string;
}

/* ─── DetailCard ─── */

export function DetailCard({
  rows,
  id,
  title,
  icon,
  action,
  className,
  iconClassName,
  cardClassName,
}: DetailCardProps) {
  // Content: divide-y + DetailRow components
  const content = (
    <div className="divide-y">
      {rows.map((row, index) => (
        <DetailRow key={row.label + index} label={row.label}>
          {row.children}
        </DetailRow>
      ))}
    </div>
  );

  // If id/title/icon provided, wrap in DetailSection
  if (id && title && icon) {
    return (
      <DetailSection
        id={id}
        title={title}
        icon={icon}
        action={action}
        noPadding
        iconClassName={iconClassName}
        cardClassName={cardClassName}
      >
        {content}
      </DetailSection>
    );
  }

  // Otherwise, wrap in simple Card
  return (
    <Card className={cn('overflow-hidden', className, cardClassName)}>
      {content}
    </Card>
  );
}
