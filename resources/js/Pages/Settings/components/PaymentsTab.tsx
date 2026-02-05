import { useState } from 'react';
import { router } from '@inertiajs/react';
import { CreditCard, Plus, Trash2, Check, Phone } from '@/Lib/icons';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Alert } from '@/Components/ui/alert';
import { cn } from '@/Lib/utils';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from '@/Components/ui/sheet';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';
import { toast } from 'sonner';

export interface PaymentMethod {
    id: number;
    type: 'card' | 'upi' | 'netbanking';
    last_four: string;
    brand: string;
    expiry_month: number;
    expiry_year: number;
    is_default: boolean;
    holder_name: string;
}

export interface UpiId {
    id: number;
    upi_id: string;
    is_default: boolean;
}

interface PaymentsTabProps {
    paymentMethods?: PaymentMethod[];
    upiIds?: UpiId[];
}

function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <h3
            className="font-semibold"
            style={{
                color: '#171717',
                fontSize: '20px',
                lineHeight: '28px',
                letterSpacing: '0',
            }}
        >
            {children}
        </h3>
    );
}

function formatCardNumber(value: string): string {
    const digits = value.replace(/\D/g, '');
    const groups = digits.match(/.{1,4}/g);
    return groups ? groups.join(' ') : digits;
}

function formatExpiry(value: string): string {
    const digits = value.replace(/\D/g, '');
    if (digits.length >= 2) {
        return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
    }
    return digits;
}

function getCardBrandIcon(brand: string): string {
    switch (brand.toLowerCase()) {
        case 'visa':
            return '/assets/icons/visa.svg';
        case 'mastercard':
            return '/assets/icons/mastercard.svg';
        case 'amex':
        case 'american express':
            return '/assets/icons/amex.svg';
        case 'rupay':
            return '/assets/icons/rupay.svg';
        default:
            return '/assets/icons/card-generic.svg';
    }
}

