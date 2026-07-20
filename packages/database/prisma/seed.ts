import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const BANDEIRAS = [
  { slug: "socialismo", name: "Socialismo", color: "#E4002B" },
  { slug: "feminismo", name: "Feminismo", color: "#B4109D" },
  { slug: "antirracismo", name: "Antirracismo", color: "#1B1B1B" },
  { slug: "ecologia", name: "Ecologia / Socioambientalismo", color: "#2E7D32" },
  { slug: "lgbtqia", name: "Diversidade LGBTQIA+", color: "#FF6F00" },
  { slug: "direitos-humanos", name: "Direitos Humanos", color: "#1565C0" },
];

const INTERESSES = [
  { slug: "cinema", name: "Cinema", category: "cultura" },
  { slug: "literatura", name: "Literatura", category: "cultura" },
  { slug: "musica", name: "Música", category: "cultura" },
  { slug: "futebol", name: "Futebol", category: "esporte" },
  { slug: "economia-politica", name: "Economia Política", category: "política" },
  { slug: "historia", name: "História", category: "política" },
];

// Assets de exemplo — trocar pelas URLs reais (enviadas via POST
// /uploads) antes de ir para produção.
const CUSTOM_EMOJIS = [
  { shortcode: "punho_erguido", imageUrl: "https://assets.clubedaesquerda.org/emojis/punho_erguido.png" },
  { shortcode: "girassol", imageUrl: "https://assets.clubedaesquerda.org/emojis/girassol.png" },
  { shortcode: "bandeira_vermelha", imageUrl: "https://assets.clubedaesquerda.org/emojis/bandeira_vermelha.png" },
];

async function main() {
  await Promise.all(
    BANDEIRAS.map((b) =>
      prisma.bandeira.upsert({ where: { slug: b.slug }, update: {}, create: b }),
    ),
  );

  await Promise.all(
    INTERESSES.map((i) =>
      prisma.interesse.upsert({ where: { slug: i.slug }, update: {}, create: i }),
    ),
  );

  await Promise.all(
    CUSTOM_EMOJIS.map((e) =>
      prisma.customEmoji.upsert({ where: { shortcode: e.shortcode }, update: {}, create: e }),
    ),
  );
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
