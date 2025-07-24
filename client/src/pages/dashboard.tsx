import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  Mail, 
  MailOpen, 
  Clock, 
  Plus,
  UserPlus,
  FileText,
  Settings,
  TrendingUp
} from "lucide-react";
import TemplateModal from "@/components/modals/template-modal";
import ClientModal from "@/components/modals/client-modal";
import { languages } from "@/lib/translations";
import type { Client, EmailTemplate, ScheduledEmail, EmailLog } from "@shared/schema";

interface DashboardStats {
  totalClients: number;
  emailsSent: number;
  openRate: number;
  pendingSends: number;
}

export default function Dashboard() {
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/stats"],
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: templates = [] } = useQuery<EmailTemplate[]>({
    queryKey: ["/api/templates"],
  });

  const { data: scheduledEmails = [] } = useQuery<ScheduledEmail[]>({
    queryKey: ["/api/scheduled-emails"],
  });

  const { data: emailLogs = [] } = useQuery<EmailLog[]>({
    queryKey: ["/api/email-logs"],
  });

  const recentActivity = emailLogs
    .slice(0, 5)
    .map(log => {
      const client = clients.find(c => c.id === log.clientId);
      const template = templates.find(t => t.id === log.templateId);
      return { log, client, template };
    });

  const upcomingEmails = scheduledEmails
    .filter(email => email.status === 'pending')
    .slice(0, 5)
    .map(email => {
      const client = clients.find(c => c.id === email.clientId);
      const template = templates.find(t => t.id === email.templateId);
      return { email, client, template };
    });

  const topTemplates = templates
    .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
    .slice(0, 3);

  const formatTimeAgo = (date: Date | string) => {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  const formatScheduleTime = (date: Date | string) => {
    const scheduleDate = new Date(date);
    const now = new Date();
    const diffMs = scheduleDate.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMs < 0) return "Overdue";
    if (diffHours < 24) return `In ${diffHours} hours`;
    return `In ${diffDays} days`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-700';
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'opened': return 'bg-blue-100 text-blue-700';
      case 'pending': return 'bg-orange-100 text-orange-700';
      case 'failed': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>
            <p className="text-slate-600">Overview of your client follow-up automation</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button onClick={() => setShowTemplateModal(true)}>
              <Plus className="mr-2" size={16} />
              New Template
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Clients</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16 mt-2" />
                  ) : (
                    <p className="text-3xl font-bold text-slate-800">{stats?.totalClients || 0}</p>
                  )}
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="text-blue-600" size={24} />
                </div>
              </div>
              <div className="flex items-center mt-4 text-sm">
                <TrendingUp className="text-green-600 mr-1" size={16} />
                <span className="text-green-600 font-medium">+12%</span>
                <span className="text-slate-500 ml-2">from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Emails Sent</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16 mt-2" />
                  ) : (
                    <p className="text-3xl font-bold text-slate-800">{stats?.emailsSent || 0}</p>
                  )}
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Mail className="text-green-600" size={24} />
                </div>
              </div>
              <div className="flex items-center mt-4 text-sm">
                <TrendingUp className="text-green-600 mr-1" size={16} />
                <span className="text-green-600 font-medium">+18%</span>
                <span className="text-slate-500 ml-2">from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Open Rate</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16 mt-2" />
                  ) : (
                    <p className="text-3xl font-bold text-slate-800">{stats?.openRate || 0}%</p>
                  )}
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <MailOpen className="text-orange-600" size={24} />
                </div>
              </div>
              <div className="flex items-center mt-4 text-sm">
                <TrendingUp className="text-green-600 mr-1" size={16} />
                <span className="text-green-600 font-medium">+5.2%</span>
                <span className="text-slate-500 ml-2">from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Pending Sends</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16 mt-2" />
                  ) : (
                    <p className="text-3xl font-bold text-slate-800">{stats?.pendingSends || 0}</p>
                  )}
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Clock className="text-purple-600" size={24} />
                </div>
              </div>
              <div className="flex items-center mt-4 text-sm">
                <span className="text-slate-500">
                  {upcomingEmails.length > 0 ? `Next: ${formatScheduleTime(upcomingEmails[0].email.scheduledFor)}` : 'No pending emails'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-start space-x-3 p-4 h-auto"
                  onClick={() => setShowClientModal(true)}
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <UserPlus className="text-blue-600" size={20} />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-slate-800">Add New Client</p>
                    <p className="text-sm text-slate-500">Import or create client profiles</p>
                  </div>
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-start space-x-3 p-4 h-auto"
                  onClick={() => setShowTemplateModal(true)}
                >
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <FileText className="text-green-600" size={20} />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-slate-800">Create Template</p>
                    <p className="text-sm text-slate-500">Design personalized email templates</p>
                  </div>
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-start space-x-3 p-4 h-auto"
                >
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Settings className="text-purple-600" size={20} />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-slate-800">Setup Automation</p>
                    <p className="text-sm text-slate-500">Configure follow-up schedules</p>
                  </div>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Recent Activity</CardTitle>
                <Button variant="ghost" size="sm">View All</Button>
              </CardHeader>
              <CardContent>
                {recentActivity.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <Mail className="mx-auto mb-4" size={48} />
                    <p>No recent activity</p>
                    <p className="text-sm">Start by creating templates and adding clients</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentActivity.map(({ log, client, template }, index) => (
                      <div key={index} className="flex items-start space-x-4 p-4 border border-slate-100 rounded-lg">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          log.status === 'sent' || log.status === 'delivered' ? 'bg-green-100' :
                          log.status === 'opened' ? 'bg-blue-100' : 'bg-red-100'
                        }`}>
                          <Mail className={`text-sm ${
                            log.status === 'sent' || log.status === 'delivered' ? 'text-green-600' :
                            log.status === 'opened' ? 'text-blue-600' : 'text-red-600'
                          }`} size={14} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-800">
                            Email {log.status} to <span className="text-blue-600">{client?.name}</span>
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            Template: "{template?.name}" • {formatTimeAgo(log.sentAt)}
                          </p>
                        </div>
                        <Badge className={`text-xs ${getStatusColor(log.status)}`}>
                          {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Email Templates Preview */}
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Email Templates</CardTitle>
            <Button onClick={() => setShowTemplateModal(true)}>
              Manage Templates
            </Button>
          </CardHeader>
          <CardContent>
            {topTemplates.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <FileText className="mx-auto mb-4" size={48} />
                <p>No templates created yet</p>
                <p className="text-sm">Create your first email template to get started</p>
                <Button className="mt-4" onClick={() => setShowTemplateModal(true)}>
                  Create Template
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {topTemplates.map((template) => (
                  <div key={template.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-medium text-slate-800">{template.name}</h4>
                      <div className="flex space-x-1">
                        {template.supportedLanguages?.map(lang => (
                          <Badge key={lang} variant="secondary" className="text-xs">
                            {languages[lang as keyof typeof languages]?.flag || lang.toUpperCase()}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                      {template.content[template.primaryLanguage]?.substring(0, 100)}...
                    </p>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Used {template.usageCount || 0} times</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Scheduled Emails */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Upcoming Scheduled Emails</CardTitle>
            <Button variant="ghost" size="sm">View Full Schedule</Button>
          </CardHeader>
          <CardContent>
            {upcomingEmails.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Clock className="mx-auto mb-4" size={48} />
                <p>No upcoming emails scheduled</p>
                <p className="text-sm">Schedule some follow-ups to keep your clients engaged</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider pb-3">Client</th>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider pb-3">Template</th>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider pb-3">Language</th>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider pb-3">Scheduled</th>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {upcomingEmails.map(({ email, client, template }) => (
                      <tr key={email.id}>
                        <td className="py-4">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                              <span className="text-xs font-medium text-blue-600">
                                {client?.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-800">{client?.name}</p>
                              <p className="text-xs text-slate-500">{client?.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          <p className="text-sm text-slate-800">{template?.name}</p>
                        </td>
                        <td className="py-4">
                          <Badge variant="secondary" className="text-xs">
                            {languages[email.language as keyof typeof languages]?.name || email.language}
                          </Badge>
                        </td>
                        <td className="py-4">
                          <p className="text-sm text-slate-800">{formatScheduleTime(email.scheduledFor)}</p>
                          <p className="text-xs text-slate-500">
                            {new Date(email.scheduledFor).toLocaleDateString()}
                          </p>
                        </td>
                        <td className="py-4">
                          <Badge className={`text-xs ${getStatusColor(email.status)}`}>
                            {email.status.charAt(0).toUpperCase() + email.status.slice(1)}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Modals */}
      <TemplateModal 
        open={showTemplateModal} 
        onOpenChange={setShowTemplateModal} 
      />
      <ClientModal 
        open={showClientModal} 
        onOpenChange={setShowClientModal} 
      />
    </div>
  );
}
