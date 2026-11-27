<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class StudentProfile extends Model
{
    use SoftDeletes;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'dob' => 'date:Y-m-d',
            'verified_at' => 'datetime',
            'semester_results' => 'array',
            'skills' => 'array',
            'parent_contact' => 'array',
            'coding_stats' => 'array',
            'portal_active' => 'boolean',
            'tenth_percentage' => 'float',
            'twelfth_percentage' => 'float',
            'current_cgpa' => 'float',
            'package_lpa' => 'float',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function assignedGuide(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_guide_id');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(StudentDocument::class);
    }

    public function corrections(): HasMany
    {
        return $this->hasMany(AcademicCorrection::class);
    }

    public function applications(): HasMany
    {
        return $this->hasMany(Application::class);
    }

    public function internships(): HasMany
    {
        return $this->hasMany(Internship::class);
    }

    public function codingSolves(): HasMany
    {
        return $this->hasMany(StudentCodingSolve::class);
    }
}
