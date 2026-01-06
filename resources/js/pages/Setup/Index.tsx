import { FormEvent, useState, useEffect } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Loader2,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Database,
    User,
    Settings,
    ChevronRight,
    ChevronLeft,
    Rocket,
    Server,
    Key,
    Globe,
    FileCode,
    ExternalLink,
} from 'lucide-react';

interface SystemInfo {
    php_version: string;
    laravel_version: string;
    mongodb_extension: boolean;
    sqlite_extension: boolean;
    sqlite_connected: boolean;
    mongodb_connected: boolean;
    storage_writable: boolean;
    env_exists: boolean;
    app_key_set: boolean;
}

interface EnvVar {
    description: string;
    configured: boolean;
    value: string | null;
}

interface Props {
    systemInfo: SystemInfo;
    envVars: Record<string, EnvVar>;
}

export default function SetupIndex({ systemInfo, envVars }: Props) {
    const [step, setStep] = useState(1);
    const [isCheckingConnections, setIsCheckingConnections] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<{
        sqlite: boolean | null;
        mongodb: boolean | null;
    }>({
        sqlite: systemInfo.sqlite_connected,
        mongodb: systemInfo.mongodb_connected,
    });

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        run_seeders: true,
    });

    const totalSteps = 3;

    const checkConnections = async () => {
        setIsCheckingConnections(true);
        try {
            const response = await fetch('/setup/check-connections', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });
            const result = await response.json();
            setConnectionStatus(result);
        } catch (error) {
            console.error('Connection check failed:', error);
        } finally {
            setIsCheckingConnections(false);
        }
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post('/setup', {
            onSuccess: () => {
                // Redirect is handled by the controller
            },
        });
    };

    const canProceedToStep2 = systemInfo.env_exists && systemInfo.app_key_set;
    const canProceedToStep3 = connectionStatus.sqlite && connectionStatus.mongodb;

    const StatusIcon = ({ status }: { status: boolean | null }) => {
        if (status === null) return <div className="size-5 rounded-full bg-muted animate-pulse" />;
        return status ? (
            <CheckCircle2 className="size-5 text-emerald-500" />
        ) : (
            <XCircle className="size-5 text-destructive" />
        );
    };

    return (
        <>
            <Head title="Setup - Continy CMS" />
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
                {/* Decorative elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-violet-500/5 to-cyan-500/5 rounded-full blur-3xl" />
                </div>

                <div className="relative min-h-screen flex flex-col items-center justify-center p-4 sm:p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 mb-4 shadow-lg shadow-violet-500/25">
                            <Rocket className="size-8 text-white" />
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                            Welcome to Continy
                        </h1>
                        <p className="text-slate-400 mt-2">Let's set up your headless CMS in just a few steps</p>
                    </div>

                    {/* Progress Steps */}
                    <div className="flex items-center gap-2 mb-8">
                        {[1, 2, 3].map((s) => (
                            <div key={s} className="flex items-center">
                                <button
                                    onClick={() => s < step && setStep(s)}
                                    disabled={s > step}
                                    className={`size-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                                        s === step
                                            ? 'bg-gradient-to-br from-violet-500 to-cyan-500 text-white shadow-lg shadow-violet-500/25'
                                            : s < step
                                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-pointer hover:bg-emerald-500/30'
                                            : 'bg-slate-800 text-slate-500 border border-slate-700'
                                    }`}
                                >
                                    {s < step ? <CheckCircle2 className="size-5" /> : s}
                                </button>
                                {s < 3 && (
                                    <div
                                        className={`w-12 sm:w-20 h-0.5 mx-2 ${
                                            s < step ? 'bg-emerald-500/50' : 'bg-slate-700'
                                        }`}
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Content Card */}
                    <div className="w-full max-w-2xl bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
                        <form onSubmit={handleSubmit}>
                            {/* Step 1: Environment Check */}
                            {step === 1 && (
                                <div className="p-6 sm:p-8">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="size-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                                            <FileCode className="size-5 text-violet-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-semibold">Environment Configuration</h2>
                                            <p className="text-sm text-slate-400">Configure your .env file before proceeding</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4 mb-6">
                                        {/* System Requirements */}
                                        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                                            <h3 className="font-medium mb-3 flex items-center gap-2">
                                                <Server className="size-4 text-slate-400" />
                                                System Requirements
                                            </h3>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex items-center justify-between py-1">
                                                    <span className="text-slate-400">PHP Version</span>
                                                    <span className="flex items-center gap-2">
                                                        <span className="text-slate-200">{systemInfo.php_version}</span>
                                                        <StatusIcon status={parseFloat(systemInfo.php_version) >= 8.2} />
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between py-1">
                                                    <span className="text-slate-400">MongoDB Extension</span>
                                                    <StatusIcon status={systemInfo.mongodb_extension} />
                                                </div>
                                                <div className="flex items-center justify-between py-1">
                                                    <span className="text-slate-400">SQLite Extension</span>
                                                    <StatusIcon status={systemInfo.sqlite_extension} />
                                                </div>
                                                <div className="flex items-center justify-between py-1">
                                                    <span className="text-slate-400">Storage Writable</span>
                                                    <StatusIcon status={systemInfo.storage_writable} />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Environment Variables */}
                                        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                                            <h3 className="font-medium mb-3 flex items-center gap-2">
                                                <Key className="size-4 text-slate-400" />
                                                Environment Variables
                                            </h3>
                                            <div className="space-y-3 text-sm">
                                                {Object.entries(envVars).map(([key, info]) => (
                                                    <div key={key} className="flex items-start justify-between gap-4 py-1">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <code className="text-violet-400 text-xs bg-violet-500/10 px-1.5 py-0.5 rounded">
                                                                    {key}
                                                                </code>
                                                                {info.value && (
                                                                    <span className="text-slate-500 text-xs truncate max-w-32">
                                                                        {info.value}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-slate-500 text-xs mt-0.5">{info.description}</p>
                                                        </div>
                                                        <StatusIcon status={info.configured} />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Instructions */}
                                        {!canProceedToStep2 && (
                                            <Alert className="bg-amber-500/10 border-amber-500/30 text-amber-200">
                                                <AlertCircle className="size-4 text-amber-400" />
                                                <AlertTitle>Configuration Required</AlertTitle>
                                                <AlertDescription className="text-amber-200/80">
                                                    <p className="mb-2">Please configure your .env file with the following:</p>
                                                    <ol className="list-decimal list-inside space-y-1 text-sm">
                                                        {!systemInfo.env_exists && (
                                                            <li>Copy <code className="text-amber-300">.env.example</code> to <code className="text-amber-300">.env</code></li>
                                                        )}
                                                        {!systemInfo.app_key_set && (
                                                            <li>Run: <code className="text-amber-300">php artisan key:generate</code></li>
                                                        )}
                                                        <li>Set <code className="text-amber-300">MONGO_DSN</code> and <code className="text-amber-300">MONGO_DATABASE</code></li>
                                                    </ol>
                                                </AlertDescription>
                                            </Alert>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Database Connections */}
                            {step === 2 && (
                                <div className="p-6 sm:p-8">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="size-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                                            <Database className="size-5 text-cyan-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-semibold">Database Connections</h2>
                                            <p className="text-sm text-slate-400">Verify your database connections</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4 mb-6">
                                        {/* SQLite Connection */}
                                        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                                        <Database className="size-5 text-blue-400" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-medium">SQLite Database</h4>
                                                        <p className="text-sm text-slate-400">User authentication & sessions</p>
                                                    </div>
                                                </div>
                                                <StatusIcon status={connectionStatus.sqlite} />
                                            </div>
                                        </div>

                                        {/* MongoDB Connection */}
                                        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                                                        <svg className="size-5 text-green-400" viewBox="0 0 24 24" fill="currentColor">
                                                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 2c2.76 0 5 2.24 5 5 0 2.88-2.88 7.19-5 9.88C9.92 16.21 7 11.85 7 9c0-2.76 2.24-5 5-5z"/>
                                                            <circle cx="12" cy="9" r="2.5"/>
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-medium">MongoDB Database</h4>
                                                        <p className="text-sm text-slate-400">Content storage (Collections, Media, etc.)</p>
                                                    </div>
                                                </div>
                                                <StatusIcon status={connectionStatus.mongodb} />
                                            </div>
                                        </div>

                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={checkConnections}
                                            disabled={isCheckingConnections}
                                            className="w-full bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200"
                                        >
                                            {isCheckingConnections ? (
                                                <>
                                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                                    Checking connections...
                                                </>
                                            ) : (
                                                <>
                                                    <Database className="mr-2 size-4" />
                                                    Recheck Connections
                                                </>
                                            )}
                                        </Button>

                                        {!canProceedToStep3 && (
                                            <Alert className="bg-red-500/10 border-red-500/30 text-red-200">
                                                <XCircle className="size-4 text-red-400" />
                                                <AlertTitle>Connection Failed</AlertTitle>
                                                <AlertDescription className="text-red-200/80">
                                                    {!connectionStatus.sqlite && (
                                                        <p className="mb-1">• SQLite: Check your database file permissions</p>
                                                    )}
                                                    {!connectionStatus.mongodb && (
                                                        <p>• MongoDB: Verify MONGO_DSN and MONGO_DATABASE in your .env file</p>
                                                    )}
                                                </AlertDescription>
                                            </Alert>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Create Admin */}
                            {step === 3 && (
                                <div className="p-6 sm:p-8">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="size-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                            <User className="size-5 text-emerald-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-semibold">Create Super Admin</h2>
                                            <p className="text-sm text-slate-400">Set up your administrator account</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {(errors.database || errors.seeder) && (
                                            <Alert className="bg-red-500/10 border-red-500/30 text-red-200">
                                                <AlertCircle className="size-4 text-red-400" />
                                                <AlertDescription>{errors.database || errors.seeder}</AlertDescription>
                                            </Alert>
                                        )}

                                        <div className="space-y-2">
                                            <Label htmlFor="name" className="text-slate-300">Full Name</Label>
                                            <Input
                                                id="name"
                                                type="text"
                                                placeholder="John Doe"
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                className="bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500 focus:border-violet-500 focus:ring-violet-500/20"
                                                required
                                            />
                                            {errors.name && <p className="text-sm text-red-400">{errors.name}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="email" className="text-slate-300">Email Address</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="admin@example.com"
                                                value={data.email}
                                                onChange={(e) => setData('email', e.target.value)}
                                                className="bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500 focus:border-violet-500 focus:ring-violet-500/20"
                                                required
                                            />
                                            {errors.email && <p className="text-sm text-red-400">{errors.email}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="password" className="text-slate-300">Password</Label>
                                            <Input
                                                id="password"
                                                type="password"
                                                placeholder="Minimum 8 characters"
                                                value={data.password}
                                                onChange={(e) => setData('password', e.target.value)}
                                                className="bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500 focus:border-violet-500 focus:ring-violet-500/20"
                                                required
                                            />
                                            {errors.password && <p className="text-sm text-red-400">{errors.password}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="password_confirmation" className="text-slate-300">Confirm Password</Label>
                                            <Input
                                                id="password_confirmation"
                                                type="password"
                                                placeholder="Repeat your password"
                                                value={data.password_confirmation}
                                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                                className="bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500 focus:border-violet-500 focus:ring-violet-500/20"
                                                required
                                            />
                                        </div>

                                        <div className="flex items-center gap-3 pt-2">
                                            <Checkbox
                                                id="run_seeders"
                                                checked={data.run_seeders}
                                                onCheckedChange={(checked) => setData('run_seeders', checked as boolean)}
                                                className="border-slate-600 data-[state=checked]:bg-violet-500 data-[state=checked]:border-violet-500"
                                            />
                                            <div>
                                                <Label htmlFor="run_seeders" className="text-slate-300 cursor-pointer">
                                                    Initialize system data
                                                </Label>
                                                <p className="text-xs text-slate-500">
                                                    Creates default roles, permissions, wrapper purposes, and media folders
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Footer Actions */}
                            <div className="px-6 sm:px-8 py-4 bg-slate-800/50 border-t border-slate-700/50 flex items-center justify-between">
                                <div>
                                    {step > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() => setStep(step - 1)}
                                            className="text-slate-400 hover:text-slate-200"
                                        >
                                            <ChevronLeft className="mr-1 size-4" />
                                            Back
                                        </Button>
                                    )}
                                </div>
                                <div>
                                    {step < totalSteps ? (
                                        <Button
                                            type="button"
                                            onClick={() => setStep(step + 1)}
                                            disabled={
                                                (step === 1 && !canProceedToStep2) ||
                                                (step === 2 && !canProceedToStep3)
                                            }
                                            className="bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600 text-white shadow-lg shadow-violet-500/25"
                                        >
                                            Continue
                                            <ChevronRight className="ml-1 size-4" />
                                        </Button>
                                    ) : (
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                            className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white shadow-lg shadow-emerald-500/25"
                                        >
                                            {processing ? (
                                                <>
                                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                                    Setting up...
                                                </>
                                            ) : (
                                                <>
                                                    <Rocket className="mr-2 size-4" />
                                                    Complete Setup
                                                </>
                                            )}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Help Text */}
                    <p className="text-center text-sm text-slate-500 mt-6 max-w-md">
                        Need help? Check out the{' '}
                        <a href="https://github.com/your-org/continy" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:text-violet-300">
                            documentation
                            <ExternalLink className="inline-block ml-1 size-3" />
                        </a>
                    </p>
                </div>
            </div>
        </>
    );
}

