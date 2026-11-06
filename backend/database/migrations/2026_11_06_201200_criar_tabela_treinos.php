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
        Schema::create('treinos', function (Blueprint $table) {
            $table->id();
            $table->string('nome', 120);
            $table->text('descricao')->nullable();
            $table->string('nivel', 20);
            $table->string('visibilidade', 20);
            $table->foreignId('autor_id')->constrained('users')->cascadeOnDelete();
            $table->smallInteger('duracao_estimada_minutos');
            $table->timestamps();
            $table->softDeletes();

            // Também serve de índice da chave estrangeira autor_id.
            $table->index(['autor_id', 'visibilidade']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('treinos');
    }
};
