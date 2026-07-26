<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class ProfileController extends Controller
{
    /**
     * Get user profile
     */
    public function show(Request $request)
    {
//        $user = $request->user()->loadCount(['orders', 'posts']); // пример отношений
        $user=$request->user();

        return response()->json([
            'status' => 'success',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar' => $user->avatar_url,
                'phone' => $user->phone,
                'bio' => $user->bio,
                'address' => $user->address,
                'preferences' => $user->preferences,
//                'stats' => [
//                    'orders_count' => $user->orders_count ?? 0,
//                    'posts_count' => $user->posts_count ?? 0,
//                    'member_since' => $user->created_at->format('Y-m-d'),
//                ],
                'created_at' => $user->created_at,
                'updated_at' => $user->updated_at,
            ],
        ]);
    }

    /**
     * Update user profile
     */
    public function update(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'phone' => 'nullable|string|max:20',
            'bio' => 'nullable|string|max:500',
            'address' => 'nullable|string|max:255',
            'preferences' => 'nullable|array',
            'preferences.theme' => 'nullable|in:light,dark',
            'preferences.language' => 'nullable|in:en,ru',
            'preferences.notifications' => 'nullable|boolean',
        ]);

        // Если меняется email, отправляем верификацию
        if (isset($validated['email']) && $validated['email'] !== $user->email) {
            $validated['email_verified_at'] = null;
            // $user->sendEmailVerificationNotification();
        }

        $user->update($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Profile updated successfully',
            'user' => $user->fresh(),
        ]);
    }

    /**
     * Update password
     */
    public function updatePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:8|different:current_password',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Пароли не совпадают.'],
            ]);
        }

        $user->update([
            'password' => Hash::make($request->password),
        ]);

        // Revoke all other tokens except current
        $user->tokens()->where('id', '!=', $request->user()->currentAccessToken()->id)->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Пароль успешно обновлен',
        ]);
    }

    /**
     * Update avatar
     */
    public function updateAvatar(Request $request)
    {
        $request->validate([
            'avatar' => 'required|image|max:2048', // max 2MB
        ]);

        $user = $request->user();

        // Delete old avatar
        if ($user->avatar) {
            Storage::disk('public')->delete($user->avatar);
        }

        $path = $request->file('avatar')->store('avatars', 'public');
        $user->update(['avatar' => $path]);

        return response()->json([
            'status' => 'success',
            'message' => 'Аватар успешно обновлен',
            'avatar_url' => $user->fresh()->avatar_url,
        ]);
    }

    /**
     * Delete account
     */
    public function deleteAccount(Request $request)
    {
        $request->validate([
            'password' => 'required|string',
        ]);

        $user = $request->user();

        if (!Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'password' => ['Password is incorrect.'],
            ]);
        }

        // Soft delete or anonymize
        $user->tokens()->delete();
        $user->update([
            'name' => 'Deleted User',
            'email' => 'deleted_' . $user->id . '@anonymous.com',
            'phone' => null,
            'bio' => null,
            'address' => null,
            'avatar' => null,
            'is_active' => false,
        ]);
        $user->delete(); // soft delete

        return response()->json([
            'status' => 'success',
            'message' => 'Account deleted successfully',
        ]);
    }

    /**
     * User dashboard
     */
    public function dashboard(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'status' => 'success',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'avatar' => $user->avatar_url,
            ],
            'stats' => [
                'login_streak' => $this->calculateLoginStreak($user),
                'last_activities' => $this->getRecentActivities($user),
            ],
            'quick_actions' => [
                ['label' => 'Edit Profile', 'url' => '/profile'],
                ['label' => 'Change Password', 'url' => '/profile/security'],
                ['label' => 'View Orders', 'url' => '/orders'],
            ],
        ]);
    }

    private function calculateLoginStreak($user)
    {
        // Implement login streak logic
        return 5; // placeholder
    }

    private function getRecentActivities($user)
    {
        // Implement recent activities logic
        return [
            ['action' => 'Profile updated', 'date' => now()->subHours(2)->toISOString()],
            ['action' => 'Logged in', 'date' => now()->toISOString()],
        ];
    }

}
