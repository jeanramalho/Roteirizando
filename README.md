# 🗺️ Roteirizando - Gerador Inteligente de Roteiros de Viagem

**Roteirizando** é um aplicativo mobile desenvolvido em **React Native + TypeScript**, que utiliza a API **Google Gemini AI** para gerar roteiros de viagem personalizados em segundos. Basta informar a cidade de destino e a quantidade de dias — o app cria um itinerário detalhado e formatado, pronto para ser usado na sua próxima aventura.

---

## 🚀 Visão Geral

O Roteirizando nasceu para resolver um problema comum: **planejar viagens demanda horas de pesquisa**. Com este app, você obtém sugestões inteligentes de roteiros em poucos segundos, eliminando a fricção do planejamento e permitindo que você foque no que realmente importa — aproveitar a viagem.

Ideal para viajantes que buscam praticidade, o app funciona nativamente em **iOS e Android**, com interface intuitiva e respostas rápidas graças ao modelo **Gemini 2.5 Flash**.

---

## 🧠 Tecnologias e Ferramentas

- **React Native 0.81.5** — Framework cross-platform para apps nativos
- **Expo SDK 54** — Toolchain completo para desenvolvimento ágil
- **TypeScript** — Tipagem estática para código mais seguro
- **Google Gemini AI (2.5 Flash)** — Modelo de IA generativa para criação de roteiros
- **react-native-markdown-display** — Renderização rica de conteúdo Markdown
- **@react-native-community/slider** — Componente nativo para seleção de dias

---

## 📦 Como usar localmente

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/roteirizando.git
cd roteirizando
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure a API Key do Google Gemini

1. Acesse o [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Gere sua API Key gratuita
3. Abra o arquivo `App.tsx` e substitua:

```typescript
const KEY_GPT = "api-key-here"; // Substitua pela sua chave
```

⚠️ **Importante:** Em produção, nunca exponha a API key no código. Utilize variáveis de ambiente ou um backend proxy.

### 4. Execute o aplicativo

```bash
# Inicia o servidor Expo
npm start

# Ou diretamente no dispositivo/emulador
npm run android  # Para Android
npm run ios      # Para iOS
```

O app estará disponível via **Expo Go** no seu smartphone ou no emulador.

---

## 📡 Funcionalidades

### 🌍 Geração de Roteiros Personalizados
- Insira qualquer cidade do mundo (ex: "Paris, França")
- Ajuste de 1 a 7 dias de viagem via slider intuitivo
- Roteiros gerados em português com formatação Markdown

### ⚡ Performance Otimizada
- Respostas em 2-4 segundos com Gemini 2.5 Flash
- Loading states visuais durante processamento
- Tratamento robusto de erros e validações

### 📱 Interface Nativa
- Funciona em iOS e Android sem necessidade de WebView
- Design limpo e responsivo
- Feedback visual em todos os estados (loading, erro, sucesso)

---

## 🎯 Fluxo de Uso

1. **Abra o app** e insira o nome da cidade destino
2. **Ajuste o slider** para definir quantos dias ficará na cidade (1-7)
3. **Toque em "Gerar roteiro"** e aguarde a IA processar
4. **Navegue pelo roteiro** gerado com sugestões dia a dia formatadas em Markdown

---

## 🔧 Estrutura do Projeto

```
roteirizando/
├── App.tsx                 # Componente principal + lógica de negócio
├── app.json                # Configurações do Expo
├── package.json            # Dependências e scripts
├── tsconfig.json           # Configurações TypeScript
└── assets/                 # Ícones e splash screens
```

### Principais Funções

- **`handleGenerate()`** — Orquestra o fluxo completo: validação → API → parse → render
- **`cleanModelText()`** — Pipeline de limpeza e sanitização da resposta da IA
- **`tryParseJsonFromText()`** — Fallback robusto para processar JSON mal-formatado
- **`RenderParsedRoutes()`** — Componente que renderiza roteiros estruturados

---

## 🛡️ Segurança

### Proteção da API Key

**Nunca commite sua API key no código.** Para produção, implemente:

1. **Backend Proxy** — Crie um servidor que armazena a key e faz as requisições
2. **Variáveis de Ambiente** — Use `expo-constants` + `app.config.js`:

```javascript
// app.config.js
export default {
  extra: {
    geminiApiKey: process.env.GEMINI_API_KEY,
  },
};
```

```typescript
// App.tsx
import Constants from 'expo-constants';
const KEY_GPT = Constants.expoConfig?.extra?.geminiApiKey;
```

---

## 🎨 Customização

### Ajustar Criatividade da IA

```typescript
generationConfig: {
  temperature: 0.2,  // 0.0-0.3: conservador | 0.7-1.0: criativo
  topP: 1.0,
  topK: 40,
}
```

### Modificar o Prompt

Edite `buildPromptMarkdown()` para alterar o estilo dos roteiros:

```typescript
function buildPromptMarkdown(cityName: string, daysNumber: number): string {
  return `Crie ${daysNumber} roteiros DETALHADOS para ${cityName}.
Inclua: horários, custos estimados, transporte, dicas locais.
Formato: Markdown com ## headers e listas.`;
}
```

---

## 💼 Sobre o autor

Desenvolvido por [Jean Ramalho](https://www.linkedin.com/in/jean-ramalho/), desenvolvedor mobile apaixonado por soluções que entregam valor real, com foco em performance, UX e organização de código.

📬 Contato: [jeanramalho.dev@gmail.com](mailto:jeanramalho.dev@gmail.com)

---

## 🌟 Diferenciais do Projeto

- Integração real com IA generativa de última geração (Gemini 2.5 Flash)
- Código TypeScript strict mode para máxima confiabilidade
- Tratamento avançado de edge cases (JSON malformado, respostas inesperadas, etc)
- Arquitetura limpa e modular, fácil de estender com novas features
- Projeto funcional e didático, ideal para portfólio técnico
- Demonstração prática de integração API + parsing + UI nativa

---

## 🛣️ Próximos Passos

- [ ] Sistema de filtros (aventura, cultura, gastronomia)
- [ ] Orçamento estimado por roteiro
- [ ] Salvar roteiros favoritos com AsyncStorage
- [ ] Exportar como PDF ou compartilhar
- [ ] Integração com Google Maps
- [ ] Suporte a múltiplos idiomas

---

> **Disclaimer:** Este projeto utiliza a API do Google Gemini. Respeite sempre os termos de uso e limites de requisições da plataforma.