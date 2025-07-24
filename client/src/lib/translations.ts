export const languages = {
  en: { name: 'English', flag: '🇺🇸' },
  es: { name: 'Español', flag: '🇪🇸' },
  fr: { name: 'Français', flag: '🇫🇷' },
};

export const translations = {
  en: {
    dashboard: 'Dashboard',
    clients: 'Clients',
    emailTemplates: 'Email Templates',
    automation: 'Automation',
    analytics: 'Analytics',
    totalClients: 'Total Clients',
    emailsSent: 'Emails Sent',
    openRate: 'Open Rate',
    pendingSends: 'Pending Sends',
    newEmail: 'New Email',
    addNewClient: 'Add New Client',
    createTemplate: 'Create Template',
    setupAutomation: 'Setup Automation',
    recentActivity: 'Recent Activity',
    upcomingScheduledEmails: 'Upcoming Scheduled Emails',
    manageTemplates: 'Manage Templates',
    viewAllActivity: 'View All',
    viewFullSchedule: 'View Full Schedule',
  },
  es: {
    dashboard: 'Panel de Control',
    clients: 'Clientes',
    emailTemplates: 'Plantillas de Email',
    automation: 'Automatización',
    analytics: 'Analítica',
    totalClients: 'Total de Clientes',
    emailsSent: 'Emails Enviados',
    openRate: 'Tasa de Apertura',
    pendingSends: 'Envíos Pendientes',
    newEmail: 'Nuevo Email',
    addNewClient: 'Agregar Nuevo Cliente',
    createTemplate: 'Crear Plantilla',
    setupAutomation: 'Configurar Automatización',
    recentActivity: 'Actividad Reciente',
    upcomingScheduledEmails: 'Emails Programados',
    manageTemplates: 'Gestionar Plantillas',
    viewAllActivity: 'Ver Todo',
    viewFullSchedule: 'Ver Calendario Completo',
  },
  fr: {
    dashboard: 'Tableau de Bord',
    clients: 'Clients',
    emailTemplates: 'Modèles d\'Email',
    automation: 'Automatisation',
    analytics: 'Analytique',
    totalClients: 'Total des Clients',
    emailsSent: 'Emails Envoyés',
    openRate: 'Taux d\'Ouverture',
    pendingSends: 'Envois en Attente',
    newEmail: 'Nouvel Email',
    addNewClient: 'Ajouter Nouveau Client',
    createTemplate: 'Créer un Modèle',
    setupAutomation: 'Configurer l\'Automatisation',
    recentActivity: 'Activité Récente',
    upcomingScheduledEmails: 'Emails Programmés',
    manageTemplates: 'Gérer les Modèles',
    viewAllActivity: 'Voir Tout',
    viewFullSchedule: 'Voir le Calendrier Complet',
  },
};

export type Language = keyof typeof languages;
export type TranslationKey = keyof typeof translations.en;

export function getTranslation(language: Language, key: TranslationKey): string {
  return translations[language][key] || translations.en[key];
}
