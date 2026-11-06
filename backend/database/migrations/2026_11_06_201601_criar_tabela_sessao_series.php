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
        Schema::create('sessao_series', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sessao_id')->index()->constrained('sessoes')->cascadeOnDelete();
            $table->foreignId('exercicio_id')->nullable()->index()->constrained('exercicios')->nullOnDelete();
            $table->string('fundamento', 20)->index();
            $table->smallInteger('numero');
            $table->smallInteger('repeticoes')->nullable();
            $table->smallInteger('acertos')->default(0);
            $table->smallInteger('erros')->default(0);
            $table->integer('duracao_segundos')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sessao_series');
    }
};
