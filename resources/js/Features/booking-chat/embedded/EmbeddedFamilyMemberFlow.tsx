import React, { useState } from 'react';
import { User, Users, ChevronLeft, Loader2, CheckCircle2, AlertCircle } from '@/Lib/icons';
import { router } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { PhoneInput } from '@/Components/ui/phone-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { RelationshipSelector } from '@/Components/RelationshipSelector';
import { OtpInput } from '@/Components/OtpInput';
import { MemberSearchCard } from '@/Components/MemberSearchCard';
import { SheetHeader, SheetTitle, SheetDescription } from '@/Components/ui/sheet';
import { cn } from '@/Lib/utils';

type Step =
    | 'choice'
    // Guest progressive steps
    | 'guest_name'
    | 'guest_phone'
    | 'guest_dob_age'
    | 'guest_gender'
    // New family progressive steps
    | 'relationship'
    | 'member_name'
    | 'member_phone'
    | 'member_dob_age'
    | 'member_gender'
    | 'member_optional'
    // Link existing steps (keep as is)
    | 'lookup_method'
    | 'search'
    | 'otp'
    | 'success';

interface MemberData {
    id: number;
    name: string;
    age?: number;
    gender?: string;
    patient_id?: string;
    phone?: string;
    verified_phone?: string;
}

interface FlowState {
    step: Step;
    flowType: 'guest' | 'add_new_family' | 'link_existing' | null;

    // Guest fields
    guestName: string;
    guestPhone: string;
    guestDOB: string;
    guestAge: string;
    guestGender: string;

    // Family member common
    relation: string;

    // New member fields (no existing record)
    newMemberName: string;
    newMemberPhone: string;
    newMemberAge: string;
    newMemberGender: string;
    newMemberEmail: string;
    newMemberDOB: string;
    newMemberBloodGroup: string;

    // Search/link fields
    lookupMethod: 'phone' | 'patient_id' | null;
    searchValue: string;
    email: string;
    emailInputMode: boolean;
    contactType: 'phone' | 'email';
    foundMember: MemberData | null;
    alreadyLinked: boolean;

    // OTP fields
    otpValue: string;
    verificationToken: string;

    // UI state
    error: string;
    loading: boolean;
    attemptsRemaining: number | null;
    lockedOut: boolean;
}

interface Props {
    mode?: 'embedded' | 'standalone';
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

export default function EmbeddedFamilyMemberFlow({ mode = 'embedded', onComplete, onCancel }: Props) {
    const [state, setState] = useState<FlowState>({
        step: 'choice',
        flowType: null,

        // Guest fields
        guestName: '',
        guestPhone: '',
        guestDOB: '',
        guestAge: '',
        guestGender: '',

        // Family member common
        relation: '',

        // New member fields
        newMemberName: '',
        newMemberPhone: '',
        newMemberAge: '',
        newMemberGender: '',
        newMemberEmail: '',
        newMemberDOB: '',
        newMemberBloodGroup: '',

        // Search/link fields
        lookupMethod: null,
        searchValue: '',
        email: '',
        emailInputMode: false,
        contactType: 'phone',
        foundMember: null,
        alreadyLinked: false,

        // OTP fields
        otpValue: '',
        verificationToken: '',

        // UI state
        error: '',
        loading: false,
        attemptsRemaining: null,
        lockedOut: false,
    });

    const setStep = (step: Step) => {
        setState((prev) => ({ ...prev, step, error: '' }));
    };

    const setError = (error: string) => {
        setState((prev) => ({ ...prev, error, loading: false }));
    };

    const setLoading = (loading: boolean) => {
        setState((prev) => ({ ...prev, loading }));
    };

    // Step 1: Initial Choice (3 options)
    const handleInitialChoice = (choice: 'guest' | 'add_new_family' | 'link_existing') => {
        setState((prev) => ({ ...prev, flowType: choice }));
        if (choice === 'guest') {
            setStep('guest_name');
        } else if (choice === 'add_new_family') {
            setStep('relationship');
        } else {
            // link_existing goes to lookup_method
            setStep('lookup_method');
        }
    };

    // Step 2: Guest Information Input
    const handleGuestSubmit = async () => {
        if (!state.guestName.trim()) {
            setError('Please enter a name');
            return;
        }
        if (!state.guestPhone.trim() || state.guestPhone === '+91') {
            setError('Please enter a phone number');
            return;
        }
        if (!/^\+91[6-9]\d{9}$/.test(state.guestPhone.trim())) {
            setError('Please enter a valid 10-digit phone number');
            return;
        }
        if (!state.guestAge && !state.guestDOB) {
            setError('Please enter date of birth or age');
            return;
        }
        if (!state.guestGender) {
            setError('Please select gender');
            return;
        }

        if (mode === 'standalone') {
            // In standalone mode, create the guest via form submission and reload
            setLoading(true);
            try {
                router.post('/family-members', {
                    name: state.guestName,
                    relation: 'guest',
                    phone: state.guestPhone,
                    ...(state.guestDOB ? { date_of_birth: state.guestDOB } : { age: parseInt(state.guestAge, 10) }),
                    gender: state.guestGender,
                }, {
                    preserveScroll: true,
                    onSuccess: () => {
                        router.reload({ only: ['members'] });
                        onCancel(); // Close the sheet
                    },
                    onError: () => {
                        setError('Failed to add guest. Please try again.');
                        setLoading(false);
                    },
                });
            } catch (error) {
                setError('Failed to add guest. Please try again.');
                setLoading(false);
            }
        } else {
            // In embedded mode, call the callback
            // Calculate age from DOB if provided, otherwise use age
            let age: number;
            if (state.guestDOB) {
                const birthDate = new Date(state.guestDOB);
                const today = new Date();
                age = today.getFullYear() - birthDate.getFullYear();
                const monthDiff = today.getMonth() - birthDate.getMonth();
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                }
            } else {
                age = parseInt(state.guestAge, 10);
            }

            onComplete({
                member_type: 'guest',
                member_name: state.guestName,
                member_phone: state.guestPhone,
                member_age: age,
                member_gender: state.guestGender,
            });
            setLoading(false);
        }
    };

