'use client';

import { ArrowUpRight, ArrowDownRight, Users, DollarSign, Activity, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const stats = [
  {
    name: 'Total Revenue',
    value: '$45,231.89',
    change: '+20.1%',
    changeType: 'positive' as const,
    icon: DollarSign,
  },
  {
    name: 'Subscriptions',
    value: '+2350',
    change: '+180.1%',
    changeType: 'positive' as const,
    icon: Users,
  },
  {
    name: 'Active Users',
    value: '+12,234',
    change: '+19%',
    changeType: 'positive' as const,
    icon: Activity,
  },
  {
    name: 'Growth Rate',
    value: '+573',
    change: '-2.3%',
    changeType: 'negative' as const,
    icon: TrendingUp,
  },
];

export function Stats() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.name}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              {stat.name}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="flex items-center text-xs">
              {stat.changeType === 'positive' ? (
                <ArrowUpRight className="mr-1 h-4 w-4 text-green-500" />
              ) : (
                <ArrowDownRight className="mr-1 h-4 w-4 text-red-500" />
              )}
              <span
                className={cn(
                  stat.changeType === 'positive'
                    ? 'text-green-500'
                    : 'text-red-500'
                )}
              >
                {stat.change}
              </span>
              <span className="ml-1 text-slate-400">from last month</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
