import { useState, useEffect } from 'react';
import { Button } from '@/app/components/ui/button';
import { Camera, Calendar, Mail, Building2, Key, Info, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { ImageUpload } from '@/app/components/ImageUpload';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import defaultAvatar from 'figma:asset/d437c9f8bc7b17f25d772213f69a3a8471ef987f.png';
import { projectId, publicAnonKey } from '/utils/supabase/info';

interface Client {
  id: string;
  name: string;
  email: string;
  company?: string;
  avatar_url?: string;
  created_at: string;
}

interface ClientProfileProps {
  client: Client;
  onUpdate: (updatedClient: Client) => void;
}

export function ClientProfile({ client, onUpdate }: ClientProfileProps) {
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);
  const [tempAvatarUrl, setTempAvatarUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Estados para mostrar/ocultar contraseñas
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    loadClientProfile();
  }, [client.id]);

  const loadClientProfile = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-4cb2c9d0/client-profile/${client.id}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setTempAvatarUrl(data.avatar_url || '');
        onUpdate({ ...client, avatar_url: data.avatar_url, company: data.company });
      }
    } catch (error) {
      console.error('Error loading client profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleSaveAvatar = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-4cb2c9d0/client-profile/${client.id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ avatar_url: tempAvatarUrl }),
        }
      );

      if (!response.ok) throw new Error('Failed to update avatar');

      onUpdate({ ...client, avatar_url: tempAvatarUrl });
      toast.success('Foto de perfil actualizada');
      setIsAvatarDialogOpen(false);
    } catch (error) {
      console.error('Error updating avatar:', error);
      toast.error('Error al actualizar la foto');
    }
  };

  const handleChangePassword = async () => {
    // Validaciones
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error('Todos los campos son obligatorios');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-4cb2c9d0/client-profile/${client.id}/change-password`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            currentPassword: passwordForm.currentPassword,
            newPassword: passwordForm.newPassword
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        // Manejar errores específicos del servidor
        if (response.status === 401) {
          toast.error('La contraseña actual es incorrecta');
        } else {
          toast.error(data.error || 'Error al cambiar la contraseña');
        }
        return;
      }

      toast.success('✅ Contraseña actualizada correctamente');
      setIsPasswordDialogOpen(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      // Resetear los estados de visibilidad
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error('Error al conectar con el servidor');
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Avatar */}
          <div className="relative group flex-shrink-0 mx-auto md:mx-0">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-neutral-100 border-2 border-neutral-200">
              {isLoading ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#16273F]"></div>
                </div>
              ) : (
                <img
                  src={client.avatar_url || defaultAvatar}
                  alt={client.name}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <button
              onClick={() => {
                setTempAvatarUrl(client.avatar_url || '');
                setIsAvatarDialogOpen(true);
              }}
              className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Camera className="h-5 w-5 text-white" />
            </button>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 text-center md:text-left">
            <h2 className="text-xl font-bold text-[#16273F] mb-1">{client.name}</h2>
            <div className="space-y-1">
              <div className="hidden md:flex items-center gap-2 text-sm text-neutral-600">
                <Mail className="h-3.5 w-3.5" />
                <span className="truncate">{client.email}</span>
              </div>
              {client.company && (
                <div className="flex items-center justify-center md:justify-start gap-2 text-sm text-neutral-600">
                  <Building2 className="h-3.5 w-3.5" />
                  <span className="truncate">{client.company}</span>
                </div>
              )}
              <div className="hidden md:flex items-center gap-2 text-sm text-neutral-500">
                <Calendar className="h-3.5 w-3.5" />
                <span>Cliente desde {formatDate(client.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex md:flex-col gap-2 md:items-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsInfoDialogOpen(true)}
              className="md:hidden flex items-center justify-center gap-2 h-[48px] w-full"
            >
              <Info className="h-4 w-4" />
              <span>Ver Información</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPasswordDialogOpen(true)}
              className="hidden md:flex items-center gap-2 h-[48px] w-full md:w-auto"
            >
              <Key className="h-4 w-4" />
              <span>Cambiar Contraseña</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Avatar Upload Dialog */}
      <Dialog open={isAvatarDialogOpen} onOpenChange={setIsAvatarDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar Foto de Perfil</DialogTitle>
            <DialogDescription>
              Sube una nueva imagen para tu perfil
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <ImageUpload
              value={tempAvatarUrl}
              onChange={setTempAvatarUrl}
              folder="client-avatars"
              aspectRatio="1/1"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsAvatarDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveAvatar}
                className="bg-[#16273F] hover:bg-[#16273F]/90"
              >
                Guardar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Info Dialog - Mobile Only */}
      <Dialog open={isInfoDialogOpen} onOpenChange={setIsInfoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Información de la Cuenta</DialogTitle>
            <DialogDescription>
              Detalles de tu perfil y opciones de seguridad
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Email */}
            <div className="space-y-2">
              <Label className="text-xs text-neutral-500">Correo Electrónico</Label>
              <div className="flex items-center gap-2 text-sm text-neutral-900">
                <Mail className="h-4 w-4 text-neutral-400" />
                <span>{client.email}</span>
              </div>
            </div>

            {/* Company */}
            {client.company && (
              <div className="space-y-2">
                <Label className="text-xs text-neutral-500">Empresa</Label>
                <div className="flex items-center gap-2 text-sm text-neutral-900">
                  <Building2 className="h-4 w-4 text-neutral-400" />
                  <span>{client.company}</span>
                </div>
              </div>
            )}

            {/* Member Since */}
            <div className="space-y-2">
              <Label className="text-xs text-neutral-500">Miembro Desde</Label>
              <div className="flex items-center gap-2 text-sm text-neutral-900">
                <Calendar className="h-4 w-4 text-neutral-400" />
                <span>{formatDate(client.created_at)}</span>
              </div>
            </div>

            {/* Change Password Button */}
            <div className="pt-4 border-t border-neutral-200">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsInfoDialogOpen(false);
                  setIsPasswordDialogOpen(true);
                }}
                className="flex items-center justify-center gap-2 h-[48px] w-full"
              >
                <Key className="h-4 w-4" />
                <span>Cambiar Contraseña</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Password Change Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar Contraseña</DialogTitle>
            <DialogDescription>
              Ingresa tu contraseña actual y la nueva contraseña
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Contraseña Actual</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  placeholder="Contraseña actual"
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4 text-neutral-400 hover:text-neutral-600" />
                  ) : (
                    <Eye className="h-4 w-4 text-neutral-400 hover:text-neutral-600" />
                  )}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nueva Contraseña</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder="Nueva contraseña"
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4 text-neutral-400 hover:text-neutral-600" />
                  ) : (
                    <Eye className="h-4 w-4 text-neutral-400 hover:text-neutral-600" />
                  )}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  placeholder="Confirmar contraseña"
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-neutral-400 hover:text-neutral-600" />
                  ) : (
                    <Eye className="h-4 w-4 text-neutral-400 hover:text-neutral-600" />
                  )}
                </button>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsPasswordDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleChangePassword}
                className="bg-[#16273F] hover:bg-[#16273F]/90"
              >
                Guardar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}