# Mining AI Assistant - Portable Export Package

This folder (`export-mining-assistant`) is a standalone, portable copy of the complete Mining AI Assistant Chatbot.

---

## 🚀 Quick Automated Installation

To copy this chatbot into any newly cloned repository or branch:

### Option 1: Using the automated PowerShell script
Open PowerShell from this project directory and run:
```powershell
.\copy-chatbot.ps1 -TargetDir "D:\path\to\your-new-cloned-project"
```
The script will automatically:
1. Copy `src/lib/` (all engine, knowledge base, benchmark & data files).
2. Copy `src/components/ui/MiningAICHatWidget.tsx` and `src/components/MiningChart.tsx`.
3. Copy `src/app/api/chat/route.ts`.
4. Ensure `<MiningAICHatWidget />` is mounted in `src/app/layout.tsx`.
5. Ensure responsive CSS styles exist in `src/app/globals.css`.
6. Install `npm install openai mongodb` in the target project.
7. Copy `.env.local` with `OPENAI_API_KEY` if missing.

---

## 📦 Option 2: Manual Copy Steps (Takes < 1 Minute)

If you prefer doing it manually:

### 1. Copy Files & Folders
Copy the following into your new project:
- `export-mining-assistant/src/lib/` ➡️ `your-project/src/lib/`
- `export-mining-assistant/src/components/ui/MiningAICHatWidget.tsx` ➡️ `your-project/src/components/ui/MiningAICHatWidget.tsx`
- `export-mining-assistant/src/components/MiningChart.tsx` ➡️ `your-project/src/components/MiningChart.tsx`
- `export-mining-assistant/src/app/api/chat/route.ts` ➡️ `your-project/src/app/api/chat/route.ts`

### 2. Add Component to `src/app/layout.tsx`
In `src/app/layout.tsx`:
```tsx
import MiningAICHatWidget from "@/components/ui/MiningAICHatWidget";

// Inside <body>...
<MiningAICHatWidget />
```

### 3. Install Required Dependencies
In your new project root:
```bash
npm install openai mongodb
```

### 4. Configure Environment
Make sure `.env.local` contains:
```env
OPENAI_API_KEY=your_openai_api_key_here
```

### 5. Build & Test
```bash
npm run build
npm run dev
```

---

## 🔒 Safe Git Practice Recommendation
If you have push permissions to the repository:
You can simply commit this branch and push it to GitHub/GitLab:
```bash
git add src/lib src/components/MiningChart.tsx src/components/ui/MiningAICHatWidget.tsx src/app/api/chat/route.ts src/app/globals.css package.json package-lock.json
git commit -m "feat: add fully verified Mining AI Chatbot with verified benchmarks and mobile responsiveness"
git push origin <your-branch>
```
Then whenever anyone clones that repository or branch, the chatbot is already included natively!
