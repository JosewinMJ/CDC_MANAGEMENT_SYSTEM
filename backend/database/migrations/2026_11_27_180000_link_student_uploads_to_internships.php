<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('student_documents', function (Blueprint $table) {
            $table->foreignId('internship_id')->nullable()->constrained()->nullOnDelete();
            $table->string('storage_path')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('student_documents', function (Blueprint $table) {
            $table->dropConstrainedForeignId('internship_id');
            $table->dropColumn('storage_path');
        });
    }
};
