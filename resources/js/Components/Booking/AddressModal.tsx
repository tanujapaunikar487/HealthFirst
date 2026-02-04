import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/Components/ui/radio-group';
import { cn } from '@/Lib/utils';
import { MapPin, Plus, Home } from '@/Lib/icons';
import { Icon } from '@/Components/ui/icon';

interface Address {
  id: string;
  label: string;
  addressLine: string;
  distance?: string;
}

interface AddressModalProps {
  open: boolean;
  onClose: () => void;
  savedAddresses: Address[];
  onSelectAddress: (addressId: string) => void;
  onAddNewAddress: (address: Omit<Address, 'id'>) => void;
}

export function AddressModal({
  open,
  onClose,
  savedAddresses,
  onSelectAddress,
  onAddNewAddress,
}: AddressModalProps) {
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: '',
    addressLine: '',
  });

  const handleSelectAddress = () => {
    if (selectedAddressId) {
      onSelectAddress(selectedAddressId);
      onClose();
    }
  };

  const handleAddAddress = () => {
    if (newAddress.label && newAddress.addressLine) {
      onAddNewAddress(newAddress);
      setNewAddress({ label: '', addressLine: '' });
      setShowAddForm(false);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Select or add address</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!showAddForm ? (
            <>
              {/* Saved Addresses */}
              {savedAddresses.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium">Saved Addresses</p>
                  <RadioGroup value={selectedAddressId || ''} onValueChange={setSelectedAddressId}>
                    {savedAddresses.map((address) => (
                      <label
                        key={address.id}
                        className={cn(
                          'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                          'hover:border-primary/50 hover:bg-primary/5',
                          selectedAddressId === address.id && 'border-primary bg-primary/5'
                        )}
                      >
                        <RadioGroupItem value={address.id} className="mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Icon icon={Home} className="h-4 w-4 text-muted-foreground" />
                            <p className="font-medium text-sm">{address.label}</p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{address.addressLine}</p>
                          {address.distance && (
                            <p className="text-xs text-muted-foreground mt-1">{address.distance}</p>
                          )}
                        </div>
                      </label>
                    ))}
                  </RadioGroup>
                </div>
              )}

              {/* Add new address Button */}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowAddForm(true)}
              >
                <Icon icon={Plus} className="h-4 w-4 mr-2" />
                Add new address
              </Button>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSelectAddress}
                  disabled={!selectedAddressId}
                >
                  Select address
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Add address Form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="label">Address Label (e.g., Home, Office)</Label>
                  <Input
                    id="label"
                    placeholder="Home"
                    value={newAddress.label}
                    onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Full Address</Label>
                  <Input
                    id="address"
                    placeholder="123, Palm Grove, Koregaon Park"
                    value={newAddress.addressLine}
                    onChange={(e) => setNewAddress({ ...newAddress, addressLine: e.target.value })}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowAddForm(false)}>
                  Back
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleAddAddress}
                  disabled={!newAddress.label || !newAddress.addressLine}
                >
                  Add address
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
