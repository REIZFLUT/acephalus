<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Mongodb\Edition;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Mongodb\Edition>
 */
class EditionFactory extends Factory
{
    protected $model = Edition::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->unique()->word();

        return [
            'name' => ucfirst($name),
            'slug' => Str::slug($name),
            'description' => fake()->optional()->sentence(),
            'icon' => null,
            'is_system' => false,
        ];
    }

    /**
     * Indicate that the edition is a system edition.
     */
    public function system(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_system' => true,
        ]);
    }
}
