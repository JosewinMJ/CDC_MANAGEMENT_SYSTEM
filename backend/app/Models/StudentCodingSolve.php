<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentCodingSolve extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'topics' => 'array',
            'solved_at' => 'datetime',
        ];
    }

    public function studentProfile(): BelongsTo
    {
        return $this->belongsTo(StudentProfile::class);
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(CodingQuestion::class, 'coding_question_id');
    }
}
