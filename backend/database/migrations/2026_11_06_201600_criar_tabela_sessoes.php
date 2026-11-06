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
        Schema::create('sessoes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('usuario_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('treino_id')->nullable()->index()->constrained('treinos')->nullOnDelete();
            $table->string('origem', 20);
            $table->timestampTz('iniciada_em');
            $table->timestampTz('finalizada_em');
            $table->integer('duracao_segundos');
            $table->text('observacao')->nullable();
            $table->uuid('id_cliente')->nullable()->unique();
            $table->timestamps();

            // Também serve de índice da chave estrangeira usuario_id.
            $table->index(['usuario_id', 'iniciada_em']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sessoes');
    }
};
