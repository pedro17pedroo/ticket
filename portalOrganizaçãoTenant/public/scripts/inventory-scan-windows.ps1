# T-Desk - Script de Coleta de Inventário para Windows
# Execute com: powershell -ExecutionPolicy Bypass -File inventory-scan-windows.ps1

param(
    [string]$ApiUrl = "http://localhost:3000/api",
    [string]$Token = "",
    [string]$AssetTag = ""
)

Write-Host "🔍 T-Desk - Coleta de Inventário" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se o token foi fornecido
if ([string]::IsNullOrEmpty($Token)) {
    Write-Host "❌ ERRO: Token de autenticação não fornecido!" -ForegroundColor Red
    Write-Host "Uso: .\inventory-scan-windows.ps1 -Token 'SEU_TOKEN_AQUI'" -ForegroundColor Yellow
    exit 1
}

Write-Host "📊 Coletando informações do sistema..." -ForegroundColor Green

# Obter informações do sistema
$computerSystem = Get-CimInstance -ClassName Win32_ComputerSystem
$operatingSystem = Get-CimInstance -ClassName Win32_OperatingSystem
$processor = Get-CimInstance -ClassName Win32_Processor | Select-Object -First 1
$physicalMemory = Get-CimInstance -ClassName Win32_PhysicalMemory | Measure-Object -Property Capacity -Sum
$disk = Get-CimInstance -ClassName Win32_LogicalDisk -Filter "DeviceID='C:'"
$networkAdapter = Get-CimInstance -ClassName Win32_NetworkAdapterConfiguration | Where-Object { $_.IPEnabled -eq $true } | Select-Object -First 1
$antivirus = Get-CimInstance -Namespace root/SecurityCenter2 -ClassName AntiVirusProduct -ErrorAction SilentlyContinue
$bios = Get-CimInstance -ClassName Win32_BIOS

# Construir objeto de dados
$inventoryData = @{
    name = $computerSystem.Name
    type = if ($computerSystem.PCSystemType -eq 2) { "laptop" } else { "desktop" }
    status = "active"
    manufacturer = $computerSystem.Manufacturer
    model = $computerSystem.Model
    serialNumber = $bios.SerialNumber
    processor = $processor.Name
    processorCores = $processor.NumberOfCores
    ram = "$([math]::Round($physicalMemory.Sum / 1GB, 2)) GB"
    ramGB = [math]::Round($physicalMemory.Sum / 1GB, 2)
    storage = "$([math]::Round($disk.Size / 1GB, 2)) GB"
    storageGB = [math]::Round($disk.Size / 1GB, 2)
    storageType = "HDD"
    os = $operatingSystem.Caption
    osVersion = $operatingSystem.Version
    osBuild = $operatingSystem.BuildNumber
    osArchitecture = if ($operatingSystem.OSArchitecture -eq "64-bit") { "x64" } else { "x86" }
    hostname = $env:COMPUTERNAME
    ipAddress = $networkAdapter.IPAddress[0]
    macAddress = $networkAdapter.MACAddress
    domain = $computerSystem.Domain
    hasAntivirus = $antivirus -ne $null
    antivirusName = if ($antivirus) { $antivirus.displayName } else { $null }
    hasFirewall = $true
    lastSeen = Get-Date -Format "o"
    lastInventoryScan = Get-Date -Format "o"
    collectionMethod = "script"
    assetTag = $AssetTag
}

# Adicionar dados brutos
$inventoryData.rawData = @{
    computerSystem = $computerSystem | ConvertTo-Json -Depth 2
    operatingSystem = $operatingSystem | ConvertTo-Json -Depth 2
    processor = $processor | ConvertTo-Json -Depth 2
}

Write-Host "✅ Informações coletadas com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Resumo:" -ForegroundColor Cyan
Write-Host "  • Nome: $($inventoryData.name)" -ForegroundColor White
Write-Host "  • Fabricante: $($inventoryData.manufacturer)" -ForegroundColor White
Write-Host "  • Modelo: $($inventoryData.model)" -ForegroundColor White
Write-Host "  • Processador: $($inventoryData.processor)" -ForegroundColor White
Write-Host "  • RAM: $($inventoryData.ram)" -ForegroundColor White
Write-Host "  • SO: $($inventoryData.os)" -ForegroundColor White
Write-Host "  • IP: $($inventoryData.ipAddress)" -ForegroundColor White
Write-Host ""

