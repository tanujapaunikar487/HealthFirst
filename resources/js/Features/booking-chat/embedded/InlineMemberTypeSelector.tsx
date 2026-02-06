import React, { useState } from 'react';
import { User, Users, Loader2, CheckCircle2, AlertCircle } from '@/Lib/icons';
import { router } from '@inertiajs/react';
import { Alert } from '@/Components/ui/alert';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { PhoneInput } from '@/Components/ui/phone-input';
import { DatePicker } from '@/Components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { OtpInput } from '@/Components/OtpInput';
import { MemberSearchCard } from '@/Components/MemberSearchCard';
import { Card } from '@/Components/ui/card';
import { DetectionCard } from './DetectionCard';
import { TypeSelectorCard, MemberType } from './TypeSelectorCard';
import { Collapsible, CollapsibleContent } from '@/Components/ui/collapsible';
import { Alert } from '@/Components/ui/alert';
import { cn } from '@/Lib/utils';

type LinkSubStep = 'search' | 'contact_selection' | 'otp' | 'success';

interface MemberData {
    id: number;
    name: string;
    age?: number;
    gender?: string;
    patient_id?: string;
    masked_phone?: string | null;
    masked_email?: string | null;
    has_phone?: boolean;
    has_email?: boolean;
}

interface GuestFormData {
    name: string;
    phone: string;
    dob: string;
    age: string;
    gender: string;
}

interface NewMemberFormData {
    relation: string;
    name: string;
    phone: string;
    age: string;
    gender: string;
    email: string;
    dob: string;
    bloodGroup: string;
}

interface LinkExistingData {
    searchValue: string;
    foundMember: MemberData | null;
    alreadyLinked: boolean;
    relation: string;
    selectedContactMethod: 'phone' | 'email';
    otpValue: string;
    otpSentTo: string;
    verificationToken: string;
    subStep: LinkSubStep;
}

interface InlineSelectorState {
    expandedType: MemberType | null;
    guest: GuestFormData;
    newMember: NewMemberFormData;
    linkExisting: LinkExistingData;
    loading: boolean;
    loadingField: string | null;
    error: string;
    fieldErrors: Record<string, string>;
    showDetectionCard: boolean;
    detectedMember: MemberData | null;
    submitMode: 'create' | 'link';
}

interface Props {
    onComplete: (data: {
        member_type: 'guest' | 'family';
        member_id?: number;
        member_name: string;
        member_phone?: string;
        member_age?: number;
        member_gender?: string;
        relation?: string;
    }) => void;
    onCancel: () => void;
}

const initialState: InlineSelectorState = {
    expandedType: null,
    guest: { name: '', phone: '', dob: '', age: '', gender: '' },
    newMember: { relation: '', name: '', phone: '', age: '', gender: '', email: '', dob: '', bloodGroup: '' },
    linkExisting: {
        searchValue: '',
        foundMember: null,
        alreadyLinked: false,
        relation: '',
        selectedContactMethod: 'phone',
        otpValue: '',
        otpSentTo: '',
        verificationToken: '',
        subStep: 'search',
    },
    loading: false,
    loadingField: null,
    error: '',
    fieldErrors: {},
    showDetectionCard: false,
    detectedMember: null,
    submitMode: 'create',
};

