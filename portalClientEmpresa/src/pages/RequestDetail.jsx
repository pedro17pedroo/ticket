import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Calendar,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    User,
    FileText,
    Tag,
    Loader2,
    Package,
    Box,
    Printer,
    Monitor,
    Wifi,
    Database,
    Server,
    HardDrive,
    Cpu,
    Laptop,
    Smartphone,
    Settings,
    Wrench,
    Users,
    UserPlus,
    Key,
    Lock,
    Shield,
    Mail,
    MessageSquare,
    Headphones,
    HelpCircle,
    Clipboard,
    Eye
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

// Icon mapping for catalog items
const iconMap = {
    Box, Printer, Monitor, Wifi, Database, Server, HardDrive, Cpu,
    Laptop, Smartphone, Package, FileText, Settings, Wrench,
    Users, UserPlus, Key, Lock, Shield, Mail, MessageSquare,
    Headphones, HelpCircle, Clipboard, Clock, CheckCircle,
    XCircle, AlertCircle, Eye, Calendar
};

// Helper function to get icon component from name
const getIconComponent = (iconName) => {
    if (!iconName) return null;
    return iconMap[iconName] || Package;
};

// Field label translations (English to Portuguese)
const fieldTranslations = {
    'additionalDetails': 'Detalhes Adicionais',
    'AdditionalDetails': 'Detalhes Adicionais',
    'userPriority': 'Prioridade',
    'UserPriority': 'Prioridade',
    'expectedResolutionTime': 'Data de Resolução Esperada',
    'ExpectedResolutionTime': 'Data de Resolução Esperada',
    'attachments': 'Anexos',
    'Attachments': 'Anexos',
    'description': 'Descrição',
    'subject': 'Assunto',
    'priority': 'Prioridade',
    'category': 'Categoria',
    'type': 'Tipo',
    'department': 'Departamento',
    'name': 'Nome',
    'email': 'Email',
    'phone': 'Telefone',
    'location': 'Localização',
    'notes': 'Notas',
    'comments': 'Comentários',
    'reason': 'Motivo',
    'quantity': 'Quantidade',
    'date': 'Data',
    'time': 'Hora',
    'startDate': 'Data de Início',
    'endDate': 'Data de Fim',
    'urgency': 'Urgência',
    'impact': 'Impacto'
};

// Priority translations
const priorityTranslations = {
    'baixa': 'Baixa',
    'low': 'Baixa',
    'media': 'Média',
    'medium': 'Média',
    'alta': 'Alta',
    'high': 'Alta',
    'critica': 'Crítica',
    'critical': 'Crítica',
    'urgente': 'Urgente',
    'urgent': 'Urgente'
};

// Item type translations
const itemTypeTranslations = {
    'service': 'Serviço',
    'incident': 'Incidente',
    'request': 'Requisição',
    'support': 'Suporte',
    'change': 'Mudança',
    'problem': 'Problema'
};

// Strip HTML tags from text
const stripHtml = (html) => {
    if (!html || typeof html !== 'string') return html;
    return html.replace(/<[^>]*>/g, '').trim();
};

// Get translated field label
const getFieldLabel = (key) => {
    return fieldTranslations[key] || key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim();
};

// Format field value for display
const formatFieldValue = (key, value) => {
    // Handle null/undefined
    if (value === null || value === undefined) return '-';

    // Handle empty arrays
    if (Array.isArray(value)) {
        if (value.length === 0) return 'Nenhum';
        return value.join(', ');
    }

    // Handle objects
    if (typeof value === 'object') {
        return JSON.stringify(value);
    }

    // Convert to string
    const strValue = String(value);

    // Handle empty strings
    if (!strValue.trim()) return '-';

    // Strip HTML tags
    const cleanValue = stripHtml(strValue);

    // Translate priorities
    const lowerKey = key.toLowerCase();
    if (lowerKey.includes('priority') || lowerKey.includes('prioridade')) {
        return priorityTranslations[cleanValue.toLowerCase()] || cleanValue;
    }

    // Format dates (ISO format detection)
    if (/^\d{4}-\d{2}-\d{2}/.test(cleanValue)) {
        try {
            const date = new Date(cleanValue);
            if (!isNaN(date.getTime())) {
                return format(date, 'dd/MM/yyyy', { locale: pt });
            }
        } catch {
            // Return as-is if parsing fails
        }
    }

    return cleanValue;
};

