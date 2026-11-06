<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\AtualizarAgendamentoRequest;
use App\Http\Requests\CriarAgendamentoRequest;
use App\Http\Requests\ListarAgendamentosRequest;
use App\Http\Resources\AgendamentoResource;
use App\Models\Agendamento;
use App\Services\AgendamentoService;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;

class AgendamentoController extends Controller
{
    public function __construct(private readonly AgendamentoService $agendamentos) {}

    /**
     * Agendamentos do usuário entre `de` e `ate` (máximo de 31 dias), sem paginação.
     */
    public function index(ListarAgendamentosRequest $request): AnonymousResourceCollection
    {
        /** @var array{de: string, ate: string} $dados */
        $dados = $request->validated();

        return AgendamentoResource::collection(
            $this->agendamentos->listar($request->user(), $dados['de'], $dados['ate']),
        );
    }

    /**
     * Agenda um treino para um dia (e hora, opcional).
     */
    public function store(CriarAgendamentoRequest $request): AgendamentoResource
    {
        /** @var array{treino_id: int, data: string, hora?: string|null} $dados */
        $dados = $request->validated();

        return new AgendamentoResource($this->agendamentos->criar($request->user(), $dados));
    }

    /**
     * Altera data e/ou hora de um agendamento pendente.
     */
    public function update(AtualizarAgendamentoRequest $request, Agendamento $agendamento): AgendamentoResource
    {
        /** @var array{data?: string, hora?: string|null} $dados */
        $dados = $request->validated();

        return new AgendamentoResource($this->agendamentos->atualizar($agendamento, $dados));
    }

    /**
     * Remove o agendamento; a sessão vinculada, se houver, continua.
     */
    public function destroy(Agendamento $agendamento): Response
    {
        Gate::authorize('delete', $agendamento);

        $this->agendamentos->remover($agendamento);

        return response()->noContent();
    }
}
