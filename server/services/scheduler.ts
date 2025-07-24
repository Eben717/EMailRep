import { storage } from '../storage';
import { sendEmail, personalizeContent } from './email';
import type { Client, EmailTemplate, ScheduledEmail } from '@shared/schema';

export class EmailScheduler {
  private intervalId: NodeJS.Timeout | null = null;

  start() {
    if (this.intervalId) return;
    
    // Check for pending emails every minute
    this.intervalId = setInterval(async () => {
      await this.processPendingEmails();
    }, 60000);
    
    console.log('Email scheduler started');
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Email scheduler stopped');
    }
  }

  private async processPendingEmails() {
    try {
      const pendingEmails = await storage.getPendingScheduledEmails();
      
      for (const scheduledEmail of pendingEmails) {
        await this.sendScheduledEmail(scheduledEmail);
      }
    } catch (error) {
      console.error('Error processing pending emails:', error);
    }
  }

  private async sendScheduledEmail(scheduledEmail: ScheduledEmail) {
    try {
      const client = await storage.getClient(scheduledEmail.clientId);
      const template = await storage.getEmailTemplate(scheduledEmail.templateId);
      
      if (!client || !template) {
        await storage.updateScheduledEmail(scheduledEmail.id, {
          status: 'failed',
          errorMessage: 'Client or template not found',
        });
        return;
      }

      const language = scheduledEmail.language || client.language || 'en';
      const subject = template.subject[language] || template.subject[template.primaryLanguage] || '';
      const content = template.content[language] || template.content[template.primaryLanguage] || '';

      if (!subject || !content) {
        await storage.updateScheduledEmail(scheduledEmail.id, {
          status: 'failed',
          errorMessage: `Template content not available for language: ${language}`,
        });
        return;
      }

      // Prepare personalization variables
      const variables: Record<string, string> = {
        client_name: client.name,
        company: client.company || '',
        last_interaction: client.lastInteraction ? 
          new Date(client.lastInteraction).toLocaleDateString() : 'N/A',
        ...client.customFields,
      };

      const personalizedSubject = personalizeContent(subject, variables);
      const personalizedContent = personalizeContent(content, variables);

      // Send email
      const success = await sendEmail({
        to: client.email,
        from: 'noreply@emailflow.app',
        subject: personalizedSubject,
        html: personalizedContent,
        text: personalizedContent.replace(/<[^>]*>/g, ''), // Strip HTML tags for text version
      });

      if (success) {
        // Update scheduled email status
        await storage.updateScheduledEmail(scheduledEmail.id, {
          status: 'sent',
          sentAt: new Date(),
          personalizedSubject,
          personalizedContent,
        });

        // Create email log
        await storage.createEmailLog({
          clientId: client.id,
          templateId: template.id,
          scheduledEmailId: scheduledEmail.id,
          subject: personalizedSubject,
          status: 'sent',
          language,
        });

        // Increment template usage
        await storage.incrementTemplateUsage(template.id);

        console.log(`Email sent successfully to ${client.email}`);
      } else {
        await storage.updateScheduledEmail(scheduledEmail.id, {
          status: 'failed',
          errorMessage: 'Failed to send email via SendGrid',
        });
      }
    } catch (error) {
      console.error(`Error sending scheduled email ${scheduledEmail.id}:`, error);
      await storage.updateScheduledEmail(scheduledEmail.id, {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async scheduleEmail(
    clientId: number,
    templateId: number,
    delay: 'immediate' | '1day' | '1week' | '1month',
    language?: string
  ): Promise<ScheduledEmail> {
    const scheduledFor = new Date();
    
    switch (delay) {
      case 'immediate':
        // Schedule for 1 minute from now to allow processing
        scheduledFor.setMinutes(scheduledFor.getMinutes() + 1);
        break;
      case '1day':
        scheduledFor.setDate(scheduledFor.getDate() + 1);
        break;
      case '1week':
        scheduledFor.setDate(scheduledFor.getDate() + 7);
        break;
      case '1month':
        scheduledFor.setMonth(scheduledFor.getMonth() + 1);
        break;
    }

    return await storage.createScheduledEmail({
      clientId,
      templateId,
      scheduledFor,
      language: language || 'en',
    });
  }
}

export const emailScheduler = new EmailScheduler();
