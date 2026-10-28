export interface ThemeColors {
  isDark: boolean;
  bgPrimary: string;
  bgSecondary: string;
  bgElevated: string;
  bgCardHover: string;
  border: string;
  borderSubtle: string;
  borderFocus: string;
  accent: string;
  accentLight: string;
  accentMuted: string;
  accentGlow: string;
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
  bgPrimary: '#0A0B0E', // True Deep Obsidian (No cheap blue cast)
  bgSecondary: '#12141B', // Rich elevated charcoal slate
  bgElevated: '#191C25', // High-tactile surface for inputs and interactive pills
  bgCardHover: '#1E222D',
  border: '#1F232F', // Hairline executive slate
  borderSubtle: '#161922',
  borderFocus: '#C5A880',
  accent: '#C5A880', // Brushed Champagne Gold
  accentLight: '#DFC59F',
  accentMuted: 'rgba(197, 168, 128, 0.12)',
  accentGlow: 'rgba(197, 168, 128, 0.22)',
  textPrimary: '#F6F7F9', // Crisp diamond off-white
  textSecondary: '#8E94A4', // Calm warm executive graphite
  textMuted: '#515668',
  companyBadge: '#6385FF',
  companyBadgeBg: 'rgba(99, 133, 255, 0.12)',
  personalBadge: '#46BA88',
  personalBadgeBg: 'rgba(70, 186, 136, 0.12)',
  highPriority: '#E26363',
  highPriorityBg: 'rgba(226, 99, 99, 0.12)',
  medPriority: '#DFA347',
  medPriorityBg: 'rgba(223, 163, 71, 0.12)',
  lowPriority: '#5B9EEB',
  lowPriorityBg: 'rgba(91, 158, 235, 0.12)',
  success: '#46BA88',
  successBg: 'rgba(70, 186, 136, 0.12)',
  cardShadow: 'rgba(0, 0, 0, 0.6)',
};

export const lightTheme: ThemeColors = {
  isDark: false,
  bgPrimary: '#F7F6F3', // Warm Nordic Porcelain Ecru
  bgSecondary: '#FFFFFF', // Clean White Card
  bgElevated: '#EFECE6', // Soft Linen surface
  bgCardHover: '#F4F2EC',
  border: '#E3DFD5', // Hairline warm border
  borderSubtle: '#EDEAE2',
  borderFocus: '#A07C4C',
  accent: '#A07C4C', // Brushed Warm Slate Gold
  accentLight: '#B89565',
  accentMuted: 'rgba(160, 124, 76, 0.12)',
  accentGlow: 'rgba(160, 124, 76, 0.20)',
  textPrimary: '#14161B', // Deep Charcoal Ink
  textSecondary: '#646A77', // Muted Executive Slate
  textMuted: '#969CA8',
  companyBadge: '#2E51BA',
  companyBadgeBg: 'rgba(46, 81, 186, 0.08)',
  personalBadge: '#1F8455',
  personalBadgeBg: 'rgba(31, 132, 85, 0.08)',
  highPriority: '#C23434',
  highPriorityBg: 'rgba(194, 52, 52, 0.08)',
  medPriority: '#B07718',
  medPriorityBg: 'rgba(176, 119, 24, 0.08)',
  lowPriority: '#1B6CBF',
  lowPriorityBg: 'rgba(27, 108, 191, 0.08)',
  success: '#1F8455',
  successBg: 'rgba(31, 132, 85, 0.08)',
  cardShadow: 'rgba(0, 0, 0, 0.04)',
};
