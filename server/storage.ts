import { 
  users, clients, emailTemplates, scheduledEmails, emailLogs,
  type User, type InsertUser, type Client, type InsertClient,
  type EmailTemplate, type InsertEmailTemplate, type ScheduledEmail, type InsertScheduledEmail,
  type EmailLog, type InsertEmailLog
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Clients
  getClients(): Promise<Client[]>;
  getClient(id: number): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: number): Promise<boolean>;

  // Email Templates
  getEmailTemplates(): Promise<EmailTemplate[]>;
  getEmailTemplate(id: number): Promise<EmailTemplate | undefined>;
  createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate>;
  updateEmailTemplate(id: number, template: Partial<InsertEmailTemplate>): Promise<EmailTemplate | undefined>;
  deleteEmailTemplate(id: number): Promise<boolean>;
  incrementTemplateUsage(id: number): Promise<void>;

  // Scheduled Emails
  getScheduledEmails(): Promise<ScheduledEmail[]>;
  getScheduledEmail(id: number): Promise<ScheduledEmail | undefined>;
  getPendingScheduledEmails(): Promise<ScheduledEmail[]>;
  createScheduledEmail(email: InsertScheduledEmail): Promise<ScheduledEmail>;
  updateScheduledEmail(id: number, email: Partial<ScheduledEmail>): Promise<ScheduledEmail | undefined>;
  deleteScheduledEmail(id: number): Promise<boolean>;

  // Email Logs
  getEmailLogs(): Promise<EmailLog[]>;
  getEmailLogsForClient(clientId: number): Promise<EmailLog[]>;
  createEmailLog(log: InsertEmailLog): Promise<EmailLog>;
  updateEmailLog(id: number, log: Partial<EmailLog>): Promise<EmailLog | undefined>;

  // Analytics
  getEmailStats(): Promise<{
    totalClients: number;
    emailsSent: number;
    openRate: number;
    pendingSends: number;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private clients: Map<number, Client>;
  private emailTemplates: Map<number, EmailTemplate>;
  private scheduledEmails: Map<number, ScheduledEmail>;
  private emailLogs: Map<number, EmailLog>;
  private currentUserId: number;
  private currentClientId: number;
  private currentTemplateId: number;
  private currentScheduledEmailId: number;
  private currentLogId: number;

  constructor() {
    this.users = new Map();
    this.clients = new Map();
    this.emailTemplates = new Map();
    this.scheduledEmails = new Map();
    this.emailLogs = new Map();
    this.currentUserId = 1;
    this.currentClientId = 1;
    this.currentTemplateId = 1;
    this.currentScheduledEmailId = 1;
    this.currentLogId = 1;
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Clients
  async getClients(): Promise<Client[]> {
    return Array.from(this.clients.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getClient(id: number): Promise<Client | undefined> {
    return this.clients.get(id);
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const id = this.currentClientId++;
    const client: Client = {
      ...insertClient,
      id,
      createdAt: new Date(),
      customFields: insertClient.customFields || {},
      company: insertClient.company || null,
      phone: insertClient.phone || null,
      lastInteraction: insertClient.lastInteraction || null,
    };
    this.clients.set(id, client);
    return client;
  }

  async updateClient(id: number, clientUpdate: Partial<InsertClient>): Promise<Client | undefined> {
    const existing = this.clients.get(id);
    if (!existing) return undefined;
    
    const updated: Client = { 
      ...existing, 
      ...clientUpdate,
      company: clientUpdate.company !== undefined ? clientUpdate.company : existing.company,
      phone: clientUpdate.phone !== undefined ? clientUpdate.phone : existing.phone,
    };
    this.clients.set(id, updated);
    return updated;
  }

  async deleteClient(id: number): Promise<boolean> {
    return this.clients.delete(id);
  }

  // Email Templates
  async getEmailTemplates(): Promise<EmailTemplate[]> {
    return Array.from(this.emailTemplates.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getEmailTemplate(id: number): Promise<EmailTemplate | undefined> {
    return this.emailTemplates.get(id);
  }

  async createEmailTemplate(insertTemplate: InsertEmailTemplate): Promise<EmailTemplate> {
    const id = this.currentTemplateId++;
    const template: EmailTemplate = {
      ...insertTemplate,
      id,
      createdAt: new Date(),
      usageCount: 0,
      variables: insertTemplate.variables || [],
      supportedLanguages: insertTemplate.supportedLanguages || ["en"],
      primaryLanguage: insertTemplate.primaryLanguage || "en",
    };
    this.emailTemplates.set(id, template);
    return template;
  }

  async updateEmailTemplate(id: number, templateUpdate: Partial<InsertEmailTemplate>): Promise<EmailTemplate | undefined> {
    const existing = this.emailTemplates.get(id);
    if (!existing) return undefined;
    
    const updated: EmailTemplate = { ...existing, ...templateUpdate };
    this.emailTemplates.set(id, updated);
    return updated;
  }

  async deleteEmailTemplate(id: number): Promise<boolean> {
    return this.emailTemplates.delete(id);
  }

  async incrementTemplateUsage(id: number): Promise<void> {
    const template = this.emailTemplates.get(id);
    if (template) {
      template.usageCount = (template.usageCount || 0) + 1;
      this.emailTemplates.set(id, template);
    }
  }

  // Scheduled Emails
  async getScheduledEmails(): Promise<ScheduledEmail[]> {
    return Array.from(this.scheduledEmails.values()).sort((a, b) => 
      new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime()
    );
  }

  async getScheduledEmail(id: number): Promise<ScheduledEmail | undefined> {
    return this.scheduledEmails.get(id);
  }

  async getPendingScheduledEmails(): Promise<ScheduledEmail[]> {
    return Array.from(this.scheduledEmails.values())
      .filter(email => email.status === 'pending' && new Date(email.scheduledFor) <= new Date())
      .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime());
  }

  async createScheduledEmail(insertEmail: InsertScheduledEmail): Promise<ScheduledEmail> {
    const id = this.currentScheduledEmailId++;
    const email: ScheduledEmail = {
      ...insertEmail,
      id,
      createdAt: new Date(),
      status: "pending",
      language: insertEmail.language || "en",
      sentAt: null,
      personalizedSubject: null,
      personalizedContent: null,
      errorMessage: null,
    };
    this.scheduledEmails.set(id, email);
    return email;
  }

  async updateScheduledEmail(id: number, emailUpdate: Partial<ScheduledEmail>): Promise<ScheduledEmail | undefined> {
    const existing = this.scheduledEmails.get(id);
    if (!existing) return undefined;
    
    const updated: ScheduledEmail = { ...existing, ...emailUpdate };
    this.scheduledEmails.set(id, updated);
    return updated;
  }

  async deleteScheduledEmail(id: number): Promise<boolean> {
    return this.scheduledEmails.delete(id);
  }

  // Email Logs
  async getEmailLogs(): Promise<EmailLog[]> {
    return Array.from(this.emailLogs.values()).sort((a, b) => 
      new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
    );
  }

  async getEmailLogsForClient(clientId: number): Promise<EmailLog[]> {
    return Array.from(this.emailLogs.values())
      .filter(log => log.clientId === clientId)
      .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
  }

  async createEmailLog(insertLog: InsertEmailLog): Promise<EmailLog> {
    const id = this.currentLogId++;
    const log: EmailLog = {
      ...insertLog,
      id,
      sentAt: new Date(),
      templateId: insertLog.templateId || null,
      scheduledEmailId: insertLog.scheduledEmailId || null,
      deliveredAt: null,
      openedAt: null,
      errorMessage: insertLog.errorMessage || null,
    };
    this.emailLogs.set(id, log);
    return log;
  }

  async updateEmailLog(id: number, logUpdate: Partial<EmailLog>): Promise<EmailLog | undefined> {
    const existing = this.emailLogs.get(id);
    if (!existing) return undefined;
    
    const updated: EmailLog = { ...existing, ...logUpdate };
    this.emailLogs.set(id, updated);
    return updated;
  }

  // Analytics
  async getEmailStats(): Promise<{
    totalClients: number;
    emailsSent: number;
    openRate: number;
    pendingSends: number;
  }> {
    const totalClients = this.clients.size;
    const emailLogs = Array.from(this.emailLogs.values());
    const emailsSent = emailLogs.filter(log => log.status === 'sent' || log.status === 'delivered' || log.status === 'opened').length;
    const openedEmails = emailLogs.filter(log => log.status === 'opened').length;
    const openRate = emailsSent > 0 ? (openedEmails / emailsSent) * 100 : 0;
    const pendingSends = Array.from(this.scheduledEmails.values()).filter(email => email.status === 'pending').length;

    return {
      totalClients,
      emailsSent,
      openRate: Math.round(openRate * 10) / 10,
      pendingSends,
    };
  }
}

export const storage = new MemStorage();
