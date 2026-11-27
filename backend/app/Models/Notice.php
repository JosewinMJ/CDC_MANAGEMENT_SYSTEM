<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notice extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'is_important' => 'boolean',
            'target_branches' => 'array',
            'read_by_student_ids' => 'array',
            'expiry_date' => 'date:Y-m-d',
        ];
    }
}