export default function InlineMemberTypeSelector({ onComplete, onCancel }: Props) {
    const [state, setState] = useState<InlineSelectorState>(initialState);

    const setError = (error: string) => setState(prev => ({ ...prev, error }));
    const setLoading = (loading: boolean) => setState(prev => ({ ...prev, loading }));
    const clearFieldError = (field: string) => setState(prev => ({
        ...prev,
        fieldErrors: { ...prev.fieldErrors, [field]: '' }
    }));

    const toggleType = (type: MemberType) => {
        setState(prev => ({
            ...prev,
            expandedType: prev.expandedType === type ? null : type,
            error: '',
        }));
    };

    // Utility functions
    const detectSearchType = (value: string): 'phone' | 'email' | 'patient_id' => {
        const trimmed = value.trim();
        if (/^PT-/i.test(trimmed)) return 'patient_id';
        if (trimmed.includes('@')) return 'email';
        return 'phone';
    };

    const formatPhoneForSearch = (value: string): string => {
        const digits = value.replace(/\D/g, '');
        if (/^[6-9]\d{9}$/.test(digits)) return `+91${digits}`;
        if (/^91[6-9]\d{9}$/.test(digits)) return `+${digits}`;
        return value;
    };

    const getCsrfToken = () =>
        document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

    // ============ GUEST FORM HANDLERS ============
    const handleGuestSubmit = async () => {
        const { name, phone, dob, age, gender } = state.guest;

        if (!name.trim()) {
            setError('Please enter a name');
            return;
        }
        if (!phone.trim() || phone === '+91') {
            setError('Please enter a phone number');
            return;
        }
        if (!/^\+91[6-9]\d{9}$/.test(phone.trim())) {
            setError('Please enter a valid 10-digit phone number');
            return;
        }

        // Calculate age from DOB if provided
        let calculatedAge: number | undefined;
        if (dob) {
            const birthDate = new Date(dob);
            const today = new Date();
            calculatedAge = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                calculatedAge--;
            }
        } else if (age) {
            calculatedAge = parseInt(age, 10);
        }

        onComplete({
            member_type: 'guest',
            member_name: name,
            member_phone: phone,
            member_age: calculatedAge,
            member_gender: gender || undefined,
            relation: 'guest',
        });
    };

    // ============ NEW MEMBER FORM HANDLERS ============
    const handlePhoneBlur = async (phone: string) => {
        if (!phone || phone === '+91') {
            setState(prev => ({
                ...prev,
                fieldErrors: { ...prev.fieldErrors, memberPhone: 'Please enter a phone number' }
            }));
            return;
        }
        if (!/^\+91[6-9]\d{9}$/.test(phone)) {
            setState(prev => ({
                ...prev,
                fieldErrors: { ...prev.fieldErrors, memberPhone: 'Please enter a valid 10-digit phone number' }
            }));
            return;
        }

        setState(prev => ({
            ...prev,
            fieldErrors: { ...prev.fieldErrors, memberPhone: '' },
            loadingField: 'phone'
        }));

        try {
            const response = await fetch('/family-members/lookup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify({ search_type: 'phone', search_value: phone }),
            });
            const data = await response.json();

            if (data.found && !data.already_linked) {
                setState(prev => ({
                    ...prev,
                    detectedMember: data.member_data,
                    showDetectionCard: true,
                    submitMode: 'link',
                    loadingField: null,
                }));
            } else if (data.already_linked) {
                setState(prev => ({
                    ...prev,
                    fieldErrors: {
                        ...prev.fieldErrors,
                        memberPhone: 'This phone number is already registered to one of your family members.'
                    },
                    showDetectionCard: false,
                    submitMode: 'create',
                    loadingField: null,
                }));
            } else {
                setState(prev => ({
                    ...prev,
                    showDetectionCard: false,
                    submitMode: 'create',
                    loadingField: null
                }));
            }
        } catch {
            setState(prev => ({
                ...prev,
                showDetectionCard: false,
                submitMode: 'create',
                loadingField: null
            }));
        }
    };

    const handleAcceptDetectedMember = () => {
        if (!state.detectedMember) return;

        // Auto-suggest relationship based on age/gender
        const suggestRelationship = () => {
            if (state.newMember.relation) return state.newMember.relation;
            const age = state.detectedMember?.age;
            const gender = state.detectedMember?.gender;
            if (age && age >= 50) {
                return gender === 'female' ? 'mother' : gender === 'male' ? 'father' : '';
            } else if (age && age >= 20 && age < 50) {
                return gender === 'female' ? 'sister' : gender === 'male' ? 'brother' : '';
            }
            return '';
        };

        // Switch to link existing flow with pre-populated data
        setState(prev => ({
            ...prev,
            expandedType: 'link_existing',
            linkExisting: {
                ...prev.linkExisting,
                searchValue: prev.newMember.phone,
                foundMember: prev.detectedMember,
                alreadyLinked: false,
                relation: suggestRelationship(),
                selectedContactMethod: prev.detectedMember?.has_phone ? 'phone' : 'email',
                subStep: 'contact_selection',
            },
            showDetectionCard: false,
            detectedMember: null,
            submitMode: 'create',
        }));
    };

    const handleNewMemberSubmit = async () => {
        const { relation, name, phone, age, gender, email, dob, bloodGroup } = state.newMember;

        if (!relation) {
            setError('Please select a relationship');
            return;
        }
        if (!name.trim()) {
            setError('Please enter a name');
            return;
        }
        if (!phone.trim() || phone === '+91') {
            setError('Please enter a phone number');
            return;
        }
        if (!/^\+91[6-9]\d{9}$/.test(phone.trim())) {
            setError('Please enter a valid 10-digit phone number');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch('/family-members/create-new', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify({
                    name,
                    relation,
                    phone,
                    ...(age && { age: parseInt(age, 10) }),
                    ...(gender && { gender }),
                    ...(email && { email }),
                    ...(dob && { date_of_birth: dob }),
                    ...(bloodGroup && { blood_group: bloodGroup }),
                }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setLoading(false);
                onComplete({
                    member_type: 'family',
                    member_id: data.member_data.id,
                    member_name: data.member_data.name,
                    relation,
                });
            } else {
                if (data.should_link) {
                    setError(data.error || 'This phone number is already registered. Please use "Existing Patient" option instead.');
                } else if (data.already_linked) {
                    setError(data.error || 'This phone number is already registered to one of your family members.');
                } else {
                    setError(data.error || 'Failed to create family member. Please try again.');
                }
                setLoading(false);
            }
        } catch {
            setError('Failed to create family member. Please try again.');
            setLoading(false);
        }
    };

    // ============ LINK EXISTING HANDLERS ============
    const handleSearch = async () => {
        const searchValue = state.linkExisting.searchValue.trim();
        if (!searchValue) {
            setError('Please enter a value to search');
            return;
        }

        setLoading(true);
        setError('');

        const searchType = detectSearchType(searchValue);
        let formattedValue = searchValue;
        if (searchType === 'phone') {
            formattedValue = formatPhoneForSearch(searchValue);
        }

        try {
            const response = await fetch('/family-members/lookup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify({
                    search_type: searchType,
                    search_value: formattedValue,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                setError(errorData.message || `Search failed (${response.status}). Please refresh and try again.`);
                setLoading(false);
                return;
            }

            const data = await response.json();

            if (data.found) {
                if (data.already_linked) {
                    setState(prev => ({
                        ...prev,
                        linkExisting: {
                            ...prev.linkExisting,
                            foundMember: data.member_data,
                            alreadyLinked: true,
                        },
                        loading: false,
                    }));
                    setError('This member is already linked to your account');
                } else {
                    setState(prev => ({
                        ...prev,
                        linkExisting: {
                            ...prev.linkExisting,
                            foundMember: data.member_data,
                            alreadyLinked: false,
                            selectedContactMethod: data.member_data.has_phone ? 'phone' : 'email',
                            subStep: 'contact_selection',
                        },
                        loading: false,
                    }));
                }
            } else {
                setError('No member found with this information');
                setLoading(false);
            }
        } catch {
            setError('Search failed. Please try again.');
            setLoading(false);
        }
    };

    const handleSendOtp = async (methodOverride?: 'phone' | 'email') => {
        const foundMember = state.linkExisting.foundMember;
        if (!foundMember?.id) {
            setError('No patient selected');
            return;
        }

        const contactMethod = methodOverride || state.linkExisting.selectedContactMethod;
        const hasMethod = contactMethod === 'phone' ? foundMember.has_phone : foundMember.has_email;

        if (!hasMethod) {
            setError(`No ${contactMethod === 'phone' ? 'phone number' : 'email'} on record for this patient`);
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch('/family-members/send-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify({
                    member_id: foundMember.id,
                    contact_method: contactMethod,
                }),
            });

            if (!response.ok) {
                if (response.status === 419) {
                    setError('Session expired. Please refresh the page and try again.');
                    setLoading(false);
                    return;
                }
                if (response.status === 429) {
                    setError('Too many requests. Please wait a moment and try again.');
                    setLoading(false);
                    return;
                }
                const data = await response.json().catch(() => ({ error: 'Request failed. Please try again.' }));
                setError(data.error || 'Failed to send OTP');
                setLoading(false);
                return;
            }

            const data = await response.json();

            if (data.otp_sent) {
                setState(prev => ({
                    ...prev,
                    linkExisting: {
                        ...prev.linkExisting,
                        selectedContactMethod: contactMethod,
                        otpSentTo: data.sent_to || (contactMethod === 'phone' ? foundMember.masked_phone : foundMember.masked_email) || '',
                        subStep: 'otp',
                    },
                    loading: false,
                }));
            } else {
                setError(data.error || 'Failed to send OTP');
                setLoading(false);
            }
        } catch {
            setError('Failed to send OTP. Please try again.');
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (otp: string) => {
        const foundMember = state.linkExisting.foundMember;
        if (!foundMember?.id) {
            setError('No patient selected');
            return;
        }

        if (!otp || otp.length !== 6) {
            setError('Please enter a 6-digit OTP');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch('/family-members/verify-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify({
                    member_id: foundMember.id,
                    contact_method: state.linkExisting.selectedContactMethod,
                    otp,
                }),
            });

            const data = await response.json();

            if (response.ok && data.verified) {
                await handleLinkMember(data.verification_token);
            } else {
                setState(prev => ({
                    ...prev,
                    error: data.error || 'Invalid OTP. Please try again.',
                    linkExisting: { ...prev.linkExisting, otpValue: '' },
                    loading: false,
                }));
            }
        } catch {
            setState(prev => ({
                ...prev,
                error: 'Verification failed. Please try again.',
                linkExisting: { ...prev.linkExisting, otpValue: '' },
                loading: false,
            }));
        }
    };

    const handleLinkMember = async (token: string) => {
        const foundMember = state.linkExisting.foundMember;
        if (!foundMember) return;

        try {
            const response = await fetch('/family-members/link', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify({
                    family_member_id: foundMember.id,
                    relation_to_user: state.linkExisting.relation,
                    verification_token: token,
                }),
            });

            const data = await response.json();

            if (response.ok && data.linked) {
                setState(prev => ({
                    ...prev,
                    linkExisting: { ...prev.linkExisting, subStep: 'success' },
                    loading: false,
                }));

                // Auto-complete after brief success display
                setTimeout(() => {
                    onComplete({
                        member_type: 'family',
                        member_id: foundMember.id,
                        member_name: foundMember.name,
                        relation: state.linkExisting.relation,
                    });
                }, 1500);
            } else {
                setError(data.error || 'Failed to link member');
                setLoading(false);
            }
        } catch {
            setError('Failed to link member. Please try again.');
            setLoading(false);
        }
    };

    const handleAddAsNew = () => {
        // Switch to new member flow with search value as phone
        const searchValue = state.linkExisting.searchValue;
        const searchType = detectSearchType(searchValue);

        setState(prev => ({
            ...prev,
            expandedType: 'new_member',
            newMember: {
                ...prev.newMember,
                phone: searchType === 'phone' ? formatPhoneForSearch(searchValue) : '',
                email: searchType === 'email' ? searchValue : '',
            },
            linkExisting: { ...initialState.linkExisting },
            error: '',
        }));
    };

    // ============ RENDER HELPERS ============
    const renderError = () => state.error && (
        <Alert variant="error">{state.error}</Alert>
    );

    const renderGuestForm = () => (
        <div className="space-y-4 pt-4 pb-2">
            {renderError()}

            <div className="space-y-4">
                <div className="space-y-2">
                    <label htmlFor="guest_name" className="block text-label text-foreground">
                        Name <span className="text-destructive">*</span>
                    </label>
                    <Input
                        id="guest_name"
                        value={state.guest.name}
                        onChange={(e) => setState(prev => ({
                            ...prev,
                            guest: { ...prev.guest, name: e.target.value },
                            error: ''
                        }))}
                        placeholder="Enter guest name"
                        disabled={state.loading}
                    />
                </div>
                <div className="space-y-2">
                    <label htmlFor="guest_phone" className="block text-label text-foreground">
                        Phone Number <span className="text-destructive">*</span>
                    </label>
                    <PhoneInput
                        id="guest_phone"
                        value={state.guest.phone}
                        onChange={(value) => setState(prev => ({
                            ...prev,
                            guest: { ...prev.guest, phone: value },
                            error: ''
                        }))}
                        disabled={state.loading}
                    />
                </div>
            </div>

            <div className="space-y-4">
                <p className="text-body text-muted-foreground uppercase tracking-wide pt-2">Optional</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                        <label htmlFor="guest_dob" className="block text-label text-foreground">Date of Birth</label>
                        <DatePicker
                            id="guest_dob"
                            value={state.guest.dob}
                            onChange={(value) => setState(prev => ({
                                ...prev,
                                guest: { ...prev.guest, dob: value, age: '' }
                            }))}
                            max={new Date()}
                            disabled={state.loading}
                            placeholder="Select date"
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="guest_age" className="block text-label text-foreground">Age</label>
                        <Select
                            value={state.guest.age}
                            onValueChange={(value) => setState(prev => ({
                                ...prev,
                                guest: { ...prev.guest, age: value, dob: '' }
                            }))}
                            disabled={state.loading || !!state.guest.dob}
                        >
                            <SelectTrigger id="guest_age" className={state.guest.dob ? 'opacity-50 cursor-not-allowed' : ''}>
                                <SelectValue placeholder="Select age" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[200px]">
                                {Array.from({ length: 121 }, (_, i) => i).map((age) => (
                                    <SelectItem key={age} value={age.toString()}>
                                        {age} {age === 1 ? 'year' : 'years'}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="space-y-2">
                    <label htmlFor="guest_gender" className="block text-label text-foreground">Gender</label>
                    <Select
                        value={state.guest.gender}
                        onValueChange={(value) => setState(prev => ({
                            ...prev,
                            guest: { ...prev.guest, gender: value }
                        }))}
                        disabled={state.loading}
                    >
                        <SelectTrigger id="guest_gender">
                            <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Button
                onClick={handleGuestSubmit}
                className="w-full"
                disabled={state.loading || !state.guest.name.trim() || !state.guest.phone.trim() || state.guest.phone === '+91'}
            >
                {state.loading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding Guest...
                    </>
                ) : (
                    'Add Guest'
                )}
            </Button>
        </div>
    );

    const renderNewMemberForm = () => (
        <div className="space-y-4 pt-4 pb-2">
            {renderError()}

            <div className="space-y-4">
                <div className="space-y-2">
                    <label htmlFor="member_relation" className="block text-label text-foreground">
                        Relationship <span className="text-destructive">*</span>
                    </label>
                    <Select
                        value={state.newMember.relation}
                        onValueChange={(value) => setState(prev => ({
                            ...prev,
                            newMember: { ...prev.newMember, relation: value },
                            error: ''
                        }))}
                        disabled={state.loading}
                    >
                        <SelectTrigger id="member_relation">
                            <SelectValue placeholder="Select relationship" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="mother">Mother</SelectItem>
                            <SelectItem value="father">Father</SelectItem>
                            <SelectItem value="brother">Brother</SelectItem>
                            <SelectItem value="sister">Sister</SelectItem>
                            <SelectItem value="son">Son</SelectItem>
                            <SelectItem value="daughter">Daughter</SelectItem>
                            <SelectItem value="spouse">Spouse</SelectItem>
                            <SelectItem value="grandmother">Grandmother</SelectItem>
                            <SelectItem value="grandfather">Grandfather</SelectItem>
                            <SelectItem value="friend">Friend</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <label htmlFor="member_name" className="block text-label text-foreground">
                        Full Name <span className="text-destructive">*</span>
                    </label>
                    <Input
                        id="member_name"
                        value={state.newMember.name}
                        onChange={(e) => setState(prev => ({
                            ...prev,
                            newMember: { ...prev.newMember, name: e.target.value },
                            error: ''
                        }))}
                        placeholder="Enter full name"
                        disabled={state.loading}
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="member_phone" className="block text-label text-foreground">
                        Phone Number <span className="text-destructive">*</span>
                    </label>
                    <div className="relative">
                        <PhoneInput
                            id="member_phone"
                            value={state.newMember.phone}
                            onChange={(value) => {
                                setState(prev => ({
                                    ...prev,
                                    newMember: { ...prev.newMember, phone: value },
                                    error: '',
                                    showDetectionCard: false,
                                    detectedMember: null,
                                    submitMode: 'create',
                                }));
                                clearFieldError('memberPhone');
                            }}
                            onBlur={() => handlePhoneBlur(state.newMember.phone)}
                            disabled={state.loading || state.loadingField === 'phone'}
                        />
                        {state.loadingField === 'phone' && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            </div>
                        )}
                    </div>
                    {state.fieldErrors.memberPhone && (
                        <p className="text-body text-destructive">{state.fieldErrors.memberPhone}</p>
                    )}
                    <p className="text-body text-muted-foreground">We'll check if this person has a patient record</p>
                </div>

                {state.showDetectionCard && state.detectedMember && (
                    <DetectionCard
                        member={state.detectedMember}
                        onAccept={handleAcceptDetectedMember}
                        disabled={state.loading}
                    />
                )}
            </div>

            <div className="space-y-4">
                <p className="text-body text-muted-foreground uppercase tracking-wide pt-2">Optional</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                        <label htmlFor="member_dob" className="block text-label text-foreground">Date of Birth</label>
                        <DatePicker
                            id="member_dob"
                            value={state.newMember.dob}
                            onChange={(value) => setState(prev => ({
                                ...prev,
                                newMember: { ...prev.newMember, dob: value, age: '' }
                            }))}
                            max={new Date()}
                            disabled={state.loading}
                            placeholder="Select date"
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="member_age" className="block text-label text-foreground">Age</label>
                        <Select
                            value={state.newMember.age}
                            onValueChange={(value) => setState(prev => ({
                                ...prev,
                                newMember: { ...prev.newMember, age: value, dob: '' }
                            }))}
                            disabled={state.loading || !!state.newMember.dob}
                        >
                            <SelectTrigger id="member_age" className={state.newMember.dob ? 'opacity-50 cursor-not-allowed' : ''}>
                                <SelectValue placeholder="Select age" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[200px]">
                                {Array.from({ length: 121 }, (_, i) => i).map((age) => (
                                    <SelectItem key={age} value={age.toString()}>
                                        {age} {age === 1 ? 'year' : 'years'}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="space-y-2">
                    <label htmlFor="member_gender" className="block text-label text-foreground">Gender</label>
                    <Select
                        value={state.newMember.gender}
                        onValueChange={(value) => setState(prev => ({
                            ...prev,
                            newMember: { ...prev.newMember, gender: value }
                        }))}
                        disabled={state.loading}
                    >
                        <SelectTrigger id="member_gender">
                            <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <label htmlFor="member_email" className="block text-label text-foreground">Email</label>
                    <Input
                        id="member_email"
                        type="email"
                        value={state.newMember.email}
                        onChange={(e) => setState(prev => ({
                            ...prev,
                            newMember: { ...prev.newMember, email: e.target.value }
                        }))}
                        placeholder="Enter email"
                        disabled={state.loading}
                    />
                </div>
                <div className="space-y-2">
                    <label htmlFor="member_blood_group" className="block text-label text-foreground">Blood Group</label>
                    <Select
                        value={state.newMember.bloodGroup}
                        onValueChange={(value) => setState(prev => ({
                            ...prev,
                            newMember: { ...prev.newMember, bloodGroup: value }
                        }))}
                        disabled={state.loading}
                    >
                        <SelectTrigger id="member_blood_group">
                            <SelectValue placeholder="Select blood group" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="A+">A+</SelectItem>
                            <SelectItem value="A-">A-</SelectItem>
                            <SelectItem value="B+">B+</SelectItem>
                            <SelectItem value="B-">B-</SelectItem>
                            <SelectItem value="AB+">AB+</SelectItem>
                            <SelectItem value="AB-">AB-</SelectItem>
                            <SelectItem value="O+">O+</SelectItem>
                            <SelectItem value="O-">O-</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Button
                onClick={state.submitMode === 'link' ? handleAcceptDetectedMember : handleNewMemberSubmit}
                className="w-full"
                disabled={state.loading || !state.newMember.relation || !state.newMember.name.trim() || !state.newMember.phone.trim() || state.newMember.phone === '+91'}
            >
                {state.loading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {state.submitMode === 'link' ? 'Verifying...' : 'Adding Member...'}
                    </>
                ) : (
                    state.submitMode === 'link' ? 'Verify & Link' : 'Add Member'
                )}
            </Button>
        </div>
    );

    const renderLinkExistingForm = () => {
        const { subStep, foundMember, alreadyLinked, searchValue, relation, selectedContactMethod, otpValue, otpSentTo } = state.linkExisting;

        if (subStep === 'success') {
            return (
                <div className="space-y-4 text-center py-8">
                    <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
                        <CheckCircle2 className="h-8 w-8 text-success" />
                    </div>
                    <h3 className="text-lg font-semibold">Successfully Linked!</h3>
                    <p className="text-body text-muted-foreground">
                        {foundMember?.name} has been added to your family members
                    </p>
                </div>
            );
        }

        if (subStep === 'otp') {
            return (
                <div className="space-y-4 pt-4 pb-2">
                    {renderError()}

                    {otpSentTo && (
                        <Alert variant="info" hideIcon>OTP sent to <strong>{otpSentTo}</strong></Alert>
                    )}

                    <OtpInput
                        value={otpValue}
                        onChange={(value) => setState(prev => ({
                            ...prev,
                            linkExisting: { ...prev.linkExisting, otpValue: value },
                            error: ''
                        }))}
                        onComplete={handleVerifyOtp}
                        onResend={handleSendOtp}
                        error={state.error}
                    />

                    {state.loading && (
                        <div className="flex items-center justify-center gap-2 text-body text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Verifying...
                        </div>
                    )}

                    {foundMember?.has_phone && foundMember?.has_email && (
                        <Button
                            variant="link"
                            size="sm"
                            onClick={() => {
                                const newMethod: 'phone' | 'email' = selectedContactMethod === 'phone' ? 'email' : 'phone';
                                setState(prev => ({
                                    ...prev,
                                    linkExisting: { ...prev.linkExisting, otpValue: '' },
                                    error: '',
                                }));
                                handleSendOtp(newMethod);
                            }}
                            className="h-auto p-0 w-full"
                            disabled={state.loading}
                        >
                            Try {selectedContactMethod === 'phone' ? 'Email' : 'Phone'} Instead →
                        </Button>
                    )}
                </div>
            );
        }

        if (subStep === 'contact_selection' && foundMember) {
            return (
                <div className="space-y-4 pt-4 pb-2">
                    {renderError()}

                    <div className="rounded-xl border border-border bg-muted/30 p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h4 className="font-semibold">{foundMember.name}</h4>
                                {foundMember.patient_id && (
                                    <p className="text-body text-muted-foreground">Patient ID: {foundMember.patient_id}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="link_relation" className="block text-label text-foreground">
                            Relationship to you <span className="text-destructive">*</span>
                        </label>
                        <Select
                            value={relation}
                            onValueChange={(value) => setState(prev => ({
                                ...prev,
                                linkExisting: { ...prev.linkExisting, relation: value },
                                error: ''
                            }))}
                            disabled={state.loading}
                        >
                            <SelectTrigger id="link_relation">
                                <SelectValue placeholder="Select relationship" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="mother">Mother</SelectItem>
                                <SelectItem value="father">Father</SelectItem>
                                <SelectItem value="brother">Brother</SelectItem>
                                <SelectItem value="sister">Sister</SelectItem>
                                <SelectItem value="son">Son</SelectItem>
                                <SelectItem value="daughter">Daughter</SelectItem>
                                <SelectItem value="spouse">Spouse</SelectItem>
                                <SelectItem value="grandmother">Grandmother</SelectItem>
                                <SelectItem value="grandfather">Grandfather</SelectItem>
                                <SelectItem value="friend">Friend</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-label text-foreground">
                            Send OTP to <span className="text-destructive">*</span>
                        </label>
                        <div className="space-y-2">
                            {foundMember.has_phone && (
                                <label className={cn(
                                    'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                                    selectedContactMethod === 'phone' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                                )}>
                                    <input
                                        type="radio"
                                        name="contact_method"
                                        value="phone"
                                        checked={selectedContactMethod === 'phone'}
                                        onChange={() => setState(prev => ({
                                            ...prev,
                                            linkExisting: { ...prev.linkExisting, selectedContactMethod: 'phone' }
                                        }))}
                                        className="sr-only"
                                    />
                                    <div className={cn(
                                        'h-4 w-4 rounded-full border flex items-center justify-center',
                                        selectedContactMethod === 'phone' ? 'border-primary' : 'border-muted-foreground'
                                    )}>
                                        {selectedContactMethod === 'phone' && (
                                            <div className="h-2 w-2 rounded-full bg-primary" />
                                        )}
                                    </div>
                                    <span className="text-body">Phone: {foundMember.masked_phone}</span>
                                </label>
                            )}
                            {foundMember.has_email && (
                                <label className={cn(
                                    'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                                    selectedContactMethod === 'email' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                                )}>
                                    <input
                                        type="radio"
                                        name="contact_method"
                                        value="email"
                                        checked={selectedContactMethod === 'email'}
                                        onChange={() => setState(prev => ({
                                            ...prev,
                                            linkExisting: { ...prev.linkExisting, selectedContactMethod: 'email' }
                                        }))}
                                        className="sr-only"
                                    />
                                    <div className={cn(
                                        'h-4 w-4 rounded-full border flex items-center justify-center',
                                        selectedContactMethod === 'email' ? 'border-primary' : 'border-muted-foreground'
                                    )}>
                                        {selectedContactMethod === 'email' && (
                                            <div className="h-2 w-2 rounded-full bg-primary" />
                                        )}
                                    </div>
                                    <span className="text-body">Email: {foundMember.masked_email}</span>
                                </label>
                            )}
                        </div>
                    </div>

                    <Button
                        onClick={() => handleSendOtp()}
                        className="w-full"
                        disabled={state.loading || !relation}
                    >
                        {state.loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Sending OTP...
                            </>
                        ) : (
                            'Send OTP'
                        )}
                    </Button>
                </div>
            );
        }

        // Search step
        return (
            <div className="space-y-4 pt-4 pb-2">
                {renderError()}

                <div className="space-y-2">
                    <label htmlFor="search_value" className="block text-label text-foreground">
                        Search by phone, email, or patient ID
                    </label>
                    <Input
                        id="search_value"
                        value={searchValue}
                        onChange={(e) => setState(prev => ({
                            ...prev,
                            linkExisting: {
                                ...prev.linkExisting,
                                searchValue: e.target.value,
                                foundMember: null,
                                alreadyLinked: false,
                            },
                            error: ''
                        }))}
                        placeholder="e.g., 9876543210, email@example.com, or PT-000001"
                        disabled={state.loading}
                    />
                    {searchValue.trim() && (
                        <p className="text-body text-muted-foreground">
                            Detected: {detectSearchType(searchValue) === 'phone' ? 'Phone Number' : detectSearchType(searchValue) === 'email' ? 'Email' : 'Patient ID'}
                        </p>
                    )}
                </div>

                {foundMember && alreadyLinked && (
                    <MemberSearchCard member={foundMember} alreadyLinked={true} />
                )}

                <div className="space-y-2">
                    <Button
                        onClick={handleSearch}
                        className="w-full"
                        disabled={state.loading || !searchValue.trim()}
                    >
                        {state.loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Searching...
                            </>
                        ) : (
                            'Search'
                        )}
                    </Button>

                    {state.error.includes('No member found') && (
                        <Button variant="secondary" onClick={handleAddAsNew} className="w-full">
                            Add as New Member
                        </Button>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-3">
            <Card className="overflow-hidden">
                {/* New Member */}
                <div style={state.expandedType !== 'new_member' ? undefined : { borderBottom: '1px solid hsl(var(--border))' }}>
                    <TypeSelectorCard
                        type="new_member"
                        isExpanded={state.expandedType === 'new_member'}
                        onClick={() => toggleType('new_member')}
                        disabled={state.loading}
                    />
                    <Collapsible open={state.expandedType === 'new_member'}>
                        <CollapsibleContent className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2">
                            <div className="px-4 pb-4">
                                {renderNewMemberForm()}
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                </div>

                {/* Existing Patient */}
                <div style={state.expandedType !== 'link_existing' ? undefined : { borderBottom: '1px solid hsl(var(--border))' }}>
                    <TypeSelectorCard
                        type="link_existing"
                        isExpanded={state.expandedType === 'link_existing'}
                        onClick={() => toggleType('link_existing')}
                        disabled={state.loading}
                    />
                    <Collapsible open={state.expandedType === 'link_existing'}>
                        <CollapsibleContent className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2">
                            <div className="px-4 pb-4">
                                {renderLinkExistingForm()}
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                </div>

                {/* Guest */}
                <div>
                    <TypeSelectorCard
                        type="guest"
                        isExpanded={state.expandedType === 'guest'}
                        onClick={() => toggleType('guest')}
                        disabled={state.loading}
                        isLast
                    />
                    <Collapsible open={state.expandedType === 'guest'}>
                        <CollapsibleContent className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2">
                            <div className="px-4 pb-4">
                                {renderGuestForm()}
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                </div>
            </Card>

            {/* Cancel button */}
            <Button
                variant="ghost"
                onClick={onCancel}
                className="w-full text-muted-foreground"
                disabled={state.loading}
            >
                Cancel
            </Button>
        </div>
    );
}
