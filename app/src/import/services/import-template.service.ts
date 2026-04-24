import * as XLSX from 'xlsx';

const templateRows = [
  {
    question_id: 'global_001',
    is_example: false,
    type: 'multiple_choice',
    category: 'preferences',
    subcategory: 'dates',
    intensity: 1,
    text: 'Que plan escogerias para una cita ideal con tu pareja?',
    option_1: 'Cena con conversa larga',
    option_2: 'Pelicula y postre',
    option_3: 'Escapada de fin de semana',
    option_4: 'Noche en casa',
  },
  {
    question_id: 'global_002',
    is_example: false,
    type: 'hybrid',
    category: 'sexy-questions',
    subcategory: 'flirty',
    intensity: 2,
    text: 'Que detalle tuyo crees que mas enciende la quimica entre ustedes?',
    option_1: 'Una mirada intensa',
    option_2: 'Un mensaje inesperado',
    option_3: 'Un cumplido al oido',
    option_4: 'Otro',
  },
  {
    question_id: 'global_003',
    is_example: false,
    type: 'free_text',
    category: 'romantic',
    subcategory: 'sweet-moments',
    intensity: 1,
    text: 'Describe un plan simple que te encantaria compartir con tu pareja este domingo.',
    option_1: '',
    option_2: '',
    option_3: '',
    option_4: '',
  },
  {
    question_id: 'global_004',
    is_example: false,
    type: 'multiple_choice',
    category: 'sexy-questions',
    subcategory: 'spicy',
    intensity: 3,
    text: 'Si pudieras elegir una atmosfera para una noche especial, cual seria?',
    option_1: 'Luz baja y musica',
    option_2: 'Hotel y sorpresa',
    option_3: 'Casa sin interrupciones',
    option_4: 'Improvisado y atrevido',
  },
  {
    question_id: 'global_005',
    is_example: false,
    type: 'hybrid',
    category: 'hot-takes',
    subcategory: 'red-flags',
    intensity: 4,
    text: 'Que situacion te pondria mas a prueba para adivinar a tu pareja?',
    option_1: 'Elegir entre deseo o ternura',
    option_2: 'Confesar una fantasia',
    option_3: 'Decir una verdad incomoda',
    option_4: 'Otro',
  },
];

const catalogRows = [
  {
    category: 'icebreakers',
    subcategory: 'quick-picks',
    use_case: 'Preferencias rapidas y faciles de adivinar',
  },
  {
    category: 'romantic',
    subcategory: 'memories',
    use_case: 'Momentos lindos, vinculo y nostalgia en pareja',
  },
  {
    category: 'sexy-questions',
    subcategory: 'light',
    use_case: 'Coqueteo suave y comienzo de tension',
  },
  {
    category: 'deep-talk',
    subcategory: 'values',
    use_case: 'Preguntas profundas para conocer prioridades y vision',
  },
  {
    category: 'relationship',
    subcategory: 'communication',
    use_case: 'Dinamicas de pareja, confianza y limites',
  },
  {
    category: 'fun-challenges',
    subcategory: 'dares',
    use_case: 'Retos y situaciones con decision o apuesta',
  },
  {
    category: 'preferences',
    subcategory: 'dates',
    use_case: 'Preferencias concretas sobre planes, gustos y elecciones',
  },
  {
    category: 'scenarios',
    subcategory: 'dream-date',
    use_case: 'Escenarios hipoteticos para elegir y luego adivinar',
  },
  {
    category: 'hot-takes',
    subcategory: 'red-flags',
    use_case: 'Opiniones fuertes que generan contraste y debate',
  },
  {
    category: 'fantasy',
    subcategory: 'what-if',
    use_case: 'Fantasias y situaciones imaginadas para explorar compatibilidad',
  },
];

export function downloadQuestionsTemplate() {
  const worksheet = XLSX.utils.json_to_sheet(templateRows);
  const catalogWorksheet = XLSX.utils.json_to_sheet(catalogRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Preguntas');
  XLSX.utils.book_append_sheet(workbook, catalogWorksheet, 'Catalogo');
  XLSX.writeFile(workbook, 'plantilla_importacion_preguntas.xlsx');
}
