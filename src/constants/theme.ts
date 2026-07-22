export const THEME = {
  appName: 'RideMate',
  tagline: 'Smart Carpooling for Smarter Commutes',
  description: 'Connect with drivers commuting to and from Dilkusha Towers. Save fuel, build networks, and reduce emissions.',
  
  gradients: {
    primary: 'from-brand-primary to-brand-accent',
    primaryHover: 'from-brand-primaryLight to-brand-accentLight',
    text: 'bg-clip-text text-transparent bg-gradient-to-r from-brand-primary to-brand-accent',
    glowBlobEmerald: 'glow-emerald',
    glowBlobSky: 'glow-sky',
  },
  
  classes: {
    card: 'glass-card rounded-2xl p-6 relative overflow-hidden',
    panel: 'glass-panel',
    glowBlob: 'glow-blob',
    bgGrid: 'bg-grid',
  }
} as const;
