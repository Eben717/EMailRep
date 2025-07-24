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
  UserPlus, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Mail,
  Phone,
  Building
} from "lucide-react";
import ClientModal from "@/components/modals/client-modal";
import { languages } from "@/lib/translations";
import type { Client } from "@shared/schema";

export default function Clients() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showClientModal, setShowClientModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const deleteClientMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/clients/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success",
        description: "Client deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete client",
        variant: "destructive",
      });
    },
  });

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.company && client.company.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setShowClientModal(true);
  };

  const handleDeleteClient = (client: Client) => {
    setDeletingClient(client);
  };

  const confirmDeleteClient = () => {
    if (deletingClient) {
      deleteClientMutation.mutate(deletingClient.id);
      setDeletingClient(null);
    }
  };

  const closeModal = () => {
    setShowClientModal(false);
    setEditingClient(null);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Clients</h2>
            <p className="text-slate-600">Manage your client database and contact information</p>
          </div>
          <Button onClick={() => setShowClientModal(true)}>
            <UserPlus className="mr-2" size={16} />
            Add Client
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6">
        {/* Search and Filters */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <Input
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Clients Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredClients.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <UserPlus className="mx-auto mb-4 text-slate-400" size={48} />
              <h3 className="text-lg font-medium text-slate-800 mb-2">
                {searchTerm ? "No clients found" : "No clients yet"}
              </h3>
              <p className="text-slate-600 mb-6">
                {searchTerm 
                  ? `No clients match "${searchTerm}". Try a different search term.`
                  : "Start building your client database by adding your first client."
                }
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowClientModal(true)}>
                  <UserPlus className="mr-2" size={16} />
                  Add Your First Client
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map((client) => (
              <Card key={client.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium text-sm">
                          {getInitials(client.name)}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800">{client.name}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {languages[client.language as keyof typeof languages]?.flag}{' '}
                          {languages[client.language as keyof typeof languages]?.name || client.language}
                        </Badge>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditClient(client)}>
                          <Edit className="mr-2" size={14} />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteClient(client)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2" size={14} />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-slate-600">
                      <Mail className="mr-2" size={14} />
                      {client.email}
                    </div>
                    
                    {client.company && (
                      <div className="flex items-center text-slate-600">
                        <Building className="mr-2" size={14} />
                        {client.company}
                      </div>
                    )}
                    
                    {client.phone && (
                      <div className="flex items-center text-slate-600">
                        <Phone className="mr-2" size={14} />
                        {client.phone}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Added {formatDate(client.createdAt)}</span>
                      {client.lastInteraction && (
                        <span>Last contact {formatDate(client.lastInteraction)}</span>
                      )}
                    </div>
                  </div>

                  {/* Custom Fields */}
                  {client.customFields && Object.keys(client.customFields).length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <p className="text-xs font-medium text-slate-600 mb-2">Custom Fields</p>
                      <div className="space-y-1">
                        {Object.entries(client.customFields).map(([key, value]) => (
                          <div key={key} className="flex justify-between text-xs">
                            <span className="text-slate-500">{key}:</span>
                            <span className="text-slate-700">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Client Modal */}
      <ClientModal 
        open={showClientModal} 
        onOpenChange={closeModal}
        client={editingClient || undefined}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingClient} onOpenChange={() => setDeletingClient(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deletingClient?.name}? This action cannot be undone.
              All scheduled emails for this client will also be cancelled.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteClient}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Client
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
