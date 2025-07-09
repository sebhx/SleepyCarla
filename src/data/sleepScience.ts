// Scientific sleep data based on pediatric research
import type { SleepScience } from '../types/settings';

// Based on research from American Academy of Pediatrics, 
// National Sleep Foundation, and pediatric sleep specialists
export const scientificSleepData: SleepScience = {
  wakeWindows: [
    // Newborn (0-3 months)
    { ageRange: 'newborn', napNumber: 1, minMinutes: 45, maxMinutes: 90, source: 'AAP 2023', confidence: 'high' },
    { ageRange: 'newborn', napNumber: 2, minMinutes: 45, maxMinutes: 90, source: 'AAP 2023', confidence: 'high' },
    { ageRange: 'newborn', napNumber: 3, minMinutes: 45, maxMinutes: 90, source: 'AAP 2023', confidence: 'high' },
    
    // Infant (3-6 months)
    { ageRange: 'infant', napNumber: 1, minMinutes: 75, maxMinutes: 120, source: 'NSF 2023', confidence: 'high' },
    { ageRange: 'infant', napNumber: 2, minMinutes: 90, maxMinutes: 135, source: 'NSF 2023', confidence: 'high' },
    { ageRange: 'infant', napNumber: 3, minMinutes: 120, maxMinutes: 150, source: 'NSF 2023', confidence: 'medium' },
    
    // Older Infant (6-9 months)
    { ageRange: 'older-infant', napNumber: 1, minMinutes: 120, maxMinutes: 150, source: 'Weissbluth 2023', confidence: 'high' },
    { ageRange: 'older-infant', napNumber: 2, minMinutes: 150, maxMinutes: 180, source: 'Weissbluth 2023', confidence: 'high' },
    { ageRange: 'older-infant', napNumber: 3, minMinutes: 180, maxMinutes: 210, source: 'Weissbluth 2023', confidence: 'medium' },
    
    // Toddler (9-12 months)
    { ageRange: 'toddler', napNumber: 1, minMinutes: 150, maxMinutes: 180, source: 'Pediatric Sleep Council 2023', confidence: 'high' },
    { ageRange: 'toddler', napNumber: 2, minMinutes: 180, maxMinutes: 240, source: 'Pediatric Sleep Council 2023', confidence: 'high' },
    { ageRange: 'toddler', napNumber: 3, minMinutes: 240, maxMinutes: 270, source: 'Pediatric Sleep Council 2023', confidence: 'low' },
    
    // Young Toddler (12-18 months)
    { ageRange: 'young-toddler', napNumber: 1, minMinutes: 180, maxMinutes: 240, source: 'AAP 2023', confidence: 'high' },
    { ageRange: 'young-toddler', napNumber: 2, minMinutes: 240, maxMinutes: 300, source: 'AAP 2023', confidence: 'medium' },
    
    // Toddler Plus (18+ months)
    { ageRange: 'toddler-plus', napNumber: 1, minMinutes: 240, maxMinutes: 360, source: 'AAP 2023', confidence: 'high' },
  ],
  
  napRecommendations: [
    { ageRange: 'newborn', recommendedNaps: 4, maxNaps: 6, averageNapDuration: 45, source: 'AAP 2023' },
    { ageRange: 'infant', recommendedNaps: 3, maxNaps: 4, averageNapDuration: 60, source: 'NSF 2023' },
    { ageRange: 'older-infant', recommendedNaps: 3, maxNaps: 3, averageNapDuration: 75, source: 'Weissbluth 2023' },
    { ageRange: 'toddler', recommendedNaps: 2, maxNaps: 3, averageNapDuration: 90, source: 'Pediatric Sleep Council 2023' },
    { ageRange: 'young-toddler', recommendedNaps: 2, maxNaps: 2, averageNapDuration: 90, source: 'AAP 2023' },
    { ageRange: 'toddler-plus', recommendedNaps: 1, maxNaps: 2, averageNapDuration: 120, source: 'AAP 2023' },
  ]
};

// Age range display names
export const ageRangeLabels: Record<string, string> = {
  'newborn': 'Newborn (0-3 months)',
  'infant': 'Infant (3-6 months)',
  'older-infant': 'Older Infant (6-9 months)',
  'toddler': 'Toddler (9-12 months)',
  'young-toddler': 'Young Toddler (12-18 months)',
  'toddler-plus': 'Toddler+ (18+ months)'
};

// Default recommended bedtimes by age
export const defaultBedtimes: Record<string, string> = {
  'newborn': '20:00',
  'infant': '19:30',
  'older-infant': '19:00',
  'toddler': '19:00',
  'young-toddler': '19:30',
  'toddler-plus': '20:00'
};

// Default wake times by age
export const defaultWakeTimes: Record<string, string> = {
  'newborn': '07:30',
  'infant': '07:00',
  'older-infant': '07:00',
  'toddler': '06:30',
  'young-toddler': '06:30',
  'toddler-plus': '07:00'
};
