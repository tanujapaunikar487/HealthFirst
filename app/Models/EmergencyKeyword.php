<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmergencyKeyword extends Model
{
    protected $fillable = [
        'keyword',
        'severity',
        'category',
    ];
}
