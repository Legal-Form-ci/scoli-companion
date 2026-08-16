import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Complete list of textbooks extracted from the official PDF
// "LISTE DES MANUELS SCOLAIRES, SUPPORTS DIDACTIQUES ET PÉDAGOGIQUES AGRÉÉS OU RECOMMANDÉS 2023-2024"
const TEXTBOOKS = [
  // ===== PRESCOLAIRE =====
  { name: "Graphisme/Lecture/EDHC - Toute la maternelle PS", subject: "Français", level: "Préscolaire - Petite Section", edition: "NEI/CEDA", price: 2500, type: "Manuel scolaire" },
  { name: "Mathématiques/Eveil/AEC - Toute la maternelle PS", subject: "Mathématiques", level: "Préscolaire - Petite Section", edition: "NEI/CEDA", price: 2500, type: "Manuel scolaire" },
  { name: "Comment réussir ma maternelle en PS?", subject: "Pluridisciplines", level: "Préscolaire - Petite Section", edition: "ARE", price: 2000, type: "Manuel scolaire" },
  { name: "Mes apprentissages à la maternelle PS - Livre 1", subject: "AEM, Lecture, Graphisme", level: "Préscolaire - Petite Section", edition: "JD Editions", price: 2200, type: "Manuel scolaire" },
  { name: "Mes apprentissages à la maternelle PS - Livre 2", subject: "Maths, EDHC, AEC", level: "Préscolaire - Petite Section", edition: "JD Editions", price: 2200, type: "Manuel scolaire" },
  { name: "Graphisme/Lecture/EDHC - Toute la maternelle MS", subject: "Français", level: "Préscolaire - Moyenne Section", edition: "NEI/CEDA", price: 2500, type: "Manuel scolaire" },
  { name: "Mathématiques/Eveil/AEC - Toute la maternelle MS", subject: "Mathématiques", level: "Préscolaire - Moyenne Section", edition: "NEI/CEDA", price: 2500, type: "Manuel scolaire" },
  { name: "Comment réussir ma maternelle en MS?", subject: "Pluridisciplines", level: "Préscolaire - Moyenne Section", edition: "ARE", price: 2000, type: "Manuel scolaire" },
  { name: "Mes apprentissages à la maternelle MS - Livre 1", subject: "AEM, Lecture, Graphisme", level: "Préscolaire - Moyenne Section", edition: "JD Editions", price: 2200, type: "Manuel scolaire" },
  { name: "Mes apprentissages à la maternelle MS - Livre 2", subject: "Maths, EDHC, AEC", level: "Préscolaire - Moyenne Section", edition: "JD Editions", price: 2200, type: "Manuel scolaire" },
  { name: "Graphisme/Lecture/EDHC - Toute la maternelle GS", subject: "Français", level: "Préscolaire - Grande Section", edition: "NEI/CEDA", price: 2500, type: "Manuel scolaire" },
  { name: "Mathématiques/Eveil/AEC - Toute la maternelle GS", subject: "Mathématiques", level: "Préscolaire - Grande Section", edition: "NEI/CEDA", price: 2500, type: "Manuel scolaire" },
  { name: "Comment réussir ma maternelle en GS?", subject: "Pluridisciplines", level: "Préscolaire - Grande Section", edition: "ARE", price: 2000, type: "Manuel scolaire" },
  { name: "Mes apprentissages à la maternelle GS - Livre 1", subject: "AEM, Lecture, Graphisme", level: "Préscolaire - Grande Section", edition: "JD Editions", price: 2200, type: "Manuel scolaire" },
  { name: "Mes apprentissages à la maternelle GS - Livre 2", subject: "Maths, EDHC, AEC", level: "Préscolaire - Grande Section", edition: "JD Editions", price: 2200, type: "Manuel scolaire" },
  // Œuvres préscolaires
  { name: "Bibi n'aime pas l'école", subject: "Lecture", level: "Préscolaire - Grande Section", edition: "Les Classiques Ivoiriens", author: "Muriel DIALLO", price: 1500, type: "Œuvre intégrale" },
  { name: "Ahoutou à l'école, premier jour de classe", subject: "Lecture", level: "Préscolaire - Grande Section", edition: "Africa Reflets Editions", author: "Pauline GONDO", price: 1500, type: "Œuvre intégrale" },
  { name: "Nanou au jardin d'enfants", subject: "Lecture", level: "Préscolaire - Grande Section", edition: "Frat Mat Editions", author: "Claire PORQUET", price: 1500, type: "Œuvre intégrale" },

  // ===== PRIMAIRE CP =====
  { name: "Manuel Lecture et Ecriture CP1", subject: "Français", level: "Primaire - CP1", edition: "EBURNIE", price: 2500, type: "Manuel scolaire" },
  { name: "Manuel Lecture et Ecriture CP1 - Ecole Nation", subject: "Français", level: "Primaire - CP1", edition: "NEI/CEDA", price: 2500, type: "Manuel scolaire" },
  { name: "Manuel de Français au quotidien CP1", subject: "Français", level: "Primaire - CP1", edition: "NEI/CEDA", price: 2800, type: "Manuel scolaire" },
  { name: "Je lis et j'écris CP1", subject: "Français", level: "Primaire - CP1", edition: "Les Classiques Ivoiriens", price: 2500, type: "Manuel scolaire" },
  { name: "Mon livre de français CP1", subject: "Français", level: "Primaire - CP1", edition: "JD Editions", price: 2500, type: "Manuel scolaire" },
  { name: "Petit à petit, je lis CP1", subject: "Français", level: "Primaire - CP1", edition: "SuperNova", price: 2200, type: "Manuel scolaire" },
  { name: "Manuel Mathématiques CP1", subject: "Mathématiques", level: "Primaire - CP1", edition: "EBURNIE", price: 2500, type: "Manuel scolaire" },
  { name: "Manuel Mathématiques CP1 - Ecole Nation", subject: "Mathématiques", level: "Primaire - CP1", edition: "NEI/CEDA", price: 2500, type: "Manuel scolaire" },
  { name: "Mathématiques CP1 Cristal", subject: "Mathématiques", level: "Primaire - CP1", edition: "Les Classiques Ivoiriens", price: 2500, type: "Manuel scolaire" },
  { name: "Mon livre de mathématiques CP1", subject: "Mathématiques", level: "Primaire - CP1", edition: "JD Editions", price: 2500, type: "Manuel scolaire" },
  { name: "Manuel Education aux Droits de l'Homme et à la Citoyenneté CP", subject: "EDHC", level: "Primaire - CP1", edition: "Frat-Mat Editions", price: 2000, type: "Manuel scolaire" },
  { name: "Mon Cahier du soir Français CP1", subject: "Français", level: "Primaire - CP1", edition: "NEI-CEDA", price: 1800, type: "Cahier d'exercices" },
  { name: "Mon Cahier du soir Mathématiques CP1", subject: "Mathématiques", level: "Primaire - CP1", edition: "NEI-CEDA", price: 1800, type: "Cahier d'exercices" },
  { name: "Contes et Légendes de chez nous CP1", subject: "Lecture", level: "Primaire - CP1", edition: "NEI/CEDA", price: 1500, type: "Œuvre intégrale" },

  // CP2
  { name: "Manuel Lecture et Ecriture CP2", subject: "Français", level: "Primaire - CP2", edition: "EBURNIE", price: 2500, type: "Manuel scolaire" },
  { name: "Manuel Lecture et Ecriture CP2 - NEI", subject: "Français", level: "Primaire - CP2", edition: "NEI/CEDA", price: 2500, type: "Manuel scolaire" },
  { name: "Je lis et j'écris CP2", subject: "Français", level: "Primaire - CP2", edition: "Les Classiques Ivoiriens", price: 2500, type: "Manuel scolaire" },
  { name: "Petit à petit, je lis CP2", subject: "Français", level: "Primaire - CP2", edition: "SuperNova", price: 2200, type: "Manuel scolaire" },
  { name: "Manuel Mathématiques CP2", subject: "Mathématiques", level: "Primaire - CP2", edition: "NEI/CEDA", price: 2500, type: "Manuel scolaire" },
  { name: "Mon livre de Mathématiques CP2", subject: "Mathématiques", level: "Primaire - CP2", edition: "JD Editions", price: 2500, type: "Manuel scolaire" },
  { name: "Mathématiques CP2 Cristal", subject: "Mathématiques", level: "Primaire - CP2", edition: "Les Classiques Ivoiriens", price: 2500, type: "Manuel scolaire" },

  // CE1
  { name: "Manuel Français CE1", subject: "Français", level: "Primaire - CE1", edition: "EBURNIE", price: 3000, type: "Manuel scolaire" },
  { name: "Français CE1 - Ecole Nation", subject: "Français", level: "Primaire - CE1", edition: "EBURNIE", price: 3000, type: "Manuel scolaire" },
  { name: "Je lis et j'écris CE1", subject: "Français", level: "Primaire - CE1", edition: "Les Classiques Ivoiriens", price: 2800, type: "Manuel scolaire" },
  { name: "Petit à petit je lis CE1", subject: "Français", level: "Primaire - CE1", edition: "SuperNova", price: 2500, type: "Manuel scolaire" },
  { name: "Mathématiques CE1 Cristal", subject: "Mathématiques", level: "Primaire - CE1", edition: "Les Classiques Ivoiriens", price: 3000, type: "Manuel scolaire" },
  { name: "Manuel Mathématiques CE1", subject: "Mathématiques", level: "Primaire - CE1", edition: "EBURNIE", price: 3000, type: "Manuel scolaire" },
  { name: "Mon livre de mathématiques CE1", subject: "Mathématiques", level: "Primaire - CE1", edition: "SuperNova", price: 2800, type: "Manuel scolaire" },
  { name: "Manuel Histoire-Géographie CE1", subject: "Histoire-Géographie", level: "Primaire - CE1", edition: "FRAT/MAT", price: 2800, type: "Manuel scolaire" },
  { name: "Manuel Sciences et Technologie CE1", subject: "Sciences", level: "Primaire - CE1", edition: "NEI", price: 2800, type: "Manuel scolaire" },
  { name: "Le ballet des chiffres", subject: "Lecture", level: "Primaire - CE1", edition: "Les Classiques Ivoiriens", author: "AKA Charlotte", price: 1500, type: "Œuvre intégrale" },
  { name: "Kolou le chasseur", subject: "Lecture", level: "Primaire - CE1", edition: "Les Classiques Ivoiriens", price: 1500, type: "Œuvre intégrale" },
  { name: "Madame blessure et le corona virus", subject: "Lecture", level: "Primaire - CE1", edition: "Les Classiques Ivoiriens", author: "Hermine Sylla", price: 1500, type: "Œuvre intégrale" },

  // CE2
  { name: "Manuel Français CE2", subject: "Français", level: "Primaire - CE2", edition: "EBURNIE", price: 3000, type: "Manuel scolaire" },
  { name: "Français CE2 - Ecole Nation", subject: "Français", level: "Primaire - CE2", edition: "NEI/CEDA", price: 3000, type: "Manuel scolaire" },
  { name: "Je lis et j'écris CE2", subject: "Français", level: "Primaire - CE2", edition: "Les Classiques Ivoiriens", price: 2800, type: "Manuel scolaire" },
  { name: "Petit à petit, je lis CE2", subject: "Français", level: "Primaire - CE2", edition: "SuperNova", price: 2500, type: "Manuel scolaire" },
  { name: "Mathématique CE2", subject: "Mathématiques", level: "Primaire - CE2", edition: "Les Classiques Ivoiriens", price: 3000, type: "Manuel scolaire" },
  { name: "Manuel Mathématiques CE2", subject: "Mathématiques", level: "Primaire - CE2", edition: "EBURNIE", price: 3000, type: "Manuel scolaire" },
  { name: "Mon livre de mathématiques CE2", subject: "Mathématiques", level: "Primaire - CE2", edition: "SuperNova", price: 2800, type: "Manuel scolaire" },
  { name: "Manuel Sciences et Technologie CE2", subject: "Sciences", level: "Primaire - CE2", edition: "NEI", price: 2800, type: "Manuel scolaire" },
  { name: "Manuel Histoire-Géographie CE2", subject: "Histoire-Géographie", level: "Primaire - CE2", edition: "FRAT/MAT", price: 2800, type: "Manuel scolaire" },

  // CM1
  { name: "Manuel de Français CM1", subject: "Français", level: "Primaire - CM1", edition: "S.N.P.E.C.I", price: 3500, type: "Manuel scolaire" },
  { name: "Je lis et j'écris CM1", subject: "Français", level: "Primaire - CM1", edition: "Les Classiques Ivoiriens", price: 3200, type: "Manuel scolaire" },
  { name: "Manuel Mathématiques CM1", subject: "Mathématiques", level: "Primaire - CM1", edition: "EBURNIE", price: 3500, type: "Manuel scolaire" },
  { name: "Math Cristal CM1", subject: "Mathématiques", level: "Primaire - CM1", edition: "Les Classiques Ivoiriens", price: 3200, type: "Manuel scolaire" },
  { name: "Mon livre de mathématiques CM1", subject: "Mathématiques", level: "Primaire - CM1", edition: "SuperNova", price: 3000, type: "Manuel scolaire" },
  { name: "Manuel Sciences et Technologie CM1", subject: "Sciences", level: "Primaire - CM1", edition: "EBURNIE", price: 3200, type: "Manuel scolaire" },
  { name: "Manuel Histoire-Géographie CM1", subject: "Histoire-Géographie", level: "Primaire - CM1", edition: "S.N.P.E.C.I", price: 3200, type: "Manuel scolaire" },
  { name: "EDHC CM1 - Citoyen de demain", subject: "EDHC", level: "Primaire - CM1", edition: "Les Classiques Ivoiriens", price: 2500, type: "Manuel scolaire" },

  // CM2
  { name: "Manuel de Français CM2", subject: "Français", level: "Primaire - CM2", edition: "S.N.P.E.C.I", price: 3500, type: "Manuel scolaire" },
  { name: "Je lis et j'écris CM2", subject: "Français", level: "Primaire - CM2", edition: "Les Classiques Ivoiriens", price: 3200, type: "Manuel scolaire" },
  { name: "Manuel Mathématiques CM2", subject: "Mathématiques", level: "Primaire - CM2", edition: "EBURNIE", price: 3500, type: "Manuel scolaire" },
  { name: "Math Cristal CM2", subject: "Mathématiques", level: "Primaire - CM2", edition: "Les Classiques Ivoiriens", price: 3200, type: "Manuel scolaire" },
  { name: "Mon livre de mathématiques CM2", subject: "Mathématiques", level: "Primaire - CM2", edition: "SuperNova", price: 3000, type: "Manuel scolaire" },
  { name: "Manuel Sciences et Technologie CM2", subject: "Sciences", level: "Primaire - CM2", edition: "EBURNIE", price: 3200, type: "Manuel scolaire" },
  { name: "Manuel Histoire-Géographie CM2", subject: "Histoire-Géographie", level: "Primaire - CM2", edition: "S.N.P.E.C.I", price: 3200, type: "Manuel scolaire" },
  { name: "EDHC CM2 - Citoyen de demain", subject: "EDHC", level: "Primaire - CM2", edition: "Les Classiques Ivoiriens", price: 2500, type: "Manuel scolaire" },
  { name: "Les sentiers de la réussite CM2", subject: "Pluridisciplines", level: "Primaire - CM2", edition: "NEI/CEDA", price: 3000, type: "Manuel scolaire" },
  { name: "Les meilleurs au concours d'entrée en 6ème", subject: "Pluridisciplines", level: "Primaire - CM2", edition: "SUD Edition", price: 3500, type: "Manuel scolaire" },
  { name: "La Plantation de Grand-père", subject: "Lecture", level: "Primaire - CM2", edition: "NEI", author: "Claire Porquet", price: 1800, type: "Œuvre intégrale" },
  { name: "Bibi n'aime pas les légumes", subject: "Lecture", level: "Primaire - CM2", edition: "Les Classiques Ivoiriens", author: "Muriel DIALLO", price: 1500, type: "Œuvre intégrale" },

  // ===== SECONDAIRE 6ème =====
  { name: "English for All 6ème", subject: "Anglais", level: "Secondaire - 6ème", edition: "EBURNIE", price: 3500, type: "Manuel scolaire" },
  { name: "Move forward Manuel 6ème", subject: "Anglais", level: "Secondaire - 6ème", edition: "Vallesse", price: 3500, type: "Manuel scolaire" },
  { name: "Golden English Textbook 6ème", subject: "Anglais", level: "Secondaire - 6ème", edition: "Les Classiques Ivoiriens", price: 3500, type: "Manuel scolaire" },
  { name: "Win skills - student's book 6ème", subject: "Anglais", level: "Secondaire - 6ème", edition: "JD Editions", price: 3500, type: "Manuel scolaire" },
  { name: "English for ever 6ème", subject: "Anglais", level: "Secondaire - 6ème", edition: "Editions Super Nova", price: 3200, type: "Manuel scolaire" },
  { name: "EDHC 6ème", subject: "EDHC", level: "Secondaire - 6ème", edition: "Frat Mat Editions", price: 3000, type: "Manuel scolaire" },
  { name: "Mon livre d'EDHC 6ème", subject: "EDHC", level: "Secondaire - 6ème", edition: "JD Editions", price: 3000, type: "Manuel scolaire" },
  { name: "Education Musicale 6ème", subject: "Education Musicale", level: "Secondaire - 6ème", edition: "Vallesse", price: 3000, type: "Manuel scolaire" },
  { name: "EPS 6ème", subject: "EPS", level: "Secondaire - 6ème", edition: "EBURNIE", price: 3000, type: "Manuel scolaire" },
  { name: "Français 6ème", subject: "Français", level: "Secondaire - 6ème", edition: "NEI/CEDA", price: 4000, type: "Manuel scolaire" },
  { name: "Français 6ème Elite", subject: "Français", level: "Secondaire - 6ème", edition: "NEI/CEDA", price: 4000, type: "Manuel scolaire" },
  { name: "Mon livre de Français 6ème", subject: "Français", level: "Secondaire - 6ème", edition: "SuperNova", price: 3800, type: "Manuel scolaire" },
  { name: "Histoire-Géographie 6ème", subject: "Histoire-Géographie", level: "Secondaire - 6ème", edition: "Nouvelles Editions Balafon", price: 3800, type: "Manuel scolaire" },
  { name: "Mon livre de Mathématiques 6ème", subject: "Mathématiques", level: "Secondaire - 6ème", edition: "JD Editions", price: 4000, type: "Manuel scolaire" },
  { name: "Mathématiques 6ème CIAM", subject: "Mathématiques", level: "Secondaire - 6ème", edition: "NEI/EDICEF", price: 4500, type: "Manuel scolaire" },
  { name: "Maths Nouveaux Programmes 6ème", subject: "Mathématiques", level: "Secondaire - 6ème", edition: "Editions Supernova", price: 3800, type: "Manuel scolaire" },
  { name: "SESAMATH Afrique 6ème", subject: "Mathématiques", level: "Secondaire - 6ème", edition: "Eburnie", price: 4000, type: "Manuel scolaire" },
  { name: "Physique-Chimie 6ème", subject: "Physique-Chimie", level: "Secondaire - 6ème", edition: "NEI/CEDA", price: 3800, type: "Manuel scolaire" },
  { name: "Les triplets de Kodar", subject: "Lecture", level: "Secondaire - 6ème", edition: "Sud Editions", author: "SORO Guefala", price: 2000, type: "Œuvre intégrale" },
  { name: "Les larmes de Carène", subject: "Lecture", level: "Secondaire - 6ème", edition: "JD Editions", author: "Elodie YEBOUA", price: 2000, type: "Œuvre intégrale" },
  { name: "Le sublime sacrifice", subject: "Lecture", level: "Secondaire - 6ème", edition: "Vallesse", author: "KODJO François d'Assise", price: 2000, type: "Œuvre intégrale" },
  { name: "La Tulipe noire", subject: "Lecture", level: "Secondaire - 6ème", edition: "Gallimard Folio J", author: "A. Dumas", price: 2500, type: "Œuvre intégrale" },
  { name: "Sans famille", subject: "Lecture", level: "Secondaire - 6ème", edition: "Hachette", author: "H. MALOT", price: 2500, type: "Œuvre intégrale" },

  // ===== SECONDAIRE 5ème =====
  { name: "English for All 5ème", subject: "Anglais", level: "Secondaire - 5ème", edition: "EBURNIE", price: 3800, type: "Manuel scolaire" },
  { name: "Win skills - student's book 5ème", subject: "Anglais", level: "Secondaire - 5ème", edition: "JD Editions", price: 3800, type: "Manuel scolaire" },
  { name: "EDHC 5ème", subject: "EDHC", level: "Secondaire - 5ème", edition: "Sud Editions", price: 3200, type: "Manuel scolaire" },
  { name: "Mon livre d'EDHC 5ème", subject: "EDHC", level: "Secondaire - 5ème", edition: "JD Editions", price: 3200, type: "Manuel scolaire" },
  { name: "Français 5ème", subject: "Français", level: "Secondaire - 5ème", edition: "NEI/CEDA", price: 4000, type: "Manuel scolaire" },
  { name: "Français 5ème Elite", subject: "Français", level: "Secondaire - 5ème", edition: "NEI/CEDA", price: 4000, type: "Manuel scolaire" },
  { name: "Mon livre de Français 5ème", subject: "Français", level: "Secondaire - 5ème", edition: "SuperNova", price: 3800, type: "Manuel scolaire" },
  { name: "Histoire et Géographie 5ème", subject: "Histoire-Géographie", level: "Secondaire - 5ème", edition: "NEI/CEDA et NEB", price: 3800, type: "Manuel scolaire" },
  { name: "Mathématique 5ème", subject: "Mathématiques", level: "Secondaire - 5ème", edition: "NEI/CEDA", price: 4200, type: "Manuel scolaire" },
  { name: "Mathématiques 5ème CIAM", subject: "Mathématiques", level: "Secondaire - 5ème", edition: "NEI/EDICEF", price: 4500, type: "Manuel scolaire" },
  { name: "Mon Livre de Mathématiques 5ème", subject: "Mathématiques", level: "Secondaire - 5ème", edition: "JD Editions", price: 4000, type: "Manuel scolaire" },
  { name: "Maths Nouveaux Programmes 5ème", subject: "Mathématiques", level: "Secondaire - 5ème", edition: "Editions Supernova", price: 3800, type: "Manuel scolaire" },
  { name: "Physique-Chimie 5ème", subject: "Physique-Chimie", level: "Secondaire - 5ème", edition: "Les Classiques Ivoiriens", price: 3800, type: "Manuel scolaire" },
  { name: "Physique-Chimie 5ème Elite", subject: "Physique-Chimie", level: "Secondaire - 5ème", edition: "NEI/CEDA", price: 3800, type: "Manuel scolaire" },
  { name: "SVT 5ème", subject: "SVT", level: "Secondaire - 5ème", edition: "Les Classiques Ivoiriens", price: 3800, type: "Manuel scolaire" },
  { name: "Sciences de la Vie et de la Terre 5ème", subject: "SVT", level: "Secondaire - 5ème", edition: "JD Editions", price: 3800, type: "Manuel scolaire" },
  { name: "L'affaire du Silure", subject: "Lecture", level: "Secondaire - 5ème", edition: "CEDA", author: "G. Menga", price: 2000, type: "Œuvre intégrale" },
  { name: "Le retour de l'enfant soldat", subject: "Lecture", level: "Secondaire - 5ème", edition: "VALLESSE", author: "François d'Assise N'DAH", price: 2200, type: "Œuvre intégrale" },
  { name: "Cinq contes", subject: "Lecture", level: "Secondaire - 5ème", edition: "Hachette", author: "G. De Maupassant", price: 2500, type: "Œuvre intégrale" },

  // ===== SECONDAIRE 4ème =====
  { name: "English for all 4ème", subject: "Anglais", level: "Secondaire - 4ème", edition: "EBURNIE", price: 4000, type: "Manuel scolaire" },
  { name: "Win Skills - student's book 4ème", subject: "Anglais", level: "Secondaire - 4ème", edition: "JD Editions", price: 4000, type: "Manuel scolaire" },
  { name: "GO For English 4ème", subject: "Anglais", level: "Secondaire - 4ème", edition: "NEI/EDICEF", price: 4500, type: "Manuel scolaire" },
  { name: "EDHC 4ème Manuel", subject: "EDHC", level: "Secondaire - 4ème", edition: "Sud Editions", price: 3500, type: "Manuel scolaire" },
  { name: "Mon livre d'EDHC 4ème", subject: "EDHC", level: "Secondaire - 4ème", edition: "JD Editions", price: 3500, type: "Manuel scolaire" },
  { name: "Horizontes 4ème", subject: "Espagnol", level: "Secondaire - 4ème", edition: "NEI/EDICEF", price: 4000, type: "Manuel scolaire" },
  { name: "Ya estamos 4ème", subject: "Espagnol", level: "Secondaire - 4ème", edition: "NEI/CEDA", price: 4000, type: "Manuel scolaire" },
  { name: "Français 4ème Elite", subject: "Français", level: "Secondaire - 4ème", edition: "NEI/CEDA", price: 4200, type: "Manuel scolaire" },
  { name: "4ème Français", subject: "Français", level: "Secondaire - 4ème", edition: "NEI/CEDA", price: 4200, type: "Manuel scolaire" },
  { name: "Mon livre de Français 4ème", subject: "Français", level: "Secondaire - 4ème", edition: "SuperNova", price: 4000, type: "Manuel scolaire" },
  { name: "Mathématiques 4ème CIAM", subject: "Mathématiques", level: "Secondaire - 4ème", edition: "NEI/EDICEF", price: 4800, type: "Manuel scolaire" },
  { name: "4ème Mathématiques", subject: "Mathématiques", level: "Secondaire - 4ème", edition: "NEI/CEDA", price: 4500, type: "Manuel scolaire" },
  { name: "Mon livre de mathématiques 4ème", subject: "Mathématiques", level: "Secondaire - 4ème", edition: "JD Editions", price: 4200, type: "Manuel scolaire" },
  { name: "Histoire-Géographie 4ème", subject: "Histoire-Géographie", level: "Secondaire - 4ème", edition: "Vallesse", price: 4000, type: "Manuel scolaire" },
  { name: "Physique-Chimie 4ème", subject: "Physique-Chimie", level: "Secondaire - 4ème", edition: "NEI/CEDA", price: 4200, type: "Manuel scolaire" },
  { name: "SVT 4ème", subject: "SVT", level: "Secondaire - 4ème", edition: "Les Classiques Ivoiriens", price: 4200, type: "Manuel scolaire" },
  { name: "Les Frasques d'Ebinto", subject: "Lecture", level: "Secondaire - 4ème", edition: "CEDA", author: "A. Koné", price: 2200, type: "Œuvre intégrale" },
  { name: "Le Petit prince", subject: "Lecture", level: "Secondaire - 4ème", edition: "Gallimard Folio J.", author: "A. De Saint-Exupéry", price: 3000, type: "Œuvre intégrale" },
  { name: "Le CID", subject: "Lecture", level: "Secondaire - 4ème", edition: "Hachette", author: "Corneille", price: 2800, type: "Œuvre intégrale" },
  { name: "Cri de douleur", subject: "Lecture", level: "Secondaire - 4ème", edition: "NEI", author: "Claire PORQUET", price: 2200, type: "Œuvre intégrale" },

  // ===== SECONDAIRE 3ème =====
  { name: "English for all 3ème", subject: "Anglais", level: "Secondaire - 3ème", edition: "EBURNIE", price: 4500, type: "Manuel scolaire" },
  { name: "Win Skills - student's book 3ème", subject: "Anglais", level: "Secondaire - 3ème", edition: "JD Editions", price: 4500, type: "Manuel scolaire" },
  { name: "EDHC 3ème", subject: "EDHC", level: "Secondaire - 3ème", edition: "Sud Editions", price: 3500, type: "Manuel scolaire" },
  { name: "Mon livre d'EDHC 3ème", subject: "EDHC", level: "Secondaire - 3ème", edition: "JD Editions", price: 3500, type: "Manuel scolaire" },
  { name: "Français 3ème", subject: "Français", level: "Secondaire - 3ème", edition: "NEI/CEDA", price: 4500, type: "Manuel scolaire" },
  { name: "Mon livre de Français 3ème", subject: "Français", level: "Secondaire - 3ème", edition: "SuperNova", price: 4200, type: "Manuel scolaire" },
  { name: "Mathématiques 3ème", subject: "Mathématiques", level: "Secondaire - 3ème", edition: "NEI/CEDA", price: 5000, type: "Manuel scolaire" },
  { name: "Mathématiques 3ème CIAM", subject: "Mathématiques", level: "Secondaire - 3ème", edition: "NEI/EDICEF", price: 5200, type: "Manuel scolaire" },
  { name: "Mon Livre de Mathématiques 3ème", subject: "Mathématiques", level: "Secondaire - 3ème", edition: "JD Editions", price: 4800, type: "Manuel scolaire" },
  { name: "Histoire-Géographie 3ème", subject: "Histoire-Géographie", level: "Secondaire - 3ème", edition: "Vallesse", price: 4500, type: "Manuel scolaire" },
  { name: "Physique-Chimie 3ème", subject: "Physique-Chimie", level: "Secondaire - 3ème", edition: "NEI/CEDA", price: 4500, type: "Manuel scolaire" },
  { name: "SVT 3ème", subject: "SVT", level: "Secondaire - 3ème", edition: "Les Classiques Ivoiriens", price: 4500, type: "Manuel scolaire" },
  { name: "Le monde s'effondre", subject: "Lecture", level: "Secondaire - 3ème", edition: "Présence Africaine", author: "Chinua Achébé", price: 2800, type: "Œuvre intégrale" },
  { name: "L'enfant noir", subject: "Lecture", level: "Secondaire - 3ème", edition: "Plon", author: "Camara Laye", price: 2800, type: "Œuvre intégrale" },

  // ===== SECONDAIRE 2nde =====
  { name: "Far Ahead 2nde", subject: "Anglais", level: "Secondaire - 2nde", edition: "NEI/CEDA", price: 5000, type: "Manuel scolaire" },
  { name: "GO For English 2nde", subject: "Anglais", level: "Secondaire - 2nde", edition: "NEI/EDICEF", price: 5200, type: "Manuel scolaire" },
  { name: "Win Skills 2nde", subject: "Anglais", level: "Secondaire - 2nde", edition: "JD Editions", price: 5000, type: "Manuel scolaire" },
  { name: "Horizontes 2nde", subject: "Espagnol", level: "Secondaire - 2nde", edition: "NEI/EDICEF", price: 5000, type: "Manuel scolaire" },
  { name: "Mathématiques 2nde A", subject: "Mathématiques", level: "Secondaire - 2nde A", edition: "NEI/CEDA", price: 5500, type: "Manuel scolaire" },
  { name: "Mathématiques 2nde C", subject: "Mathématiques", level: "Secondaire - 2nde C", edition: "NEI/CEDA", price: 6000, type: "Manuel scolaire" },
  { name: "Mon livre de Mathématiques 2nde A", subject: "Mathématiques", level: "Secondaire - 2nde A", edition: "JD Editions", price: 5200, type: "Manuel scolaire" },
  { name: "Mon livre de Mathématiques 2nde C", subject: "Mathématiques", level: "Secondaire - 2nde C", edition: "JD Editions", price: 5500, type: "Manuel scolaire" },
  { name: "Physique-Chimie 2nde A", subject: "Physique-Chimie", level: "Secondaire - 2nde A", edition: "NEI/CEDA", price: 5000, type: "Manuel scolaire" },
  { name: "Physique-Chimie 2nde C", subject: "Physique-Chimie", level: "Secondaire - 2nde C", edition: "NEI/CEDA", price: 5500, type: "Manuel scolaire" },
  { name: "Manuel SVT 2nde C", subject: "SVT", level: "Secondaire - 2nde C", edition: "Les Classiques Ivoiriens", price: 5000, type: "Manuel scolaire" },

  // ===== SECONDAIRE 1ère =====
  { name: "Far Ahead 1ère", subject: "Anglais", level: "Secondaire - 1ère", edition: "NEI/CEDA", price: 5500, type: "Manuel scolaire" },
  { name: "GO For English 1ère", subject: "Anglais", level: "Secondaire - 1ère", edition: "NEI/EDICEF", price: 5500, type: "Manuel scolaire" },
  { name: "Win Skills 1ère", subject: "Anglais", level: "Secondaire - 1ère", edition: "JD Editions", price: 5200, type: "Manuel scolaire" },
  { name: "Mas alla ! 1ère", subject: "Espagnol", level: "Secondaire - 1ère", edition: "NEI/EDICEF", price: 5000, type: "Manuel scolaire" },
  { name: "Le Français en Première et en Terminale", subject: "Français", level: "Secondaire - 1ère", edition: "EDICEF", price: 5500, type: "Manuel scolaire" },
  { name: "Mon livre de mathématiques 1ère A", subject: "Mathématiques", level: "Secondaire - 1ère A", edition: "JD Editions", price: 5800, type: "Manuel scolaire" },
  { name: "Mon livre de mathématiques 1ère C Tome 1", subject: "Mathématiques", level: "Secondaire - 1ère C", edition: "JD Editions", price: 6000, type: "Manuel scolaire" },
  { name: "Mon livre de mathématiques 1ère C Tome 2", subject: "Mathématiques", level: "Secondaire - 1ère C", edition: "JD Editions", price: 6000, type: "Manuel scolaire" },
  { name: "Mon livre de mathématiques 1ère D", subject: "Mathématiques", level: "Secondaire - 1ère D", edition: "JD Editions", price: 5800, type: "Manuel scolaire" },
  { name: "Mathématiques 1ère SM (Livre Unique) CIAM", subject: "Mathématiques", level: "Secondaire - 1ère C", edition: "NEI/EDICEF", price: 6500, type: "Manuel scolaire" },
  { name: "Philosophie 1ère", subject: "Philosophie", level: "Secondaire - 1ère", edition: "Vallesse", price: 4500, type: "Manuel scolaire" },
  { name: "Physique-Chimie 1ère C et D AREX", subject: "Physique-Chimie", level: "Secondaire - 1ère C/D", edition: "Classiques Africains", price: 5500, type: "Manuel scolaire" },
  { name: "Chants d'Ombre", subject: "Lecture", level: "Secondaire - 1ère", edition: "NEI/CEDA", author: "L.S. Senghor", price: 3000, type: "Œuvre intégrale" },
  { name: "La ronde des jours", subject: "Lecture", level: "Secondaire - 1ère", edition: "Le Seuil", author: "B. Dadié", price: 3000, type: "Œuvre intégrale" },
  { name: "Antigone", subject: "Lecture", level: "Secondaire - 1ère", edition: "BORDAS", author: "J. Anouilh", price: 3200, type: "Œuvre intégrale" },

  // ===== TERMINALE =====
  { name: "GO For English Terminale", subject: "Anglais", level: "Secondaire - Terminale", edition: "NEI/EDICEF", price: 5800, type: "Manuel scolaire" },
  { name: "Far Ahead Terminale", subject: "Anglais", level: "Secondaire - Terminale", edition: "NEI/CEDA", price: 5800, type: "Manuel scolaire" },
  { name: "Mas alla ! Tle", subject: "Espagnol", level: "Secondaire - Terminale", edition: "NEI/CEDA", price: 5500, type: "Manuel scolaire" },
  { name: "Le Français en Terminale", subject: "Français", level: "Secondaire - Terminale", edition: "EDICEF", price: 5800, type: "Manuel scolaire" },
  { name: "Mathématiques Terminale A CIAM", subject: "Mathématiques", level: "Secondaire - Terminale A", edition: "EDICEF", price: 6000, type: "Manuel scolaire" },
  { name: "Mon livre de Mathématiques Tle A", subject: "Mathématiques", level: "Secondaire - Terminale A", edition: "JD Editions", price: 5800, type: "Manuel scolaire" },
  { name: "Mon livre de mathématiques Tle C Tome 1", subject: "Mathématiques", level: "Secondaire - Terminale C", edition: "JD Editions", price: 6500, type: "Manuel scolaire" },
  { name: "Mon livre de mathématiques Tle C Tome 2", subject: "Mathématiques", level: "Secondaire - Terminale C", edition: "JD Editions", price: 6500, type: "Manuel scolaire" },
  { name: "Mathématiques Terminale SM CIAM", subject: "Mathématiques", level: "Secondaire - Terminale C", edition: "EDICEF", price: 7000, type: "Manuel scolaire" },
  { name: "Mathématiques Tle D", subject: "Mathématiques", level: "Secondaire - Terminale D", edition: "Super Nova", price: 6000, type: "Manuel scolaire" },
  { name: "Mathématiques Terminale SE CIAM", subject: "Mathématiques", level: "Secondaire - Terminale D", edition: "NEI/EDICEF", price: 6500, type: "Manuel scolaire" },
  { name: "Philosophie Terminales A et B Tomes 1 et 2", subject: "Philosophie", level: "Secondaire - Terminale", edition: "HATIER", price: 5500, type: "Manuel scolaire" },
  { name: "Manuel de philosophie Terminales", subject: "Philosophie", level: "Secondaire - Terminale", edition: "Sud Editions", price: 5000, type: "Manuel scolaire" },
  { name: "Physique Terminales C et D AREX", subject: "Physique-Chimie", level: "Secondaire - Terminale C/D", edition: "Classiques Africains", price: 6000, type: "Manuel scolaire" },
  { name: "Chimie Terminales C et D AREX", subject: "Physique-Chimie", level: "Secondaire - Terminale C/D", edition: "Classiques Africains", price: 6000, type: "Manuel scolaire" },
  { name: "L'aventure ambiguë", subject: "Lecture", level: "Secondaire - Terminale", edition: "Editions 10/18", author: "C.H. Kane", price: 3500, type: "Œuvre intégrale" },
  { name: "Les Soleils des indépendances", subject: "Lecture", level: "Secondaire - Terminale", edition: "Editions du Seuil", author: "A. Kourouma", price: 3500, type: "Œuvre intégrale" },
  { name: "Cahier d'un retour au pays natal", subject: "Lecture", level: "Secondaire - Terminale", edition: "Présence africaine", author: "A. Césaire", price: 3200, type: "Œuvre intégrale" },
  { name: "L'étranger", subject: "Lecture", level: "Secondaire - Terminale", edition: "Gallimard folio", author: "A. Camus", price: 3500, type: "Œuvre intégrale" },
  { name: "Les Fleurs du mal", subject: "Lecture", level: "Secondaire - Terminale", edition: "Livre de Poche", author: "Baudelaire", price: 3200, type: "Œuvre intégrale" },
];

