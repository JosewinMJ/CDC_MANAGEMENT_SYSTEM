<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CodingQuestion extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'topics' => 'array',
            'target_branches' => 'array',
            'posted_date' => 'date:Y-m-d',
            'due_date' => 'date:Y-m-d',
            'is_active' => 'boolean',
        ];
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'posted_by');
    }

    public function solves(): HasMany
    {
        return $this->hasMany(StudentCodingSolve::class);
    }
}
