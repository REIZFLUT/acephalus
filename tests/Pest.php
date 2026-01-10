<?php

use App\Models\Mongodb\Collection;
use App\Models\Mongodb\Content;
use App\Models\Mongodb\ContentVersion;
use App\Models\Mongodb\CustomElement;
use App\Models\Mongodb\Element;
use App\Models\Mongodb\Media;
use App\Models\Mongodb\WrapperPurpose;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Support\Facades\DB;

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
|
| The closure you provide to your test functions is always bound to a specific PHPUnit test
| case class. By default, that class is "PHPUnit\Framework\TestCase". Of course, you may
| need to change it using the "pest()" function to bind a different classes or traits.
|
*/

pest()->extend(Tests\TestCase::class)
    ->use(Illuminate\Foundation\Testing\RefreshDatabase::class)
    ->beforeEach(function () {
        // Verify we are using the test database (safety check)
        $currentDatabase = config('database.connections.mongodb.database');
        if (! str_contains($currentDatabase, 'feature-test')) {
            throw new \RuntimeException(
                "Safety check failed: Expected test database with 'feature-test' suffix, got '{$currentDatabase}'. ".
                'Make sure MONGO_DATABASE is set correctly in phpunit.xml.'
            );
        }

        // Seed roles and permissions for each test
        $this->seed(RolesAndPermissionsSeeder::class);

        // Clean MongoDB collections before each test
        Collection::truncate();
        Content::truncate();
        ContentVersion::truncate();
        CustomElement::truncate();
        Element::truncate();
        Media::truncate();
        WrapperPurpose::truncate();

        // Seed default wrapper purposes for tests
        WrapperPurpose::create([
            'name' => 'Generic',
            'slug' => 'generic',
            'description' => 'A generic wrapper for layout purposes',
            'is_system' => true,
        ]);
    })
    ->afterAll(function () {
        // Drop the test database after all tests complete
        $currentDatabase = config('database.connections.mongodb.database');
        if (str_contains($currentDatabase, 'feature-test')) {
            try {
                DB::connection('mongodb')->getMongoDB()->drop();
            } catch (\Exception $exception) {
                // Silently ignore if database doesn't exist or can't be dropped
            }
        }
    })
    ->in('Feature');

/*
|--------------------------------------------------------------------------
| Expectations
|--------------------------------------------------------------------------
|
| When you're writing tests, you often need to check that values meet certain conditions. The
| "expect()" function gives you access to a set of "expectations" methods that you can use
| to assert different things. Of course, you may extend the Expectation API at any time.
|
*/

expect()->extend('toBeOne', function () {
    return $this->toBe(1);
});

/*
|--------------------------------------------------------------------------
| Functions
|--------------------------------------------------------------------------
|
| While Pest is very powerful out-of-the-box, you may have some testing code specific to your
| project that you don't want to repeat in every file. Here you can also expose helpers as
| global functions to help you to reduce the number of lines of code in your test files.
|
*/

function something()
{
    // ..
}
