<?php

namespace Database\Seeders;

use App\Enums\Fundamento;
use App\Models\Exercicio;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;

/**
 * Biblioteca inicial: os exercícios de database/seeders/dados/exercicios.json.
 *
 * Idempotente por nome: rodar de novo atualiza em vez de duplicar. Um exercício que o admin
 * excluiu logicamente é atualizado, mas continua excluído (a decisão do admin prevalece).
 * criado_por fica null (conteúdo do projeto, não de um usuário) e a ilustração é a do fundamento.
 */
class ExercicioSeeder extends Seeder
{
    public const string ARQUIVO = __DIR__.'/dados/exercicios.json';

    public function run(): void
    {
        /** @var list<array<string, mixed>> $exercicios */
        $exercicios = File::json(self::ARQUIVO, JSON_THROW_ON_ERROR);

        foreach ($exercicios as $dados) {
            $fundamento = Fundamento::from((string) $dados['fundamento']);

            Exercicio::withTrashed()->updateOrCreate(
                ['nome' => $dados['nome']],
                [
                    'descricao' => $dados['descricao'],
                    'foco' => $dados['foco'],
                    'fundamento' => $fundamento,
                    'nivel' => $dados['nivel'],
                    'series_padrao' => $dados['series_padrao'],
                    'repeticoes_padrao' => $dados['repeticoes_padrao'],
                    'duracao_segundos_padrao' => $dados['duracao_segundos_padrao'],
                    'descanso_segundos' => $dados['descanso_segundos'],
                    'video_url' => $dados['video_url'],
                    'imagem_url' => Exercicio::ilustracaoDoFundamento($fundamento),
                ],
            );
        }
    }
}
