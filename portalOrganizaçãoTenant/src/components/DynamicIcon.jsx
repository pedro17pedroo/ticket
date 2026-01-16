import * as LucideIcons from 'lucide-react';

/**
 * Componente para renderizar ícones dinamicamente
 * Suporta:
 * - Emojis (ex: 📁, 💻)
 * - Nomes de ícones Lucide (ex: "Lock", "HardDrive", "Mail")
 */
const DynamicIcon = ({ icon, className = "w-6 h-6", fallback = "FolderOpen" }) => {
  // Se não houver ícone, usa o fallback
  if (!icon) {
    const FallbackIcon = LucideIcons[fallback] || LucideIcons.FolderOpen;
    return <FallbackIcon className={className} />;
  }

  // Se for emoji (unicode), renderiza o emoji
  if (/\p{Emoji}/u.test(icon) && icon.length <= 4) {
    return <span className="text-xl">{icon}</span>;
  }

  // Se for nome de ícone Lucide, tenta renderizar
  // Normaliza o nome: "hard-drive" -> "HardDrive", "lock" -> "Lock"
  const normalizedName = icon
    .split(/[-_\s]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');

  const IconComponent = LucideIcons[normalizedName] || LucideIcons[icon];

  if (IconComponent) {
    return <IconComponent className={className} />;
  }

  // Fallback para ícone padrão
  const FallbackIcon = LucideIcons[fallback] || LucideIcons.FolderOpen;
  return <FallbackIcon className={className} />;
};

export default DynamicIcon;
