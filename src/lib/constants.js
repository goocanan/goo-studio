export const MATERIALS = ['PLA', 'PLA+', 'PETG', 'ABS', 'TPU', 'ASA', 'Nylon'];

export const BRANDS = ['eSUN', 'Sunlu', 'PolyMaker', 'Bambu Lab', 'Hatchbox', 'Overture', 'Creality'];

export const DEFAULT_BRAND_PRESETS = {
  'eSUN': {
    'PLA': { nozzleMin: 200, nozzleMax: 220, bedMin: 55, bedMax: 65 },
    'PLA+': { nozzleMin: 205, nozzleMax: 220, bedMin: 55, bedMax: 65 },
    'PETG': { nozzleMin: 230, nozzleMax: 245, bedMin: 70, bedMax: 80 },
    'ABS': { nozzleMin: 230, nozzleMax: 250, bedMin: 95, bedMax: 110 },
  },
  'Sunlu': {
    'PLA': { nozzleMin: 200, nozzleMax: 215, bedMin: 50, bedMax: 60 },
    'PLA+': { nozzleMin: 205, nozzleMax: 220, bedMin: 55, bedMax: 65 },
    'PETG': { nozzleMin: 225, nozzleMax: 240, bedMin: 65, bedMax: 75 },
  },
  'PolyMaker': {
    'PLA': { nozzleMin: 200, nozzleMax: 220, bedMin: 55, bedMax: 65 },
    'PLA+': { nozzleMin: 210, nozzleMax: 225, bedMin: 55, bedMax: 65 },
    'PETG': { nozzleMin: 230, nozzleMax: 250, bedMin: 75, bedMax: 85 },
    'ABS': { nozzleMin: 240, nozzleMax: 260, bedMin: 95, bedMax: 110 },
  },
};

export const SPOOL_STATUSES = {
  AVAILABLE: 'available',
  LOW_STOCK: 'low',
  EMPTY: 'empty',
  NEW: 'new',
};

export const PROJECT_STATUSES = {
  IDEA: 'idea',
  READY: 'ready',
  PRINTING: 'printing',
  DONE: 'done',
};

export const PART_STATUSES = {
  PENDING: 'pending',
  READY: 'ready',
  PRINTING: 'printing',
  DONE: 'done',
};

export const DEFAULT_LOW_STOCK_THRESHOLD = 200; // gram

export const DEFAULT_INITIAL_WEIGHT = 1000; // gram

export const SAMPLE_SPOOLS = [
  {
    id: 'PLA-01',
    brand: 'eSUN',
    material: 'PLA+',
    colorName: 'Fire Red',
    colorHex: '#e53935',
    version: 'V2',
    initialWeight: 1000,

    remainingWeight: 820,
    status: 'available',
    createdAt: '2026-03-20T08:00:00Z',
  },
  {
    id: 'PLA-02',
    brand: 'Sunlu',
    material: 'PLA',
    colorName: 'Matte Black',
    colorHex: '#1a1a2e',
    version: 'V1.1',
    initialWeight: 1000,
    remainingWeight: 150,
    status: 'low',
    createdAt: '2026-03-15T10:00:00Z',
  },
  {
    id: 'PETG-01',
    brand: 'PolyMaker',
    material: 'PETG',
    colorName: 'Clear',
    colorHex: '#e0e7ef',
    version: 'V3',
    initialWeight: 1000,
    remainingWeight: 1000,
    status: 'new',
    createdAt: '2026-03-25T09:00:00Z',
  }
];

export const SAMPLE_PROJECTS = [
  {
    id: 'PRJ-001',
    name: 'Dragon Articulated',
    status: 'ready',
    priority: 'high',
    notes: 'Gift for nephew. Use dual color if possible.',
    createdAt: '2026-03-20T10:00:00Z',
    parts: [
      { id: 'PART-01', name: 'Head', material: 'PLA+', color: 'Fire Red', weight: 85, quantity: 1, status: 'ready' },
      { id: 'PART-02', name: 'Body Segments', material: 'PLA+', color: 'Fire Red', weight: 15, quantity: 24, status: 'ready' },
      { id: 'PART-03', name: 'Tail', material: 'PLA+', color: 'Fire Red', weight: 40, quantity: 1, status: 'ready' },
    ]
  },
  {
    id: 'PRJ-002',
    name: 'Mechanical Linkage V2',
    status: 'idea',
    priority: 'medium',
    notes: 'Testing tolerances.',
    createdAt: '2026-03-22T14:00:00Z',
    parts: [
      { id: 'PART-04', name: 'Base Plate', material: 'PETG', color: 'Clear', weight: 120, quantity: 1, status: 'pending' },
      { id: 'PART-05', name: 'Linkage Arm', material: 'PETG', color: 'Clear', weight: 45, quantity: 2, status: 'pending' },
    ]
  },
  {
    id: 'PRJ-003',
    name: 'Minimalist Phone Stand',
    status: 'done',
    priority: 'low',
    notes: '',
    createdAt: '2026-03-15T09:00:00Z',
    parts: [
      { id: 'PART-06', name: 'Main Body', material: 'PLA+', color: 'Matte Black', weight: 180, quantity: 1, status: 'done' },
    ]
  }
];

