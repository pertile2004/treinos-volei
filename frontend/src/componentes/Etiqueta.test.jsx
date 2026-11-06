import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import Etiqueta from './Etiqueta.jsx';

const FUNDAMENTOS = [
  ['recepcao', 'Recepção'],
  ['levantamento', 'Levantamento'],
  ['ataque', 'Ataque'],
  ['saque', 'Saque'],
  ['bloqueio', 'Bloqueio'],
  ['defesa', 'Defesa'],
  ['preparo_fisico', 'Preparo físico'],
];
const ETAPAS = [
  ['aquecimento', 'Aquecimento'],
  ['tecnica', 'Técnica'],
  ['especifico', 'Específico'],
  ['volta_a_calma', 'Volta à calma'],
];

describe('Etiqueta', () => {
  it('mostra o rótulo recebido, sem traduzir a chave', () => {
    render(
      <Etiqueta tipo="fundamento" valor="preparo_fisico">
        Preparo físico
      </Etiqueta>,
    );
    const etiqueta = screen.getByText('Preparo físico');
    expect(etiqueta).toHaveAttribute('data-tipo', 'fundamento');
    expect(etiqueta).toHaveAttribute('data-valor', 'preparo_fisico');
    expect(etiqueta).toHaveClass('text-xs', 'rounded-full');
  });

  it.each(FUNDAMENTOS)('aceita o fundamento %s', (valor, rotulo) => {
    render(
      <Etiqueta tipo="fundamento" valor={valor}>
        {rotulo}
      </Etiqueta>,
    );
    expect(screen.getByText(rotulo)).toHaveAttribute('data-tipo', 'fundamento');
  });

  it.each(ETAPAS)('aceita a etapa %s', (valor, rotulo) => {
    render(
      <Etiqueta tipo="etapa" valor={valor}>
        {rotulo}
      </Etiqueta>,
    );
    expect(screen.getByText(rotulo)).toHaveAttribute('data-tipo', 'etapa');
  });

  it('fundamento e etapa têm aparências diferentes entre si e da neutra', () => {
    render(
      <div>
        <Etiqueta tipo="fundamento" valor="saque">
          Saque
        </Etiqueta>
        <Etiqueta tipo="etapa" valor="tecnica">
          Técnica
        </Etiqueta>
        <Etiqueta>Novo</Etiqueta>
      </div>,
    );
    const classes = ['Saque', 'Técnica', 'Novo'].map((rotulo) => screen.getByText(rotulo).className);
    expect(new Set(classes).size).toBe(3);
    expect(screen.getByText('Saque')).toHaveClass('border-primaria');
    expect(screen.getByText('Técnica')).toHaveClass('border-borda-controle');
    expect(screen.getByText('Novo')).toHaveClass('border-borda-controle');
  });

  it('valor desconhecido cai na variação neutra', () => {
    render(
      <div>
        <Etiqueta tipo="fundamento" valor="manchete">
          Manchete
        </Etiqueta>
        <Etiqueta tipo="etapa" valor="saque">
          Saque
        </Etiqueta>
        <Etiqueta tipo="fundamento">Sem valor</Etiqueta>
      </div>,
    );
    for (const rotulo of ['Manchete', 'Saque', 'Sem valor']) {
      expect(screen.getByText(rotulo)).toHaveAttribute('data-tipo', 'neutra');
      expect(screen.getByText(rotulo)).not.toHaveAttribute('data-valor');
    }
  });

  it('sem tipo ou com tipo desconhecido é neutra', () => {
    render(
      <div>
        <Etiqueta>Novo</Etiqueta>
        <Etiqueta tipo="nivel" valor="iniciante">
          Iniciante
        </Etiqueta>
      </div>,
    );
    expect(screen.getByText('Novo')).toHaveAttribute('data-tipo', 'neutra');
    expect(screen.getByText('Iniciante')).toHaveAttribute('data-tipo', 'neutra');
  });

  it('aceita className e outras props', () => {
    render(
      <Etiqueta tipo="etapa" valor="aquecimento" className="shrink-0" title="Etapa do treino">
        Aquecimento
      </Etiqueta>,
    );
    const etiqueta = screen.getByText('Aquecimento');
    expect(etiqueta).toHaveClass('shrink-0');
    expect(etiqueta).toHaveAttribute('title', 'Etapa do treino');
  });

  it('não tem violações de acessibilidade', async () => {
    const { container } = render(
      <div>
        <Etiqueta tipo="fundamento" valor="saque">
          Saque
        </Etiqueta>
        <Etiqueta tipo="etapa" valor="volta_a_calma">
          Volta à calma
        </Etiqueta>
        <Etiqueta>Novo</Etiqueta>
      </div>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
