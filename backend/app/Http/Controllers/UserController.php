<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /**
     * Получить список всех пользователей (только для админов)
     */
    public function index()
    {
        $users = User::all();
        return response()->json($users);
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
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => bcrypt($validated['password']),
            'role' => $validated['role'] ?? 'user',
        ]);

        return response()->json($user, 201);
    }

    /**
     * Получить конкретного пользователя (только админы могут видеть всех).
     */
    public function show(string $id)
    {
        $user = User::findOrFail($id);
        return response()->json($user);
    }

    /**
     * Обновить пользователя.
     */
    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $id,
            'password' => 'sometimes|min:8',
            'role' => 'sometimes|in:admin,user',
        ]);

        if (isset($validated['password'])) {
            $validated['password'] = bcrypt($validated['password']);
        }

        $user->update($validated);
        return response()->json($user);
    }

    /**
     * Удалить пользователя.
     */
    public function destroy($id)
    {
        $user = User::findOrFail($id);

        // Не даем удалить самого себя
        if ($user->id === auth()->id()) {
            return response()->json(['message' => 'Нельзя удалить собственный аккаунт'], 403);
        }

        $user->delete();
        return response()->json(null, 204);
    }
}
