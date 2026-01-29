# Adding Analytics to Your Apps

## Quick Setup (Optional)

Your generated apps don't include analytics by default to keep them simple. Here's how to add PostHog analytics if you want user tracking:

### 1. Sign up for PostHog (FREE tier)
- Visit: https://app.posthog.com/signup
- Free tier includes: 1M events/month, session recording, funnels

### 2. Add to your generated app

Install PostHog:
```bash
cd generated-apps/your-app-name
npm install posthog-js
```

### 3. Add to layout.tsx

```typescript
// Add to src/app/layout.tsx
import { PostHogProvider } from 'posthog-js/react'
import posthog from 'posthog-js'

if (typeof window !== 'undefined') {
  posthog.init('YOUR_PROJECT_API_KEY', {
    api_host: 'https://app.posthog.com'
  })
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <PostHogProvider client={posthog}>
          {children}
        </PostHogProvider>
      </body>
    </html>
  )
}
```

### 4. Track events

```typescript
import { usePostHog } from 'posthog-js/react'

function MyComponent() {
  const posthog = usePostHog()

  const handleClick = () => {
    posthog.capture('button_clicked', {
      button: 'upgrade_plan'
    })
  }
}
```

## What You Get

- **User Sessions**: See exactly how users navigate your app
- **Event Tracking**: Track button clicks, form submissions, purchases
- **Funnels**: Understand where users drop off
- **A/B Testing**: Test different versions of features
- **Session Replay**: Watch recordings of user sessions

## Is This Required?

**No!** Your apps work fine without analytics. Add it when you're ready to track users.

## Alternative: Simple Google Analytics

If you prefer Google Analytics:
```bash
npm install @next/third-parties
```

Add to layout.tsx:
```typescript
import { GoogleAnalytics } from '@next/third-parties/google'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>{children}</body>
      <GoogleAnalytics gaId="G-XXXXXXXXXX" />
    </html>
  )
}
```

That's it! Analytics is now optional and easy to add when you need it.
