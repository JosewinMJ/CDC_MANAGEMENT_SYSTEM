<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ParentAlert extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'application_deadline' => 'date:Y-m-d',
            'scheduled_date' => 'date:Y-m-d',
            'sent_date' => 'datetime',
        ];
    }

    public function studentProfile(): BelongsTo
    {
        return $this->belongsTo(StudentProfile::class);
    }
}
