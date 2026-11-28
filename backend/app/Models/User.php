<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'pattern_hash',
        'role',
        'phone',
        'department',
        'avatar_url',
        'is_active',
        'must_change_password',
        'last_login_at',
    ];

    protected $hidden = [
        'password',
        'pattern_hash',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'is_active' => 'boolean',
            'must_change_password' => 'boolean',
            'password' => 'hashed',
        ];
    }

    public function studentProfile(): HasOne
    {
        return $this->hasOne(StudentProfile::class);
    }

    public function facultyProfile(): HasOne
    {
        return $this->hasOne(FacultyProfile::class);
    }

    public function mentoredStudents(): HasMany
    {
        return $this->hasMany(StudentProfile::class, 'assigned_guide_id');
    }

    public function isAdmin(): bool
    {
        return str_starts_with((string)$this->role, 'ADMIN');
    }

    public function resolvePortalScope(): string
    {
        if ($this->isAdmin()) {
            return 'admin';
        }
        return strtoupper((string)$this->role) === 'GUIDE' ? 'guide' : 'student';
    }

    public static function defaultPatternForRole(string $role): string
    {
        $normalized = strtoupper($role);
        if (str_starts_with($normalized, 'ADMIN')) {
            return '0-4-8-5-2';
        }
        if ($normalized === 'GUIDE') {
            return '0-3-6-7-8';
        }
        return '0-1-2-5-8';
    }

    public function emailMatchesRolePattern(): bool
    {
        $email = strtolower(trim((string)$this->email));
        $role = strtoupper((string)$this->role);
        if (str_contains($email, '@vitstudent.')) {
            return $role === 'STUDENT';
        }
        if (str_starts_with($email, 'cdc.admin@')) {
            return str_starts_with($role, 'ADMIN');
        }
        return true;
    }

    protected static function booted(): void
    {
        static::creating(function (User $user): void {
            if (empty($user->pattern_hash)) {
                $user->pattern_hash = Hash::make(self::defaultPatternForRole((string)$user->role));
            }
        });
    }
}
