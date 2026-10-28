export interface ThemeColors {
  isDark: boolean;
  bgPrimary: string;
  bgSecondary: string;
  bgElevated: string;
  border: string;
  borderSubtle: string;
  accent: string;
  accentMuted: string;
  accentHover: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  companyBadge: string;
  companyBadgeBg: string;
  personalBadge: string;
  personalBadgeBg: string;
  highPriority: string;
  highPriorityBg: string;
  medPriority: string;
  medPriorityBg: string;
  lowPriority: string;
  lowPriorityBg: string;
  success: string;
  successBg: string;
  cardShadow: string;
}

export const darkTheme: ThemeColors = {
  isDark: true,
  bgPrimary: '#0D0E11', // Deep Obsidian
  bgSecondary: '#15171E', // Elevated Card
  bgElevated: '#1D202B', // Modals / Inputs
  border: '#252936', // Clean Slate Border
  borderSubtle: '#1C1F2B',
  accent: '#C5A880', // Brushed Champagne Gold
  accentMuted: 'rgba(197, 168, 128, 0.15)',
  accentHover: '#D4B78F',
  textPrimary: '#F5F6F8', // Crisp Off-White
  textSecondary: '#989EA9', // Muted Executive Gray
  textMuted: '#5C6272',
  companyBadge: '#6888F5',
  companyBadgeBg: 'rgba(104, 136, 245, 0.14)',
  personalBadge: '#4EBA89',
  personalBadgeBg: 'rgba(78, 186, 137, 0.14)',
  highPriority: '#E26D6D',
  highPriorityBg: 'rgba(226, 109, 109, 0.15)',
  medPriority: '#D6A654',
  medPriorityBg: 'rgba(214, 166, 84, 0.15)',
  lowPriority: '#62A0EA',
  lowPriorityBg: 'rgba(98, 160, 234, 0.15)',
  success: '#4EBA89',
  successBg: 'rgba(78, 186, 137, 0.15)',
  cardShadow: 'rgba(0, 0, 0, 0.45)',
};

export const lightTheme: ThemeColors = {
  isDark: false,
  bgPrimary: '#F8F8F6', // Nordic Warm Porcelain
  bgSecondary: '#FFFFFF', // Clean White Paper Card
  bgElevated: '#F0EFEB', // Inputs & Tag surface
  border: '#E6E4DD', // Crisp Linen Border
  borderSubtle: '#EEECE6',
  accent: '#A68254', // Slate Champagne Gold
  accentMuted: 'rgba(166, 130, 84, 0.12)',
  accentHover: '#8C6C42',
  textPrimary: '#14161A', // Deep Charcoal
  textSecondary: '#666B77', // Muted Slate
  textMuted: '#979DA9',
  companyBadge: '#3252BF',
  companyBadgeBg: 'rgba(50, 82, 191, 0.10)',
  personalBadge: '#248356',
  personalBadgeBg: 'rgba(36, 131, 86, 0.10)',
  highPriority: '#C53939',
  highPriorityBg: 'rgba(197, 57, 57, 0.10)',
  medPriority: '#B07B1D',
  medPriorityBg: 'rgba(176, 123, 29, 0.10)',
  lowPriority: '#2272C7',
  lowPriorityBg: 'rgba(34, 114, 199, 0.10)',
  success: '#248356',
  successBg: 'rgba(36, 131, 86, 0.10)',
  cardShadow: 'rgba(0, 0, 0, 0.05)',
};
