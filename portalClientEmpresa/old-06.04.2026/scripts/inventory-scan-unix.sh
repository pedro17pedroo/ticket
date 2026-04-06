#!/bin/bash

# TatuTicket - Script de Coleta de Inventário para Linux/Mac
# Execute com: bash inventory-scan-unix.sh --token "SEU_TOKEN"

API_URL="http://localhost:3000/api"
TOKEN=""
ASSET_TAG=""

# Parse argumentos
while [[ $# -gt 0 ]]; do
    case $1 in
        --token)
            TOKEN="$2"
            shift 2
            ;;
        --api-url)
            API_URL="$2"
            shift 2
            ;;
        --asset-tag)
            ASSET_TAG="$2"
            shift 2
            ;;
        *)
            echo "Argumento desconhecido: $1"
            shift
            ;;
    esac
done

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}🔍 TatuTicket - Coleta de Inventário${NC}"
echo -e "${CYAN}=====================================${NC}"
echo ""

# Verificar token
if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ ERRO: Token de autenticação não fornecido!${NC}"
    echo -e "${YELLOW}Uso: bash inventory-scan-unix.sh --token 'SEU_TOKEN_AQUI'${NC}"
    exit 1
fi

echo -e "${GREEN}📊 Coletando informações do sistema...${NC}"

# Detectar SO
if [[ "$OSTYPE" == "darwin"* ]]; then
    OS_TYPE="macOS"
    IS_MAC=true
else
    OS_TYPE="Linux"
    IS_MAC=false
fi

# Função para obter informações do Mac
get_mac_info() {
    MANUFACTURER="Apple"
    MODEL=$(sysctl -n hw.model)
    SERIAL_NUMBER=$(ioreg -l | grep IOPlatformSerialNumber | awk '{print $4}' | tr -d '"')
    PROCESSOR=$(sysctl -n machdep.cpu.brand_string)
    PROCESSOR_CORES=$(sysctl -n hw.physicalcpu)
    RAM_BYTES=$(sysctl -n hw.memsize)
    RAM_GB=$(echo "scale=2; $RAM_BYTES/1073741824" | bc)
    OS_NAME="macOS"
    OS_VERSION=$(sw_vers -productVersion)
    OS_BUILD=$(sw_vers -buildVersion)
    ARCH=$(uname -m)
    
    # Disco
    STORAGE_BYTES=$(diskutil info / | grep "Disk Size" | awk '{print $3}')
    STORAGE_GB=$(echo "scale=2; $STORAGE_BYTES/1000000000" | bc)
}

# Função para obter informações do Linux
get_linux_info() {
    MANUFACTURER=$(cat /sys/class/dmi/id/sys_vendor 2>/dev/null || echo "Unknown")
    MODEL=$(cat /sys/class/dmi/id/product_name 2>/dev/null || echo "Unknown")
    SERIAL_NUMBER=$(cat /sys/class/dmi/id/product_serial 2>/dev/null || echo "Unknown")
    PROCESSOR=$(cat /proc/cpuinfo | grep "model name" | head -1 | cut -d':' -f2 | xargs)
    PROCESSOR_CORES=$(nproc)
    RAM_BYTES=$(free -b | grep Mem | awk '{print $2}')
    RAM_GB=$(echo "scale=2; $RAM_BYTES/1073741824" | bc)
    
    # SO
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS_NAME=$NAME
        OS_VERSION=$VERSION_ID
    else
        OS_NAME="Linux"
        OS_VERSION=$(uname -r)
    fi
    
    OS_BUILD=$(uname -r)
    ARCH=$(uname -m)
    
    # Disco
    STORAGE_BYTES=$(df -B1 / | tail -1 | awk '{print $2}')
    STORAGE_GB=$(echo "scale=2; $STORAGE_BYTES/1073741824" | bc)
}

# Obter informações baseado no SO
if [ "$IS_MAC" = true ]; then
    get_mac_info
else
    get_linux_info
fi

# Informações de rede
HOSTNAME=$(hostname)
IP_ADDRESS=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
MAC_ADDRESS=$(ifconfig | grep ether | awk '{print $2}' | head -1)

# Antivírus (básico)
HAS_ANTIVIRUS=false
ANTIVIRUS_NAME=""

