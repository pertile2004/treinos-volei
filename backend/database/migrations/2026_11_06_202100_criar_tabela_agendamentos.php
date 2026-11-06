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
        Schema::create('agendamentos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('usuario_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('treino_id')->index()->constrained('treinos')->cascadeOnDelete();
            $table->date('data');
            $table->time('hora')->nullable();
            $table->foreignId('sessao_id')->nullable()->index()->constrained('sessoes')->nullOnDelete();
            $table->timestamps();

            // Também serve de índice da chave estrangeira usuario_id.
            $table->index(['usuario_id', 'data']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('agendamentos');
    }
};
