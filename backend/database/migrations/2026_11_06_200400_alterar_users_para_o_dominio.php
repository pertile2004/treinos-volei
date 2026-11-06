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
            $table->renameColumn('name', 'nome');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->string('nome', 100)->change();

            // O padrão de papel é temporário: só preenche as linhas que já existem.
            $table->string('papel', 20)->default('jogador')->index();
            $table->smallInteger('meta_semanal')->default(3);
            $table->date('data_nascimento')->nullable();
            $table->char('codigo_convite', 8)->nullable()->unique();
            $table->foreignId('treinador_id')->nullable()->index()->constrained('users')->nullOnDelete();
        });

        // No modelo de dados o papel não tem padrão: quem grava sempre informa.
        Schema::table('users', function (Blueprint $table) {
            $table->string('papel', 20)->default(null)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('treinador_id');
            $table->dropColumn(['papel', 'meta_semanal', 'data_nascimento', 'codigo_convite']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->string('nome')->change();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->renameColumn('nome', 'name');
        });
    }
};
