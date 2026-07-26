<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

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

        if (!Auth::attempt($request->only('email', 'password'))) {
            throw ValidationException::withMessages([
                'email' => ['Invalid credentials.'],
            ]);
        }

        $user = Auth::user();

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
            'status' => 'success',
            'message' => 'Login successful',
            'user' => $this->formatUser($user),
            'token' => $token,
        ]);
    }

    public function register(Request $request) {
        $validator = Validator::make($request->all(), [
            'name' => ['string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'string', 'min:8'], // 'confirmed' ожидает password_confirmation
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Ошибка валидации',
                'errors' => $validator->errors()
            ], 422);
        }

        // Создание пользователя
        $user = User::create([
            'name' => $request->name ?: explode('@', $request->email)[0], // Автоматически генерируем name из email
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'user'
        ]);

        Auth::login($user);

        // Опционально: отправка email верификации
        // if (config('auth.must_verify_email')) {
        //     $user->sendEmailVerificationNotification();
        // }
        // + в User добавить implements MustVerifyEmail

        // Опционально: создание токена сразу после регистрации
         $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'status' => 'success',
            'message' => 'Успешная регистрация',
            'user' => $this->formatUser($user),
            'token' => $token,
        ], 201);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json([
            'status' => 'success',
            'message' => 'Выход выполнен'
        ]);
    }

    /**
     * Get authenticated user
     */
    public function me(Request $request)
    {
        return response()->json([
            'status' => 'success',
            'user' => $this->formatUser($request->user()),
        ]);
    }

    /**
     * Get current user (alias)
     */
    public function user(Request $request)
    {
        return $this->me($request);
    }

    private function formatUser($user)
    {
        if (!$user) return null;

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'avatar' => $user->avatar_url,
            'role' => $user->role,
            'is_admin' => $user->isAdmin(),
            'email_verified_at' => $user->email_verified_at,
            'last_login_at' => $user->last_login_at,
            'created_at' => $user->created_at,
            'permissions' => $this->getUserPermissions($user),
        ];
    }

    private function getUserPermissions($user)
    {
        $permissions = [
            'can_access_admin' => $user->isAdmin(),
            'can_manage_users' => $user->isAdmin(),
            'can_edit_profile' => true,
        ];

        if ($user->isAdmin()) {
            $permissions = array_merge($permissions, [
                'can_delete_users' => true,
                'can_export_data' => true,
                'can_manage_settings' => true,
            ]);
        }

        return $permissions;
    }
}
