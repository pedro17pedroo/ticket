import * as LucideIcons from 'lucide-react';

/**
 * Componente para renderizar ícones dinamicamente
 * Suporta:
 * - Emojis (ex: 📁, 💻)
 * - Nomes de ícones Lucide (ex: "Lock", "HardDrive", "Mail")
 */
const DynamicIcon = ({ icon, className = "w-6 h-6", style, fallback = "FolderOpen" }) => {
  // Se não houver ícone, usa o fallback
  if (!icon) {
    const FallbackIcon = LucideIcons[fallback] || LucideIcons.FolderOpen;
    return <FallbackIcon className={className} style={style} />;
  }

  // Mapeamentos comuns para ícones
  const iconMappings = {
    // Português
    'backup': 'HardDrive',
    'email': 'Mail',
    'comunicacao': 'Mail',
    'comunicação': 'Mail',
    'hardware': 'Monitor',
    'equipamentos': 'Monitor',
    'infraestrutura': 'Server',
    'servidores': 'Server',
    'outros': 'Package',
    'acesso': 'Lock',
    'autenticacao': 'Shield',
    'autenticação': 'Shield',
    'recuperacao': 'RotateCcw',
    'recuperação': 'RotateCcw',
    'rede': 'Wifi',
    'conectividade': 'Wifi',
    'seguranca': 'Shield',
    'segurança': 'Shield',
    'software': 'Package',
    'aplicacoes': 'AppWindow',
    'aplicações': 'AppWindow',
    'telefonia': 'Phone',
    'voip': 'Phone',
    'tecnologias': 'Monitor',
    'informacao': 'Monitor',
    'informação': 'Monitor',
    'facilities': 'Building',
    'recursos': 'Users',
    'humanos': 'Users',
    // English
    'communication': 'MessageSquare',
    'equipment': 'Monitor',
    'infrastructure': 'Server',
    'servers': 'Server',
    'other': 'Package',
    'access': 'Key',
    'authentication': 'Shield',
    'network': 'Wifi',
    'security': 'Shield',
    'applications': 'AppWindow',
    'telephony': 'Phone',
    'technology': 'Monitor',
    'information': 'Monitor',
    'human': 'Users',
    'resources': 'Users'
  };

  // Primeiro, tenta encontrar o ícone diretamente pelo nome
  // Normaliza o nome: "hard-drive" -> "HardDrive", "lock" -> "Lock"
  const normalizedName = icon
    .split(/[-_\s]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');

  // Tenta encontrar o ícone em várias formas
  const IconComponent = LucideIcons[normalizedName] || 
                       LucideIcons[icon] || 
                       LucideIcons[iconMappings[icon.toLowerCase()]] ||
                       LucideIcons[iconMappings[normalizedName.toLowerCase()]];

  if (IconComponent) {
    return <IconComponent className={className} style={style} />;
  }

  // Se for emoji (unicode) e não encontrou ícone Lucide, renderiza o emoji
  // Verifica se é realmente um emoji e não texto normal
  const isEmoji = /^[\p{Emoji_Presentation}\p{Extended_Pictographic}]+$/u.test(icon);
  if (isEmoji) {
    return <span className={className} style={style}>{icon}</span>;
  }

  // Fallback para ícone padrão
  const FallbackIcon = LucideIcons[fallback] || LucideIcons.FolderOpen;
  return <FallbackIcon className={className} style={style} />;
};

export default DynamicIcon;
