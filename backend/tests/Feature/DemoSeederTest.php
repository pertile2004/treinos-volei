<?php

use App\Enums\OrigemSessao;
use App\Enums\Papel;
use App\Enums\PeriodoEstatistica;
use App\Enums\Visibilidade;
use App\Models\Sessao;
use App\Models\Treino;
use App\Models\User;
use App\Services\EstatisticasService;
use Database\Seeders\DemoSeeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;

const FUSO_SP_SEED = 'America/Sao_Paulo';

// Domingo a noite: a semana de referencia (atual) esta completa.
const AGORA_SEED = '2026-11-08 22:00';

it('semeia a semana de referencia do Guto com os numeros do calculo manual', function () {
    Carbon::setTestNow(Carbon::parse(AGORA_SEED, FUSO_SP_SEED));

    $this->seed(DemoSeeder::class);

    $guto = User::query()->where('email', DemoSeeder::EMAIL_GUTO)->firstOrFail();
    $semana = app(EstatisticasService::class)->calcular($guto, PeriodoEstatistica::Semana);

    expect($guto->papel)->toBe(Papel::Jogador)
        ->and($guto->meta_semanal)->toBe(3)
        ->and(Hash::check(config('volleypro.demo.senha'), $guto->password))->toBeTrue()
        ->and($semana['inicio'])->toBe('2026-11-02')
        ->and(collect($semana['volume']['pontos'])->pluck('minutos', 'inicio')->all())->toBe([
            '2026-11-02' => 45,
            '2026-11-03' => 0,
            '2026-11-04' => 60,
            '2026-11-05' => 0,
            '2026-11-06' => 40,
            '2026-11-07' => 30,
            '2026-11-08' => 0,
        ])
        ->and($semana['volume']['total_minutos'])->toBe(175)
        ->and(collect($semana['desempenho'])->map(fn (array $d) => [$d['acertos'], $d['erros'], $d['percentual']])->all())->toBe([
            [87, 33, 72.5],      // recepcao
            [0, 0, null],        // levantamento: "sem dados"
            [20, 10, 66.7],      // ataque
            [33, 7, 82.5],       // saque
            [6, 6, 50.0],        // bloqueio
            [12, 8, 60.0],       // defesa
            [0, 0, null],        // preparo_fisico: "sem dados"
        ])
        ->and($semana['frequencia'])->toBe([
            'semana_inicio' => '2026-11-02',
            'semana_fim' => '2026-11-08',
            'dias_treinados' => 4,
            'meta' => 3,
            'datas' => ['2026-11-02', '2026-11-04', '2026-11-06', '2026-11-07'],
        ]);
});

it('gera cerca de tres meses de sessoes, com cronometro e registro rapido, e nenhuma no futuro', function () {
    Carbon::setTestNow(Carbon::parse(AGORA_SEED, FUSO_SP_SEED));

    $this->seed(DemoSeeder::class);

    $guto = User::query()->where('email', DemoSeeder::EMAIL_GUTO)->firstOrFail();
    $sessoes = $guto->sessoes()->with('series')->orderBy('iniciada_em')->get();
    $tresMeses = app(EstatisticasService::class)->calcular($guto, PeriodoEstatistica::TresMeses);

    expect($sessoes->count())->toBeGreaterThanOrEqual(40)
        ->and($sessoes->first()->iniciada_em->lessThan(now()->subWeeks(12)))->toBeTrue()
        ->and($sessoes->max('iniciada_em')->lessThan(now()))->toBeTrue()
        ->and($sessoes->where('origem', OrigemSessao::Cronometro)->isNotEmpty())->toBeTrue()
        ->and($sessoes->where('origem', OrigemSessao::RegistroRapido)->isNotEmpty())->toBeTrue()
        ->and($sessoes->every(fn (Sessao $s) => $s->series->isNotEmpty()))->toBeTrue()
        ->and($sessoes->every(fn (Sessao $s) => $s->duracao_segundos >= 30 * 60 && $s->duracao_segundos <= 75 * 60))->toBeTrue()
        // Sessao depois das 21h em SP: o dia em UTC ja e o seguinte.
        ->and($sessoes->contains(fn (Sessao $s) => $s->iniciada_em->setTimezone(FUSO_SP_SEED)->hour >= 21))->toBeTrue()
        ->and(collect($tresMeses['volume']['pontos'])->every(fn (array $p) => $p['minutos'] > 0))->toBeTrue();
});

