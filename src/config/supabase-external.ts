/**
 * Configuration Supabase Externe pour Scoly
 * ==============================================
 * 
 * Connexion configurée vers le projet Supabase externe.
 * IMPORTANT: La clé service_role NE DOIT JAMAIS être exposée ici.
 */

export interface ExternalSupabaseConfig {
  url: string;
  anonKey: string;
  projectId: string;
}

// Configuration du Supabase externe - Utilise les variables d'environnement ou les valeurs par défaut
export const EXTERNAL_SUPABASE_CONFIG: ExternalSupabaseConfig = {
  url: import.meta.env.VITE_SUPABASE_URL || "https://duxbzpsezdhvhprwjwmk.supabase.co",
  anonKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eGJ6cHNlemRodmhwcndqd21rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMDQ3NzksImV4cCI6MjA4NTg4MDc3OX0.2PnaHtqm4j_PKc7yQaiQ3OJoAD4lHsYkfEfV8bJa5-w",
  projectId: import.meta.env.VITE_SUPABASE_PROJECT_ID || "duxbzpsezdhvhprwjwmk",
};

/**
 * Fonction pour obtenir l'URL des Edge Functions
 */
export const getEdgeFunctionUrl = (functionName: string): string => {
  return `${EXTERNAL_SUPABASE_CONFIG.url}/functions/v1/${functionName}`;
};

/**
 * Vérifie si la configuration utilise un Supabase externe
 */
export const isExternalSupabase = (): boolean => {
  return true; // Toujours externe maintenant
};
