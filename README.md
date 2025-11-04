# Roteirizando

> Gerador inteligente de roteiros de viagem personalizados powered by Google Gemini AI

<div align="center">
  <img src="https://img.shields.io/badge/React_Native-0.81.5-61DAFB?style=for-the-badge&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Expo-~54.0-000020?style=for-the-badge&logo=expo&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Gemini_AI-2.5_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white" />
</div>

## 📖 Sobre o Projeto

**Roteirizando** é uma aplicação mobile que resolve um problema comum de viajantes: a dificuldade em planejar roteiros otimizados para destinos desconhecidos. Utilizando inteligência artificial generativa do Google Gemini, o app cria roteiros detalhados e personalizados em segundos, considerando a duração da estadia e as características de cada destino.

### Problema Resolvido

Planejar uma viagem demanda horas de pesquisa em blogs, fóruns e guias turísticos. O Roteirizando elimina essa fricção ao gerar instantaneamente sugestões de itinerários estruturados, permitindo que o usuário foque no que realmente importa: aproveitar a viagem.

## ✨ Features

- 🌍 **Geração Inteligente de Roteiros**: Cria itinerários personalizados para qualquer cidade do mundo
- 📅 **Planejamento Flexível**: Suporta viagens de 1 a 7 dias com ajuste via slider intuitivo
- 📝 **Formatação Rica**: Renderização de Markdown para apresentação visual otimizada
- ⚡ **Performance Otimizada**: Utiliza Gemini 2.5 Flash para respostas rápidas e precisas
- 🛡️ **Tratamento Robusto de Erros**: Fallbacks e validações para garantir experiência consistente
- 📱 **Cross-Platform**: Funciona nativamente em iOS e Android via React Native
- 🎨 **UI/UX Intuitiva**: Interface limpa com feedback visual de loading e estados

## 🏗️ Arquitetura Técnica

### Stack Principal

```
┌─────────────────────────────────────┐
│   React Native + Expo (v54)        │
│   TypeScript (Strict Mode)          │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│   Gemini 2.5 Flash API              │
│   (generativelanguage.googleapis)   │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│   Markdown Renderer                 │
│   (react-native-markdown-display)   │
└─────────────────────────────────────┘
```

### Fluxo de Dados

1. **Input Layer**: Captura cidade e dias via componentes nativos
2. **Validation Layer**: Valida inputs antes de requisição
3. **API Layer**: Constrói prompt otimizado e comunica com Gemini API
4. **Processing Layer**: Extrai, limpa e parseia resposta (suporta JSON e Markdown)
5. **Presentation Layer**: Renderiza conteúdo formatado com tratamento de estados

### Decisões Técnicas

- **Gemini 2.5 Flash**: Escolhido por latência reduzida e custo-benefício superior ao GPT-4
- **Markdown Nativo**: Preferência por `react-native-markdown-display` em vez de WebView para performance
- **Parsing Resiliente**: Implementação de múltiplos fallbacks para lidar com variações na resposta da API
- **State Management Local**: useState é suficiente dado o escopo do app (sem necessidade de Redux/Zustand)

## 🚀 Instalação e Configuração

### Pré-requisitos

- Node.js >= 18.x
- npm ou yarn
- Expo CLI (`npm install -g expo-cli`)
- Conta Google Cloud com Gemini API habilitada

### Setup

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/roteirizando.git
cd roteirizando

# Instale as dependências
npm install

# Configure a API Key do Gemini
# Edite App.tsx e substitua 'api-key-here' pela sua chave
```

⚠️ **IMPORTANTE**: Nunca commite sua API key. Em produção, utilize variáveis de ambiente:

```typescript
// Use expo-constants para acessar env vars
import Constants from 'expo-constants';
const KEY_GPT = Constants.expoConfig?.extra?.geminiApiKey;
```

### Executando

```bash
# Desenvolvimento
npm start

# Android
npm run android

# iOS
npm run ios

