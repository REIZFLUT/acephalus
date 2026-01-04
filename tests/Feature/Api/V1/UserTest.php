<?php

declare(strict_types=1);

use App\Models\User;
use Laravel\Passport\Client;
use Laravel\Passport\Passport;

beforeEach(function () {
    Client::factory()->asPersonalAccessTokenClient()->create([
        'name' => 'Test Personal Access Client',
    ]);

    $this->admin = User::factory()->create();
    $this->admin->assignRole('admin');
    Passport::actingAs($this->admin);
});

describe('User Listing', function () {

    it('can list all users', function () {
        User::factory()->count(5)->create();

        $response = $this->getJson('/api/v1/users');

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'name', 'email'],
                ],
            ]);

        // 5 created + 1 admin = 6 users
        expect(count($response->json('data')))->toBe(6);
    });

    it('can search users by name', function () {
        User::factory()->create(['name' => 'John Doe']);
        User::factory()->create(['name' => 'Jane Smith']);
        User::factory()->create(['name' => 'Bob Wilson']);

        $response = $this->getJson('/api/v1/users?search=john');

        $response->assertOk();
        expect(count($response->json('data')))->toBe(1);
        expect($response->json('data.0.name'))->toBe('John Doe');
    });

    it('can search users by email', function () {
        User::factory()->create(['email' => 'john@company.com']);
        User::factory()->create(['email' => 'jane@company.com']);
        User::factory()->create(['email' => 'bob@elsewhere.org']);

        $response = $this->getJson('/api/v1/users?search=company');

        $response->assertOk();
        expect(count($response->json('data')))->toBe(2);
    });

    it('can filter users by role', function () {
        $editor = User::factory()->create();
        $editor->assignRole('editor');

        $author = User::factory()->create();
        $author->assignRole('author');

        $response = $this->getJson('/api/v1/users?role=editor');

        $response->assertOk();
        expect(count($response->json('data')))->toBe(1);
    });

    it('paginates user listing', function () {
        User::factory()->count(25)->create();

        $response = $this->getJson('/api/v1/users?per_page=10');

        $response->assertOk()
            ->assertJsonStructure([
                'data',
                'links',
                'meta' => ['current_page', 'last_page', 'per_page', 'total'],
            ]);

        expect(count($response->json('data')))->toBe(10);
        expect($response->json('meta.total'))->toBe(26); // 25 created + 1 admin
    });

});

