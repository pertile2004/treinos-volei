export default function EstadoVazio({ titulo, descricao, children }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-cartao border border-borda bg-superficie p-6 text-center">
      <h2 className="text-xl font-bold">{titulo}</h2>
      {descricao && <p className="text-texto-secundario">{descricao}</p>}
      {children}
    </div>
  );
}
