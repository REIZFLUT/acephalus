import { PropsWithChildren } from 'react';
import { Link } from '@inertiajs/react';
import { ScanFace } from 'lucide-react';

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
                            <ScanFace className="size-7 text-primary-foreground" />
                        </div>
                        <span className="text-2xl font-bold text-foreground">acephalus</span>
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
                    © {new Date().getFullYear()} acephalus CMS. All rights reserved.
                </p>
            </div>
        </div>
    );
}

