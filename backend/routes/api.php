<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;

// Эти маршруты должен быть доступен без аутентификации
Route::get('/sanctum/csrf-cookie', function () {
    return response()->json(['message' => 'CSRF cookie set']);
})->name('sanctum.csrf');

// Логин
Route::post('/auth/signin/local', [AuthController::class, 'login'])->name('auth.login');

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

// Sanctum protected route (for testing auth)
//Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
//    return $request->user();
//});


Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me'])->name('auth.me');
    Route::post('/auth/logout', [AuthController::class, 'logout'])->name('auth.logout');
    Route::get('/auth/user', [AuthController::class, 'user'])->name('auth.user');

    Route::get('/dashboard', [DashboardController::class, 'index']);
});
