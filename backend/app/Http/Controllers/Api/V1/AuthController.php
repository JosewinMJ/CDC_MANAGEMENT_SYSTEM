<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $throttleKey = 'login:' . strtolower($data['email']) . '|' . $request->ip();
        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            return response()->json([
                'message' => "Too many login attempts. Retry in {$seconds} seconds.",
            ], 429);
        }

        $user = User::where('email', $data['email'])->first();
        if (!$user || !$user->is_active || !Hash::check($data['password'], $user->password)) {
            RateLimiter::hit($throttleKey, 900);
            AuditService::log('LOGIN_FAILED', 'Auth', $data['email'], 'Invalid credentials', null, $request);
            return response()->json(['message' => 'Invalid credentials or inactive account.'], 401);
        }

        RateLimiter::clear($throttleKey);
        $user->update(['last_login_at' => now()]);
        $token = $user->createToken('cdc-portal-' . strtolower($user->role))->plainTextToken;

        AuditService::log('USER_LOGIN', 'Auth', (string)$user->id, "Authenticated as {$user->role}", null, $request);

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => (string)$user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'department' => $user->department,
                'avatarUrl' => $user->avatar_url,
                'mustChangePassword' => $user->must_change_password,
            ],
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        return response()->json([
            'id' => (string)$user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'department' => $user->department,
            'avatarUrl' => $user->avatar_url,
            'mustChangePassword' => $user->must_change_password,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();
        $user?->currentAccessToken()?->delete();
        AuditService::log('USER_LOGOUT', 'Auth', (string)$user?->id, 'Signed out', null, $request);
        return response()->json(['message' => 'Logged out successfully.']);
    }
}
