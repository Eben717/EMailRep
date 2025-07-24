import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertEmailTemplateSchema, type InsertEmailTemplate } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { languages } from "@/lib/translations";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, X } from "lucide-react";

interface TemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: InsertEmailTemplate & { id?: number };
}

export default function TemplateModal({ open, onOpenChange, template }: TemplateModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [subjects, setSubjects] = useState<Record<string, string>>(
    template?.subject || { en: "" }
  );
  const [contents, setContents] = useState<Record<string, string>>(
    template?.content || { en: "" }
  );
  const [activeLanguages, setActiveLanguages] = useState<string[]>(
    template?.supportedLanguages || ["en"]
  );

  const form = useForm<InsertEmailTemplate>({
    resolver: zodResolver(insertEmailTemplateSchema),
    defaultValues: {
      name: template?.name || "",
      subject: template?.subject || { en: "" },
      content: template?.content || { en: "" },
      variables: template?.variables || [],
      primaryLanguage: template?.primaryLanguage || "en",
      supportedLanguages: template?.supportedLanguages || ["en"],
    },
  });

  const createTemplateMutation = useMutation({
    mutationFn: (data: InsertEmailTemplate) => apiRequest("POST", "/api/templates", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      toast({
        title: "Success",
        description: "Template created successfully",
      });
      onOpenChange(false);
      form.reset();
      setSubjects({ en: "" });
      setContents({ en: "" });
      setActiveLanguages(["en"]);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create template",
        variant: "destructive",
      });
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: (data: InsertEmailTemplate) => 
      apiRequest("PUT", `/api/templates/${template?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      toast({
        title: "Success",
        description: "Template updated successfully",
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update template",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertEmailTemplate) => {
    // Extract variables from content
    const allVariables = new Set<string>();
    Object.values(contents).forEach(content => {
      const matches = content.match(/{{(\w+)}}/g);
      if (matches) {
        matches.forEach(match => {
          const variable = match.replace(/[{}]/g, '');
          allVariables.add(variable);
        });
      }
    });

    const formData: InsertEmailTemplate = {
      ...data,
      subject: subjects,
      content: contents,
      supportedLanguages: activeLanguages,
      variables: Array.from(allVariables),
    };

    if (template?.id) {
      updateTemplateMutation.mutate(formData);
    } else {
      createTemplateMutation.mutate(formData);
    }
  };

  const addLanguage = (langCode: string) => {
    if (!activeLanguages.includes(langCode)) {
      setActiveLanguages([...activeLanguages, langCode]);
      setSubjects({ ...subjects, [langCode]: "" });
      setContents({ ...contents, [langCode]: "" });
    }
  };

  const removeLanguage = (langCode: string) => {
    if (langCode === form.getValues("primaryLanguage")) {
      toast({
        title: "Error",
        description: "Cannot remove primary language",
        variant: "destructive",
      });
      return;
    }
    
    setActiveLanguages(activeLanguages.filter(lang => lang !== langCode));
    const newSubjects = { ...subjects };
    const newContents = { ...contents };
    delete newSubjects[langCode];
    delete newContents[langCode];
    setSubjects(newSubjects);
    setContents(newContents);
  };

  const updateSubject = (langCode: string, value: string) => {
    setSubjects({ ...subjects, [langCode]: value });
  };

  const updateContent = (langCode: string, value: string) => {
    setContents({ ...contents, [langCode]: value });
  };

  const availableLanguages = Object.keys(languages).filter(
    lang => !activeLanguages.includes(lang)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {template?.id ? "Edit Email Template" : "Create Email Template"}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Welcome Email, Follow-up" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="primaryLanguage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Language</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select primary language" />
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Language Tabs */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Content by Language</h4>
                <div className="flex items-center gap-2">
                  {availableLanguages.length > 0 && (
                    <Select onValueChange={addLanguage}>
                      <SelectTrigger className="w-auto">
                        <SelectValue placeholder="Add language" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableLanguages.map(langCode => (
                          <SelectItem key={langCode} value={langCode}>
                            <Plus className="w-4 h-4 mr-2" />
                            {languages[langCode as keyof typeof languages].flag}{' '}
                            {languages[langCode as keyof typeof languages].name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              <Tabs value={activeLanguages[0]} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  {activeLanguages.map(langCode => (
                    <TabsTrigger key={langCode} value={langCode} className="flex items-center gap-2">
                      {languages[langCode as keyof typeof languages].flag}{' '}
                      {languages[langCode as keyof typeof languages].name}
                      {activeLanguages.length > 1 && langCode !== form.getValues("primaryLanguage") && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 ml-1"
                          onClick={(e) => {
                            e.preventDefault();
                            removeLanguage(langCode);
                          }}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      )}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {activeLanguages.map(langCode => (
                  <TabsContent key={langCode} value={langCode} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Subject Line
                      </label>
                      <Input
                        placeholder="Use variables like {{client_name}} or {{company}}"
                        value={subjects[langCode] || ""}
                        onChange={(e) => updateSubject(langCode, e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Email Content
                      </label>
                      <Textarea
                        rows={8}
                        placeholder="Write your email content here. Use {{variable_name}} for personalization."
                        value={contents[langCode] || ""}
                        onChange={(e) => updateContent(langCode, e.target.value)}
                      />
                    </div>
                  </TabsContent>
                ))}
              </Tabs>

              <div className="text-xs text-slate-500">
                Available variables: {'{{client_name}}, {{company}}, {{last_interaction}}'}, plus any custom fields
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}
              >
                {template?.id ? "Update Template" : "Create Template"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
