import jsPDF from "jspdf";

const COLORS = {
  primary: [0, 102, 51] as [number, number, number],
  dark: [30, 30, 30] as [number, number, number],
  muted: [100, 100, 100] as [number, number, number],
  light: [240, 240, 240] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  accent: [0, 150, 80] as [number, number, number],
  red: [200, 50, 50] as [number, number, number],
};

function addHeader(doc: jsPDF, title: string, subtitle?: string) {
  // Green header bar
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, 210, 35, "F");
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("SCOLY", 15, 18);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Plateforme E-commerce Éducative — Côte d'Ivoire", 15, 26);
  // Title bar
  doc.setFillColor(...COLORS.dark);
  doc.rect(0, 35, 210, 15, "F");
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(title, 15, 45);
  if (subtitle) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(subtitle, 195, 45, { align: "right" });
  }
  return 58;
}

function addFooter(doc: jsPDF, page: number, total: number) {
  const y = 285;
  doc.setDrawColor(...COLORS.light);
  doc.line(15, y, 195, y);
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.muted);
  doc.text(`Scoly — Document confidentiel — ${new Date().toLocaleDateString("fr-FR")}`, 15, y + 5);
  doc.text(`Page ${page}/${total}`, 195, y + 5, { align: "right" });
  doc.text("Contact : inocent.koffi@agricapital.ci | +225 07 02 58 44 57", 105, y + 5, { align: "center" });
}

function sectionTitle(doc: jsPDF, y: number, text: string): number {
  doc.setFillColor(...COLORS.primary);
  doc.rect(15, y, 180, 8, "F");
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(text, 19, y + 6);
  return y + 14;
}

function bulletPoint(doc: jsPDF, y: number, text: string, indent = 19): number {
  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setFillColor(...COLORS.primary);
  doc.circle(indent, y - 1, 1.2, "F");
  const lines = doc.splitTextToSize(text, 170);
  doc.text(lines, indent + 4, y);
  return y + lines.length * 5;
}

function checkPage(doc: jsPDF, y: number, needed = 30): number {
  if (y > 270 - needed) {
    doc.addPage();
    return 20;
  }
  return y;
}

