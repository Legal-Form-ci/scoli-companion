import { useState, useEffect } from "react";
import { 
  Cloud, 
  Save, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Loader2,
  HardDrive,
  Calendar,
  Link2,
  RefreshCw,
  Download,
  History
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface BackupConfig {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  provider: 'google_drive' | 'ovh' | 'local';
  retentionDays: number;
  lastBackup: string | null;
  nextBackup: string | null;
}

interface BackupHistory {
  date: string;
  provider: string;
  status: string;
}

const BackupSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [backupHistory, setBackupHistory] = useState<BackupHistory[]>([]);
  const [config, setConfig] = useState<BackupConfig>({
    enabled: false,
    frequency: 'daily',
    time: '02:00',
    provider: 'local',
    retentionDays: 30,
    lastBackup: null,
    nextBackup: null
  });
  const [credentials, setCredentials] = useState({
    googleDriveApiKey: '',
    ovhEndpoint: '',
    ovhAccessKey: '',
    ovhSecretKey: '',
    ovhBucket: ''
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Load config
      const { data: configData } = await supabase
        .from('platform_settings')
        .select('*')
        .eq('key', 'backup_config')
        .single();
      
      if (configData?.value) {
        const savedConfig = JSON.parse(configData.value);
        setConfig(prev => ({ ...prev, ...savedConfig }));
      }

      // Load credentials
      const { data: credData } = await supabase
        .from('platform_settings')
        .select('*')
        .eq('key', 'backup_credentials')
        .single();
      
      if (credData?.value) {
        const savedCreds = JSON.parse(credData.value);
        setCredentials(prev => ({ ...prev, ...savedCreds }));
      }

      // Load backup history
      await loadBackupHistory();
    } catch (error) {
      console.error('Error loading backup settings:', error);
    }
    setLoading(false);
  };

  const loadBackupHistory = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('cloud-backup', {
        body: { action: 'list_backups', provider: config.provider }
      });

      if (!error && data?.backups) {
        setBackupHistory(data.backups);
      }
    } catch (error) {
      console.error('Error loading backup history:', error);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      // Calculate next backup time
      const now = new Date();
      let nextBackup = new Date();
      
      switch (config.frequency) {
        case 'daily':
          nextBackup.setDate(now.getDate() + 1);
          break;
        case 'weekly':
          nextBackup.setDate(now.getDate() + 7);
          break;
        case 'monthly':
          nextBackup.setMonth(now.getMonth() + 1);
          break;
      }
      
      const [hours, minutes] = config.time.split(':');
      nextBackup.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const configToSave = {
        ...config,
        nextBackup: config.enabled ? nextBackup.toISOString() : null
      };

      await supabase
        .from('platform_settings')
        .upsert({
          key: 'backup_config',
          value: JSON.stringify(configToSave),
          description: 'Configuration de sauvegarde automatique'
        }, { onConflict: 'key' });

      // Save credentials if provider requires them
      if (config.provider !== 'local') {
        await supabase
          .from('platform_settings')
          .upsert({
            key: 'backup_credentials',
            value: JSON.stringify(credentials),
            description: 'Identifiants de connexion pour sauvegarde cloud'
          }, { onConflict: 'key' });
      }

      setConfig(configToSave);
      toast.success('Configuration enregistrée');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
    setSaving(false);
  };

  const testConnection = async () => {
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('cloud-backup', {
        body: { 
          action: 'test_connection', 
          provider: config.provider,
          credentials: config.provider !== 'local' ? credentials : undefined
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(data.message);
      } else {
        toast.error(data?.message || 'Échec du test de connexion');
      }
    } catch (error) {
      console.error('Connection test error:', error);
      toast.error('Erreur lors du test de connexion');
    }
    setTesting(false);
  };

  const runManualBackup = async () => {
    setBackingUp(true);
    toast.info('Sauvegarde en cours...');
    
    try {
      const { data, error } = await supabase.functions.invoke('cloud-backup', {
        body: { 
          action: 'backup', 
          provider: config.provider,
          credentials: config.provider !== 'local' ? credentials : undefined
        }
      });

      if (error) throw error;

      if (data?.success) {
        // For local provider, trigger download
        if (config.provider === 'local' && data.data) {
          const content = JSON.stringify(data.data, null, 2);
          const blob = new Blob([content], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = data.fileName || `scoly-backup-${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }

        // Update config with last backup time
        const newConfig = {
          ...config,
          lastBackup: new Date().toISOString()
        };
        setConfig(newConfig);

        toast.success(data.message || 'Sauvegarde terminée');
        
        // Refresh backup history
        await loadBackupHistory();
      } else {
        toast.error(data?.message || 'Échec de la sauvegarde');
      }
    } catch (error) {
      console.error('Backup error:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
    setBackingUp(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">Sauvegarde Automatique</h2>
          <p className="text-muted-foreground">Configurez les sauvegardes automatiques de votre base de données</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={runManualBackup} disabled={backingUp}>
            {backingUp ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            Sauvegarde manuelle
          </Button>
          <Button onClick={saveSettings} disabled={saving}>
            {saving ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
            Enregistrer
          </Button>
        </div>
      </div>

      {/* Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${config.enabled ? 'bg-green-100 dark:bg-green-900/20' : 'bg-muted'}`}>
                <Cloud className={`h-6 w-6 ${config.enabled ? 'text-green-600' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Statut</p>
                <p className="font-semibold text-foreground">
                  {config.enabled ? 'Activé' : 'Désactivé'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/20">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Dernière sauvegarde</p>
                <p className="font-semibold text-foreground">
                  {config.lastBackup 
                    ? new Date(config.lastBackup).toLocaleDateString('fr-FR', { 
                        day: 'numeric', 
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : 'Jamais'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/20">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Prochaine sauvegarde</p>
                <p className="font-semibold text-foreground">
                  {config.nextBackup && config.enabled
                    ? new Date(config.nextBackup).toLocaleDateString('fr-FR', { 
                        day: 'numeric', 
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : 'Non planifiée'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>Paramètres de sauvegarde automatique</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable Toggle */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="font-medium text-foreground">Activer les sauvegardes automatiques</p>
              <p className="text-sm text-muted-foreground">
                La base de données sera sauvegardée automatiquement selon la fréquence choisie
              </p>
            </div>
            <Switch
              checked={config.enabled}
              onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enabled: checked }))}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Frequency */}
            <div className="space-y-2">
              <Label>Fréquence</Label>
              <Select
                value={config.frequency}
                onValueChange={(value: 'daily' | 'weekly' | 'monthly') => 
                  setConfig(prev => ({ ...prev, frequency: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Quotidienne</SelectItem>
                  <SelectItem value="weekly">Hebdomadaire</SelectItem>
                  <SelectItem value="monthly">Mensuelle</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Time */}
            <div className="space-y-2">
              <Label>Heure</Label>
              <Input
                type="time"
                value={config.time}
                onChange={(e) => setConfig(prev => ({ ...prev, time: e.target.value }))}
              />
            </div>

            {/* Provider */}
            <div className="space-y-2">
              <Label>Destination</Label>
              <Select
                value={config.provider}
                onValueChange={(value: 'local' | 'google_drive' | 'ovh') => 
                  setConfig(prev => ({ ...prev, provider: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="local">
                    <div className="flex items-center gap-2">
                      <HardDrive size={16} />
                      Local (téléchargement)
                    </div>
                  </SelectItem>
                  <SelectItem value="google_drive">
                    <div className="flex items-center gap-2">
                      <Cloud size={16} />
                      Google Drive
                    </div>
                  </SelectItem>
                  <SelectItem value="ovh">
                    <div className="flex items-center gap-2">
                      <Cloud size={16} />
                      OVH Object Storage
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Retention */}
            <div className="space-y-2">
              <Label>Rétention (jours)</Label>
              <Input
                type="number"
                value={config.retentionDays}
                onChange={(e) => setConfig(prev => ({ ...prev, retentionDays: parseInt(e.target.value) || 30 }))}
                min={1}
                max={365}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Provider Credentials */}
      {config.provider !== 'local' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 size={20} />
              Connexion {config.provider === 'google_drive' ? 'Google Drive' : 'OVH'}
            </CardTitle>
            <CardDescription>
              Configurez les identifiants de connexion
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {config.provider === 'google_drive' && (
              <div className="space-y-2">
                <Label>Clé API Google Drive</Label>
                <Input
                  type="password"
                  value={credentials.googleDriveApiKey}
                  onChange={(e) => setCredentials(prev => ({ ...prev, googleDriveApiKey: e.target.value }))}
                  placeholder="Entrez votre clé API"
                />
                <p className="text-xs text-muted-foreground">
                  Créez une clé API dans la <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Cloud Console</a>
                </p>
              </div>
            )}

            {config.provider === 'ovh' && (
              <>
                <div className="space-y-2">
                  <Label>Endpoint S3</Label>
                  <Input
                    value={credentials.ovhEndpoint}
                    onChange={(e) => setCredentials(prev => ({ ...prev, ovhEndpoint: e.target.value }))}
                    placeholder="https://s3.gra.cloud.ovh.net"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Access Key</Label>
                    <Input
                      type="password"
                      value={credentials.ovhAccessKey}
                      onChange={(e) => setCredentials(prev => ({ ...prev, ovhAccessKey: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Secret Key</Label>
                    <Input
                      type="password"
                      value={credentials.ovhSecretKey}
                      onChange={(e) => setCredentials(prev => ({ ...prev, ovhSecretKey: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Nom du bucket</Label>
                  <Input
                    value={credentials.ovhBucket}
                    onChange={(e) => setCredentials(prev => ({ ...prev, ovhBucket: e.target.value }))}
                    placeholder="scoly-backups"
                  />
                </div>
              </>
            )}

            <Button variant="outline" onClick={testConnection} disabled={testing}>
              {testing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              Tester la connexion
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Backup History */}
      {backupHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History size={20} />
              Historique des sauvegardes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {backupHistory.map((backup, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-foreground">
                        {new Date(backup.date).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {backup.provider === 'local' ? 'Téléchargement local' : 
                         backup.provider === 'google_drive' ? 'Google Drive' : 'OVH'}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-green-600 font-medium">Complété</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info */}
      <Card className="border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-800 dark:text-blue-200">Information</p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Les sauvegardes locales sont téléchargées sur votre appareil. Pour les sauvegardes cloud 
                (Google Drive ou OVH), configurez les identifiants et testez la connexion avant d'activer.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BackupSettings;
