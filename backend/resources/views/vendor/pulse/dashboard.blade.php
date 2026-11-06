{{-- Painel do Pulse (só admin). Ficam os cartões que o projeto alimenta: uso por
     usuário, exceções, requisições lentas, consultas lentas e cache. Os cartões de
     servidores e filas dependem de processos (pulse:check, queue:work) que não
     existem nesta implantação e ficariam sempre vazios. --}}
<x-pulse>
    <livewire:pulse.usage cols="4" rows="2" />

    <livewire:pulse.exceptions cols="8" />

    <livewire:pulse.slow-requests cols="8" />

    <livewire:pulse.slow-queries cols="8" />

    <livewire:pulse.cache cols="4" />
</x-pulse>
