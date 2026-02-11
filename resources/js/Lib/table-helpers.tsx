import { useFormatPreferences } from '@/Hooks/useFormatPreferences';

/**
 * Table Cell Helper Utilities
 *
 * Reusable helpers for common table cell patterns across the application.
 * Used in: Appointments, Billing, Health Records, Insurance (Policies & Claims)
 */

/**
 * Hook that returns a function to render standardized date cell content.
 * Displays date on first line (text-label) and time on second line (text-body).
 *
 * @example
 * const renderDateCell = useDateCellContent();
 *
 * <TableCell className="align-top">
 *   {renderDateCell(appointment.date)}
 * </TableCell>
 */
export function useDateCellContent() {
  const { formatDate, formatTime } = useFormatPreferences();

  return (date: string) => (
    <>
      <p className="text-label whitespace-nowrap">{formatDate(date)}</p>
      <p className="text-body text-muted-foreground">{formatTime(date)}</p>
    </>
  );
}

/**
 * Hook that returns a function to render a single date line (without time).
 * Useful for date-only cells like expiry dates.
 *
 * @example
 * const renderDate = useDateOnly();
 *
 * <TableCell className="align-top">
 *   <p className="text-label whitespace-nowrap">
 *     Valid until {renderDate(policy.end_date)}
 *   </p>
 * </TableCell>
 */
export function useDateOnly() {
  const { formatDate } = useFormatPreferences();

  return (date: string) => formatDate(date);
}

/**
 * Formats a number as currency with rupee symbol and thousand separators.
 *
 * @param amount - The amount to format
 * @returns Formatted currency string (e.g., "₹1,234")
 *
 * @example
 * <TableCell className="align-top text-right">
 *   <p className="text-label">{formatCurrency(appointment.fee)}</p>
 * </TableCell>
 */
export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString()}`;
}

/**
 * Renders currency cell content with conditional display for original vs discounted amounts.
 * Shows strikethrough original amount if different from current amount.
 *
 * @param currentAmount - The current/final amount to pay
 * @param originalAmount - The original amount (optional, for showing discounts)
 * @returns JSX element with formatted currency
 *
 * @example
 * // Simple amount
 * <TableCell className="align-top text-right">
 *   {renderCurrencyCell(bill.amount)}
 * </TableCell>
 *
 * // With discount/original amount
 * <TableCell className="align-top text-right">
 *   {renderCurrencyCell(bill.due_amount, bill.original_amount)}
 * </TableCell>
 */
export function renderCurrencyCell(currentAmount: number, originalAmount?: number) {
  if (originalAmount != null && originalAmount !== currentAmount && currentAmount > 0) {
    return (
      <div>
        <p className="text-label">{formatCurrency(currentAmount)}</p>
        <p className="text-body text-muted-foreground line-through">
          {formatCurrency(originalAmount)}
        </p>
      </div>
    );
  }

  return <p className="text-label">{formatCurrency(currentAmount)}</p>;
}
