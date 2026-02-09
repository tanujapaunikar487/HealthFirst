import { useState } from 'react';
import { cn } from '@/Lib/utils';
import { Badge } from '@/Components/ui/badge';
import { Card } from '@/Components/ui/card';
import { Home, MapPin, Plus } from '@/Lib/icons';
import { Icon } from '@/Components/ui/icon';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Textarea } from '@/Components/ui/textarea';
import { Collapsible, CollapsibleContent } from '@/Components/ui/collapsible';

interface Address {
  id: number;
  label: string;
  address: string;
  is_default: boolean;
}

interface AddressFormData {
  label: string;
  address_line_1: string;
  address_line_2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
}

interface Props {
  addresses: Address[];
  selectedAddressId: number | null;
  onSelect: (id: number, label: string, address: string) => void;
  onAddAddress?: () => void;
  onSubmitAddress?: (data: AddressFormData) => void;
  disabled: boolean;
}

export function EmbeddedAddressSelector({ addresses, selectedAddressId, onSelect, onAddAddress, onSubmitAddress, disabled }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [formData, setFormData] = useState<AddressFormData>({
    label: '',
    address_line_1: '',
    address_line_2: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
  });

  const handleSubmit = () => {
    // Validate required fields
    if (!formData.label || !formData.address_line_1 || !formData.city || !formData.state || !formData.pincode) {
      return;
    }

    // Call the submit handler if provided
    if (onSubmitAddress) {
      onSubmitAddress(formData);
      // Reset form and collapse
      setFormData({
        label: '',
        address_line_1: '',
        address_line_2: '',
        landmark: '',
        city: '',
        state: '',
        pincode: '',
      });
      setIsExpanded(false);
    } else if (onAddAddress) {
      // Fallback to old behavior if onSubmitAddress not provided
      onAddAddress();
    }
  };

  return (
    <Card className="overflow-hidden divide-y">
      {/* Saved addresses */}
      {addresses.map((addr) => {
        const isSelected = selectedAddressId === addr.id;

        return (
          <Button
            key={addr.id}
            variant="ghost"
            onClick={() => !disabled && onSelect(addr.id, addr.label, addr.address)}
            disabled={disabled}
            className={cn(
              'w-full h-auto rounded-none justify-start px-6 py-4 text-body hover:bg-muted/50',
              'flex items-start gap-3 text-left transition-all',
              disabled && 'opacity-60',
            )}
          >
            <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Icon icon={Home} size={20} className="text-blue-800" />
            </div>

            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center gap-2">
                <p className="text-label">{addr.label}</p>
                {addr.is_default && (
                  <Badge variant="info">Default</Badge>
                )}
              </div>
              <div className="flex items-center gap-1 mt-1 text-body text-muted-foreground">
                <Icon icon={MapPin} size={12} className="flex-shrink-0" />
                <span className="truncate">{addr.address}</span>
              </div>
            </div>
          </Button>
        );
      })}

      {/* Add new address button + form */}
      <div>
        <Button
          variant="link"
          className="w-full h-auto px-6 py-4 rounded-none justify-center text-body text-primary hover:bg-muted/50"
          onClick={() => !disabled && setIsExpanded(!isExpanded)}
          disabled={disabled}
        >
          <Icon icon={Plus} size={16} />
          Add new address
        </Button>

        <Collapsible open={isExpanded}>
          <CollapsibleContent className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2">
            <div className="px-6 pb-6 pt-4 space-y-4 border-t">
              {/* Label */}
              <div className="space-y-2">
                <label className="text-label text-foreground">
                  Label <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="e.g., Home, Work, Other"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                />
              </div>

              {/* Address Line 1 */}
              <div className="space-y-2">
                <label className="text-label text-foreground">
                  Address Line 1 <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="Building name, street, area"
                  value={formData.address_line_1}
                  onChange={(e) => setFormData({ ...formData, address_line_1: e.target.value })}
                />
              </div>

              {/* Address Line 2 */}
              <div className="space-y-2">
                <label className="text-label text-foreground">
                  Address Line 2 <span className="text-body text-muted-foreground">(optional)</span>
                </label>
                <Input
                  placeholder="Locality, colony"
                  value={formData.address_line_2}
                  onChange={(e) => setFormData({ ...formData, address_line_2: e.target.value })}
                />
              </div>

              {/* Landmark */}
              <div className="space-y-2">
                <label className="text-label text-foreground">
                  Landmark <span className="text-body text-muted-foreground">(optional)</span>
                </label>
                <Input
                  placeholder="e.g., Near City Hospital"
                  value={formData.landmark}
                  onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                />
              </div>

              {/* City, State, Pincode row */}
              <div className="grid grid-cols-2 gap-4">
                {/* City */}
                <div className="space-y-2">
                  <label className="text-label text-foreground">
                    City <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="City"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>

                {/* State */}
                <div className="space-y-2">
                  <label className="text-label text-foreground">
                    State <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="State"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  />
                </div>
              </div>

              {/* Pincode */}
              <div className="space-y-2">
                <label className="text-label text-foreground">
                  Pincode <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="e.g., 400001"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                />
              </div>

              {/* Save button */}
              <Button
                variant="accent"
                size="md"
                onClick={handleSubmit}
                disabled={!formData.label || !formData.address_line_1 || !formData.city || !formData.state || !formData.pincode}
              >
                Save Address
              </Button>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </Card>
  );
}
