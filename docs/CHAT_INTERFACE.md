# Enhanced Chat Interface Documentation

## Overview

The Enhanced Chat Interface is a mobile-optimized, accessible, and feature-rich chat UI for the MSME Mitr AI advisor. It provides a WhatsApp-like experience with advanced features like markdown rendering, voice input, contextual quick replies, and dark mode support.

## Components

### 1. EnhancedChatInterface

Main chat component that orchestrates all chat functionality.

**Location:** `/components/mobile/EnhancedChatInterface.tsx`

**Features:**
- ✅ Streaming AI responses with Vercel AI SDK
- ✅ Markdown rendering for rich text
- ✅ Voice input with Deepgram transcription
- ✅ Contextual quick reply suggestions
- ✅ Dark mode / Light mode toggle
- ✅ Offline mode support
- ✅ Multi-language support (12 languages)
- ✅ AI model selection (Claude, GPT, Llama)
- ✅ Accessibility features (ARIA labels, screen reader announcements)
- ✅ Mobile-first responsive design

**Props:**
```typescript
interface EnhancedChatInterfaceProps {
  language?: string;        // Language code (default: "en")
  userProfile?: any;        // User profile for personalization
}
```

**Usage:**
```tsx
import { EnhancedChatInterface } from "@/components/mobile/EnhancedChatInterface";

export default function ChatPage() {
  return <EnhancedChatInterface language="en" userProfile={userProfile} />;
}
```

---

### 2. MessageBubble

Renders individual chat messages with markdown support and copy functionality.

**Location:** `/components/mobile/MessageBubble.tsx`

**Features:**
- Markdown rendering for AI messages (lists, links, code, headings)
- Plain text rendering for user messages
- Copy-to-clipboard button (visible on hover)
- Smooth animations
- Avatar display
- Responsive design

**Props:**
```typescript
interface MessageBubbleProps {
  message: {
    id: string;
    role: 'user' | 'assistant';
    content: string;
  };
  showAvatar?: boolean;     // Show avatar (default: true)
  language?: string;        // Language code for translations
}
```

**Usage:**
```tsx
<MessageBubble
  message={{ id: '1', role: 'assistant', content: '**Hello!** How can I help?' }}
  showAvatar={true}
  language="en"
/>
```

