<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Mongodb\Collection;
use App\Models\Mongodb\MediaFolder;
use Illuminate\Database\Seeder;

class MediaFolderSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create root folders
        $collectionsFolder = MediaFolder::updateOrCreate(
            ['slug' => 'collections', 'type' => MediaFolder::TYPE_ROOT_COLLECTIONS],
            [
                'name' => 'Collections',
                'slug' => 'collections',
                'path' => 'collections',
                'type' => MediaFolder::TYPE_ROOT_COLLECTIONS,
                'is_system' => true,
                'parent_id' => null,
            ]
        );

        MediaFolder::updateOrCreate(
            ['slug' => 'global', 'type' => MediaFolder::TYPE_ROOT_GLOBAL],
            [
                'name' => 'Global',
                'slug' => 'global',
                'path' => 'global',
                'type' => MediaFolder::TYPE_ROOT_GLOBAL,
                'is_system' => true,
                'parent_id' => null,
            ]
        );

        // Create folders for existing collections
        $collections = Collection::all();
        foreach ($collections as $collection) {
            MediaFolder::updateOrCreate(
                ['collection_id' => (string) $collection->_id, 'type' => MediaFolder::TYPE_COLLECTION],
                [
                    'name' => $collection->name,
                    'slug' => $collection->slug,
                    'path' => 'collections/'.$collection->slug,
                    'type' => MediaFolder::TYPE_COLLECTION,
                    'is_system' => true,
                    'parent_id' => (string) $collectionsFolder->_id,
                    'collection_id' => (string) $collection->_id,
                ]
            );
        }

        $this->command->info('Media folders seeded successfully.');
    }
}
