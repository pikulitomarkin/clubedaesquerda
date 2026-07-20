import type { Roda } from '@/types/public-profile';

export const RODAS: Roda[] = [
  {
    id: 'roda-1',
    title: 'Roda de Conversa - Feminismo e Trabalho',
    description:
      'Espaço para discutir questões de gênero, trabalho reprodutivo e mercado laboral. Aberto a todos.',
    icon: '👩‍💼',
    category: 'conversa',
    frequency: 'semanal',
    nextDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    participantCount: 24,
    slug: 'feminismo-trabalho',
  },
  {
    id: 'roda-2',
    title: 'Círculo de Estudos - Marxismo Contemporâneo',
    description:
      'Leitura e debate sobre autores marxistas do século XXI. Textos fornecidos antecipadamente.',
    icon: '📖',
    category: 'estudo',
    frequency: 'quinzenal',
    nextDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    participantCount: 18,
    slug: 'marxismo-contemporaneo',
  },
  {
    id: 'roda-3',
    title: 'Ação Comunitária - Horta Urbana',
    description:
      'Cultivo coletivo de horta comunitária no bairro. Vem aprender sobre agricultura urbana!',
    icon: '🌱',
    category: 'acao',
    frequency: 'semanal',
    nextDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    participantCount: 32,
    slug: 'horta-urbana',
  },
  {
    id: 'roda-4',
    title: 'Roda de Poesia e Música',
    description:
      'Encontro para compartilhar e ouvir poesias e músicas com temática política e social.',
    icon: '🎵',
    category: 'social',
    frequency: 'mensal',
    nextDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    participantCount: 40,
    slug: 'poesia-musica',
  },
  {
    id: 'roda-5',
    title: 'Debate - Reforma Agrária',
    description:
      'Discussão sobre políticas de terra, agronegócio e resistência de movimentos rurais.',
    icon: '🌾',
    category: 'conversa',
    frequency: 'mensal',
    nextDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
    participantCount: 15,
    slug: 'reforma-agraria',
  },
  {
    id: 'roda-6',
    title: 'Formação - Direitos LGBTQ+',
    description: 'Oficina sobre história do movimento LGBTQ+ e políticas públicas de direitos.',
    icon: '🏳️‍🌈',
    category: 'estudo',
    frequency: 'quinzenal',
    nextDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    participantCount: 28,
    slug: 'direitos-lgbtq',
  },
];
