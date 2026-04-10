# MedTranslate Frontend - Deployment Guide

After the hackathon is complete, use this guide to deploy MedTranslate to production.

---

## 📦 Prerequisites

- Node.js 16+ installed
- npm or yarn package manager
- Git configured
- Hosting account (see options below)

---

## 🏗️ Build for Production

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (if not already done)
npm install

# Create optimized production build
npm run build

# Preview the build locally
npm run preview
```

The production-ready files will be in `/frontend/dist/`

---

## 🌐 Hosting Options

### Option 1: Vercel (Recommended)

**Advantages**: Zero-config, automatic deployments, free tier

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy (from /frontend directory)
vercel

# Follow prompts - Vercel detects Vite automatically
```

**Link your Git repo for auto-deploys**: https://vercel.com/new

---

### Option 2: Netlify

**Advantages**: Easy UI, plenty of free tier features

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy (from /frontend directory)
netlify deploy --prod --dir=dist

# Or connect via web: https://app.netlify.com/
```

---

### Option 3: AWS Amplify

**Advantages**: Scalable, integrates with AWS services

```bash
# Install AWS Amplify CLI
npm install -g @aws-amplify/cli

# Configure and deploy
amplify init
amplify add hosting
amplify publish
```

---

### Option 4: GitHub Pages

**Advantages**: Free, integrated with Git

1. Add to `vite.config.ts`:
```typescript
export default {
  base: '/MedTranslate/',  // Your repo name
  // ... rest of config
}
```

2. Build and deploy:
```bash
npm run build
npx gh-pages -d dist
```

3. Enable in GitHub repo settings → Pages → Deploy from branch

---

### Option 5: Docker + Cloud Run / ECS / Kubernetes

**Dockerfile**:
```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Deploy Docker image to:
- **Google Cloud Run**: `gcloud run deploy`
- **AWS ECS**: Push to ECR, create task definition
- **Azure Container Instances**: Push to ACR, deploy
- **Kubernetes**: Create deployment manifest

---

## 📊 Performance Optimization

### Before Deployment

1. **Check bundle size**:
```bash
npm run build
# Check /dist/assets/ sizes
```

2. **Minification**: Already done by Vite

3. **Code splitting**: Vite handles automatically

4. **Image optimization**: No images in current build

5. **Environment variables**:
```bash
# Create .env.production
VITE_API_URL=https://api.medtranslate.com
VITE_ENV=production
```

---

## 🔒 Security Before Deploy

- [ ] Remove console logs from production code
- [ ] Set secure CORS headers on backend
- [ ] Enable HTTPS everywhere
- [ ] Set Content Security Policy headers
- [ ] Enable HTTP/2 on hosting
- [ ] Configure GZIP compression
- [ ] Set cache headers appropriately

---

## 🔧 Environment Variables

Create `.env.production`:
```
VITE_API_URL=https://api.yourdomain.com
VITE_APP_NAME=MedTranslate
VITE_ENV=production
```

Use in code:
```typescript
const apiUrl = import.meta.env.VITE_API_URL;
```

---

## 📈 Post-Deployment Checklist

- [ ] Test production build locally with `npm run preview`
- [ ] Verify all pages load correctly
- [ ] Check dark mode toggle works
- [ ] Verify language switching
- [ ] Test on mobile browsers
- [ ] Check accessibility features
- [ ] Monitor Core Web Vitals
- [ ] Set up error tracking (Sentry)
- [ ] Enable analytics (Google Analytics)
- [ ] Test on different devices
- [ ] Verify cache-busting working (CSS/JS)
- [ ] Check 404 error handling
- [ ] Test password reset flow (when backend ready)
- [ ] Verify email notifications (when backend ready)

---

## 📊 Monitoring & Analytics

### Add Google Analytics
```html
<!-- In index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_ID');
</script>
```

### Add Error Tracking (Sentry)
```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_ENV,
});
```

---

## 🚀 CI/CD Setup

### GitHub Actions Workflow
Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: cd frontend && npm install
      - run: cd frontend && npm run build
      - name: Deploy to Vercel
        run: vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
```

---

## 🎯 Post-Hackathon Next Steps

1. **Connect Backend**
   - Update API endpoints in DashboardPage.tsx
   - Implement real authentication
   - Add PDF processing

2. **Database**
   - Replace localStorage with backend
   - Implement user profiles
   - Add data persistence

3. **Features**
   - Real PDF upload and parsing
   - Advanced medical analysis
   - Integration with medical databases
   - Report generation

4. **Compliance**
   - HIPAA compliance for healthcare data
   - GDPR compliance for EU users
   - Data encryption
   - Audit logging

5. **Scaling**
   - Load testing
   - CDN integration
   - Database optimization
   - API rate limiting

---

## 📱 Mobile App (Future)

Consider React Native/Expo for iOS and Android:

```bash
# Create Expo project
npx create-expo-app medtranslate-mobile

# Share code with web through monorepo structure
/packages
  /web (current React app)
  /mobile (React Native)
  /shared (utilities, types, logic)
```

---

## 📞 Deployment Support

### Common Issues

**Issue**: Build fails with dependency error
```bash
# Solution: Clean install
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Issue**: Port 3000 already in use
```bash
# Solution: Use different port
npm run dev -- --port 3001
```

**Issue**: CSS not loading in production
```bash
# Solution: Check base path in vite.config.ts
export default {
  base: '/',  // or '/MedTranslate/' if in subdirectory
}
```

---

## 🎓 Useful Resources

- **Vite Deployment Guide**: https://vitejs.dev/guide/static-deploy.html
- **Vercel Next.js Guide**: https://vercel.com/docs/frameworks/nextjs
- **Netlify Deployment**: https://docs.netlify.com/
- **Firebase Hosting**: https://firebase.google.com/docs/hosting/
- **AWS Amplify**: https://aws.amazon.com/amplify/
- **Docker & Kubernetes**: https://kubernetes.io/docs/setup/

---

## ✅ Ready to Launch

Once deployed, your MedTranslate frontend will be accessible globally. Users from anywhere can access the application and:

- Create accounts (when backend ready)
- Upload medical reports
- Get plain-language summaries
- Receive triage guidance
- Access their history
- Use it in their preferred language
- Enable accessibility features

---

**Congratulations on launching MedTranslate!** 🎉

The frontend is production-ready. Once you add the backend integration, you'll have a complete medical translation platform.

Good luck! 🚀
