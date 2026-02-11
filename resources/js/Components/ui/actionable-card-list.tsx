import * as React from 'react';
import { useState } from 'react';
import { cn } from '@/Lib/utils';
import { Card, CardContent } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge, type BadgeVariant } from '@/Components/ui/badge';
import { IconCircle } from '@/Components/ui/icon-circle';
import { Avatar, AvatarImage, AvatarFallback } from '@/Components/ui/avatar';
import { VStack, HStack } from '@/Components/ui/stack';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/Components/ui/dropdown-menu';
import { getAvatarColor } from '@/Lib/avatar-colors';
import {
  Receipt,
  AlertCircle,
  Stethoscope,
  Calendar,
  CreditCard,
  Shield,
  RotateCcw,
  CheckCircle2,
  Syringe,
  Pill,
  MoreHorizontal,
} from '@/Lib/icons';

/**
 * ActionableCardList Component
 *
 * Global list component for dashboard action items. Displays items in a Card with
 * divide-y pattern, each with icon/avatar, title, subtitle, badge, action button,
 * and dropdown menu. Includes "View all" expansion functionality.
 *
 * Used for: overdue bills, upcoming appointments, health alerts, payments, etc.
 */

/* ─── Types ─── */

export type CardType =
  | 'overdue_bill'
  | 'health_alert'
  | 'appointment_today'
  | 'appointment_upcoming'
  | 'payment_due_soon'
  | 'emi_due'
  | 'insurance_claim_update'
  | 'followup_due'
  | 'pre_appointment_reminder'
  | 'new_results_ready'
  | 'vaccination_due'
  | 'prescription_expiring';

export interface ActionableCardListItemProps {
  /** Card type determines default icon and colors */
  type: CardType;
  /** Main title text */
  title: string;
  /** Secondary subtitle text */
  subtitle: string;
  /** Patient name displayed with badge */
  patientName: string;
  /** Patient initials for avatar fallback */
  patientInitials: string;
  /** Optional badge text */
  badge?: string;
  /** Badge color variant */
  badgeVariant?: BadgeVariant;
  /** Action button label */
  actionLabel: string;
  /** Action button variant */
  actionVariant?: 'accent' | 'outline' | 'secondary' | 'primary';
  /** Action button click handler */
  onAction: () => void;
  /** Dropdown menu items */
  menuItems: { label: string; onClick: () => void; destructive?: boolean }[];
  /** Whether this is the last item (controls border) */
  isLast: boolean;
  /** Override default icon */
  iconOverride?: React.ComponentType;
  /** Doctor name (triggers avatar display) */
  doctorName?: string;
  /** Doctor avatar URL */
  doctorAvatarUrl?: string;
}

export interface ActionableCardListProps<T> {
  /** Array of items to display */
  items: T[];
  /** Render function for each item */
  renderItem: (item: T, index: number, isLast: boolean) => React.ReactNode;
  /** Number of items to show before "View all" (default: 3) */
  viewAllThreshold?: number;
  /** Start expanded (default: false) */
  defaultExpanded?: boolean;
  /** Additional className for Card wrapper */
  className?: string;
}

/* ─── Icon Configuration ─── */

export const cardConfig: Record<CardType, { icon: React.ComponentType }> = {
  overdue_bill: { icon: Receipt },
  health_alert: { icon: AlertCircle },
  appointment_today: { icon: Stethoscope },
  appointment_upcoming: { icon: Calendar },
  payment_due_soon: { icon: CreditCard },
  emi_due: { icon: CreditCard },
  insurance_claim_update: { icon: Shield },
  followup_due: { icon: RotateCcw },
  pre_appointment_reminder: { icon: Calendar },
  new_results_ready: { icon: CheckCircle2 },
  vaccination_due: { icon: Syringe },
  prescription_expiring: { icon: Pill },
};

/* ─── Helper Functions ─── */

function getAvatarColorByName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return getAvatarColor(Math.abs(hash));
}

function getInitials(name: string) {
  const words = name.split(' ').filter((w) => w.length > 0);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return words[0]?.slice(0, 2).toUpperCase() || 'D';
}

/* ─── ActionableCardListItem ─── */

export function ActionableCardListItem({
  type,
  title,
  subtitle,
  patientName,
  patientInitials: _patientInitials,
  badge,
  badgeVariant,
  actionLabel,
  actionVariant = 'secondary',
  onAction,
  menuItems,
  isLast,
  iconOverride,
  doctorName,
  doctorAvatarUrl,
}: ActionableCardListItemProps) {
  const config = cardConfig[type];
  const CardIcon = iconOverride || config.icon;

  const isDoctorAppointment =
    (type === 'appointment_today' ||
      type === 'appointment_upcoming' ||
      type === 'pre_appointment_reminder') &&
    doctorName &&
    !iconOverride;

  return (
    <HStack gap={3} align="start" className={`p-4 ${!isLast ? 'border-b border-border' : ''}`}>
      {/* Avatar for doctor appointments, Icon for everything else */}
      {isDoctorAppointment ? (
        <Avatar className="h-10 w-10 flex-shrink-0">
          {doctorAvatarUrl && <AvatarImage src={doctorAvatarUrl} alt={doctorName} />}
          <AvatarFallback
            className="text-body font-medium"
            style={(() => {
              const color = getAvatarColorByName(doctorName!);
              return { backgroundColor: color.bg, color: color.text };
            })()}
          >
            {getInitials(doctorName!)}
          </AvatarFallback>
        </Avatar>
      ) : (
        <IconCircle icon={CardIcon} size="sm" variant="primary" />
      )}

      {/* Content */}
      <VStack gap={0.5} className="flex-1 min-w-0">
        {/* Patient + badge row */}
        <div className="flex items-center gap-2">
          <span className="text-label text-muted-foreground">{patientName}</span>
          {badge && (
            <Badge variant={badgeVariant || 'danger'} size="sm">
              {badge}
            </Badge>
          )}
        </div>
        {/* Title */}
        <h3 className="text-card-title text-foreground truncate">{title}</h3>
        {/* Subtitle */}
        <p className="text-body text-muted-foreground">{subtitle}</p>
      </VStack>

      {/* Action button */}
      <Button
        variant={actionVariant}
        size="md"
        className="flex-shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          onAction();
        }}
      >
        {actionLabel}
      </Button>

      {/* Overflow menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="secondary"
            iconOnly
            size="md"
            className="flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {menuItems.map((item, i) => (
            <DropdownMenuItem
              key={i}
              onClick={item.onClick}
              className={item.destructive ? 'text-destructive focus:text-destructive' : ''}
            >
              {item.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </HStack>
  );
}

/* ─── ActionableCardList ─── */

export function ActionableCardList<T>({
  items,
  renderItem,
  viewAllThreshold = 3,
  defaultExpanded = false,
  className,
}: ActionableCardListProps<T>) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const visibleItems = expanded ? items : items.slice(0, viewAllThreshold);
  const showViewAll = items.length > viewAllThreshold;

  return (
    <Card className={cn('overflow-hidden w-full', className)}>
      <CardContent className="p-0">
        {visibleItems.map((item, i) =>
          renderItem(item, i, i === visibleItems.length - 1 && !showViewAll)
        )}

        {/* View all button */}
        {showViewAll && (
          <div
            className="px-6 py-4 border-t border-border flex justify-center cursor-pointer hover:bg-accent transition-colors"
            onClick={() => setExpanded(!expanded)}
          >
            <span className="text-label text-primary">
              {expanded ? 'Show less' : `View all ${items.length}`}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
