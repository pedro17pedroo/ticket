# Correção de Carregamento de Logos no Desktop-Agent

## Problema Identificado

As imagens dos logotipos não estavam carregando no desktop-agent devido a caminhos relativos incorretos para o protocolo `file://` do Electron.

### Erro Original
```html
<!-- Não funcionava -->
<img src="../../assets/TDESK.png" />
<link rel="icon" href="../../assets/tdesk3.png" />
```

## Solução Implementada

### 1. Cópia de Arquivos
Copiamos os logos do diretório `assets/` para `src/renderer/` para que fiquem no mesmo diretório do HTML:

```bash
cp desktop-agent/assets/TDESK.png desktop-agent/src/renderer/
cp desktop-agent/assets/TDESK2.png desktop-agent/src/renderer/
cp desktop-agent/assets/tdesk3.png desktop-agent/src/renderer/
cp desktop-agent/assets/tdesk3.png desktop-agent/assets/icons/
```

### 2. Atualização dos Caminhos no HTML

#### Favicon (Head)
```html
<!-- Antes -->
<link rel="icon" type="image/png" href="../../assets/tdesk3.png" />

<!-- Depois -->
<link rel="icon" type="image/png" href="tdesk3.png" />
```

#### Logo da Tela de Login
```html
<!-- Antes -->
<img src="../../assets/TDESK.png" alt="T-Desk" style="height: 64px; width: auto;" />

<!-- Depois -->
<img src="TDESK.png" alt="T-Desk" style="height: 64px; width: auto;" />
```

#### Logo da Sidebar
```html
<!-- Antes -->
<img src="../../assets/TDESK.png" alt="T-Desk" style="height: 32px; width: auto;" />

<!-- Depois -->
<img src="TDESK2.png" alt="T-Desk" style="height: 32px; width: auto;" />
```

## Estrutura de Arquivos

```
desktop-agent/
├── assets/
│   ├── TDESK.png          # Logo principal (original)
│   ├── TDESK2.png         # Logo alternativo (original)
│   ├── tdesk3.png         # Favicon (original)
│   └── icons/
│       └── tdesk3.png     # Favicon para build
└── src/
    └── renderer/
        ├── index.html     # HTML atualizado
        ├── TDESK.png      # Logo para login (cópia)
        ├── TDESK2.png     # Logo para sidebar (cópia)
        └── tdesk3.png     # Favicon (cópia)
```

## Logos Utilizados

1. **TDESK.png** - Logo principal usado na tela de login (64px altura)
2. **TDESK2.png** - Logo alternativo usado na sidebar (32px altura)
3. **tdesk3.png** - Favicon usado no título da janela (16x16, 32x32)

## Por Que Funciona?

No Electron, quando o HTML é carregado via `file://` protocol:
- Caminhos relativos como `../../assets/` não funcionam corretamente
- Arquivos no mesmo diretório do HTML podem ser referenciados diretamente
- A solução mais simples é colocar os assets no diretório `src/renderer/`

## Build e Distribuição

Os arquivos em `src/renderer/` são incluídos automaticamente no build do Electron através da configuração em `package.json`:

```json
"build": {
  "files": [
    "src/**/*",
    "assets/**/*",
    "package.json"
  ]
}
```

## Teste

Para testar se os logos estão carregando:

```bash
cd desktop-agent
npm run dev
```

Verifique:
- ✅ Logo aparece na tela de login
- ✅ Logo aparece na sidebar após login
- ✅ Favicon aparece no título da janela

## Status

✅ **CONCLUÍDO** - Logos carregando corretamente no desktop-agent

## Arquivos Modificados

- `desktop-agent/src/renderer/index.html` - Caminhos das imagens atualizados
- `desktop-agent/src/renderer/TDESK.png` - Novo arquivo (cópia)
- `desktop-agent/src/renderer/TDESK2.png` - Novo arquivo (cópia)
- `desktop-agent/src/renderer/tdesk3.png` - Novo arquivo (cópia)
- `desktop-agent/assets/icons/tdesk3.png` - Novo arquivo (cópia para build)

## Data
15 de Março de 2026
