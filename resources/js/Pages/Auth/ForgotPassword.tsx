import { Head, Link, useForm } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { FormEventHandler } from 'react';

interface ForgotPasswordProps {
    status?: string;
}

export default function ForgotPassword({ status }: ForgotPasswordProps) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('password.email'));
    };

    return (
        <GuestLayout>
            <Head title="Forgot Password" />

            <div className="text-center mb-6">
                <h1 className="text-2xl font-bold" style={{ color: '#00184D' }}>
                    Forgot your password?
                </h1>
                <p className="text-[14px] text-muted-foreground mt-1">
                    No problem. Enter your email and we'll send you a reset link.
                </p>
            </div>

            {status && (
                <div className="mb-4 text-[14px] font-medium text-green-600 bg-green-50 p-3 rounded-lg">
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        autoFocus
                        className={errors.email ? 'border-red-500' : ''}
                    />
                    {errors.email && (
                        <p className="text-[14px] text-red-600">{errors.email}</p>
                    )}
                </div>

                <Button type="submit" className="w-full" disabled={processing}>
                    {processing ? 'Sending...' : 'Send reset link'}
                </Button>

                <p className="text-center text-[14px] text-muted-foreground">
                    Remember your password?{' '}
                    <Link href={route('login')} className="text-blue-600 hover:underline">
                        Sign in
                    </Link>
                </p>
            </form>
        </GuestLayout>
    );
}
