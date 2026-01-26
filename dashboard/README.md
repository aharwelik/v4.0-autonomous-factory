# Factory Dashboard

Real-time monitoring and control center for the Autonomous App Factory v4.0.

## Features

- **Pipeline Health** - Track ideas from discovery through validation to deployed revenue
- **Agent Activity** - Real-time view of what agents are doing with live activity logs
- **App Performance** - Per-app analytics with MRR, customers, churn, and charts
- **Content Calendar** - Scheduled and generated content queue across platforms
- **Cost Center** - Budget tracking with pie charts and optimization suggestions

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS with shadcn/ui components
- **Charts**: Recharts
- **Icons**: Lucide React
- **State**: React Query (TanStack Query)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Navigate to the dashboard directory
cd dashboard

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

The dashboard will be available at [http://localhost:3000](http://localhost:3000).

### Build for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

## Project Structure

```
dashboard/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── dashboard/
│   │   │       └── route.ts    # Dashboard data API endpoint
│   │   ├── globals.css         # Global styles and CSS variables
│   │   ├── layout.tsx          # Root layout with dark mode
│   │   └── page.tsx            # Main dashboard page
│   ├── components/
│   │   ├── ui/                 # shadcn-style UI components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── tabs.tsx
│   │   │   └── progress.tsx
│   │   ├── PipelineHealth.tsx  # Pipeline funnel visualization
│   │   ├── AgentActivity.tsx   # Real-time agent monitoring
│   │   ├── AppPerformance.tsx  # App metrics and charts
│   │   ├── ContentCalendar.tsx # Content scheduling
│   │   └── CostCenter.tsx      # Budget and cost tracking
│   └── lib/
│       └── utils.ts            # Utility functions (cn helper)
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── next.config.mjs
├── postcss.config.mjs
└── .env.example
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Base API URL | `http://localhost:3000` |
| `NEXT_PUBLIC_WS_URL` | WebSocket URL for real-time updates | `ws://localhost:3001` |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog analytics key | - |
| `AIRTABLE_API_KEY` | Airtable API key for pipeline data | - |
| `STRIPE_SECRET_KEY` | Stripe key for revenue data | - |

### Connecting Real Data Sources

The dashboard currently uses mock data. To connect real data sources:

1. **Pipeline Data**: Update `getPipelineData()` in `src/app/api/dashboard/route.ts` to fetch from Airtable
2. **App Analytics**: Update `getAppsData()` to fetch from PostHog and Stripe
3. **Content Queue**: Update `getContentData()` to fetch from your content database
4. **Cost Tracking**: Update `getCostsData()` to aggregate from your usage tracking

## Customization

### Theme

The dashboard uses CSS variables for theming. Edit `src/app/globals.css` to customize:

- Light/dark mode colors
- Border radius
- Font settings

### Adding New Tabs

1. Create a new component in `src/components/`
2. Add the tab trigger and content in `src/app/page.tsx`
3. Add the data fetching in `src/app/api/dashboard/route.ts`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |

## License

Part of the Autonomous App Factory v4.0 project.
