<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Application extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'timeline' => 'array',
        ];
    }

    public function studentProfile(): BelongsTo
    {
        return $this->belongsTo(StudentProfile::class);
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function jobRole(): BelongsTo
    {
        return $this->belongsTo(JobRole::class);
    }
}
