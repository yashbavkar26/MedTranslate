# MedTranslate Frontend - Quick Start Guide

**English** | [हिंदी](#हिंदी) | [Konkani](#konkani) | [Tamil](#tamil)

---

## 🚀 Getting Started (5 minutes)

### Step 1: Install Dependencies
```bash
cd /workspaces/MedTranslate/frontend
npm install
```
*The dev server is already running on http://localhost:3000*

### Step 2: View the App
Open your browser to: **http://localhost:3000**

### Step 3: Try the Demo

1. **On the Intro Page**: Click "Get Started" 
2. **On Login Page**: Enter any email + any password, click "Sign In"
3. **On Dashboard**: Click the yellow "⚡ Demo Mode" button
4. **View Results**: See the plain-language summary and color-coded Triage status

**That's it!** You've seen the complete workflow.

---

## 🎯 What You Can Try

### Change Language
- Click the language selector (EN/HI/KK/TA) in top-right
- UI instantly translates to Hindi, Konkani, or Tamil

### Toggle Dark Mode
- Click the moon/sun icon in top-right
- App switches between light and dark themes

### Enable Accessibility
- Click ♿ (wheelchair) icon in top-right
- Check "Dyslexic-friendly Font" → Text changes to OpenDyslexic
- Check "High Contrast Mode" → Bold, high-contrast styling
- Each setting persists when you reload

### Manual Analysis
1. Stay on Dashboard
2. Type medical symptoms or lab values in the text area
3. Click "Analyze" button
4. See plain-language summary and triage level

### Check History
1. Click "My History" tab
2. See all past analyses you've created
3. Click any item to re-view full results

---

## 📱 Mobile Testing

The app is fully responsive. Try on mobile by:

1. **Mobile Chrome DevTools**:
   - Press F12 → Click device toggle → Select "iPhone 12"
   - Or use Ctrl+Shift+M (Windows) / Cmd+Shift+M (Mac)

2. **Responsive Behavior**:
   - Navigation collapses on small screens
   - Layouts adapt to screen size
   - Touch-friendly button sizing

---

## 📂 Project Structure

```
frontend/
├── src/
│   ├── components/       # UI components (SummaryCard, TriageIndicator)
│   ├── constants/        # Translations & mock data
│   ├── context/          # Global state (language, theme, login)
│   ├── hooks/            # Custom hooks (localStorage, theme)
│   ├── layouts/          # MainLayout with header
│   ├── pages/            # 4 main pages (Intro, Login, Dashboard)
│   ├── App.tsx           # Root component
│   ├── main.tsx          # Entry point
│   └── index.css         # Tailwind styles
├── index.html            # HTML template
├── package.json          # Dependencies
├── vite.config.ts        # Build config
├── tsconfig.json         # TypeScript config
└── tailwind.config.js    # Tailwind settings
```

---

## 🔧 Useful Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 🎨 Key Features to Show

| Feature | How to Access | What to Look For |
|---------|---------------|-----------------|
| **Light/Dark Mode** | Sun/Moon icon in header | Instant theme switch, all colors adapt |
| **Multi-Language** | Language selector (EN/HI/KK/TA) | ALL UI text translates |
| **Dyslexic Font** | ♿ → Toggle "Dyslexic Font" | Text changes to OpenDyslexic |
| **High Contrast** | ♿ → Toggle "High Contrast" | Bold borders, maximum contrast |
| **Plain Language** | Click "Demo Mode" | Complex medical terms → simple explanations |
| **Triage Colors** | See colored indicator | Red (Emergency), Yellow (Doctor), Green (Home) |
| **History** | Click "My History" tab | Past analyses persist in LocalStorage |

---

## 💾 Data Persistence

The app auto-saves to browser storage:
- Language preference
- Theme preference (light/dark)
- Accessibility settings
- Login state
- All analysis history

**Note**: Data persists until browser cache is cleared

---

## 🐛 Troubleshooting

### Port 3000 Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
npm run dev -- --port 3001
```

### Build Errors
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Styles Not Loading
```bash
# Vite cache issue
rm -rf .vite
npm run dev
```

---

## 🎯 Demo Flow for Judges (2 minutes)

1. **Load app** → See professional hero landing
2. **Login** → Any email/password (demo mode)
3. **Click Demo Mode** → Instant sample analysis
4. **Switch language** → Show localization (Hindi/Konkani/Tamil)
5. **Toggle dark mode** → Show theme switching
6. **Enable accessibility** → Show dyslexic font + high contrast
7. **Check history** → Show persistent data storage

---

## 📚 File Highlights

### Main Pages
- **IntroPage.tsx**: Hero landing with features
- **LoginPage.tsx**: Login form (demo: any credentials work)
- **DashboardPage.tsx**: Main interface with chatbot UI, analysis, history

### Key Components
- **SummaryCard.tsx**: Displays plain-language medical summary
- **TriageIndicator.tsx**: Color-coded emergency level (Red/Yellow/Green)
- **MainLayout.tsx**: Header with theme/language/accessibility toggles

### Core Logic
- **translations.ts**: Hardcoded translations (EN/HI/KK/TA)
- **mockData.ts**: Sample medical data for Demo Mode
- **useLocalStorage.ts**: Theme, accessibility, data persistence
- **AppContext.tsx**: Global state (language, login, current page)

---

## 🎓 Learning the Code

Good files to read in order:

1. **App.tsx** - See page routing logic
2. **IntroPage.tsx** - Simple page with branding
3. **DashboardPage.tsx** - Complex page with state and analysis logic
4. **useLocalStorage.ts** - Understand persistence & theme switching
5. **SummaryCard.tsx** - See component composition

---

## 🚀 To Backend Integration

When backend API is ready, the integration point is in **DashboardPage.tsx**:

Current (Demo):
```typescript
const newResult: AnalysisResult = { ... };  // Mock data
```

Future (Backend):
```typescript
const response = await fetch('/api/analyze', {
  method: 'POST',
  body: JSON.stringify({ input, language })
});
const newResult = await response.json();
```

---

## 📞 Questions?

Refer to:
- **[frontend/README.md](frontend/README.md)** - Full technical documentation
- **[FRONTEND_BUILD_SUMMARY.md](FRONTEND_BUILD_SUMMARY.md)** - Detailed feature overview
- **Code comments** in component files

---

## ✅ You're Ready!

The app is fully functional and ready to impress at the hackathon. 

**Next**: Open http://localhost:3000 and click "Get Started"!

---

---

# हिंदी

## 🚀 शुरू करना (5 मिनट)

### चरण 1: निर्भरताएँ स्थापित करें
```bash
cd frontend
npm install
```

### चरण 2: ऐप देखें
अपने ब्राउज़र में खोलें: **http://localhost:3000**

### चरण 3: डेमो आजमाएं

1. **इंट्रो पेज पर**: "शुरू करें" पर क्लिक करें
2. **लॉगिन पेज पर**: कोई भी ईमेल + पासवर्ड दर्ज करें
3. **डैशबोर्ड पर**: "डेमो मोड" बटन पर क्लिक करें
4. **परिणाम देखें**: सादी भाषा का सारांश और रंग-कोडित ट्रिएज दर्जा

---

# Konkani

## 🚀 सुरू करा (5 मिनिटांनी)

### खरोळ 1: अवलंबितांची स्थापना करा
```bash
cd frontend
npm install
```

### खरोळ 2: अ‍ॅप पहा
तुमच्या ब्राउজरमध्ये खोला: **http://localhost:3000**

### खरोळ 3: डेमो आजमून पहा

1. **इंट्रो पानावर**: "सुरू करा" क्लिक करा
2. **लॉगइन पानावर**: कोणतंच ईमेल + पासवर्ड घालून साइन इन करा
3. **डॅशबोर्डवर**: पिवळें "डेमो मोड" बटन क्लिक करा

---

# Tamil

## 🚀 தொடங்குவோம் (5 நிமிடங்கள்)

### படி 1: சார்புநிலைகளை நிறுவவும்
```bash
cd frontend
npm install
```

### படி 2: பயன்பாட்டைக் காணவும்
உங்கள் உலாவியில் திறக்க: **http://localhost:3000**

### படி 3: டெமோவை முயற்சி செய்யவும்

1. **முதல் பக்கத்தில்**: "தொடங்கவும்"ஐ கிளிக் செய்யவும்
2. **வசன்திறப்பு பக்கத்தில்**: எந்த ईமेலும் + கடவுச்சொல் உள்ளிடவும்
3. **டாஷ்போர்டில்**: மஞ்ஜள "டெமோ பயன்முறை" பொத்தானைக் கிளிக் செய்யவும்

---

**🎉 தயாராக? http://localhost:3000 திறக்கவும்!**
