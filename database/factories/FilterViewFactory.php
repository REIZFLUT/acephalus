<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Mongodb\FilterView;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Mongodb\FilterView>
 */
class FilterViewFactory extends Factory
{
    protected $model = FilterView::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->unique()->words(2, true);

        return [
            'name' => ucfirst($name),
            'slug' => Str::slug($name),
            'description' => fake()->optional()->sentence(),
            'collection_id' => null,
            'is_system' => false,
            'conditions' => [
                'type' => 'group',
                'operator' => 'and',
                'children' => [],
            ],
            'sort' => [],
            'raw_query' => null,
        ];
    }

    /**
     * Indicate that the filter view is a system filter view.
     */
    public function system(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_system' => true,
        ]);
    }

    /**
     * Indicate that the filter view is global (not tied to a collection).
     */
    public function global(): static
    {
        return $this->state(fn (array $attributes) => [
            'collection_id' => null,
        ]);
    }

    /**
     * Indicate that the filter view is for a specific collection.
     */
    public function forCollection(string $collectionId): static
    {
        return $this->state(fn (array $attributes) => [
            'collection_id' => $collectionId,
        ]);
    }

    /**
     * Add a simple equals condition.
     */
    public function withCondition(string $field, string $operator, mixed $value): static
    {
        return $this->state(function (array $attributes) use ($field, $operator, $value) {
            $conditions = $attributes['conditions'] ?? ['type' => 'group', 'operator' => 'and', 'children' => []];
            $conditions['children'][] = [
                'type' => 'condition',
                'field' => $field,
                'operator' => $operator,
                'value' => $value,
            ];

            return ['conditions' => $conditions];
        });
    }

    /**
     * Add sort configuration.
     */
    public function withSort(string $field, string $direction = 'asc'): static
    {
        return $this->state(function (array $attributes) use ($field, $direction) {
            $sort = $attributes['sort'] ?? [];
            $sort[] = [
                'field' => $field,
                'direction' => $direction,
            ];

            return ['sort' => $sort];
        });
    }

    /**
     * Add a raw MongoDB query.
     */
    public function withRawQuery(array $query): static
    {
        return $this->state(fn (array $attributes) => [
            'raw_query' => $query,
        ]);
    }
}
