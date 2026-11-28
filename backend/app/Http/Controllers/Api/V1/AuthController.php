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
            'pattern' => ['required', 'string', 'regex:/^[0-8](-[0-8]){3,8}$/'],
        ]);

        $throttleKey = 'login:' . strtolower($data['email']) . '|' . $request->ip();
        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            return response()->json([
                'message' => "Too many login attempts. Retry in {$seconds} seconds.",
            ], 429);
        }

        $user = User::where('email', $data['email'])->first();
        $patternValid = $user && $user->pattern_hash && Hash::check($data['pattern'], $user->pattern_hash);
        if (!$user || !$user->is_active || !Hash::check($data['password'], $user->password) || !$patternValid) {
            RateLimiter::hit($throttleKey, 900);
            AuditService::log('LOGIN_FAILED', 'Auth', $data['email'], 'Invalid credentials or pattern lock', null, $request);
            return response()->json(['message' => 'Invalid credentials, pattern lock, or inactive account.'], 401);
        }

        if (!$user->emailMatchesRolePattern()) {
            RateLimiter::hit($throttleKey, 900);
            AuditService::log('LOGIN_PATTERN_MISMATCH', 'Auth', $data['email'], 'Email domain pattern does not match assigned portal role', null, $request);
            return response()->json(['message' => 'Email pattern does not match assigned portal role.'], 403);
        }

        RateLimiter::clear($throttleKey);
        $user->update(['last_login_at' => now()]);
        $token = $user->createToken('cdc-portal-' . strtolower($user->role))->plainTextToken;
        $resolvedPortal = $user->resolvePortalScope();
        $redirectTo = '/' . $resolvedPortal;

        AuditService::log('USER_LOGIN', 'Auth', (string)$user->id, "Authenticated as {$user->role} -> {$redirectTo}", null, $request);

        return response()->json([
            'token' => $token,
            'resolvedPortal' => $resolvedPortal,
            'redirectTo' => $redirectTo,
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

    public function directSession(Request $request): JsonResponse
    {
        if (!config('app.direct_portal_access', true)) {
            return response()->json(['message' => 'Direct portal access is disabled.'], 403);
        }

        $data = $request->validate([
            'portal' => ['required', 'in:student,guide,admin'],
        ]);

        $emailMap = [
            'student' => 'user@vitstudent.ac.in',
            'guide' => 'k.ramanathan@vit.ac.in',
            'admin' => 'cdc.admin@vit.ac.in',
        ];

        $user = User::where('email', $emailMap[$data['portal']])->where('is_active', true)->first()
            ?? match ($data['portal']) {
                'admin' => User::where('role', 'like', 'ADMIN%')->where('is_active', true)->first(),
                'guide' => User::where('role', 'GUIDE')->where('is_active', true)->first(),
                default => User::where('role', 'STUDENT')->where('is_active', true)->first(),
            };

        if (!$user) {
            return response()->json(['message' => 'No active account found for this portal.'], 404);
        }

        $token = $user->createToken('cdc-portal-' . strtolower($user->role) . '-direct')->plainTextToken;
        $resolvedPortal = $user->resolvePortalScope();

        return response()->json([
            'token' => $token,
            'resolvedPortal' => $resolvedPortal,
            'redirectTo' => '/' . $resolvedPortal,
            'user' => [
                'id' => (string)$user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'department' => $user->department,
                'avatarUrl' => $user->avatar_url,
                'mustChangePassword' => false,
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
            'resolvedPortal' => $user->resolvePortalScope(),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();
        $user?->currentAccessToken()?->delete();
        AuditService::log('USER_LOGOUT', 'Auth', (string)$user?->id, 'Signed out', null, $request);
        return response()->json(['message' => 'Logged out successfully.']);
    }

    public function changePassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'new_password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = $request->user();
        if (!Hash::check($data['current_password'], $user->password)) {
            return response()->json(['message' => 'Current password is incorrect.'], 422);
        }

        $user->update([
            'password' => Hash::make($data['new_password']),
            'must_change_password' => false,
        ]);

        AuditService::log('PASSWORD_CHANGED', 'Auth', (string)$user->id, 'Updated account password', null, $request);
        return response()->json(['message' => 'Password updated successfully.']);
    }

    public function changePattern(Request $request): JsonResponse
    {
        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'new_pattern' => ['required', 'string', 'regex:/^[0-8](-[0-8]){3,8}$/'],
        ]);

        $nodes = explode('-', $data['new_pattern']);
        if (count($nodes) !== count(array_unique($nodes))) {
            return response()->json(['message' => 'Pattern lock cannot reuse the same dot twice.'], 422);
        }

        $user = $request->user();
        if (!Hash::check($data['current_password'], $user->password)) {
            return response()->json(['message' => 'Current password is incorrect.'], 422);
        }

        $user->update([
            'pattern_hash' => Hash::make($data['new_pattern']),
        ]);

        AuditService::log('PATTERN_CHANGED', 'Auth', (string)$user->id, 'Updated 3x3 login pattern lock', null, $request);
        return response()->json(['message' => 'Login pattern updated successfully.']);
    }
}
