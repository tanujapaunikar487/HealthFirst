<?php

namespace App\Http\Requests;

use App\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProfileRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            // Personal Info
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique(User::class)->ignore($this->user()->id),
            ],
            'phone' => ['nullable', 'string', 'regex:/^\+91[6-9]\d{9}$/'],
            'date_of_birth' => ['nullable', 'date', 'before:today'],
            'gender' => ['nullable', 'string', 'in:male,female,other'],

            // Address
            'address_line_1' => ['nullable', 'string', 'max:255'],
            'address_line_2' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:100'],
            'state' => ['nullable', 'string', 'max:100'],
            'pincode' => ['nullable', 'string', 'max:10'],

            // Emergency Contact
            'emergency_contact_type' => ['nullable', 'string', 'in:family_member,custom'],
            'emergency_contact_member_id' => [
                'nullable',
                'required_if:emergency_contact_type,family_member',
                'exists:family_members,id',
            ],
            'emergency_contact_name' => [
                'nullable',
                'required_if:emergency_contact_type,custom',
                'string',
                'max:255',
            ],
            'emergency_contact_phone' => [
                'nullable',
                'required_if:emergency_contact_type,custom',
                'string',
                'regex:/^\+91[6-9]\d{9}$/',
            ],
            'emergency_contact_relation' => ['nullable', 'string', 'max:100'],
        ];
    }

    /**
     * Get custom error messages.
     */
    public function messages(): array
    {
        return [
            'phone.regex' => 'Please enter a valid Indian phone number (e.g., +919876543210).',
            'emergency_contact_phone.regex' => 'Please enter a valid Indian phone number.',
            'emergency_contact_member_id.required_if' => 'Please select a family member.',
            'emergency_contact_name.required_if' => 'Please enter the contact name.',
            'emergency_contact_phone.required_if' => 'Please enter the contact phone number.',
        ];
    }
}
