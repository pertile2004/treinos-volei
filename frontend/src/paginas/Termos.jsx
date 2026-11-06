import { Link } from 'react-router';
import Pagina from '../componentes/Pagina.jsx';

const LINK = 'font-bold text-primaria underline underline-offset-2';
const SECAO = 'flex flex-col gap-2';
const TITULO = 'text-xl font-bold';
const LISTA = 'list-disc space-y-1 pl-5';

export default function Termos() {
  return (
    <Pagina titulo="Termos de uso">
      <div className="mt-2 flex flex-col gap-6 text-texto">
        <p className="text-sm text-texto-secundario">Versão: novembro de 2026</p>

        <section className={SECAO}>
          <h2 className={TITULO}>1. O que é o VOLLEY PRO</h2>
          <p>
            O VOLLEY PRO é uma plataforma web para praticantes de vôlei montarem, executarem e registrarem treinos
            individuais e acompanharem a própria evolução em números.
          </p>
          <p>
            É um trabalho acadêmico, feito por estudantes. Não é um produto comercial, é gratuito e pode mudar, ficar
            fora do ar ou ser encerrado sem aviso.
          </p>
        </section>

        <section className={SECAO}>
          <h2 className={TITULO}>2. Aceite</h2>
          <p>
            Para criar uma conta, você precisa marcar que leu e aceita estes Termos e a{' '}
            <Link to="/privacidade" className={LINK}>
              Política de Privacidade
            </Link>
            . Se não concordar, não crie a conta.
          </p>
        </section>

        <section className={SECAO}>
          <h2 className={TITULO}>3. Sua conta</h2>
          <ul className={LISTA}>
            <li>Você informa nome, e-mail, senha (mínimo de 8 caracteres) e escolhe o papel: jogador ou treinador.</li>
            <li>
              Informe dados verdadeiros e mantenha a senha em segredo. O que for feito com a sua conta é de sua
              responsabilidade.
            </li>
            <li>
              Cada pessoa acessa apenas os próprios dados. A exceção é o vínculo com treinador, explicado no item 6.
            </li>
          </ul>
        </section>

        <section className={SECAO}>
          <h2 className={TITULO}>4. Dados coletados, finalidade e seus direitos</h2>
          <p>
            Guardamos nome, e-mail, senha (só o hash), papel, meta semanal, data de nascimento (opcional) e o que você
            registra no app: treinos, sessões e agenda. A finalidade é manter a sua conta, guardar os seus treinos e
            calcular a sua evolução. Você tem direito de acesso, correção, exportação e exclusão dos seus dados, pelo
            Perfil. Os detalhes estão na{' '}
            <Link to="/privacidade" className={LINK}>
              Política de Privacidade
            </Link>
            .
          </p>
        </section>

        <section className={SECAO}>
          <h2 className={TITULO}>5. Idade</h2>
          <p>
            O cadastro não verifica idade e a data de nascimento é opcional. Por ser um trabalho acadêmico, o VOLLEY PRO
            não tem verificação de idade confiável nem vínculo com responsável legal, que um produto real acessível a
            menores precisaria ter (Lei 15.211/2025).
          </p>
          <p>Se você é menor de idade, use o VOLLEY PRO com o conhecimento e a autorização de um responsável.</p>
        </section>

        <section className={SECAO}>
          <h2 className={TITULO}>6. Jogadores e treinadores</h2>
          <ul className={LISTA}>
            <li>
              O treinador recebe um código de convite. O jogador que informa esse código fica vinculado ao treinador.
            </li>
            <li>Cada jogador tem no máximo um treinador.</li>
            <li>O treinador vinculado pode compartilhar treinos com o atleta e ver a evolução dele.</li>
            <li>O vínculo pode ser desfeito no app.</li>
          </ul>
        </section>

        <section className={SECAO}>
          <h2 className={TITULO}>7. O que você pode fazer</h2>
          <ul className={LISTA}>
            <li>Consultar a biblioteca de exercícios e os treinos em destaque.</li>
            <li>Criar, alterar e excluir os seus treinos.</li>
            <li>Executar treinos, registrar sessões e consultar o histórico e a evolução.</li>
            <li>Agendar treinos.</li>
          </ul>
        </section>

        <section className={SECAO}>
          <h2 className={TITULO}>8. O que não é permitido</h2>
          <ul className={LISTA}>
            <li>Acessar ou tentar acessar dados de outra pessoa.</li>
            <li>Usar a conta de outra pessoa ou criar conta com dados de terceiros.</li>
            <li>Tentar burlar a segurança, sobrecarregar ou tirar o serviço do ar.</li>
            <li>Cadastrar conteúdo ofensivo, ilegal ou que viole direitos de terceiros nos treinos que você cria.</li>
          </ul>
          <p>Contas usadas dessa forma podem ser removidas.</p>
        </section>

        <section className={SECAO}>
          <h2 className={TITULO}>9. Conteúdo dos treinos e cuidado com a saúde</h2>
          <p>
            Os exercícios e treinos têm finalidade informativa e de organização da prática. Eles não substituem a
            orientação de um profissional de educação física nem avaliação médica.
          </p>
          <p>
            Respeite os seus limites. Em caso de dor, lesão ou condição de saúde, procure um profissional antes de
            treinar. Você treina por sua conta e risco.
          </p>
        </section>

        <section className={SECAO}>
          <h2 className={TITULO}>10. Seus conteúdos</h2>
          <p>
            Os treinos e registros que você cria são seus. Treinos marcados como privados ficam visíveis só para você.
            Treinos que um treinador compartilha ficam visíveis para os atletas vinculados a ele.
          </p>
        </section>

        <section className={SECAO}>
          <h2 className={TITULO}>11. Disponibilidade e responsabilidade</h2>
          <p>
            O serviço é oferecido como está, sem garantia de funcionamento contínuo, de ausência de erros ou de
            preservação dos dados. Como se trata de um trabalho acadêmico, o banco de dados pode ser reiniciado. Use a
            exportação de dados para guardar uma cópia do que for importante para você.
          </p>
        </section>

        <section className={SECAO}>
          <h2 className={TITULO}>12. Encerramento da conta</h2>
          <p>
            Você pode excluir a sua conta a qualquer momento no Perfil, confirmando a senha. A exclusão apaga os seus
            dados pessoais e as suas sessões.
          </p>
        </section>

        <section className={SECAO}>
          <h2 className={TITULO}>13. Mudanças nestes Termos</h2>
          <p>Estes Termos podem ser atualizados. A versão indicada no topo da página é a que está em vigor.</p>
        </section>

        <section className={SECAO}>
          <h2 className={TITULO}>14. Contato</h2>
          <p>
            Dúvidas sobre estes Termos: fale com o grupo responsável pelo projeto pelo repositório do VOLLEY PRO. O
            canal de contato dedicado será publicado nesta página quando o grupo o definir.
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