// ─── 1. Audit Technique PDF ───
export function generateAuditPDF() {
  const doc = new jsPDF();
  let y = addHeader(doc, "AUDIT TECHNIQUE COMPLET", "Score : 95/100 — v2.5");

  // Score overview
  doc.setFillColor(245, 250, 245);
  doc.roundedRect(15, y, 180, 25, 3, 3, "F");
  doc.setTextColor(...COLORS.primary);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text("95/100", 25, y + 17);
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.dark);
  doc.text("Score global d'audit technique", 65, y + 12);
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.muted);
  doc.text("Évalué sur 14 critères pondérés — Architecture, Sécurité, Performance, UX", 65, y + 19);
  y += 32;

  // Criteria table
  y = sectionTitle(doc, y, "1. GRILLE DE NOTATION DÉTAILLÉE");
  const criteria = [
    ["Architecture technique", "React 18 + TypeScript + Vite + Supabase", "10/10"],
    ["Base de données", "30+ tables, fonctions RPC, triggers", "9/10"],
    ["Sécurité RLS", "Politiques sur toutes les tables, anti-bruteforce", "9/10"],
    ["Authentification", "Multi-méthodes, sessions sécurisées, CAPTCHA", "9/10"],
    ["E-commerce", "Panier, checkout, Mobile Money, fidélité", "10/10"],
    ["Automatisation", "Analyse, génération contenu, publications", "9/10"],
    ["Multilingue", "4 langues (FR, EN, DE, ES)", "8/10"],
    ["Performance", "50+ index, lazy loading, PWA", "9/10"],
    ["Responsive", "Mobile-first, breakpoints adaptés", "9/10"],
    ["Edge Functions", "15+ fonctions serverless déployées", "9/10"],
    ["Notifications", "Push + in-app + email transactionnels", "8/10"],
    ["Tests", "Vitest + Testing Library", "6/10"],
    ["Documentation", "2 sous-pages, documents PDF", "8/10"],
    ["Déploiement", "Vercel + PWA + Service Worker", "9/10"],
  ];

  // Table header
  doc.setFillColor(...COLORS.dark);
  doc.rect(15, y, 180, 7, "F");
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Critère", 19, y + 5);
  doc.text("Détail", 75, y + 5);
  doc.text("Score", 175, y + 5);
  y += 7;

  criteria.forEach(([name, detail, score], i) => {
    y = checkPage(doc, y, 8);
    doc.setFillColor(i % 2 === 0 ? 255 : 248, i % 2 === 0 ? 255 : 248, i % 2 === 0 ? 255 : 248);
    doc.rect(15, y, 180, 7, "F");
    doc.setTextColor(...COLORS.dark);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(name, 19, y + 5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.muted);
    doc.text(detail.substring(0, 55), 75, y + 5);
    doc.setTextColor(...COLORS.primary);
    doc.setFont("helvetica", "bold");
    doc.text(score, 178, y + 5, { align: "right" });
    y += 7;
  });
  y += 8;

  // Architecture
  y = checkPage(doc, y, 40);
  y = sectionTitle(doc, y, "2. ARCHITECTURE TECHNIQUE");
  const archItems = [
    "Frontend : React 18 + TypeScript + Vite + Tailwind CSS + Shadcn/ui",
    "Backend : Supabase (PostgreSQL + RLS + Edge Functions + Realtime + Storage)",
    "Paiement : KkiaPay (Orange Money, MTN MoMo, Moov Money, Wave)",
    "Automatisation de contenu — analyse, génération, traduction",
    "Déploiement : Vercel + PWA avec Service Worker",
    "15+ Edge Functions serverless (Deno) déployées automatiquement",
    "30+ tables avec Row Level Security sur l'ensemble du schéma",
  ];
  archItems.forEach(item => {
    y = checkPage(doc, y, 8);
    y = bulletPoint(doc, y, item);
  });
  y += 5;

  // Security
  y = checkPage(doc, y, 40);
  y = sectionTitle(doc, y, "3. SÉCURITÉ");
  const secItems = [
    "RLS activé sur toutes les tables — accès anon bloqué sur 13 tables sensibles",
    "Anti-bruteforce : check_rate_limit() — 5 tentatives / 5 min, blocage 15 min",
    "CAPTCHA mathématique à l'inscription pour vérification humaine",
    "Sessions sécurisées : login_sessions avec confirmation, expiration 1h, blocage",
    "Audit logs : journalisation de toutes les actions admin avec données avant/après",
    "Vue tracking anti-spam : 1 vue/heure/session via fingerprint SHA-256",
    "Fenêtres temporelles : 7j pour preuves livraison, 60j commandes livreurs, 1an paiements",
    "Fonction has_role() SECURITY DEFINER pour éviter les boucles RLS récursives",
  ];
  secItems.forEach(item => {
    y = checkPage(doc, y, 8);
    y = bulletPoint(doc, y, item);
  });
  y += 5;

  // E-commerce
  doc.addPage();
  y = 20;
  y = sectionTitle(doc, y, "4. FONCTIONNALITÉS E-COMMERCE");
  const ecomItems = [
    "Catalogue multilingue avec recherche avancée et filtres dynamiques",
    "Mini-panier latéral (SideCart) avec mise à jour temps réel",
    "Programme de fidélité : 1 point / 1000 FCFA — échangeables en coupons",
    "Wishlist synchronisée avec le compte utilisateur",
    "Ventes flash avec compte à rebours automatique",
    "Système de coupons avec validation, limites et suivi",
    "Suivi de commande en temps réel avec notifications push",
    "Preuves de livraison : photo, GPS, signature, CNI",
    "Système de commissions vendeurs avec suivi et paiement",
  ];
  ecomItems.forEach(item => {
    y = checkPage(doc, y, 8);
    y = bulletPoint(doc, y, item);
  });
  y += 5;

  // Recommendations
  y = checkPage(doc, y, 30);
  y = sectionTitle(doc, y, "5. RECOMMANDATIONS");
  const recs = [
    "Augmenter la couverture de tests unitaires et d'intégration (+30%)",
    "Activer la protection des mots de passe compromis dans Supabase Auth",
    "Implémenter le monitoring applicatif (Sentry ou équivalent)",
    "Ajouter des tests E2E avec Playwright pour les flux critiques",
    "Mettre en place un CDN pour les images produits haute résolution",
  ];
  recs.forEach(item => {
    y = checkPage(doc, y, 8);
    y = bulletPoint(doc, y, item);
  });

  // Add footers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(doc, i, totalPages);
  }

  doc.save("Audit-Technique-Scoly-v25.pdf");
}

