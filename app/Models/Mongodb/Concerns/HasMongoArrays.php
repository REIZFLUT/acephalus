<?php

declare(strict_types=1);

namespace App\Models\Mongodb\Concerns;

/**
 * Trait for handling array attributes in MongoDB models.
 *
 * MongoDB stores arrays/objects natively, but Laravel's 'array' cast
 * uses json_encode/json_decode which converts them to strings.
 * This trait provides accessors/mutators that preserve native MongoDB arrays.
 *
 * To use this trait, define a $mongoArrayAttributes property in your model:
 *
 * protected array $mongoArrayAttributes = ['elements', 'metadata'];
 */
trait HasMongoArrays
{
    /**
     * Get the attributes that should be stored as native MongoDB arrays.
     *
     * @return array<string>
     */
    public function getMongoArrayAttributes(): array
    {
        return $this->mongoArrayAttributes ?? [];
    }

    /**
     * Convert a value to a native array for MongoDB storage.
     *
     * @param  mixed  $value
     * @return array<mixed>
     */
    protected function asMongoArray(mixed $value): array
    {
        if ($value === null) {
            return [];
        }

        // If it's already an array, return it
        if (is_array($value)) {
            return $value;
        }

        // If it's a Collection, convert to array
        if ($value instanceof \Illuminate\Support\Collection) {
            return $value->toArray();
        }

        // If it's a MongoDB BSONArray or BSONDocument, convert to array
        if ($value instanceof \MongoDB\Model\BSONArray || $value instanceof \MongoDB\Model\BSONDocument) {
            return (array) $value;
        }

        // If it's a string (legacy data stored as JSON), decode it
        if (is_string($value)) {
            $decoded = json_decode($value, true);
            return is_array($decoded) ? $decoded : [];
        }

        // If it's an object, convert to array
        if (is_object($value)) {
            return (array) $value;
        }

        return [];
    }

    /**
     * Override getAttribute to handle MongoDB arrays.
     *
     * @param  string  $key
     * @return mixed
     */
    public function getAttribute($key): mixed
    {
        $value = parent::getAttribute($key);

        if (in_array($key, $this->getMongoArrayAttributes())) {
            return $this->asMongoArray($value);
        }

        return $value;
    }

    /**
     * Override setAttribute to handle MongoDB arrays.
     *
     * @param  string  $key
     * @param  mixed  $value
     * @return mixed
     */
    public function setAttribute($key, $value): mixed
    {
        if (in_array($key, $this->getMongoArrayAttributes())) {
            $this->attributes[$key] = $this->asMongoArray($value);
            return $this;
        }

        return parent::setAttribute($key, $value);
    }
}
