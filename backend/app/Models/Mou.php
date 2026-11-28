<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Mou extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'agreement_date' => 'date:Y-m-d',
            'expiry_date' => 'date:Y-m-d',
        ];
    }
}
