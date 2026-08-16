@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

/* Article content spacing */
.prose p { margin-bottom: 1rem; }
.prose h2, .prose h3, .prose h4 { margin-top: 1.5em; margin-bottom: 0.75em; }
.prose ul, .prose ol { margin-bottom: 1rem; }
.prose blockquote { margin: 1.5rem 0; }

@layer base {
  :root {
    /* Deep Navy — Primary (couleur exacte du logo Scoly #1e3a8a) */
    --primary: 224 64% 33%;
    --primary-foreground: 0 0% 100%;
    --primary-light: 224 60% 48%;
    --primary-dark: 224 70% 22%;
    
    /* Vivid Orange — Secondary (couleur exacte du logo Scoly #f97316) */
    --secondary: 24 95% 53%;
    --secondary-foreground: 0 0% 100%;
    --secondary-light: 24 95% 62%;
    
    /* Orange Accent — match logo */
    --accent: 24 95% 53%;
    --accent-foreground: 0 0% 100%;
    
    /* Backgrounds — léger voile bleuté pour faire ressortir la navy du logo */
    --background: 220 33% 98%;
    --foreground: 224 50% 14%;
    
    /* Cards & Surfaces */
    --card: 0 0% 100%;
    --card-foreground: 220 30% 15%;
    
    --popover: 0 0% 100%;
    --popover-foreground: 220 30% 15%;
    
    /* Muted tones */
    --muted: 40 20% 94%;
    --muted-foreground: 220 15% 45%;
    
    /* Destructive */
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 100%;
    
    /* Borders & Inputs */
    --border: 220 15% 88%;
    --input: 220 15% 88%;
    --ring: 224 64% 33%;
    
    --radius: 0.75rem;
    
    /* Gradients — alignés sur le logo (navy + orange) */
    --gradient-primary: linear-gradient(135deg, hsl(224 70% 22%) 0%, hsl(224 64% 33%) 60%, hsl(24 95% 53%) 140%);
    --gradient-secondary: linear-gradient(135deg, hsl(24 95% 50%) 0%, hsl(24 95% 62%) 100%);
    --gradient-hero: linear-gradient(135deg, hsl(224 70% 18%) 0%, hsl(224 64% 30%) 55%, hsl(24 95% 53%) 130%);
    --gradient-card: linear-gradient(180deg, hsl(0 0% 100%) 0%, hsl(220 33% 98%) 100%);
    
    /* Shadows */
    --shadow-sm: 0 2px 8px -2px hsl(220 30% 15% / 0.08);
    --shadow-md: 0 8px 24px -4px hsl(220 30% 15% / 0.12);
    --shadow-lg: 0 16px 48px -8px hsl(220 30% 15% / 0.16);
    --shadow-glow: 0 0 40px hsl(220 65% 18% / 0.25);
    --shadow-gold: 0 4px 20px hsl(30 85% 48% / 0.35);

    --sidebar-background: 0 0% 98%;
    --sidebar-foreground: 240 5.3% 26.1%;
    --sidebar-primary: 240 5.9% 10%;
    --sidebar-primary-foreground: 0 0% 98%;
    --sidebar-accent: 240 4.8% 95.9%;
    --sidebar-accent-foreground: 240 5.9% 10%;
    --sidebar-border: 220 13% 91%;
    --sidebar-ring: 217.2 91.2% 59.8%;
  }

  .dark {
    --primary: 220 55% 40%;
    --primary-foreground: 0 0% 100%;
    --primary-light: 220 50% 50%;
    --primary-dark: 220 60% 28%;
    
    --secondary: 24 90% 55%;
    --secondary-foreground: 0 0% 100%;
    
    --accent: 30 80% 52%;
    --accent-foreground: 0 0% 100%;
    
    --background: 220 30% 8%;
    --foreground: 40 20% 95%;
    
    --card: 220 28% 12%;
    --card-foreground: 40 20% 95%;
    
    --popover: 220 28% 12%;
    --popover-foreground: 40 20% 95%;
    
    --muted: 220 25% 18%;
    --muted-foreground: 220 15% 60%;
    
    --destructive: 0 70% 50%;
    --destructive-foreground: 0 0% 100%;
    
    --border: 220 25% 22%;
    --input: 220 25% 22%;
    --ring: 213 50% 45%;

    --sidebar-background: 240 5.9% 10%;
    --sidebar-foreground: 240 4.8% 95.9%;
    --sidebar-primary: 224.3 76.3% 48%;
    --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: 240 3.7% 15.9%;
    --sidebar-accent-foreground: 240 4.8% 95.9%;
    --sidebar-border: 240 3.7% 15.9%;
    --sidebar-ring: 217.2 91.2% 59.8%;
  }
}

@layer base {
  * {
    @apply border-border;
  }

  html {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
  }

  body {
    @apply bg-background text-foreground font-sans antialiased;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11';
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    letter-spacing: -0.02em;
    font-weight: 700;
  }

  h1 { letter-spacing: -0.035em; }
}