// Generate description based on product data
function generateDescription(book: typeof TEXTBOOKS[0], lang: 'fr' | 'en' | 'de' | 'es'): string {
  const descs = {
    fr: `${book.name} - Manuel officiel agréé par le Ministère de l'Éducation Nationale de Côte d'Ivoire pour l'année scolaire 2023-2024. Niveau : ${book.level}. Matière : ${book.subject}. Édition : ${book.edition}.${book.author ? ` Auteur : ${book.author}.` : ''} Ce ${book.type === 'Œuvre intégrale' ? 'livre de lecture' : 'manuel scolaire'} est conforme au programme officiel ivoirien et constitue un outil pédagogique essentiel pour la réussite scolaire.`,
    en: `${book.name} - Official textbook approved by the Ministry of National Education of Côte d'Ivoire for the 2023-2024 school year. Level: ${book.level}. Subject: ${book.subject}. Publisher: ${book.edition}.${book.author ? ` Author: ${book.author}.` : ''} This ${book.type === 'Œuvre intégrale' ? 'reading book' : 'textbook'} complies with the official Ivorian curriculum.`,
    de: `${book.name} - Offizielles Schulbuch, genehmigt vom Bildungsministerium der Elfenbeinküste für das Schuljahr 2023-2024. Stufe: ${book.level}. Fach: ${book.subject}. Verlag: ${book.edition}.${book.author ? ` Autor: ${book.author}.` : ''}`,
    es: `${book.name} - Manual escolar oficial aprobado por el Ministerio de Educación Nacional de Costa de Marfil para el año escolar 2023-2024. Nivel: ${book.level}. Asignatura: ${book.subject}. Editorial: ${book.edition}.${book.author ? ` Autor: ${book.author}.` : ''}`,
  };
  return descs[lang];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verify admin token
    const { token } = await req.json();
    const BOOTSTRAP_TOKEN = Deno.env.get('BOOTSTRAP_ADMIN_TOKEN');
    if (!BOOTSTRAP_TOKEN || token !== BOOTSTRAP_TOKEN) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Seeding ${TEXTBOOKS.length} products...`);

    // Ensure categories exist
    const categoryMap: Record<string, string> = {};
    const categoryNames = [
      { fr: 'Manuels Préscolaire', en: 'Preschool Textbooks', de: 'Vorschulbücher', es: 'Libros Preescolar', slug: 'manuels-prescolaire' },
      { fr: 'Manuels Primaire', en: 'Primary Textbooks', de: 'Grundschulbücher', es: 'Libros Primaria', slug: 'manuels-primaire' },
      { fr: 'Manuels Secondaire 1er Cycle', en: 'Secondary 1st Cycle', de: 'Sekundarstufe 1', es: 'Secundaria 1er Ciclo', slug: 'manuels-secondaire-1' },
      { fr: 'Manuels Secondaire 2nd Cycle', en: 'Secondary 2nd Cycle', de: 'Sekundarstufe 2', es: 'Secundaria 2do Ciclo', slug: 'manuels-secondaire-2' },
      { fr: 'Œuvres Intégrales', en: 'Full Works / Novels', de: 'Gesamtwerke', es: 'Obras Completas', slug: 'oeuvres-integrales' },
    ];

    for (const cat of categoryNames) {
      const { data: existing } = await supabase.from('categories').select('id').eq('slug', cat.slug).single();
      if (existing) {
        categoryMap[cat.slug] = existing.id;
      } else {
        const { data: created, error } = await supabase.from('categories').insert({
          name_fr: cat.fr, name_en: cat.en, name_de: cat.de, name_es: cat.es, slug: cat.slug,
        }).select('id').single();
        if (created) categoryMap[cat.slug] = created.id;
        if (error) console.error('Category error:', error);
      }
    }

    function getCategoryId(level: string, type: string): string | null {
      if (type === 'Œuvre intégrale') return categoryMap['oeuvres-integrales'] || null;
      if (level.startsWith('Préscolaire')) return categoryMap['manuels-prescolaire'] || null;
      if (level.startsWith('Primaire')) return categoryMap['manuels-primaire'] || null;
      if (level.includes('6ème') || level.includes('5ème') || level.includes('4ème') || level.includes('3ème'))
        return categoryMap['manuels-secondaire-1'] || null;
      return categoryMap['manuels-secondaire-2'] || null;
    }

    // Insert products in batches
    const batchSize = 20;
    let inserted = 0;
    let skipped = 0;

    for (let i = 0; i < TEXTBOOKS.length; i += batchSize) {
      const batch = TEXTBOOKS.slice(i, i + batchSize);
      const products = batch.map(book => ({
        name_fr: book.name,
        name_en: book.name,
        name_de: book.name,
        name_es: book.name,
        description_fr: generateDescription(book, 'fr'),
        description_en: generateDescription(book, 'en'),
        description_de: generateDescription(book, 'de'),
        description_es: generateDescription(book, 'es'),
        price: book.price,
        original_price: Math.round(book.price * 1.15),
        discount_percent: 13,
        stock: Math.floor(Math.random() * 50) + 10,
        is_active: true,
        is_featured: Math.random() > 0.7,
        free_shipping: book.price > 3000,
        product_type: book.type,
        product_genre: 'Livre',
        subject: book.subject,
        education_level: book.level,
        brand: book.edition,
        author_name: book.author || null,
        category_id: getCategoryId(book.level, book.type),
        image_url: `https://placehold.co/400x560/1a365d/ffffff?text=${encodeURIComponent(book.name.substring(0, 20))}`,
      }));

      const { data, error } = await supabase.from('products').insert(products).select('id');
      if (error) {
        console.error(`Batch ${i / batchSize + 1} error:`, error);
        skipped += batch.length;
      } else {
        inserted += data?.length || 0;
      }
    }

    console.log(`Seeding complete: ${inserted} inserted, ${skipped} skipped`);

    return new Response(JSON.stringify({
      success: true,
      message: `${inserted} produits créés avec succès, ${skipped} ignorés`,
      total: TEXTBOOKS.length,
      inserted,
      skipped,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Seed error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
