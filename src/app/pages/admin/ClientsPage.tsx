import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { supabase, type Client, type ClientProject } from '@/lib/supabase';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { Button } from '@/app/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Plus, Edit, Trash2, MoreVertical, Search, Info, Key } from 'lucide-react';
import { toast } from 'sonner';
import * as api from '@/lib/apiClient';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/app/components/ui/tooltip';

const ITEMS_PER_PAGE = 30;

export function ClientsPage() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Record<string, ClientProject[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    // Filtrar clientes cuando cambia la búsqueda
    const filtered = clients.filter(client => 
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredClients(filtered);
    setCurrentPage(1); // Reset a la primera página al buscar
  }, [searchQuery, clients]);

  const loadClients = async () => {
    try {
      setIsLoading(true);
      const { data: clientsData, error: clientsError } = await api.query<Client[]>('clients', {
        order: api.desc('created_at'),
      });

      if (clientsError) throw new Error(clientsError);

      setClients(clientsData || []);

      // Cargar proyectos para cada cliente
      if (clientsData && clientsData.length > 0) {
        const { data: projectsData, error: projectsError } = await api.query<ClientProject[]>('client_projects', {
          filters: [api.inValues('client_id', clientsData.map(c => c.id))],
        });

        if (projectsError) throw new Error(projectsError);

        // Agrupar proyectos por client_id
        const projectsByClient: Record<string, ClientProject[]> = {};
        (projectsData || []).forEach(project => {
          if (!projectsByClient[project.client_id]) {
            projectsByClient[project.client_id] = [];
          }
          projectsByClient[project.client_id].push(project);
        });

        setProjects(projectsByClient);
      }
    } catch (error) {
      console.error('Error loading clients:', error);
      toast.error('Error al cargar los clientes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingClient) {
        // Actualizar cliente
        const { error } = await api.update('clients', {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          ...(formData.password && { password: formData.password })
        }, [api.eq('id', editingClient.id)]);

        if (error) throw new Error(error);
        toast.success('Cliente actualizado correctamente');
      } else {
        // Crear nuevo cliente con Supabase Auth
        const passwordToUse = formData.password || generatePassword(formData.email);

        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-4cb2c9d0/auth/signup-client`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${publicAnonKey}`,
            },
            body: JSON.stringify({
              name: formData.name,
              email: formData.email,
              phone: formData.phone,
              password: passwordToUse,
            }),
          }
        );

        const result = await response.json();
        if (!result.ok) {
          throw new Error(result.error || 'Error al crear cliente');
        }

        // Mostrar contraseña generada si fue automática
        if (!formData.password) {
          toast.success(
            `Cliente creado. Contraseña: ${passwordToUse}`,
            { duration: 10000 }
          );
        } else {
          toast.success('Cliente creado exitosamente');
        }
      }

      setIsDialogOpen(false);
      resetForm();
      loadClients();
    } catch (error) {
      console.error('Error saving client:', error);
      toast.error('Error al guardar el cliente');
    }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm('¿Estás seguro de eliminar este cliente?')) return;

    try {
      const { error } = await api.del('clients', [api.eq('id', id)]);

      if (error) throw new Error(error);
      toast.success('Cliente eliminado correctamente');
      loadClients();
    } catch (error) {
      console.error('Error deleting client:', error);
      toast.error('Error al eliminar el cliente');
    }
  };

  const handleResetPassword = async (client: Client, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const newPassword = generatePassword(client.email);
    
    try {
      const { error } = await api.update('clients', { password: newPassword }, [api.eq('id', client.id)]);

      if (error) throw new Error(error);
      toast.success(`Contraseña reseteada: ${newPassword}`, { duration: 8000 });
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error('Error al resetear la contraseña');
    }
  };

  const generatePassword = (email: string) => {
    return `${email}1234`;
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: ''
    });
    setEditingClient(null);
  };

  const openEditDialog = (client: Client, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingClient(client);
    setFormData({
      name: client.name,
      email: client.email,
      phone: client.phone || '',
      password: ''
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-neutral-500">Cargando...</p>
      </div>
    );
  }

  const totalPages = Math.ceil(filteredClients.length / ITEMS_PER_PAGE);
  const currentClients = filteredClients.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="p-2.5 md:p-8 max-w-7xl mx-auto">
      <div className="mb-6 md:mb-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-[#16273F]">Clientes</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} className="bg-[#16273F] hover:bg-[#16273F]/90 w-full md:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[calc(100%-2rem)] max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Correo</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                {!editingClient && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="password">Contraseña</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-neutral-400 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-sm">
                            <p className="text-sm">
                              Si dejas este campo vacío, se generará automáticamente usando el formato: <strong>correo+1234</strong>. La contraseña se mostrará después de crear el cliente. El cliente podrá cambiarla desde su perfil.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Input
                      id="password"
                      type="text"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Dejar vacío para generar automáticamente"
                    />
                  </div>
                )}
                <div className="flex justify-between gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-[#16273F] hover:bg-[#16273F]/90">
                    Guardar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Barra de búsqueda */}
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre o correo..."
            className="pl-10"
          />
        </div>

        {/* Vista Desktop - Tabla */}
        <div className="hidden md:block bg-white rounded-lg border border-neutral-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Proyectos</TableHead>
                <TableHead className="text-right w-[80px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-neutral-500 py-8">
                    {searchQuery ? 'No se encontraron clientes' : 'No hay clientes registrados'}
                  </TableCell>
                </TableRow>
              ) : (
                currentClients.map((client) => (
                  <TableRow 
                    key={client.id}
                    className="cursor-pointer hover:bg-neutral-50"
                    onClick={() => navigate(`/okey-admin/clientes/${client.id}`)}
                  >
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{client.email}</TableCell>
                    <TableCell>{client.phone || '-'}</TableCell>
                    <TableCell>
                      {projects[client.id]?.length || 0} proyecto(s)
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => openEditDialog(client, e as any)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => handleResetPassword(client, e as any)}>
                            <Key className="h-4 w-4 mr-2" />
                            Resetear Contraseña
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={(e) => handleDelete(client.id, e as any)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Vista Móvil - Cards */}
        <div className="md:hidden space-y-3">
          {currentClients.length === 0 ? (
            <div className="bg-white rounded-lg border border-neutral-200 p-8 text-center">
              <p className="text-neutral-500">
                {searchQuery ? 'No se encontraron clientes' : 'No hay clientes registrados'}
              </p>
            </div>
          ) : (
            currentClients.map((client) => (
              <div 
                key={client.id} 
                className="bg-white rounded-lg border border-neutral-200 p-4 flex items-center gap-3"
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-[#16273F] text-white flex items-center justify-center font-semibold text-lg shrink-0">
                  {client.avatar_url ? (
                    <img 
                      src={client.avatar_url} 
                      alt={client.name} 
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    client.name[0]?.toUpperCase() || 'C'
                  )}
                </div>

                {/* Nombre */}
                <div 
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => navigate(`/okey-admin/clientes/${client.id}`)}
                >
                  <h3 className="font-semibold text-[#16273F] truncate">{client.name}</h3>
                </div>

                {/* Menú de acciones */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => openEditDialog(client, e as any)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => handleResetPassword(client, e as any)}>
                      <Key className="h-4 w-4 mr-2" />
                      Resetear Contraseña
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => handleDelete(client.id, e as any)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))
          )}
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-neutral-500">
              Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredClients.length)} de {filteredClients.length} clientes
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <span className="text-sm text-neutral-600">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}