<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MentoringRemark extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'is_confidential' => 'boolean',
            'resolved' => 'boolean',
        ];
    }

    public function studentProfile(): BelongsTo
    {
        return $this->belongsTo(StudentProfile::class);
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_user_id');
    }
}
