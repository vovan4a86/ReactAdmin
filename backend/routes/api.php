<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\ProfileController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/
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
})
    ->middleware('api');
// Health check endpoint
Route::get('/health', function () {
    return response()->json([
        'status' => 'healthy',
        'service' => 'backend-api',
        'version' => app()->version(),
        'timestamp' => now()->toIso8601String()
    ]);
});

Route::post('/auth/login', [AuthController::class, 'login'])
    ->name('auth.login');
Route::post('/auth/register', [AuthController::class, 'register'])
    ->name('auth.register');

/*
|--------------------------------------------------------------------------
| Authenticated Routes (для всех авторизованных)
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {

    // ============ AUTH ROUTES ============
    Route::prefix('auth')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/user', [AuthController::class, 'user']);
    });

    // ============ USER PROFILE ROUTES ============
    Route::prefix('profile')->group(function () {
        Route::get('/', [ProfileController::class, 'show']);
        Route::put('/', [ProfileController::class, 'update']);
        Route::put('/password', [ProfileController::class, 'updatePassword']);
        Route::put('/avatar', [ProfileController::class, 'updateAvatar']);
        Route::delete('/', [ProfileController::class, 'deleteAccount']);
    });

    // ============ USER DASHBOARD (обычный пользователь) ============
    Route::get('/dashboard', [ProfileController::class, 'dashboard']);

    /*
    |--------------------------------------------------------------------------
    | Admin Routes
    |--------------------------------------------------------------------------
    */
    Route::middleware('admin')->prefix('admin')->group(function () {

        // Admin Dashboard
        Route::get('/dashboard', [AdminDashboardController::class, 'index']);
        Route::get('/dashboard/stats', [AdminDashboardController::class, 'stats']);
        Route::get('/dashboard/analytics', [AdminDashboardController::class, 'analytics']);

        // User Management (CRUD)
        Route::apiResource('/users', AdminUserController::class);

        // Additional admin user actions
        Route::prefix('users')->group(function () {
            Route::post('/{user}/toggle-status', [AdminUserController::class, 'toggleStatus']);
            Route::post('/{user}/change-role', [AdminUserController::class, 'changeRole']);
            Route::post('/{user}/impersonate', [AdminUserController::class, 'impersonate']);
            Route::get('/export', [AdminUserController::class, 'export']);
        });

        // Other admin resources
        Route::get('/activity-log', [AdminDashboardController::class, 'activityLog']);
        Route::get('/settings', [AdminDashboardController::class, 'settings']);
        Route::put('/settings', [AdminDashboardController::class, 'updateSettings']);
    });
});
