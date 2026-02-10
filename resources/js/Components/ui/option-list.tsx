import * as React from 'react';
import { cn } from '@/Lib/utils';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Icon } from '@/Components/ui/icon';

export interface OptionListItem<T = string> {
  /**
   * Unique identifier for this option
   */
  value: T;
  /**
   * Primary text displayed for this option
   */
  label: string;
  /**
   * Secondary descriptive text (optional)
   */
  description?: string;
  /**
   * Icon component from @/Lib/icons
   */
  icon?: React.ComponentType;
  /**
   * Custom icon colors (default: blue-200/blue-800)
   */
  iconColor?: {
    bg: string;
    text: string;
  };
  /**
   * Alternative to icon - colored dot indicator (for urgency, status, etc.)
   */
  indicator?: {
    dotColor: string;
    bgColor: string;
  };
  /**
   * Optional content displayed on the right (price, badge, etc.)
   */
  rightContent?: React.ReactNode;
}

export interface OptionListProps<T = string> {
  /**
   * Array of options to display
   */
  options: OptionListItem<T>[];
  /**
   * Currently selected value (null if none selected)
   */
  selected: T | null;
  /**
   * Callback when an option is selected
   */
  onSelect: (value: T) => void;
  /**
   * Whether the list is disabled
   */
  disabled?: boolean;
  /**
   * Additional className for Card wrapper
   */
  className?: string;
}

/**
 * OptionList Component
 *
 * Unified selection list for AI booking flow and other option selection interfaces.
 * Supports icons, colored indicators, pricing, and custom right-aligned content.
 *
 * @example
 * // Basic usage with icons
 * <OptionList
 *   options={[
 *     { value: 'new', label: 'New Appointment', description: 'First visit', icon: User },
 *     { value: 'followup', label: 'Follow-up', description: 'Return visit', icon: RefreshCw }
 *   ]}
 *   selected={selectedType}
 *   onSelect={setSelectedType}
 * />
 *
 * @example
 * // With colored indicators (urgency levels)
 * <OptionList
 *   options={[
 *     {
 *       value: 'urgent',
 *       label: 'Urgent',
 *       description: 'Need to see someone ASAP',
 *       indicator: { dotColor: 'bg-destructive', bgColor: 'bg-destructive/10' }
 *     }
 *   ]}
 *   selected={urgency}
 *   onSelect={setUrgency}
 * />
 *
 * @example
 * // With pricing
 * <OptionList
 *   options={[
 *     {
 *       value: 'video',
 *       label: 'Video Appointment',
 *       description: 'Connect from home',
 *       icon: Monitor,
 *       rightContent: <span className="text-card-title">₹500</span>
 *     }
 *   ]}
 *   selected={mode}
 *   onSelect={setMode}
 * />
 */
export function OptionList<T = string>({
  options,
  selected,
  onSelect,
  disabled = false,
  className,
}: OptionListProps<T>) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <div className="divide-y">
        {options.map((option) => {
          const isSelected = selected === option.value;

          return (
            <Button
              key={String(option.value)}
              variant="ghost"
              onClick={() => !disabled && onSelect(option.value)}
              disabled={disabled}
              className={cn(
                'w-full h-auto justify-start px-6 py-4 text-body',
                'flex items-center gap-4 text-left transition-all',
                'disabled:cursor-not-allowed',
                isSelected
                  ? 'relative z-10 rounded-3xl border-2 border-primary bg-primary/10 [&:not(:first-child)]:-mt-px [&+*]:border-t-transparent'
                  : 'rounded-none hover:bg-muted/50',
                disabled && isSelected && '[opacity:1!important]',
                disabled && !isSelected && 'opacity-40'
              )}
            >
              {/* Left Icon or Indicator */}
              {option.icon && (
                <div
                  className={cn(
                    'h-10 w-10 rounded-full flex items-center justify-center shrink-0',
                    option.iconColor?.bg || 'bg-blue-200'
                  )}
                >
                  <Icon
                    icon={option.icon}
                    size={20}
                    className={option.iconColor?.text || 'text-blue-800'}
                  />
                </div>
              )}

              {option.indicator && (
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                    option.indicator.bgColor
                  )}
                >
                  <div className={cn('w-2.5 h-2.5 rounded-full', option.indicator.dotColor)} />
                </div>
              )}

              {/* Main Content */}
              <div className="min-w-0 flex-1 text-left">
                <p className="text-label text-foreground leading-tight mb-0.5">
                  {option.label}
                </p>
                {option.description && (
                  <p className="text-body text-muted-foreground leading-tight">
                    {option.description}
                  </p>
                )}
              </div>

              {/* Right Content (Price, Badge, etc.) */}
              {option.rightContent && (
                <div className="shrink-0">
                  {option.rightContent}
                </div>
              )}
            </Button>
          );
        })}
      </div>
    </Card>
  );
}
