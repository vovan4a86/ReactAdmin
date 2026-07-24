<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;

// Эти маршруты должен быть доступен без аутентификации
Route::get('/sanctum/csrf-cookie', function () {
    return response()->json(['message' => 'CSRF cookie set']);
})->name('sanctum.csrf');

// Тест скрипта
Route::get('/test-cors', function (Request $request) {
    return response()->json([
        'status' => 'success',
        'message' => 'CORS is working! 🎉',
        'timestamp' => now()->toIso8601String(),
        'origin' => $request->header('Origin'),
        'server' => 'Laravel ' . app()->version(),
        'data' => [
            'cors_allowed' => true,
            'received_headers' => $request->headers->all(),
        ]
    ]);
})->middleware('api');

// Health check endpoint
Route::get('/health', function () {
    return response()->json([
        'status' => 'healthy',
        'service' => 'backend-api',
        'version' => app()->version(),
        'timestamp' => now()->toIso8601String()
    ]);
});

// Логин
Route::post('/auth/login', [AuthController::class, 'login'])->name('auth.login');

Route::middleware(['auth:sanctum', 'admin'])->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me'])->name('auth.me');
    Route::post('/auth/register', [AuthController::class, 'register'])->name('auth.register');
    Route::post('/auth/logout', [AuthController::class, 'logout'])->name('auth.logout');
    Route::get('/auth/user', [AuthController::class, 'user'])->name('auth.user');

    // Управление пользователями (только для админов)
    Route::apiResource('/users', UserController::class);

    Route::get('/dashboard', [DashboardController::class, 'index']);
});
