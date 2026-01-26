# 🚀 Setup Guide
## Complete Installation Instructions

**Difficulty**: Beginner-friendly (designed for someone with 1 year of computer experience)
**Time**: 1-2 hours for full setup

---

## WHAT YOU'LL NEED

Before starting, make sure you have:

1. **A Computer** (Mac, Windows, or Linux)
2. **Internet Connection**
3. **Email Address** (for signing up for services)
4. **$20-50** (for initial API credits - some have free tiers)

---

## STEP 1: INSTALL REQUIRED SOFTWARE

### 1.1 Install Node.js

Node.js is like a translator that lets your computer understand JavaScript code.

**On Mac:**
1. Open "Terminal" (search for it in Spotlight - press Cmd+Space)
2. Install Homebrew first (a tool that installs other tools):
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```
3. Install Node.js:
```bash
brew install node
```

**On Windows:**
1. Go to https://nodejs.org
2. Click the big green button that says "LTS" (Long Term Support)
3. Run the downloaded file and click Next until it's done
4. Restart your computer

**Check if it worked:**
Open Terminal (Mac) or Command Prompt (Windows) and type:
```bash
node --version
```
You should see something like `v20.x.x`

### 1.2 Install Git

Git is like a time machine for your code - it remembers every change.

**On Mac:**
```bash
brew install git
```

**On Windows:**
1. Go to https://git-scm.com/download/win
2. Download and run the installer
3. Use all default options

**Check if it worked:**
```bash
git --version
```

### 1.3 Install Claude Code

This is the AI that will build your apps!

```bash
npm install -g @anthropic-ai/claude-code
```

**Check if it worked:**
```bash
claude --version
```

---

## STEP 2: GET YOUR API KEYS

Think of API keys like passwords that let your computer talk to AI services.

### 2.1 Anthropic (Claude) - REQUIRED

This is the brain of the system.

1. Go to https://console.anthropic.com
2. Click "Sign Up" and create an account
3. Go to "API Keys" in the left menu
4. Click "Create Key"
5. Name it "AppFactory" and copy the key

**Save it somewhere safe!** It looks like: `sk-ant-api03-xxxxxxxxxxxx`

**Cost**: Pay-as-you-go. Budget $10-20/month to start.

### 2.2 Google Gemini - REQUIRED

For image and video generation.

1. Go to https://ai.google.dev
2. Sign in with your Google account
3. Click "Get API Key"
4. Click "Create API Key"
5. Copy the key

**Cost**: FREE tier includes 1,500 images/day!

### 2.3 Vercel - REQUIRED

Where your apps will live online.

1. Go to https://vercel.com/signup
2. Click "Continue with GitHub" (you'll need a GitHub account)
3. If you don't have GitHub, go to https://github.com and sign up first
4. Once logged in, go to Settings → Tokens
5. Click "Create" and copy the token

**Cost**: FREE for hobby projects!

### 2.4 Telegram Bot - REQUIRED

For getting alerts on your phone.

1. Open Telegram app (download from app store if needed)
2. Search for @BotFather and open the chat
3. Type `/newbot`
4. Give your bot a name like "My App Factory"
5. Give it a username like `myappfactory_bot`
6. Copy the token BotFather gives you

**Cost**: FREE!

### 2.5 CapSolver - OPTIONAL (but recommended)

For solving CAPTCHAs automatically.

1. Go to https://www.capsolver.com
2. Sign up for an account
3. Add $5-10 of credit (it's pay-as-you-go)
4. Go to Dashboard → API Key
5. Copy your key

**Cost**: ~$2 per 1,000 CAPTCHAs solved

### 2.6 Stripe - WHEN READY TO SELL

For accepting payments.

1. Go to https://dashboard.stripe.com/register
2. Sign up with your email
3. **Note**: You'll need to complete business verification later
4. Go to Developers → API Keys
5. Copy both the publishable key and secret key

**Cost**: 2.9% + $0.30 per transaction (only when you make money!)

---

## STEP 3: SET UP YOUR WORKSPACE

### 3.1 Create Your Factory Folder

Open Terminal/Command Prompt and run:

```bash
# Go to your home folder
cd ~

# Create app factory folder
mkdir app-factory
cd app-factory

# Initialize git
git init
```

### 3.2 Download the Factory Files

```bash
# Clone the factory system
git clone https://github.com/your-username/v4-autonomous-factory.git .

