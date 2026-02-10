<?php

namespace Tests\Feature;

use App\Models\FamilyMember;
use App\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FamilyMemberCreationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\HospitalSeeder::class);
    }

    /** @test */
    public function it_creates_a_new_family_member_with_unique_phone()
    {
        $user = User::first();

        $response = $this->actingAs($user)->postJson('/family-members/create-new', [
            'name' => 'Test Member',
            'relation' => 'brother',
            'phone' => '+919999888877',
            'age' => 25,
            'gender' => 'male',
            'email' => 'test@example.com',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonStructure([
                'member_data' => [
                    'id',
                    'name',
                    'relation',
                    'age',
                    'gender',
                    'patient_id',
                ],
            ]);

        $this->assertDatabaseHas('family_members', [
            'name' => 'Test Member',
            'phone' => '+919999888877',
            'user_id' => $user->id,
        ]);
    }

    /** @test */
    public function it_rejects_duplicate_phone_for_same_user()
    {
        $user = User::first();

        // First member already exists in seed data with this phone
        $existingPhone = '+91 98765 43210'; // Sanjana's phone

        $response = $this->actingAs($user)->postJson('/family-members/create-new', [
            'name' => 'Another Member',
            'relation' => 'sister',
            'phone' => $existingPhone,
            'age' => 30,
            'gender' => 'female',
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'already_linked' => true,
            ]);
    }

    /** @test */
    public function it_suggests_linking_when_phone_exists_for_different_user()
    {
        $user = User::first();

        // Create a member for a different user first
        $otherUser = User::factory()->create();
        $otherMember = FamilyMember::create([
            'user_id' => $otherUser->id,
            'name' => 'Other User Member',
            'relation' => 'mother',
            'phone' => '+919876543999',
            'age' => 50,
            'gender' => 'female',
        ]);

        // Try to create with the same phone as current user
        $response = $this->actingAs($user)->postJson('/family-members/create-new', [
            'name' => 'My Mother',
            'relation' => 'mother',
            'phone' => '+919876543999',
            'age' => 50,
            'gender' => 'female',
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'should_link' => true,
            ])
            ->assertJsonStructure([
                'existing_member' => [
                    'name',
                    'age',
                    'gender',
                    'patient_id',
                ],
            ]);
    }

    /** @test */
    public function it_validates_required_fields()
    {
        $user = User::first();

        $response = $this->actingAs($user)->postJson('/family-members/create-new', [
            'name' => '',
            'relation' => '',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'relation', 'phone', 'age', 'gender']);
    }

    /** @test */
    public function it_validates_phone_format()
    {
        $user = User::first();

        $response = $this->actingAs($user)->postJson('/family-members/create-new', [
            'name' => 'Test Member',
            'relation' => 'brother',
            'phone' => 'invalid-phone',
            'age' => 25,
            'gender' => 'male',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['phone']);
    }

    /** @test */
    public function it_auto_generates_patient_id()
    {
        $user = User::first();

        $response = $this->actingAs($user)->postJson('/family-members/create-new', [
            'name' => 'Test Member',
            'relation' => 'brother',
            'phone' => '+919999888866',
            'age' => 25,
            'gender' => 'male',
        ]);

        $response->assertStatus(200);

        $member = FamilyMember::where('phone', '+919999888866')->first();
        $this->assertNotNull($member->patient_id);
        $this->assertStringStartsWith('PT-', $member->patient_id);
    }
}
