import { FormEvent, useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthLayout from '@/components/layouts/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';

export default function Login() {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post('/login', {
            onFinish: () => reset('password'),
        });
    };

    return (
        <>
            <Head title="Login" />
            <AuthLayout
                title="Welcome back"
                description="Sign in to your account to continue"
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    {errors.email && (
                        <Alert variant="destructive">
                            <AlertCircle className="size-4" />
                            <AlertDescription>{errors.email}</AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="name@example.com"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            autoComplete="email"
                            autoFocus
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="Enter your password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            autoComplete="current-password"
                            required
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            id="remember"
                            type="checkbox"
                            checked={data.remember}
                            onChange={(e) => setData('remember', e.target.checked)}
                            className="size-4 rounded border-border text-primary focus:ring-primary"
                        />
                        <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
                            Remember me
                        </Label>
                    </div>

                    <Button type="submit" className="w-full" disabled={processing}>
                        {processing && <Loader2 className="mr-2 size-4 animate-spin" />}
                        Sign in
                    </Button>
                </form>
            </AuthLayout>
        </>
    );
}

