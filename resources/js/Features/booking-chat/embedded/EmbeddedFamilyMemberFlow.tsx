import React, { useState } from 'react';
import { User, Users, ChevronLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { RelationshipSelector } from '@/Components/RelationshipSelector';
import { OtpInput } from '@/Components/OtpInput';
import { MemberSearchCard } from '@/Components/MemberSearchCard';
import { cn } from '@/Lib/utils';

type Step =
    | 'choice'
    | 'guest_name'
    | 'relationship'
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
    memberType: 'guest' | 'family' | null;
    guestName: string;
    relation: string;
    lookupMethod: 'phone' | 'patient_id' | null;
    searchValue: string;
    foundMember: MemberData | null;
    alreadyLinked: boolean;
    otpValue: string;
    verificationToken: string;
    error: string;
    loading: boolean;
}

interface Props {
    onComplete: (data: {
        member_type: 'guest' | 'family';
        member_id?: number;
        member_name: string;
        relation?: string;
    }) => void;
    onCancel: () => void;
}

export default function EmbeddedFamilyMemberFlow({ onComplete, onCancel }: Props) {
    const [state, setState] = useState<FlowState>({
        step: 'choice',
        memberType: null,
        guestName: '',
        relation: '',
        lookupMethod: null,
        searchValue: '',
        foundMember: null,
        alreadyLinked: false,
        otpValue: '',
        verificationToken: '',
        error: '',
        loading: false,
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

    // Step 1: Choice between Guest or Family Member
    const handleChoice = (type: 'guest' | 'family') => {
        setState((prev) => ({ ...prev, memberType: type }));
        setStep(type === 'guest' ? 'guest_name' : 'relationship');
    };

    // Step 2: Guest Name Input
    const handleGuestSubmit = () => {
        if (!state.guestName.trim()) {
            setError('Please enter a name');
            return;
        }

        onComplete({
            member_type: 'guest',
            member_name: state.guestName,
        });
    };

    // Step 3: Relationship Selection
    const handleRelationshipNext = () => {
        if (!state.relation) {
            setError('Please select a relationship');
            return;
        }
        setStep('lookup_method');
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

    // Send OTP
    const handleSendOtp = async () => {
        if (!state.foundMember?.phone) {
            setError('Phone number not available');
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
                    phone: state.foundMember.phone,
                    purpose: 'link_member',
                }),
            });

            if (response.ok) {
                setStep('otp');
                setLoading(false);
            } else {
                setError('Failed to send OTP. Please try again.');
                setLoading(false);
            }
        } catch (error) {
            setError('Failed to send OTP. Please try again.');
            setLoading(false);
        }
    };

    // Verify OTP
    const handleVerifyOtp = async (otp: string) => {
        if (!state.foundMember?.phone) return;

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
                    phone: state.foundMember.phone,
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
                    onComplete({
                        member_type: 'family',
                        member_id: data.member_data.id,
                        member_name: data.member_data.name,
                        relation: data.member_data.relation,
                    });
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
        // Create new member with minimal info
        // In the real flow, this would need name, age, gender fields
        // For now, just simulate completion
        setError('Add as new member flow not yet implemented');
    };

    // Back navigation
    const handleBack = () => {
        const backMap: Record<Step, Step> = {
            choice: 'choice',
            guest_name: 'choice',
            relationship: 'choice',
            lookup_method: 'relationship',
            search: 'lookup_method',
            otp: 'search',
            success: 'success',
        };
        setStep(backMap[state.step]);
    };

    const canGoBack = !['choice', 'success'].includes(state.step) && !state.loading;

    return (
        <div className="p-6 space-y-6">
            {/* Header with Back Button */}
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
                    <h3 className="text-lg font-semibold">Add Family Member or Guest</h3>
                    <p className="text-sm text-muted-foreground">
                        Choose whether you're adding a family member or a guest
                    </p>

                    <div className="grid gap-3">
                        <button
                            onClick={() => handleChoice('guest')}
                            className="flex items-center gap-4 p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left"
                        >
                            <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                                <User className="h-6 w-6" />
                            </div>
                            <div>
                                <h4 className="font-semibold">Guest</h4>
                                <p className="text-sm text-muted-foreground">
                                    Quick booking for someone else (name only)
                                </p>
                            </div>
                        </button>

                        <button
                            onClick={() => handleChoice('family')}
                            className="flex items-center gap-4 p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left"
                        >
                            <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                                <Users className="h-6 w-6" />
                            </div>
                            <div>
                                <h4 className="font-semibold">Family Member</h4>
                                <p className="text-sm text-muted-foreground">
                                    Add a family member with full profile
                                </p>
                            </div>
                        </button>
                    </div>

                    <Button variant="ghost" onClick={onCancel} className="w-full">
                        Cancel
                    </Button>
                </div>
            )}

            {state.step === 'guest_name' && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Guest Name</h3>
                    <p className="text-sm text-muted-foreground">
                        Enter the guest's name to continue
                    </p>

                    <div className="space-y-2">
                        <Label htmlFor="guest_name">Name</Label>
                        <Input
                            id="guest_name"
                            value={state.guestName}
                            onChange={(e) => setState((prev) => ({ ...prev, guestName: e.target.value }))}
                            placeholder="Enter guest name"
                            autoFocus
                        />
                    </div>

                    <Button onClick={handleGuestSubmit} className="w-full" disabled={!state.guestName.trim()}>
                        Continue
                    </Button>
                </div>
            )}

            {state.step === 'relationship' && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Select Relationship</h3>
                    <p className="text-sm text-muted-foreground">
                        What is this person's relationship to you?
                    </p>

                    <RelationshipSelector
                        value={state.relation}
                        onChange={(value) => setState((prev) => ({ ...prev, relation: value }))}
                    />

                    <Button onClick={handleRelationshipNext} className="w-full" disabled={!state.relation}>
                        Continue
                    </Button>
                </div>
            )}

            {state.step === 'lookup_method' && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Search Method</h3>
                    <p className="text-sm text-muted-foreground">
                        How would you like to search for this member?
                    </p>

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
                    <h3 className="text-lg font-semibold">
                        {state.lookupMethod === 'phone' ? 'Enter Phone Number' : 'Enter Patient ID'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        {state.lookupMethod === 'phone'
                            ? 'Enter the mobile number of the family member'
                            : 'Enter the Patient ID (format: PT-XXXXXX)'}
                    </p>

                    <div className="space-y-2">
                        <Label htmlFor="search_value">
                            {state.lookupMethod === 'phone' ? 'Phone Number' : 'Patient ID'}
                        </Label>
                        <Input
                            id="search_value"
                            value={state.searchValue}
                            onChange={(e) => setState((prev) => ({ ...prev, searchValue: e.target.value }))}
                            placeholder={state.lookupMethod === 'phone' ? '+91XXXXXXXXXX' : 'PT-000001'}
                            autoFocus
                        />
                    </div>

                    {state.foundMember && (
                        <div className="space-y-3">
                            <p className="text-sm font-medium text-green-600">Member Found!</p>
                            <MemberSearchCard member={state.foundMember} alreadyLinked={state.alreadyLinked} />

                            {!state.alreadyLinked && (
                                <Button onClick={handleSendOtp} className="w-full" disabled={state.loading}>
                                    {state.loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Sending OTP...
                                        </>
                                    ) : (
                                        'Send OTP to Verify'
                                    )}
                                </Button>
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
                    <h3 className="text-lg font-semibold">Verify Phone Number</h3>
                    <p className="text-sm text-muted-foreground">
                        Enter the 6-digit OTP sent to {state.foundMember?.phone}
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