    // Step 3: Relationship Selection
    const handleRelationshipNext = () => {
        if (!state.relation) {
            setError('Please select a relationship');
            return;
        }
        // Check flowType to determine next step
        if (state.flowType === 'add_new_family') {
            setStep('member_name');
        } else if (state.flowType === 'link_existing') {
            setStep('lookup_method');
        }
    };

    // Progressive Guest Flow Handlers
    const handleGuestNameNext = () => {
        if (!state.guestName.trim()) {
            setError('Please enter a name');
            return;
        }
        setStep('guest_phone');
    };

    const handleGuestPhoneNext = () => {
        if (!state.guestPhone.trim() || state.guestPhone === '+91') {
            setError('Please enter a phone number');
            return;
        }
        if (!/^\+91[6-9]\d{9}$/.test(state.guestPhone.trim())) {
            setError('Please enter a valid 10-digit phone number');
            return;
        }
        setStep('guest_dob_age');
    };

    const handleGuestDobAgeNext = () => {
        if (!state.guestAge && !state.guestDOB) {
            setError('Please enter date of birth or age');
            return;
        }
        setStep('guest_gender');
    };

    // Progressive New Member Flow Handlers
    const handleMemberNameNext = () => {
        if (!state.newMemberName.trim()) {
            setError('Please enter a name');
            return;
        }
        setStep('member_phone');
    };

    const handleMemberPhoneNext = () => {
        if (!state.newMemberPhone.trim() || state.newMemberPhone === '+91') {
            setError('Please enter a phone number');
            return;
        }
        if (!/^\+91[6-9]\d{9}$/.test(state.newMemberPhone.trim())) {
            setError('Please enter a valid 10-digit phone number');
            return;
        }
        setStep('member_dob_age');
    };

    const handleMemberDobAgeNext = () => {
        if (!state.newMemberAge && !state.newMemberDOB) {
            setError('Please enter date of birth or age');
            return;
        }
        setStep('member_gender');
    };

    const handleMemberGenderNext = () => {
        if (!state.newMemberGender) {
            setError('Please select gender');
            return;
        }
        setStep('member_optional');
    };

