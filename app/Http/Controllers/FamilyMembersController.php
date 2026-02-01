<?php

namespace App\Http\Controllers;

use App\Models\FamilyMember;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FamilyMembersController extends Controller
{
    public function index()
    {
        $user = auth()->user() ?? \App\User::first();

        $members = FamilyMember::where('user_id', $user->id)
            ->orderByRaw("CASE WHEN relation = 'self' THEN 0 ELSE 1 END")
            ->orderBy('created_at')
            ->get()
            ->map(fn (FamilyMember $m) => [
                'id' => $m->id,
                'name' => $m->name,
                'relation' => $m->relation,
                'age' => $m->age,
                'gender' => $m->gender,
                'blood_group' => $m->blood_group,
                'avatar_url' => $m->avatar_url,
            ]);

        return Inertia::render('FamilyMembers/Index', [
            'members' => $members,
            'canCreate' => $members->count() < 10,
        ]);
    }

    public function create()
    {
        return redirect()->route('family-members.index', ['create' => 1]);
    }

    public function store(Request $request)
    {
        $user = auth()->user() ?? \App\User::first();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'relation' => 'required|string|in:self,mother,father,brother,sister,spouse,son,daughter,grandmother,grandfather,other',
            'age' => 'nullable|integer|min:0|max:150',
            'gender' => 'nullable|string|in:male,female,other',
            'blood_group' => 'nullable|string|in:A+,A-,B+,B-,AB+,AB-,O+,O-',
        ]);

        FamilyMember::create([
            'user_id' => $user->id,
            ...$validated,
        ]);

        return redirect()->route('family-members.index')->with('toast', 'Family member added successfully');
    }

    public function update(Request $request, FamilyMember $member)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'relation' => 'required|string|in:self,mother,father,brother,sister,spouse,son,daughter,grandmother,grandfather,other',
            'age' => 'nullable|integer|min:0|max:150',
            'gender' => 'nullable|string|in:male,female,other',
            'blood_group' => 'nullable|string|in:A+,A-,B+,B-,AB+,AB-,O+,O-',
        ]);

        $member->update($validated);

        return redirect()->route('family-members.index')->with('toast', 'Family member updated successfully');
    }

    public function destroy(FamilyMember $member)
    {
        if ($member->relation === 'self') {
            return redirect()->route('family-members.index')->with('toast', 'Cannot delete your own profile');
        }

        $member->delete();

        return redirect()->route('family-members.index')->with('toast', 'Family member removed');
    }
}
