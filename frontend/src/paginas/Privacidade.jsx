import { Link } from 'react-router';
import Pagina from '../componentes/Pagina.jsx';

const LINK = 'font-bold text-primaria underline underline-offset-2';
const SECAO = 'flex flex-col gap-2';
const TITULO = 'text-xl font-bold';
const SUBTITULO = 'font-bold';
const LISTA = 'list-disc space-y-1 pl-5';

export default function Privacidade() {
  return (
    <Pagina titulo="Política de privacidade">
      <div className="mt-2 flex flex-col gap-6 text-texto">
        <p className="text-sm text-texto-secundario">Versão: novembro de 2026</p>

        <section className={SECAO}>
          <h2 className={TITULO}>1. Sobre este documento</h2>
          <p>
            O VOLLEY PRO é um trabalho acadêmico. Esta página explica, de forma direta, quais dados o app guarda, para
            que servem e o que você pode fazer com eles. Ela complementa os{' '}
            <Link to="/termos" className={LINK}>
              Termos de Uso
            </Link>
            .
          </p>
          <p>
            Este documento não é uma declaração de conformidade legal. O projeto não passou por auditoria jurídica e não
            afirma atender integralmente à LGPD nem a outras leis.
          </p>
        </section>

        <section className={SECAO}>
          <h2 className={TITULO}>2. Dados coletados</h2>
          <h3 className={SUBTITULO}>Dados que você informa</h3>
          <ul className={LISTA}>
            <li>Nome.</li>
            <li>E-mail.</li>
            <li>Senha: guardamos apenas o hash, nunca a senha em texto legível.</li>
            <li>Papel: jogador ou treinador.</li>
            <li>Meta semanal de treinos (de 1 a 7 dias).</li>
            <li>Data de nascimento: opcional.</li>
          </ul>
          <h3 className={SUBTITULO}>Dados gerados pelo uso</h3>
          <ul className={LISTA}>
            <li>Treinos que você cria (etapas e exercícios).</li>
            <li>Sessões de treino registradas: data, duração, séries, repetições, acertos e erros.</li>
            <li>Agenda: treinos agendados por dia e hora e se foram concluídos.</li>
            <li>
              Vínculo com treinador: qual treinador está ligado à sua conta e, para treinadores, o código de convite e a
              lista de atletas.
            </li>
          </ul>
          <h3 className={SUBTITULO}>Dados técnicos</h3>
          <ul className={LISTA}>
            <li>
              Cookies de sessão e de proteção contra falsificação de requisição (CSRF), necessários para manter você
              conectado.
            </li>
            <li>
              Registros técnicos de acesso (logs), com um identificador de cada requisição, usados para segurança e
              correção de erros.
            </li>
          </ul>
          <p>Não pedimos documento, endereço, telefone nem dados de pagamento. Não há envio de fotos ou vídeos.</p>
        </section>

        <section className={SECAO}>
          <h2 className={TITULO}>3. Finalidade: para que usamos os dados</h2>
          <ul className={LISTA}>
            <li>Criar e manter a sua conta e permitir que você entre no app.</li>
            <li>Guardar os seus treinos, sessões e agenda.</li>
            <li>
              Calcular a sua evolução: volume de treino, percentual de acerto por fundamento e frequência em relação à
              meta semanal.
            </li>
            <li>Avisar no app sobre treino agendado para o dia.</li>
            <li>Enviar o e-mail de recuperação de senha, quando você pedir.</li>
            <li>Permitir o vínculo entre atleta e treinador.</li>
            <li>Proteger o serviço contra abuso, com limite de tentativas.</li>
          </ul>
          <p>Não usamos os dados para publicidade, não vendemos dados e não montamos rankings entre usuários.</p>
        </section>

        <section className={SECAO}>
          <h2 className={TITULO}>4. Com quem os dados são compartilhados</h2>
          <ul className={LISTA}>
            <li>
              Treinador vinculado: se você se vincular a um treinador pelo código de convite, ele passa a ver o seu nome
              na lista de atletas dele e a sua evolução. Ele só vê atletas vinculados a ele.
            </li>
            <li>Atletas vinculados: veem os treinos que o treinador compartilha com eles.</li>
            <li>Outros usuários: não veem os seus dados. Treinos privados ficam visíveis só para você.</li>
            <li>
              Integrantes do grupo: quem administra o sistema e o banco de dados pode ter acesso técnico aos dados para
              manter o projeto funcionando.
            </li>
            <li>Hospedagem e envio de e-mail: os dados ficam no serviço em que o projeto for publicado.</li>
          </ul>
        </section>

        <section className={SECAO}>
          <h2 className={TITULO}>5. Seus direitos e onde ficam no app</h2>
          <ul className={LISTA}>
            <li>Acesso: você vê os seus dados no Perfil, no Histórico, na Evolução e na Agenda.</li>
            <li>Correção: no Perfil você altera nome, e-mail, meta semanal, data de nascimento e senha.</li>
            <li>Exportação: no Perfil você baixa os seus dados em um arquivo JSON.</li>
            <li>
              Exclusão: no Perfil você exclui a conta, confirmando a senha. A exclusão apaga os seus dados pessoais e as
              suas sessões.
            </li>
            <li>Registros de treino: você pode excluir uma sessão sua no Histórico.</li>
            <li>Vínculo com treinador: pode ser desfeito no app.</li>
          </ul>
        </section>

        <section className={SECAO}>
          <h2 className={TITULO}>6. Por quanto tempo guardamos</h2>
          <p>
            Os dados ficam guardados enquanto a conta existir. Ao excluir a conta, os dados pessoais e as sessões são
            apagados.
          </p>
          <p>
            Por ser um trabalho acadêmico, o banco de dados pode ser reiniciado ou o serviço encerrado ao fim do
            projeto.
          </p>
        </section>

        <section className={SECAO}>
          <h2 className={TITULO}>7. Idade</h2>
          <p>
            Este é um trabalho acadêmico e o cadastro não verifica idade. Qualquer pessoa consegue se cadastrar, e a
            data de nascimento é opcional.
          </p>
          <p>
            Um produto real acessível a menores precisaria atender à Lei 15.211/2025, com verificação de idade confiável
            e vínculo com responsável para menores de 16 anos, entre outros pontos. O VOLLEY PRO não tem esses recursos.
          </p>
          <p>Se você é menor de idade, use o app com o conhecimento e a autorização de um responsável.</p>
        </section>

        <section className={SECAO}>
          <h2 className={TITULO}>8. Segurança</h2>
          <p>
            Adotamos medidas como senha guardada com hash, sessão por cookie com proteção CSRF, limite de tentativas de
            acesso e a regra de que cada pessoa só acessa os próprios dados. Nenhum sistema é totalmente seguro, e não
            garantimos proteção absoluta. Use uma senha que você não usa em outros serviços.
          </p>
        </section>

        <section className={SECAO}>
          <h2 className={TITULO}>9. Mudanças nesta Política</h2>
          <p>Esta Política pode ser atualizada. A versão indicada no topo da página é a que está em vigor.</p>
        </section>

        <section className={SECAO}>
          <h2 className={TITULO}>10. Contato</h2>
          <p>
            Dúvidas ou pedidos sobre os seus dados: fale com o grupo responsável pelo projeto pelo repositório do VOLLEY
            PRO. O canal de contato dedicado será publicado nesta página quando o grupo o definir.
          </p>
        </section>

        <p className="flex flex-wrap gap-4 border-t border-borda pt-4">
          <Link to="/cadastro" className={LINK}>
            Criar conta
          </Link>
          <Link to="/entrar" className={LINK}>
            Entrar
          </Link>
        </p>
      </div>
    </Pagina>
  );
}
