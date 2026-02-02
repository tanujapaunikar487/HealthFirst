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
import { DetectionCard } from './DetectionCard';
import { SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/Components/ui/sheet';
import { cn } from '@/Lib/utils';

type Step =
    | 'choice'
    // Guest - single form (unchanged)
    | 'guest_form'
    // New family - 1 step (CHANGED: removed 'relationship')
    | 'member_details'
    // Link existing - 2-3 steps
    | 'search'
    | 'otp'  // OTP verification
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

    // NEW: UX improvements
    autoFocusField?: 'relationship' | 'name' | 'phone';
    lockoutUntil?: number | null;  // Timestamp for OTP lockout
    otpContactMethod?: 'phone' | 'email';  // Pre-selected contact method

    // NEW: Auto-detection fields
    showDetectionCard: boolean;
    submitMode: 'create' | 'link';
    loadingField: string | null;
    fieldErrors: Record<string, string>;
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

        // NEW: UX improvements
        autoFocusField: undefined,
        lockoutUntil: null,
        otpContactMethod: 'phone',

        // NEW: Auto-detection fields
        showDetectionCard: false,
        submitMode: 'create',
        loadingField: null,
        fieldErrors: {},
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

    const clearFieldError = (field: string) => {
        setState(prev => {
            const newErrors = { ...prev.fieldErrors };
            delete newErrors[field];
            return { ...prev, fieldErrors: newErrors };
        });
    };

    // Step 1: Initial Choice (3 options)
    const handleInitialChoice = (choice: 'guest' | 'add_new_family' | 'link_existing') => {
        setState((prev) => ({ ...prev, flowType: choice }));
        if (choice === 'guest') {
            setStep('guest_form');
        } else if (choice === 'add_new_family') {
            // CHANGED: Go straight to member_details (no relationship step)
            setStep('member_details');
        } else {
            // Link existing: go to search with phone method pre-selected
            setState((prev) => ({ ...prev, lookupMethod: 'phone', otpContactMethod: 'phone' }));
            setStep('search');
        }
    };

    // Phone Auto-Detection Handler
    const handlePhoneBlur = async (phone: string) => {
        // Step 1: Client validation
        if (!phone || phone === '+91') {
            setState(prev => ({ ...prev, fieldErrors: { ...prev.fieldErrors, memberPhone: 'Please enter a phone number' } }));
            return;
        }
        if (!/^\+91[6-9]\d{9}$/.test(phone)) {
            setState(prev => ({ ...prev, fieldErrors: { ...prev.fieldErrors, memberPhone: 'Please enter a valid 10-digit phone number' } }));
            return;
        }

        // Step 2: Clear error, show loading
        setState(prev => ({ ...prev, fieldErrors: { ...prev.fieldErrors, memberPhone: '' }, loadingField: 'phone' }));

        // Step 3: API call to lookup() - SAFE, no OTP yet
        try {
            const response = await fetch('/family-members/lookup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ search_type: 'phone', search_value: phone }),
            });
            const data = await response.json();

            if (data.found && !data.already_linked) {
                // CASE 1: Existing patient - show detection card
                setState(prev => ({
                    ...prev,
                    foundMember: data.member_data,
                    showDetectionCard: true,
                    submitMode: 'link', // Button becomes "Verify & Link"
                    loadingField: null,
                }));
            } else if (data.already_linked) {
                // CASE 2: Already linked - error
                setState(prev => ({
                    ...prev,
                    fieldErrors: { ...prev.fieldErrors, memberPhone: 'This phone number is already registered to one of your family members.' },
                    showDetectionCard: false,
                    submitMode: 'create',
                    loadingField: null,
                }));
            } else {
                // CASE 3: Not found - normal create
                setState(prev => ({ ...prev, showDetectionCard: false, submitMode: 'create', loadingField: null }));
            }
        } catch (error) {
            // CASE 4: API failure - allow continuing (don't block user)
            setState(prev => ({ ...prev, showDetectionCard: false, submitMode: 'create', loadingField: null }));
        }
    };

    // Accept Detected Member - triggers OTP flow
    const handleAcceptDetectedMember = () => {
        if (!state.foundMember) return;

        // Auto-suggest relationship based on age/gender if not already selected
        const suggestRelationship = () => {
            if (state.relation) return state.relation; // Keep existing selection

            const age = state.foundMember?.age;
            const gender = state.foundMember?.gender;

            if (age && age >= 50) {
                return gender === 'female' ? 'mother' : gender === 'male' ? 'father' : '';
            } else if (age && age >= 20 && age < 50) {
                return gender === 'female' ? 'sister' : gender === 'male' ? 'brother' : '';
            }
            return '';
        };

        const suggestedRelation = suggestRelationship();

        // Transition to OTP verification step
        setState(prev => ({
            ...prev,
            flowType: 'link_existing',
            lookupMethod: 'phone',
            searchValue: state.newMemberPhone,
            relation: suggestedRelation,
            step: 'otp',
        }));

        // Send OTP automatically
        handleSendOtp();
    };

    // Guest Form Submit
    const handleGuestSubmit = async () => {
        // Required fields validation
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
        // Optional fields - no validation needed

        if (mode === 'standalone') {
            // In standalone mode, create the guest via form submission and reload
            setLoading(true);
            try {
                router.post('/family-members', {
                    name: state.guestName,
                    relation: 'guest',
                    phone: state.guestPhone,
                    ...(state.guestDOB && { date_of_birth: state.guestDOB }),
                    ...(state.guestAge && !state.guestDOB && { age: parseInt(state.guestAge, 10) }),
                    ...(state.guestGender && { gender: state.guestGender }),
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
            let age: number | undefined;
            if (state.guestDOB) {
                const birthDate = new Date(state.guestDOB);
                const today = new Date();
                age = today.getFullYear() - birthDate.getFullYear();
                const monthDiff = today.getMonth() - birthDate.getMonth();
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                }
            } else if (state.guestAge) {
                age = parseInt(state.guestAge, 10);
            }

            onComplete({
                member_type: 'guest',
                member_name: state.guestName,
                member_phone: state.guestPhone,
                ...(age !== undefined && { member_age: age }),
                ...(state.guestGender && { member_gender: state.guestGender }),
            });
            setLoading(false);
        }
    };

    // REMOVED: Relationship step no longer needed as standalone step
    // Relationship is now part of member_details form for add_new_family
    // For link_existing, relationship is combined with OTP verification


    // Step 3: Member Details Form Submission
    const handleMemberDetailsSubmit = async () => {
        // Validate required fields (NOW INCLUDES RELATIONSHIP)
        if (!state.relation) {
            setError('Please select a relationship');
            return;
        }
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

        // Optional fields - no validation needed
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
                    ...(state.newMemberAge && { age: parseInt(state.newMemberAge, 10) }),
                    ...(state.newMemberGender && { gender: state.newMemberGender }),
                    ...(state.newMemberEmail && { email: state.newMemberEmail }),
                    ...(state.newMemberDOB && { date_of_birth: state.newMemberDOB }),
                    ...(state.newMemberBloodGroup && { blood_group: state.newMemberBloodGroup }),
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

    // Search for Member (combines method selection + search)
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
        // Switch to add new family flow
        // Pre-fill phone if it was a phone search
        // Single setState prevents blank screen race condition
        setState((prev) => ({
            ...prev,
            flowType: 'add_new_family',
            newMemberPhone: prev.searchValue, // ALWAYS pre-fill, not conditional
            newMemberName: '', // Clear name (not from search)
            step: 'member_details',  // CHANGED: Go straight to form (no relationship step)
            autoFocusField: 'relationship',  // Auto-focus on relationship dropdown
            error: '',
        }));
    };

    // Back navigation
    const handleBack = () => {
        const backMap: Record<Step, Step> = {
            choice: 'choice',
            // Guest flow
            guest_form: 'choice',
            // New family flow (CHANGED: member_details goes straight back to choice)
            member_details: 'choice',
            // Link existing flow
            search: 'choice',
            relationship_verify: 'search',
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
            case 'guest_form':
                return { title: 'Guest Information', description: 'Add a guest for this appointment' };
            // New family flow
            case 'member_details':
                return { title: 'Add Family Member', description: 'Add a new family member to your account' };
            // Link existing flow
            case 'search':
                return {
                    title: 'Link Existing Patient',
                    description: 'Connect to their existing hospital record',
                };
            case 'relationship_verify':
                return {
                    title: 'Verify & Link',
                    description: `We found: ${state.foundMember?.name} (${state.foundMember?.patient_id})`,
                };
            case 'success':
                return { title: 'Successfully Linked!', description: `${state.foundMember?.name} has been added to your family members` };
            default:
                return { title: '', description: '' };
        }
    };

    const stepInfo = getStepInfo();

    // Standalone footer button based on current step
    const renderStandaloneFooter = () => {
        if (mode !== 'standalone') return null;
        switch (state.step) {
            case 'guest_form':
                return (
                    <SheetFooter>
                        <Button
                            className="flex-1"
                            onClick={handleGuestSubmit}
                            disabled={state.loading || !state.guestName.trim() || !state.guestPhone.trim() || state.guestPhone === '+91'}
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
                    </SheetFooter>
                );
            case 'member_details':
                return (
                    <SheetFooter>
                        <Button
                            className="flex-1"
                            onClick={handleMemberDetailsSubmit}
                            disabled={state.loading || !state.relation || !state.newMemberName.trim() || !state.newMemberPhone.trim() || state.newMemberPhone === '+91'}
                        >
                            {state.loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Adding Member...
                                </>
                            ) : (
                                'Add Member'
                            )}
                        </Button>
                    </SheetFooter>
                );
            default:
                return null;
        }
    };

    if (mode === 'standalone') {
        return (
            <div className="flex flex-col h-full">
                {state.step !== 'success' && (
                    <SheetHeader onBack={canGoBack ? handleBack : undefined}>
                        <SheetTitle>{stepInfo.title}</SheetTitle>
                        <SheetDescription>{stepInfo.description}</SheetDescription>
                    </SheetHeader>
                )}

                <div className="flex-1 overflow-y-auto -mx-6 px-6 space-y-6">
                    {/* Error Message */}
                    {state.error && (
                        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start gap-2">
                            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-destructive">{state.error}</p>
                        </div>
                    )}

                    {/* Step Content - standalone renders buttons in footer */}
                    {state.step === 'choice' && (
                        <div className="space-y-4">
                            <div className="grid gap-3">
                                <button onClick={() => handleInitialChoice('add_new_family')} className="flex items-center gap-4 p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left">
                                    <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center"><Users className="h-6 w-6" /></div>
                                    <div><h4 className="font-semibold">Family Member</h4><p className="text-sm text-muted-foreground">Someone you'll book for again</p></div>
                                </button>
                                <button onClick={() => handleInitialChoice('guest')} className="flex items-center gap-4 p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left">
                                    <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center"><User className="h-6 w-6" /></div>
                                    <div><h4 className="font-semibold">Guest</h4><p className="text-sm text-muted-foreground">One-time booking</p></div>
                                </button>
                            </div>
                        </div>
                    )}

                    {state.step === 'guest_form' && (
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2"><div className="h-px flex-1 bg-border"></div><span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Required Information</span><div className="h-px flex-1 bg-border"></div></div>
                                <div className="space-y-2">
                                    <label htmlFor="guest_name_s" className="block text-sm font-medium text-foreground">Name <span className="text-destructive">*</span></label>
                                    <Input id="guest_name_s" value={state.guestName} onChange={(e) => setState((prev) => ({ ...prev, guestName: e.target.value }))} placeholder="Enter guest name" autoFocus />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="guest_phone_s" className="block text-sm font-medium text-foreground">Phone Number <span className="text-destructive">*</span></label>
                                    <PhoneInput id="guest_phone_s" value={state.guestPhone} onChange={(value) => setState((prev) => ({ ...prev, guestPhone: value }))} />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center gap-2"><div className="h-px flex-1 bg-border"></div><span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Optional Details</span><div className="h-px flex-1 bg-border"></div></div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <label htmlFor="guest_dob_s" className="block text-sm font-medium text-foreground">Date of Birth</label>
                                        <Input id="guest_dob_s" type="date" value={state.guestDOB} onChange={(e) => setState((prev) => ({ ...prev, guestDOB: e.target.value, guestAge: '' }))} max={new Date().toISOString().split('T')[0]} />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="guest_age_s" className="block text-sm font-medium text-foreground">Age</label>
                                        <Select value={state.guestAge} onValueChange={(value) => setState((prev) => ({ ...prev, guestAge: value, guestDOB: '' }))} disabled={!!state.guestDOB}>
                                            <SelectTrigger id="guest_age_s" className={state.guestDOB ? 'opacity-50 cursor-not-allowed' : ''}><SelectValue placeholder="Select age" /></SelectTrigger>
                                            <SelectContent className="max-h-[200px]">{Array.from({ length: 121 }, (_, i) => i).map((age) => (<SelectItem key={age} value={age.toString()}>{age} {age === 0 ? 'year' : 'years'}</SelectItem>))}</SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="guest_gender_s" className="block text-sm font-medium text-foreground">Gender</label>
                                    <Select value={state.guestGender} onValueChange={(value) => setState((prev) => ({ ...prev, guestGender: value }))}>
                                        <SelectTrigger id="guest_gender_s"><SelectValue placeholder="Select gender (optional)" /></SelectTrigger>
                                        <SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    )}

                    {state.step === 'member_details' && (
                        <div className="space-y-6">
                            {/* Essential Information Section */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="h-px flex-1 bg-border"></div>
                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                        Relationship & Contact
                                    </span>
                                    <div className="h-px flex-1 bg-border"></div>
                                </div>

                                {/* Relationship dropdown - MOVED HERE */}
                                <div className="space-y-2">
                                    <label htmlFor="relationship_s" className="block text-sm font-medium text-foreground">
                                        Relationship <span className="text-destructive">*</span>
                                    </label>
                                    <Select
                                        value={state.relation}
                                        onValueChange={(value) => setState(prev => ({ ...prev, relation: value }))}
                                        disabled={state.loading}
                                    >
                                        <SelectTrigger
                                            id="relationship_s"
                                            className={!state.relation ? 'text-muted-foreground' : ''}
                                        >
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
                                    <label htmlFor="new_member_name_s" className="block text-sm font-medium text-foreground">
                                        Full Name <span className="text-destructive">*</span>
                                    </label>
                                    <Input
                                        id="new_member_name_s"
                                        value={state.newMemberName}
                                        onChange={(e) => setState((prev) => ({ ...prev, newMemberName: e.target.value }))}
                                        placeholder="Enter full name"
                                        autoFocus
                                        disabled={state.loading}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="new_member_phone_s" className="block text-sm font-medium text-foreground">
                                        Phone Number <span className="text-destructive">*</span>
                                    </label>
                                    <PhoneInput
                                        id="new_member_phone_s"
                                        value={state.newMemberPhone}
                                        onChange={(value) => setState((prev) => ({ ...prev, newMemberPhone: value }))}
                                        disabled={state.loading}
                                    />
                                </div>
                            </div>

                            {/* Optional Details Section */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="h-px flex-1 bg-border"></div>
                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                        Optional Details (Recommended)
                                    </span>
                                    <div className="h-px flex-1 bg-border"></div>
                                </div>

                                <p className="text-xs text-muted-foreground">Help us serve them better</p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <label htmlFor="new_member_dob_s" className="block text-sm font-medium text-foreground">
                                            Date of Birth
                                        </label>
                                        <Input
                                            id="new_member_dob_s"
                                            type="date"
                                            value={state.newMemberDOB}
                                            onChange={(e) => setState((prev) => ({
                                                ...prev,
                                                newMemberDOB: e.target.value,
                                                newMemberAge: ''
                                            }))}
                                            max={new Date().toISOString().split('T')[0]}
                                            disabled={state.loading}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="new_member_age_s" className="block text-sm font-medium text-foreground">
                                            Age
                                        </label>
                                        <Select
                                            value={state.newMemberAge}
                                            onValueChange={(value) => setState((prev) => ({
                                                ...prev,
                                                newMemberAge: value,
                                                newMemberDOB: ''
                                            }))}
                                            disabled={state.loading || !!state.newMemberDOB}
                                        >
                                            <SelectTrigger
                                                id="new_member_age_s"
                                                className={state.newMemberDOB ? 'opacity-50 cursor-not-allowed' : ''}
                                            >
                                                <SelectValue placeholder="Select age" />
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

                                <div className="space-y-2">
                                    <label htmlFor="new_member_gender_s" className="block text-sm font-medium text-foreground">
                                        Gender
                                    </label>
                                    <Select
                                        value={state.newMemberGender}
                                        onValueChange={(value) => setState((prev) => ({ ...prev, newMemberGender: value }))}
                                        disabled={state.loading}
                                    >
                                        <SelectTrigger id="new_member_gender_s">
                                            <SelectValue placeholder="Select gender (optional)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="male">Male</SelectItem>
                                            <SelectItem value="female">Female</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="new_member_email_s" className="block text-sm font-medium text-foreground">
                                        Email
                                    </label>
                                    <Input
                                        id="new_member_email_s"
                                        type="email"
                                        value={state.newMemberEmail}
                                        onChange={(e) => setState((prev) => ({ ...prev, newMemberEmail: e.target.value }))}
                                        placeholder="email@example.com (optional)"
                                        disabled={state.loading}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="new_member_blood_group_s" className="block text-sm font-medium text-foreground">
                                        Blood Group
                                    </label>
                                    <Select
                                        value={state.newMemberBloodGroup}
                                        onValueChange={(value) => setState((prev) => ({ ...prev, newMemberBloodGroup: value }))}
                                        disabled={state.loading}
                                    >
                                        <SelectTrigger id="new_member_blood_group_s">
                                            <SelectValue placeholder="Select blood group (optional)" />
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
                        </div>
                    )}

                    {state.step === 'search' && (
                        <div className="space-y-6">
                            {/* Method Selection */}
                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-foreground">Search by</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setState((prev) => ({ ...prev, lookupMethod: 'phone', searchValue: '', foundMember: null, error: '' }))}
                                        className={cn(
                                            "p-3 rounded-xl border-2 transition-all text-left",
                                            state.lookupMethod === 'phone'
                                                ? "border-primary bg-primary/5"
                                                : "border-border hover:border-primary/50"
                                        )}
                                    >
                                        <h4 className="font-semibold text-sm mb-1">Phone Number</h4>
                                        <p className="text-xs text-muted-foreground">Mobile number</p>
                                    </button>
                                    <button
                                        onClick={() => setState((prev) => ({ ...prev, lookupMethod: 'patient_id', searchValue: '', foundMember: null, error: '' }))}
                                        className={cn(
                                            "p-3 rounded-xl border-2 transition-all text-left",
                                            state.lookupMethod === 'patient_id'
                                                ? "border-primary bg-primary/5"
                                                : "border-border hover:border-primary/50"
                                        )}
                                    >
                                        <h4 className="font-semibold text-sm mb-1">Patient ID</h4>
                                        <p className="text-xs text-muted-foreground">PT-XXXXXX</p>
                                    </button>
                                </div>
                            </div>

                            {/* Search Input */}
                            <div className="space-y-2">
                                <label htmlFor="search_value_s" className="block text-sm font-medium text-foreground">
                                    {state.lookupMethod === 'phone' ? 'Phone Number' : 'Patient ID'}
                                </label>
                                {state.lookupMethod === 'phone' ? (
                                    <PhoneInput id="search_value_s" value={state.searchValue} onChange={(value) => setState((prev) => ({ ...prev, searchValue: value }))} autoFocus />
                                ) : (
                                    <Input id="search_value_s" value={state.searchValue} onChange={(e) => setState((prev) => ({ ...prev, searchValue: e.target.value }))} placeholder="PT-000001" autoFocus />
                                )}
                            </div>
                            {state.foundMember && (
                                <div className="space-y-3">
                                    <p className="text-sm font-medium text-green-600">Member Found!</p>
                                    <MemberSearchCard member={state.foundMember} alreadyLinked={state.alreadyLinked} />
                                    {!state.alreadyLinked && !state.emailInputMode && (
                                        <div className="space-y-2">
                                            {state.lockedOut ? (
                                                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg"><p className="text-sm text-amber-800"><AlertCircle className="inline h-4 w-4 mr-1" />Too many OTP attempts. Please try again after 15 minutes.</p></div>
                                            ) : (
                                                <>
                                                    <Button onClick={handleSendOtp} className="w-full" disabled={state.loading}>{state.loading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending OTP...</>) : 'Send OTP to Phone'}</Button>
                                                    <button onClick={() => setState((prev) => ({ ...prev, emailInputMode: true, error: '' }))} className="w-full text-sm text-primary hover:underline">Try Email Instead →</button>
                                                </>
                                            )}
                                        </div>
                                    )}
                                    {!state.alreadyLinked && state.emailInputMode && (
                                        <div className="space-y-3">
                                            {state.lockedOut ? (
                                                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg"><p className="text-sm text-amber-800"><AlertCircle className="inline h-4 w-4 mr-1" />Too many OTP attempts. Please try again after 15 minutes.</p></div>
                                            ) : (
                                                <>
                                                    <div className="space-y-2">
                                                        <label htmlFor="email_s" className="block text-sm font-medium text-gray-700">Email Address</label>
                                                        <Input id="email_s" type="email" value={state.email} onChange={(e) => setState((prev) => ({ ...prev, email: e.target.value }))} placeholder="Enter email address" />
                                                    </div>
                                                    <Button onClick={handleSendOtp} className="w-full" disabled={state.loading || !state.email.trim()}>{state.loading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending OTP...</>) : 'Send OTP to Email'}</Button>
                                                </>
                                            )}
                                            <button onClick={() => setState((prev) => ({ ...prev, emailInputMode: false, email: '', error: '', lockedOut: false }))} className="w-full text-sm text-muted-foreground hover:text-foreground">← Back to Phone</button>
                                        </div>
                                    )}
                                </div>
                            )}
                            {!state.foundMember && (
                                <div className="space-y-2">
                                    <Button onClick={handleSearch} className="w-full" disabled={state.loading || !state.searchValue.trim()}>{state.loading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Searching...</>) : 'Search'}</Button>
                                    {state.error.includes('No member found') && (<Button variant="outline" onClick={handleAddAsNew} className="w-full">Add as New Member</Button>)}
                                </div>
                            )}
                        </div>
                    )}

                    {state.step === 'otp' && (
                        <div className="space-y-4">
                            <OtpInput value={state.otpValue} onChange={(value) => setState((prev) => ({ ...prev, otpValue: value }))} onComplete={handleVerifyOtp} onResend={handleSendOtp} error={state.error} />
                            {state.loading && (<div className="flex items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Verifying...</div>)}
                        </div>
                    )}

                    {state.step === 'success' && (
                        <div className="space-y-4 text-center py-8">
                            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto"><CheckCircle2 className="h-8 w-8 text-green-600" /></div>
                            <h3 className="text-lg font-semibold">Successfully Linked!</h3>
                            <p className="text-sm text-muted-foreground">{state.foundMember?.name} has been added to your family members</p>
                        </div>
                    )}
                </div>

                {renderStandaloneFooter()}
            </div>
        );
    }

    // Embedded mode
    return (
        <div className="space-y-6 p-6">
            {/* Embedded: Separate back button */}
            {canGoBack && (
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
                    <h3 id="choice-heading" className="text-lg font-semibold">Add New Person</h3>
                    <p className="text-sm text-muted-foreground">
                        Choose how you'd like to add this person
                    </p>

                    <div role="radiogroup" aria-labelledby="choice-heading" className="grid gap-3">
                        {/* Guest */}
                        <button
                            role="radio"
                            aria-checked={state.flowType === 'guest'}
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
                            role="radio"
                            aria-checked={state.flowType === 'add_new_family'}
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

            {/* Guest Form - Single grouped form */}
            {state.step === 'guest_form' && (
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold">Guest Information</h3>
                    <p className="text-sm text-muted-foreground">Add a guest for this appointment</p>

                    {/* Required Information */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="h-px flex-1 bg-border"></div>
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Required Information</span>
                            <div className="h-px flex-1 bg-border"></div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="guest_name" className="block text-sm font-medium text-foreground">
                                Name <span className="text-destructive">*</span>
                            </label>
                            <Input
                                id="guest_name"
                                value={state.guestName}
                                onChange={(e) => setState((prev) => ({ ...prev, guestName: e.target.value }))}
                                placeholder="Enter guest name"
                                autoFocus
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="guest_phone" className="block text-sm font-medium text-foreground">
                                Phone Number <span className="text-destructive">*</span>
                            </label>
                            <PhoneInput
                                id="guest_phone"
                                value={state.guestPhone}
                                onChange={(value) => setState((prev) => ({ ...prev, guestPhone: value }))}
                            />
                        </div>
                    </div>

                    {/* Optional Details */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="h-px flex-1 bg-border"></div>
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Optional Details</span>
                            <div className="h-px flex-1 bg-border"></div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <label htmlFor="guest_dob" className="block text-sm font-medium text-foreground">
                                    Date of Birth
                                </label>
                                <Input
                                    id="guest_dob"
                                    type="date"
                                    value={state.guestDOB}
                                    onChange={(e) => setState((prev) => ({ ...prev, guestDOB: e.target.value, guestAge: '' }))}
                                    max={new Date().toISOString().split('T')[0]}
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="guest_age" className="block text-sm font-medium text-foreground">
                                    Age
                                </label>
                                <Select
                                    value={state.guestAge}
                                    onValueChange={(value) => setState((prev) => ({ ...prev, guestAge: value, guestDOB: '' }))}
                                    disabled={!!state.guestDOB}
                                >
                                    <SelectTrigger id="guest_age" className={state.guestDOB ? 'opacity-50 cursor-not-allowed' : ''}>
                                        <SelectValue placeholder="Select age" />
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

                        <div className="space-y-2">
                            <label htmlFor="guest_gender" className="block text-sm font-medium text-foreground">Gender</label>
                            <Select value={state.guestGender} onValueChange={(value) => setState((prev) => ({ ...prev, guestGender: value }))}>
                                <SelectTrigger id="guest_gender">
                                    <SelectValue placeholder="Select gender (optional)" />
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
                        disabled={state.loading || !state.guestName.trim() || !state.guestPhone.trim() || state.guestPhone === '+91'}
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
            )}

            {/* New Family Member Flow - Grouped Form */}
            {state.step === 'member_details' && (
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold">Add Family Member</h3>
                    <p className="text-sm text-muted-foreground">Add a new family member to your account</p>

                    {/* SECTION 1: Relationship & Contact */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="h-px flex-1 bg-border"></div>
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Relationship & Contact
                            </span>
                            <div className="h-px flex-1 bg-border"></div>
                        </div>

                        {/* Relationship dropdown - MOVED HERE */}
                        <div className="space-y-2">
                            <label htmlFor="relationship" className="block text-sm font-medium text-foreground">
                                Relationship <span className="text-destructive">*</span>
                            </label>
                            <Select
                                value={state.relation}
                                onValueChange={(value) => setState(prev => ({ ...prev, relation: value }))}
                                disabled={state.loading}
                            >
                                <SelectTrigger
                                    id="relationship"
                                    className={!state.relation ? 'text-muted-foreground' : ''}
                                    autoFocus={state.autoFocusField === 'relationship'}
                                >
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
                            <label htmlFor="new_member_name" className="block text-sm font-medium text-foreground">
                                Full Name <span className="text-destructive">*</span>
                            </label>
                            <Input
                                id="new_member_name"
                                value={state.newMemberName}
                                onChange={(e) => setState((prev) => ({ ...prev, newMemberName: e.target.value }))}
                                placeholder="Enter full name"
                                autoFocus
                                disabled={state.loading}
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="new_member_phone" className="block text-sm font-medium text-foreground">
                                Phone Number <span className="text-destructive" aria-label="required">*</span>
                            </label>
                            <div className="relative">
                                <PhoneInput
                                    id="new_member_phone"
                                    aria-label="Phone number"
                                    aria-required="true"
                                    aria-invalid={!!state.fieldErrors.memberPhone}
                                    aria-describedby={state.fieldErrors.memberPhone ? "phone-error" : "phone-help"}
                                    aria-busy={state.loadingField === 'phone'}
                                    value={state.newMemberPhone}
                                    onChange={(value) => {
                                        setState((prev) => ({ ...prev, newMemberPhone: value }));
                                        clearFieldError('memberPhone');
                                    }}
                                    onBlur={() => handlePhoneBlur(state.newMemberPhone)}
                                    disabled={state.loading || state.loadingField === 'phone'}
                                />
                                {state.loadingField === 'phone' && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <svg className="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    </div>
                                )}
                            </div>
                            {state.fieldErrors.memberPhone && (
                                <p id="phone-error" role="alert" className="text-xs text-destructive">{state.fieldErrors.memberPhone}</p>
                            )}
                            <p id="phone-help" className="text-xs text-muted-foreground">We'll check if this person has a patient record</p>
                        </div>

                        {/* Detection Card */}
                        {state.showDetectionCard && state.foundMember && (
                            <DetectionCard
                                member={state.foundMember}
                                onAccept={handleAcceptDetectedMember}
                                disabled={state.loading}
                            />
                        )}
                    </div>

                    {/* Optional Details Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="h-px flex-1 bg-border"></div>
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Optional Details (Recommended)
                            </span>
                            <div className="h-px flex-1 bg-border"></div>
                        </div>

                        <p className="text-xs text-muted-foreground">Help us serve them better</p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <label htmlFor="new_member_dob" className="block text-sm font-medium text-foreground">
                                    Date of Birth
                                </label>
                                <Input
                                    id="new_member_dob"
                                    type="date"
                                    value={state.newMemberDOB}
                                    onChange={(e) => setState((prev) => ({
                                        ...prev,
                                        newMemberDOB: e.target.value,
                                        newMemberAge: ''
                                    }))}
                                    max={new Date().toISOString().split('T')[0]}
                                    disabled={state.loading}
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="new_member_age" className="block text-sm font-medium text-foreground">
                                    Age
                                </label>
                                <Select
                                    value={state.newMemberAge}
                                    onValueChange={(value) => setState((prev) => ({
                                        ...prev,
                                        newMemberAge: value,
                                        newMemberDOB: ''
                                    }))}
                                    disabled={state.loading || !!state.newMemberDOB}
                                >
                                    <SelectTrigger
                                        id="new_member_age"
                                        className={state.newMemberDOB ? 'opacity-50 cursor-not-allowed' : ''}
                                    >
                                        <SelectValue placeholder="Select age" />
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

                        <div className="space-y-2">
                            <label htmlFor="new_member_gender" className="block text-sm font-medium text-foreground">
                                Gender
                            </label>
                            <Select
                                value={state.newMemberGender}
                                onValueChange={(value) => setState((prev) => ({ ...prev, newMemberGender: value }))}
                                disabled={state.loading}
                            >
                                <SelectTrigger id="new_member_gender">
                                    <SelectValue placeholder="Select gender (optional)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="male">Male</SelectItem>
                                    <SelectItem value="female">Female</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="new_member_email" className="block text-sm font-medium text-foreground">
                                Email
                            </label>
                            <Input
                                id="new_member_email"
                                type="email"
                                value={state.newMemberEmail}
                                onChange={(e) => setState((prev) => ({ ...prev, newMemberEmail: e.target.value }))}
                                placeholder="email@example.com (optional)"
                                disabled={state.loading}
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="new_member_blood_group" className="block text-sm font-medium text-foreground">
                                Blood Group
                            </label>
                            <Select
                                value={state.newMemberBloodGroup}
                                onValueChange={(value) => setState((prev) => ({ ...prev, newMemberBloodGroup: value }))}
                                disabled={state.loading}
                            >
                                <SelectTrigger id="new_member_blood_group">
                                    <SelectValue placeholder="Select blood group (optional)" />
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
                        onClick={state.submitMode === 'link' ? handleAcceptDetectedMember : handleMemberDetailsSubmit}
                        className="w-full"
                        disabled={state.loading || !state.relation || !state.newMemberName.trim() || !state.newMemberPhone.trim() || state.newMemberPhone === '+91'}
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
            )}

            {state.step === 'search' && (
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold">Link Existing Patient</h3>
                    <p className="text-sm text-muted-foreground">Search for an existing patient record to link</p>

                    {/* Method Selection */}
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-foreground">Search by</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button
                                onClick={() => setState((prev) => ({ ...prev, lookupMethod: 'phone', searchValue: '', foundMember: null, error: '' }))}
                                className={cn(
                                    "p-3 rounded-xl border-2 transition-all text-left",
                                    state.lookupMethod === 'phone'
                                        ? "border-primary bg-primary/5"
                                        : "border-border hover:border-primary/50"
                                )}
                            >
                                <h4 className="font-semibold text-sm mb-1">Phone Number</h4>
                                <p className="text-xs text-muted-foreground">Mobile number</p>
                            </button>
                            <button
                                onClick={() => setState((prev) => ({ ...prev, lookupMethod: 'patient_id', searchValue: '', foundMember: null, error: '' }))}
                                className={cn(
                                    "p-3 rounded-xl border-2 transition-all text-left",
                                    state.lookupMethod === 'patient_id'
                                        ? "border-primary bg-primary/5"
                                        : "border-border hover:border-primary/50"
                                )}
                            >
                                <h4 className="font-semibold text-sm mb-1">Patient ID</h4>
                                <p className="text-xs text-muted-foreground">PT-XXXXXX</p>
                            </button>
                        </div>
                    </div>

                    {/* Search Input */}
                    <div className="space-y-2">
                        <label htmlFor="search_value" className="block text-sm font-medium text-foreground">
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
                    <h3 className="text-lg font-semibold">
                        Verify {state.contactType === 'email' ? 'Email' : 'Phone Number'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Enter the 6-digit OTP sent to {state.contactType === 'email' ? state.email : state.foundMember?.phone}
                    </p>

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
