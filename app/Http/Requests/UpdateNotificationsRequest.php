<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateNotificationsRequest extends FormRequest
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
            // Channel preferences
            'channels' => ['required', 'array'],
            'channels.email' => ['required', 'boolean'],
            'channels.sms' => ['required', 'boolean'],
            'channels.whatsapp' => ['required', 'boolean'],

            // Category preferences
            'categories' => ['required', 'array'],
            'categories.appointments' => ['required', 'boolean'],
            'categories.health_alerts' => ['required', 'boolean'],
            'categories.billing' => ['required', 'boolean'],
            'categories.insurance' => ['required', 'boolean'],
            'categories.promotions' => ['required', 'boolean'],

            // Granular health alerts
            'health_alerts' => ['sometimes', 'array'],
            'health_alerts.lab_results' => ['sometimes', 'boolean'],
            'health_alerts.medication_reminders' => ['sometimes', 'boolean'],
            'health_alerts.doctor_messages' => ['sometimes', 'boolean'],
        ];
    }
}
