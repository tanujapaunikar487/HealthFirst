import * as React from 'react';
import { cn } from '@/Lib/utils';
import { Card, CardContent } from '@/Components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/ui/avatar';
import { IconCircle } from '@/Components/ui/icon-circle';
import { Badge } from '@/Components/ui/badge';
import { getAvatarColorByName } from '@/Lib/avatar-colors';
import { ChevronRight } from '@/Lib/icons';
import type { BadgeProps } from '@/Components/ui/badge';

/**
 * TableCard Component
 *
 * Reusable mobile table card component for responsive list pages.
 * Replaces duplicated mobile card implementations across Appointments, Billing,
 * Health Records, and Insurance pages.
 *
 * Supports two layout modes:
 * - **Grid mode**: DetailRow-style layout with label-value pairs (e.g., Appointments, Insurance)
 * - **Inline mode**: Bullet-separated details (e.g., Billing, Health Records)
 *
 * @example
 * // Grid mode with avatar and action button
 * <TableCard
 *   layoutMode="grid"
 *   avatar={{ src: doctor.avatar, name: doctor.name }}
 *   title="Dr. Sarah Johnson"
 *   subtitle="Cardiology · Video"
 *   badge={{ label: "Paid", variant: "success" }}
 *   fields={[
 *     { label: "Date & Time", value: "Mon, 10 Feb • 10:00 AM" },
 *     { label: "Amount", value: "₹1,500" },
 *     { label: "Family Member", value: "John Doe" }
 *   ]}
 *   actionButton={{
 *     label: "View Results",
 *     icon: FileText,
 *     variant: "outline",
 *     onClick: (e) => { e.stopPropagation(); navigate('/results'); }
 *   }}
 *   onClick={() => navigate('/appointments/123')}
 * />
 *
 * @example
 * // Inline mode with checkbox
 * <TableCard
 *   layoutMode="inline"
 *   showCheckbox
 *   checked={selected}
 *   onCheckboxChange={() => toggleSelect()}
 *   selected={selected}
 *   icon={TestTube2}
 *   title="Complete Blood Count"
 *   subtitle="INV-12345"
 *   inlineDetails={[
 *     <span className="text-body text-muted-foreground">Mon, 10 Feb</span>,
 *     <span className="text-body text-muted-foreground">John Doe</span>,
 *     <span className="text-label">₹1,500</span>
 *   ]}
 *   badge={{ label: "Paid", variant: "success" }}
 *   onClick={() => navigate('/billing/123')}
 * />
 */

/* ─── Types ─── */

export interface TableCardField {
  /** Field label (e.g., "Date & Time") */
  label: string;
  /** Field value (can be text, JSX, etc.) */
  value: React.ReactNode;
}

export interface TableCardProps {
  /* ─── Navigation ─── */
  /** Click handler for card navigation */
  onClick?: () => void;

  /* ─── Bulk Selection ─── */
  /** Show checkbox for bulk selection */
  showCheckbox?: boolean;
  /** Checkbox checked state */
  checked?: boolean;
  /** Checkbox change handler */
  onCheckboxChange?: () => void;
  /** Disable checkbox (e.g., non-payable bills) */
  checkboxDisabled?: boolean;

  /* ─── Header: Icon or Avatar ─── */
  /** Icon component for IconCircle (e.g., TestTube2, Stethoscope) */
  icon?: React.ComponentType;
  /** IconCircle variant (defaults to 'primary') */
  iconVariant?: 'primary' | 'success' | 'destructive' | 'warning' | 'info' | 'muted' | 'secondary';
  /** Avatar configuration (for doctors/family members) */
  avatar?: {
    src?: string;
    name: string; // For fallback initials and color
  };

  /* ─── Header: Title + Subtitle ─── */
  /** Card title (required) */
  title: string;
  /** Optional subtitle */
  subtitle?: string;

  /* ─── Header: Badge ─── */
  /** Optional badge/status indicator */
  badge?: {
    label: string;
    variant: BadgeProps['variant'];
  };

