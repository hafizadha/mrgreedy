"use client";
import { useEffect, useState } from 'react';
import { AnalysisTab } from '@/components/analysis/AnalysisTab';
import { JobSelector, Job } from '@/components/JobSelector';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"; // Assuming this is from Shadcn/ui
import { JobDescription } from '@/components/JobDescription';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"; // Assuming Shadcn/ui Card
import { Loader2, AlertTriangle, Info, LayoutDashboard } from 'lucide-react'; // For icons
import { DashboardTab } from '@/components/analysis/DashboardTab'; // Import the new DashboardTab

export default function Page() {
    const [selectedJobId, setSelectedJobId] = useState(''); // Allow null for no selection
    const [jobs, setJobs] = useState<Job[]>([]);
    const [isLoadingJobs, setIsLoadingJobs] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [activeTabValue, setActiveTabValue] = useState<string>("job-description"); // Control active tab

    useEffect(() => {
        const fetchJobs = async () => {
            setIsLoadingJobs(true);
            setFetchError(null);
            try {
                const response = await fetch('http://127.0.0.1:8000/api/structured-job-roles');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data: Job[] = await response.json();
                setJobs(data);
                // Optionally, select the first job by default if jobs are available
                // if (data.length > 0) {
                //     setSelectedJobId(data[0].id);
                // }
            } catch (error) {
                console.error("Failed to fetch jobs:", error);
                setFetchError(error instanceof Error ? error.message : "An unknown error occurred.");
            } finally {
                setIsLoadingJobs(false);
            }
        };

        fetchJobs();
    }, []);

    const selectedJob = jobs.find(job => job.id === selectedJobId) || null;
    console.log("Selected Job:", selectedJob?.id);

    // Handler for tab change
    const handleTabChange = (value: string) => {
        setActiveTabValue(value);
    };

    return (
        <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-8">
            {/* Job Selector Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">Select Job Position</CardTitle>
                    <CardDescription>
                        Choose a job from the list to view its description and resume analysis insights.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoadingJobs ? (
                        <div className="flex items-center justify-center h-20 text-muted-foreground">
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            <span>Loading job positions...</span>
                        </div>
                    ) : fetchError ? (
                        <div className="flex flex-col items-center justify-center h-20 text-destructive">
                            <AlertTriangle className="mr-2 h-5 w-5" />
                            <span>Error loading jobs: {fetchError}</span>
                            {/* You could add a retry button here */}
                        </div>
                    ) : jobs.length > 0 ? (
                        <JobSelector
                            jobs={jobs}
                            selectedJobId={selectedJobId}
                            onJobSelect={(id) => {
                                setSelectedJobId(id);
                                // Optionally switch back to job description tab when a new job is selected
                                // setActiveTabValue("job-description");
                            }}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-20 text-muted-foreground">
                            <Info className="mr-2 h-5 w-5" />
                            <span>No job positions available at the moment.</span>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Tabs Section - Only show if a job can be potentially selected or is selected */}
            {(jobs.length > 0 || selectedJob) && (
                <Tabs value={activeTabValue} onValueChange={handleTabChange} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 h-12">
                        <TabsTrigger value="job-description">Job Description</TabsTrigger>
                        <TabsTrigger value="dashboard" disabled={!selectedJobId}>Dashboard</TabsTrigger>
                        <TabsTrigger value="analysis" disabled={!selectedJobId}>Analysis</TabsTrigger>
                    </TabsList>

                    <TabsContent value="job-description" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Job Details</CardTitle>
                                {selectedJob && <CardDescription>Detailed description for: {selectedJob.title}</CardDescription>}
                            </CardHeader>
                            <CardContent>
                                {selectedJob ? (
                                    <JobDescription job={selectedJob} />
                                ) : (
                                    <div className="flex items-center justify-center h-40 text-muted-foreground">
                                        <Info className="mr-2 h-5 w-5" />
                                        <span>Please select a job position above to see its description.</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Dashboard Tab Content */}
                    <TabsContent value="dashboard" className="mt-6">
                        {/* DashboardTab can handle if jobId is null for a global view or job-specific */}
                        <DashboardTab jobId={selectedJobId} jobTitle={selectedJob?.title} />
                    </TabsContent>

                    <TabsContent value="analysis" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Resume Analysis</CardTitle>
                                {selectedJob && <CardDescription>Analysis for resumes submitted against: {selectedJob.title}</CardDescription>}
                            </CardHeader>
                            <CardContent> {/* This CardContent might need to allow full height for AnalysisTab */}
                                {selectedJobId ? (
                                    // AnalysisTab will now manage its own internal layout including the chart
                                    <AnalysisTab jobId={selectedJobId} />
                                ) : (
                                    <div className="flex items-center justify-center h-40 text-muted-foreground">
                                        <Info className="mr-2 h-5 w-5" />
                                        <span>Please select a job position to view analysis.</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
}