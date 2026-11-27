<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Company extends Model
{
    use SoftDeletes;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'application_deadline' => 'date:Y-m-d',
            'recruitment_schedule' => 'array',
            'departments' => 'array',
            'is_verified' => 'boolean',
        ];
    }

    public function roles(): HasMany
    {
        return $this->hasMany(JobRole::class);
    }
}
