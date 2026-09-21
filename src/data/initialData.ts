import { RoteiroItem, CalendarEvent, JournalEntry, Goal, MealPlan, AppImages } from '../types';

export const INITIAL_IMAGES: AppImages = {
  // Helena's warm portrait (natural light, cozy knitwear, warm smile)
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
  // Floral monogram wreath logo
  logo: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=400&q=80',
  // Grilled salmon with herbs and purée
  meal: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=900&q=80',
  // Journal on linen with dried flowers & pen
  journal: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=900&q=80',
  // Floral arrangement and open notebook with morning sun
  goalsQuote: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=900&q=80',
  // Law books, fountain pen, and coffee mug
  studyDesk: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=900&q=80',
};

export const INITIAL_ROTEIRO: RoteiroItem[] = [
  {
    id: 'rot-1',
    time: '05:30',
    title: 'Acordar com serenidade',
    subtitle: 'Despertar suave',
    done: true,
    statusTag: 'Feito',
  },
  {
    id: 'rot-2',
    title: 'Oração matinal',
    subtitle: 'Consagração das primeiras horas',
    done: true,
    statusTag: 'Feito',
  },
  {
    id: 'rot-3',
    title: 'Higiene & Cuidados',
    subtitle: 'Skincare e zelo pessoal',
    done: true,
    statusTag: 'Feito',
  },
  {
    id: 'rot-4',
    title: 'Devocional com a Palavra',
    subtitle: 'Salmos & reflexão íntima',
    done: true,
    statusTag: 'Feito',
  },
  {
    id: 'rot-5',
    title: 'Café da manhã nutritivo',
    subtitle: 'Frutas frescas • Ovos • Chá',
    done: false,
    statusTag: 'Agora',
  },
  {
    id: 'rot-6',
    time: '08:00',
    title: 'Treino de Bike',
    subtitle: '35 min • Movimento e disposição',
    done: false,
    statusTag: '08:00',
  },
  {
    id: 'rot-7',
    time: '10:00',
    title: 'Cuidar da Casa',
    subtitle: 'Aromatizar, organizar e arejar',
    done: false,
    statusTag: '10:00',
  },
  {
    id: 'rot-8',
    time: '12:30',
    title: 'Almoço',
    subtitle: 'Mesa posta com afeto',
    done: false,
    statusTag: '12:30',
  },
  {
    id: 'rot-9',
    time: '13:45',
    title: 'Sono pós-almoço (Power nap)',
    subtitle: '20 minutos de restauração',
    done: false,
    statusTag: '13:45',
  },
  {
    id: 'rot-10',
    time: '16:00',
    title: 'Chá da tarde',
    subtitle: 'Infusão de camomila • Pausa',
    done: false,
    statusTag: '16:00',
  },
  {
    id: 'rot-11',
    time: '17:30',
    title: 'Descanso e servir a casa',
    subtitle: 'Tempo de carinho com a família',
    done: false,
    statusTag: '17:30',
  },
  {
    id: 'rot-12',
    time: '19:00',
    title: 'Estudar (Direito / TCC)',
    subtitle: 'Foco profundo e fichamentos',
    done: false,
    statusTag: '19:00',
  },
  {
    id: 'rot-13',
    time: '22:00',
    title: 'Desconectar e Dormir',
    subtitle: 'Sem telas • Gratidão noturna',
    done: false,
    statusTag: '22:00',
  },
];

export const INITIAL_MEAL: MealPlan = {
  title: 'Almoço de Quinta-feira',
  subtitle: 'Cardápio Planejado',
  dishName: 'Salmão grelhado com purê de mandioquinha & salada verde',
  description: 'Acompanha azeite de ervas finas e chá gelado de hibisco com maçã.',
  time: '12:30',
  kcal: 420,
  tags: ['420 kcal', 'Mesa posta', 'Em família'],
  imageUrl: INITIAL_IMAGES.meal,
};