@layer utilities {
  .font-display {
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    letter-spacing: -0.02em;
  }
  
  .font-body {
    font-family: 'Inter', system-ui, sans-serif;
  }

  .text-gradient-primary {
    background: var(--gradient-primary);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .text-gradient-hero {
    background: var(--gradient-hero);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .bg-gradient-primary {
    background: var(--gradient-primary);
  }

  .bg-gradient-secondary {
    background: var(--gradient-secondary);
  }

  .bg-gradient-hero {
    background: var(--gradient-hero);
  }

  .shadow-glow {
    box-shadow: var(--shadow-glow);
  }

  .shadow-gold {
    box-shadow: var(--shadow-gold);
  }
}

/* Animations */
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 20px hsl(213 55% 23% / 0.3); }
  50% { box-shadow: 0 0 40px hsl(213 55% 23% / 0.5); }
}

@keyframes slide-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scale-in {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes slide-in-right {
  from { opacity: 0; transform: translateX(30px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes slide-in-left {
  from { opacity: 0; transform: translateX(-30px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes bounce-soft {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

@keyframes rotate-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes gradient-shift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}

.animate-shimmer {
  background: linear-gradient(90deg, transparent, hsl(0 0% 100% / 0.4), transparent);
  background-size: 200% 100%;
  animation: shimmer 2s infinite;
}

.animate-pulse-glow {
  animation: pulse-glow 2s ease-in-out infinite;
}

.animate-slide-up {
  animation: slide-up 0.6s ease-out forwards;
}

.animate-fade-in {
  animation: fade-in 0.5s ease-out forwards;
}

.animate-scale-in {
  animation: scale-in 0.4s ease-out forwards;
}

.animate-slide-in-right {
  animation: slide-in-right 0.5s ease-out forwards;
}

.animate-slide-in-left {
  animation: slide-in-left 0.5s ease-out forwards;
}

.animate-bounce-soft {
  animation: bounce-soft 2s ease-in-out infinite;
}

.animate-rotate-slow {
  animation: rotate-slow 20s linear infinite;
}

.animate-gradient-shift {
  background-size: 200% 200%;
  animation: gradient-shift 3s ease infinite;
}

.animation-delay-100 { animation-delay: 100ms; }
.animation-delay-200 { animation-delay: 200ms; }
.animation-delay-300 { animation-delay: 300ms; }
.animation-delay-400 { animation-delay: 400ms; }
.animation-delay-500 { animation-delay: 500ms; }
.animation-delay-600 { animation-delay: 600ms; }
.animation-delay-700 { animation-delay: 700ms; }
.animation-delay-800 { animation-delay: 800ms; }

/* Smooth transitions for interactive elements */
.transition-smooth {
  @apply transition-all duration-300 ease-out;
}

.hover-lift {
  @apply transition-all duration-300 hover:-translate-y-1 hover:shadow-lg;
}

.hover-scale {
  @apply transition-transform duration-300 hover:scale-105;
}

.hover-glow {
  @apply transition-all duration-300 hover:shadow-glow;
}

/* Card hover effects */
.card-hover {
  @apply transition-all duration-300 hover:-translate-y-2 hover:shadow-xl;
}

/* Link underline animation */
.link-underline {
  @apply relative inline-block;
}

.link-underline::after {
  content: '';
  @apply absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300;
}

.link-underline:hover::after {
  @apply w-full;
}

/* Stagger animation children */
.stagger-children > * {
  @apply animate-slide-up opacity-0;
}

.stagger-children > *:nth-child(1) { animation-delay: 0ms; }
.stagger-children > *:nth-child(2) { animation-delay: 100ms; }
.stagger-children > *:nth-child(3) { animation-delay: 200ms; }
.stagger-children > *:nth-child(4) { animation-delay: 300ms; }
.stagger-children > *:nth-child(5) { animation-delay: 400ms; }
.stagger-children > *:nth-child(6) { animation-delay: 500ms; }

/* Glass effect */
.glass {
  @apply backdrop-blur-md bg-background/80 border border-border/50;
}

/* Focus ring */
.focus-ring {
  @apply focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2;
}

/* Article table styles - for TipTap editor and rendered content */
.article-table,
.prose table {
  width: 100%;
  border-collapse: collapse;
  margin: 1.5rem 0;
  font-size: 0.925rem;
  border-radius: 0.5rem;
  overflow: hidden;
  border: 1px solid hsl(var(--border));
}

.article-table th,
.prose table th {
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  font-weight: 600;
  text-align: left;
  padding: 0.75rem 1rem;
  border: 1px solid hsl(var(--primary-dark, var(--primary)) / 0.3);
}

.article-table td,
.prose table td {
  padding: 0.65rem 1rem;
  border: 1px solid hsl(var(--border));
  vertical-align: top;
}

.article-table tr:nth-child(even) td,
.prose table tr:nth-child(even) td {
  background: hsl(var(--muted) / 0.4);
}

.article-table tr:hover td,
.prose table tr:hover td {
  background: hsl(var(--primary) / 0.06);
}

/* TipTap table editor specific */
.ProseMirror .article-table {
  margin: 1rem 0;
}

.ProseMirror table .selectedCell {
  background: hsl(var(--primary) / 0.12);
}

.ProseMirror table .column-resize-handle {
  position: absolute;
  right: -2px;
  top: 0;
  bottom: 0;
  width: 4px;
  background: hsl(var(--primary));
  cursor: col-resize;
}

.ProseMirror .tableWrapper {
  overflow-x: auto;
  margin: 1rem 0;
}
