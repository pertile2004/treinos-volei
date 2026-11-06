<?php

namespace Database\Seeders;

use App\Enums\Etapa;
use App\Enums\Fundamento;
use App\Enums\Nivel;
use App\Enums\OrigemSessao;
use App\Enums\Papel;
use App\Enums\Visibilidade;
use App\Models\Exercicio;
use App\Models\Treino;
use App\Models\User;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * Dados de demonstração: o jogador Guto com cerca de 13 semanas de sessões,
 * um admin, uma treinadora com dois atletas e treinos públicos em destaque.
 *
 * Só roda nos ambientes de config('volleypro.demo.ambientes'); a senha do jogador
 * e da treinadora vem de DEMO_SENHA e a do admin de DEMO_SENHA_ADMIN (diferente,
 * para quem testa com a senha do Guto não entrar como administrador). É idempotente: usuários por e-mail, exercícios e treinos por nome;
 * as sessões do Guto são recriadas a cada execução.
 *
 * Tudo é determinístico (sem aleatório) para o cálculo manual do aceite. Semana
 * de referência (semana atual, com todos os dias no passado):
 *   segunda 07:00, 45 min, cronômetro: recepção 42/18, saque 15/5
 *   quarta 19:30, 60 min, cronômetro: ataque 20/10, bloqueio 6/6
 *   sexta 21:30, 40 min, registro rápido: defesa 12/8 (em UTC já é sábado)
 *   sábado 10:00, 30 min, cronômetro: recepção 45/15, saque 18/2
 *   total 175 min; 4 dias treinados (meta 3); levantamento e preparo físico sem dados.
 * Nas semanas anteriores há faltas fixas e acertos um pouco menores (evolução).
 */
class DemoSeeder extends Seeder
{
    public const EMAIL_GUTO = 'guto@example.com';

    public const EMAIL_ADMIN = 'admin@example.com';

    public const EMAIL_TREINADORA = 'carla@example.com';

    public const EMAILS_ATLETAS = ['pedro@example.com', 'ana@example.com'];

    public const CODIGO_CONVITE = 'CARLA234';

    /** Semana atual + 12 anteriores: a janela de "3 meses". */
    private const SEMANAS = 13;

    public function run(): void
    {
        /** @var list<string> $ambientes */
        $ambientes = config('volleypro.demo.ambientes');

        if (! app()->environment($ambientes)) {
            throw new RuntimeException(sprintf(
                'O DemoSeeder só roda nos ambientes %s (ambiente atual: %s).',
                implode(', ', $ambientes),
                app()->environment(),
            ));
        }

        $senha = $this->senha('senha', 'DEMO_SENHA');
        $senhaAdmin = $this->senha('senha_admin', 'DEMO_SENHA_ADMIN');

        if ($senhaAdmin === $senha) {
            throw new RuntimeException('DEMO_SENHA_ADMIN precisa ser diferente de DEMO_SENHA: a senha do jogador não pode abrir a conta de administrador.');
        }

        DB::transaction(function () use ($senha, $senhaAdmin): void {
            $admin = $this->usuario(self::EMAIL_ADMIN, 'Administração VOLLEY PRO', Papel::Admin, $senhaAdmin);
            $exercicios = $this->exercicios($admin);
            $this->treinosPublicos($admin, $exercicios);

            $treinadora = $this->usuario(self::EMAIL_TREINADORA, 'Carla Mendes', Papel::Treinador, $senha);
            $treinadora->codigo_convite = self::CODIGO_CONVITE;
            $treinadora->save();

            foreach (self::EMAILS_ATLETAS as $i => $email) {
                $atleta = $this->usuario($email, $i === 0 ? 'Pedro Lima' : 'Ana Costa', Papel::Jogador, $senha);
                $atleta->treinador()->associate($treinadora);
                $atleta->save();
            }

            $guto = $this->usuario(self::EMAIL_GUTO, 'Guto Silva', Papel::Jogador, $senha, 3);
            $this->sessoesDoGuto($guto, $exercicios);
        });
    }

    private function senha(string $chave, string $variavel): string
    {
        $senha = config("volleypro.demo.{$chave}");

        if (! is_string($senha) || $senha === '') {
            throw new RuntimeException("Defina {$variavel} no .env para o DemoSeeder criar as contas de demonstração.");
        }

        return $senha;
    }

