<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class SetupController extends Controller
{
    /**
     * Check if setup mode is enabled via environment variable.
     */
    public static function isSetupEnabled(): bool
    {
        return config('app.setup_enabled', false) === true;
    }

    /**
     * Check if setup is needed (no super-admin exists).
     */
    public static function isSetupRequired(): bool
    {
        try {
            // Check if users table exists
            if (! \Schema::hasTable('users')) {
                return true;
            }

            // Check if there are any users with super-admin role
            $superAdminRole = Role::where('name', 'super-admin')
                ->where('guard_name', 'web')
                ->first();

            if (! $superAdminRole) {
                return true;
            }

            return User::role('super-admin')->count() === 0;
        } catch (\Exception $exception) {
            // If we can't check, assume setup is needed
            Log::warning('Setup check failed: '.$exception->getMessage());

            return true;
        }
    }

    /**
     * Check if setup can be accessed (enabled AND required).
     */
    public static function canAccessSetup(): bool
    {
        return self::isSetupEnabled() && self::isSetupRequired();
    }

    /**
     * Display the setup wizard.
     */
    public function index(): Response|RedirectResponse
    {
        // Check if setup is enabled
        if (! self::isSetupEnabled()) {
            abort(404);
        }

        if (! self::isSetupRequired()) {
            return redirect()->route('login')
                ->with('info', 'Setup has already been completed.');
        }

        // Gather system information
        $systemInfo = $this->getSystemInfo();

        return Inertia::render('Setup/Index', [
            'systemInfo' => $systemInfo,
            'envVars' => $this->getRequiredEnvVars(),
        ]);
    }

    /**
     * Run the setup process.
     */
    public function store(Request $request): RedirectResponse
    {
        // Check if setup is enabled
        if (! self::isSetupEnabled()) {
            abort(404);
        }

        if (! self::isSetupRequired()) {
            return redirect()->route('login')
                ->with('info', 'Setup has already been completed.');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'confirmed', Password::min(8)->letters()->numbers()],
            'run_seeders' => ['boolean'],
        ]);

        // Run database migrations if needed
        try {
            Artisan::call('migrate', ['--force' => true]);
        } catch (\Exception $exception) {
            Log::error('Migration failed during setup: '.$exception->getMessage());

            return back()->withErrors([
                'database' => 'Failed to run database migrations. Please check your database configuration.',
            ]);
        }

        // Run system seeders if requested
        if ($validated['run_seeders'] ?? true) {
            try {
                Artisan::call('db:seed', [
                    '--class' => 'Database\\Seeders\\SystemSetupSeeder',
                    '--force' => true,
                ]);
            } catch (\Exception $exception) {
                Log::error('Seeder failed during setup: '.$exception->getMessage());

                return back()->withErrors([
                    'seeder' => 'Failed to seed initial data. Please check your MongoDB configuration.',
                ]);
            }
        }

        // Ensure super-admin role exists
        $superAdminRole = Role::firstOrCreate(
            ['name' => 'super-admin', 'guard_name' => 'web']
        );

        // Create the super admin user
        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'email_verified_at' => now(),
        ]);

        $user->assignRole($superAdminRole);

        // Generate Passport keys if not present
        try {
            if (! file_exists(storage_path('oauth-private.key'))) {
                Artisan::call('passport:keys', ['--force' => true]);
            }
        } catch (\Exception $exception) {
            Log::warning('Passport keys generation failed: '.$exception->getMessage());
        }

        return redirect()->route('login')
            ->with('success', 'Setup completed successfully! You can now log in with your admin account.');
    }

    /**
     * Check database connections.
     */
    public function checkConnections(Request $request): \Illuminate\Http\JsonResponse
    {
        // Check if setup is enabled
        if (! self::isSetupEnabled()) {
            abort(404);
        }

        $results = [
            'sqlite' => $this->checkSqliteConnection(),
            'mongodb' => $this->checkMongodbConnection(),
        ];

        return response()->json($results);
    }

    /**
     * Get system information for the setup page.
     *
     * @return array<string, mixed>
     */
    protected function getSystemInfo(): array
    {
        return [
            'php_version' => PHP_VERSION,
            'laravel_version' => app()->version(),
            'mongodb_extension' => extension_loaded('mongodb'),
            'sqlite_extension' => extension_loaded('pdo_sqlite'),
            'sqlite_connected' => $this->checkSqliteConnection(),
            'mongodb_connected' => $this->checkMongodbConnection(),
            'storage_writable' => is_writable(storage_path()),
            'env_exists' => file_exists(base_path('.env')),
            'app_key_set' => ! empty(config('app.key')),
        ];
    }

    /**
     * Get required environment variables and their status.
     *
     * @return array<string, array{description: string, configured: bool, value: string|null}>
     */
    protected function getRequiredEnvVars(): array
    {
        return [
            'APP_KEY' => [
                'description' => 'Application encryption key (generate with: php artisan key:generate)',
                'configured' => ! empty(config('app.key')),
                'value' => config('app.key') ? '***SET***' : null,
            ],
            'APP_URL' => [
                'description' => 'Application URL (e.g., https://continy.test)',
                'configured' => ! empty(config('app.url')),
                'value' => config('app.url'),
            ],
            'DB_CONNECTION' => [
                'description' => 'Database connection type (sqlite recommended)',
                'configured' => ! empty(config('database.default')),
                'value' => config('database.default'),
            ],
            'MONGO_DSN' => [
                'description' => 'MongoDB connection string (e.g., mongodb://localhost:27017)',
                'configured' => ! empty(config('database.connections.mongodb.dsn')),
                'value' => config('database.connections.mongodb.dsn') ? '***SET***' : null,
            ],
            'MONGO_DATABASE' => [
                'description' => 'MongoDB database name',
                'configured' => ! empty(config('database.connections.mongodb.database')),
                'value' => config('database.connections.mongodb.database'),
            ],
        ];
    }

    /**
     * Check SQLite database connection.
     */
    protected function checkSqliteConnection(): bool
    {
        try {
            \DB::connection('sqlite')->getPdo();

            return true;
        } catch (\Exception) {
            return false;
        }
    }

    /**
     * Check MongoDB connection.
     */
    protected function checkMongodbConnection(): bool
    {
        try {
            $dsn = config('database.connections.mongodb.dsn');
            $database = config('database.connections.mongodb.database');

            if (empty($dsn) || empty($database)) {
                return false;
            }

            $client = new \MongoDB\Client($dsn);
            $client->selectDatabase($database)->command(['ping' => 1]);

            return true;
        } catch (\Exception) {
            return false;
        }
    }
}
