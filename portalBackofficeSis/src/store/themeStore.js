import { create } from 'zustand';

// Função para obter tema salvo do localStorage
const getSavedTheme = () => {
  try {
    const saved = localStorage.getItem('theme');
    return saved || 'light';
  } catch {
    return 'light';
  }
};

// Função para salvar tema no localStorage
const saveTheme = (theme) => {
  try {
    localStorage.setItem('theme', theme);
  } catch (error) {
    console.error('Erro ao salvar tema:', error);
  }
};

const useThemeStore = create((set, get) => ({
  theme: getSavedTheme(), // 'light' | 'dark'
  
  toggleTheme: () => {
    const currentTheme = get().theme;
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    // Aplicar tema no documento
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Salvar no localStorage
    saveTheme(newTheme);
    
    set({ theme: newTheme });
  },
  
  setTheme: (theme) => {
    // Aplicar tema no documento
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Salvar no localStorage
    saveTheme(theme);
    
    set({ theme });
  },
  
  initTheme: () => {
    const currentTheme = get().theme;
    
    // Aplicar tema salvo ao carregar
    if (currentTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
}));

export default useThemeStore;
