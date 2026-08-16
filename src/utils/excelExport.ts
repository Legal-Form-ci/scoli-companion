interface TableData {
  [tableName: string]: any[];
}

interface ExportOptions {
  includeMetadata?: boolean;
  includeSchema?: boolean;
  dateFormat?: string;
}

// Column display names for better readability
const COLUMN_LABELS: Record<string, Record<string, string>> = {
  users: {
    id: 'ID',
    first_name: 'Prénom',
    last_name: 'Nom',
    email: 'Email',
    created_at: 'Date création',
  },
  loyalty_rewards: {
    id: 'ID Récompense',
    user_id: 'ID Utilisateur',
    reward_type: 'Type de Récompense',
    points_spent: 'Points dépensés',
    coupon_code: 'Code Coupon',
    created_at: 'Date création',
  },
  vendor_settings: {
    id: 'ID Vendeur',
    user_id: 'ID Utilisateur',
    store_name: 'Nom du magasin',
    store_description: 'Description du magasin',
    logo_url: 'Logo URL',
    banner_url: 'Banner URL',
    city: 'Ville',
    is_verified: 'Vérifié',
    created_at: 'Date création',
  },
  profiles: {
    id: 'ID Utilisateur',
    email: 'Email',
    first_name: 'Prénom',
    last_name: 'Nom',
    phone: 'Téléphone',
    avatar_url: 'Photo',
    preferred_language: 'Langue',
    created_at: 'Date création',
    updated_at: 'Dernière modification',
  },
  products: {
    id: 'ID Produit',
    name_fr: 'Nom (FR)',
    name_en: 'Nom (EN)',
    price: 'Prix (FCFA)',
    original_price: 'Prix original',
    discount_percent: 'Réduction (%)',
    stock: 'Stock',
    is_active: 'Actif',
    is_featured: 'En vedette',
    category_id: 'ID Catégorie',
    vendor_id: 'ID Vendeur',
    created_at: 'Date création',
  },
  orders: {
    id: 'N° Commande',
    user_id: 'ID Client',
    status: 'Statut',
    total_amount: 'Montant total (FCFA)',
    discount_amount: 'Réduction (FCFA)',
    payment_method: 'Mode paiement',
    shipping_address: 'Adresse livraison',
    phone: 'Téléphone',
    delivery_user_id: 'ID Livreur',
    created_at: 'Date commande',
    updated_at: 'Dernière modification',
  },
  user_roles: {
    id: 'ID',
    user_id: 'ID Utilisateur',
    role: 'Rôle',
  },
  articles: {
    id: 'ID Article',
    title_fr: 'Titre (FR)',
    title_en: 'Titre (EN)',
    author_id: 'ID Auteur',
    category: 'Catégorie',
    status: 'Statut',
    views: 'Vues',
    likes: 'Likes',
    is_premium: 'Premium',
    price: 'Prix',
    created_at: 'Date création',
    published_at: 'Date publication',
  },
  categories: {
    id: 'ID',
    name_fr: 'Nom (FR)',
    name_en: 'Nom (EN)',
    slug: 'Slug',
    parent_id: 'ID Parent',
    created_at: 'Date création',
  },
  payments: {
    id: 'ID Paiement',
    order_id: 'N° Commande',
    user_id: 'ID Client',
    amount: 'Montant (FCFA)',
    payment_method: 'Mode paiement',
    status: 'Statut',
    transaction_id: 'ID Transaction',
    created_at: 'Date',
    completed_at: 'Date finalisation',
  },
  notifications: {
    id: 'ID',
    user_id: 'ID Utilisateur',
    type: 'Type',
    title: 'Titre',
    message: 'Message',
    is_read: 'Lu',
    created_at: 'Date',
  },
};

// Status translations
const STATUS_TRANSLATIONS: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
  published: 'Publié',
  draft: 'Brouillon',
  rejected: 'Rejeté',
  completed: 'Terminé',
  failed: 'Échoué',
  active: 'Actif',
  inactive: 'Inactif',
};

// Role translations  
const ROLE_TRANSLATIONS: Record<string, string> = {
  admin: 'Administrateur',
  moderator: 'Modérateur',
  vendor: 'Vendeur',
  delivery: 'Livreur',
  user: 'Utilisateur',
};

function formatValue(value: any, columnName: string): any {
  if (value === null || value === undefined) return '';
  
  if (typeof value === 'boolean') {
    return value ? 'Oui' : 'Non';
  }
  
  if (columnName.includes('_at') || columnName.includes('date')) {
    try {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toLocaleString('fr-FR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        });
      }
    } catch {
      return value;
    }
  }
  
  if (columnName === 'status') {
    return STATUS_TRANSLATIONS[value] || value;
  }
  
  if (columnName === 'role') {
    return ROLE_TRANSLATIONS[value] || value;
  }
  
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  
  if (columnName.includes('amount') || columnName.includes('price') || columnName === 'total_sales') {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      return num.toLocaleString('fr-FR') + ' FCFA';
    }
  }
  
  return value;
}

function getColumnLabel(tableName: string, columnName: string): string {
  return COLUMN_LABELS[tableName]?.[columnName] || columnName;
}

// Escape CSV cell value
function escapeCsvCell(value: any): string {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

// Convert table data to CSV string
function tableToCsv(tableName: string, tableData: any[]): string {
  if (!tableData || tableData.length === 0) {
    return `Table: ${tableName}\nAucune donnée\n`;
  }

  const columns = Object.keys(tableData[0]);
  const headerRow = columns.map(col => escapeCsvCell(getColumnLabel(tableName, col)));
  const dataRows = tableData.map(row =>
    columns.map(col => escapeCsvCell(formatValue(row[col], col)))
  );

  return [headerRow.join(','), ...dataRows.map(r => r.join(','))].join('\n');
}

export function exportToExcel(
  data: TableData, 
  filename: string = 'export',
  options: ExportOptions = {}
): void {
  // Build a single CSV with all tables separated by headers
  const sections: string[] = [];

  if (options.includeMetadata !== false) {
    sections.push('SCOLY - Export Base de Données');
    sections.push(`Date d'export: ${new Date().toLocaleString('fr-FR')}`);
    sections.push(`Tables exportées: ${Object.keys(data).length}`);
    sections.push(`Total enregistrements: ${Object.values(data).reduce((a, t) => a + t.length, 0)}`);
    sections.push('');
  }

  Object.entries(data).forEach(([tableName, tableData]) => {
    sections.push(`=== ${tableName} (${tableData.length} enregistrements) ===`);
    sections.push(tableToCsv(tableName, tableData));
    sections.push('');
  });

  const csvContent = sections.join('\n');
  // BOM for Excel UTF-8 compatibility
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportTableToExcel(
  tableName: string,
  tableData: any[],
  filename?: string
): void {
  exportToExcel(
    { [tableName]: tableData },
    filename || `${tableName}-export`,
    { includeMetadata: false }
  );
}
