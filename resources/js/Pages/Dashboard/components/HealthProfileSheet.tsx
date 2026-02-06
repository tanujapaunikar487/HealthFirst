import { useState } from 'react';
import { router } from '@inertiajs/react';
import { SheetHeader, SheetTitle, SheetBody, SheetFooter } from '@/Components/ui/sheet';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Badge } from '@/Components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { DatePicker } from '@/Components/ui/date-picker';
import { X } from '@/Lib/icons';
import { toast } from 'sonner';

interface SelfMember {
    id: number;
    date_of_birth: string | null;
    blood_group: string | null;
    medical_conditions: string[];
    allergies: string[];
}

interface HealthProfileSheetProps {
    selfMember: SelfMember | null;
    onSuccess: () => void;
}

const bloodGroupOptions = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

function TagInput({
    value,
    onChange,
    placeholder,
    variant = 'neutral',
}: {
    value: string[];
    onChange: (tags: string[]) => void;
    placeholder: string;
    variant?: 'neutral' | 'danger';
}) {
    const [inputValue, setInputValue] = useState('');

    function addTag() {
        const newTags = inputValue
            .split(',')
            .map(t => t.trim())
            .filter(t => t && !value.includes(t));

        if (newTags.length > 0) {
            onChange([...value, ...newTags]);
        }
        setInputValue('');
    }

    function removeTag(index: number) {
        onChange(value.filter((_, i) => i !== index));
    }

    return (
        <div>
            <Input
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                    }
                }}
                placeholder={placeholder}
            />
            {value.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                    {value.map((tag, i) => (
                        <Badge key={i} variant={variant} className="gap-1 pr-1">
                            {tag}
                            <button
                                type="button"
                                onClick={() => removeTag(i)}
                                className="ml-0.5 rounded-full p-0.5 hover:bg-black/10"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}
                </div>
            )}
        </div>
    );
}

export function HealthProfileSheet({ selfMember, onSuccess }: HealthProfileSheetProps) {
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        date_of_birth: selfMember?.date_of_birth || '',
        blood_group: selfMember?.blood_group || '',
        medical_conditions: selfMember?.medical_conditions || [],
        allergies: selfMember?.allergies || [],
    });

    const canSave = formData.date_of_birth && formData.blood_group;

    function handleSave() {
        if (!canSave) return;
        setSaving(true);

        router.put('/dashboard/health-profile', {
            date_of_birth: formData.date_of_birth,
            blood_group: formData.blood_group,
            medical_conditions: formData.medical_conditions.length > 0 ? formData.medical_conditions : null,
            allergies: formData.allergies.length > 0 ? formData.allergies : null,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Health profile updated');
                onSuccess();
            },
            onError: (errors) => {
                const firstError = Object.values(errors)[0];
                toast.error(typeof firstError === 'string' ? firstError : 'Failed to save');
            },
            onFinish: () => setSaving(false),
        });
    }

    return (
        <>
            <SheetHeader>
                <SheetTitle>Complete your health profile</SheetTitle>
            </SheetHeader>

            <SheetBody>
                <div>
                    <p className="mb-3 text-[14px] font-medium text-muted-foreground">Health information</p>
                    <div className="space-y-4">
                        <div>
                            <label className="mb-1.5 block text-[14px] font-medium text-muted-foreground">
                                Date of birth <span className="text-destructive">*</span>
                            </label>
                            <DatePicker
                                value={formData.date_of_birth}
                                onChange={(value) => setFormData({ ...formData, date_of_birth: value })}
                                max={new Date()}
                                placeholder="Select date of birth"
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-[14px] font-medium text-muted-foreground">
                                Blood group <span className="text-destructive">*</span>
                            </label>
                            <Select
                                value={formData.blood_group}
                                onValueChange={val => setFormData({ ...formData, blood_group: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select blood group" />
                                </SelectTrigger>
                                <SelectContent>
                                    {bloodGroupOptions.map(bg => (
                                        <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="mb-1.5 block text-[14px] font-medium text-muted-foreground">Medical conditions</label>
                            <TagInput
                                value={formData.medical_conditions}
                                onChange={tags => setFormData({ ...formData, medical_conditions: tags })}
                                placeholder="Add condition"
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-[14px] font-medium text-muted-foreground">Allergies</label>
                            <TagInput
                                value={formData.allergies}
                                onChange={tags => setFormData({ ...formData, allergies: tags })}
                                placeholder="Add allergy"
                                variant="danger"
                            />
                        </div>
                    </div>
                </div>
            </SheetBody>

            <SheetFooter>
                <Button
                    className="flex-1"
                    size="lg"
                    onClick={handleSave}
                    disabled={!canSave || saving}
                >
                    {saving ? 'Saving...' : 'Save'}
                </Button>
            </SheetFooter>
        </>
    );
}