    private function usuario(string $email, string $nome, Papel $papel, string $senha, int $metaSemanal = 3): User
    {
        return User::query()->updateOrCreate(['email' => $email], [
            'nome' => $nome,
            'papel' => $papel,
            'password' => $senha,
            'meta_semanal' => $metaSemanal,
        ]);
    }

    /**
     * Um exercício por fundamento, criado pelo admin. Sem vídeo: nunca inventamos URL.
     *
     * @return array<string, Exercicio> indexado pelo valor do fundamento
     */
    private function exercicios(User $admin): array
    {
        $dados = [
            [Fundamento::Recepcao, 'Recepção de saque em dupla', 'Um atleta saca por baixo e o outro recebe de manchete para um alvo marcado no chão.', 'Plataforma firme e deslocamento antes do contato', Nivel::Iniciante, 3, 10],
            [Fundamento::Levantamento, 'Levantamento na parede', 'Toque contínuo contra a parede acima de uma linha marcada, controlando a altura.', 'Mãos acima da testa e extensão completa', Nivel::Iniciante, 3, 15],
            [Fundamento::Ataque, 'Ataque de ponta com aproximação', 'Passada de aproximação em três passos e ataque na diagonal longa.', 'Ritmo da passada e braço alto', Nivel::Intermediario, 3, 8],
            [Fundamento::Saque, 'Saque por cima no alvo', 'Saque por cima mirando um colchonete nas zonas 1 e 5.', 'Lançamento constante e contato à frente do corpo', Nivel::Intermediario, 2, 10],
            [Fundamento::Bloqueio, 'Bloqueio de leitura', 'Deslocamento lateral na rede e salto de bloqueio lendo o levantador.', 'Mãos invadindo a rede e aterrissagem equilibrada', Nivel::Intermediario, 2, 6],
            [Fundamento::Defesa, 'Defesa de bola rápida', 'Parceiro ataca de perto; o atleta defende em posição baixa.', 'Base baixa e contato controlado', Nivel::Intermediario, 2, 10],
            [Fundamento::PreparoFisico, 'Corrida leve', 'Trote contínuo em ritmo confortável para aquecer.', 'Respiração e postura', Nivel::Iniciante, 1, null],
        ];

        $exercicios = [];

        foreach ($dados as [$fundamento, $nome, $descricao, $foco, $nivel, $series, $repeticoes]) {
            $exercicio = Exercicio::query()->withTrashed()->firstOrNew(['nome' => $nome]);
            $exercicio->fill([
                'descricao' => $descricao,
                'foco' => $foco,
                'fundamento' => $fundamento,
                'nivel' => $nivel,
                'series_padrao' => $series,
                'repeticoes_padrao' => $repeticoes,
                'duracao_segundos_padrao' => $repeticoes === null ? 300 : null,
                'descanso_segundos' => 45,
                'video_url' => null,
                'imagem_url' => null,
            ]);
            $exercicio->criador()->associate($admin);
            $exercicio->save();

            $exercicios[$fundamento->value] = $exercicio;
        }

        return $exercicios;
    }

    /**
     * @param  array<string, Exercicio>  $exercicios
     */
    private function treinosPublicos(User $admin, array $exercicios): void
    {
        $aquecimento = [Fundamento::PreparoFisico, Etapa::Aquecimento, 1, null, 300];

        $this->treino($admin, 'Fundamentos para começar', Visibilidade::Publico, Nivel::Iniciante, 40, 'Recepção e levantamento para quem está começando.', $exercicios, [
            $aquecimento,
            [Fundamento::Recepcao, Etapa::Tecnica, 3, 10, null],
            [Fundamento::Levantamento, Etapa::Tecnica, 3, 15, null],
        ]);

        $this->treino($admin, 'Saque e recepção', Visibilidade::Publico, Nivel::Intermediario, 50, 'Saque no alvo e recepção em dupla, com volume alto.', $exercicios, [
            $aquecimento,
            [Fundamento::Saque, Etapa::Tecnica, 3, 10, null],
            [Fundamento::Recepcao, Etapa::Tecnica, 3, 12, null],
            [Fundamento::Saque, Etapa::Especifico, 2, 8, null],
        ]);

        $this->treino($admin, 'Rede: ataque e bloqueio', Visibilidade::Publico, Nivel::Intermediario, 55, 'Aproximação, ataque e bloqueio de leitura.', $exercicios, [
            $aquecimento,
            [Fundamento::Ataque, Etapa::Tecnica, 3, 8, null],
            [Fundamento::Bloqueio, Etapa::Tecnica, 3, 6, null],
            [Fundamento::Defesa, Etapa::Especifico, 2, 10, null],
        ]);

        $this->treino($admin, 'Defesa e preparo físico', Visibilidade::Publico, Nivel::Avancado, 45, 'Defesa de bola rápida e condicionamento.', $exercicios, [
            $aquecimento,
            [Fundamento::Defesa, Etapa::Tecnica, 4, 10, null],
            [Fundamento::PreparoFisico, Etapa::VoltaACalma, 1, null, 300],
        ]);
    }

