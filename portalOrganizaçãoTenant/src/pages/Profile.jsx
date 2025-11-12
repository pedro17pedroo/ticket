import { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Camera, 
  Save,
  Bell,
  Globe,
  Palette,
  Shield,
  Eye,
  EyeOff
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import * as userService from '../services/userService';

const Profile = () => {
  const { user: currentUser, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Dados do perfil
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    avatar: ''
  });

  // Mudança de senha
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Preferências
  const [preferences, setPreferences] = useState({
    language: 'pt',
    timezone: 'Europe/Lisbon',
    theme: 'light',
    emailNotifications: true,
    browserNotifications: true,
    ticketAssigned: true,
    ticketUpdated: true,
    ticketCommented: true,
    slaWarning: true
  });

  useEffect(() => {
    if (currentUser) {
      setProfileData({
        name: currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        avatar: currentUser.avatar || ''
      });

      setPreferences({
        language: currentUser.settings?.language || 'pt',
        timezone: currentUser.settings?.timezone || 'Europe/Lisbon',
        theme: currentUser.settings?.theme || 'light',
        emailNotifications: currentUser.settings?.emailNotifications ?? true,
        browserNotifications: currentUser.settings?.browserNotifications ?? true,
        ticketAssigned: currentUser.settings?.notifications?.ticketAssigned ?? true,
        ticketUpdated: currentUser.settings?.notifications?.ticketUpdated ?? true,
        ticketCommented: currentUser.settings?.notifications?.ticketCommented ?? true,
        slaWarning: currentUser.settings?.notifications?.slaWarning ?? true
      });
    }
  }, [currentUser]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar tamanho (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 2MB');
      return;
    }

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      toast.error('O ficheiro deve ser uma imagem');
      return;
    }

    // Converter para base64
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileData(prev => ({ ...prev, avatar: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await userService.updateProfile(profileData);
      updateUser({ ...currentUser, ...profileData });
      toast.success('Perfil atualizado com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast.error('Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('As passwords não coincidem');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('A password deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      await userService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      toast.success('Password alterada com sucesso');
    } catch (error) {
      console.error('Erro ao alterar password:', error);
      toast.error(error.response?.data?.message || 'Erro ao alterar password');
    } finally {
      setLoading(false);
    }
  };

  const handlePreferencesSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await userService.updatePreferences(preferences);
      updateUser({ 
        ...currentUser, 
        settings: {
          ...currentUser.settings,
          ...preferences,
          notifications: {
            ticketAssigned: preferences.ticketAssigned,
            ticketUpdated: preferences.ticketUpdated,
            ticketCommented: preferences.ticketCommented,
            slaWarning: preferences.slaWarning
          }
        }
      });
      toast.success('Preferências atualizadas com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar preferências:', error);
      toast.error('Erro ao atualizar preferências');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'personal', label: 'Dados Pessoais', icon: User },
    { id: 'security', label: 'Segurança', icon: Lock },
    { id: 'preferences', label: 'Preferências', icon: Palette },
    { id: 'notifications', label: 'Notificações', icon: Bell }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Meu Perfil</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Gerir as suas informações pessoais e preferências
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
        {/* Dados Pessoais */}
        {activeTab === 'personal' && (
          <form onSubmit={handleProfileSubmit} className="p-6 space-y-6">
            {/* Avatar */}
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
                  {profileData.avatar ? (
                    <img src={profileData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    profileData.name?.charAt(0).toUpperCase() || 'U'
                  )}
                </div>
                <label className="absolute bottom-0 right-0 w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-700 transition-colors">
                  <Camera className="w-4 h-4 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{profileData.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{profileData.email}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Clique no ícone da câmera para alterar a foto
                </p>
              </div>
            </div>

            {/* Campos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nome Completo
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Telefone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Botão Guardar */}
            <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5" />
                {loading ? 'A guardar...' : 'Guardar Alterações'}
              </button>
            </div>
          </form>
        )}

        {/* Segurança */}
        {activeTab === 'security' && (
          <form onSubmit={handlePasswordSubmit} className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                Alterar Password
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Atualize a sua password para manter a conta segura
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password Atual
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className="w-full pl-10 pr-12 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nova Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full pl-10 pr-12 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Mínimo de 6 caracteres
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirmar Nova Password
                </label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5" />
                {loading ? 'A alterar...' : 'Alterar Password'}
              </button>
            </div>
          </form>
        )}

        {/* Preferências */}
        {activeTab === 'preferences' && (
          <form onSubmit={handlePreferencesSubmit} className="p-6 space-y-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Idioma
                  </div>
                </label>
                <select
                  value={preferences.language}
                  onChange={(e) => setPreferences(prev => ({ ...prev, language: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="pt">Português</option>
                  <option value="en">English</option>
                  <option value="es">Español</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fuso Horário
                </label>
                <select
                  value={preferences.timezone}
                  onChange={(e) => setPreferences(prev => ({ ...prev, timezone: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="Europe/Lisbon">Lisboa (GMT+0)</option>
                  <option value="Europe/London">Londres (GMT+0)</option>
                  <option value="America/New_York">Nova Iorque (GMT-5)</option>
                  <option value="America/Sao_Paulo">São Paulo (GMT-3)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    Tema
                  </div>
                </label>
                <select
                  value={preferences.theme}
                  onChange={(e) => setPreferences(prev => ({ ...prev, theme: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="light">Claro</option>
                  <option value="dark">Escuro</option>
                  <option value="auto">Automático</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5" />
                {loading ? 'A guardar...' : 'Guardar Preferências'}
              </button>
            </div>
          </form>
        )}

        {/* Notificações */}
        {activeTab === 'notifications' && (
          <form onSubmit={handlePreferencesSubmit} className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                Preferências de Notificações
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Controle como e quando recebe notificações
              </p>
            </div>

            <div className="space-y-4">
              {/* Canais de Notificação */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-white">Canais</h4>
                
                <label className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Notificações por E-mail</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Receber notificações por e-mail</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.emailNotifications}
                    onChange={(e) => setPreferences(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                    className="w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                  />
                </label>

                <label className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Notificações no Browser</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Receber notificações push</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.browserNotifications}
                    onChange={(e) => setPreferences(prev => ({ ...prev, browserNotifications: e.target.checked }))}
                    className="w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                  />
                </label>
              </div>

              {/* Eventos */}
              <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="font-medium text-gray-900 dark:text-white">Eventos</h4>
                
                <label className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Ticket Atribuído</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Quando um ticket for atribuído a mim</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.ticketAssigned}
                    onChange={(e) => setPreferences(prev => ({ ...prev, ticketAssigned: e.target.checked }))}
                    className="w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                  />
                </label>

                <label className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Ticket Atualizado</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Quando um ticket meu for atualizado</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.ticketUpdated}
                    onChange={(e) => setPreferences(prev => ({ ...prev, ticketUpdated: e.target.checked }))}
                    className="w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                  />
                </label>

                <label className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Novo Comentário</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Quando houver um novo comentário</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.ticketCommented}
                    onChange={(e) => setPreferences(prev => ({ ...prev, ticketCommented: e.target.checked }))}
                    className="w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                  />
                </label>

                <label className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Aviso de SLA</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Quando o SLA estiver prestes a expirar</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.slaWarning}
                    onChange={(e) => setPreferences(prev => ({ ...prev, slaWarning: e.target.checked }))}
                    className="w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                  />
                </label>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5" />
                {loading ? 'A guardar...' : 'Guardar Notificações'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Profile;
