<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (!Auth::check()) {
            return response()->json(['message' => 'Не аутентифицированный пользователь'], 401);
        }

        if (!Auth::user()->isAdmin()) {
            return response()->json(['message' => 'Не авторизованный пользователь. Требуется доступ администратора.'], 403);
        }

        return $next($request);
    }
}