describe('User Creation', function () {

    it('can create a new user', function () {
        $response = $this->postJson('/api/v1/users', [
            'name' => 'New User',
            'email' => 'newuser@example.com',
            'password' => 'SecurePassword123!',
            'password_confirmation' => 'SecurePassword123!',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'New User')
            ->assertJsonPath('data.email', 'newuser@example.com')
            ->assertJson(['message' => 'User created successfully']);

        $this->assertDatabaseHas('users', [
            'email' => 'newuser@example.com',
        ]);
    });

    it('can create user with roles', function () {
        $response = $this->postJson('/api/v1/users', [
            'name' => 'Editor User',
            'email' => 'editor@example.com',
            'password' => 'SecurePassword123!',
            'password_confirmation' => 'SecurePassword123!',
            'roles' => ['editor'],
        ]);

        $response->assertStatus(201);

        $user = User::where('email', 'editor@example.com')->first();
        expect($user->hasRole('editor'))->toBeTrue();
    });

    it('validates required fields', function () {
        $response = $this->postJson('/api/v1/users', [
            'name' => '',
            'email' => '',
            'password' => '',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'email', 'password']);
    });

    it('validates email format', function () {
        $response = $this->postJson('/api/v1/users', [
            'name' => 'Test User',
            'email' => 'not-an-email',
            'password' => 'SecurePassword123!',
            'password_confirmation' => 'SecurePassword123!',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    });

    it('validates password strength', function () {
        $response = $this->postJson('/api/v1/users', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'weak', // Too short / simple
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    });

    it('prevents duplicate emails', function () {
        User::factory()->create(['email' => 'existing@example.com']);

        $response = $this->postJson('/api/v1/users', [
            'name' => 'Duplicate User',
            'email' => 'existing@example.com',
            'password' => 'SecurePassword123!',
            'password_confirmation' => 'SecurePassword123!',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    });

});

describe('User Retrieval', function () {

    it('can show a specific user', function () {
        $user = User::factory()->create([
            'name' => 'Test User',
            'email' => 'show@example.com',
        ]);
        $user->assignRole('editor');

        $response = $this->getJson("/api/v1/users/{$user->id}");

        $response->assertOk()
            ->assertJsonPath('data.id', $user->id)
            ->assertJsonPath('data.name', 'Test User')
            ->assertJsonPath('data.email', 'show@example.com')
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'name',
                    'email',
                    'roles',
                ],
            ]);
    });

    it('returns 404 for non-existent user', function () {
        $response = $this->getJson('/api/v1/users/999999');

        $response->assertNotFound();
    });

});

describe('User Update', function () {

    it('can update user name', function () {
        $user = User::factory()->create(['name' => 'Original Name']);

        $response = $this->putJson("/api/v1/users/{$user->id}", [
            'name' => 'Updated Name',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.name', 'Updated Name')
            ->assertJson(['message' => 'User updated successfully']);
    });

    it('can update user email', function () {
        $user = User::factory()->create(['email' => 'original@example.com']);

        $response = $this->putJson("/api/v1/users/{$user->id}", [
            'email' => 'updated@example.com',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.email', 'updated@example.com');
    });

    it('can update user password', function () {
        $user = User::factory()->create();
        $originalPassword = $user->password;

        $response = $this->putJson("/api/v1/users/{$user->id}", [
            'password' => 'NewSecurePassword123!',
            'password_confirmation' => 'NewSecurePassword123!',
        ]);

        $response->assertOk();

        $user->refresh();
        expect($user->password)->not->toBe($originalPassword);
    });

    it('can update user roles', function () {
        $user = User::factory()->create();
        $user->assignRole('author');

        $response = $this->putJson("/api/v1/users/{$user->id}", [
            'roles' => ['editor', 'admin'],
        ]);

        $response->assertOk();

        $user->refresh();
        expect($user->hasRole('editor'))->toBeTrue();
        expect($user->hasRole('admin'))->toBeTrue();
        expect($user->hasRole('author'))->toBeFalse();
    });

    it('validates email uniqueness on update', function () {
        $existingUser = User::factory()->create(['email' => 'existing@example.com']);
        $userToUpdate = User::factory()->create(['email' => 'original@example.com']);

        $response = $this->putJson("/api/v1/users/{$userToUpdate->id}", [
            'email' => 'existing@example.com',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    });

    it('allows keeping same email on update', function () {
        $user = User::factory()->create(['email' => 'same@example.com']);

        $response = $this->putJson("/api/v1/users/{$user->id}", [
            'name' => 'Updated Name',
            'email' => 'same@example.com',
        ]);

        $response->assertOk();
    });

});

describe('User Deletion', function () {

    it('can delete a user', function () {
        $user = User::factory()->create();

        $response = $this->deleteJson("/api/v1/users/{$user->id}");

        $response->assertOk()
            ->assertJson(['message' => 'User deleted successfully']);

        $this->assertDatabaseMissing('users', ['id' => $user->id]);
    });

    it('cannot delete own account', function () {
        $response = $this->deleteJson("/api/v1/users/{$this->admin->id}");

        // Policy prevents self-deletion, returning 403 Forbidden
        $response->assertForbidden();

        $this->assertDatabaseHas('users', ['id' => $this->admin->id]);
    });

    it('returns 404 when deleting non-existent user', function () {
        $response = $this->deleteJson('/api/v1/users/999999');

        $response->assertNotFound();
    });

});

describe('User Authorization', function () {

    it('requires authentication for user management', function () {
        $this->app['auth']->forgetGuards();

        $response = $this->getJson('/api/v1/users');

        $response->assertStatus(401);
    });

    it('editor cannot access user management', function () {
        $editor = User::factory()->create();
        $editor->assignRole('editor');
        Passport::actingAs($editor);

        $response = $this->getJson('/api/v1/users');

        $response->assertStatus(403);
    });

    it('author cannot access user management', function () {
        $author = User::factory()->create();
        $author->assignRole('author');
        Passport::actingAs($author);

        $response = $this->getJson('/api/v1/users');

        $response->assertStatus(403);
    });

    it('viewer cannot access user management', function () {
        $viewer = User::factory()->create();
        $viewer->assignRole('viewer');
        Passport::actingAs($viewer);

        $response = $this->getJson('/api/v1/users');

        $response->assertStatus(403);
    });

});