// ─── 2. Fiche de Notation PDF ───
export function generateScoringPDF() {
  const doc = new jsPDF();
  let y = addHeader(doc, "FICHE DE NOTATION — GRILLE D'AUDIT", "14 critères pondérés");

  const criteria = [
    { name: "Architecture technique", weight: "10%", score: "10/10", comment: "Stack moderne et cohérente" },
    { name: "Base de données", weight: "10%", score: "9/10", comment: "30+ tables, schéma complet" },
    { name: "Sécurité (RLS)", weight: "10%", score: "9/10", comment: "RLS exhaustive, anti-bruteforce" },
    { name: "Authentification", weight: "8%", score: "9/10", comment: "Multi-méthodes, sessions" },
    { name: "E-commerce", weight: "10%", score: "10/10", comment: "Flux complet, Mobile Money" },
    { name: "Automatisation", weight: "8%", score: "9/10", comment: "Analyse, génération, traduction" },
    { name: "Internationalisation", weight: "5%", score: "8/10", comment: "4 langues supportées" },
    { name: "Performance", weight: "8%", score: "9/10", comment: "50+ index, lazy loading" },
    { name: "Responsive / Mobile", weight: "5%", score: "9/10", comment: "Mobile-first design" },
    { name: "Edge Functions", weight: "8%", score: "9/10", comment: "15+ fonctions serverless" },
    { name: "Notifications", weight: "5%", score: "8/10", comment: "Push + in-app + email" },
    { name: "Tests", weight: "5%", score: "6/10", comment: "Couverture à améliorer" },
    { name: "Documentation", weight: "3%", score: "8/10", comment: "Structurée et complète" },
    { name: "Déploiement", weight: "5%", score: "9/10", comment: "CI/CD, PWA, Vercel" },
  ];

  // Table
  doc.setFillColor(...COLORS.dark);
  doc.rect(15, y, 180, 8, "F");
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("N°", 18, y + 6);
  doc.text("Critère", 28, y + 6);
  doc.text("Poids", 100, y + 6);
  doc.text("Score", 125, y + 6);
  doc.text("Commentaire", 145, y + 6);
  y += 8;

  criteria.forEach((c, i) => {
    y = checkPage(doc, y, 9);
    doc.setFillColor(i % 2 === 0 ? 255 : 245, i % 2 === 0 ? 255 : 248, i % 2 === 0 ? 255 : 245);
    doc.rect(15, y, 180, 8, "F");
    doc.setTextColor(...COLORS.dark);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`${i + 1}`, 18, y + 6);
    doc.setFont("helvetica", "bold");
    doc.text(c.name, 28, y + 6);
    doc.setFont("helvetica", "normal");
    doc.text(c.weight, 103, y + 6);
    doc.setTextColor(...COLORS.primary);
    doc.setFont("helvetica", "bold");
    doc.text(c.score, 128, y + 6);
    doc.setTextColor(...COLORS.muted);
    doc.setFont("helvetica", "normal");
    doc.text(c.comment, 145, y + 6);
    y += 8;
  });

  // Total
  y += 3;
  doc.setFillColor(...COLORS.primary);
  doc.rect(15, y, 180, 10, "F");
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("SCORE TOTAL : 95 / 100", 105, y + 7, { align: "center" });
  y += 18;

  // Legend
  y = sectionTitle(doc, y, "LÉGENDE");
  const legend = [
    ["9-10/10", "Excellent — Implémentation exemplaire"],
    ["7-8/10", "Bon — Fonctionnel avec marge d'amélioration"],
    ["5-6/10", "Moyen — Nécessite des améliorations"],
    ["< 5/10", "Insuffisant — Action prioritaire requise"],
  ];
  legend.forEach(([range, desc]) => {
    y = checkPage(doc, y, 8);
    doc.setTextColor(...COLORS.primary);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(range, 19, y);
    doc.setTextColor(...COLORS.muted);
    doc.setFont("helvetica", "normal");
    doc.text(desc, 50, y);
    y += 6;
  });

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(doc, i, totalPages);
  }

  doc.save("Fiche-Notation-Audit-Scoly.pdf");
}

