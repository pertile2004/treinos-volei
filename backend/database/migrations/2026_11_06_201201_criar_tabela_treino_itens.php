<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('treino_itens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('treino_id')->constrained('treinos')->cascadeOnDelete();
            $table->foreignId('exercicio_id')->index()->constrained('exercicios');
            $table->string('etapa', 20);
            $table->smallInteger('ordem');
            $table->smallInteger('series');
            $table->smallInteger('repeticoes')->nullable();
            $table->integer('duracao_segundos')->nullable();
            $table->smallInteger('descanso_segundos');

            // Também serve de índice da chave estrangeira treino_id.
            $table->unique(['treino_id', 'etapa', 'ordem']);
        });

        // O Blueprint não tem CHECK: a regra "repetições ou duração" vai em SQL.
        DB::statement(
            'ALTER TABLE treino_itens ADD CONSTRAINT treino_itens_repeticoes_ou_duracao_check '
            .'CHECK (repeticoes IS NOT NULL OR duracao_segundos IS NOT NULL)'
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('treino_itens');
    }
};
