import { FormEvent } from 'react';
import { useForm } from '@inertiajs/react';
import AppLayout from '@/components/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, User as UserIcon, Lock } from 'lucide-react';
import type { PageProps, User } from '@/types';

interface ProfileEditProps extends PageProps {
    user: User;
}

export default function ProfileEdit({ user }: ProfileEditProps) {
    const profileForm = useForm({
        name: user.name,
        email: user.email,
    });

    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const handleProfileSubmit = (e: FormEvent) => {
        e.preventDefault();
        profileForm.put('/profile');
    };

    const handlePasswordSubmit = (e: FormEvent) => {
        e.preventDefault();
        passwordForm.put('/profile/password', {
            onSuccess: () => {
                passwordForm.reset();
            },
        });
    };

    return (
        <AppLayout
            title="Profile Settings"
            breadcrumbs={[
                { label: 'Profile Settings' },
            ]}
        >
            <div className="max-w-2xl space-y-6">
                {/* Profile Information */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                                <UserIcon className="size-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle>Profile Information</CardTitle>
                                <CardDescription>
                                    Update your name and email address
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleProfileSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={profileForm.data.name}
                                    onChange={(e) => profileForm.setData('name', e.target.value)}
                                    autoFocus
                                />
                                {profileForm.errors.name && (
                                    <p className="text-sm text-destructive">{profileForm.errors.name}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={profileForm.data.email}
                                    onChange={(e) => profileForm.setData('email', e.target.value)}
                                />
                                {profileForm.errors.email && (
                                    <p className="text-sm text-destructive">{profileForm.errors.email}</p>
                                )}
                            </div>

                            <Button type="submit" disabled={profileForm.processing}>
                                {profileForm.processing && <Loader2 className="size-4 mr-2 animate-spin" />}
                                Save Changes
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Change Password */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                                <Lock className="size-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle>Change Password</CardTitle>
                                <CardDescription>
                                    Ensure your account uses a strong password
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handlePasswordSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="current_password">Current Password</Label>
                                <Input
                                    id="current_password"
                                    type="password"
                                    value={passwordForm.data.current_password}
                                    onChange={(e) => passwordForm.setData('current_password', e.target.value)}
                                />
                                {passwordForm.errors.current_password && (
                                    <p className="text-sm text-destructive">{passwordForm.errors.current_password}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">New Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={passwordForm.data.password}
                                    onChange={(e) => passwordForm.setData('password', e.target.value)}
                                />
                                {passwordForm.errors.password && (
                                    <p className="text-sm text-destructive">{passwordForm.errors.password}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password_confirmation">Confirm New Password</Label>
                                <Input
                                    id="password_confirmation"
                                    type="password"
                                    value={passwordForm.data.password_confirmation}
                                    onChange={(e) => passwordForm.setData('password_confirmation', e.target.value)}
                                />
                            </div>

                            <Button type="submit" disabled={passwordForm.processing}>
                                {passwordForm.processing && <Loader2 className="size-4 mr-2 animate-spin" />}
                                Update Password
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}