// ─── 3. Document Nouveautés v3.0 PDF ───
export function generateNouveautesPDF() {
  const doc = new jsPDF();
  let y = addHeader(doc, "NOUVEAUTÉS SCOLY v3.0", "4 fonctionnalités stratégiques");

  // Intro
  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const intro = doc.splitTextToSize(
    "Scoly 3.0 introduit 4 fonctionnalités stratégiques majeures qui transforment l'expérience d'achat scolaire en Côte d'Ivoire : l'Espace Écoles, les Kits Scolaires Intelligents, le Programme de Parrainage et la Marketplace Éducative.",
    170
  );
  doc.text(intro, 19, y);
  y += intro.length * 5 + 8;

  // Feature 1: Schools
  y = sectionTitle(doc, y, "1. ESPACE ÉCOLES & ÉTABLISSEMENTS");
  const schoolFeatures = [
    "Répertoire complet d'écoles par ville, type et zone géographique",
    "Fiches détaillées avec contacts, localisation et programmes",
    "Listes de fournitures officielles par classe et série (A, C, D)",
    "Commande groupée de toute la liste en 1 clic",
    "Programme de fidélité B2B : Bronze → Argent → Or → Platinum",
    "Formulaire d'inscription pour les établissements (validation admin)",
    "Tables DB : schools, school_supply_lists, school_supply_items, school_loyalty",
  ];
  schoolFeatures.forEach(f => { y = checkPage(doc, y, 8); y = bulletPoint(doc, y, f); });
  y += 5;

  // Feature 2: Kits
  y = checkPage(doc, y, 40);
  y = sectionTitle(doc, y, "2. KITS SCOLAIRES INTELLIGENTS");
  const kitFeatures = [
    "Sélection du niveau scolaire : CP1 → Terminale",
    "Filtrage par série pour le secondaire (A, C, D)",
    "Composition automatique basée sur le catalogue produits",
    "Prix total calculé en temps réel avec réductions",
    "Ajout complet au panier en 1 clic",
    "Suggestions de produits complémentaires par IA",
    "Génération assistée par IA pour chaque niveau et série",
  ];
  kitFeatures.forEach(f => { y = checkPage(doc, y, 8); y = bulletPoint(doc, y, f); });
  y += 5;

  // Feature 3: Referral
  y = checkPage(doc, y, 40);
  y = sectionTitle(doc, y, "3. PROGRAMME DE PARRAINAGE");
  const refFeatures = [
    "Code unique par utilisateur : SCOLY-XXXXXX",
    "Partage via WhatsApp, SMS, copie directe",
    "500 FCFA pour le parrain, 300 FCFA pour le filleul",
    "Niveaux ambassadeur : Bronze (1-4) → Argent (5-14) → Or (15-29) → Platinum (30+)",
    "Dashboard ambassadeur avec suivi en temps réel",
    "Tables DB : referrals, referral_rewards",
  ];
  refFeatures.forEach(f => { y = checkPage(doc, y, 8); y = bulletPoint(doc, y, f); });
  y += 5;

  // Feature 4: Resources
  doc.addPage();
  y = 20;
  y = sectionTitle(doc, y, "4. MARKETPLACE ÉDUCATIVE");
  const resFeatures = [
    "Catégories : Exercices, Sujets d'examen, Vidéos, Fiches pédagogiques, Programmes",
    "Filtrage multi-critères : matière, niveau scolaire, type de contenu",
    "Contenus gratuits et premium avec système de prix",
    "Compteur de téléchargements et système de notation",
    "Modération admin avec approbation et suppression",
    "Tables DB : resources, educational_content",
  ];
  resFeatures.forEach(f => { y = checkPage(doc, y, 8); y = bulletPoint(doc, y, f); });
  y += 8;

  // Objectives
  y = sectionTitle(doc, y, "5. OBJECTIFS STRATÉGIQUES");
  const objectives = [
    "Inscriptions via parrainage : +300% en 6 mois",
    "Temps de commande : 15 min → 2 min (immédiat)",
    "Écoles partenaires : 500+ en Côte d'Ivoire (fin 2026)",
    "Taux de rétention : +50% en 12 mois",
    "Marketplace éducative : 1ère plateforme en CI (2026)",
  ];
  objectives.forEach(f => { y = checkPage(doc, y, 8); y = bulletPoint(doc, y, f); });

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(doc, i, totalPages);
  }

  doc.save("Nouveautes-Scoly-v3.pdf");
}

