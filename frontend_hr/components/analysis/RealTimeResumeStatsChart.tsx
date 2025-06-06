// components/analysis/RealTimeResumeStatsChart.tsx
"use client";

import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell, // For custom bar colors
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface ChartDataPoint {
  name: string; // e.g., 'Match Score > 80%', 'Keyword: Python'
  value: number;
}

interface RealTimeResumeStatsChartProps {
  jobId: string | null; // To potentially fetch/filter data based on job
}

// Predefined attractive colors for bars
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

// Simulate fetching initial data and then updates
const generateRandomData = (): ChartDataPoint[] => {
  return [
    { name: 'Score >80%', value: Math.floor(Math.random() * 15) + 5 },
    { name: 'Score 60-80%', value: Math.floor(Math.random() * 25) + 10 },
    { name: 'Score 40-60%', value: Math.floor(Math.random() * 20) + 8 },
    { name: 'AI Gen <10%', value: Math.floor(Math.random() * 40) + 15 }, // Lower AI gen is good
    { name: 'Exp. Match', value: Math.floor(Math.random() * 30) + 12 },
  ];
};

export const RealTimeResumeStatsChart: React.FC<RealTimeResumeStatsChartProps> = ({ jobId }) => {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (!jobId) {
      setData([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    // Simulate initial data fetch
    setTimeout(() => {
      setData(generateRandomData());
      setLastUpdated(new Date());
      setIsLoading(false);
    }, 1000);

    // Simulate real-time updates
    const intervalId = setInterval(() => {
      setData(currentData =>
        currentData.map(item => ({
          ...item,
          // Make changes more subtle and somewhat related to previous values
          value: Math.max(0, item.value + Math.floor(Math.random() * 5) - 2),
        }))
      );
      setLastUpdated(new Date());
    }, 3000); // Update every 3 seconds

    return () => clearInterval(intervalId); // Cleanup on unmount or jobId change
  }, [jobId]);

  if (!jobId) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full text-muted-foreground">
          Select a job to see live resume statistics.
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full text-muted-foreground">
          <Loader2 className="mr-2 h-8 w-8 animate-spin" />
          Loading Live Stats...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full shadow-xl border-primary/20">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-primary">
          Live Resume Insights
        </CardTitle>
        <CardDescription>
          Key statistics for resumes related to the selected job.
          {lastUpdated && (
            <span className="block text-xs text-muted-foreground mt-1">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[calc(100%-100px)]"> {/* Adjust height as needed */}
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 5,
              right: 20, // Give some space for Y-axis labels if values are large
              left: 0,
              bottom: 40, // Increased bottom margin for rotated X-axis labels
            }}
            barGap={5} // Gap between bars of the same group (not applicable for single bar)
            barCategoryGap="20%" // Gap between categories (groups of bars)
          >
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
            <XAxis
              dataKey="name"
              angle={-35} // Rotate labels
              textAnchor="end" // Anchor rotated labels correctly
              height={60} // Allocate more height for rotated labels
              interval={0} // Show all labels
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <Tooltip
              cursor={{ fill: 'hsl(var(--primary)/0.1)' }}
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                borderColor: 'hsl(var(--border))',
                borderRadius: 'var(--radius)',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}/>
            <Bar dataKey="value" name="Resume Count"  radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};