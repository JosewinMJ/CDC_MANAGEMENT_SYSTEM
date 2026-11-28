<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConsultancyRecord extends Model
{
    protected $guarded = ['id'];

    public function facultyUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'faculty_user_id');
    }
}
