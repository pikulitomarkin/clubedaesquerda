import type { Roda, Mesa } from '@/types/rodas';

export const RODAS_EXEMPLO: Roda[] = [
  {
    id: 'roda-1',
    nome: 'Feminismo e Trabalho',
    descricao:
      'Espaço para discutir gênero, trabalho reprodutivo e exploração. Trazemos músicas que falam de luta, amor e resistência feminista.',
    imagemCapa: 'https://images.unsplash.com/photo-1491438639943-30d79fb7d4a4?w=800&h=600&fit=crop',
    gifLoop: 'https://media.giphy.com/media/WjD9AHohzifHvF1mF2/giphy.gif',
    musicas: [
      {
        id: 'mus-1-1',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        titulo: 'Mulheres na Luta',
        plataforma: 'youtube',
      },
      {
        id: 'mus-1-2',
        url: 'https://open.spotify.com/track/exemplo',
        titulo: 'Força Feminina',
        plataforma: 'spotify',
      },
      {
        id: 'mus-1-3',
        url: 'https://soundcloud.com/exemplo',
        titulo: 'Vozes de Mulheres',
        plataforma: 'soundcloud',
      },
    ],
    mesas: [
      {
        id: 'mesa-1-1',
        rodaId: 'roda-1',
        nome: 'Mesa 1: Trabalho Reprodutivo',
        descricao:
          'Discussão sobre trabalho doméstico, maternidade e exploração. Quem faz o trabalho invisível?',
        criadorId: 'user-1',
        criadoEm: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        atualizadoEm: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        ordem: 1,
      },
      {
        id: 'mesa-1-2',
        rodaId: 'roda-1',
        nome: 'Mesa 2: Precariedade e Gênero',
        descricao:
          'Trabalho precário, desemprego e diferenças salariais. Como gênero intensifica a exploração?',
        criadorId: 'user-2',
        criadoEm: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
        atualizadoEm: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
        ordem: 2,
      },
      {
        id: 'mesa-1-3',
        rodaId: 'roda-1',
        nome: 'Mesa 3: Resistência e Organização',
        descricao:
          'Como feministas estão se organizando? Estratégias de luta coletiva por direitos.',
        criadorId: 'user-3',
        criadoEm: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        atualizadoEm: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        ordem: 3,
      },
    ],
    criadorId: 'user-1',
    criadoEm: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    atualizadoEm: new Date(),
    ativo: true,
    tags: ['feminismo', 'trabalho', 'economia'],
    categoria: 'Identidade',
    participantesCount: 45,
  },
  {
    id: 'roda-2',
    nome: 'Marxismo e Teoria Crítica',
    descricao:
      'Leitura coletiva e discussão de clássicos marxistas. Entender o sistema capitalista para transformá-lo.',
    imagemCapa: 'https://images.unsplash.com/photo-1507842217343-583f7270bfba?w=800&h=600&fit=crop',
    gifLoop: 'https://media.giphy.com/media/l3q2K6YafXW57nVDO/giphy.gif',
    musicas: [
      {
        id: 'mus-2-1',
        url: 'https://www.youtube.com/watch?v=exemplo2',
        titulo: 'Manifesto Comunista',
        plataforma: 'youtube',
      },
      {
        id: 'mus-2-2',
        url: 'https://open.spotify.com/track/exemplo2',
        titulo: 'Hino da Revolução',
        plataforma: 'spotify',
      },
      {
        id: 'mus-2-3',
        url: 'https://soundcloud.com/exemplo2',
        titulo: 'Vozes da Luta Operária',
        plataforma: 'soundcloud',
      },
    ],
    mesas: [
      {
        id: 'mesa-2-1',
        rodaId: 'roda-2',
        nome: 'Mesa 1: O Modo de Produção',
        descricao: 'Como funciona o sistema capitalista? Trabalho, valor e mais-valia.',
        criadorId: 'user-2',
        criadoEm: new Date(),
        atualizadoEm: new Date(),
        ordem: 1,
      },
      {
        id: 'mesa-2-2',
        rodaId: 'roda-2',
        nome: 'Mesa 2: Luta de Classes',
        descricao:
          'Contradições da história. Como as classes trabalham para transformar a sociedade.',
        criadorId: 'user-4',
        criadoEm: new Date(),
        atualizadoEm: new Date(),
        ordem: 2,
      },
    ],
    criadorId: 'user-2',
    criadoEm: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    atualizadoEm: new Date(),
    ativo: true,
    tags: ['marxismo', 'teoria', 'política'],
    categoria: 'Educação',
    participantesCount: 32,
  },
  {
    id: 'roda-3',
    nome: 'Música e Resistência',
    descricao:
      'Como a música é forma de luta e expressão. Ouvimos, dançamos e conversamos sobre som político.',
    imagemCapa: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&h=600&fit=crop',
    gifLoop: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
    musicas: [
      {
        id: 'mus-3-1',
        url: 'https://www.youtube.com/watch?v=exemplo3',
        titulo: 'Protesto em Tom',
        plataforma: 'youtube',
      },
      {
        id: 'mus-3-2',
        url: 'https://open.spotify.com/track/exemplo3',
        titulo: 'Ritmo de Luta',
        plataforma: 'spotify',
      },
      {
        id: 'mus-3-3',
        url: 'https://soundcloud.com/exemplo3',
        titulo: 'Sons da Revolução',
        plataforma: 'soundcloud',
      },
    ],
    mesas: [
      {
        id: 'mesa-3-1',
        rodaId: 'roda-3',
        nome: 'Mesa 1: Hip-Hop e Conscientização',
        descricao: 'Hip-hop como ferramenta de educação política e conscientização das periferias.',
        criadorId: 'user-5',
        criadoEm: new Date(),
        atualizadoEm: new Date(),
        ordem: 1,
      },
    ],
    criadorId: 'user-3',
    criadoEm: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    atualizadoEm: new Date(),
    ativo: true,
    tags: ['música', 'cultura', 'expressão'],
    categoria: 'Cultura',
    participantesCount: 28,
  },
];
