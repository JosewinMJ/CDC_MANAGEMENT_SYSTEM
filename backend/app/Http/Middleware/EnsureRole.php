<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    /**
     * Enforce role-based access control across Student, Guide (Faculty), and Admin portals.
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();
        if (!$user || !$user->is_active) {
            return response()->json(['message' => 'Unauthenticated or inactive account.'], 401);
        }

        // Allow ADMIN_* prefix matching when 'ADMIN' is specified
        foreach ($roles as $allowed) {
            if ($allowed === 'ADMIN' && str_starts_with($user->role, 'ADMIN')) {
                return $next($request);
            }
            if ($user->role === $allowed) {
                return $next($request);
            }
        }

        return response()->json([
            'message' => 'Forbidden: Insufficient portal permissions. Master data edits are restricted to CDC Admin.',
        ], 403);
    }
}
