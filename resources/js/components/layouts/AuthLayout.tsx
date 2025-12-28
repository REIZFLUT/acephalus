import { PropsWithChildren } from 'react';
import { Link } from '@inertiajs/react';

interface AuthLayoutProps extends PropsWithChildren {
    title?: string;
    description?: string;
}

export default function AuthLayout({ children, title, description }: AuthLayoutProps) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
            {/* Background decoration */}
            <div className="absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-primary/5 via-transparent to-transparent rounded-full blur-3xl" />
                <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-primary/5 via-transparent to-transparent rounded-full blur-3xl" />
            </div>

            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="flex flex-col items-center mb-8">
                    <Link href="/" className="flex items-center gap-3 mb-4">
                        <div className="size-12 rounded-xl bg-primary flex items-center justify-center">
                            <svg
                                className="size-7 text-primary-foreground"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                                />
                            </svg>
                        </div>
                        <span className="text-2xl font-bold text-foreground">Continy</span>
                    </Link>
                    {title && (
                        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
                    )}
                    {description && (
                        <p className="text-muted-foreground mt-2 text-center">{description}</p>
                    )}
                </div>

                {/* Content Card */}
                <div className="bg-card border border-border rounded-xl p-8 shadow-lg">
                    {children}
                </div>

                {/* Footer */}
                <p className="text-center text-sm text-muted-foreground mt-8">
                    © {new Date().getFullYear()} Continy CMS. All rights reserved.
                </p>
            </div>
        </div>
    );
}

