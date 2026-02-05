import { Head, Link, useForm } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout';
import { Button } from '@/Components/ui/button';
import { FormEventHandler } from 'react';

interface VerifyEmailProps {
    status?: string;
}

export default function VerifyEmail({ status }: VerifyEmailProps) {
    const { post, processing } = useForm({});

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('verification.send'));
    };

    return (
        <GuestLayout>
            <Head title="Email Verification" />

            <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-foreground">
                    Verify your email
                </h1>
                <p className="text-[14px] text-muted-foreground mt-1">
                    Thanks for signing up! Please verify your email address by clicking the link we sent you.
                </p>
            </div>

            {status === 'verification-link-sent' && (
                <div className="mb-4 text-[14px] font-medium text-success bg-success/10 p-3 rounded-lg">
                    A new verification link has been sent to your email address.
                </div>
            )}

            <form onSubmit={submit} className="space-y-4">
                <Button type="submit" className="w-full" disabled={processing}>
                    {processing ? 'Sending...' : 'Resend verification email'}
                </Button>

                <Link
                    href={route('logout')}
                    method="post"
                    as="button"
                    className="w-full text-center block text-[14px] text-muted-foreground hover:underline"
                >
                    Sign out
                </Link>
            </form>
        </GuestLayout>
    );
}