it('semeia admin, treinador com codigo de convite e dois atletas, e treinos publicos em destaque', function () {
    $this->seed(DemoSeeder::class);

    $admin = User::query()->where('papel', Papel::Admin)->firstOrFail();
    $treinador = User::query()->where('papel', Papel::Treinador)->firstOrFail();

    expect($treinador->codigo_convite)->toMatch('/^[A-HJ-NP-Z2-9]{8}$/')
        ->and($treinador->atletas()->count())->toBe(2)
        ->and($treinador->atletas()->pluck('papel')->unique()->all())->toBe([Papel::Jogador])
        ->and(Treino::query()->where('visibilidade', Visibilidade::Publico)->count())->toBeGreaterThanOrEqual(3)
        ->and(Treino::query()->where('visibilidade', Visibilidade::Publico)->pluck('autor_id')->unique()->all())->toBe([$admin->id])
        ->and(Treino::query()->where('visibilidade', Visibilidade::Publico)->get()->every(fn (Treino $t) => $t->itens()->exists()))->toBeTrue();
});

it('pode rodar duas vezes sem duplicar nada', function () {
    Carbon::setTestNow(Carbon::parse(AGORA_SEED, FUSO_SP_SEED));

    $this->seed(DemoSeeder::class);
    $usuarios = User::query()->count();
    $sessoes = Sessao::query()->count();
    $treinos = Treino::query()->count();

    $this->seed(DemoSeeder::class);

    expect(User::query()->count())->toBe($usuarios)
        ->and(Sessao::query()->count())->toBe($sessoes)
        ->and(Treino::query()->count())->toBe($treinos)
        ->and(User::query()->where('email', DemoSeeder::EMAIL_GUTO)->count())->toBe(1);
});

it('se recusa a rodar fora de local, demo e testing', function () {
    // Chama o seeder direto: o comando db:seed pararia antes, na confirmacao do Artisan em producao.
    $this->app['env'] = 'production';

    expect(fn () => app(DemoSeeder::class)->run())->toThrow(RuntimeException::class, 'DemoSeeder');

    $this->app['env'] = 'testing';

    expect(User::query()->count())->toBe(0);
});

it('se recusa a rodar sem a senha de demonstracao configurada', function () {
    config(['volleypro.demo.senha' => null]);

    expect(fn () => $this->seed(DemoSeeder::class))->toThrow(RuntimeException::class, 'DEMO_SENHA');

    expect(User::query()->count())->toBe(0);
});

it('da ao admin uma senha propria, diferente da senha das outras contas', function () {
    $this->seed(DemoSeeder::class);

    $admin = User::query()->where('email', DemoSeeder::EMAIL_ADMIN)->firstOrFail();
    $guto = User::query()->where('email', DemoSeeder::EMAIL_GUTO)->firstOrFail();
    $treinadora = User::query()->where('email', DemoSeeder::EMAIL_TREINADORA)->firstOrFail();

    expect(Hash::check(config('volleypro.demo.senha_admin'), $admin->password))->toBeTrue()
        ->and(Hash::check(config('volleypro.demo.senha'), $admin->password))->toBeFalse()
        ->and(Hash::check(config('volleypro.demo.senha'), $guto->password))->toBeTrue()
        ->and(Hash::check(config('volleypro.demo.senha'), $treinadora->password))->toBeTrue();
});

it('se recusa a rodar sem a senha do admin ou com ela igual a senha das outras contas', function () {
    config(['volleypro.demo.senha_admin' => null]);

    expect(fn () => $this->seed(DemoSeeder::class))->toThrow(RuntimeException::class, 'DEMO_SENHA_ADMIN');

    config(['volleypro.demo.senha_admin' => config('volleypro.demo.senha')]);

    expect(fn () => $this->seed(DemoSeeder::class))->toThrow(RuntimeException::class, 'diferente');

    expect(User::query()->count())->toBe(0);
});
