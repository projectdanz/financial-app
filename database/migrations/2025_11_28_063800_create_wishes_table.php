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
        Schema::create('wishes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->text('deskripsi')->nullable();
            $table->decimal('price', 15, 2);
            $table->decimal('diff_to_reach', 15, 2)->default(0);
            $table->enum('status', ['sudah_tercapai', 'dana_terpenuhi', 'dana_belum_terkumpul'])->default('dana_belum_terkumpul');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wishes');
    }
};
