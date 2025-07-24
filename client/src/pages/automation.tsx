import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { 
  Bot, 
  Calendar, 
  Clock, 
  Mail, 
  Send,
  Edit,
  Trash2,
  Plus
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { languages } from "@/lib/translations";
import type { Client, EmailTemplate, ScheduledEmail } from "@shared/schema";

const scheduleEmailSchema = z.object({
  clientId: z.string(),
  templateId: z.string(),
  delay: z.enum(['immediate', '1day', '1week', '1month']),
  language: z.string().optional(),
});

type ScheduleEmailForm = z.infer<typeof scheduleEmailSchema>;

export default function Automation() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [cancellingEmail, setCancellingEmail] = useState<ScheduledEmail | null>(null);

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: templates = [] } = useQuery<EmailTemplate[]>({
    queryKey: ["/api/templates"],
  });

  const { data: scheduledEmails = [], isLoading } = useQuery<ScheduledEmail[]>({
    queryKey: ["/api/scheduled-emails"],
  });

  const scheduleEmailMutation = useMutation({
    mutationFn: (data: { clientId: number; templateId: number; delay: string; language?: string }) => 
      apiRequest("POST", "/api/schedule-email", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scheduled-emails"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success",
        description: "Email scheduled successfully",
      });
      setShowScheduleModal(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to schedule email",
        variant: "destructive",
      });
    },
  });

  const cancelEmailMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest("PUT", `/api/scheduled-emails/${id}`, { status: "cancelled" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scheduled-emails"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success",
        description: "Email cancelled successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to cancel email",
        variant: "destructive",
      });
    },
  });

  const form = useForm<ScheduleEmailForm>({
    resolver: zodResolver(scheduleEmailSchema),
    defaultValues: {
      clientId: "",
      templateId: "",
      delay: "immediate",
      language: "en",
    },
  });

  const onSubmit = (data: ScheduleEmailForm) => {
    scheduleEmailMutation.mutate({
      clientId: parseInt(data.clientId),
      templateId: parseInt(data.templateId),
      delay: data.delay,
      language: data.language,
    });
  };

  const handleCancelEmail = (email: ScheduledEmail) => {
    setCancellingEmail(email);
  };

  const confirmCancelEmail = () => {
    if (cancellingEmail) {
      cancelEmailMutation.mutate(cancellingEmail.id);
      setCancellingEmail(null);
    }
  };

  const formatScheduleTime = (date: Date | string) => {
    const scheduleDate = new Date(date);
    const now = new Date();
    const diffMs = scheduleDate.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMs < 0) return "Overdue";
    if (diffHours < 1) return "Very soon";
    if (diffHours < 24) return `In ${diffHours} hours`;
    return `In ${diffDays} days`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-orange-100 text-orange-700';
      case 'sent': return 'bg-green-100 text-green-700';
      case 'failed': return 'bg-red-100 text-red-700';
      case 'cancelled': return 'bg-slate-100 text-slate-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getDelayLabel = (delay: string) => {
    switch (delay) {
      case 'immediate': return 'Immediate';
      case '1day': return '1 Day';
      case '1week': return '1 Week';
      case '1month': return '1 Month';
      default: return delay;
    }
  };

  const pendingEmails = scheduledEmails.filter(email => email.status === 'pending');
  const completedEmails = scheduledEmails.filter(email => email.status !== 'pending');

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Automation</h2>
            <p className="text-slate-600">Schedule and manage automated email follow-ups</p>
          </div>
          <Dialog open={showScheduleModal} onOpenChange={setShowScheduleModal}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2" size={16} />
                Schedule Email
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Schedule New Email</DialogTitle>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="clientId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Client *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select client" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {clients.map(client => (
                                <SelectItem key={client.id} value={client.id.toString()}>
                                  {client.name} ({client.email})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="templateId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Template *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select template" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {templates.map(template => (
                                <SelectItem key={template.id} value={template.id.toString()}>
                                  {template.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="delay"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Schedule *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select delay" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="immediate">Send Immediately</SelectItem>
                              <SelectItem value="1day">Send in 1 Day</SelectItem>
                              <SelectItem value="1week">Send in 1 Week</SelectItem>
                              <SelectItem value="1month">Send in 1 Month</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="language"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Language</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select language" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(languages).map(([code, lang]) => (
                                <SelectItem key={code} value={code}>
                                  {lang.flag} {lang.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end space-x-4">
                    <Button type="button" variant="outline" onClick={() => setShowScheduleModal(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={scheduleEmailMutation.isPending}>
                      Schedule Email
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Pending Emails</p>
                  <p className="text-3xl font-bold text-slate-800">{pendingEmails.length}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Clock className="text-orange-600" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Scheduled</p>
                  <p className="text-3xl font-bold text-slate-800">{scheduledEmails.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="text-blue-600" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Completed</p>
                  <p className="text-3xl font-bold text-slate-800">{completedEmails.length}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Send className="text-green-600" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Emails */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="text-orange-600" size={20} />
              Pending Emails ({pendingEmails.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingEmails.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Bot className="mx-auto mb-4" size={48} />
                <p>No pending emails</p>
                <p className="text-sm">Schedule some follow-ups to automate your client communications</p>
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
                      <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider pb-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {pendingEmails.map((email) => {
                      const client = clients.find(c => c.id === email.clientId);
                      const template = templates.find(t => t.id === email.templateId);
                      return (
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
                          <td className="py-4 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancelEmail(email)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 size={14} className="mr-1" />
                              Cancel
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Email History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="text-slate-600" size={20} />
              Email History ({completedEmails.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {completedEmails.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Mail className="mx-auto mb-4" size={48} />
                <p>No completed emails yet</p>
                <p className="text-sm">Scheduled emails will appear here once they are processed</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider pb-3">Client</th>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider pb-3">Template</th>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider pb-3">Status</th>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider pb-3">Sent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {completedEmails.slice(0, 10).map((email) => {
                      const client = clients.find(c => c.id === email.clientId);
                      const template = templates.find(t => t.id === email.templateId);
                      return (
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
                            <Badge className={`text-xs ${getStatusColor(email.status)}`}>
                              {email.status.charAt(0).toUpperCase() + email.status.slice(1)}
                            </Badge>
                          </td>
                          <td className="py-4">
                            <p className="text-sm text-slate-800">
                              {email.sentAt ? new Date(email.sentAt).toLocaleDateString() : '-'}
                            </p>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={!!cancellingEmail} onOpenChange={() => setCancellingEmail(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Scheduled Email</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this scheduled email? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Scheduled</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmCancelEmail}
              className="bg-red-600 hover:bg-red-700"
            >
              Cancel Email
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
