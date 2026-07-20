import type {
  EventoPresencial,
  EventoOnline,
  EventoClube,
  EventoAnalise,
} from '@/types/eventos';

export const EVENTOS_PRESENCIAIS: EventoPresencial[] = [
  {
    id: 'ev-pres-1',
    tipo: 'presencial',
    nome: '8 de Março - Greve Internacionalista',
    organizador: 'Coletivo Feminista',
    data: new Date(2026, 2, 8),
    horario: '14:00',
    descricao:
      'Manifestação conjunta pelo Dia Internacional da Mulher. Parada saindo da Av. Paulista até a República.',
    imagemCapa: 'https://images.unsplash.com/photo-1501608532241-ba3ba1f76ac8?w=600&h=400&fit=crop',
    criadorId: 'user-1',
    criadoEm: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    atualizadoEm: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    ativo: true,
    local: 'Av. Paulista',
    endereco: 'Avenida Paulista, São Paulo - SP',
    capacidade: 5000,
    confirmados: 3200,
  },
  {
    id: 'ev-pres-2',
    tipo: 'presencial',
    nome: 'Seminário: Imperialismos Contemporâneos',
    organizador: 'Núcleo de Estudos',
    data: new Date(2026, 3, 15),
    horario: '09:00',
    descricao:
      'Seminário de dois dias com pesquisadores sobre política internacional e imperialismo.',
    criadoEm: new Date(),
    atualizadoEm: new Date(),
    criadorId: 'user-2',
    ativo: true,
    local: 'Centro Cultural',
    endereco: 'Rua Exemplo, 123, São Paulo - SP',
    capacidade: 200,
    confirmados: 145,
  },
];

export const EVENTOS_ONLINE: EventoOnline[] = [
  {
    id: 'ev-on-1',
    tipo: 'online',
    nome: 'Live: Análise da Conjuntura Política',
    organizador: 'Coletivo de Mídia',
    data: new Date(2026, 2, 20),
    horario: '19:00',
    descricao:
      'Discussão em tempo real sobre os últimos acontecimentos políticos e suas implicações.',
    criadoEm: new Date(),
    atualizadoEm: new Date(),
    criadorId: 'user-3',
    ativo: true,
    linkMeeting: 'https://meet.google.com/abc-def-ghi',
    plataforma: 'meet',
  },
  {
    id: 'ev-on-2',
    tipo: 'online',
    nome: 'Webinar: Direitos LGBTQ+ Globalmente',
    organizador: 'Grupo de Direitos',
    data: new Date(2026, 4, 10),
    horario: '15:00',
    descricao:
      'Debate com ativistas de diferentes países sobre políticas LGBTQ+ na América Latina.',
    criadoEm: new Date(),
    atualizadoEm: new Date(),
    criadorId: 'user-4',
    ativo: true,
    linkMeeting: 'https://zoom.us/j/123456789',
    plataforma: 'zoom',
    senhaOuToken: '123456',
  },
];

export const EVENTOS_CLUBE: EventoClube[] = [
  {
    id: 'ev-club-1',
    tipo: 'clube',
    nome: 'Roda de Conversa - Feminismo e Trabalho',
    organizador: 'Marina Silva',
    data: new Date(2026, 7, 25),
    horario: '18:30',
    descricao:
      'Espaço para discutir questões de gênero, trabalho reprodutivo e mercado laboral.',
    criadoEm: new Date(),
    atualizadoEm: new Date(),
    criadorId: 'user-1',
    ativo: true,
    local: 'Espaço Comunitário',
    recorrencia: 'semanal',
    proximosEncontros: [
      new Date(2026, 7, 25),
      new Date(2026, 8, 1),
      new Date(2026, 8, 8),
      new Date(2026, 8, 15),
    ],
    facilitadores: ['Marina Silva', 'Ana Costa'],
    tema: 'Gênero e Trabalho',
    objetivos:
      'Compartilhar experiências sobre divisão sexual do trabalho e exploração doméstica',
  },
  {
    id: 'ev-club-2',
    tipo: 'clube',
    nome: 'Ação Comunitária - Horta Urbana',
    organizador: 'Fernanda Dias',
    data: new Date(2026, 7, 20),
    horario: '10:00',
    descricao:
      'Cultivo coletivo de horta comunitária no bairro. Vem aprender sobre agricultura urbana!',
    criadoEm: new Date(),
    atualizadoEm: new Date(),
    criadorId: 'user-5',
    ativo: true,
    local: 'Parque do Bairro',
    recorrencia: 'semanal',
    proximosEncontros: [
      new Date(2026, 7, 20),
      new Date(2026, 7, 27),
      new Date(2026, 8, 3),
    ],
    facilitadores: ['Fernanda Dias', 'João Santos'],
    tema: 'Agricultura Urbana',
    objetivos: 'Produzir alimentos agroecológicos e fortalecer laços comunitários',
  },
];

export const EVENTOS_ANALISE: EventoAnalise[] = [
  {
    id: 'ev-ana-1',
    tipo: 'analise',
    nome: 'Círculo de Estudos - Marxismo Contemporâneo',
    organizador: 'Lucas Oliveira',
    data: new Date(2026, 8, 1),
    horario: '19:00',
    descricao:
      'Leitura e debate sobre autores marxistas do século XXI. Textos fornecidos antecipadamente.',
    criadoEm: new Date(),
    atualizadoEm: new Date(),
    criadorId: 'user-2',
    ativo: true,
    local: 'Sala de Estudos',
    recorrencia: 'quinzenal',
    proximosEncontros: [
      new Date(2026, 8, 1),
      new Date(2026, 8, 15),
      new Date(2026, 8, 29),
    ],
    facilitadores: ['Lucas Oliveira', 'prof. Dr. André'],
    textosPrepara: [
      'Althusser - Aparelhos Ideológicos do Estado',
      'Harvey - O Processo Dialético',
    ],
    questoesChave: [
      'Como o marxismo se atualiza no séc. XXI?',
      'Qual o papel dos intelectuais?',
    ],
    metodologia: 'Leitura prévia + debate coletivo + síntese',
  },
  {
    id: 'ev-ana-2',
    tipo: 'analise',
    nome: 'Análise Política - Eleições e Organização',
    organizador: 'João Silva',
    data: new Date(2026, 9, 10),
    horario: '20:00',
    descricao:
      'Análise profunda sobre o processo eleitoral e alternativas de organização política autônoma.',
    criadoEm: new Date(),
    atualizadoEm: new Date(),
    criadorId: 'user-3',
    ativo: true,
    local: 'Centro de Referência',
    recorrencia: 'mensal',
    proximosEncontros: [
      new Date(2026, 9, 10),
      new Date(2026, 10, 10),
      new Date(2026, 11, 10),
    ],
    facilitadores: ['João Silva', 'Coletivo X'],
    questoesChave: [
      'Participar ou boicotar eleições?',
      'Qual forma de organização é eficaz?',
    ],
    metodologia: 'Apresentações + diálogo aberto + conclusões coletivas',
  },
];

export const TODOS_EVENTOS = [
  ...EVENTOS_PRESENCIAIS,
  ...EVENTOS_ONLINE,
  ...EVENTOS_CLUBE,
  ...EVENTOS_ANALISE,
];
