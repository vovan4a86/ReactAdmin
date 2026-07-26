<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    /**
     * Получить список всех пользователей (только для админов)
     */
    public function index(Request $request)
    {
        $query = User::query();

        // Filters
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        if ($request->filled('status')) {
            if ($request->status === 'active') {
                $query->whereNull('deleted_at');
            } elseif ($request->status === 'inactive') {
                $query->onlyTrashed();
            }
        }

        // Sorting
        $sortField = $request->get('sort_by', 'created_at');
        $sortDirection = $request->get('sort_direction', 'desc');
        $query->orderBy($sortField, $sortDirection);

        // Pagination
        $perPage = min($request->get('per_page', 15), 100);
        $users = $query->paginate($perPage);

        return response()->json([
            'status' => 'success',
            'users' => $users->through(function ($user) {
                return $this->formatUser($user);
            }),
            'pagination' => [
                'total' => $users->total(),
                'per_page' => $users->perPage(),
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
            ],
        ]);
    }

    /**
     * Создать пользователя.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|min:8',
            'role' => 'in:admin,editor,user',
            'is_active' => 'sometimes|boolean',
        ]);
        $validated['password'] = Hash::make($validated['password']);

        $user = User::create($validated);

        return response()->json([
            'status' => 'success',
            'message' => '|Пользователь успешно создан',
            'user' => $this->formatUser($user),
        ], 201);
    }

    /**
     * Получить конкретного пользователя (только админы могут видеть всех).
     */
    public function show(User $user)
    {
        return response()->json([
            'status' => 'success',
            'user' => $this->formatUser($user->loadCount('tokens')),
        ]);
    }

    /**
     * Обновить пользователя.
     */
    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'password' => 'sometimes|string|min:8',
            'role' => 'sometimes|in:user,editor,admin',
            'is_active' => 'sometimes|boolean',
        ]);

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }

        $user->update($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'User updated successfully',
            'user' => $this->formatUser($user->fresh()),
        ]);
    }

    /**
     * Удалить пользователя.
     */
    public function destroy(User $user)
    {
        // Не даем удалить самого себя
        if ($user->id === auth()->id()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Нельзя удалить собственный аккаунт'
            ], 422);
        }

        $user->tokens()->delete();
        $user->delete(); // soft delete

        return response()->json([
            'status' => 'success',
            'message' => 'User deleted successfully',
        ]);
    }

    /**
     * Toggle user active status
     */
    public function toggleStatus(Request $request, User $user)
    {
        $user->update(['is_active' => !$user->is_active]);

        return response()->json([
            'status' => 'success',
            'message' => $user->is_active ? 'User activated' : 'User deactivated',
            'user' => $this->formatUser($user),
        ]);
    }

    /**
     * Change user role
     */
    public function changeRole(Request $request, User $user)
    {
        $request->validate([
            'role' => 'required|in:user,editor,admin',
        ]);

        $user->update(['role' => $request->role]);

        return response()->json([
            'status' => 'success',
            'message' => "Роль пользователя изменена на {$request->role}",
            'user' => $this->formatUser($user),
        ]);
    }

    /**
     * Impersonate user (login as another user)
     */
    public function impersonate(Request $request, User $user)
    {
        // Store admin token info in session/cache
        $adminId = auth()->id();
        session(['impersonating_admin' => $adminId]);

        // Create new token for impersonation
        $token = $user->createToken('impersonation_token')->plainTextToken;

        return response()->json([
            'status' => 'success',
            'message' => "Now impersonating {$user->name}",
            'user' => $this->formatUser($user),
            'token' => $token,
            'impersonating' => true,
        ]);
    }

    /**
     * Format user for admin response
     */
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
            'is_active' => $user->is_active,
            'email_verified_at' => $user->email_verified_at,
            'last_login_at' => $user->last_login_at,
            'tokens_count' => $user->tokens_count ?? 0,
            'created_at' => $user->created_at,
            'updated_at' => $user->updated_at,
            'deleted_at' => $user->deleted_at,
        ];
    }
}
