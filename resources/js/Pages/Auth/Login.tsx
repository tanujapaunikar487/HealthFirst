import { Head, Link, useForm, usePage } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Checkbox } from '@/Components/ui/checkbox';
import { FormEventHandler } from 'react';
import { Alert } from '@/Components/ui/alert';
import SocialLoginButtons from '@/Components/Auth/SocialLoginButtons';
import SocialDivider from '@/Components/Auth/SocialDivider';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
    socialLoginEnabled?: {
        google?: boolean;
        apple?: boolean;
    };
}

export default function Login({ status, canResetPassword, socialLoginEnabled }: LoginProps) {
    const { flash } = usePage().props as { flash?: { error?: string } };
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Sign In" />

            <div className="text-center mb-6">
                <h1 className="text-detail-title text-foreground">
                    Welcome back
                </h1>
                <p className="text-body text-muted-foreground mt-1">
                    Sign in to your account to continue
                </p>
            </div>

            {status && (
                <div className="mb-4">
                    <Alert variant="success" hideIcon>{status}</Alert>
                </div>
            )}

            {flash?.error && (
                <div className="mb-4">
                    <Alert variant="error" hideIcon>{flash.error}</Alert>
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
                        autoComplete="username"
                        autoFocus
                        className={errors.email ? 'border-destructive' : ''}
                    />
                    {errors.email && (
                        <p className="text-body text-destructive">{errors.email}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                        id="password"
                        type="password"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        autoComplete="current-password"
                        className={errors.password ? 'border-destructive' : ''}
                    />
                    {errors.password && (
                        <p className="text-body text-destructive">{errors.password}</p>
                    )}
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="remember"
                            checked={data.remember}
                            onCheckedChange={(checked) =>
                                setData('remember', checked as boolean)
                            }
                        />
                        <Label htmlFor="remember" className="text-body cursor-pointer">
                            Remember me
                        </Label>
                    </div>

                    {canResetPassword && (
                        <Link
                            href={route('password.request')}
                            className="text-body text-primary hover:underline"
                        >
                            Forgot password?
                        </Link>
                    )}
                </div>

                <Button type="submit" className="w-full" disabled={processing}>
                    {processing ? 'Signing in...' : 'Sign in'}
                </Button>

                {(socialLoginEnabled?.google || socialLoginEnabled?.apple) && (
                    <>
                        <SocialDivider />
                        <SocialLoginButtons isProcessing={processing} enabled={socialLoginEnabled} />
                    </>
                )}

                <p className="text-center text-body text-muted-foreground">
                    Don't have an account?{' '}
                    <Link href={route('register')} className="text-primary hover:underline">
                        Sign up
                    </Link>
                </p>
            </form>
        </GuestLayout>
    );
}
