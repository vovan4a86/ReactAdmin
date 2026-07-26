<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone')->nullable()->after('email');
            $table->text('bio')->nullable()->after('phone');
            $table->string('address')->nullable()->after('bio');
            $table->string('avatar')->nullable()->after('address');
            $table->json('preferences')->nullable()->after('avatar');
            $table->boolean('is_active')->default(true)->after('preferences');
            $table->timestamp('last_login_at')->nullable()->after('is_active');
            $table->softDeletes()->after('updated_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'phone', 'bio', 'address', 'avatar',
                'preferences', 'is_active',
                'last_login_at', 'deleted_at',
            ]);
        });
    }
};