if [ "$IS_MAC" = true ]; then
    # Verificar alguns antivírus comuns no Mac
    if [ -d "/Applications/Sophos Anti-Virus.app" ]; then
        HAS_ANTIVIRUS=true
        ANTIVIRUS_NAME="Sophos"
    elif [ -d "/Applications/Norton AntiVirus.app" ]; then
        HAS_ANTIVIRUS=true
        ANTIVIRUS_NAME="Norton"
    fi
else
    # Linux - verificar ClamAV
    if command -v clamscan &> /dev/null; then
        HAS_ANTIVIRUS=true
        ANTIVIRUS_NAME="ClamAV"
    fi
fi

# Criar JSON
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")

cat > /tmp/inventory_data.json <<EOF
{
    "name": "$HOSTNAME",
    "type": "$([ "$IS_MAC" = true ] && echo "laptop" || echo "desktop")",
    "status": "active",
    "manufacturer": "$MANUFACTURER",
    "model": "$MODEL",
    "serialNumber": "$SERIAL_NUMBER",
    "processor": "$PROCESSOR",
    "processorCores": $PROCESSOR_CORES,
    "ram": "$RAM_GB GB",
    "ramGB": $RAM_GB,
    "storage": "$STORAGE_GB GB",
    "storageGB": $STORAGE_GB,
    "storageType": "SSD",
    "os": "$OS_NAME",
    "osVersion": "$OS_VERSION",
    "osBuild": "$OS_BUILD",
    "osArchitecture": "$([ "$ARCH" = "x86_64" ] && echo "x64" || echo "ARM64")",
    "hostname": "$HOSTNAME",
    "ipAddress": "$IP_ADDRESS",
    "macAddress": "$MAC_ADDRESS",
    "hasAntivirus": $HAS_ANTIVIRUS,
    "antivirusName": "$([ -n "$ANTIVIRUS_NAME" ] && echo "$ANTIVIRUS_NAME" || echo "null")",
    "hasFirewall": true,
    "lastSeen": "$TIMESTAMP",
    "lastInventoryScan": "$TIMESTAMP",
    "collectionMethod": "script",
    "assetTag": "$([ -n "$ASSET_TAG" ] && echo "$ASSET_TAG" || echo "null")"
}
EOF

echo -e "${GREEN}✅ Informações coletadas com sucesso!${NC}"
echo ""
echo -e "${CYAN}📋 Resumo:${NC}"
echo -e "  • Nome: $HOSTNAME"
echo -e "  • Fabricante: $MANUFACTURER"
echo -e "  • Modelo: $MODEL"
echo -e "  • Processador: $PROCESSOR"
echo -e "  • RAM: $RAM_GB GB"
echo -e "  • SO: $OS_NAME $OS_VERSION"
echo -e "  • IP: $IP_ADDRESS"
echo ""

# Salvar localmente
OUTPUT_DIR="$HOME/TatuTicket"
mkdir -p "$OUTPUT_DIR"
TIMESTAMP_FILE=$(date +"%Y%m%d_%H%M%S")
OUTPUT_FILE="$OUTPUT_DIR/inventory_$TIMESTAMP_FILE.json"
cp /tmp/inventory_data.json "$OUTPUT_FILE"

echo -e "${YELLOW}💾 Dados salvos em: $OUTPUT_FILE${NC}"
echo ""

# Enviar para API
echo -e "${GREEN}🚀 Enviando dados para a API...${NC}"

HTTP_CODE=$(curl -s -o /tmp/api_response.json -w "%{http_code}" \
    -X POST "$API_URL/inventory/assets" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d @/tmp/inventory_data.json)

if [ "$HTTP_CODE" -eq 201 ]; then
    echo -e "${GREEN}✅ Asset enviado com sucesso!${NC}"
    
    ASSET_ID=$(cat /tmp/api_response.json | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo -e "   ID: $ASSET_ID"
    echo ""
    echo -e "${GREEN}🎉 Inventário enviado com sucesso!${NC}"
    echo -e "   Verifique no portal da organização"
else
    echo -e "${RED}❌ Erro ao enviar dados para a API (HTTP $HTTP_CODE)${NC}"
    cat /tmp/api_response.json 2>/dev/null
    echo ""
    echo -e "${YELLOW}💡 Os dados foram salvos localmente em: $OUTPUT_FILE${NC}"
    echo -e "   Você pode tentar enviar manualmente mais tarde${NC}"
fi

# Limpeza
rm -f /tmp/inventory_data.json /tmp/api_response.json

echo ""
echo -e "${CYAN}✨ Concluído!${NC}"
