import { zodResolver } from '@hookform/resolvers/zod';
import { useId, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import Abas, { PainelDaAba } from '../../../componentes/Abas.jsx';
import Botao from '../../../componentes/Botao.jsx';
import CampoTexto from '../../../componentes/CampoTexto.jsx';
import MensagemDeErro from '../../../componentes/MensagemDeErro.jsx';
import { aplicarErrosDaApi } from '../../../lib/formularios.js';
import { esquemaCadastro } from '../esquema.js';
import { useCadastro } from '../hooks.js';

const PAPEIS = [
  {
    id: 'jogador',
    rotulo: 'Sou Jogador',
    descricao: 'Monte seus treinos, registre as sessões e acompanhe sua evolução.',
  },
  {
    id: 'treinador',
    rotulo: 'Sou Treinador',
    descricao: 'Compartilhe treinos com seus atletas e acompanhe a evolução deles.',
  },
];

const MENSAGEM_429 = 'Muitas tentativas. Tente de novo em instantes.';

const LINK = 'font-bold text-primaria underline underline-offset-2 focus-visible:outline-primaria';

export default function FormularioCadastro() {
  const navegar = useNavigate();
  const cadastro = useCadastro();
  const [erroGeral, setErroGeral] = useState(null);
  const idAceite = useId();
  const idErroAceite = `${idAceite}-erro`;

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(esquemaCadastro),
    defaultValues: {
      nome: '',
      email: '',
      password: '',
      password_confirmation: '',
      papel: 'jogador',
      aceite_termos: false,
    },
  });
  const papel = useWatch({ control, name: 'papel' });

  function enviar(dados) {
    if (cadastro.isPending) return;
    setErroGeral(null);
    cadastro.mutate(dados, {
      onSuccess: () => navegar('/'),
      onError: (erro) => {
        if (!aplicarErrosDaApi(erro, setError)) setErroGeral(erro);
      },
    });
  }

  return (
    <form noValidate onSubmit={handleSubmit(enviar)} className="flex flex-col gap-4">
      <Abas
        itens={PAPEIS}
        ativa={papel}
        aoMudar={(id) => setValue('papel', id, { shouldDirty: true })}
        rotuloDoGrupo="Tipo de conta"
      />
      {PAPEIS.map((item) => (
        <PainelDaAba key={item.id} id={item.id} ativa={papel} className="text-sm text-texto-secundario">
          {item.descricao}
        </PainelDaAba>
      ))}

      <CampoTexto rotulo="Seu nome" autoComplete="name" erro={errors.nome?.message} {...register('nome')} />
      <CampoTexto
        rotulo="E-mail"
        tipo="email"
        autoComplete="email"
        inputMode="email"
        erro={errors.email?.message}
        {...register('email')}
      />
      <CampoTexto
        rotulo="Senha"
        tipo="password"
        autoComplete="new-password"
        ajuda="Mínimo de 8 caracteres"
        erro={errors.password?.message}
        {...register('password')}
      />
      <CampoTexto
        rotulo="Confirmar senha"
        tipo="password"
        autoComplete="new-password"
        erro={errors.password_confirmation?.message}
        {...register('password_confirmation')}
      />

      <div className="flex flex-col gap-1">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id={idAceite}
            aria-invalid={errors.aceite_termos ? 'true' : undefined}
            aria-describedby={errors.aceite_termos ? idErroAceite : undefined}
            className="mt-0.5 size-6 shrink-0 cursor-pointer accent-primaria"
            {...register('aceite_termos')}
          />
          <label htmlFor={idAceite} className="text-sm text-texto">
            Ao criar a conta, você aceita os{' '}
            <Link to="/termos" className={LINK}>
              Termos de Uso
            </Link>{' '}
            e a{' '}
            <Link to="/privacidade" className={LINK}>
              Política de Privacidade
            </Link>
          </label>
        </div>
        {errors.aceite_termos && (
          <p id={idErroAceite} className="text-sm text-perigo">
            {errors.aceite_termos.message}
          </p>
        )}
      </div>

      {erroGeral && (
        <MensagemDeErro erro={erroGeral} mensagem={erroGeral.response?.status === 429 ? MENSAGEM_429 : undefined} />
      )}

      <Botao type="submit" larguraTotal carregando={cadastro.isPending}>
        {cadastro.isPending ? 'Criando conta…' : 'Criar conta'}
      </Botao>
    </form>
  );
}