export const INITIAL_EVENTS: CalendarEvent[] = [
  {
    id: 'ev-1',
    time: '09:30',
    title: 'Reunião de Orientação TCC',
    tag: 'Pessoal',
    category: 'pessoal',
    personId: 'me',
    description: 'Revisão metodológica e capítulos 2 e 3 com Dra. Marina',
    location: 'Google Meet',
    participants: 'Orientação Acadêmica',
    tagColor: '#6B3F2A',
  },
  {
    id: 'ev-2',
    time: '14:00',
    title: 'Pediatra de rotina & Vacinação',
    tag: 'Lembrete',
    category: 'pequenos',
    personId: 'pequenos',
    description: 'Clínica Infantil São José • Levar carteirinha e caderneta',
    participants: 'Em família com os pequenos',
    tagColor: '#E8A5B8',
  },
  {
    id: 'ev-3',
    time: '16:30',
    title: 'Compras feira orgânica',
    tag: 'Família',
    category: 'familia',
    personId: 'lucas',
    description: 'Legumes da semana, frutas da época e pão de fermentação natural',
    participants: 'Em família',
    tagColor: '#B88E72',
  },
  {
    id: 'ev-4',
    time: '19:00',
    title: 'Grupo de Oração & Casais',
    tag: 'Casamento',
    category: 'casamento',
    personId: 'lucas',
    description: 'Tema: "Fortalecendo as Raízes no Cotidiano"',
    location: 'Paróquia Sagrada Família',
    participants: 'Em casal',
    tagColor: '#E8A5B8',
  },
];

export const INITIAL_JOURNAL_ENTRIES: JournalEntry[] = [
  {
    id: 'j-141',
    dayNumber: 141,
    dateStr: '23 de Outubro',
    mood: 'grata',
    moodLabel: 'Grata',
    title: 'Um dia de vitórias silenciosas',
    content:
      'Hoje acordei antes de todo mundo na casa. O silêncio era tão aconchegante que consegui respirar fundo e contemplar a luz entrando pela janela. Consegui avançar no capítulo 2 do TCC sem pressa. No final da tarde, o abraço apertado do Theo na volta da pracinha curou qualquer cansaço.',
    isLocked: true,
    createdAt: '2024-10-23T06:15:00Z',
  },
  {
    id: 'j-140',
    dayNumber: 140,
    dateStr: '22 de Outubro',
    mood: 'paz',
    moodLabel: 'Em paz',
    title: 'Entregando o controle a Deus',
    content:
      'Foi difícil aceitar que as coisas não andariam no meu ritmo essa semana. Chorei um pouco no banho, mas orei pedindo mansidão. Lembrei-me de que Deus cuida dos lírios do campo e dos pardais. Quando soltei a urgência, meu peito voltou a respirar leve.',
    isLocked: true,
    createdAt: '2024-10-22T21:40:00Z',
  },
  {
    id: 'j-139',
    dayNumber: 139,
    dateStr: '21 de Outubro',
    mood: 'esperanca',
    moodLabel: 'Esperançosa',
    title: 'Pequenas alegrias da tarde',
    content:
      'O café com bolo de canela na casa da mamãe me fez voltar no tempo. A vida tem sido generosa nesses detalhes sutis. Planejamos a nossa viagem de bodas para Gramado e me peguei sorrindo à toa imaginando o friozinho da serra.',
    isLocked: true,
    createdAt: '2024-10-21T18:20:00Z',
  },
];

