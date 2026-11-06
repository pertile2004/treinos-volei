<?php

namespace App\Services;

use App\Enums\OrigemSessao;
use App\Enums\Visibilidade;
use App\Models\Exercicio;
use App\Models\Sessao;
use App\Models\Treino;
use App\Models\User;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Registro de sessões de treino: operação mestre-detalhe (sessoes + sessao_series)
 * em transação, idempotente por id_cliente.
 */
class SessaoService
{
    /**
     * Grava uma sessão com as séries ou devolve a já existente com o mesmo id_cliente.
     * O chamador distingue os casos por $sessao->wasRecentlyCreated.
     *
     * Ordem: idempotência (sem revalidar o conteúdo) → treino visível (404) →
     * exercícios do treino (422) → transação. Assim um reenvio continua
     * devolvendo a sessão mesmo que o treino tenha sido excluído depois.
     *
     * @param  array<string, mixed>  $dados  corpo já validado pelo RegistrarSessaoRequest
     */
    public function registrar(User $usuario, array $dados): Sessao
    {
        $idCliente = (string) $dados['id_cliente'];

        $existente = $this->buscarPorIdCliente($usuario, $idCliente);

        if ($existente !== null) {
            return $existente;
        }

        if (Sessao::query()->where('id_cliente', $idCliente)->exists()) {
            throw $this->idClienteEmUso();
        }

        $treino = $this->treinoVisivel($usuario, (int) $dados['treino_id']);
        $exercicios = $this->exerciciosDoTreino($treino);

        /** @var list<array<string, mixed>> $series */
        $series = $dados['series'];

        $this->garantirExerciciosDoTreino($series, $exercicios);

        try {
            $sessao = DB::transaction(function () use ($usuario, $dados, $treino, $series, $exercicios, $idCliente): Sessao {
                $sessao = $usuario->sessoes()->create([
                    'treino_id' => $treino->id,
                    'origem' => OrigemSessao::from((string) $dados['origem']),
                    'iniciada_em' => $dados['iniciada_em'],
                    'finalizada_em' => $dados['finalizada_em'],
                    'duracao_segundos' => (int) $dados['duracao_segundos'],
                    'observacao' => $dados['observacao'] ?? null,
                    'id_cliente' => $idCliente,
                ]);

                $sessao->series()->createMany(array_map(
                    fn (array $serie): array => [
                        'exercicio_id' => (int) $serie['exercicio_id'],
                        'fundamento' => $exercicios[(int) $serie['exercicio_id']]->fundamento,
                        'numero' => (int) $serie['numero'],
                        'repeticoes' => $serie['repeticoes'] ?? null,
                        'acertos' => $serie['acertos'] ?? 0,
                        'erros' => $serie['erros'] ?? 0,
                        'duracao_segundos' => $serie['duracao_segundos'] ?? null,
                    ],
                    $series,
                ));

                return $sessao;
            });
        } catch (UniqueConstraintViolationException) {
            // Corrida: outro envio com o mesmo id_cliente chegou primeiro.
            return $this->buscarPorIdCliente($usuario, $idCliente) ?? throw $this->idClienteEmUso();
        }

        return $this->carregar($sessao);
    }

    /**
     * Carrega o que o SessaoResource mostra, sem N+1: treino (inclusive excluído,
     * RN-08) e séries com exercício (inclusive removido da biblioteca, RN-07).
     */
    public function carregar(Sessao $sessao): Sessao
    {
        return $sessao->load([
            'treino',
            'series' => fn ($consulta) => $consulta->orderBy('id')->with('exercicio'),
        ]);
    }

    private function buscarPorIdCliente(User $usuario, string $idCliente): ?Sessao
    {
        $sessao = $usuario->sessoes()->where('id_cliente', $idCliente)->first();

        return $sessao === null ? null : $this->carregar($sessao);
    }

    /**
     * Treino existente, não excluído e visível ao usuário (RN-06); senão 404,
     * sem revelar se o treino existe.
     */
    private function treinoVisivel(User $usuario, int $treinoId): Treino
    {
        $treino = Treino::query()->find($treinoId);

        if ($treino === null || ! $this->podeVer($usuario, $treino)) {
            throw (new ModelNotFoundException)->setModel(Treino::class, [$treinoId]);
        }

        return $treino;
    }

    private function podeVer(User $usuario, Treino $treino): bool
    {
        if ($treino->autor_id === $usuario->id) {
            return true;
        }

        return match ($treino->visibilidade) {
            Visibilidade::Publico => true,
            Visibilidade::Atletas => User::query()
                ->whereKey($usuario->getKey())
                ->where('treinador_id', $treino->autor_id)
                ->exists(),
            Visibilidade::Privado => false,
        };
    }

    /**
     * Exercícios dos itens do treino, inclusive os excluídos da biblioteca (RN-07),
     * indexados por id.
     *
     * @return array<int, Exercicio>
     */
    private function exerciciosDoTreino(Treino $treino): array
    {
        $exercicios = [];

        foreach ($treino->itens()->with('exercicio')->get() as $item) {
            $exercicios[$item->exercicio->id] = $item->exercicio;
        }

        return $exercicios;
    }

    /**
     * @param  list<array<string, mixed>>  $series
     * @param  array<int, Exercicio>  $exercicios
     */
    private function garantirExerciciosDoTreino(array $series, array $exercicios): void
    {
        $erros = [];

        foreach ($series as $indice => $serie) {
            if (! isset($exercicios[(int) $serie['exercicio_id']])) {
                $erros["series.{$indice}.exercicio_id"] = 'O exercício não pertence a este treino.';
            }
        }

        if ($erros !== []) {
            throw ValidationException::withMessages($erros);
        }
    }

    private function idClienteEmUso(): ValidationException
    {
        return ValidationException::withMessages([
            'id_cliente' => 'Este id_cliente já foi usado em outra sessão.',
        ]);
    }
}