# Web (experimental)
npm run web
```

## 📱 Como Usar

1. **Abra o app** e insira o nome da cidade de destino (ex: "Paris, França")
2. **Ajuste o slider** para definir a quantidade de dias (1-7)
3. **Toque em "Gerar roteiro"** e aguarde a IA processar
4. **Navegue pelo roteiro** gerado com sugestões para cada dia

## 🔧 Estrutura do Código

```
roteirizando/
├── App.tsx                 # Componente principal e lógica de negócio
├── app.json                # Configurações do Expo
├── package.json            # Dependências e scripts
├── tsconfig.json           # Configurações TypeScript
└── assets/                 # Ícones e splash screens
```

### Componentes Principais

#### `handleGenerate()`
Orquestra todo o fluxo de geração:
- Validação de inputs
- Construção do prompt otimizado
- Requisição à API do Gemini
- Processamento e limpeza da resposta
- Atualização do estado da UI

#### `cleanModelText()`
Pipeline de sanitização da resposta:
- Remove aspas escapadas e caracteres de controle
- Elimina code fences indesejadas
- Normaliza quebras de linha
- Garante compatibilidade com o renderer de Markdown

#### `tryParseJsonFromText()`
Fallback robusto para respostas JSON:
- Tenta parse direto
- Aplica unescaping se necessário
- Extrai JSON de strings malformadas
- Retorna null gracefully em caso de falha

## 🎨 Customização

### Ajustar Temperatura da IA

```typescript
generationConfig: {
  temperature: 0.2,  // Mais criativo: 0.7-1.0 | Mais conservador: 0.0-0.3
  topP: 1.0,
  topK: 40,
}
```

### Modificar o Prompt

Edite `buildPromptMarkdown()` para ajustar o estilo dos roteiros:

```typescript
function buildPromptMarkdown(cityName: string, daysNumber: number): string {
  return `Crie ${daysNumber} roteiros DETALHADOS para ${cityName}.
Inclua: horários sugeridos, custos estimados, dicas de transporte.
Formato: Markdown com headers ## e listas.`;
}
```

## 🔐 Segurança

### API Key Protection

**NUNCA exponha sua API key no código-fonte em produção.** Implemente:

1. **Backend Proxy**: Crie um servidor intermediário que armazena a key
2. **Expo Secrets**: Use `expo-constants` + `app.config.js` com variáveis de ambiente
3. **Rate Limiting**: Implemente throttling para evitar abuso

### Exemplo com Backend Proxy

```typescript
// Substitua a chamada direta por:
const resp = await fetch('https://seu-backend.com/api/generate-itinerary', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ city, days }),
});
```

## 📊 Performance

- **Tempo médio de resposta**: 2-4 segundos (Gemini 2.5 Flash)
- **Uso de memória**: ~120MB em execução
- **Tamanho do APK**: ~35MB (otimizado com Hermes Engine)

### Otimizações Implementadas

- ✅ Keyboard.dismiss() automático após submit
- ✅ Debounce implícito via estado de loading
- ✅ ScrollView otimizado com `showsVerticalScrollIndicator={false}`
- ✅ ActivityIndicator durante processamento
- ✅ Fallbacks múltiplos para parsing de resposta

## 🐛 Troubleshooting

### Erro: "HTTP 400: API key not valid"
- Verifique se sua API key está correta no código
- Confirme que a Gemini API está habilitada no Google Cloud Console

### Erro: "Ocorreu um erro ao gerar o roteiro"
- Verifique sua conexão com a internet
- Confirme que há créditos disponíveis na sua conta do Google Cloud
- Cheque os logs do console para detalhes específicos

### Roteiro não aparece formatado
- Certifique-se de que `react-native-markdown-display` está instalado
- Verifique se o modelo retornou Markdown válido (check console.log)

## 🛣️ Roadmap

- [ ] Suporte a múltiplos idiomas
- [ ] Filtros de preferências (aventura, cultura, gastronomia, etc.)
- [ ] Orçamento estimado por roteiro
- [ ] Salvar roteiros favoritos localmente
- [ ] Exportar roteiros como PDF
- [ ] Integração com Google Maps para visualização
- [ ] Modo offline com cache de roteiros anteriores
- [ ] Sistema de avaliação e feedback de roteiros

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👤 Autor

Desenvolvido para resolver a dificuldade em planejar viagens de forma eficiente e inteligente.

---

<div align="center">
  <p>Se este projeto te ajudou, considere deixar uma ⭐</p>
  <p>Feito com ❤️ e React Native</p>
</div>