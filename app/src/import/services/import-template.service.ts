import * as XLSX from 'xlsx';

const templateRows = [
  {
    question_id: 'global_001',
    is_example: false,
    type: 'multiple_choice',
    category: 'light',
    intensity: 1,
    text: 'Que plan te gusta mas para una cita?',
    option_1: 'Cena',
    option_2: 'Pelicula',
    option_3: 'Viaje corto',
    option_4: 'Quedarse en casa',
  },
  {
    question_id: 'global_002',
    is_example: false,
    type: 'hybrid',
    category: 'flirty',
    intensity: 2,
    text: 'Que detalle te conquista mas?',
    option_1: 'Mirada',
    option_2: 'Mensaje',
    option_3: 'Regalo',
    option_4: 'Otro',
  },
  {
    question_id: 'global_003',
    is_example: false,
    type: 'free_text',
    category: 'light',
    intensity: 1,
    text: 'Describe tu plan ideal de domingo.',
    option_1: '',
    option_2: '',
    option_3: '',
    option_4: '',
  },
];

export function downloadQuestionsTemplate() {
  const worksheet = XLSX.utils.json_to_sheet(templateRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Preguntas');
  XLSX.writeFile(workbook, 'plantilla_importacion_preguntas.xlsx');
}