export const INITIAL_GOALS: Goal[] = [
  {
    id: 'goal-1',
    category: 'Vida com Deus',
    title: 'Leitura Bíblica Anual Completa',
    targetDate: 'Dezembro de 2024',
    progressPercent: 78,
    milestones: [
      { id: 'm1-1', title: 'Pentateuco & Livros Históricos (100%)', done: true },
      { id: 'm1-2', title: 'Livros Poéticos & Salmos (100%)', done: true },
      { id: 'm1-3', title: 'Profetas Maiores & Evangelhos (Em andamento)', done: false },
      { id: 'm1-4', title: 'Epístolas & Apocalipse', done: false },
    ],
  },
  {
    id: 'goal-2',
    category: 'Vida com Deus',
    title: 'Retiro Espiritual de Silêncio',
    targetDate: 'Outubro de 2024',
    progressPercent: 40,
    milestones: [
      { id: 'm2-1', title: 'Escolha da pousada no mosteiro & data reservada', done: true },
      { id: 'm2-2', title: 'Roteiro de leituras e meditações preparado', done: false },
    ],
  },
  {
    id: 'goal-3',
    category: 'Casamento',
    title: 'Noite do Encontro Quinzenal',
    targetDate: '24 noites no ano',
    progressPercent: 75,
    currentCount: 18,
    totalCount: 24,
    countLabel: '18 / 24',
    milestones: [
      { id: 'm3-1', title: 'Último: Jantar à luz de velas na varanda', done: true },
      { id: 'm3-2', title: 'Próximo: Cinema cult & café gourmet', done: false },
    ],
  },
  {
    id: 'goal-4',
    category: 'Casamento',
    title: 'Viagem de Bodas (Gramado no Inverno)',
    targetDate: 'Julho 2025',
    progressPercent: 60,
    milestones: [
      { id: 'm4-1', title: 'Passagens e roteiro gastronômico alinhados', done: true },
      { id: 'm4-2', title: 'Reserva do chalé com lareira', done: false },
    ],
  },
  {
    id: 'goal-5',
    category: 'Estética & Bem-Estar',
    title: 'Consulta Cirurgião & Pré-Operatório',
    targetDate: 'Novembro 2024',
    progressPercent: 80,
    milestones: [
      { id: 'm5-1', title: 'Exames laboratoriais e cardiológicos entregues', done: true },
      { id: 'm5-2', title: 'Consulta de retorno com Dr. Marcelo (12/Nov)', done: false },
    ],
  },
  {
    id: 'goal-6',
    category: 'Estética & Bem-Estar',
    title: 'Consistência Skincare Matinal & Noturna',
    targetDate: 'Hábito diário contínuo',
    progressPercent: 92,
    milestones: [
      { id: 'm6-1', title: '28 dias consecutivos registrados no diário matinal', done: true },
      { id: 'm6-2', title: 'Manter hidratação labial e sérum de vitamina C', done: true },
    ],
  },
  {
    id: 'goal-7',
    category: 'Casa Completa',
    title: 'Decoração da Sala & Cantinho do Café',
    targetDate: 'Outubro 2024',
    progressPercent: 85,
    milestones: [
      { id: 'm7-1', title: 'Máquina de café e prateleira de cerâmicas montada', done: true },
      { id: 'm7-2', title: 'Sofá de linho e tapete neutro recebidos', done: true },
      { id: 'm7-3', title: 'Iluminação indireta e vaso de eucalipto', done: false },
    ],
  },
  {
    id: 'goal-8',
    category: 'Casa Completa',
    title: 'Organização & Desapego do Closet',
    targetDate: 'Dezembro 2024',
    progressPercent: 50,
    milestones: [
      { id: 'm8-1', title: 'Triagem de roupas de verão e doações separadas', done: true },
      { id: 'm8-2', title: 'Padronização de cabides de veludo bege', done: false },
    ],
  },
  {
    id: 'goal-9',
    category: 'Faculdade (Direito)',
    title: 'Entrega da 1ª Versão do TCC',
    targetDate: 'Data Limite: 15/Nov',
    progressPercent: 65,
    milestones: [
      { id: 'm9-1', title: 'Capítulo 1 e 2 aprovados pelo orientador', done: true },
      { id: 'm9-2', title: 'Redação da jurisprudência comparada', done: false },
      { id: 'm9-3', title: 'Revisão bibliográfica normas ABNT', done: false },
    ],
  },
  {
    id: 'goal-10',
    category: 'Faculdade (Direito)',
    title: 'Cronograma 1ª Fase OAB',
    targetDate: 'Prova: Março 2025',
    progressPercent: 55,
    milestones: [
      { id: 'm10-1', title: 'Fichamentos de Ética e Direito Constitucional', done: true },
      { id: 'm10-2', title: 'Resolução de 300 questões comentadas FGV', done: false },
    ],
  },
  {
    id: 'goal-11',
    category: 'Carro Novo',
    title: 'Reserva para Troca do Veículo',
    targetDate: 'Previsão: Fevereiro 2025',
    progressPercent: 76,
    notes: 'R$ 38.000 de R$ 50.000 acumulados • Faltam R$ 12.000',
    milestones: [
      { id: 'm11-1', title: 'R$ 38.000 aplicados no Tesouro Selic', done: true },
      { id: 'm11-2', title: 'Aporte mensal de Novembro e 13º salário', done: false },
    ],
  },
];