    // Step 4: New Member Form Submission
    const handleNewMemberSubmit = async () => {
        // Validation
        if (!state.newMemberName.trim()) {
            setError('Please enter a name');
            return;
        }
        if (!state.newMemberPhone.trim() || state.newMemberPhone === '+91') {
            setError('Please enter a phone number');
            return;
        }
        if (!/^\+91[6-9]\d{9}$/.test(state.newMemberPhone.trim())) {
            setError('Please enter a valid 10-digit phone number');
            return;
        }
        if (!state.newMemberAge) {
            setError('Please select age');
            return;
        }
        if (!state.newMemberGender) {
            setError('Please select gender');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch('/family-members/create-new', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    name: state.newMemberName,
                    relation: state.relation,
                    phone: state.newMemberPhone,
                    age: parseInt(state.newMemberAge, 10),
                    gender: state.newMemberGender,
                    email: state.newMemberEmail || null,
                    date_of_birth: state.newMemberDOB || null,
                    blood_group: state.newMemberBloodGroup || null,
                }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setState((prev) => ({ ...prev, loading: false }));

                if (mode === 'standalone') {
                    router.reload({ only: ['members'] });
                    onCancel(); // Close the sheet
                } else {
                    onComplete({
                        member_type: 'family',
                        member_id: data.member_data.id,
                        member_name: data.member_data.name,
                        relation: state.relation,
                    });
                }
            } else {
                // Handle specific error cases
                if (data.should_link) {
                    // Phone exists - suggest linking instead
                    setError(
                        data.error ||
                        'This phone number is already registered. Please use "Link Existing Patient" option instead.'
                    );
                } else if (data.already_linked) {
                    // Already linked to this user
                    setError(data.error || 'This phone number is already registered to one of your family members.');
                } else {
                    // Generic error
                    setError(data.error || 'Failed to create family member. Please try again.');
                }
                setLoading(false);
            }
        } catch (error) {
            console.error('Error creating family member:', error);
            setError('Failed to create family member. Please try again.');
            setLoading(false);
        }
    };

    // Step 4: Lookup Method Selection
    const handleLookupMethodChoice = (method: 'phone' | 'patient_id') => {
        setState((prev) => ({ ...prev, lookupMethod: method }));
        setStep('search');
    };

    // Step 5: Search for Member
    const handleSearch = async () => {
        if (!state.searchValue.trim()) {
            setError('Please enter a value to search');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch('/family-members/lookup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    search_type: state.lookupMethod,
                    search_value: state.searchValue,
                }),
            });

            const data = await response.json();

            if (data.found) {
                setState((prev) => ({
                    ...prev,
                    foundMember: data.member_data,
                    alreadyLinked: data.already_linked,
                    loading: false,
                }));

                if (data.already_linked) {
                    setError('This member is already linked to your account');
                }
            } else {
                setState((prev) => ({ ...prev, foundMember: null, loading: false }));
                setError('No member found with this ' + (state.lookupMethod === 'phone' ? 'phone number' : 'Patient ID'));
            }
        } catch (error) {
            setError('Failed to search. Please try again.');
            setLoading(false);
        }
    };

    // Send OTP (phone or email)
    const handleSendOtp = async () => {
        const contactValue = state.emailInputMode ? state.email : state.foundMember?.phone;
        const contactType = state.emailInputMode ? 'email' : 'phone';

        if (!contactValue) {
            setError((contactType === 'email' ? 'Email' : 'Phone number') + ' not available');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch('/family-members/send-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    contact_type: contactType,
                    contact_value: contactValue,
                    purpose: 'link_member',
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setState((prev) => ({
                    ...prev,
                    contactType,
                    loading: false,
                    attemptsRemaining: data.attempts_remaining,
                    lockedOut: false,
                }));
                setStep('otp');
            } else {
                if (data.locked_out) {
                    setState((prev) => ({
                        ...prev,
                        lockedOut: true,
                        attemptsRemaining: 0,
                        loading: false,
                    }));
                }
                setError(data.error || 'Failed to send OTP. Please try again.');
                setLoading(false);
            }
        } catch (error) {
            setError('Failed to send OTP. Please try again.');
            setLoading(false);
        }
    };

    // Verify OTP (phone or email)
    const handleVerifyOtp = async (otp: string) => {
        const contactValue = state.emailInputMode ? state.email : state.foundMember?.phone;

        if (!contactValue) return;

        setLoading(true);
        setError('');

        try {
            const response = await fetch('/family-members/verify-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    contact_type: state.contactType,
                    contact_value: contactValue,
                    otp: otp,
                }),
            });

            const data = await response.json();

            if (data.verified) {
                // Now link the member
                await handleLinkMember(data.verification_token);
            } else {
                setError(data.error || 'Invalid OTP. Please try again.');
                setLoading(false);
            }
        } catch (error) {
            setError('Failed to verify OTP. Please try again.');
            setLoading(false);
        }
    };

    // Link Member
    const handleLinkMember = async (token: string) => {
        if (!state.foundMember) return;

        try {
            const response = await fetch('/family-members/link', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    family_member_id: state.foundMember.id,
                    relation_to_user: state.relation,
                    verification_token: token,
                }),
            });

            const data = await response.json();

            if (data.linked) {
                setState((prev) => ({ ...prev, loading: false }));
                setStep('success');

                // Complete after showing success message
                setTimeout(() => {
                    if (mode === 'standalone') {
                        router.reload({ only: ['members'] });
                        onCancel(); // Close the sheet
                    } else {
                        onComplete({
                            member_type: 'family',
                            member_id: data.member_data.id,
                            member_name: data.member_data.name,
                            relation: data.member_data.relation,
                        });
                    }
                }, 1500);
            } else {
                setError(data.error || 'Failed to link member. Please try again.');
                setLoading(false);
            }
        } catch (error) {
            setError('Failed to link member. Please try again.');
            setLoading(false);
        }
    };

    // Add as new member (not found in search)
    const handleAddAsNew = () => {
        // Transition to new member form
        // Pre-fill phone if it was a phone search
        if (state.lookupMethod === 'phone') {
            setState((prev) => ({
                ...prev,
                newMemberPhone: state.searchValue,
            }));
        }
        setStep('new_member_form');
        setError('');
    };

    // Back navigation
    const handleBack = () => {
        const backMap: Record<Step, Step> = {
            choice: 'choice',
            // Guest flow
            guest_name: 'choice',
            guest_phone: 'guest_name',
            guest_dob_age: 'guest_phone',
            guest_gender: 'guest_dob_age',
            // New family flow
            relationship: 'choice',
            member_name: 'relationship',
            member_phone: 'member_name',
            member_dob_age: 'member_phone',
            member_gender: 'member_dob_age',
            member_optional: 'member_gender',
            // Link existing flow
            lookup_method: 'relationship',
            search: 'lookup_method',
            otp: 'search',
            success: 'success',
        };
        setStep(backMap[state.step]);
    };

    const canGoBack = !['choice', 'success'].includes(state.step) && !state.loading;

    const getStepInfo = (): { title: string; description: string } => {
        switch (state.step) {
            case 'choice':
                return { title: 'Add New Person', description: 'Choose how you\'d like to add this person' };
            // Guest flow
            case 'guest_name':
                return { title: 'Guest Information', description: 'Enter the guest\'s name' };
            case 'guest_phone':
                return { title: 'Guest Information', description: 'Enter the guest\'s phone number' };
            case 'guest_dob_age':
                return { title: 'Guest Information', description: 'Enter the guest\'s date of birth or age' };
            case 'guest_gender':
                return { title: 'Guest Information', description: 'Select the guest\'s gender' };
            // New family flow
            case 'relationship':
                return { title: 'Select Relationship', description: 'What is this person\'s relationship to you?' };
            case 'member_name':
                return { title: 'New Family Member', description: 'Enter the member\'s name' };
            case 'member_phone':
                return { title: 'New Family Member', description: 'Enter the member\'s phone number' };
            case 'member_dob_age':
                return { title: 'New Family Member', description: 'Enter the member\'s date of birth or age' };
            case 'member_gender':
                return { title: 'New Family Member', description: 'Select the member\'s gender' };
            case 'member_optional':
                return { title: 'New Family Member', description: 'Additional information (optional)' };
            // Link existing flow
            case 'lookup_method':
                return { title: 'Search Method', description: 'How would you like to search for this member?' };
            case 'search':
                return {
                    title: state.lookupMethod === 'phone' ? 'Enter Phone Number' : 'Enter Patient ID',
                    description: state.lookupMethod === 'phone'
                        ? 'Enter the mobile number of the family member'
                        : 'Enter the Patient ID (format: PT-XXXXXX)',
                };
            case 'otp':
                return {
                    title: `Verify ${state.contactType === 'email' ? 'Email' : 'Phone Number'}`,
                    description: `Enter the 6-digit OTP sent to ${state.contactType === 'email' ? state.email : state.foundMember?.phone}`,
                };
            case 'success':
                return { title: 'Successfully Linked!', description: `${state.foundMember?.name} has been added to your family members` };
            default:
                return { title: '', description: '' };
        }
    };

    const stepInfo = getStepInfo();

    return (
        <div className={cn('space-y-6', mode === 'embedded' && 'p-6')}>
            {/* Standalone: Dynamic SheetHeader with inline back button */}
            {mode === 'standalone' && state.step !== 'success' && (
                <SheetHeader>
                    <SheetTitle>
                        <span className="flex items-center gap-2">
                            {canGoBack && (
                                <button
                                    onClick={handleBack}
                                    className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-muted transition-colors"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                            )}
                            {stepInfo.title}
                        </span>
                    </SheetTitle>
                    <SheetDescription>{stepInfo.description}</SheetDescription>
                </SheetHeader>
            )}

            {/* Embedded: Separate back button */}
            {mode === 'embedded' && canGoBack && (
                <button
                    onClick={handleBack}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Back
                </button>
            )}

            {/* Error Message */}
            {state.error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-destructive">{state.error}</p>
                </div>
            )}

            {/* Step Content */}
            {state.step === 'choice' && (
                <div className="space-y-4">
                    {mode === 'embedded' && (
                        <>
                            <h3 className="text-lg font-semibold">Add New Person</h3>
                            <p className="text-sm text-muted-foreground">
                                Choose how you'd like to add this person
                            </p>
                        </>
                    )}

                    <div className="grid gap-3">
                        {/* Guest */}
                        <button
                            onClick={() => handleInitialChoice('guest')}
                            className="flex items-center gap-4 p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left"
                        >
                            <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                                <User className="h-6 w-6" />
                            </div>
                            <div>
                                <h4 className="font-semibold">Guest</h4>
                                <p className="text-sm text-muted-foreground">
                                    Quick booking for someone without medical history
                                </p>
                            </div>
                        </button>

                        {/* Add New Family Member */}
                        <button
                            onClick={() => handleInitialChoice('add_new_family')}
                            className="flex items-center gap-4 p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left"
                        >
                            <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                                <Users className="h-6 w-6" />
                            </div>
                            <div>
                                <h4 className="font-semibold">Add New Family Member</h4>
                                <p className="text-sm text-muted-foreground">
                                    Create a full family member profile
                                </p>
                            </div>
                        </button>

                        {/* Link Existing Patient */}
                        <button
                            onClick={() => handleInitialChoice('link_existing')}
                            className="flex items-center gap-4 p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left"
                        >
                            <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                                <Users className="h-6 w-6" />
                            </div>
                            <div>
                                <h4 className="font-semibold">Link Existing Patient</h4>
                                <p className="text-sm text-muted-foreground">
                                    Connect to an existing hospital patient record
                                </p>
                            </div>
                        </button>
                    </div>

                    <Button variant="ghost" onClick={onCancel} className="w-full">
                        Cancel
                    </Button>
                </div>
            )}

            {/* Guest Flow - Progressive Steps */}
            {state.step === 'guest_name' && (
                <div className="space-y-4">
                    {mode === 'embedded' && (
                        <>
                            <h3 className="text-lg font-semibold">Guest Information</h3>
                            <p className="text-sm text-muted-foreground">Enter the guest's name</p>
                        </>
                    )}

                    <div className="space-y-2">
                        <label htmlFor="guest_name" className="block text-sm font-medium text-gray-700">Name *</label>
                        <Input
                            id="guest_name"
                            value={state.guestName}
                            onChange={(e) => setState((prev) => ({ ...prev, guestName: e.target.value }))}
                            placeholder="Enter guest name"
                            autoFocus
                        />
                    </div>

                    <Button
                        onClick={handleGuestNameNext}
                        className="w-full"
                        disabled={!state.guestName.trim()}
                    >
                        Continue
                    </Button>
                </div>
            )}

            {state.step === 'guest_phone' && (
                <div className="space-y-4">
                    {mode === 'embedded' && (
                        <>
                            <h3 className="text-lg font-semibold">Guest Information</h3>
                            <p className="text-sm text-muted-foreground">Enter the guest's phone number</p>
                        </>
                    )}

                    <div className="space-y-2">
                        <label htmlFor="guest_phone" className="block text-sm font-medium text-gray-700">Phone Number *</label>
                        <PhoneInput
                            id="guest_phone"
                            value={state.guestPhone}
                            onChange={(value) => setState((prev) => ({ ...prev, guestPhone: value }))}
                            autoFocus
                        />
                    </div>

                    <Button
                        onClick={handleGuestPhoneNext}
                        className="w-full"
                        disabled={!state.guestPhone.trim() || state.guestPhone === '+91'}
                    >
                        Continue
                    </Button>
                </div>
            )}

            {state.step === 'guest_dob_age' && (
                <div className="space-y-4">
                    {mode === 'embedded' && (
                        <>
                            <h3 className="text-lg font-semibold">Guest Information</h3>
                            <p className="text-sm text-muted-foreground">Enter the guest's date of birth or age</p>
                        </>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <label htmlFor="guest_dob" className="block text-sm font-medium text-gray-700">
                                Date of Birth <span className="text-xs font-normal">(Recommended)</span>
                            </label>
                            <Input
                                id="guest_dob"
                                type="date"
                                value={state.guestDOB}
                                onChange={(e) => setState((prev) => ({ ...prev, guestDOB: e.target.value, guestAge: '' }))}
                                max={new Date().toISOString().split('T')[0]}
                                autoFocus
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="guest_age" className="block text-sm font-medium text-gray-700">
                                Age <span className="text-xs font-normal">(If DOB unknown)</span>
                            </label>
                            <Select
                                value={state.guestAge}
                                onValueChange={(value) => setState((prev) => ({ ...prev, guestAge: value, guestDOB: '' }))}
                                disabled={!!state.guestDOB}
                            >
                                <SelectTrigger id="guest_age" className={state.guestDOB ? 'opacity-50 cursor-not-allowed' : ''}>
                                    <SelectValue placeholder="Enter age" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px]">
                                    {Array.from({ length: 121 }, (_, i) => i).map((age) => (
                                        <SelectItem key={age} value={age.toString()}>
                                            {age} {age === 0 ? 'year' : 'years'}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <Button
                        onClick={handleGuestDobAgeNext}
                        className="w-full"
                        disabled={!state.guestAge && !state.guestDOB}
                    >
                        Continue
                    </Button>
                </div>
            )}

            {state.step === 'guest_gender' && (
                <div className="space-y-4">
                    {mode === 'embedded' && (
                        <>
                            <h3 className="text-lg font-semibold">Guest Information</h3>
                            <p className="text-sm text-muted-foreground">Select the guest's gender</p>
                        </>
                    )}

                    <div className="space-y-2">
                        <label htmlFor="guest_gender" className="block text-sm font-medium text-gray-700">Gender *</label>
                        <Select value={state.guestGender} onValueChange={(value) => setState((prev) => ({ ...prev, guestGender: value }))}>
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

                    <Button
                        onClick={handleGuestSubmit}
                        className="w-full"
                        disabled={state.loading || !state.guestGender}
                    >
                        {state.loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating Guest...
                            </>
                        ) : (
                            'Submit'
                        )}
                    </Button>
                </div>
            )}

            {state.step === 'relationship' && (
                <div className="space-y-4">
                    {mode === 'embedded' && (
                        <>
                            <h3 className="text-lg font-semibold">Select Relationship</h3>
                            <p className="text-sm text-muted-foreground">
                                What is this person's relationship to you?
                            </p>
                        </>
                    )}

                    <RelationshipSelector
                        value={state.relation}
                        onChange={(value) => setState((prev) => ({ ...prev, relation: value }))}
                    />

                    <Button onClick={handleRelationshipNext} className="w-full" disabled={!state.relation}>
                        Continue
                    </Button>
                </div>
            )}

            {/* New Family Member Flow - Progressive Steps */}
            {state.step === 'member_name' && (
                <div className="space-y-4">
                    {mode === 'embedded' && (
                        <>
                            <h3 className="text-lg font-semibold">New Family Member</h3>
                            <p className="text-sm text-muted-foreground">Enter the member's name</p>
                        </>
                    )}

                    <div className="space-y-2">
                        <label htmlFor="new_member_name" className="block text-sm font-medium text-gray-700">Name *</label>
                        <Input
                            id="new_member_name"
                            value={state.newMemberName}
                            onChange={(e) => setState((prev) => ({ ...prev, newMemberName: e.target.value }))}
                            placeholder="Enter full name"
                            autoFocus
                        />
                    </div>

                    <Button
                        onClick={handleMemberNameNext}
                        className="w-full"
                        disabled={!state.newMemberName.trim()}
                    >
                        Continue
                    </Button>
                </div>
            )}

            {state.step === 'member_phone' && (
                <div className="space-y-4">
                    {mode === 'embedded' && (
                        <>
                            <h3 className="text-lg font-semibold">New Family Member</h3>
                            <p className="text-sm text-muted-foreground">Enter the member's phone number</p>
                        </>
                    )}

                    <div className="space-y-2">
                        <label htmlFor="new_member_phone" className="block text-sm font-medium text-gray-700">Phone Number *</label>
                        <PhoneInput
                            id="new_member_phone"
                            value={state.newMemberPhone}
                            onChange={(value) => setState((prev) => ({ ...prev, newMemberPhone: value }))}
                            autoFocus
                        />
                    </div>

                    <Button
                        onClick={handleMemberPhoneNext}
                        className="w-full"
                        disabled={!state.newMemberPhone.trim() || state.newMemberPhone === '+91'}
                    >
                        Continue
                    </Button>
                </div>
            )}

            {state.step === 'member_dob_age' && (
                <div className="space-y-4">
                    {mode === 'embedded' && (
                        <>
                            <h3 className="text-lg font-semibold">New Family Member</h3>
                            <p className="text-sm text-muted-foreground">Enter the member's date of birth or age</p>
                        </>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <label htmlFor="new_member_dob" className="block text-sm font-medium text-gray-700">
                                Date of Birth <span className="text-xs font-normal">(Recommended)</span>
                            </label>
                            <Input
                                id="new_member_dob"
                                type="date"
                                value={state.newMemberDOB}
                                onChange={(e) => setState((prev) => ({ ...prev, newMemberDOB: e.target.value, newMemberAge: '' }))}
                                max={new Date().toISOString().split('T')[0]}
                                autoFocus
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="new_member_age" className="block text-sm font-medium text-gray-700">
                                Age <span className="text-xs font-normal">(If DOB unknown)</span>
                            </label>
                            <Select
                                value={state.newMemberAge}
                                onValueChange={(value) => setState((prev) => ({ ...prev, newMemberAge: value, newMemberDOB: '' }))}
                                disabled={!!state.newMemberDOB}
                            >
                                <SelectTrigger id="new_member_age" className={state.newMemberDOB ? 'opacity-50 cursor-not-allowed' : ''}>
                                    <SelectValue placeholder="Enter age" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px]">
                                    {Array.from({ length: 121 }, (_, i) => i).map((age) => (
                                        <SelectItem key={age} value={age.toString()}>
                                            {age} {age === 0 ? 'year' : 'years'}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <Button
                        onClick={handleMemberDobAgeNext}
                        className="w-full"
                        disabled={!state.newMemberAge && !state.newMemberDOB}
                    >
                        Continue
                    </Button>
                </div>
            )}

            {state.step === 'member_gender' && (
                <div className="space-y-4">
                    {mode === 'embedded' && (
                        <>
                            <h3 className="text-lg font-semibold">New Family Member</h3>
                            <p className="text-sm text-muted-foreground">Select the member's gender</p>
                        </>
                    )}

                    <div className="space-y-2">
                        <label htmlFor="new_member_gender" className="block text-sm font-medium text-gray-700">Gender *</label>
                        <Select value={state.newMemberGender} onValueChange={(value) => setState((prev) => ({ ...prev, newMemberGender: value }))}>
                            <SelectTrigger id="new_member_gender">
                                <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Button
                        onClick={handleMemberGenderNext}
                        className="w-full"
                        disabled={!state.newMemberGender}
                    >
                        Continue
                    </Button>
                </div>
            )}

            {state.step === 'member_optional' && (
                <div className="space-y-4">
                    {mode === 'embedded' && (
                        <>
                            <h3 className="text-lg font-semibold">New Family Member</h3>
                            <p className="text-sm text-muted-foreground">Additional information (optional)</p>
                        </>
                    )}

                    <div className="space-y-2">
                        <label htmlFor="new_member_email" className="block text-sm font-medium text-gray-700">Email (Optional)</label>
                        <Input
                            id="new_member_email"
                            type="email"
                            value={state.newMemberEmail}
                            onChange={(e) => setState((prev) => ({ ...prev, newMemberEmail: e.target.value }))}
                            placeholder="email@example.com"
                            autoFocus
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="new_member_blood_group" className="block text-sm font-medium text-gray-700">Blood Group (Optional)</label>
                        <Select value={state.newMemberBloodGroup} onValueChange={(value) => setState((prev) => ({ ...prev, newMemberBloodGroup: value }))}>
                            <SelectTrigger id="new_member_blood_group">
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

                    <Button
                        onClick={handleNewMemberSubmit}
                        className="w-full"
                        disabled={state.loading}
                    >
                        {state.loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating Member...
                            </>
                        ) : (
                            'Submit'
                        )}
                    </Button>
                </div>
            )}

            {state.step === 'lookup_method' && (
                <div className="space-y-4">
                    {mode === 'embedded' && (
                        <>
                            <h3 className="text-lg font-semibold">Search Method</h3>
                            <p className="text-sm text-muted-foreground">
                                How would you like to search for this member?
                            </p>
                        </>
                    )}

                    <div className="grid gap-3">
                        <button
                            onClick={() => handleLookupMethodChoice('phone')}
                            className="p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left"
                        >
                            <h4 className="font-semibold mb-1">Phone Number</h4>
                            <p className="text-sm text-muted-foreground">
                                Search using their mobile number
                            </p>
                        </button>

                        <button
                            onClick={() => handleLookupMethodChoice('patient_id')}
                            className="p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left"
                        >
                            <h4 className="font-semibold mb-1">Patient ID</h4>
                            <p className="text-sm text-muted-foreground">
                                Search using their Patient ID (PT-XXXXXX)
                            </p>
                        </button>
                    </div>
                </div>
            )}

            {state.step === 'search' && (
                <div className="space-y-4">
                    {mode === 'embedded' && (
                        <>
                            <h3 className="text-lg font-semibold">
                                {state.lookupMethod === 'phone' ? 'Enter Phone Number' : 'Enter Patient ID'}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                {state.lookupMethod === 'phone'
                                    ? 'Enter the mobile number of the family member'
                                    : 'Enter the Patient ID (format: PT-XXXXXX)'}
                            </p>
                        </>
                    )}

                    <div className="space-y-2">
                        <label htmlFor="search_value" className="block text-sm font-medium text-gray-700">
                            {state.lookupMethod === 'phone' ? 'Phone Number' : 'Patient ID'}
                        </label>
                        {state.lookupMethod === 'phone' ? (
                            <PhoneInput
                                id="search_value"
                                value={state.searchValue}
                                onChange={(value) => setState((prev) => ({ ...prev, searchValue: value }))}
                                autoFocus
                            />
                        ) : (
                            <Input
                                id="search_value"
                                value={state.searchValue}
                                onChange={(e) => setState((prev) => ({ ...prev, searchValue: e.target.value }))}
                                placeholder="PT-000001"
                                autoFocus
                            />
                        )}
                    </div>

                    {state.foundMember && (
                        <div className="space-y-3">
                            <p className="text-sm font-medium text-green-600">Member Found!</p>
                            <MemberSearchCard member={state.foundMember} alreadyLinked={state.alreadyLinked} />

                            {!state.alreadyLinked && !state.emailInputMode && (
                                <div className="space-y-2">
                                    {state.lockedOut ? (
                                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                            <p className="text-sm text-amber-800">
                                                <AlertCircle className="inline h-4 w-4 mr-1" />
                                                Too many OTP attempts. Please try again after 15 minutes.
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            <Button onClick={handleSendOtp} className="w-full" disabled={state.loading}>
                                                {state.loading ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Sending OTP...
                                                    </>
                                                ) : (
                                                    'Send OTP to Phone'
                                                )}
                                            </Button>
                                            <button
                                                onClick={() => setState((prev) => ({ ...prev, emailInputMode: true, error: '' }))}
                                                className="w-full text-sm text-primary hover:underline"
                                            >
                                                Try Email Instead →
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}

                            {!state.alreadyLinked && state.emailInputMode && (
                                <div className="space-y-3">
                                    {state.lockedOut ? (
                                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                            <p className="text-sm text-amber-800">
                                                <AlertCircle className="inline h-4 w-4 mr-1" />
                                                Too many OTP attempts. Please try again after 15 minutes.
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="space-y-2">
                                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    value={state.email}
                                                    onChange={(e) => setState((prev) => ({ ...prev, email: e.target.value }))}
                                                    placeholder="Enter email address"
                                                />
                                            </div>
                                            <Button onClick={handleSendOtp} className="w-full" disabled={state.loading || !state.email.trim()}>
                                                {state.loading ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Sending OTP...
                                                    </>
                                                ) : (
                                                    'Send OTP to Email'
                                                )}
                                            </Button>
                                        </>
                                    )}
                                    <button
                                        onClick={() => setState((prev) => ({ ...prev, emailInputMode: false, email: '', error: '', lockedOut: false }))}
                                        className="w-full text-sm text-muted-foreground hover:text-foreground"
                                    >
                                        ← Back to Phone
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {!state.foundMember && (
                        <div className="space-y-2">
                            <Button onClick={handleSearch} className="w-full" disabled={state.loading || !state.searchValue.trim()}>
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
                                <Button variant="outline" onClick={handleAddAsNew} className="w-full">
                                    Add as New Member
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            )}

            {state.step === 'otp' && (
                <div className="space-y-4">
                    {mode === 'embedded' && (
                        <>
                            <h3 className="text-lg font-semibold">
                                Verify {state.contactType === 'email' ? 'Email' : 'Phone Number'}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Enter the 6-digit OTP sent to {state.contactType === 'email' ? state.email : state.foundMember?.phone}
                            </p>
                        </>
                    )}

                    <OtpInput
                        value={state.otpValue}
                        onChange={(value) => setState((prev) => ({ ...prev, otpValue: value }))}
                        onComplete={handleVerifyOtp}
                        onResend={handleSendOtp}
                        error={state.error}
                    />

                    {state.loading && (
                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Verifying...
                        </div>
                    )}
                </div>
            )}

            {state.step === 'success' && (
                <div className="space-y-4 text-center py-8">
                    <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold">Successfully Linked!</h3>
                    <p className="text-sm text-muted-foreground">
                        {state.foundMember?.name} has been added to your family members
                    </p>
                </div>
            )}
        </div>
    );
}
