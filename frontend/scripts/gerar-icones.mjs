// Gera os PNGs do PWA em public/icones/ a partir do mesmo desenho de icone.svg (bola em verde-limão sobre o fundo).
// Só usa o Node (zlib): nenhuma dependência. Rode `node scripts/gerar-icones.mjs` a partir de frontend/.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

// Tokens do docs/DESIGN.md.
const FUNDO = [0x0e, 0x0e, 0x0e];
const PRIMARIA = [0xd4, 0xff, 0x00];

// Geometria em coordenadas de 0 a 100, igual à do icone.svg.
const CENTRO = 50;
const RAIO_DA_COSTURA = 39.6; // 1,1 × raio da bola normal
const DISTANCIA_DA_COSTURA = 45; // 1,25 × raio da bola normal
const LARGURA_DA_COSTURA = 4;
const CENTROS_DAS_COSTURAS = [90, 210, 330].map((graus) => {
  const rad = (graus * Math.PI) / 180;
  return [CENTRO + DISTANCIA_DA_COSTURA * Math.cos(rad), CENTRO - DISTANCIA_DA_COSTURA * Math.sin(rad)];
});

const AMOSTRAS = 4; // supersampling por eixo (anti-aliasing)

/**
 * Cor (RGBA) de um ponto em coordenadas 0..100.
 * `raioDaBola`: 36 no ícone normal; 30 no maskable (zona segura de 80 %).
 * `cantos`: raio dos cantos transparentes; 0 = quadrado opaco (maskable e Apple).
 */
function corDoPonto(x, y, { raioDaBola, cantos }) {
  if (cantos > 0) {
    const dx = Math.max(cantos - x, x - (100 - cantos), 0);
    const dy = Math.max(cantos - y, y - (100 - cantos), 0);
    if (dx * dx + dy * dy > cantos * cantos) return [0, 0, 0, 0];
  }
  const distanciaDoCentro = Math.hypot(x - CENTRO, y - CENTRO);
  if (distanciaDoCentro > raioDaBola) return [...FUNDO, 255];
  // As costuras acompanham a escala da bola.
  const escala = raioDaBola / 36;
  for (const [cx, cy] of CENTROS_DAS_COSTURAS) {
    const centroX = CENTRO + (cx - CENTRO) * escala;
    const centroY = CENTRO + (cy - CENTRO) * escala;
    const distancia = Math.hypot(x - centroX, y - centroY);
    if (Math.abs(distancia - RAIO_DA_COSTURA * escala) <= (LARGURA_DA_COSTURA * escala) / 2) return [...FUNDO, 255];
  }
  return [...PRIMARIA, 255];
}

function desenhar(tamanho, opcoes) {
  const pixels = Buffer.alloc(tamanho * tamanho * 4);
  for (let py = 0; py < tamanho; py += 1) {
    for (let px = 0; px < tamanho; px += 1) {
      const soma = [0, 0, 0, 0];
      for (let sy = 0; sy < AMOSTRAS; sy += 1) {
        for (let sx = 0; sx < AMOSTRAS; sx += 1) {
          const x = ((px + (sx + 0.5) / AMOSTRAS) / tamanho) * 100;
          const y = ((py + (sy + 0.5) / AMOSTRAS) / tamanho) * 100;
          const cor = corDoPonto(x, y, opcoes);
          // Média ponderada pelo alfa, para a borda transparente não escurecer.
          soma[0] += cor[0] * cor[3];
          soma[1] += cor[1] * cor[3];
          soma[2] += cor[2] * cor[3];
          soma[3] += cor[3];
        }
      }
      const indice = (py * tamanho + px) * 4;
      const alfa = soma[3] / (AMOSTRAS * AMOSTRAS);
      pixels[indice] = soma[3] ? Math.round(soma[0] / soma[3]) : 0;
      pixels[indice + 1] = soma[3] ? Math.round(soma[1] / soma[3]) : 0;
      pixels[indice + 2] = soma[3] ? Math.round(soma[2] / soma[3]) : 0;
      pixels[indice + 3] = Math.round(alfa);
    }
  }
  return pixels;
}

// --- Codificação PNG (RGBA 8 bits, sem filtro) ---
const TABELA_CRC = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = TABELA_CRC[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function bloco(tipo, dados) {
  const tamanho = Buffer.alloc(4);
  tamanho.writeUInt32BE(dados.length);
  const tipoEDados = Buffer.concat([Buffer.from(tipo, 'ascii'), dados]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(tipoEDados));
  return Buffer.concat([tamanho, tipoEDados, crc]);
}

function png(tamanho, pixels) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(tamanho, 0);
  ihdr.writeUInt32BE(tamanho, 4);
  ihdr[8] = 8; // profundidade
  ihdr[9] = 6; // RGBA
  const linhas = Buffer.alloc((tamanho * 4 + 1) * tamanho);
  for (let y = 0; y < tamanho; y += 1) {
    linhas[y * (tamanho * 4 + 1)] = 0; // filtro "nenhum"
    pixels.copy(linhas, y * (tamanho * 4 + 1) + 1, y * tamanho * 4, (y + 1) * tamanho * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    bloco('IHDR', ihdr),
    bloco('IDAT', deflateSync(linhas, { level: 9 })),
    bloco('IEND', Buffer.alloc(0)),
  ]);
}

const NORMAL = { raioDaBola: 36, cantos: 20 };
const MASKABLE = { raioDaBola: 30, cantos: 0 };
const APPLE = { raioDaBola: 36, cantos: 0 };

const ICONES = [
  ['icone-192.png', 192, NORMAL],
  ['icone-512.png', 512, NORMAL],
  ['icone-maskable-192.png', 192, MASKABLE],
  ['icone-maskable-512.png', 512, MASKABLE],
  ['apple-touch-icon.png', 180, APPLE],
];

const pasta = resolve(dirname(fileURLToPath(import.meta.url)), '../public/icones');
mkdirSync(pasta, { recursive: true });
for (const [nome, tamanho, opcoes] of ICONES) {
  writeFileSync(resolve(pasta, nome), png(tamanho, desenhar(tamanho, opcoes)));
  console.log(`${nome} (${tamanho}×${tamanho})`);
}
