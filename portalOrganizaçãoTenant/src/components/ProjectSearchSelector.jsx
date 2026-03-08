import { useState, useEffect, useRef } from 'react';
import { Search, Briefcase, CheckCircle2, ChevronDown, Calendar } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const ProjectSearchSelector = ({ bankId, onSelect, selectedProject }) => {
  const [search, setSearch] = useState('');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Buscar projetos com debounce
  useEffect(() => {
    if (search.length >= 2 && isOpen) {
      const timer = setTimeout(() => {
        searchProjects();
      }, 500);

      return () => clearTimeout(timer);
    } else if (search.length < 2) {
      setProjects([]);
    }
  }, [search, isOpen]);

  const searchProjects = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/hours-banks/${bankId}/available-projects`, {
        params: { search }
      });
      
      setProjects(data.projects || []);
    } catch (error) {
      console.error('Erro ao buscar projetos:', error);
      toast.error('Erro ao buscar projetos');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProject = (project) => {
    onSelect(project);
    setIsOpen(false);
    setSearch('');
  };

  const handleClearSelection = () => {
    onSelect(null);
    setSearch('');
    setProjects([]);
  };

  const calculateEstimatedHours = (project) => {
    if (!project.startDate || !project.estimatedEndDate) return null;
    
    const start = new Date(project.startDate);
    const end = new Date(project.estimatedEndDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Assumindo 8 horas por dia útil (5 dias por semana)
    const workDays = Math.floor(diffDays * (5/7));
    return workDays * 8;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        Buscar Projeto *
      </label>
      
      {/* Select-style button */}
      {!selectedProject ? (
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 transition-all text-base text-left flex items-center justify-between"
          >
            <span className="text-gray-500 dark:text-gray-400">
              Selecione um projeto...
            </span>
            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown */}
          {isOpen && (
            <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
              {/* Search input inside dropdown */}
              <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Digite o nome do projeto..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 transition-all text-sm"
                    autoFocus
                  />
                  {loading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-500 border-t-transparent"></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Results */}
              <div className="max-h-80 overflow-y-auto">
                {search.length < 2 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    Digite pelo menos 2 caracteres para buscar
                  </div>
                ) : projects.length === 0 && !loading ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    Nenhum projeto encontrado
                  </div>
                ) : (
                  <div className="py-1">
                    {projects.map((project) => {
                      const estimatedHours = calculateEstimatedHours(project);
                      
                      return (
                        <button
                          key={project.id}
                          type="button"
                          onClick={() => handleSelectProject(project)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-gray-900 dark:text-white">
                                  {project.name}
                                </span>
                                <span className={`px-2 py-0.5 text-xs rounded-full ${
                                  project.status === 'em_andamento'
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                                    : project.status === 'concluido'
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                }`}>
                                  {project.status === 'em_andamento' ? 'Em andamento' : 
                                   project.status === 'concluido' ? 'Concluído' : 
                                   project.status}
                                </span>
                              </div>
                              {project.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                                  {project.description}
                                </p>
                              )}
                              <div className="flex items-center gap-4 text-xs">
                                {estimatedHours && (
                                  <div className="flex items-center gap-1">
                                    <Briefcase className="w-3 h-3 text-gray-400" />
                                    <span className="font-medium text-gray-700 dark:text-gray-300">
                                      ~{estimatedHours}h estimadas
                                    </span>
                                  </div>
                                )}
                                {project.estimatedEndDate && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3 text-gray-400" />
                                    <span className="text-gray-600 dark:text-gray-400">
                                      Entrega: {new Date(project.estimatedEndDate).toLocaleDateString('pt-BR')}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Selected Project Display */
        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-500 rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-5 h-5 text-purple-600" />
                <span className="font-semibold text-purple-900 dark:text-purple-100">
                  {selectedProject.name}
                </span>
              </div>
              {selectedProject.description && (
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  {selectedProject.description}
                </p>
              )}
              <div className="flex items-center gap-4 text-sm">
                {selectedProject.estimatedHours && (
                  <div className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      Estimativa: {selectedProject.estimatedHours}h
                    </span>
                  </div>
                )}
                {selectedProject.estimatedEndDate && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700 dark:text-gray-300">
                      {new Date(selectedProject.estimatedEndDate).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={handleClearSelection}
              className="text-purple-600 hover:text-purple-700 text-sm font-medium"
            >
              Alterar
            </button>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        Projetos disponíveis para consumo de horas
      </p>
    </div>
  );
};

export default ProjectSearchSelector;
