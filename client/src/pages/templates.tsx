import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
} from "@/components/ui/dialog";
import { 
  FileText, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye,
  Plus
} from "lucide-react";
import TemplateModal from "@/components/modals/template-modal";
import { languages } from "@/lib/translations";
import type { EmailTemplate } from "@shared/schema";

export default function Templates() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<EmailTemplate | null>(null);
  const [previewingTemplate, setPreviewingTemplate] = useState<EmailTemplate | null>(null);
  const [previewLanguage, setPreviewLanguage] = useState<string>("en");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: templates = [], isLoading } = useQuery<EmailTemplate[]>({
    queryKey: ["/api/templates"],
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/templates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      toast({
        title: "Success",
        description: "Template deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      });
    },
  });

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    Object.values(template.subject).some(subject => 
      subject.toLowerCase().includes(searchTerm.toLowerCase())
    ) ||
    Object.values(template.content).some(content => 
      content.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handleEditTemplate = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setShowTemplateModal(true);
  };

  const handleDeleteTemplate = (template: EmailTemplate) => {
    setDeletingTemplate(template);
  };

  const handlePreviewTemplate = (template: EmailTemplate) => {
    setPreviewingTemplate(template);
    setPreviewLanguage(template.primaryLanguage);
  };

  const confirmDeleteTemplate = () => {
    if (deletingTemplate) {
      deleteTemplateMutation.mutate(deletingTemplate.id);
      setDeletingTemplate(null);
    }
  };

  const closeModal = () => {
    setShowTemplateModal(false);
    setEditingTemplate(null);
  };

  const closePreview = () => {
    setPreviewingTemplate(null);
    setPreviewLanguage("en");
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Email Templates</h2>
            <p className="text-slate-600">Create and manage personalized email templates</p>
          </div>
          <Button onClick={() => setShowTemplateModal(true)}>
            <Plus className="mr-2" size={16} />
            Create Template
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6">
        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <Input
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Templates Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-slate-200 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-slate-200 rounded w-full mb-2"></div>
                  <div className="h-3 bg-slate-200 rounded w-2/3 mb-4"></div>
                  <div className="flex justify-between">
                    <div className="h-3 bg-slate-200 rounded w-1/4"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/4"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredTemplates.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="mx-auto mb-4 text-slate-400" size={48} />
              <h3 className="text-lg font-medium text-slate-800 mb-2">
                {searchTerm ? "No templates found" : "No email templates yet"}
              </h3>
              <p className="text-slate-600 mb-6">
                {searchTerm 
                  ? `No templates match "${searchTerm}". Try a different search term.`
                  : "Create your first email template to start automating your client communications."
                }
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowTemplateModal(true)}>
                  <Plus className="mr-2" size={16} />
                  Create Your First Template
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-semibold text-slate-800 text-lg">{template.name}</h3>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handlePreviewTemplate(template)}>
                          <Eye className="mr-2" size={14} />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditTemplate(template)}>
                          <Edit className="mr-2" size={14} />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteTemplate(template)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2" size={14} />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1 mb-3">
                      {template.supportedLanguages?.map(lang => (
                        <Badge key={lang} variant="secondary" className="text-xs">
                          {languages[lang as keyof typeof languages]?.flag || lang.toUpperCase()}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-3">
                      {template.content[template.primaryLanguage]?.substring(0, 150)}...
                    </p>
                  </div>

                  {template.variables && template.variables.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-slate-600 mb-2">Variables used:</p>
                      <div className="flex flex-wrap gap-1">
                        {template.variables.slice(0, 3).map(variable => (
                          <Badge key={variable} variant="outline" className="text-xs">
                            {`{{${variable}}}`}
                          </Badge>
                        ))}
                        {template.variables.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{template.variables.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-slate-100">
                    <span>Used {template.usageCount || 0} times</span>
                    <span>Created {new Date(template.createdAt).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Template Modal */}
      <TemplateModal 
        open={showTemplateModal} 
        onOpenChange={closeModal}
        template={editingTemplate || undefined}
      />

      {/* Preview Dialog */}
      <Dialog open={!!previewingTemplate} onOpenChange={closePreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Template Preview: {previewingTemplate?.name}
              <div className="flex items-center gap-2">
                <span className="text-sm font-normal">Language:</span>
                <select 
                  value={previewLanguage}
                  onChange={(e) => setPreviewLanguage(e.target.value)}
                  className="text-sm border rounded px-2 py-1"
                >
                  {previewingTemplate?.supportedLanguages?.map(lang => (
                    <option key={lang} value={lang}>
                      {languages[lang as keyof typeof languages]?.flag}{' '}
                      {languages[lang as keyof typeof languages]?.name || lang}
                    </option>
                  ))}
                </select>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {previewingTemplate && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Subject Line</label>
                <div className="p-3 bg-slate-50 rounded border">
                  {previewingTemplate.subject[previewLanguage] || 
                   previewingTemplate.subject[previewingTemplate.primaryLanguage] || 
                   "No subject for this language"}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email Content</label>
                <div className="p-4 bg-white border rounded min-h-[200px] prose prose-sm max-w-none">
                  <div dangerouslySetInnerHTML={{ 
                    __html: (previewingTemplate.content[previewLanguage] || 
                             previewingTemplate.content[previewingTemplate.primaryLanguage] || 
                             "No content for this language").replace(/\n/g, '<br>') 
                  }} />
                </div>
              </div>
              
              {previewingTemplate.variables && previewingTemplate.variables.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Available Variables</label>
                  <div className="flex flex-wrap gap-2">
                    {previewingTemplate.variables.map(variable => (
                      <Badge key={variable} variant="outline">
                        {`{{${variable}}}`}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    These variables will be replaced with actual client data when emails are sent.
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingTemplate} onOpenChange={() => setDeletingTemplate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingTemplate?.name}"? This action cannot be undone.
              Any scheduled emails using this template will be cancelled.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteTemplate}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Template
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