// ─── 4. Roadmap Stratégique PDF ───
export function generateRoadmapPDF() {
  const doc = new jsPDF();
  let y = addHeader(doc, "ROADMAP STRATÉGIQUE 2026", "Vision & Plan de Développement");

  // Vision
  y = sectionTitle(doc, y, "VISION");
  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(9);
  const vision = doc.splitTextToSize(
    "Faire de Scoly la plateforme de référence pour l'éducation numérique en Côte d'Ivoire et en Afrique de l'Ouest, en combinant e-commerce de fournitures scolaires, gestion des établissements et ressources pédagogiques.",
    170
  );
  doc.text(vision, 19, y);
  y += vision.length * 5 + 8;

  // Q1
  y = sectionTitle(doc, y, "T1 2026 — FONDATION (✅ TERMINÉ)");
  ["Architecture React + Supabase", "Catalogue multilingue (4 langues)", "Paiement Mobile Money (KkiaPay)", "Système d'authentification complet", "Automatisation de contenu", "15+ Edge Functions", "Score audit : 95/100"].forEach(f => {
    y = checkPage(doc, y, 8); y = bulletPoint(doc, y, f);
  });
  y += 5;

  // Q2
  y = checkPage(doc, y, 40);
  y = sectionTitle(doc, y, "T2 2026 — CROISSANCE");
  ["Espace Écoles : 500+ établissements partenaires", "Kits Scolaires IA : génération automatique par niveau", "Programme de Parrainage : acquisition virale", "Marketplace Éducative : contenus premium", "Application mobile PWA optimisée", "Monitoring avancé (Sentry)"].forEach(f => {
    y = checkPage(doc, y, 8); y = bulletPoint(doc, y, f);
  });
  y += 5;

  // Q3
  y = checkPage(doc, y, 40);
  y = sectionTitle(doc, y, "T3 2026 — EXPANSION");
  ["Expansion vers le Burkina Faso et le Sénégal", "API ouverte pour intégrations tierces", "Système de notation et avis vérifiés", "Logistique : partenariats livraison dernière mile", "Module analytics avancé pour les écoles"].forEach(f => {
    y = checkPage(doc, y, 8); y = bulletPoint(doc, y, f);
  });
  y += 5;

  // Q4
  doc.addPage();
  y = 20;
  y = sectionTitle(doc, y, "T4 2026 — LEADERSHIP");
  ["1ère plateforme éducative en Côte d'Ivoire", "50 000+ utilisateurs actifs", "Système de bourses scolaires numériques", "Partenariats ministériels (MENA)", "Levée de fonds Série A"].forEach(f => {
    y = checkPage(doc, y, 8); y = bulletPoint(doc, y, f);
  });

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(doc, i, totalPages);
  }

  doc.save("Roadmap-Strategique-Scoly-2026.pdf");
}