// Fields to hide from form data display
const hiddenFields = ['attachments', 'Attachments'];

// Check if a field should be displayed
const shouldDisplayField = (key, value) => {
    // Hide specific fields
    if (hiddenFields.includes(key)) return false;

    // Hide empty values
    if (value === null || value === undefined) return false;
    if (typeof value === 'string' && !value.trim()) return false;
    if (Array.isArray(value) && value.length === 0) return false;

    return true;
};

const RequestDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadRequest();
    }, [id]);

    const loadRequest = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/catalog/requests/${id}`);
            setRequest(response.data.data || response.data);
        } catch (error) {
            console.error('Erro ao carregar solicitação:', error);
            toast.error('Erro ao carregar detalhes da solicitação');
            navigate('/my-requests');
        } finally {
            setLoading(false);
        }
    };

    // Status configs
    const statusConfig = {
        pending_approval: {
            label: 'Aguardando Aprovação',
            icon: Clock,
            color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20',
            iconColor: 'text-yellow-600',
            description: 'Sua solicitação está aguardando aprovação.'
        },
        approved: {
            label: 'Aprovado',
            icon: CheckCircle,
            color: 'text-green-600 bg-green-100 dark:bg-green-900/20',
            iconColor: 'text-green-600',
            description: 'Sua solicitação foi aprovada e está sendo processada.'
        },
        rejected: {
            label: 'Rejeitado',
            icon: XCircle,
            color: 'text-red-600 bg-red-100 dark:bg-red-900/20',
            iconColor: 'text-red-600',
            description: 'Sua solicitação foi rejeitada.'
        },
        in_progress: {
            label: 'Em Andamento',
            icon: Clock,
            color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20',
            iconColor: 'text-blue-600',
            description: 'Sua solicitação está sendo trabalhada.'
        },
        completed: {
            label: 'Concluído',
            icon: CheckCircle,
            color: 'text-green-600 bg-green-100 dark:bg-green-900/20',
            iconColor: 'text-green-600',
            description: 'Sua solicitação foi concluída com sucesso.'
        },
        cancelled: {
            label: 'Cancelado',
            icon: XCircle,
            color: 'text-gray-600 bg-gray-100 dark:bg-gray-900/20',
            iconColor: 'text-gray-600',
            description: 'Esta solicitação foi cancelada.'
        }
    };

    const formatDate = (date) => {
        if (!date) return 'Data não disponível';
        return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: pt });
    };

    // Get translated item type
    const getItemType = (type) => {
        if (!type) return 'Serviço';
        return itemTypeTranslations[type.toLowerCase()] || type;
    };

    // Get estimated time display
    const getEstimatedTime = (time) => {
        if (!time) return null;
        if (typeof time === 'number') {
            if (time < 24) return `${time} horas`;
            const days = Math.floor(time / 24);
            return days === 1 ? '1 dia' : `${days} dias`;
        }
        return time;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    if (!request) {
        return (
            <div className="text-center py-12">
                <AlertCircle className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Solicitação não encontrada</h3>
                <button
                    onClick={() => navigate('/my-requests')}
                    className="mt-4 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg"
                >
                    Voltar às Minhas Solicitações
                </button>
            </div>
        );
    }

    const config = statusConfig[request.status] || statusConfig.pending_approval;
    const StatusIcon = config.icon;
    const CatalogIcon = getIconComponent(request.catalogItem?.icon);

    // Filter form data entries to display
    const formDataEntries = request.formData
        ? Object.entries(request.formData).filter(([key, value]) => shouldDisplayField(key, value))
        : [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/my-requests')}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold">Detalhes da Solicitação</h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        SR #{request.id}
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Service Info Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                        <div className="flex items-start gap-4">
                            <div className="w-14 h-14 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                                {CatalogIcon ? (
                                    <CatalogIcon className="w-7 h-7 text-primary-600 dark:text-primary-400" />
                                ) : (
                                    <Package className="w-7 h-7 text-primary-600 dark:text-primary-400" />
                                )}
                            </div>
                            <div className="flex-1">
                                <h2 className="text-xl font-semibold mb-1">
                                    {request.catalogItem?.name || 'Serviço Solicitado'}
                                </h2>
                                <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">
                                    {stripHtml(request.catalogItem?.shortDescription || request.catalogItem?.description) || 'Sem descrição disponível'}
                                </p>
                                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${config.color}`}>
                                    <StatusIcon className="w-4 h-4" />
                                    <span className="font-medium text-sm">{config.label}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Status Description */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-gray-400" />
                            Estado da Solicitação
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            {config.description}
                        </p>

                        {/* Approval Comments */}
                        {request.status === 'approved' && request.approvalComments && (
                            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <div className="text-sm font-medium text-green-800 dark:text-green-300 mb-1">
                                    Comentários de Aprovação
                                </div>
                                <p className="text-sm text-green-700 dark:text-green-400">
                                    {stripHtml(request.approvalComments)}
                                </p>
                            </div>
                        )}

                        {/* Rejection Reason */}
                        {request.status === 'rejected' && request.rejectionReason && (
                            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                <div className="text-sm font-medium text-red-800 dark:text-red-300 mb-1">
                                    Motivo da Rejeição
                                </div>
                                <p className="text-sm text-red-700 dark:text-red-400">
                                    {stripHtml(request.rejectionReason)}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Form Data */}
                    {formDataEntries.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                            <h3 className="font-semibold mb-4 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-gray-400" />
                                Detalhes do Formulário
                            </h3>
                            <div className="space-y-3">
                                {formDataEntries.map(([key, value]) => (
                                    <div key={key} className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                                        <span className="text-gray-500 dark:text-gray-400">
                                            {getFieldLabel(key)}
                                        </span>
                                        <span className="font-medium text-right max-w-[60%]">
                                            {formatFieldValue(key, value)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Linked Ticket */}
                    {request.ticketId && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                            <h3 className="font-semibold mb-4 flex items-center gap-2">
                                <Tag className="w-5 h-5 text-gray-400" />
                                Ticket Associado
                            </h3>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Ticket #{request.ticketId}
                                    </p>
                                    {request.ticket?.status && (
                                        <span className="mt-1 inline-block px-2 py-0.5 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                                            {request.ticket.status}
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={() => navigate(`/tickets/${request.ticketId}`)}
                                    className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg flex items-center gap-2 transition-colors"
                                >
                                    <Eye className="w-4 h-4" />
                                    Ver Ticket
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column - Metadata */}
                <div className="space-y-6">
                    {/* Timeline Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-gray-400" />
                            Cronologia
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                                    <FileText className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Solicitação Criada</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {formatDate(request.createdAt)}
                                    </p>
                                </div>
                            </div>

                            {request.approvedAt && (
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Aprovado</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {formatDate(request.approvedAt)}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {request.rejectedAt && (
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                                        <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Rejeitado</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {formatDate(request.rejectedAt)}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {request.updatedAt && request.updatedAt !== request.createdAt && (
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                                        <Clock className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Última Atualização</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {formatDate(request.updatedAt)}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Additional Info */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <User className="w-5 h-5 text-gray-400" />
                            Informações Adicionais
                        </h3>
                        <div className="space-y-3 text-sm">
                            {getEstimatedTime(request.catalogItem?.estimatedDeliveryTime) && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Tempo Estimado</span>
                                    <span className="font-medium">{getEstimatedTime(request.catalogItem.estimatedDeliveryTime)}</span>
                                </div>
                            )}
                            {request.catalogItem?.estimatedCost > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Custo Estimado</span>
                                    <span className="font-medium">€{request.catalogItem.estimatedCost.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Tipo</span>
                                <span className="font-medium">{getItemType(request.catalogItem?.itemType)}</span>
                            </div>
                            {request.catalogItem?.requiresApproval !== undefined && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Requer Aprovação</span>
                                    <span className="font-medium">{request.catalogItem.requiresApproval ? 'Sim' : 'Não'}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RequestDetail;

