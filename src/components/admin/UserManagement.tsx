import { useState, useEffect } from "react";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  UserPlus,
  Shield,
  ShieldCheck,
  ShieldAlert,
  User,
  Mail,
  Phone,
  Eye,
  EyeOff,
  Truck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/i18n/LanguageContext";

type AppRole = 'super_admin' | 'admin' | 'moderator' | 'commercial' | 'comptable' | 'referent' | 'user' | 'vendor' | 'delivery';

const ROLE_OPTIONS: AppRole[] = ['super_admin','admin','moderator','commercial','comptable','referent','user'];

interface UserWithRoles {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  created_at: string;
  roles: AppRole[];
}

// Super admin ID that cannot be modified
const SUPER_ADMIN_ID = '24cc1ed2-040f-4ad7-8413-a416518fb684';

const UserManagement = () => {
  const { language } = useLanguage();
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithRoles | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    phone: "",
    roles: [] as AppRole[]
  });

  const texts = {
    fr: {
      title: "Gestion des utilisateurs",
      addUser: "Ajouter un utilisateur",
      editUser: "Modifier l'utilisateur",
      search: "Rechercher un utilisateur...",
      email: "Email",
      password: "Mot de passe",
      firstName: "Prénom",
      lastName: "Nom",
      phone: "Téléphone",
      roles: "Rôles",
      actions: "Actions",
      date: "Date d'inscription",
      save: "Enregistrer",
      cancel: "Annuler",
      delete: "Supprimer",
      confirmDelete: "Êtes-vous sûr de vouloir supprimer cet utilisateur ?",
      userCreated: "Utilisateur créé avec succès",
      userUpdated: "Utilisateur modifié avec succès",
      userDeleted: "Utilisateur supprimé",
      error: "Une erreur est survenue",
      totalUsers: "Total utilisateurs",
      admins: "Administrateurs",
      moderators: "Modérateurs",
      vendors: "Vendeurs",
      deliverers: "Livreurs",
      roleAdmin: "Administrateur",
      roleModerator: "Modérateur",
      roleUser: "Utilisateur",
      roleVendor: "Vendeur",
      roleDelivery: "Livreur",
      noUsers: "Aucun utilisateur trouvé",
      passwordHint: "Min. 8 caractères",
    },
    en: {
      title: "User Management",
      addUser: "Add User",
      editUser: "Edit User",
      search: "Search users...",
      email: "Email",
      password: "Password",
      firstName: "First Name",
      lastName: "Last Name",
      phone: "Phone",
      roles: "Roles",
      actions: "Actions",
      date: "Registration Date",
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      confirmDelete: "Are you sure you want to delete this user?",
      userCreated: "User created successfully",
      userUpdated: "User updated successfully",
      userDeleted: "User deleted",
      error: "An error occurred",
      totalUsers: "Total Users",
      admins: "Admins",
      moderators: "Moderators",
      vendors: "Vendors",
      deliverers: "Deliverers",
      roleAdmin: "Admin",
      roleModerator: "Moderator",
      roleUser: "User",
      roleVendor: "Vendor",
      roleDelivery: "Delivery",
      noUsers: "No users found",
      passwordHint: "Min. 8 characters",
    },
    de: {
      title: "Benutzerverwaltung",
      addUser: "Benutzer hinzufügen",
      editUser: "Benutzer bearbeiten",
      search: "Benutzer suchen...",
      email: "E-Mail",
      password: "Passwort",
      firstName: "Vorname",
      lastName: "Nachname",
      phone: "Telefon",
      roles: "Rollen",
      actions: "Aktionen",
      date: "Registrierungsdatum",
      save: "Speichern",
      cancel: "Abbrechen",
      delete: "Löschen",
      confirmDelete: "Sind Sie sicher, dass Sie diesen Benutzer löschen möchten?",
      userCreated: "Benutzer erfolgreich erstellt",
      userUpdated: "Benutzer erfolgreich aktualisiert",
      userDeleted: "Benutzer gelöscht",
      error: "Ein Fehler ist aufgetreten",
      totalUsers: "Benutzer gesamt",
      admins: "Administratoren",
      moderators: "Moderatoren",
      vendors: "Verkäufer",
      deliverers: "Lieferanten",
      roleAdmin: "Admin",
      roleModerator: "Moderator",
      roleUser: "Benutzer",
      roleVendor: "Verkäufer",
      roleDelivery: "Lieferant",
      noUsers: "Keine Benutzer gefunden",
      passwordHint: "Mind. 8 Zeichen",
    },
    es: {
      title: "Gestión de usuarios",
      addUser: "Agregar usuario",
      editUser: "Editar usuario",
      search: "Buscar usuarios...",
      email: "Correo",
      password: "Contraseña",
      firstName: "Nombre",
      lastName: "Apellido",
      phone: "Teléfono",
      roles: "Roles",
      actions: "Acciones",
      date: "Fecha de registro",
      save: "Guardar",
      cancel: "Cancelar",
      delete: "Eliminar",
      confirmDelete: "¿Está seguro de que desea eliminar este usuario?",
      userCreated: "Usuario creado exitosamente",
      userUpdated: "Usuario actualizado exitosamente",
      userDeleted: "Usuario eliminado",
      error: "Ocurrió un error",
      totalUsers: "Total usuarios",
      admins: "Administradores",
      moderators: "Moderadores",
      vendors: "Vendedores",
      deliverers: "Repartidores",
      roleAdmin: "Admin",
      roleModerator: "Moderador",
      roleUser: "Usuario",
      roleVendor: "Vendedor",
      roleDelivery: "Repartidor",
      noUsers: "No se encontraron usuarios",
      passwordHint: "Mín. 8 caracteres",
    },
  };

  const t = texts[language] || texts.fr;

  useEffect(() => {
    fetchUsers();

    // Realtime subscription
    const channel = supabase
      .channel('user-management')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchUsers)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_roles' }, fetchUsers)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    
    // Fetch profiles with their roles
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, phone, created_at")
      .order("created_at", { ascending: false });

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      setLoading(false);
      return;
    }

    // Fetch all roles
    const { data: roles, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id, role");

    if (rolesError) {
      console.error("Error fetching roles:", rolesError);
    }

    // Combine profiles with roles
    const usersWithRoles: UserWithRoles[] = profiles.map(profile => {
      const userRoles = roles?.filter(r => r.user_id === profile.id).map(r => r.role as AppRole) || [];
      return {
        id: profile.id,
        email: '', // We'll need to get this from auth if needed
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone: profile.phone,
        created_at: profile.created_at || '',
        roles: userRoles.length > 0 ? userRoles : ['user']
      };
    });

    setUsers(usersWithRoles);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (editingUser) {
      // Update user profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone
        })
        .eq("id", editingUser.id);

      if (profileError) {
        toast.error(t.error);
        return;
      }

      // Prevent role modification for super admin
      if (editingUser.id === SUPER_ADMIN_ID) {
        toast.success(t.userUpdated);
        setIsDialogOpen(false);
        resetForm();
        fetchUsers();
        return;
      }

      // Update roles - delete existing and insert new
      console.log('Deleting existing roles for user:', editingUser.id);
      const { error: deleteError, count: deleteCount } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", editingUser.id);

      if (deleteError) {
        console.error('Error deleting roles:', deleteError);
        toast.error(t.error + ': ' + deleteError.message);
        return;
      }
      console.log('Deleted roles count:', deleteCount);

      // Always insert at least one role (default to 'user' if none selected)
      const rolesToInsert = formData.roles.length > 0 ? formData.roles : ['user'];
      const validDbRoles = rolesToInsert.filter((role) =>
        ROLE_OPTIONS.includes(role as AppRole) || ['vendor','delivery'].includes(role)
      );

      console.log('Roles to insert:', validDbRoles);

      const roleInserts = validDbRoles.map((role) => ({
        user_id: editingUser.id,
        role: role as AppRole,
      }));

      if (roleInserts.length > 0) {
        console.log('Inserting roles:', roleInserts);
        const { error: insertError, data: insertedRoles } = await supabase
          .from("user_roles")
          .insert(roleInserts)
          .select();

        if (insertError) {
          console.error('Error inserting roles:', insertError);
          toast.error(t.error + ': ' + insertError.message);
          return;
        }
        console.log('Inserted roles:', insertedRoles);
      }

      toast.success(t.userUpdated);
    } else {
      // Create new user via edge function
      const { data: session } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: formData.email,
          password: formData.password,
          firstName: formData.first_name,
          lastName: formData.last_name,
          phone: formData.phone,
          roles: formData.roles.length > 0 ? formData.roles : ['user']
        }
      });

      if (error) {
        console.error('Create user error:', error);
        toast.error(error.message || t.error);
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      toast.success(t.userCreated);
    }

    setIsDialogOpen(false);
    resetForm();
    fetchUsers();
  };

  const handleEdit = (user: UserWithRoles) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: "",
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      phone: user.phone || "",
      roles: user.roles
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (userId: string) => {
    // Prevent deletion of super admin
    if (userId === SUPER_ADMIN_ID) {
      toast.error("Impossible de supprimer le compte Super Admin");
      return;
    }

    if (!confirm(t.confirmDelete)) return;

    // Delete user roles
    await supabase.from("user_roles").delete().eq("user_id", userId);
    
    // Delete profile (user will still exist in auth)
    const { error } = await supabase.from("profiles").delete().eq("id", userId);

    if (error) {
      toast.error(t.error);
    } else {
      toast.success(t.userDeleted);
      fetchUsers();
    }
  };

  const isSuperAdmin = (userId: string) => userId === SUPER_ADMIN_ID;

  const resetForm = () => {
    setEditingUser(null);
    setFormData({
      email: "",
      password: "",
      first_name: "",
      last_name: "",
      phone: "",
      roles: ["user"]
    });
  };

  const toggleRole = (role: AppRole) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role]
    }));
  };

  const getRoleBadge = (role: AppRole) => {
    const roleConfig: Record<AppRole, { label: string; icon: typeof ShieldAlert; className: string }> = {
      super_admin: { label: 'Super Admin', icon: ShieldAlert, className: "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/30 dark:text-fuchsia-400" },
      admin: { label: t.roleAdmin, icon: ShieldAlert, className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
      moderator: { label: t.roleModerator, icon: ShieldCheck, className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
      commercial: { label: 'Commercial / Livreur', icon: Truck, className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" },
      comptable: { label: 'Comptable', icon: Shield, className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" },
      referent: { label: 'Référent', icon: Shield, className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" },
      vendor: { label: t.roleVendor, icon: Shield, className: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" },
      delivery: { label: t.roleDelivery, icon: Truck, className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" },
      user: { label: t.roleUser, icon: User, className: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400" }
    };

    const config = roleConfig[role] ?? roleConfig.user;
    const Icon = config.icon;

    return (
      <Badge key={role} className={config.className}>
        <Icon size={12} className="mr-1" />
        {config.label}
      </Badge>
    );
  };

  const filteredUsers = users.filter(u =>
    (u.first_name?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (u.last_name?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (u.phone?.toLowerCase() || '').includes(search.toLowerCase())
  );

  const stats = {
    total: users.length,
    admins: users.filter(u => u.roles.includes('admin')).length,
    moderators: users.filter(u => u.roles.includes('moderator')).length,
    vendors: users.filter(u => u.roles.includes('vendor')).length,
    deliverers: users.filter(u => u.roles.includes('delivery')).length
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-display font-bold text-foreground">{t.title}</h1>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button variant="hero">
              <UserPlus size={18} />
              {t.addUser}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingUser ? t.editUser : t.addUser}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {!editingUser && (
                <>
                  <div>
                    <Label>{t.email} *</Label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input 
                        type="email"
                        value={formData.email} 
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="pl-10"
                        placeholder="email@example.com"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>{t.password} *</Label>
                    <div className="relative">
                      <Input 
                        type={showPassword ? "text" : "password"}
                        value={formData.password} 
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder={t.passwordHint}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t.firstName}</Label>
                  <Input 
                    value={formData.first_name} 
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{t.lastName}</Label>
                  <Input 
                    value={formData.last_name} 
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>{t.phone}</Label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    value={formData.phone} 
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="pl-10"
                    placeholder="+225 07 00 00 00 00"
                  />
                </div>
              </div>

              <div>
                <Label className="mb-3 block">{t.roles}</Label>
                <div className="grid grid-cols-2 gap-3">
                  {ROLE_OPTIONS.map(role => (
                    <label 
                      key={role} 
                      className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-muted cursor-pointer transition-colors"
                    >
                      <Checkbox 
                        checked={formData.roles.includes(role)} 
                        onCheckedChange={() => toggleRole(role)}
                      />
                      {getRoleBadge(role)}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>
                  {t.cancel}
                </Button>
                <Button className="flex-1" onClick={handleSubmit}>
                  {t.save}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.totalUsers}</p>
                <p className="text-xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <ShieldAlert className="h-4 w-4 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.admins}</p>
                <p className="text-xl font-bold">{stats.admins}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <ShieldCheck className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.moderators}</p>
                <p className="text-xl font-bold">{stats.moderators}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Shield className="h-4 w-4 text-purple-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.vendors}</p>
                <p className="text-xl font-bold">{stats.vendors}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Truck className="h-4 w-4 text-orange-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.deliverers}</p>
                <p className="text-xl font-bold">{stats.deliverers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t.search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t.firstName}</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t.lastName}</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t.phone}</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t.roles}</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t.date}</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-t border-border">
                  <td className="py-3 px-4 font-medium">
                    {user.first_name || "-"}
                    {user.id === SUPER_ADMIN_ID && (
                      <span className="ml-2 text-xs text-primary font-semibold">(Super Admin)</span>
                    )}
                  </td>
                  <td className="py-3 px-4">{user.last_name || "-"}</td>
                  <td className="py-3 px-4 text-muted-foreground">{user.phone || "-"}</td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map(role => getRoleBadge(role))}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : "-"}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(user)}>
                        <Edit size={16} />
                      </Button>
                      {user.id !== SUPER_ADMIN_ID && (
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(user.id)}>
                          <Trash2 size={16} className="text-destructive" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    {t.noUsers}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
