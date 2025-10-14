# 🤖 AI Assistant pentru PNRR Map

## Descriere

AI Assistant este un chatbot inteligent integrat în platforma PNRR Map, alimentat de Google Gemini 1.5 Flash. Ajută utilizatorii să înțeleagă și să navigheze datele PNRR prin conversații naturale în limba română.

## Funcționalități

### ✅ Ce poate face AI-ul:

- **Statistici pe județe**: "Câte proiecte sunt în Cluj?"
- **Comparații**: "Compară Alba cu Brașov"
- **Topuri**: "Care sunt județele cu cele mai multe fonduri?"
- **Explicații programe**: "Ce este POCIDIF?"
- **Analize**: "Care program are cele mai multe fonduri?"
- **Navigare asistată**: Sugerează acțiuni și explorări

### ❌ Ce NU face AI-ul:

- Nu inventează cifre - folosește doar date reale
- Nu răspunde despre alte subiecte decât PNRR
- Nu oferă sfaturi politice sau opinii
- Nu promite acțiuni pe care aplicația nu le poate face

## Configurare

### 1. API Key Gemini

1. Accesează [Google AI Studio](https://aistudio.google.com/)
2. Creează cont Google (dacă nu ai)
3. Generează API Key nou
4. Copiază API Key-ul

### 2. Configurare Environment

Creează fișierul `.env.local` în root-ul proiectului:

```bash
# .env.local
VITE_GEMINI_API_KEY=your_api_key_here
```

⚠️ **IMPORTANT**: Nu commita `.env.local` în Git! Este deja adăugat în `.gitignore`.

### 3. Verificare Configurare

Deschide aplicația și verifică în console:

```javascript
// În browser console
window.testGemini()  // Testează conexiunea
window.testPNRR()    // Testează cu prompt PNRR
```

## Structura Fișierelor

```
src/
├── config/
│   ├── gemini.js              # Configurație API Gemini
│   └── pnrrSystemPrompt.js    # System prompt și context builder
├── hooks/
│   └── useGeminiChat.js       # Hook pentru interacțiune cu API
├── components/
│   └── AIAssistant/
│       ├── ChatWidget.jsx     # Componenta chat widget
│       └── ChatWidget.css     # Stiluri chat widget
└── utils/
    └── testGemini.js          # Utilitar testare API
```

## Utilizare

### În Aplicație

Widget-ul apare automat în colțul dreapta-jos al paginii. Click pe buton pentru a deschide chat-ul.

### Exemple de Întrebări

```
"Câte proiecte sunt în Cluj?"
"Compară Alba cu Brașov"
"Care sunt top 5 județe?"
"Ce este programul PDD?"
"Arată-mi statistici pentru Transport"
"Care județ are cele mai multe fonduri?"
```

## Costuri și Limite

### Free Tier (Gemini 1.5 Flash)

- ✅ 15 requests/minut
- ✅ 1,500 requests/zi
- ✅ 1,000,000 tokens/lună GRATUIT

### Estimare pentru PNRR Map

- ~50-100 utilizatori/zi
- ~5-10 întrebări/utilizator
- = 500-1000 requests/zi
- **Încape în FREE TIER!** 🎉

### Dacă Depășești

Paid Tier:
- $0.075 per 1M input tokens
- $0.30 per 1M output tokens
- Estimare: ~$5-10/lună pentru 10,000 requests

## Personalizare

### Modifică System Prompt

Editează `src/config/pnrrSystemPrompt.js`:

```javascript
export const PNRR_SYSTEM_PROMPT = `
  // Adaugă sau modifică instrucțiuni aici
`
```

### Modifică Stiluri

Editează `src/components/AIAssistant/ChatWidget.css`:

```css
.chat-toggle {
  /* Personalizează culori, dimensiuni, etc. */
}
```

### Modifică Comportament

Editează `src/hooks/useGeminiChat.js`:

```javascript
generationConfig: {
  temperature: 0.7,  // 0.0 = precis, 1.0 = creativ
  maxOutputTokens: 1024  // Lungime răspuns
}
```

## Troubleshooting

### AI-ul nu apare

- Verifică că `.env.local` există și conține API Key-ul
- Verifică că aplicația este repornită după adăugarea `.env.local`
- Verifică console pentru erori

### Erori API

```
❌ 403 Forbidden
→ API Key invalid sau expirat

❌ 429 Too Many Requests
→ Ai depășit limita de requests (15/min sau 1500/zi)

❌ 500 Internal Server Error
→ Problemă temporară la Google, încearcă din nou
```

### Răspunsuri lente

- Normal: 1-3 secunde
- Dacă > 5 secunde: verifică conexiunea internet
- Dacă persistent: verifică status Google AI Studio

## Dezvoltare Viitoare

### Funcționalități Planificate

- [ ] Sugestii de întrebări (quick actions)
- [ ] Istoricul conversațiilor (persistent)
- [ ] Export conversații
- [ ] Voice input
- [ ] Multilingv (EN, FR, DE)
- [ ] Integrare cu endpoint-uri suplimentare (indicatori_total, persons)
- [ ] Analytics utilizare

### Îmbunătățiri

- [ ] Cache răspunsuri frecvente
- [ ] Optimizare prompt pentru token usage
- [ ] A/B testing pentru system prompt
- [ ] Feedback utilizatori

## Suport

Pentru probleme sau întrebări:
- Verifică acest README
- Testează cu `window.testGemini()` în console
- Verifică [Google AI Studio Documentation](https://ai.google.dev/docs)

## Licență

Acest modul face parte din proiectul PNRR Map și folosește Google Gemini API conform termenilor și condițiilor Google.
