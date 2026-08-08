export const COLORS = {
  // Base colors
  background: '#121214', // Rich dark obsidian/charcoal
  surface: '#1E1E22', // Slate surface
  surfaceSecondary: '#282830',
  border: '#33333C',
  
  // Text colors
  textPrimary: '#F5F5F7', // Off-white
  textSecondary: '#A0A0AA', 
  textMuted: '#666670',
  
  // Accent colors
  accentBlue: '#D4AF37', // Polished brass gold
  accentPink: '#A33B49', // Deep Burgundy
  accentAmber: '#FFCC00', // Polished bright amber gold
  
  // Board/Tile colors (High-contrast Matte wood/stone tones)
  tile1: '#F4F0E6', // Light Ash Wood
  tile2: '#E3D5C1', // Honey Oak Wood
  tile3: '#9E8875', // Dark Walnut Wood
  
  // Labels (Charcoal for light tiles, Cream for dark tiles)
  labelDark: '#221F1D', 
  labelLight: '#FAF8F5',
  
  // Border glows (Muted classic shades)
  glow1: '#D4C9B5', 
  glow2: '#BBA891', 
  glow3: '#7A6655', 
  
  // Player specific colors (Ivory/Gold vs Ebony/Silver)
  player1: {
    primary: '#FFFFFF', // Pure White border
    secondary: '#F59E0B', // Solid Sun Yellow / Amber fill
    glow: 'rgba(245, 158, 11, 0.4)',
  },
  player2: {
    primary: '#1F2937', // Obsidian Dark Charcoal border
    secondary: '#E11D48', // Bright Crimson Red fill
    glow: 'rgba(225, 29, 72, 0.4)',
  },
  bot: {
    primary: '#1F2937', // Obsidian Dark Charcoal border
    secondary: '#E11D48', // Bright Crimson Red fill
    glow: 'rgba(225, 29, 72, 0.4)',
  },
  
  // Overlay & interaction
  selected: '#FFCC00', // Polished gold selection
  legalMove: '#FFB300', // Bright high-visibility amber gold
  legalMoveDot: '#FFB300',
  captureMove: '#FF453A', // Vibrant red for captures
  overlayBg: 'rgba(18, 18, 20, 0.95)',
};
