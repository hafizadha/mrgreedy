// components/dashboard/DashboardTab.tsx
"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, AlertTriangle, Info, ExternalLink, Star, Award, Medal } from 'lucide-react'; // Added Star for top applicants
import {
    ResponsiveContainer,
    PieChart, Pie, Cell,
    AreaChart, Area,
    LineChart, Line,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    Sector
} from 'recharts';

interface DashboardTabProps {
  jobId: string | null;
  jobTitle?: string;
}

interface DistributionDataPoint { name: string; count: number; }
interface EducationData { name: string; value: number; percent?: number; }
interface TimeSeriesDataPoint { date: string; applications: number; }

const CHART_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ec4899',
  '#8b5cf6', '#6366f1', '#06b6d4', '#f43f5e',
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const currentLabel = label || payload[0].name;
    return (
      <div className="p-3 bg-background border border-border shadow-lg rounded-md text-sm">
        <p className="label font-semibold text-foreground mb-1">{`${currentLabel}`}</p>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`}>
            <p style={{ color: entry.color || entry.fill }}>
              {`${entry.name === 'count' || entry.name === 'applications' ? 'Count' : entry.name}: ${entry.value.toLocaleString()}`}
            </p>
            {entry.payload?.percent && (
                 <p className="text-xs text-muted-foreground">({(entry.payload.percent * 100).toFixed(1)}%)</p>
            )}
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  return (
    <g>
      <text x={cx} y={cy - 8} dy={8} textAnchor="middle" fill={fill} className="font-bold text-base pointer-events-none">{payload.name}</text>
      <text x={cx} y={cy + 8} dy={8} textAnchor="middle" fill="#6b7280" className="text-sm pointer-events-none">{`${value} (${(percent * 100).toFixed(1)}%)`}</text>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius} startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <Sector cx={cx} cy={cy} startAngle={startAngle} endAngle={endAngle} innerRadius={outerRadius + 4} outerRadius={outerRadius + 8} fill={fill} />
    </g>
  );
};

export const DashboardTab: React.FC<DashboardTabProps> = ({ jobId, jobTitle }) => {
  const [apiDashboardData, setApiDashboardData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeIndexDonut, setActiveIndexDonut] = useState(0);

  useEffect(() => {
    if (!jobId) { setApiDashboardData(null); return; }
    const fetchAndSetDashboardData = async () => {
      setIsLoading(true); setError(null);
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/dashboard_data/${jobId}`);
        if (!response.ok) {
          if (response.status === 404) { setApiDashboardData(null); console.log(`No dashboard data for job role ID: ${jobId}`); return; }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json(); setApiDashboardData(data);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred.");
        setApiDashboardData(null);
      } finally { setIsLoading(false); }
    };
    fetchAndSetDashboardData();
  }, [jobId]);

  const onDonutEnter = (_: any, index: number) => { setActiveIndexDonut(index); };

  // Applications Over Time (Demo): 2 weeks in May (May 16 - May 30)
  const applicationsOverTimeHardcoded: TimeSeriesDataPoint[] = Array.from({ length: 15 }, (_, i) => {
    const day = 16 + i;
    let applications = 0;
    // Simulate some application spikes and lulls
    if (day >= 16 && day <= 18) applications = Math.floor(Math.random() * 5) + 2;  // Early spike
    else if (day >= 19 && day <= 22) applications = Math.floor(Math.random() * 8) + 5; // Mid period
    else if (day >= 23 && day <= 26) applications = Math.floor(Math.random() * 12) + 8; // Peak
    else if (day >= 27 && day <= 30) applications = Math.floor(Math.random() * 6) + 3; // Tailing off
    return { date: `May ${day}`, applications };
  });

  const educationBreakdownHardcoded: EducationData[] = [
    { name: 'Comp Sci', value: 45 }, { name: 'Software Eng', value: 25 },
    { name: 'Info Tech', value: 15 }, { name: 'Analytics', value: 8 },
    { name: 'Mathematics', value: 5 }, { name: 'Other Tech', value: 7 },
  ].filter(e => e.value > 0);

  if (!jobId && !isLoading) { return ( <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-muted-foreground p-6"> <Info className="h-10 w-10 mb-4 text-primary" /> <h3 className="text-xl font-semibold mb-2">Applicant Dashboard</h3> <p>Please select a job position to view its specific dashboard.</p> </div> ); }
  if (isLoading) { return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" /> Fetching dashboard data...</div>; }
  if (error) { return <div className="flex items-center justify-center h-64 text-destructive"><AlertTriangle className="mr-2 h-5 w-5" /> Error: {error}</div>; }
  if (apiDashboardData === null && !isLoading && !error) { return ( <div className="flex items-center justify-center h-40 text-muted-foreground"> <Info className="mr-2 h-5 w-5" /> <span>No applicant data for this job to generate a dashboard.</span> </div> ); }

  const totalApplicants = apiDashboardData?.total_applicants || 0;
  const averageMatchScore = apiDashboardData?.average_match_score || 0;
  const potentialSpamCount = apiDashboardData?.potential_spam_count || 0;
  const matchScoreDistribution: DistributionDataPoint[] = apiDashboardData?.match_score_distribution?.map((item: {range: string; count: number}) => ({ name: item.range, count: item.count })) || [];
  const topApplicants: {id: number; name: string; match_score: number}[] = apiDashboardData?.top_10_applicants || [];

  // Helper to get medal icon based on rank
  const getRankIcon = (index: number) => {
    if (index === 0) return <Medal className="h-5 w-5 text-yellow-400 mr-2" />; // Gold
    if (index === 1) return <Award className="h-5 w-5 text-gray-400 mr-2" />; // Silver
    if (index === 2) return <Star className="h-5 w-5 text-yellow-600 mr-2" />;  // Bronze (using Star as Award might be too similar to silver)
    return null;
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Applicant Dashboard {jobTitle ? `- ${jobTitle}` : ''}</CardTitle>
          <CardDescription>Overview of applicant statistics and trends for {jobTitle || 'the selected job'}.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="hover:shadow-md transition-shadow"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Applicants</CardTitle></CardHeader><CardContent><p className="text-4xl font-bold text-primary">{totalApplicants}</p></CardContent></Card>
              <Card className="hover:shadow-md transition-shadow"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Avg. Match Score</CardTitle></CardHeader><CardContent><p className="text-4xl font-bold text-primary">{averageMatchScore.toFixed(1)}%</p></CardContent></Card>
              <Card className="hover:shadow-md transition-shadow"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Potential Spam</CardTitle></CardHeader><CardContent><p className="text-4xl font-bold text-destructive">{potentialSpamCount}</p></CardContent></Card>
            </div>
        </CardContent>
      </Card>

      {(totalApplicants > 0 || educationBreakdownHardcoded.length > 0 || applicationsOverTimeHardcoded.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {totalApplicants > 0 && matchScoreDistribution.length > 0 && (
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader><CardTitle className="text-lg">Match Score Distribution</CardTitle><CardDescription className="text-xs">Applicant count by match score range.</CardDescription></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={matchScoreDistribution} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                    <defs><linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={CHART_COLORS[0]} stopOpacity={0.8}/><stop offset="95%" stopColor={CHART_COLORS[0]} stopOpacity={0.1}/></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} /><XAxis dataKey="name" angle={-30} textAnchor="end" height={50} tick={{ fontSize: 12 }} /><YAxis allowDecimals={false} tick={{ fontSize: 12 }} /><Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }}/><Area type="monotone" dataKey="count" stroke={CHART_COLORS[0]} strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" name="Applicants" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader><CardTitle className="text-lg">Education Breakdown</CardTitle><CardDescription className="text-xs">Distribution by primary education field.</CardDescription></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie activeIndex={activeIndexDonut} activeShape={renderActiveShape} data={educationBreakdownHardcoded} cx="50%" cy="50%" innerRadius={70} outerRadius={110} fill="#8884d8" dataKey="value" nameKey="name" onMouseEnter={onDonutEnter} paddingAngle={2}>
                    {educationBreakdownHardcoded.map((entry, index) => ( <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} className="focus:outline-none hover:opacity-80 transition-opacity" /> ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <Card className="lg:col-span-2 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader><CardTitle className="text-lg">Applications: May 16-30</CardTitle><CardDescription className="text-xs">Daily trend of applications received.</CardDescription></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={applicationsOverTimeHardcoded} margin={{ top: 5, right: 30, left: 0, bottom: 20 }}>
                   <defs><linearGradient id="colorApplications" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={CHART_COLORS[1]} stopOpacity={0.8}/><stop offset="95%" stopColor={CHART_COLORS[1]} stopOpacity={0.1}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3}/><XAxis dataKey="date" tick={{ fontSize: 12 }} angle={-30} textAnchor="end" height={50} /><YAxis allowDecimals={false} tick={{ fontSize: 12 }}/><Tooltip content={<CustomTooltip />} cursor={{ stroke: CHART_COLORS[1], strokeWidth: 1, strokeDasharray: '3 3' }}/><Legend iconSize={10} wrapperStyle={{ fontSize: '12px' }}/><Line type="monotone" dataKey="applications" name="Applications Received" stroke={CHART_COLORS[1]} strokeWidth={2} activeDot={{ r: 6, strokeWidth: 0 }} dot={{ r: 4, strokeWidth: 1, fill: '#fff' }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {totalApplicants > 0 && topApplicants.length > 0 && (
            <Card className="lg:col-span-2 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader><CardTitle className="text-lg">Top 10 Applicants</CardTitle><CardDescription className="text-xs">Sorted by highest match score.</CardDescription></CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {topApplicants.map((app, index) => (
                    <li key={app.id}>
                      <Link
                        href={`/UserAnalysis/${app.id}`}
                        className={`flex justify-between items-center p-3 border rounded-lg transition-all group shadow-sm hover:shadow-md 
                                    ${index < 3 ? 'bg-primary/10 dark:bg-primary/20 border-primary/30 hover:border-primary/60' : 'bg-card hover:bg-muted/50 dark:hover:bg-muted/30'}`}
                      >
                        <div className="flex items-center">
                          {getRankIcon(index)}
                          <span className={`font-medium text-sm group-hover:underline ${index < 3 ? 'text-primary font-semibold' : 'text-foreground group-hover:text-primary'}`}>
                            {app.name}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span className={`font-semibold text-sm mr-3 ${index < 3 ? 'text-primary' : 'text-primary'}`}>{app.match_score.toFixed(1)}%</span>
                          <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};