  /* ─── Layout Modes ─── */
  /** Layout mode: 'grid' (labeled fields) or 'inline' (bullet-separated) */
  layoutMode?: 'grid' | 'inline';

  /* ─── Grid Mode: Labeled Fields ─── */
  /** Fields for grid layout (2-column grid with labels) */
  fields?: TableCardField[];

  /* ─── Inline Mode: Bullet-Separated Details ─── */
  /** Details for inline layout (bullet-separated) */
  inlineDetails?: React.ReactNode[];

  /* ─── Footer: Action Button ─── */
  /** Optional action button (e.g., "View Results") */
  actionButton?: {
    label: string;
    icon?: React.ComponentType;
    onClick: (e: React.MouseEvent) => void;
  };

  /* ─── Styling ─── */
  /** Additional className for card */
  className?: string;
  /** Visual state for bulk selection */
  selected?: boolean;
}

/* ─── TableCard ─── */

export function TableCard({
  onClick,
  showCheckbox,
  checked,
  onCheckboxChange,
  checkboxDisabled,
  icon,
  iconVariant = 'primary',
  avatar,
  title,
  subtitle,
  badge,
  layoutMode = 'grid',
  fields = [],
  inlineDetails = [],
  actionButton,
  className,
  selected,
}: TableCardProps) {
  return (
    <Card
      className={cn(
        'cursor-pointer hover:bg-muted/50 transition-colors',
        selected && 'bg-primary/5 border-primary',
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-0">
        <div className="px-6 py-4 space-y-4">
          {/* Header Row */}
          <div className="flex items-start gap-3">
            {/* Optional Checkbox */}
            {showCheckbox && (
              <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={checkboxDisabled}
                  onChange={onCheckboxChange}
                  className="h-4 w-4"
                />
              </div>
            )}

            {/* Icon/Avatar + Title/Subtitle + Badge */}
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {/* Icon or Avatar */}
              {avatar ? (
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage src={avatar.src || undefined} alt={avatar.name} />
                  <AvatarFallback
                    className="text-label"
                    style={(() => {
                      const color = getAvatarColorByName(avatar.name);
                      return { backgroundColor: color.bg, color: color.text };
                    })()}
                  >
                    {avatar.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ) : icon ? (
                <IconCircle icon={icon} size="sm" variant={iconVariant} />
              ) : null}

              {/* Title + Subtitle */}
              <div className="flex-1 min-w-0">
                <p className="text-label truncate">{title}</p>
                {subtitle && (
                  <p className="text-body text-muted-foreground truncate">
                    {subtitle}
                  </p>
                )}

                {/* Inline mode: Show details below subtitle */}
                {layoutMode === 'inline' && inlineDetails.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {inlineDetails.map((detail, idx) => (
                      <React.Fragment key={idx}>
                        {idx > 0 && <span className="text-muted-foreground">•</span>}
                        {detail}
                      </React.Fragment>
                    ))}
                    {badge && (
                      <>
                        <span className="text-muted-foreground">•</span>
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Badge (grid mode only) */}
              {layoutMode === 'grid' && badge && (
                <Badge variant={badge.variant}>{badge.label}</Badge>
              )}

              {/* ChevronRight (inline mode only) */}
              {layoutMode === 'inline' && (
                <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              )}
            </div>
          </div>

          {/* Grid mode: Detail Rows */}
          {layoutMode === 'grid' && fields.length > 0 && (
            <div className="divide-y -mx-6">
              {fields.map((field, idx) => (
                <div key={idx} className="flex items-start justify-between gap-4 px-6 py-3">
                  <span className="text-body text-muted-foreground flex-shrink-0">
                    {field.label}
                  </span>
                  <div className="text-label text-right">{field.value}</div>
                </div>
              ))}
            </div>
          )}

          {/* Optional Action Button */}
          {actionButton && (
            <button
              type="button"
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-border bg-background text-label hover:bg-muted transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                actionButton.onClick(e);
              }}
            >
              {actionButton.icon && <actionButton.icon className="h-5 w-5" />}
              {actionButton.label}
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
