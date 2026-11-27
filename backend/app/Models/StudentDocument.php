<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentDocument extends Model
{
    protected $hidden = ['storage_path'];

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['verified_date' => 'datetime'];
    }

    public function studentProfile(): BelongsTo
    {
        return $this->belongsTo(StudentProfile::class);
    }

    public function internship(): BelongsTo
    {
        return $this->belongsTo(Internship::class);
    }

    public function scopeAssignedToGuide(Builder $query, int $guideId): Builder
    {
        return $query->where(fn (Builder $documents) => $documents
            ->whereRelation('internship', 'faculty_guide_id', $guideId)
            ->orWhere(fn (Builder $profileDocuments) => $profileDocuments
                ->whereNull('internship_id')
                ->whereRelation('studentProfile', 'assigned_guide_id', $guideId)));
    }
}
