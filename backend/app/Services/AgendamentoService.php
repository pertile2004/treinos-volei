<?php

namespace App\Services;

use App\Enums\Visibilidade;
use App\Models\Agendamento;
use App\Models\Sessao;
use App\Models\Treino;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Validation\ValidationException;

class AgendamentoService
{
    /**
     * Fuso de negócio (RN-01): "hoje" e os dias da agenda são sempre os de São Paulo.
     */
    public const string FUSO = 'America/Sao_Paulo';

    /**
     * Dia local de hoje, no formato Y-m-d.
     */
    public function hoje(): string
    {
        return now(self::FUSO)->toDateString();
    }

    /**
     * Agendamentos do usuário entre duas datas (inclusive), com o treino carregado,
     * por data, hora (sem hora por último) e id.
     *
     * @return Collection<int, Agendamento>
     */
    public function listar(User $usuario, string $de, string $ate): Collection
    {
        return $this->ordenado($usuario->agendamentos()->getQuery())
            ->whereBetween('data', [$de, $ate])
            ->with('treino')
            ->get();
    }

    /**
     * @param  array{treino_id: int, data: string, hora?: string|null}  $dados
     */
    public function criar(User $usuario, array $dados): Agendamento
    {
        $agendamento = $usuario->agendamentos()->create([
            'treino_id' => $dados['treino_id'],
            'data' => $dados['data'],
            'hora' => $dados['hora'] ?? null,
        ]);

        return $agendamento->load('treino');
    }

    /**
     * Altera data e/ou hora. Agendamento concluído (com sessão) não muda mais.
     *
     * @param  array{data?: string, hora?: string|null}  $dados
     */
    public function atualizar(Agendamento $agendamento, array $dados): Agendamento
    {
        if ($agendamento->sessao_id !== null) {
            throw ValidationException::withMessages([
                'agendamento' => ['Este agendamento já foi concluído.'],
            ]);
        }

        $agendamento->fill(array_intersect_key($dados, array_flip(['data', 'hora'])));
        $agendamento->save();

        return $agendamento->load('treino');
    }

    /**
     * Exclusão física. A sessão vinculada, se houver, continua.
     */
    public function remover(Agendamento $agendamento): void
    {
        $agendamento->delete();
    }

    /**
     * Vínculo automático (RF-13): a sessão recém-criada de um treino conclui o
     * agendamento pendente de hoje do mesmo usuário e treino (o de menor hora,
     * depois menor id). Chamado pelo SessaoService dentro da transação, só
     * quando a sessão foi criada agora (não no reenvio idempotente); por segurança,
     * uma sessão que já concluiu um agendamento nunca conclui outro.
     * Devolve o agendamento vinculado ou null quando não havia nenhum.
     */
    public function vincularSessaoDeHoje(Sessao $sessao): ?Agendamento
    {
        if ($sessao->treino_id === null || Agendamento::query()->where('sessao_id', $sessao->id)->exists()) {
            return null;
        }

        $agendamento = $this->ordenado(Agendamento::query())
            ->where('usuario_id', $sessao->usuario_id)
            ->where('treino_id', $sessao->treino_id)
            ->whereDate('data', $this->hoje())
            ->whereNull('sessao_id')
            ->first();

        if ($agendamento === null) {
            return null;
        }

        $agendamento->sessao()->associate($sessao);
        $agendamento->save();

        return $agendamento;
    }

    /**
     * RN-08: ao excluir um treino, somem os agendamentos dele de hoje em diante
     * que ainda estão pendentes, de todos os usuários. Passados, concluídos e
     * sessões ficam. Chamado pelo service de exclusão de treino na transação.
     * Devolve quantos foram removidos.
     */
    public function removerFuturosDoTreino(Treino $treino): int
    {
        return Agendamento::query()
            ->where('treino_id', $treino->id)
            ->whereDate('data', '>=', $this->hoje())
            ->whereNull('sessao_id')
            ->delete();
    }

    /**
     * RN-06: o usuário pode agendar um treino não excluído que seja dele,
     * público, ou "para atletas" do treinador ao qual está vinculado.
     */
    public function treinoDisponivel(User $usuario, int $treinoId): bool
    {
        return Treino::query()
            ->whereKey($treinoId)
            ->where(function (Builder $consulta) use ($usuario): void {
                $consulta
                    ->where('autor_id', $usuario->id)
                    ->orWhere('visibilidade', Visibilidade::Publico)
                    ->orWhere(function (Builder $doTreinador) use ($usuario): void {
                        // O treinador vem por subconsulta: o model do usuário pode não ter
                        // treinador_id carregado (modo estrito) e assim é uma consulta só.
                        $doTreinador
                            ->where('visibilidade', Visibilidade::Atletas)
                            ->where('autor_id', User::query()
                                ->whereKey($usuario->id)
                                ->whereNotNull('treinador_id')
                                ->select('treinador_id'));
                    });
            })
            ->exists();
    }

    /**
     * @param  Builder<Agendamento>  $consulta
     * @return Builder<Agendamento>
     */
    private function ordenado(Builder $consulta): Builder
    {
        return $consulta
            ->orderBy('data')
            ->orderByRaw('hora asc nulls last')
            ->orderBy('id');
    }
}
