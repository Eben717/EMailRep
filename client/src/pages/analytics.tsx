import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, 
  Users, 
  Mail, 
  MailOpen, 
  TrendingUp,
  Calendar,
  Activity
} from "lucide-react";
import { languages } from "@/lib/translations";
import type { Client, EmailTemplate, EmailLog } from "@shared/schema";

interface DashboardStats {
  totalClients: number;
  emailsSent: number;
  openRate: number;
  pendingSends: number;
}

export default function Analytics() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/stats"],
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: templates = [] } = useQuery<EmailTemplate[]>({
    queryKey: ["/api/templates"],
  });

  const { data: emailLogs = [] } = useQuery<EmailLog[]>({
    queryKey: ["/api/email-logs"],
  });

  // Calculate analytics
  const totalEmails = emailLogs.length;
  const sentEmails = emailLogs.filter(log => log.status === 'sent' || log.status === 'delivered' || log.status === 'opened').length;
  const deliveredEmails = emailLogs.filter(log => log.status === 'delivered' || log.status === 'opened').length;
  const openedEmails = emailLogs.filter(log => log.status === 'opened').length;
  const failedEmails = emailLogs.filter(log => log.status === 'failed' || log.status === 'bounced').length;

  const deliveryRate = sentEmails > 0 ? (deliveredEmails / sentEmails) * 100 : 0;
  const openRate = deliveredEmails > 0 ? (openedEmails / deliveredEmails) * 100 : 0;
  const failureRate = totalEmails > 0 ? (failedEmails / totalEmails) * 100 : 0;

  // Template performance
  const templateStats = templates.map(template => {
    const templateLogs = emailLogs.filter(log => log.templateId === template.id);
    const templateOpened = templateLogs.filter(log => log.status === 'opened').length;
    const templateDelivered = templateLogs.filter(log => log.status === 'delivered' || log.status === 'opened').length;
    const templateOpenRate = templateDelivered > 0 ? (templateOpened / templateDelivered) * 100 : 0;

    return {
      template,
      sent: templateLogs.length,
      delivered: templateDelivered,
      opened: templateOpened,
      openRate: templateOpenRate,
    };
  }).sort((a, b) => b.sent - a.sent);

  // Language performance
  const languageStats = Object.keys(languages).map(langCode => {
    const langLogs = emailLogs.filter(log => log.language === langCode);
    const langOpened = langLogs.filter(log => log.status === 'opened').length;
    const langDelivered = langLogs.filter(log => log.status === 'delivered' || log.status === 'opened').length;
    const langOpenRate = langDelivered > 0 ? (langOpened / langDelivered) * 100 : 0;

    return {
      language: langCode,
      sent: langLogs.length,
      delivered: langDelivered,
      opened: langOpened,
      openRate: langOpenRate,
    };
  }).filter(stat => stat.sent > 0).sort((a, b) => b.sent - a.sent);

  // Recent activity
  const recentLogs = emailLogs
    .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())
    .slice(0, 10);

  // Client engagement
  const clientEngagement = clients.map(client => {
    const clientLogs = emailLogs.filter(log => log.clientId === client.id);
    const clientOpened = clientLogs.filter(log => log.status === 'opened').length;
    const clientDelivered = clientLogs.filter(log => log.status === 'delivered' || log.status === 'opened').length;
    const clientOpenRate = clientDelivered > 0 ? (clientOpened / clientDelivered) * 100 : 0;

    return {
      client,
      emailsSent: clientLogs.length,
      emailsOpened: clientOpened,
      openRate: clientOpenRate,
      lastEmail: clientLogs.length > 0 ? clientLogs[0].sentAt : null,
    };
  }).filter(stat => stat.emailsSent > 0).sort((a, b) => b.openRate - a.openRate);

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-blue-100 text-blue-700';
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'opened': return 'bg-purple-100 text-purple-700';
      case 'failed': return 'bg-red-100 text-red-700';
      case 'bounced': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Analytics</h2>
            <p className="text-slate-600">Track email performance and client engagement</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Emails</p>
                  <p className="text-3xl font-bold text-slate-800">{totalEmails}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Mail className="text-blue-600" size={24} />
                </div>
              </div>
              <div className="flex items-center mt-4 text-sm">
                <span className="text-slate-500">All time</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Delivery Rate</p>
                  <p className="text-3xl font-bold text-slate-800">{deliveryRate.toFixed(1)}%</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="text-green-600" size={24} />
                </div>
              </div>
              <div className="flex items-center mt-4 text-sm">
                <span className="text-slate-500">{deliveredEmails} of {sentEmails} delivered</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Open Rate</p>
                  <p className="text-3xl font-bold text-slate-800">{openRate.toFixed(1)}%</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <MailOpen className="text-purple-600" size={24} />
                </div>
              </div>
              <div className="flex items-center mt-4 text-sm">
                <span className="text-slate-500">{openedEmails} of {deliveredEmails} opened</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Failure Rate</p>
                  <p className="text-3xl font-bold text-slate-800">{failureRate.toFixed(1)}%</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <Activity className="text-red-600" size={24} />
                </div>
              </div>
              <div className="flex items-center mt-4 text-sm">
                <span className="text-slate-500">{failedEmails} failed emails</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Template Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="text-slate-600" size={20} />
                Template Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {templateStats.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <BarChart className="mx-auto mb-4" size={48} />
                  <p>No email data available</p>
                  <p className="text-sm">Send some emails to see performance metrics</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {templateStats.slice(0, 5).map(({ template, sent, openRate }) => (
                    <div key={template.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-slate-800">{template.name}</p>
                        <p className="text-sm text-slate-500">{sent} emails sent</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-slate-800">{openRate.toFixed(1)}%</p>
                        <p className="text-xs text-slate-500">open rate</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Language Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="text-slate-600" size={20} />
                Language Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {languageStats.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Users className="mx-auto mb-4" size={48} />
                  <p>No language data available</p>
                  <p className="text-sm">Send multilingual emails to see language metrics</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {languageStats.map(({ language, sent, openRate }) => (
                    <div key={language} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">
                          {languages[language as keyof typeof languages]?.flag}{' '}
                          {languages[language as keyof typeof languages]?.name}
                        </Badge>
                        <span className="text-sm text-slate-500">{sent} emails</span>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-slate-800">{openRate.toFixed(1)}%</p>
                        <p className="text-xs text-slate-500">open rate</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Client Engagement */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="text-slate-600" size={20} />
                Top Engaged Clients
              </CardTitle>
            </CardHeader>
            <CardContent>
              {clientEngagement.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Users className="mx-auto mb-4" size={48} />
                  <p>No client engagement data</p>
                  <p className="text-sm">Send emails to clients to track engagement</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {clientEngagement.slice(0, 5).map(({ client, emailsSent, openRate }) => (
                    <div key={client.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-blue-600">
                            {client.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{client.name}</p>
                          <p className="text-sm text-slate-500">{emailsSent} emails sent</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-slate-800">{openRate.toFixed(1)}%</p>
                        <p className="text-xs text-slate-500">open rate</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="text-slate-600" size={20} />
                Recent Email Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentLogs.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Activity className="mx-auto mb-4" size={48} />
                  <p>No recent activity</p>
                  <p className="text-sm">Email activity will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentLogs.map((log) => {
                    const client = clients.find(c => c.id === log.clientId);
                    const template = templates.find(t => t.id === log.templateId);
                    return (
                      <div key={log.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            log.status === 'opened' ? 'bg-purple-500' :
                            log.status === 'delivered' ? 'bg-green-500' :
                            log.status === 'sent' ? 'bg-blue-500' : 'bg-red-500'
                          }`}></div>
                          <div>
                            <p className="text-sm font-medium text-slate-800">
                              {template?.name} → {client?.name}
                            </p>
                            <p className="text-xs text-slate-500">{formatDate(log.sentAt)}</p>
                          </div>
                        </div>
                        <Badge className={`text-xs ${getStatusColor(log.status)}`}>
                          {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