**Markdown Support:**
- **Bold**, *Italic*, ~~Strikethrough~~
- [Links](https://example.com)
- `Inline code` and code blocks
- Lists (ordered and unordered)
- Headings (H1, H2, H3)
- Paragraphs with proper spacing

---

### 3. TypingIndicator

Shows an animated typing indicator when AI is generating a response.

**Location:** `/components/mobile/TypingIndicator.tsx`

**Features:**
- Animated three-dot bounce effect
- Customizable message
- Avatar display
- Smooth fade-in animation

**Props:**
```typescript
interface TypingIndicatorProps {
  message?: string;         // Custom message (default: "Thinking...")
}
```

**Usage:**
```tsx
{isLoading && <TypingIndicator message="Thinking..." />}
```

---

### 4. QuickReplyChips

Displays contextual quick reply suggestions as chips/buttons.

**Location:** `/components/mobile/QuickReplyChips.tsx`

**Features:**
- Contextual suggestions based on AI responses
- Multi-language support
- Icon support
- Rounded chip design
- Hover effects

**Props:**
```typescript
interface QuickReplyChipsProps {
  suggestions: QuickReply[];
  onSelect: (text: string) => void;
  disabled?: boolean;
  language?: string;
}

interface QuickReply {
  text: string;
  textHi?: string;          // Hindi translation
  icon?: React.ReactNode;
  action?: string;
}
```

**Usage:**
```tsx
import { QuickReplyChips, commonQuickReplies } from "@/components/mobile/QuickReplyChips";

<QuickReplyChips
  suggestions={commonQuickReplies.scheme}
  onSelect={(text) => handleQuickPrompt(text)}
  disabled={isLoading}
  language="en"
/>
```

**Predefined Quick Replies:**
- `commonQuickReplies.eligibility` - Eligibility-related questions
- `commonQuickReplies.scheme` - Scheme-related actions
- `commonQuickReplies.loan` - Loan-related questions
- `commonQuickReplies.welcome` - Welcome/initial questions

---

## Styling & Theming

### Dark Mode

Enhanced dark mode with AMOLED-friendly colors:
- Pure black background (`oklch(0.08 0 0)`) for battery saving
- Vibrant saffron primary (`oklch(0.7 0.20 50)`)
- High contrast for readability
- Subtle borders and shadows

**Toggle Theme:**
```tsx
import { useTheme } from "next-themes";

const { theme, setTheme } = useTheme();

<Button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
  Toggle Theme
</Button>
```

### Custom CSS Classes

**Chat-specific utilities:**
- `.chat-scrollbar` - Styled scrollbar for chat area
- `.animate-slide-in` - Slide-in-bottom animation
- `.animate-fade-in` - Fade-in animation
- `.btn-touch` - Touch-friendly button (48px min height)
- `.safe-bottom` - Safe area padding for mobile notches

**Usage in globals.css:**
```css
/* Already defined in globals.css */
@layer utilities {
  .chat-scrollbar::-webkit-scrollbar {
    width: 4px;
  }
  /* ... */
}
```

---

## Features Deep Dive

### 1. Markdown Rendering

AI responses support GitHub-flavored markdown:

**Example AI Response:**
```markdown
Here are the **key benefits** of the PMEGP scheme:

1. **Subsidy:** Up to 35% subsidy
2. **Loan Amount:** ₹10 lakh to ₹25 lakh
3. **Training:** Free entrepreneurship training

For more details, visit [official website](https://kviconline.gov.in/pmegp/).
```

**Rendered Output:**
- Bold text properly styled
- Numbered lists with spacing
- Links with primary color and underline on hover
- Responsive to dark/light mode

---

### 2. Voice Input

Integrated with Deepgram for voice transcription:

**How it works:**
1. User clicks the mic button
2. Recording starts (red indicator appears)
3. User speaks their question
4. Stops recording
5. Audio transcribed via Deepgram
6. Transcript populated in input field
7. Auto-submit (optional)

**Voice Hook:**
```tsx
import { useChatVoiceInput } from "@/hooks/useVoiceRecording";

const voice = useChatVoiceInput((transcript) => {
  setInput(transcript);
  // Auto-submit
  form.requestSubmit();
});

// Use in UI
<Button onClick={voice.toggleVoiceMode}>
  {voice.isRecording ? <Square /> : <Mic />}
</Button>
```

---

### 3. Contextual Quick Replies

Quick replies are generated based on AI response content:

**Logic:**
```tsx
const generateQuickReplies = (content: string) => {
  if (content.includes('eligib') || content.includes('qualify')) {
    return commonQuickReplies.eligibility;
  } else if (content.includes('scheme')) {
    return commonQuickReplies.scheme;
  } else if (content.includes('loan')) {
    return commonQuickReplies.loan;
  }
};
```

**Custom Quick Replies:**
```tsx
const customReplies: QuickReply[] = [
  {
    text: "Tell me more",
    textHi: "और बताएं",
    icon: <HelpCircle className="w-4 h-4" />
  },
  // ...
];

<QuickReplyChips suggestions={customReplies} onSelect={handleSelect} />
```

---

### 4. Offline Mode

Automatic offline detection and fallback responses:

**How it works:**
1. `useOfflineMode` hook detects network status
2. If offline, shows "Offline Mode" badge
3. User messages receive cached/offline responses
4. Data syncs when back online

**Offline Hook:**
```tsx
import { useOfflineMode } from "@/hooks/useOfflineMode";

const { isOfflineMode, getOfflineResponse, status } = useOfflineMode();

if (isOfflineMode) {
  const response = getOfflineResponse(userInput);
  // Show offline response
}
```

---

### 5. AI Model Selection

Support for multiple AI models:
- **Claude Haiku** - Fast & efficient
- **Claude Sonnet** - Balanced
- **GPT-3.5 Turbo** - Fast OpenAI
- **Llama 3 70B** - Open source

**Model Selector UI:**
```tsx
<DropdownMenu>
  <DropdownMenuTrigger>
    <Settings /> {selectedModel}
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    {availableModels.map(model => (
      <DropdownMenuItem onClick={() => setSelectedModel(model.id)}>
        {model.name}
      </DropdownMenuItem>
    ))}
  </DropdownMenuContent>
</DropdownMenu>
```

---

## Accessibility Features

### Screen Reader Support

**ARIA Labels:**
```tsx
<Input
  aria-label={isHindi ? 'संदेश इनपुट' : 'Message input'}
  placeholder="Type your message..."
/>

<Button
  aria-label={isHindi ? 'भेजें' : 'Send message'}
  type="submit"
>
  <Send />
</Button>
```

**Live Announcements:**
```tsx
const announceMessage = (content: string) => {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = `New message: ${content}`;
  document.body.appendChild(announcement);
  setTimeout(() => document.body.removeChild(announcement), 1000);
};
```

### Touch-Friendly Design

- **Minimum 48px** touch targets (WCAG compliant)
- **Large font sizes** (16px minimum for inputs)
- **High contrast** in both light and dark modes
- **Clear visual feedback** for all interactions

---

## Mobile Optimizations

### 1. Auto-scroll on New Messages
```tsx
useEffect(() => {
  if (scrollAreaRef.current) {
    scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
  }
}, [messages]);
```

### 2. Safe Area Support
```tsx
<form className="border-t bg-background p-4 safe-bottom">
  {/* Input area respects device safe areas */}
</form>
```

### 3. Prevent iOS Zoom on Input Focus
```tsx
<Input
  className="text-base" // 16px minimum prevents iOS zoom
  style={{ fontSize: '16px' }}
/>
```

### 4. Touch-friendly Buttons
```tsx
<Button className="btn-touch px-6 rounded-full">
  {/* 48px min height for easy tapping */}
</Button>
```

---

## Performance Optimizations

### 1. Streaming Responses
Uses Vercel AI SDK for efficient streaming:
```tsx
const { messages, isLoading } = useChat({
  api: '/api/chat/stream',
  streamMode: 'text',
});
```

### 2. Memoized Callbacks
```tsx
const handleQuickPrompt = useCallback((prompt: string) => {
  setInput(prompt);
  form.requestSubmit();
}, [setInput]);
```

### 3. Lazy Loading Images
```tsx
<Avatar loading="lazy" />
```

---

## Multi-language Support

### Supported Languages
- English (en)
- Hindi (hi)
- Tamil (ta)
- Telugu (te)
- Bengali (bn)
- Gujarati (gu)
- Kannada (kn)
- Malayalam (ml)
- Marathi (mr)
- Odia (or)
- Punjabi (pa)
- Urdu (ur)

### Language Switching
```tsx
<EnhancedChatInterface language="hi" />
```

### Translatable UI Elements
```tsx
const isHindi = language === "hi";

<Button>
  {isHindi ? 'भेजें' : 'Send'}
</Button>
```

---

## API Integration

### Chat Stream Endpoint

**Endpoint:** `/api/chat/stream`

**Request Body:**
```json
{
  "messages": [
    { "role": "user", "content": "Tell me about PMEGP" }
  ],
  "sessionId": "uuid-session-id",
  "language": "en",
  "userProfile": { /* user data */ },
  "model": "anthropic/claude-3-haiku"
}
```

**Response:**
- Streaming text response (SSE format)
- Headers: `X-Session-Id`, `X-Model-Used`

---

## Customization Guide

### 1. Add Custom Quick Prompts

Edit `EnhancedChatInterface.tsx`:
```tsx
const quickPrompts: QuickPrompt[] = [
  {
    text: "Your custom prompt",
    textHi: "आपका कस्टम प्रॉम्प्ट",
    icon: <YourIcon className="w-4 h-4" />,
    category: "custom",
  },
  // ...
];
```

### 2. Customize Message Bubble Styling

Edit `MessageBubble.tsx`:
```tsx
<Card
  className={`p-3 ${
    isAssistant
      ? "bg-gradient-to-br from-purple-500 to-blue-500" // Custom gradient
      : "bg-primary text-primary-foreground"
  }`}
>
```

### 3. Add New AI Models

Edit `availableModels` in `EnhancedChatInterface.tsx`:
```tsx
const availableModels = [
  {
    id: 'your-provider/your-model',
    name: 'Your Model Name',
    description: 'Description'
  },
  // ...
];
```

### 4. Customize Typing Indicator

Edit `TypingIndicator.tsx`:
```tsx
<div className="flex items-center gap-1">
  <div className="w-3 h-3 bg-primary rounded-full animate-ping" />
  {/* Custom animation */}
</div>
```

---

## Troubleshooting

### Issue: Messages not scrolling to bottom
**Solution:** Ensure ScrollArea ref is properly connected:
```tsx
const scrollAreaRef = useRef<HTMLDivElement>(null);
<ScrollArea ref={scrollAreaRef} className="flex-1">
```

### Issue: Dark mode not applying
**Solution:** Ensure ThemeProvider wraps your app in `layout.tsx`:
```tsx
import { ThemeProvider } from "next-themes";

<ThemeProvider attribute="class" defaultTheme="dark">
  {children}
</ThemeProvider>
```

### Issue: Voice input not working
**Solution:** Check Deepgram API key in environment variables:
```bash
DEEPGRAM_API_KEY=your_api_key_here
```

### Issue: Markdown not rendering
**Solution:** Ensure react-markdown is installed:
```bash
npm install react-markdown remark-gfm
```

---

## Best Practices

### 1. **Always use language parameter**
```tsx
<EnhancedChatInterface language={userPreferredLanguage} />
```

### 2. **Handle errors gracefully**
```tsx
onError: (error) => {
  console.error('Chat error:', error);
  toast.error('Failed to get response');
}
```

### 3. **Optimize for mobile first**
```tsx
// Mobile-first responsive design
<div className="flex flex-col md:flex-row">
```

### 4. **Use semantic HTML**
```tsx
<main role="main" aria-label="Chat interface">
  <div role="log" aria-label="Chat messages">
    {/* Messages */}
  </div>
</main>
```

### 5. **Test on actual devices**
- Test on iOS Safari (notch handling)
- Test on Android Chrome (keyboard behavior)
- Test on tablets (responsive breakpoints)

---

## Testing Checklist

- [ ] Messages render correctly
- [ ] Auto-scroll works on new messages
- [ ] Voice input records and transcribes
- [ ] Quick replies appear contextually
- [ ] Dark/light mode toggle works
- [ ] Offline mode activates when offline
- [ ] Copy button works on AI messages
- [ ] Markdown renders properly
- [ ] Mobile keyboard doesn't overlap input
- [ ] Safe area insets respected on iOS
- [ ] Screen reader announces new messages
- [ ] All buttons have proper ARIA labels
- [ ] Touch targets are at least 48px
- [ ] Loading states visible during AI response
- [ ] Error states handled gracefully

---

## Future Enhancements

Potential features to add:

1. **Message Editing** - Edit sent messages
2. **Message Reactions** - React to messages with emojis
3. **File Upload** - Upload documents/images
4. **Voice Output** - Text-to-speech for AI responses
5. **Message Search** - Search within conversation history
6. **Conversation Export** - Export chat as PDF/text
7. **Multi-user Chat** - Support for group conversations
8. **Message Threading** - Reply to specific messages
9. **Rich Media** - Display images, videos inline
10. **Custom Themes** - User-selected color schemes

---

## Support & Resources

- **Documentation:** `/docs/CHAT_INTERFACE.md`
- **Components:** `/components/mobile/`
- **API Routes:** `/app/api/chat/`
- **Hooks:** `/hooks/`
- **Types:** `/types/index.ts`

---

## Conclusion

The Enhanced Chat Interface provides a robust, accessible, and mobile-optimized foundation for the MSME Mitr AI advisor. It combines modern design patterns with practical features to create an intuitive user experience for discovering and applying to government schemes.

For questions or contributions, please refer to the project's main README.
