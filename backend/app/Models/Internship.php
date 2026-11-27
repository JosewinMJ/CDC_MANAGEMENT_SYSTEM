<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Internship extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'is_stipend' => 'boolean',
            'start_date' => 'date:Y-m-d',
            'end_date' => 'date:Y-m-d',
            'steps' => 'array',
            'documents' => 'array',
        ];
    }

    public function studentProfile(): BelongsTo
    {
        return $this->belongsTo(StudentProfile::class);
    }

    public function facultyGuide(): BelongsTo
    {
        return $this->belongsTo(User::class, 'faculty_guide_id');
    }
}
