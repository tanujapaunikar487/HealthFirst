import { Head, useForm } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { FormEventHandler } from 'react';

export default function ConfirmPassword() {
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Confirm Password" />

            <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-foreground">
                    Confirm your password
                </h1>
                <p className="text-[14px] text-muted-foreground mt-1">
                    This is a secure area. Please confirm your password to continue.
                </p>
            </div>

            <form onSubmit={submit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                        id="password"
                        type="password"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        autoFocus
                        className={errors.password ? 'border-destructive' : ''}
                    />
                    {errors.password && (
                        <p className="text-[14px] text-destructive">{errors.password}</p>
                    )}
                </div>

                <Button type="submit" className="w-full" disabled={processing}>
                    {processing ? 'Confirming...' : 'Confirm'}
                </Button>
            </form>
        </GuestLayout>
    );
}
