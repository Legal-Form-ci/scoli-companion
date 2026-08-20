/** Villes de Côte d'Ivoire → région (source unique pour les formulaires de livraison). */
export const CITY_REGION: Record<string, string> = {
  Abidjan: "Abidjan",
  Cocody: "Abidjan",
  Plateau: "Abidjan",
  Yopougon: "Abidjan",
  Marcory: "Abidjan",
  Koumassi: "Abidjan",
  Treichville: "Abidjan",
  Adjamé: "Abidjan",
  Abobo: "Abidjan",
  "Port-Bouët": "Abidjan",
  Bingerville: "Abidjan",
  Anyama: "Abidjan",
  Songon: "Abidjan",
  "San-Pédro": "Bas-Sassandra",
  Soubré: "Bas-Sassandra",
  Tabou: "Bas-Sassandra",
  Sassandra: "Bas-Sassandra",
  Abengourou: "Comoé",
  Agnibilékrou: "Comoé",
  Aboisso: "Comoé",
  Odienné: "Denguélé",
  Gagnoa: "Gôh-Djiboua",
  Divo: "Gôh-Djiboua",
  Lakota: "Gôh-Djiboua",
  Dimbokro: "Lacs",
  Toumodi: "Lacs",
  Dabou: "Lagunes",
  "Grand-Lahou": "Lagunes",
  Jacqueville: "Lagunes",
  Tiassalé: "Lagunes",
  Man: "Montagnes",
  Danané: "Montagnes",
  Duékoué: "Montagnes",
  Guiglo: "Montagnes",
  Daloa: "Sassandra-Marahoué",
  Vavoua: "Sassandra-Marahoué",
  Issia: "Sassandra-Marahoué",
  Zuénoula: "Sassandra-Marahoué",
  Korhogo: "Savanes",
  Boundiali: "Savanes",
  Ferkessédougou: "Savanes",
  Tengrela: "Savanes",
  Bouaké: "Vallée du Bandama",
  Béoumi: "Vallée du Bandama",
  Katiola: "Vallée du Bandama",
  Dabakala: "Vallée du Bandama",
  Séguéla: "Woroba",
  Mankono: "Woroba",
  Touba: "Woroba",
  Yamoussoukro: "Yamoussoukro",
  Bondoukou: "Zanzan",
  Bouna: "Zanzan",
  Tanda: "Zanzan",
};

export const CITIES = Object.keys(CITY_REGION).sort((a, b) => a.localeCompare(b, "fr"));

export const REGIONS = Array.from(new Set(Object.values(CITY_REGION))).sort((a, b) =>
  a.localeCompare(b, "fr"),
);

/** Déduit la région à partir d'une ville (insensible à la casse / accents partiels). */
export const regionForCity = (city: string): string => {
  if (!city) return "";
  const direct = CITY_REGION[city];
  if (direct) return direct;
  const norm = (s: string) =>
    s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  const found = Object.keys(CITY_REGION).find((c) => norm(c) === norm(city));
  return found ? CITY_REGION[found] : "";
};