export function PaymentsTab({ paymentMethods = [], upiIds = [] }: PaymentsTabProps) {
    const [showAddSheet, setShowAddSheet] = useState(false);
    const [deleteMethod, setDeleteMethod] = useState<PaymentMethod | null>(null);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Card form state
    const [cardNumber, setCardNumber] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCvv, setCardCvv] = useState('');
    const [cardHolder, setCardHolder] = useState('');

    // UPI state
    const [newUpiId, setNewUpiId] = useState('');
    const [savingUpi, setSavingUpi] = useState(false);
    const [deleteUpi, setDeleteUpi] = useState<UpiId | null>(null);
    const [deletingUpi, setDeletingUpi] = useState(false);
    const [showAddUpiForm, setShowAddUpiForm] = useState(false);

    const resetForm = () => {
        setCardNumber('');
        setCardExpiry('');
        setCardCvv('');
        setCardHolder('');
    };

    const handleAddCard = () => {
        // Basic validation
        const cleanNumber = cardNumber.replace(/\s/g, '');
        if (cleanNumber.length < 15 || cleanNumber.length > 16) {
            toast.error('Please enter a valid card number');
            return;
        }

        const [month, year] = cardExpiry.split('/');
        if (!month || !year || parseInt(month) > 12 || parseInt(month) < 1) {
            toast.error('Please enter a valid expiry date');
            return;
        }

        if (cardCvv.length < 3 || cardCvv.length > 4) {
            toast.error('Please enter a valid CVV');
            return;
        }

        if (!cardHolder.trim()) {
            toast.error('Please enter the cardholder name');
            return;
        }

        setSaving(true);

        // In a real app, this would tokenize the card via payment gateway
        // For demo, we simulate adding a payment method
        router.post('/settings/payment-methods', {
            type: 'card',
            card_number: cleanNumber,
            expiry_month: parseInt(month),
            expiry_year: parseInt(`20${year}`),
            cvv: cardCvv,
            holder_name: cardHolder,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Payment method added successfully');
                setShowAddSheet(false);
                resetForm();
            },
            onError: () => {
                toast.error('Failed to add payment method');
            },
            onFinish: () => setSaving(false),
        });
    };

    const handleSetDefault = (method: PaymentMethod) => {
        if (method.is_default) return;

        router.put(`/settings/payment-methods/${method.id}/default`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`${method.brand} •••• ${method.last_four} set as default`);
            },
            onError: () => {
                toast.error('Failed to update default payment method');
            },
        });
    };

    const handleDelete = () => {
        if (!deleteMethod) return;

        setDeleting(true);

        router.delete(`/settings/payment-methods/${deleteMethod.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Payment method removed');
                setDeleteMethod(null);
            },
            onError: () => {
                toast.error('Failed to remove payment method');
            },
            onFinish: () => setDeleting(false),
        });
    };

    // UPI handlers
    const handleAddUpi = () => {
        const trimmedUpi = newUpiId.trim();

        // Basic validation - must contain @
        if (!trimmedUpi || !trimmedUpi.includes('@')) {
            toast.error('Please enter a valid UPI ID (e.g., name@upi)');
            return;
        }

        setSavingUpi(true);

        router.post('/settings/upi', { upi_id: trimmedUpi }, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('UPI ID added successfully');
                setNewUpiId('');
            },
            onError: () => {
                toast.error('Failed to add UPI ID');
            },
            onFinish: () => setSavingUpi(false),
        });
    };

    const handleSetDefaultUpi = (upi: UpiId) => {
        if (upi.is_default) return;

        router.put(`/settings/upi/${upi.id}/default`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`${upi.upi_id} set as default`);
            },
            onError: () => {
                toast.error('Failed to update default UPI ID');
            },
        });
    };

    const handleDeleteUpi = () => {
        if (!deleteUpi) return;

        setDeletingUpi(true);

        router.delete(`/settings/upi/${deleteUpi.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('UPI ID removed');
                setDeleteUpi(null);
            },
            onError: () => {
                toast.error('Failed to remove UPI ID');
            },
            onFinish: () => setDeletingUpi(false),
        });
    };

    return (
        <div className="space-y-12">
            {/* Cards Section */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <SectionTitle>Cards</SectionTitle>
                        <p className="text-[14px] text-muted-foreground mt-1">
                            Manage your saved debit and credit cards
                        </p>
                    </div>
                    {paymentMethods.length > 0 && (
                        <Button onClick={() => setShowAddSheet(true)}>
                            <Plus className="h-4 w-4" />
                            Add card
                        </Button>
                    )}
                </div>

                {paymentMethods.length === 0 ? (
                    <div className="rounded-[20px] border border-border bg-white overflow-hidden">
                        <div className="px-6 py-8 text-center">
                            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                                <CreditCard className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <p className="text-[14px] font-semibold leading-5 text-[#171717]">No cards saved</p>
                            <p className="text-[14px] font-normal leading-5 text-[#737373] mt-1">
                                Add a debit or credit card for faster checkout when paying bills.
                            </p>
                            <Button onClick={() => setShowAddSheet(true)} className="mt-4">
                                <Plus className="h-4 w-4" />
                                Add card
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="rounded-[20px] border border-border bg-white overflow-hidden">
                        {paymentMethods.map((method, index) => (
                            <div
                                key={method.id}
                                className={cn(
                                    "flex items-center justify-between px-6 py-4",
                                    index !== paymentMethods.length - 1 && "border-b border-border"
                                )}
                            >
                                <button
                                    onClick={() => handleSetDefault(method)}
                                    className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity"
                                >
                                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                                        <img src={getCardBrandIcon(method.brand)} alt={method.brand} className="h-8 w-8 object-contain" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-[14px] font-semibold leading-5 text-[#171717]">
                                                {method.brand} •••• {method.last_four}
                                            </p>
                                            {method.is_default && (
                                                <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
                                                    <Check className="h-3 w-3 mr-1" /> Default
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-[14px] font-normal leading-5 text-[#737373]">
                                            Expires {method.expiry_month.toString().padStart(2, '0')}/{method.expiry_year.toString().slice(-2)}
                                            {method.holder_name && ` · ${method.holder_name}`}
                                        </p>
                                    </div>
                                </button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-muted-foreground hover:text-destructive"
                                    onClick={() => setDeleteMethod(method)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* UPI Section */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <SectionTitle>UPI</SectionTitle>
                        <p className="text-[14px] text-muted-foreground mt-1">
                            Link your UPI ID for instant payments
                        </p>
                    </div>
                    {upiIds.length > 0 && (
                        <Button onClick={() => setShowAddUpiForm(true)}>
                            <Plus className="h-4 w-4" />
                            Add UPI
                        </Button>
                    )}
                </div>

                {upiIds.length === 0 ? (
                    /* Empty state - shown when no UPI IDs */
                    <div className="rounded-[20px] border border-border bg-white overflow-hidden">
                        {showAddUpiForm ? (
                            <div className="px-6 py-4">
                                <div className="flex gap-3 items-center">
                                    <div className="flex-1">
                                        <Input
                                            placeholder="name@upi or 9876543210@paytm"
                                            value={newUpiId}
                                            onChange={(e) => setNewUpiId(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleAddUpi();
                                            }}
                                            autoFocus
                                        />
                                    </div>
                                    <Button
                                        size="md"
                                        variant="outline"
                                        onClick={() => {
                                            setShowAddUpiForm(false);
                                            setNewUpiId('');
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        size="md"
                                        onClick={handleAddUpi}
                                        disabled={savingUpi || !newUpiId.trim()}
                                    >
                                        {savingUpi ? 'Adding...' : 'Add'}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="px-6 py-8 text-center">
                                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                                    <Phone className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <p className="text-[14px] font-semibold leading-5 text-[#171717]">No UPI IDs saved</p>
                                <p className="text-[14px] font-normal leading-5 text-[#737373] mt-1">
                                    Add a UPI ID for instant payments when paying bills.
                                </p>
                                <Button onClick={() => setShowAddUpiForm(true)} className="mt-4">
                                    <Plus className="h-4 w-4" />
                                    Add UPI
                                </Button>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Saved UPI IDs */
                    <div className="rounded-[20px] border border-border bg-white overflow-hidden">
                        {/* Inline add form when showAddUpiForm is true */}
                        {showAddUpiForm && (
                            <div className="px-6 py-4 border-b border-border">
                                <div className="flex gap-3 items-center">
                                    <div className="flex-1">
                                        <Input
                                            placeholder="name@upi or 9876543210@paytm"
                                            value={newUpiId}
                                            onChange={(e) => setNewUpiId(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleAddUpi();
                                            }}
                                            autoFocus
                                        />
                                    </div>
                                    <Button
                                        size="md"
                                        variant="outline"
                                        onClick={() => {
                                            setShowAddUpiForm(false);
                                            setNewUpiId('');
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        size="md"
                                        onClick={() => {
                                            handleAddUpi();
                                            setShowAddUpiForm(false);
                                        }}
                                        disabled={savingUpi || !newUpiId.trim()}
                                    >
                                        {savingUpi ? 'Adding...' : 'Add'}
                                    </Button>
                                </div>
                            </div>
                        )}
                        {upiIds.map((upi, index) => (
                            <div
                                key={upi.id}
                                className={cn(
                                    "flex items-center justify-between px-6 py-4",
                                    index !== upiIds.length - 1 && "border-b border-border"
                                )}
                            >
                                <button
                                    onClick={() => handleSetDefaultUpi(upi)}
                                    className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity"
                                >
                                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                                        <Phone className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-[14px] font-semibold leading-5 text-[#171717]">{upi.upi_id}</p>
                                            {upi.is_default && (
                                                <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
                                                    <Check className="h-3 w-3 mr-1" /> Default
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-[14px] font-normal leading-5 text-[#737373]">
                                            UPI ID
                                        </p>
                                    </div>
                                </button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-muted-foreground hover:text-destructive"
                                    onClick={() => setDeleteUpi(upi)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Security Info */}
            <Alert variant="info" title="Secure payments">
                Your card details are encrypted and securely stored. We use industry-standard security protocols to protect your payment information.
            </Alert>

            {/* Add Card Sheet */}
            <Sheet open={showAddSheet} onOpenChange={setShowAddSheet}>
                <SheetContent className="sm:max-w-md">
                    <SheetHeader>
                        <SheetTitle>Add payment method</SheetTitle>
                        <SheetDescription>
                            Add a debit or credit card for faster checkout
                        </SheetDescription>
                    </SheetHeader>

                    <div className="py-6 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="cardNumber">Card number</Label>
                            <Input
                                id="cardNumber"
                                placeholder="1234 5678 9012 3456"
                                value={cardNumber}
                                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                                maxLength={19}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="cardExpiry">Expiry date</Label>
                                <Input
                                    id="cardExpiry"
                                    placeholder="MM/YY"
                                    value={cardExpiry}
                                    onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                                    maxLength={5}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cardCvv">CVV</Label>
                                <Input
                                    id="cardCvv"
                                    type="password"
                                    placeholder="•••"
                                    value={cardCvv}
                                    onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                                    maxLength={4}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="cardHolder">Name on card</Label>
                            <Input
                                id="cardHolder"
                                placeholder="John Doe"
                                value={cardHolder}
                                onChange={(e) => setCardHolder(e.target.value)}
                            />
                        </div>
                    </div>

                    <SheetFooter>
                        <Button
                            className="w-full"
                            onClick={handleAddCard}
                            disabled={saving}
                        >
                            {saving ? 'Adding...' : 'Add card'}
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            {/* Delete Card Confirmation Dialog */}
            <Dialog open={!!deleteMethod} onOpenChange={() => setDeleteMethod(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Remove card?</DialogTitle>
                        <DialogDescription>
                            This will remove {deleteMethod?.brand} •••• {deleteMethod?.last_four} from your saved cards.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteMethod(null)}
                            disabled={deleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={deleting}
                        >
                            {deleting ? 'Removing...' : 'Remove'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete UPI Confirmation Dialog */}
            <Dialog open={!!deleteUpi} onOpenChange={() => setDeleteUpi(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Remove UPI ID?</DialogTitle>
                        <DialogDescription>
                            This will remove {deleteUpi?.upi_id} from your saved UPI IDs.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteUpi(null)}
                            disabled={deletingUpi}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteUpi}
                            disabled={deletingUpi}
                        >
                            {deletingUpi ? 'Removing...' : 'Remove'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
