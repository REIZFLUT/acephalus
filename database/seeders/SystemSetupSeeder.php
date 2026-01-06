<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * System Setup Seeder
 *
 * This seeder initializes all required system data for a fresh Continy installation
 * WITHOUT creating any user accounts. User creation is handled via the setup wizard.
 */
class SystemSetupSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('Starting Continy system setup...');
        $this->command->newLine();

        // Create roles and permissions
        $this->command->info('Creating roles and permissions...');
        $this->call(RolesAndPermissionsSeeder::class);

        // Create wrapper purposes
        $this->command->info('Creating wrapper purposes...');
        $this->call(WrapperPurposeSeeder::class);

        // Create media meta fields
        $this->command->info('Creating media meta fields...');
        $this->call(MediaMetaFieldSeeder::class);

        // Create media folders
        $this->command->info('Creating media folders...');
        $this->call(MediaFolderSeeder::class);

        // Create default editions
        $this->command->info('Creating default editions...');
        $this->call(EditionSeeder::class);

        $this->command->newLine();
        $this->command->info('✓ System setup completed successfully!');
        $this->command->newLine();
        $this->command->warn('Next steps:');
        $this->command->line('  1. Open your browser and navigate to the setup wizard');
        $this->command->line('  2. Create your super admin account');
        $this->command->newLine();
    }
}
