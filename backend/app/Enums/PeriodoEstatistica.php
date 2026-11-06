<?php

namespace App\Enums;

/**
 * Período das estatísticas de evolução (RF-11) e a granularidade do volume
 * em cada um (RN-03). A janela de cada período inclui a semana ou o mês atual.
 */
enum PeriodoEstatistica: string
{
    case Semana = 'semana';
    case Mes = 'mes';
    case TresMeses = '3meses';
    case Ano = 'ano';

    /**
     * @return list<string>
     */
    public static function valores(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * Tamanho de cada ponto do gráfico de volume: dia, semana ou mes.
     */
    public function granularidade(): string
    {
        return match ($this) {
            self::Semana => 'dia',
            self::Mes, self::TresMeses => 'semana',
            self::Ano => 'mes',
        };
    }

    /**
     * Quantos pontos a janela tem, contando o período atual.
     */
    public function quantidadeDePontos(): int
    {
        return match ($this) {
            self::Semana => 7,
            self::Mes => 4,
            self::TresMeses => 13,
            self::Ano => 12,
        };
    }
}
