<?php

namespace App\Services;

use App\Enums\Fundamento;
use App\Enums\PeriodoEstatistica;
use App\Models\User;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Contracts\Config\Repository;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Estatísticas de evolução do próprio usuário (RF-11, RN-01 a RN-04).
 *
 * Os limites da janela são calculados aqui, no fuso de negócio, e convertidos
 * para UTC; o WHERE compara instantes (índice (usuario_id, iniciada_em)). O fuso
 * só entra no agrupamento, com AT TIME ZONE. São sempre três consultas.
 *
 * @phpstan-type Ponto array{inicio: string, minutos: int}
 * @phpstan-type Volume array{granularidade: string, total_minutos: int, pontos: list<Ponto>}
 * @phpstan-type Desempenho array{fundamento: string, acertos: int, erros: int, tentativas: int, percentual: float|null}
 * @phpstan-type Frequencia array{semana_inicio: string, semana_fim: string, dias_treinados: int, meta: int, datas: list<string>}
 * @phpstan-type Estatisticas array{periodo: string, fuso: string, inicio: string, fim: string, volume: Volume, desempenho: list<Desempenho>, frequencia: Frequencia}
 */
class EstatisticasService
{
    /**
     * Unidade do date_trunc por granularidade. Mapa fixo: nunca vem do request.
     */
    private const UNIDADE_SQL = [
        'dia' => 'day',
        'semana' => 'week',
        'mes' => 'month',
    ];

    private readonly string $fuso;

    public function __construct(Repository $config)
    {
        $this->fuso = $config->string('volleypro.fuso');
    }

    /**
     * @return Estatisticas
     */
    public function calcular(User $usuario, PeriodoEstatistica $periodo): array
    {
        $agora = Carbon::now($this->fuso)->toImmutable();
        $segunda = $agora->startOfWeek(CarbonInterface::MONDAY);
        [$inicio, $fim] = $this->janela($periodo, $agora, $segunda);

        return [
            'periodo' => $periodo->value,
            'fuso' => $this->fuso,
            'inicio' => $inicio->toDateString(),
            'fim' => $fim->subDay()->toDateString(),
            'volume' => $this->volume($usuario, $periodo, $inicio, $fim),
            'desempenho' => $this->desempenho($usuario, $inicio, $fim),
            'frequencia' => $this->frequencia($usuario, $segunda),
        ];
    }

    /**
     * Início (inclusivo) e fim (exclusivo) da janela, no fuso de negócio.
     *
     * @return array{0: CarbonImmutable, 1: CarbonImmutable}
     */
    private function janela(PeriodoEstatistica $periodo, CarbonImmutable $agora, CarbonImmutable $segunda): array
    {
        $proximaSegunda = $segunda->addWeek();
        $mes = $agora->startOfMonth();

        return match ($periodo) {
            PeriodoEstatistica::Semana => [$segunda, $proximaSegunda],
            PeriodoEstatistica::Mes => [$segunda->subWeeks(3), $proximaSegunda],
            PeriodoEstatistica::TresMeses => [$segunda->subWeeks(12), $proximaSegunda],
            PeriodoEstatistica::Ano => [$mes->subMonthsNoOverflow(11), $mes->addMonthNoOverflow()],
        };
    }

    /**
     * @return Volume
     */
    private function volume(User $usuario, PeriodoEstatistica $periodo, CarbonImmutable $inicio, CarbonImmutable $fim): array
    {
        $granularidade = $periodo->granularidade();
        $unidade = self::UNIDADE_SQL[$granularidade];

        $segundosPorBalde = DB::table('sessoes')
            ->selectRaw("date_trunc('{$unidade}', iniciada_em at time zone ?::text)::date as inicio, sum(duracao_segundos) as segundos", [$this->fuso])
            ->where('usuario_id', $usuario->id)
            ->where('iniciada_em', '>=', $inicio->utc())
            ->where('iniciada_em', '<', $fim->utc())
            ->groupByRaw('1')
            ->orderByRaw('1')
            ->get()
            ->mapWithKeys(fn (object $linha): array => [(string) $linha->inicio => (int) $linha->segundos]);

        $pontos = [];
        $total = 0;
        $balde = $inicio;

        for ($i = 0; $i < $periodo->quantidadeDePontos(); $i++) {
            $chave = $balde->toDateString();
            $minutos = (int) round(($segundosPorBalde[$chave] ?? 0) / 60);
            $pontos[] = ['inicio' => $chave, 'minutos' => $minutos];
            $total += $minutos;

            $balde = match ($granularidade) {
                'dia' => $balde->addDay(),
                'semana' => $balde->addWeek(),
                default => $balde->addMonthNoOverflow(),
            };
        }

        return [
            'granularidade' => $granularidade,
            'total_minutos' => $total,
            'pontos' => $pontos,
        ];
    }

    /**
     * Todos os fundamentos, na ordem do enum; percentual null sem tentativas (RN-02).
     *
     * @return list<Desempenho>
     */
    private function desempenho(User $usuario, CarbonImmutable $inicio, CarbonImmutable $fim): array
    {
        $somas = DB::table('sessao_series as ss')
            ->join('sessoes as s', 's.id', '=', 'ss.sessao_id')
            ->selectRaw('ss.fundamento, sum(ss.acertos) as acertos, sum(ss.erros) as erros')
            ->where('s.usuario_id', $usuario->id)
            ->where('s.iniciada_em', '>=', $inicio->utc())
            ->where('s.iniciada_em', '<', $fim->utc())
            ->groupBy('ss.fundamento')
            ->get()
            ->keyBy('fundamento');

        return array_map(function (Fundamento $fundamento) use ($somas): array {
            $linha = $somas->get($fundamento->value);
            $acertos = $linha === null ? 0 : (int) $linha->acertos;
            $erros = $linha === null ? 0 : (int) $linha->erros;
            $tentativas = $acertos + $erros;

            return [
                'fundamento' => $fundamento->value,
                'acertos' => $acertos,
                'erros' => $erros,
                'tentativas' => $tentativas,
                'percentual' => $tentativas > 0 ? round($acertos / $tentativas * 100, 1) : null,
            ];
        }, Fundamento::cases());
    }

    /**
     * Dias distintos (data local) com sessão na semana atual contra a meta (RN-04).
     *
     * @return Frequencia
     */
    private function frequencia(User $usuario, CarbonImmutable $segunda): array
    {
        $proximaSegunda = $segunda->addWeek();

        $datas = DB::table('sessoes')
            ->selectRaw('distinct (iniciada_em at time zone ?::text)::date as dia', [$this->fuso])
            ->where('usuario_id', $usuario->id)
            ->where('iniciada_em', '>=', $segunda->utc())
            ->where('iniciada_em', '<', $proximaSegunda->utc())
            ->orderByRaw('1')
            ->get()
            ->map(fn (object $linha): string => (string) $linha->dia)
            ->values()
            ->all();

        return [
            'semana_inicio' => $segunda->toDateString(),
            'semana_fim' => $proximaSegunda->subDay()->toDateString(),
            'dias_treinados' => count($datas),
            'meta' => $usuario->meta_semanal,
            'datas' => $datas,
        ];
    }
}
