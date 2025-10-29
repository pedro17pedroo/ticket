const si = require('systeminformation');
const { machineId } = require('node-machine-id');
const os = require('os');

class InventoryCollector {
  constructor(apiClient, store) {
    this.apiClient = apiClient;
    this.store = store;
    this.interval = null;
    this.isRunning = false;
  }

  async start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    
    // Coletar imediatamente
    await this.collect();
    
    // Configurar coleta periódica
    const intervalMinutes = this.store.get('syncInterval', 60);
    this.interval = setInterval(() => {
      this.collect();
    }, intervalMinutes * 60 * 1000);

    console.log('✅ Inventory Collector iniciado');
  }

  async stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
    console.log('⏹️ Inventory Collector parado');
  }

  async restart(config) {
    await this.stop();
    if (config.autoSync) {
      await this.start();
    }
  }

  async collect() {
    try {
      console.log('🔄 Coletando inventário...');
      
      const inventory = await this.getSystemInfo();
      
      // Enviar para o backend
      if (this.apiClient.isConnected()) {
        await this.apiClient.sendInventory(inventory);
        this.store.set('lastSync', new Date().toISOString());
        console.log('✅ Inventário enviado com sucesso');
        
        if (global.sendNotification) {
          global.sendNotification('success', 'Inventário sincronizado');
        }
      }
      
      return inventory;
    } catch (error) {
      console.error('❌ Erro ao coletar inventário:', error);
      
      if (global.sendNotification) {
        global.sendNotification('error', 'Erro ao sincronizar inventário');
      }
      
      throw error;
    }
  }

  async getSystemInfo() {
    try {
      // ID único da máquina
      const machineIdValue = await machineId();
      this.store.set('machineId', machineIdValue);

      // Informações do sistema
      const [
        system,
        cpu,
        mem,
        osInfo,
        diskLayout,
        networkInterfaces,
        graphics,
        battery,
        bios,
        baseboard,
        chassis
      ] = await Promise.all([
        si.system(),
        si.cpu(),
        si.mem(),
        si.osInfo(),
        si.diskLayout(),
        si.networkInterfaces(),
        si.graphics(),
        si.battery(),
        si.bios(),
        si.baseboard(),
        si.chassis()
      ]);

      // Software instalado
      const software = await this.getInstalledSoftware();

      // Informações de segurança
      const security = await this.getSecurityInfo();

      // Construir objeto de inventário
      const inventory = {
        // Identificação
        machineId: machineIdValue,
        hostname: os.hostname(),
        
        // Sistema
        manufacturer: system.manufacturer || 'Unknown',
        model: system.model || 'Unknown',
        serialNumber: system.serial || 'Unknown',
        uuid: system.uuid || machineIdValue,
        sku: system.sku || null,
        
        // CPU
        processor: cpu.brand || 'Unknown',
        processorCores: cpu.cores || null,
        processorSpeed: cpu.speed || null,
        processorPhysicalCores: cpu.physicalCores || null,
        
        // Memória
        ramGB: Math.round(mem.total / (1024 ** 3) * 100) / 100,
        ram: `${Math.round(mem.total / (1024 ** 3))} GB`,
        
        // Armazenamento
        disks: diskLayout.map(disk => ({
          device: disk.device,
          type: disk.type,
          name: disk.name,
          vendor: disk.vendor,
          size: Math.round(disk.size / (1024 ** 3)),
          serialNumber: disk.serialNum,
          interfaceType: disk.interfaceType
        })),
        storageGB: Math.round(diskLayout.reduce((acc, disk) => acc + disk.size, 0) / (1024 ** 3)),
        storage: `${Math.round(diskLayout.reduce((acc, disk) => acc + disk.size, 0) / (1024 ** 3))} GB`,
        storageType: diskLayout[0]?.type || 'Unknown',
        
        // Placa Gráfica
        graphicsCard: graphics.controllers.map(g => g.model).join(', ') || 'Unknown',
        graphics: graphics.controllers.map(g => ({
          vendor: g.vendor,
          model: g.model,
          vram: g.vram,
          bus: g.bus
        })),
        
        // Sistema Operativo
        os: osInfo.distro || osInfo.platform,
        osVersion: osInfo.release,
        osArchitecture: osInfo.arch,
        osBuild: osInfo.build,
        osCodename: osInfo.codename,
        osKernel: osInfo.kernel,
        
        // Rede
        networkInterfaces: networkInterfaces
          .filter(ni => !ni.internal && ni.ip4)
          .map(ni => ({
            name: ni.iface,
            mac: ni.mac,
            ip4: ni.ip4,
            ip6: ni.ip6,
            type: ni.type,
            speed: ni.speed
          })),
        ipAddress: networkInterfaces.find(ni => !ni.internal && ni.ip4)?.ip4 || 'Unknown',
        macAddress: networkInterfaces.find(ni => !ni.internal && ni.mac)?.mac || 'Unknown',
        domain: process.env.USERDOMAIN || process.env.USERDNSDOMAIN || null,
        
        // BIOS
        bios: {
          vendor: bios.vendor,
          version: bios.version,
          releaseDate: bios.releaseDate
        },
        
        // Placa-mãe
        motherboard: {
          manufacturer: baseboard.manufacturer,
          model: baseboard.model,
          version: baseboard.version,
          serialNumber: baseboard.serial
        },
        
        // Chassis
        chassis: {
          manufacturer: chassis.manufacturer,
          model: chassis.model,
          type: chassis.type,
          version: chassis.version,
          serialNumber: chassis.serial,
          assetTag: chassis.assetTag
        },
        
        // Bateria (para laptops)
        battery: battery.hasBattery ? {
          hasBattery: true,
          isCharging: battery.isCharging,
          percent: battery.percent,
          timeRemaining: battery.timeRemaining,
          manufacturer: battery.manufacturer,
          model: battery.model
        } : null,
        
        // Software
        software: software,
        
        // Segurança
        security: security,
        
        // Metadata
        collectedAt: new Date().toISOString(),
        collectionMethod: 'agent', // Mudado de 'desktop-agent' para 'agent'
        agentVersion: '1.0.0',
        
        // Sistema em execução
        uptime: os.uptime(),
        platform: os.platform(),
        type: this.getDeviceType(chassis.type, battery.hasBattery)
      };

      return inventory;
    } catch (error) {
      console.error('Erro ao coletar informações do sistema:', error);
      throw error;
    }
  }

  async getInstalledSoftware() {
    try {
      const platform = os.platform();
      const installedApps = [];
      
      // Usar si.versions() que retorna informações sobre software/ferramentas instaladas
      const versions = await si.versions();
      
      // Converter o objeto versions em um array de aplicações
      for (const [name, version] of Object.entries(versions)) {
        if (version && version !== '') {
          installedApps.push({
            name: name,
            version: version,
            publisher: 'System',
            category: 'system',
            installDate: null,
            size: null
          });
        }
      }
      
      // Software adicional baseado no sistema operativo
      if (platform === 'win32') {
        try {
          const { execSync } = require('child_process');
          const wmiQuery = 'powershell "Get-ItemProperty HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | Select-Object DisplayName, DisplayVersion, Publisher, InstallDate, EstimatedSize | Where-Object { $_.DisplayName -ne $null } | ConvertTo-Json"';
          const output = execSync(wmiQuery, { encoding: 'utf8', timeout: 30000, maxBuffer: 10 * 1024 * 1024 });
          
          if (output && output.trim()) {
            const winSoftware = JSON.parse(output);
            const softwareArray = Array.isArray(winSoftware) ? winSoftware : [winSoftware];
            
            softwareArray.forEach(app => {
              if (app.DisplayName) {
                installedApps.push({
                  name: app.DisplayName,
                  version: app.DisplayVersion || 'N/A',
                  publisher: app.Publisher || 'Unknown',
                  category: 'application',
                  installDate: app.InstallDate || null,
                  size: app.EstimatedSize || null
                });
              }
            });
          }
        } catch (error) {
          console.error('Erro ao obter software Windows:', error.message);
        }
      } else if (platform === 'darwin') {
        try {
          const { execSync } = require('child_process');
          // Listar aplicações instaladas no macOS
          const appsOutput = execSync('ls /Applications', { encoding: 'utf8' });
          const apps = appsOutput.split('\n').filter(app => app.endsWith('.app'));
          
          apps.forEach(app => {
            const appName = app.replace('.app', '');
            try {
              const versionCmd = `defaults read "/Applications/${app}/Contents/Info.plist" CFBundleShortVersionString 2>/dev/null || echo "N/A"`;
              const version = execSync(versionCmd, { encoding: 'utf8' }).trim();
              
              installedApps.push({
                name: appName,
                version: version,
                publisher: 'Unknown',
                category: 'application',
                installDate: null,
                size: null
              });
            } catch (e) {
              // Ignorar erros de leitura de apps individuais
            }
          });
        } catch (error) {
          console.error('Erro ao obter software macOS:', error.message);
        }
      } else if (platform === 'linux') {
        try {
          const { execSync } = require('child_process');
          // Tentar dpkg primeiro (Debian/Ubuntu)
          try {
            const dpkgOutput = execSync('dpkg -l | awk \'{if(NR>5)print $2,$3}\'', { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
            const packages = dpkgOutput.split('\n').filter(line => line.trim());
            
            packages.forEach(pkg => {
              const [name, version] = pkg.split(' ');
              if (name) {
                installedApps.push({
                  name: name,
                  version: version || 'N/A',
                  publisher: 'Package Manager',
                  category: 'application',
                  installDate: null,
                  size: null
                });
              }
            });
          } catch (e) {
            // Tentar rpm (RedHat/CentOS)
            try {
              const rpmOutput = execSync('rpm -qa --queryformat "%{NAME} %{VERSION}\\n"', { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
              const packages = rpmOutput.split('\n').filter(line => line.trim());
              
              packages.forEach(pkg => {
                const [name, version] = pkg.split(' ');
                if (name) {
                  installedApps.push({
                    name: name,
                    version: version || 'N/A',
                    publisher: 'Package Manager',
                    category: 'application',
                    installDate: null,
                    size: null
                  });
                }
              });
            } catch (e2) {
              console.error('Nenhum gerenciador de pacotes suportado encontrado');
            }
          }
        } catch (error) {
          console.error('Erro ao obter software Linux:', error.message);
        }
      }
      
      // Remover duplicados baseado no nome
      const uniqueApps = [];
      const seenNames = new Set();
      
      installedApps.forEach(app => {
        const key = app.name.toLowerCase();
        if (!seenNames.has(key)) {
          seenNames.add(key);
          uniqueApps.push(app);
        }
      });
      
      return uniqueApps;
    } catch (error) {
      console.error('Erro ao obter software instalado:', error);
      return [];
    }
  }

  async getSecurityInfo() {
    try {
      const platform = os.platform();
      const security = {
        hasAntivirus: false,
        antivirusName: null,
        antivirusVersion: null,
        antivirusUpdated: null,
        antivirusStatus: 'unknown',
        hasFirewall: false,
        firewallStatus: 'unknown',
        isEncrypted: false,
        encryptionMethod: null,
        tpmEnabled: false,
        secureBootEnabled: false,
        lastSecurityUpdate: null,
        pendingUpdates: 0,
        securityLevel: 'unknown' // low, medium, high, critical
      };
      
      // Windows
      if (platform === 'win32') {
        try {
          // Verificar Windows Defender
          const { execSync } = require('child_process');
          
          // Antivírus
          try {
            const avStatus = execSync('powershell "Get-MpComputerStatus | Select-Object AntivirusEnabled, AntivirusSignatureLastUpdated, AMProductVersion, RealTimeProtectionEnabled | ConvertTo-Json"', { encoding: 'utf8' });
            const avData = JSON.parse(avStatus);
            security.hasAntivirus = avData.AntivirusEnabled;
            security.antivirusName = 'Windows Defender';
            security.antivirusVersion = avData.AMProductVersion;
            security.antivirusUpdated = avData.AntivirusSignatureLastUpdated;
            security.antivirusStatus = avData.RealTimeProtectionEnabled ? 'active' : 'inactive';
          } catch (e) {
            console.log('Não foi possível verificar antivírus');
          }
          
          // Windows Update
          try {
            const updateStatus = execSync('powershell "(New-Object -ComObject Microsoft.Update.Session).CreateUpdateSearcher().Search(\"IsInstalled=0\").Updates.Count"', { encoding: 'utf8' });
            security.pendingUpdates = parseInt(updateStatus.trim()) || 0;
          } catch (e) {
            console.log('Não foi possível verificar atualizações pendentes');
          }
          
          // TPM
          try {
            const tpmStatus = execSync('powershell "(Get-Tpm).TpmPresent"', { encoding: 'utf8' });
            security.tpmEnabled = tpmStatus.trim() === 'True';
          } catch (e) {
            console.log('Não foi possível verificar TPM');
          }
          
          // Secure Boot
          try {
            const secureBootStatus = execSync('powershell "Confirm-SecureBootUEFI"', { encoding: 'utf8' });
            security.secureBootEnabled = secureBootStatus.trim() === 'True';
          } catch (e) {
            console.log('Não foi possível verificar Secure Boot');
          }
          
          // Firewall
          try {
            const fwStatus = execSync('netsh advfirewall show allprofiles state', { encoding: 'utf8' });
            security.hasFirewall = fwStatus.includes('ON');
            security.firewallStatus = fwStatus.includes('ON') ? 'active' : 'inactive';
          } catch (e) {
            console.log('Não foi possível verificar firewall');
          }
          
          // BitLocker
          try {
            const blStatus = execSync('manage-bde -status C:', { encoding: 'utf8' });
            security.isEncrypted = blStatus.includes('Protection On');
            security.encryptionMethod = security.isEncrypted ? 'BitLocker' : null;
          } catch (e) {
            console.log('Não foi possível verificar criptografia');
          }
        } catch (error) {
          console.error('Erro ao obter informações de segurança Windows:', error);
        }
      }
      
      // macOS
      if (platform === 'darwin') {
        try {
          const { execSync } = require('child_process');
          
          // Firewall
          try {
            const fwStatus = execSync('defaults read /Library/Preferences/com.apple.alf globalstate', { encoding: 'utf8' });
            const fwState = parseInt(fwStatus.trim());
            security.hasFirewall = fwState !== 0;
            security.firewallStatus = fwState === 1 ? 'active' : fwState === 2 ? 'active-advanced' : 'inactive';
          } catch (e) {
            console.log('Não foi possível verificar firewall');
          }
          
          // FileVault
          try {
            const fvStatus = execSync('fdesetup status', { encoding: 'utf8' });
            security.isEncrypted = fvStatus.includes('On');
            security.encryptionMethod = security.isEncrypted ? 'FileVault' : null;
          } catch (e) {
            console.log('Não foi possível verificar FileVault');
          }
          
          // XProtect e Gatekeeper
          security.antivirusName = 'XProtect (Built-in)';
          security.hasAntivirus = true;
          security.antivirusStatus = 'active';
          
          try {
            const gkStatus = execSync('spctl --status', { encoding: 'utf8' });
            security.antivirusStatus = gkStatus.includes('enabled') ? 'active' : 'inactive';
          } catch (e) {
            console.log('Não foi possível verificar Gatekeeper');
          }
        } catch (error) {
          console.error('Erro ao obter informações de segurança macOS:', error);
        }
      }
      
      // Calcular nível de segurança
      let securityScore = 0;
      if (security.hasAntivirus && security.antivirusStatus === 'active') securityScore += 25;
      if (security.hasFirewall && security.firewallStatus !== 'inactive') securityScore += 25;
      if (security.isEncrypted) securityScore += 25;
      if (security.tpmEnabled) securityScore += 10;
      if (security.secureBootEnabled) securityScore += 10;
      if (security.pendingUpdates === 0) securityScore += 5;
      
      if (securityScore >= 80) {
        security.securityLevel = 'high';
      } else if (securityScore >= 50) {
        security.securityLevel = 'medium';
      } else if (securityScore >= 25) {
        security.securityLevel = 'low';
      } else {
        security.securityLevel = 'critical';
      }
      
      return security;
    } catch (error) {
      console.error('Erro ao obter informações de segurança:', error);
      return {
        hasAntivirus: false,
        antivirusName: null,
        antivirusUpdated: null,
        hasFirewall: false,
        isEncrypted: false
      };
    }
  }

  getDeviceType(chassisType, hasBattery) {
    const laptopTypes = ['Notebook', 'Laptop', 'Portable', 'Sub Notebook'];
    const serverTypes = ['Rack Mount Chassis', 'Main Server Chassis'];
    
    if (serverTypes.some(type => chassisType?.includes(type))) {
      return 'server';
    }
    
    if (laptopTypes.some(type => chassisType?.includes(type)) || hasBattery) {
      return 'laptop';
    }
    
    return 'desktop';
  }
}

module.exports = InventoryCollector;