# Or if no git repo, create the structure:
mkdir -p agents skills workflows dashboard scripts config docs
```

### 3.3 Set Up Your API Keys

Create a file called `.env` in your app-factory folder:

```bash
# Create the file
touch .env
```

Open `.env` with any text editor and add your keys:

```
# REQUIRED
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
GEMINI_API_KEY=your-gemini-key-here
VERCEL_TOKEN=your-vercel-token-here
TELEGRAM_BOT_TOKEN=your-telegram-token-here

# OPTIONAL
CAPSOLVER_API_KEY=your-capsolver-key-here
STRIPE_SECRET_KEY=sk_test_your-key-here
STRIPE_PUBLISHABLE_KEY=pk_test_your-key-here

# SETTINGS
MONTHLY_BUDGET=50
ALERT_CHAT_ID=your-telegram-chat-id
```

**Getting your Telegram Chat ID:**
1. Message your new bot on Telegram (just say "hi")
2. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
3. Look for `"chat":{"id":` - that number is your chat ID

---

## STEP 4: RUN THE SETUP SCRIPT

We've made a script that does everything automatically:

```bash
# Make it executable (Mac/Linux only)
chmod +x scripts/setup.sh

# Run it
./scripts/setup.sh
```

**On Windows, use PowerShell:**
```powershell
.\scripts\setup.ps1
```

The script will:
1. ✅ Check all your API keys work
2. ✅ Install required packages
3. ✅ Set up n8n for automation
4. ✅ Configure the dashboard
5. ✅ Test everything is connected

---

## STEP 5: VERIFY EVERYTHING WORKS

### Test Claude Code

```bash
# Start Claude Code
claude

# Ask it something simple
> What can you help me build?
```

If it responds, Claude is working! Type `/exit` to quit.

### Test the Factory

```bash
# Ask Claude to check the factory
claude "Check if the app factory is set up correctly. Read CLAUDE.md and verify all components."
```

Claude should:
1. Read the CLAUDE.md file
2. Check your API keys
3. Report what's working and what's not

---

## STEP 6: BUILD YOUR FIRST APP!

Now for the fun part. Tell Claude what you want to build:

```bash
claude "I want to build a simple habit tracker app. Help me through the process."
```

Claude will:
1. Ask you clarifying questions
2. Check if the idea can make $10k/month
3. Design the UI
4. Build the app
5. Deploy it
6. Set up analytics

**Estimated time for first app**: 2-4 hours (with your input)

---

## TROUBLESHOOTING

### "command not found: claude"

The Claude Code installation didn't work. Try:
```bash
# Reinstall
npm uninstall -g @anthropic-ai/claude-code
npm install -g @anthropic-ai/claude-code

# If that doesn't work, check Node is installed
node --version
```

### "Invalid API key"

Double-check your `.env` file:
- No extra spaces around the `=`
- Keys are copied completely (they're long!)
- You're using the right key for the right service

### "CAPTCHA blocking me"

If browser automation keeps hitting CAPTCHAs:
1. Make sure CapSolver has credit
2. Try using a VPN
3. Wait 24 hours and try again (some services cool down)

### "Vercel deployment failed"

Common fixes:
```bash
# Re-login to Vercel
vercel login

# Force rebuild
vercel --force

# Check error logs
vercel logs
```

### "I'm stuck and nothing works"

Don't panic! Ask Claude for help:
```bash
claude "I'm trying to set up the app factory but getting this error: [paste your error]. What should I do?"
```

Or check:
- Is your internet working?
- Did you restart Terminal after installing things?
- Are your API keys still valid? (they can expire)

---

## WHAT'S NEXT?

After setup, you can:

1. **Read the CLAUDE.md** - It has all the details about how the system works
2. **Try the tutorial** - Build a simple app to learn the workflow
3. **Join the community** - Get help from other users
4. **Customize** - Adjust settings in `config/` folder

---

## NEED HELP?

- **Read the docs**: All documentation is in the `docs/` folder
- **Ask Claude**: Just ask! Claude knows this system well
- **Check logs**: Run `./scripts/health-check.sh` to see what's wrong

Remember: Everyone struggles at first. The system is designed to be forgiving and helpful. Just keep trying!

---

*Setup Guide v4.0 - Making AI accessible to everyone*
