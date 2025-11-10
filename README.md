# 🚀 MSME Mitr - AI-First MSME Advisory System

[![Next.js](https://img.shields.io/badge/Next.js-14.0-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-38B2AC)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## 🌟 Overview

MSME Mitr is an AI-powered multilingual advisory system designed to help Micro, Small, and Medium Enterprises (MSMEs) in India discover and apply for government schemes. Built with a mobile-first approach, it provides personalized recommendations through an intelligent chatbot interface supporting 12 Indian languages.

### 🎯 Key Features

- **AI-First Chatbot** - Intelligent conversational interface powered by OpenRouter (Claude, GPT-4, Llama)
- **Voice Input** - Deepgram-powered speech-to-text in multiple Indian languages
- **Offline Mode** - Works without internet using cached scheme data
- **Multi-Language Support** - 12 Indian languages including Hindi, Tamil, Telugu, Bengali
- **Real-time Streaming** - Smooth streaming responses for better UX
- **Smart Recommendations** - Personalized scheme suggestions based on business profile
- **Mobile-First Design** - Optimized for rural users with poor connectivity

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- API Keys (optional but recommended):
  - [OpenRouter API Key](https://openrouter.ai/) - For AI responses
  - [Deepgram API Key](https://deepgram.com/) - For voice transcription

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/msme-mitr.git
cd msme-mitr
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your API keys:
```env
# OpenRouter API Configuration
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Deepgram API Configuration (for voice recording)
DEEPGRAM_API_KEY=your_deepgram_api_key_here

# Model Selection (choose one)
OPENROUTER_MODEL=anthropic/claude-3-haiku  # Fast & affordable
# OPENROUTER_MODEL=anthropic/claude-3-sonnet
# OPENROUTER_MODEL=openai/gpt-3.5-turbo
# OPENROUTER_MODEL=meta-llama/llama-3-70b-instruct

# Rate Limiting
MAX_REQUESTS_PER_MINUTE=20
MAX_REQUESTS_PER_DAY=500
```

4. **Run the development server**
```bash
npm run dev
```

5. **Open in browser**
```
http://localhost:3000
```

## 🏗️ Architecture

### Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui, Radix UI
- **AI Integration**: OpenRouter API (multi-model support)
- **Voice**: Deepgram STT
- **State Management**: React Hooks, Context API
- **Streaming**: Vercel AI SDK

### Project Structure

```
msme-mitr/
├── app/
│   ├── api/
│   │   ├── chat/          # Chat endpoints
│   │   ├── voice/         # Voice transcription
│   │   └── health/        # Health check
│   ├── page.tsx           # Home page
│   └── layout.tsx         # Root layout
├── components/
│   ├── mobile/            # Mobile-optimized components
│   │   └── ChatInterfaceStream.tsx
│   ├── ui/                # Reusable UI components
│   └── layouts/           # Layout components
├── services/
│   ├── ai/                # AI services
│   │   ├── openRouterService.ts
│   │   └── contextBuilder.ts
│   ├── chat/              # Chat management
│   │   └── conversationManager.ts
│   ├── schemes/           # Scheme data service
│   │   └── schemeDataService.ts
│   ├── voice/             # Voice services
│   │   └── deepgramService.ts
│   ├── language/          # Multi-language support
│   │   └── languageService.ts
│   └── offline/           # Offline mode
│       └── offlineService.ts
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript definitions
├── data/                  # Static data
│   └── schemes.json       # Government schemes database
└── public/                # Static assets
```

## 🎨 Features in Detail

### 1. AI-Powered Chat Interface

The chat interface uses streaming responses for a smooth experience:

- **Multiple AI Models**: Choose between Claude, GPT-4, Llama, and more
- **Context-Aware**: Maintains conversation history and user profile
- **Token Optimization**: Intelligent context management for cost efficiency
- **Fallback Mode**: Works without API keys using cached responses

### 2. Voice Input with Deepgram

Advanced voice recording features:

- **Multi-Language STT**: Supports 12 Indian languages
- **Auto-Detection**: Automatically detects spoken language
- **Noise Cancellation**: Built-in echo cancellation and noise suppression
- **Visual Feedback**: Real-time recording indicator with duration

### 3. Offline Mode

Comprehensive offline functionality:

- **Automatic Detection**: Detects network status changes
- **Cached Responses**: Pre-generated answers for common questions
- **LocalStorage**: Persists scheme data for offline access
- **Sync on Reconnect**: Auto-syncs when back online

### 4. Multi-Language Support

Complete localization for Indian users:

```javascript
Supported Languages:
- English (en)
- हिन्दी (hi)
- தமிழ் (ta)
- తెలుగు (te)
- বাংলা (bn)
- मराठी (mr)
- ગુજરાતી (gu)
- ಕನ್ನಡ (kn)
- മലയാളം (ml)
- ਪੰਜਾਬੀ (pa)
- ଓଡ଼ିଆ (or)
- অসমীয়া (as)
```

### 5. Scheme Management

Intelligent scheme recommendation system:

- **11 Government Schemes**: Curated database of MSME schemes
- **Smart Filtering**: Based on business type, location, and eligibility
- **Token Budget**: Optimizes context for API limits
- **Personalization**: Learns from user profile and conversation

## 📱 Mobile Optimization

Designed for rural Indian users:

- **Large Touch Targets**: 48px minimum for easy interaction
- **Safe Area Padding**: Accounts for device notches and home indicators
- **Responsive Design**: Adapts to all screen sizes
- **Low Bandwidth**: Optimized for 2G/3G networks
- **Progressive Enhancement**: Core features work without JavaScript

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `OPENROUTER_API_KEY` | OpenRouter API key for AI responses | No | - |
| `DEEPGRAM_API_KEY` | Deepgram API key for voice transcription | No | - |
| `OPENROUTER_MODEL` | AI model to use | No | `anthropic/claude-3-haiku` |
| `MAX_REQUESTS_PER_MINUTE` | Rate limit per minute | No | `20` |
| `MAX_REQUESTS_PER_DAY` | Rate limit per day | No | `500` |
| `ENABLE_DEBUG_LOGS` | Enable debug logging | No | `false` |

### Model Selection

Available models through OpenRouter:

| Model | Speed | Cost | Best For |
|-------|-------|------|----------|
| `anthropic/claude-3-haiku` | Fast | Low | General queries |
| `anthropic/claude-3-sonnet` | Medium | Medium | Complex tasks |
| `anthropic/claude-3-opus` | Slow | High | Advanced reasoning |
| `openai/gpt-3.5-turbo` | Fast | Low | Quick responses |
| `openai/gpt-4-turbo` | Medium | High | Complex analysis |
| `meta-llama/llama-3-70b` | Medium | Low | Open-source option |

## 🧪 Testing

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Type checking
npm run type-check
```

## 📊 Scheme Database

The system includes 11 government schemes:

1. **PMEGP** - Prime Minister's Employment Generation Programme
2. **CGTMSE** - Credit Guarantee Fund Trust for MSEs
3. **MUDRA** - Micro Units Development & Refinance Agency
4. **Stand Up India** - Loans for SC/ST and Women entrepreneurs
5. **59 Minute Loan** - Quick MSME loans
6. **Udyam Registration** - Official MSME registration
7. **GeM** - Government e-Marketplace
8. **MSME Samadhaan** - Delayed payment resolution
9. **Digital MSME** - Digital adoption scheme
10. **SFURTI** - Cluster development scheme
11. **ZED** - Zero Defect Zero Effect certification

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Use meaningful variable and function names
- Add comments for complex logic
- Ensure mobile responsiveness
- Test offline functionality
- Optimize for low bandwidth

## 🔒 Security

- API keys are never exposed to the client
- Rate limiting prevents abuse
- Input sanitization for all user inputs
- Secure headers with Next.js
- CORS properly configured

## 📈 Performance

Optimizations implemented:

- **Edge Runtime**: For streaming endpoints
- **Token Optimization**: Smart context management
- **Lazy Loading**: Components loaded as needed
- **Image Optimization**: Next.js Image component
- **Code Splitting**: Automatic with Next.js
- **Caching**: LocalStorage for offline mode
- **CDN Ready**: Static assets optimized

## 🎯 Roadmap

- [ ] WhatsApp Integration
- [ ] SMS-based queries
- [ ] Document upload and OCR
- [ ] Application tracking
- [ ] Video tutorials
- [ ] Regional language voice output
- [ ] Analytics dashboard
- [ ] Admin panel
- [ ] Scheme updates via CMS
- [ ] Push notifications

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [OpenRouter](https://openrouter.ai/) for multi-model AI access
- [Deepgram](https://deepgram.com/) for speech-to-text
- [Vercel](https://vercel.com/) for hosting and AI SDK
- [shadcn/ui](https://ui.shadcn.com/) for beautiful components
- Government of India for MSME scheme information

## 💬 Support

For support, please:
- Open an issue on GitHub
- Contact the development team
- Check the documentation

## 🌐 Links

- [Live Demo](https://msme-mitr.vercel.app)
- [Documentation](https://docs.msme-mitr.com)
- [API Reference](https://api.msme-mitr.com/docs)

---

<p align="center">
  Made with ❤️ for Indian MSMEs
</p>

<p align="center">
  <strong>Empowering 6.3 Crore MSMEs across India</strong>
</p>