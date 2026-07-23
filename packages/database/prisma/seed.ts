import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Catálogo oficial entregue pelo cliente (OneDrive_2026-07-23/IMAGENS
// PROJETO). Cada item tem o patch/ícone bordado correspondente, recortado
// das folhas Bandeiras.jpg e Interesses.jpg e servido pelo Next em
// /bandeiras/<slug>.png e /interesses/<slug>.png.
//
// `slug` é a chave estável (upsert) — renomear um slug cria outro registro
// e órfã as seleções de perfil já feitas.
const BANDEIRAS = [
  { slug: "feminismo", name: "Feminismo", color: "#7B3FA0" },
  { slug: "lgbtqiap", name: "LGBTQIAP+", color: "#E4002B" },
  { slug: "antirracismo", name: "Antirracismo", color: "#1B1B1B" },
  { slug: "antifascismo", name: "Antifascismo", color: "#1B1B1B" },
  { slug: "anti-imperialismo", name: "Anti-imperialismo", color: "#C1121F" },
  { slug: "decolonialismo", name: "Decolonialismo", color: "#2E6E4E" },
  { slug: "anarquismo", name: "Anarquismo", color: "#1B1B1B" },
  { slug: "comunismo", name: "Comunismo", color: "#C1121F" },
  { slug: "socialismo", name: "Socialismo", color: "#C1121F" },
  { slug: "social-democracia", name: "Social-democracia", color: "#C1121F" },
  { slug: "ambientalismo", name: "Ambientalismo", color: "#2E5E3A" },
  { slug: "negritude", name: "Negritude", color: "#B8860B" },
  { slug: "amefrica", name: "Améfrica", color: "#3A2E1F" },
  { slug: "teologia-da-libertacao", name: "Teologia da Libertação", color: "#8C3B2E" },
  { slug: "reforma-agraria", name: "Reforma agrária", color: "#2E5E3A" },
  { slug: "educacao-publica", name: "Educação pública", color: "#1F4E8C" },
  { slug: "sus", name: "SUS", color: "#1F4E8C" },
  { slug: "indigenismo", name: "Indigenismo", color: "#2E6E4E" },
  { slug: "passe-livre", name: "Passe Livre", color: "#E8A400" },
  { slug: "veganismo", name: "Veganismo", color: "#2E5E3A" },
  { slug: "vegetarianismo", name: "Vegetarianismo", color: "#2E5E3A" },
  { slug: "axe", name: "Axé", color: "#7B3FA0" },
].map((b) => ({ ...b, imageUrl: `/bandeiras/${b.slug}.png` }));

const INTERESSES = [
  { slug: "poesia", name: "Poesia", category: "cultura" },
  { slug: "literatura", name: "Literatura", category: "cultura" },
  { slug: "culturas-indigenas", name: "Culturas indígenas brasileiras", category: "cultura" },
  { slug: "musica-brasileira", name: "Música brasileira", category: "cultura" },
  { slug: "musica-latino-americana", name: "Música latino-americana", category: "cultura" },
  { slug: "ciencia-academia", name: "Ciência / Academia", category: "conhecimento" },
  { slug: "universidade", name: "Universidade", category: "conhecimento" },
  { slug: "shows", name: "Shows", category: "cultura" },
  { slug: "teatro", name: "Teatro", category: "cultura" },
  { slug: "danca", name: "Dança", category: "cultura" },
  { slug: "csa-organicos", name: "CSA e orgânicos", category: "vida" },
  { slug: "ar-puro", name: "Ar puro", category: "vida" },
  { slug: "lutas-marciais", name: "Lutas marciais", category: "esporte" },
  { slug: "natureza", name: "Natureza", category: "vida" },
  { slug: "esportes", name: "Esportes", category: "esporte" },
  { slug: "movimento-social", name: "Movimento social", category: "política" },
  { slug: "comida", name: "Comida", category: "vida" },
  { slug: "comida-brasileira", name: "Comida brasileira", category: "vida" },
  { slug: "cafe", name: "Café", category: "vida" },
  { slug: "casa", name: "Casa", category: "vida" },
  { slug: "festa", name: "Festa", category: "cultura" },
  { slug: "bar", name: "Bar", category: "vida" },
  { slug: "carnaval", name: "Carnaval", category: "cultura" },
  { slug: "tarot", name: "Tarot", category: "mistica" },
  { slug: "horoscopo", name: "Horóscopo", category: "mistica" },
].map((i) => ({ ...i, imageUrl: `/interesses/${i.slug}.png` }));

// Assets de exemplo — trocar pelas URLs reais (enviadas via POST
// /uploads) antes de ir para produção.
const CUSTOM_EMOJIS = [
  { shortcode: "punho_erguido", imageUrl: "https://assets.clubedaesquerda.org/emojis/punho_erguido.png" },
  { shortcode: "girassol", imageUrl: "https://assets.clubedaesquerda.org/emojis/girassol.png" },
  { shortcode: "bandeira_vermelha", imageUrl: "https://assets.clubedaesquerda.org/emojis/bandeira_vermelha.png" },
];

async function main() {
  // `update` preenchido (não vazio): re-rodar o seed after trocar arte ou
  // renomear rótulo atualiza os registros existentes em vez de ignorá-los.
  await Promise.all(
    BANDEIRAS.map((b) =>
      prisma.bandeira.upsert({
        where: { slug: b.slug },
        update: { name: b.name, color: b.color, imageUrl: b.imageUrl, active: true },
        create: b,
      }),
    ),
  );

  await Promise.all(
    INTERESSES.map((i) =>
      prisma.interesse.upsert({
        where: { slug: i.slug },
        update: { name: i.name, category: i.category, imageUrl: i.imageUrl, active: true },
        create: i,
      }),
    ),
  );

  // Desativa (não apaga) itens fora do catálogo atual: apagar quebraria as
  // seleções de perfil já feitas por FK.
  const slugsB = BANDEIRAS.map((b) => b.slug);
  const slugsI = INTERESSES.map((i) => i.slug);
  await prisma.bandeira.updateMany({ where: { slug: { notIn: slugsB } }, data: { active: false } });
  await prisma.interesse.updateMany({ where: { slug: { notIn: slugsI } }, data: { active: false } });

  await Promise.all(
    CUSTOM_EMOJIS.map((e) =>
      prisma.customEmoji.upsert({ where: { shortcode: e.shortcode }, update: {}, create: e }),
    ),
  );

  console.log(`seed: ${BANDEIRAS.length} bandeiras, ${INTERESSES.length} interesses`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