    /**
     * Cria o treino (ou reaproveita o de mesmo nome do autor) e seus itens, uma única vez.
     *
     * @param  array<string, Exercicio>  $exercicios
     * @param  list<array{0: Fundamento, 1: Etapa, 2: int, 3: int|null, 4: int|null}>  $itens  fundamento do exercício, etapa, séries, repetições, duração
     */
    private function treino(User $autor, string $nome, Visibilidade $visibilidade, Nivel $nivel, int $duracaoMinutos, string $descricao, array $exercicios, array $itens): Treino
    {
        $treino = $autor->treinos()->firstOrNew(['nome' => $nome]);
        $treino->fill([
            'descricao' => $descricao,
            'nivel' => $nivel,
            'visibilidade' => $visibilidade,
            'duracao_estimada_minutos' => $duracaoMinutos,
        ]);
        $treino->save();

        if ($treino->itens()->exists()) {
            return $treino;
        }

        $ordens = [];

        foreach ($itens as [$fundamento, $etapa, $series, $repeticoes, $duracao]) {
            $ordens[$etapa->value] = ($ordens[$etapa->value] ?? 0) + 1;

            $treino->itens()->create([
                'exercicio_id' => $exercicios[$fundamento->value]->id,
                'etapa' => $etapa,
                'ordem' => $ordens[$etapa->value],
                'series' => $series,
                'repeticoes' => $repeticoes,
                'duracao_segundos' => $duracao,
                'descanso_segundos' => 45,
            ]);
        }

        return $treino;
    }

    /**
     * Apaga e recria as sessões do Guto nas últimas 13 semanas, até "agora".
     *
     * @param  array<string, Exercicio>  $exercicios
     */
    private function sessoesDoGuto(User $guto, array $exercicios): void
    {
        $fuso = config()->string('volleypro.fuso');
        $agora = Carbon::now($fuso)->toImmutable();
        $segundaAtual = $agora->startOfWeek(CarbonInterface::MONDAY);

        $treinoRecepcao = $this->treino($guto, 'Recepção e saque', Visibilidade::Privado, Nivel::Intermediario, 45, 'Meu treino de recepção e saque.', $exercicios, [
            [Fundamento::Recepcao, Etapa::Tecnica, 3, 20, null],
            [Fundamento::Saque, Etapa::Tecnica, 2, 10, null],
        ]);
        $treinoRede = $this->treino($guto, 'Ataque e bloqueio', Visibilidade::Privado, Nivel::Intermediario, 60, 'Meu treino de rede.', $exercicios, [
            [Fundamento::Ataque, Etapa::Tecnica, 3, 11, null],
            [Fundamento::Bloqueio, Etapa::Tecnica, 2, 6, null],
        ]);

        $guto->sessoes()->delete();

        for ($semana = 0; $semana < self::SEMANAS; $semana++) {
            $segunda = $segundaAtual->subWeeks($semana);

            foreach ($this->planoDaSemana($semana, $treinoRecepcao, $treinoRede) as $plano) {
                $inicio = $segunda->addDays($plano['dia'])->setTimeFromTimeString($plano['hora']);

                if ($inicio->greaterThanOrEqualTo($agora)) {
                    continue;
                }

                $this->sessao($guto, $inicio, $plano, $exercicios);
            }
        }
    }