# Coletar software instalado
Write-Host "📦 Coletando software instalado..." -ForegroundColor Green

$softwareList = @()

# Software de 64-bit
$software64 = Get-ItemProperty HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\* -ErrorAction SilentlyContinue | 
    Where-Object { $_.DisplayName -and $_.DisplayName -ne "" } | 
    Select-Object DisplayName, Publisher, DisplayVersion, InstallDate, EstimatedSize

# Software de 32-bit em sistemas 64-bit
$software32 = Get-ItemProperty HKLM:\Software\Wow6432Node\Microsoft\Windows\CurrentVersion\Uninstall\* -ErrorAction SilentlyContinue |
    Where-Object { $_.DisplayName -and $_.DisplayName -ne "" } |
    Select-Object DisplayName, Publisher, DisplayVersion, InstallDate, EstimatedSize

$allSoftware = $software64 + $software32 | Sort-Object DisplayName -Unique

foreach ($sw in $allSoftware) {
    $softwareList += @{
        name = $sw.DisplayName
        vendor = $sw.Publisher
        version = $sw.DisplayVersion
        installDate = if ($sw.InstallDate) { 
            try { 
                [DateTime]::ParseExact($sw.InstallDate, "yyyyMMdd", $null).ToString("o") 
            } catch { 
                $null 
            } 
        } else { $null }
        installSize = $sw.EstimatedSize
        isActive = $true
    }
}

Write-Host "✅ $($softwareList.Count) programas encontrados" -ForegroundColor Green
Write-Host ""

# Salvar dados localmente
$outputFolder = "$env:USERPROFILE\T-Desk"
if (!(Test-Path $outputFolder)) {
    New-Item -ItemType Directory -Path $outputFolder | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$outputFile = "$outputFolder\inventory_$timestamp.json"

$fullData = @{
    asset = $inventoryData
    software = $softwareList
    collectedAt = Get-Date -Format "o"
}

$fullData | ConvertTo-Json -Depth 10 | Out-File -FilePath $outputFile -Encoding UTF8

Write-Host "💾 Dados salvos em: $outputFile" -ForegroundColor Yellow
Write-Host ""

# Enviar para API
Write-Host "🚀 Enviando dados para a API..." -ForegroundColor Green

try {
    $headers = @{
        "Authorization" = "Bearer $Token"
        "Content-Type" = "application/json"
    }
    
    $jsonBody = $inventoryData | ConvertTo-Json -Depth 10
    
    $response = Invoke-RestMethod -Uri "$ApiUrl/inventory/assets" -Method Post -Headers $headers -Body $jsonBody -ContentType "application/json"
    
    Write-Host "✅ Asset enviado com sucesso!" -ForegroundColor Green
    Write-Host "   ID: $($response.asset.id)" -ForegroundColor White
    Write-Host ""
    
    # Enviar software se o asset foi criado com sucesso
    if ($response.asset.id) {
        $assetId = $response.asset.id
        $softwareSent = 0
        
        foreach ($sw in $softwareList) {
            try {
                $sw.assetId = $assetId
                $swBody = $sw | ConvertTo-Json -Depth 5
                Invoke-RestMethod -Uri "$ApiUrl/inventory/software" -Method Post -Headers $headers -Body $swBody -ContentType "application/json" | Out-Null
                $softwareSent++
            } catch {
                # Ignorar erros individuais de software
            }
        }
        
        Write-Host "✅ $softwareSent/$($softwareList.Count) programas enviados" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "🎉 Inventário enviado com sucesso!" -ForegroundColor Green
    Write-Host "   Verifique no portal da organização" -ForegroundColor White
    
} catch {
    Write-Host "❌ Erro ao enviar dados para a API:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Os dados foram salvos localmente em: $outputFile" -ForegroundColor Yellow
    Write-Host "   Você pode tentar enviar manualmente mais tarde" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✨ Concluído!" -ForegroundColor Cyan
