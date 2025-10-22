import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  pt: {
    translation: {
      // Navegação
      nav: {
        dashboard: 'Dashboard',
        tickets: 'Tickets',
        clients: 'Clientes',
        departments: 'Departamentos',
        knowledge: 'Base de Conhecimento',
        reports: 'Relatórios',
        settings: 'Configurações',
      },
      // Comuns
      common: {
        save: 'Guardar',
        cancel: 'Cancelar',
        delete: 'Eliminar',
        edit: 'Editar',
        create: 'Criar',
        search: 'Pesquisar',
        filter: 'Filtrar',
        logout: 'Sair',
        loading: 'A carregar...',
        error: 'Erro',
        success: 'Sucesso',
      },
      // Tickets
      tickets: {
        title: 'Gestão de Tickets',
        new: 'Novo Ticket',
        status: 'Estado',
        priority: 'Prioridade',
        type: 'Tipo',
        subject: 'Assunto',
        description: 'Descrição',
      }
    }
  },
  en: {
    translation: {
      nav: {
        dashboard: 'Dashboard',
        tickets: 'Tickets',
        clients: 'Clients',
        departments: 'Departments',
        knowledge: 'Knowledge Base',
        reports: 'Reports',
        settings: 'Settings',
      },
      common: {
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        create: 'Create',
        search: 'Search',
        filter: 'Filter',
        logout: 'Logout',
        loading: 'Loading...',
        error: 'Error',
        success: 'Success',
      },
      tickets: {
        title: 'Ticket Management',
        new: 'New Ticket',
        status: 'Status',
        priority: 'Priority',
        type: 'Type',
        subject: 'Subject',
        description: 'Description',
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'pt',
    fallbackLng: 'pt',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
