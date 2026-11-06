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
        Schema::create('exercicios', function (Blueprint $table) {
            $table->id();
            $table->string('nome', 120);
            $table->text('descricao');
            $table->string('foco', 160)->nullable();
            $table->string('fundamento', 20);
            $table->string('nivel', 20);
            $table->smallInteger('series_padrao');
            $table->smallInteger('repeticoes_padrao')->nullable();
            $table->integer('duracao_segundos_padrao')->nullable();
            $table->smallInteger('descanso_segundos')->default(45);
            $table->string('video_url')->nullable();
            $table->string('imagem_url')->nullable();
            $table->foreignId('criado_por')->nullable()->index()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['fundamento', 'nivel']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('exercicios');
    }
};
