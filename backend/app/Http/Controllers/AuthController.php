<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        // Логируем входящий запрос
        Log::info('=== Login request ===');
        Log::info('Email:', ['email' => $request->email]);
        Log::info('Password:', ['password' => $request->password]);

        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        Log::info('User found:', ['user' => $user]);

        if (!$user || !Hash::check($request->password, $user->password)) {
            Log::warning('Invalid password for user:', ['email' => $request->email]);

            return response()->json([
                'message' => 'Неверные учетные данные'
            ], 401);
        }

        // Создаем токен (если нужно)
        $token = $user->createToken('auth_token')->plainTextToken;

        Log::info('Login successful:', ['user_id' => $user->id, 'token' => substr($token, 0, 20) . '...']);

        return response()->json([
            'user' => $user,
            'token' => $token,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Выход выполнен']);
    }

    public function me(Request $request)
    {
        Log::info('=== /auth/me called ===');
        Log::info('All headers:', $request->headers->all());
        Log::info('Bearer token:', ['token' => $request->bearerToken()]);
        Log::info('User from request:', ['user' => $request->user()]);

        // Проверяем токен вручную
        $token = $request->bearerToken();
        if ($token) {
            try {
                $accessToken = \Laravel\Sanctum\PersonalAccessToken::findToken($token);
                Log::info('Token found in DB:', ['token' => $accessToken]);
                if ($accessToken) {
                    $authenticatedUser = $accessToken->tokenable;
                    Log::info('User by token:', ['user' => $authenticatedUser]);
                } else {
                    Log::warning('Token not found in DB');
                }
            } catch (\Exception $e) {
                Log::error('Error finding token:', ['error' => $e->getMessage()]);
            }
        } else {
            Log::warning('No bearer token in request');
        }

        return response()->json($request->user());
    }
}
