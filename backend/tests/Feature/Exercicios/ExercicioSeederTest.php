<?php

use App\Enums\Fundamento;
use App\Enums\Nivel;
use App\Models\Exercicio;
use Database\Seeders\DatabaseSeeder;
use Database\Seeders\ExercicioSeeder;

it('semeia cerca de 40 exercicios reais, com o minimo por fundamento', function () {
    $this->seed(ExercicioSeeder::class);

    $porFundamento = Exercicio::query()
        ->selectRaw('fundamento, count(*) as total')
        ->groupBy('fundamento')
        ->pluck('total', 'fundamento');

    expect(Exercicio::query()->count())->toBeGreaterThanOrEqual(40)
        ->and($porFundamento->get('preparo_fisico', 0))->toBeGreaterThanOrEqual(1);

    foreach (Fundamento::cases() as $fundamento) {
        if ($fundamento === Fundamento::PreparoFisico) {
            continue;
        }

        expect($porFundamento->get($fundamento->value, 0))
            ->toBeGreaterThanOrEqual(5, "fundamento {$fundamento->value} com menos de 5 exercicios");
    }
});

it('semeia cada exercicio completo: foco, padroes, descanso, ilustracao e sem criador', function () {
    $this->seed(ExercicioSeeder::class);

    $exercicios = Exercicio::query()->get();

    expect($exercicios->pluck('nome')->unique())->toHaveCount($exercicios->count());

    foreach ($exercicios as $exercicio) {
        expect($exercicio->nome)->toBeString()->not->toBeEmpty()
            ->and($exercicio->descricao)->toBeString()->not->toBeEmpty()
            ->and($exercicio->foco)->toBeString()->not->toBeEmpty()
            ->and($exercicio->fundamento)->toBeInstanceOf(Fundamento::class)
            ->and($exercicio->nivel)->toBeInstanceOf(Nivel::class)
            ->and($exercicio->series_padrao)->toBeGreaterThanOrEqual(1)
            ->and($exercicio->repeticoes_padrao !== null || $exercicio->duracao_segundos_padrao !== null)->toBeTrue()
            ->and($exercicio->descanso_segundos)->toBeGreaterThanOrEqual(0)
            ->and($exercicio->imagem_url)->toBe('/ilustracoes/'.$exercicio->fundamento->value.'.svg')
            ->and($exercicio->criado_por)->toBeNull()
            ->and($exercicio->deleted_at)->toBeNull();

        if ($exercicio->video_url !== null) {
            expect($exercicio->video_url)->toMatch('#^https://(www\.)?(youtube\.com|youtu\.be)/#');
        }
    }
});

it('pode rodar mais de uma vez sem duplicar nem apagar alteracoes de exclusao', function () {
    $this->seed(ExercicioSeeder::class);
    $total = Exercicio::query()->count();

    $excluido = Exercicio::query()->firstOrFail();
    $excluido->delete();

    $this->seed(ExercicioSeeder::class);

    expect(Exercicio::query()->count())->toBe($total - 1)
        ->and(Exercicio::withTrashed()->count())->toBe($total)
        ->and(Exercicio::withTrashed()->find($excluido->id)->trashed())->toBeTrue();
});

it('entra no DatabaseSeeder', function () {
    $this->seed(DatabaseSeeder::class);

    expect(Exercicio::query()->count())->toBeGreaterThanOrEqual(40);
});
