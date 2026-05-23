import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Edit, Trash2, RefreshCw, Shield, Pencil, UserCircle2, MoreVertical, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { Badge } from '@/app/components/ui/badge';
import { ImageUpload } from '@/app/components/ImageUpload';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, type TeamMember } from '@/lib/supabase';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import * as api from '@/lib/apiClient';

function generatePassword() {
  return Math.random().toString(36).slice(-8);
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  editor: 'Editor',
};

export function TeamPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<'admin' | 'editor' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [lastPassword, setLastPassword] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'editor' as 'admin' | 'editor',
    position: '',
    avatar_url: '',
    password: '',
  });

  useEffect(() => {
    loadMembers();
    loadCurrentUserRole();
  }, []);

  const loadCurrentUserRole = async () => {
    if (!user) return;
    // Use role from AuthContext instead of querying team_members (avoids RLS recursion)
    setCurrentUserRole(user.role || 'admin');
  };

  const loadMembers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await api.query<TeamMember[]>('team_members', {
        order: api.desc('created_at'),
      });
      if (error) throw new Error(error);
      setMembers(data || []);
    } catch (err) {
      toast.error('Error al cargar el equipo');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', role: 'editor', position: '', avatar_url: '', password: '' });
    setEditingMember(null);
    setLastPassword(null);
  };

  const openCreate = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEdit = (m: TeamMember) => {
    setEditingMember(m);
    setFormData({
      name: m.name,
      email: m.email,
      role: m.role,
      position: m.position || '',
      avatar_url: m.avatar_url || '',
      password: '',
    });
    setLastPassword(null);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const generatedPassword = !editingMember && !formData.password
        ? generatePassword()
        : formData.password;

      if (editingMember) {
        const { error } = await api.update('team_members', {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          position: formData.position || null,
          avatar_url: formData.avatar_url || null,
        }, [api.eq('id', editingMember.id)]);
        if (error) throw new Error(error);
        toast.success('Miembro actualizado');
      } else {
        // Crear usuario con Supabase Auth
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-4cb2c9d0/auth/signup-team`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${publicAnonKey}`,
            },
            body: JSON.stringify({
              name: formData.name,
              email: formData.email,
              password: generatedPassword,
              role: formData.role,
              position: formData.position || '',
              avatar_url: formData.avatar_url || null,
            }),
          }
        );

        const result = await response.json();
        if (!result.ok) {
          throw new Error(result.error || 'Error al crear miembro');
        }

        setLastPassword(generatedPassword);
        toast.success('Miembro creado exitosamente');
      }

      loadMembers();
      if (!editingMember) {
        // keep dialog open to show password
        setFormData({ name: '', email: '', role: 'editor', position: '', avatar_url: '', password: '' });
        setEditingMember(null);
      } else {
        setIsDialogOpen(false);
        resetForm();
      }
    } catch (err: any) {
      toast.error(err?.message || 'Error al guardar');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este miembro del equipo?')) return;
    try {
      const { error } = await api.del('team_members', [api.eq('id', id)]);
      if (error) throw new Error(error);
      toast.success('Miembro eliminado');
      loadMembers();
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const handleResetPassword = async (m: TeamMember) => {
    const pwd = generatePassword();
    try {
      const { error } = await api.update('team_members', { password: pwd }, [api.eq('id', m.id)]);
      if (error) throw new Error(error);
      toast.success(`Nueva contraseña: ${pwd}`, { duration: 8000 });
    } catch {
      toast.error('Error al resetear contraseña');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <p className="text-neutral-400">Cargando equipo...</p>
      </div>
    );
  }

  return (
    <div className="p-2.5 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-[#16273F]">Equipo</h1>
        {currentUserRole === 'admin' && (
          <Button onClick={openCreate} className="bg-[#16273F] hover:bg-[#16273F]/90 w-full md:w-auto h-[48px]">
            <Plus size={16} className="mr-2" />
            <span className="md:hidden">Nuevo</span>
            <span className="hidden md:inline">Nuevo miembro</span>
          </Button>
        )}
      </div>

      {/* Desktop: Table */}
      <div className="hidden md:block bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-neutral-50">
              <TableHead>Miembro</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Correo</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-neutral-400 py-12">
                  No hay miembros registrados
                </TableCell>
              </TableRow>
            ) : (
              members.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {m.avatar_url ? (
                        <img
                          src={m.avatar_url}
                          alt={m.name}
                          className="w-8 h-8 rounded-full object-cover border border-neutral-200"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[#16273F]/10 flex items-center justify-center">
                          <UserCircle2 size={18} className="text-[#16273F]/40" />
                        </div>
                      )}
                      <span className="font-medium text-neutral-800">{m.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-neutral-500">{m.position || '—'}</TableCell>
                  <TableCell className="text-neutral-500">{m.email}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        m.role === 'admin'
                          ? 'bg-[#16273F] text-white hover:bg-[#16273F]/90'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }
                    >
                      {m.role === 'admin' ? (
                        <Shield size={10} className="mr-1" />
                      ) : (
                        <Pencil size={10} className="mr-1" />
                      )}
                      {ROLE_LABELS[m.role]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/okey-admin/miembro/${m.id}`)}>
                          <User className="mr-2 h-4 w-4" />
                          Editar perfil público
                        </DropdownMenuItem>
                        {currentUserRole === 'admin' && (
                          <>
                            <DropdownMenuItem onClick={() => openEdit(m)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleResetPassword(m)}>
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Resetear contraseña
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(m.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile: Cards */}
      <div className="md:hidden space-y-3">
        {members.length === 0 ? (
          <div className="bg-white rounded-xl border-2 border-dashed border-neutral-200 py-12 text-center">
            <UserCircle2 size={32} className="mx-auto text-neutral-300 mb-2" />
            <p className="text-neutral-400">No hay miembros registrados</p>
          </div>
        ) : members.map((m) => (
          <div
            key={m.id}
            onClick={() => currentUserRole === 'admin' && openEdit(m)}
            className={`bg-white rounded-xl border border-neutral-200 overflow-hidden ${
              currentUserRole === 'admin' ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''
            }`}
          >
            <div className="p-4">
              <div className="flex items-start gap-3">
                {m.avatar_url ? (
                  <img
                    src={m.avatar_url}
                    alt={m.name}
                    className="w-16 h-16 rounded-full object-cover border border-neutral-200 shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-[#16273F]/10 flex items-center justify-center shrink-0">
                    <UserCircle2 size={32} className="text-[#16273F]/40" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[#16273F] mb-1">{m.name}</h3>
                  {m.position && (
                    <p className="text-sm text-neutral-500 mb-2">{m.position}</p>
                  )}
                  <Badge
                    className={
                      m.role === 'admin'
                        ? 'bg-[#16273F] text-white text-xs'
                        : 'bg-neutral-100 text-neutral-600 text-xs'
                    }
                  >
                    {m.role === 'admin' ? (
                      <Shield size={10} className="mr-1" />
                    ) : (
                      <Pencil size={10} className="mr-1" />
                    )}
                    {ROLE_LABELS[m.role]}
                  </Badge>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" className="w-[48px] h-[48px] p-0 shrink-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/okey-admin/miembro/${m.id}`); }}>
                      <User className="mr-2 h-4 w-4" />
                      Editar perfil público
                    </DropdownMenuItem>
                    {currentUserRole === 'admin' && (
                      <>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEdit(m); }}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleResetPassword(m); }}>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Resetear contraseña
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => { e.stopPropagation(); handleDelete(m.id); }}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingMember ? 'Editar miembro' : 'Nuevo miembro'}</DialogTitle>
          </DialogHeader>

          {lastPassword && (
            <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-sm">
              <p className="font-medium text-green-800 mb-1">¡Miembro creado!</p>
              <p className="text-green-700">
                Contraseña generada:{' '}
                <code className="font-mono bg-green-100 px-1 rounded">{lastPassword}</code>
              </p>
              <p className="text-green-600 text-xs mt-1">Guarda esta contraseña en un lugar seguro.</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label>Avatar / Foto</Label>
              <ImageUpload
                value={formData.avatar_url}
                onChange={(url) => setFormData({ ...formData, avatar_url: url })}
                folder="team"
                aspect="square"
                placeholder="Sube la foto del miembro"
              />
            </div>
            <div className="space-y-2">
              <Label>Nombre completo</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Ej: Ana García"
              />
            </div>
            <div className="space-y-2">
              <Label>Correo electrónico</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                placeholder="ana@okey.studio"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Cargo / Posición</Label>
                <Input
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="Ej: Diseñador UX"
                />
              </div>
              <div className="space-y-2">
                <Label>Rol</Label>
                <Select
                  value={formData.role}
                  onValueChange={(v) => setFormData({ ...formData, role: v as 'admin' | 'editor' })}
                >
                  <SelectTrigger className="h-[48px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={5}>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {!editingMember && !lastPassword && (
              <div className="space-y-2">
                <Label>Contraseña (opcional)</Label>
                <Input
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Se genera automáticamente"
                />
              </div>
            )}
            {editingMember && (
              <div className="space-y-2">
                <Label>Nueva contraseña (dejar vacío para no cambiar)</Label>
                <Input
                  type="text"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Nueva contraseña"
                />
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                {lastPassword ? 'Cerrar' : 'Cancelar'}
              </Button>
              {!lastPassword && (
                <Button type="submit" className="bg-[#16273F] hover:bg-[#16273F]/90">
                  {editingMember ? 'Actualizar' : 'Crear miembro'}
                </Button>
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}