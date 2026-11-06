export default function Carregando({ rotulo = 'Carregando…' }) {
  return (
    <p role="status" className="p-4 text-texto-secundario">
      {rotulo}
    </p>
  );
}