    /**
     * Sessões de uma semana, com as faltas fixas e a evolução por semana.
     *
     * @return list<array{dia: int, hora: string, minutos: int, origem: OrigemSessao, treino: Treino|null, series: list<array{0: Fundamento, 1: int, 2: int}>}>
     */
    private function planoDaSemana(int $semana, Treino $treinoRecepcao, Treino $treinoRede): array
    {
        // Quanto mais antiga a semana, um pouco menos acertos e mais erros (mesmo total).
        $ajuste = intdiv($semana, 3);
        $serie = fn (Fundamento $f, int $acertos, int $erros): array => [$f, max(0, $acertos - $ajuste), $erros + $ajuste];

        $plano = [];

        if ($semana !== 5) {
            $plano[] = ['dia' => 0, 'hora' => '07:00', 'minutos' => 45 + 5 * ($semana % 3), 'origem' => OrigemSessao::Cronometro, 'treino' => $treinoRecepcao, 'series' => [
                $serie(Fundamento::Recepcao, 14, 6), $serie(Fundamento::Recepcao, 14, 6), $serie(Fundamento::Recepcao, 14, 6),
                $serie(Fundamento::Saque, 8, 2), $serie(Fundamento::Saque, 7, 3),
            ]];
        }

        if ($semana % 4 !== 2) {
            $plano[] = ['dia' => 2, 'hora' => '19:30', 'minutos' => 60 + 15 * ($semana % 2), 'origem' => OrigemSessao::Cronometro, 'treino' => $treinoRede, 'series' => [
                $serie(Fundamento::Ataque, 8, 3), $serie(Fundamento::Ataque, 7, 4), $serie(Fundamento::Ataque, 5, 3),
                $serie(Fundamento::Bloqueio, 3, 3), $serie(Fundamento::Bloqueio, 3, 3),
            ]];
        }

        if ($semana !== 9) {
            // Depois das 21h em São Paulo: em UTC já é sábado (RN-01).
            $plano[] = ['dia' => 4, 'hora' => '21:30', 'minutos' => 40, 'origem' => OrigemSessao::RegistroRapido, 'treino' => null, 'series' => [
                $serie(Fundamento::Defesa, 12, 8),
            ]];
        }

        if ($semana % 3 !== 1) {
            $plano[] = ['dia' => 5, 'hora' => '10:00', 'minutos' => 30 + 10 * ($semana % 2), 'origem' => OrigemSessao::Cronometro, 'treino' => $treinoRecepcao, 'series' => [
                $serie(Fundamento::Recepcao, 15, 5), $serie(Fundamento::Recepcao, 15, 5), $serie(Fundamento::Recepcao, 15, 5),
                $serie(Fundamento::Saque, 9, 1), $serie(Fundamento::Saque, 9, 1),
            ]];
        }

        return $plano;
    }

    /**
     * @param  array{minutos: int, origem: OrigemSessao, treino: Treino|null, series: list<array{0: Fundamento, 1: int, 2: int}>}  $plano
     * @param  array<string, Exercicio>  $exercicios
     */
    private function sessao(User $guto, CarbonImmutable $inicio, array $plano, array $exercicios): void
    {
        $duracao = $plano['minutos'] * 60;

        $sessao = $guto->sessoes()->create([
            'treino_id' => $plano['treino']?->id,
            'origem' => $plano['origem'],
            'iniciada_em' => $inicio->utc(),
            'finalizada_em' => $inicio->addSeconds($duracao)->utc(),
            'duracao_segundos' => $duracao,
            'observacao' => null,
            'id_cliente' => null,
        ]);

        $series = [];

        foreach ($plano['series'] as $numero => [$fundamento, $acertos, $erros]) {
            $series[] = [
                'exercicio_id' => $plano['origem'] === OrigemSessao::Cronometro ? $exercicios[$fundamento->value]->id : null,
                'fundamento' => $fundamento,
                'numero' => $numero + 1,
                'repeticoes' => $acertos + $erros,
                'acertos' => $acertos,
                'erros' => $erros,
                'duracao_segundos' => null,
            ];
        }

        $sessao->series()->createMany($series);
    }
}
