import { Head, Link, useForm, usePage } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { FormEventHandler } from 'react';
import SocialLoginButtons from '@/Components/Auth/SocialLoginButtons';
import SocialDivider from '@/Components/Auth/SocialDivider';

interface RegisterProps {
    socialLoginEnabled?: {
        google?: boolean;
        apple?: boolean;
    };
}

export default function Register({ socialLoginEnabled }: RegisterProps) {
    const { flash } = usePage().props as { flash?: { error?: string } };
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Sign Up" />

            <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-foreground">
                    Create your account
                </h1>
                <p className="text-[14px] text-muted-foreground mt-1">
                    Get started with your healthcare journey
                </p>
            </div>

            {flash?.error && (
                <div className="mb-4 text-[14px] font-medium text-destructive bg-destructive/10 p-3 rounded-lg">
                    {flash.error}
                </div>
            )}

            <form onSubmit={submit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                        id="name"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        autoComplete="name"
                        autoFocus
                        className={errors.name ? 'border-destructive' : ''}
                    />
                    {errors.name && (
                        <p className="text-[14px] text-destructive">{errors.name}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        autoComplete="username"
                        className={errors.email ? 'border-destructive' : ''}
                    />
                    {errors.email && (
                        <p className="text-[14px] text-destructive">{errors.email}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                        id="password"
                        type="password"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        autoComplete="new-password"
                        className={errors.password ? 'border-destructive' : ''}
                    />
                    {errors.password && (
                        <p className="text-[14px] text-destructive">{errors.password}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password_confirmation">Confirm Password</Label>
                    <Input
                        id="password_confirmation"
                        type="password"
                        value={data.password_confirmation}
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        autoComplete="new-password"
                        className={errors.password_confirmation ? 'border-destructive' : ''}
                    />
                    {errors.password_confirmation && (
                        <p className="text-[14px] text-destructive">{errors.password_confirmation}</p>
                    )}
                </div>

                <Button type="submit" className="w-full" disabled={processing}>
                    {processing ? 'Creating account...' : 'Create account'}
                </Button>

                {(socialLoginEnabled?.google || socialLoginEnabled?.apple) && (
                    <>
                        <SocialDivider />
                        <SocialLoginButtons isProcessing={processing} enabled={socialLoginEnabled} />
                    </>
                )}

                <p className="text-center text-[14px] text-muted-foreground">
                    Already have an account?{' '}
                    <Link href={route('login')} className="text-primary hover:underline">
                        Sign in
                    </Link>
                </p>
            </form>
        </GuestLayout>
    );
}
