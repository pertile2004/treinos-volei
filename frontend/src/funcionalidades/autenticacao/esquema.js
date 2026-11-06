import { z } from 'zod';

export const PAPEIS_DO_CADASTRO = ['jogador', 'treinador'];

// Mesmas regras do FormRequest do POST /auth/cadastro (rascunho PR-04, seção 2), com mensagens em pt-BR.
export const esquemaCadastro = z
  .object({
    nome: z
      .string()
      .trim()
      .min(2, 'Informe seu nome (mínimo de 2 caracteres)')
      .max(100, 'O nome pode ter no máximo 100 caracteres'),
    email: z
      .string()
      .trim()
      .max(255, 'O e-mail pode ter no máximo 255 caracteres')
      .pipe(z.email('Informe um e-mail válido')),
    password: z.string().min(8, 'A senha precisa ter no mínimo 8 caracteres'),
    password_confirmation: z.string(),
    // Refinamentos em vez de enum e literal: um tipo inválido interrompe a validação do objeto no Zod 4 e a
    // comparação das senhas deixaria de rodar enquanto houvesse outro campo pendente.
    papel: z.string().refine((valor) => PAPEIS_DO_CADASTRO.includes(valor), 'Escolha se você é jogador ou treinador'),
    aceite_termos: z.boolean().refine((valor) => valor === true, 'Você precisa aceitar os termos'),
  })
  .refine((dados) => dados.password === dados.password_confirmation, {
    error: 'As senhas não conferem',
    path: ['password_confirmation'],
  });
