# Assets - TatuTicket Desktop Agent

## Ícones Necessários

Para executar o aplicativo, você precisa fornecer os seguintes ícones:

### **Tray Icon** (Bandeja do Sistema)
- `tray/icon.png` - 16x16 ou 32x32 pixels

### **Application Icons** (Ícone do Aplicativo)
- `icons/icon.png` - 512x512 pixels (Linux)
- `icons/icon.ico` - Multi-size (Windows)
- `icons/icon.icns` - Multi-size (macOS)

## Criação Rápida de Ícones

### Opção 1: Usar ImageMagick
```bash
# Instalar ImageMagick
brew install imagemagick  # macOS
sudo apt install imagemagick  # Linux

# Criar ícone simples (substituir por logo real depois)
convert -size 512x512 xc:blue -fill white -pointsize 200 -gravity center -annotate +0+0 "TT" icons/icon.png
convert -size 32x32 xc:blue -fill white -pointsize 14 -gravity center -annotate +0+0 "TT" tray/icon.png
```

### Opção 2: Download de Exemplo
Baixe um ícone temporário de:
- https://www.flaticon.com/free-icons/ticket
- https://icon-icons.com/

### Opção 3: Copiar de Outro Projeto
Se você tem logos do TatuTicket, adicione aqui.

## Estrutura Final

```
assets/
├── icons/
│   ├── icon.png    # 512x512 (Linux/base)
│   ├── icon.ico    # Multi-size (Windows)
│   └── icon.icns   # Multi-size (macOS)
├── tray/
│   └── icon.png    # 16x16 ou 32x32
└── README.md       # Este arquivo
```

## Conversão para Diferentes Formatos

### PNG → ICO (Windows)
```bash
convert icon.png -define icon:auto-resize=256,128,96,64,48,32,16 icon.ico
```

### PNG → ICNS (macOS)
```bash
mkdir icon.iconset
sips -z 16 16     icon.png --out icon.iconset/icon_16x16.png
sips -z 32 32     icon.png --out icon.iconset/icon_16x16@2x.png
sips -z 32 32     icon.png --out icon.iconset/icon_32x32.png
sips -z 64 64     icon.png --out icon.iconset/icon_32x32@2x.png
sips -z 128 128   icon.png --out icon.iconset/icon_128x128.png
sips -z 256 256   icon.png --out icon.iconset/icon_128x128@2x.png
sips -z 256 256   icon.png --out icon.iconset/icon_256x256.png
sips -z 512 512   icon.png --out icon.iconset/icon_256x256@2x.png
sips -z 512 512   icon.png --out icon.iconset/icon_512x512.png
cp icon.png icon.iconset/icon_512x512@2x.png
iconutil -c icns icon.iconset
rm -rf icon.iconset
```

## Ícones Temporários para Desenvolvimento

Para desenvolvimento rápido, execute:
```bash
cd /Users/pedrodivino/Dev/ticket/desktop-agent/assets
./create-temp-icons.sh
```
