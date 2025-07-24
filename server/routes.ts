import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { emailScheduler } from "./services/scheduler";
import { insertClientSchema, insertEmailTemplateSchema, insertScheduledEmailSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Start email scheduler
  emailScheduler.start();

  // Analytics
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getEmailStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Clients
  app.get("/api/clients", async (req, res) => {
    try {
      const clients = await storage.getClients();
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.get("/api/clients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const client = await storage.getClient(id);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch client" });
    }
  });

  app.post("/api/clients", async (req, res) => {
    try {
      const validatedData = insertClientSchema.parse(req.body);
      const client = await storage.createClient(validatedData);
      res.status(201).json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid client data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create client" });
    }
  });

  app.put("/api/clients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertClientSchema.partial().parse(req.body);
      const client = await storage.updateClient(id, validatedData);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid client data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update client" });
    }
  });

  app.delete("/api/clients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteClient(id);
      if (!success) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete client" });
    }
  });

  // Email Templates
  app.get("/api/templates", async (req, res) => {
    try {
      const templates = await storage.getEmailTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  app.get("/api/templates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const template = await storage.getEmailTemplate(id);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch template" });
    }
  });

  app.post("/api/templates", async (req, res) => {
    try {
      const validatedData = insertEmailTemplateSchema.parse(req.body);
      const template = await storage.createEmailTemplate(validatedData);
      res.status(201).json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid template data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create template" });
    }
  });

  app.put("/api/templates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertEmailTemplateSchema.partial().parse(req.body);
      const template = await storage.updateEmailTemplate(id, validatedData);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid template data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update template" });
    }
  });

  app.delete("/api/templates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteEmailTemplate(id);
      if (!success) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete template" });
    }
  });

  // Scheduled Emails
  app.get("/api/scheduled-emails", async (req, res) => {
    try {
      const scheduledEmails = await storage.getScheduledEmails();
      res.json(scheduledEmails);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch scheduled emails" });
    }
  });

  const scheduleEmailSchema = z.object({
    clientId: z.number(),
    templateId: z.number(),
    delay: z.enum(['immediate', '1day', '1week', '1month']),
    language: z.string().optional(),
  });

  app.post("/api/schedule-email", async (req, res) => {
    try {
      const { clientId, templateId, delay, language } = scheduleEmailSchema.parse(req.body);
      const scheduledEmail = await emailScheduler.scheduleEmail(clientId, templateId, delay, language);
      res.status(201).json(scheduledEmail);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid schedule data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to schedule email" });
    }
  });

  app.put("/api/scheduled-emails/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateSchema = z.object({
        scheduledFor: z.string().optional(),
        status: z.enum(['pending', 'sent', 'failed', 'cancelled']).optional(),
      });
      const validatedData = updateSchema.parse(req.body);
      
      const updateData: any = {};
      if (validatedData.scheduledFor) {
        updateData.scheduledFor = new Date(validatedData.scheduledFor);
      }
      if (validatedData.status) {
        updateData.status = validatedData.status;
      }

      const scheduledEmail = await storage.updateScheduledEmail(id, updateData);
      if (!scheduledEmail) {
        return res.status(404).json({ message: "Scheduled email not found" });
      }
      res.json(scheduledEmail);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid update data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update scheduled email" });
    }
  });

  app.delete("/api/scheduled-emails/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteScheduledEmail(id);
      if (!success) {
        return res.status(404).json({ message: "Scheduled email not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete scheduled email" });
    }
  });

  // Email Logs
  app.get("/api/email-logs", async (req, res) => {
    try {
      const logs = await storage.getEmailLogs();
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch email logs" });
    }
  });

  app.get("/api/email-logs/client/:clientId", async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const logs = await storage.getEmailLogsForClient(clientId);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch client email logs" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
