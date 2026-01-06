<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Mongodb\Edition;
use Illuminate\Database\Seeder;

class EditionSeeder extends Seeder
{
    /**
     * Default editions to seed.
     *
     * @var array<array{slug: string, name: string, description: string|null, icon: string|null, is_system: bool}>
     */
    protected array $editions = [
        [
            'slug' => 'all',
            'name' => 'All Editions',
            'description' => 'Default edition - content visible everywhere',
            'icon' => 'globe',
            'is_system' => true,
        ],
    ];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        foreach ($this->editions as $edition) {
            Edition::updateOrCreate(
                ['slug' => $edition['slug']],
                $edition
            );
        }

        $this->command->info('Editions seeded successfully.');
    }
}
