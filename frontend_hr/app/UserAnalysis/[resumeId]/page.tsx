// app/UserAnalysis/[resumeId]/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, AlertTriangle, FileText, MessageSquare } from 'lucide-react';
import { ChatInterface } from '@/components/analysis/ChatInterface'; // Adjust path
import { UserResumeDisplay } from '@/components/analysis/UserResumeDisplay'; // New component

// This is the detailed structure expected from your API
export interface DetailedAnalyzedResume {
  id: number; // API returns number
  Education: string;
  Education_Similarity: number;
  Email: string;
  Experience: string;
  Experience_Similarity: number;
  Extra: string;
  Job_Desc: string;
  Level: string;
  Level_Similarity: number;
  Linkedin_link: string;
  Name: string;
  Phone_Number: string;
  Portfolio_link: string;
  ResumeID: number; // This seems to be the same as 'id' from your example
  Skill_Similarity: number;
  Skills: string;
  ai_generated_score: number;
  is_analyzed: boolean;
  job_role_id: number;
  // Add any other fields from your API, if needed by ChatInterface or UserResumeDisplay
  // For ChatInterface, we might need to map some of these to its expected AnalyzedResume type
  matchScore?: number; // If not directly available, might need calculation or be part of a different call
  spamScore?: number;  // If not directly available
  keywords?: string[]; // If not directly available, might need parsing from Skills
  status?: 'Recommended' | 'Maybe' | 'Not Recommended'; // Or RankingCategory
}

// Hardcoded PDF URL (replace with actual logic if you have an endpoint)
const MOCK_PDF_URL = "/sample-resume.pdf"; // Place a sample PDF in your /public directory

export default function UserAnalysisPage() {
  const params = useParams();
  const resumeId = params.resumeId as string; // resumeId from the URL

  const [resumeData, setResumeData] = useState<DetailedAnalyzedResume | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!resumeId) return;

    const fetchResumeDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`http://127.0.0.1:8000/get_job_application/${resumeId}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Resume not found.');
          }
          throw new Error(`Failed to fetch resume data. Status: ${response.status}`);
        }
        const data: DetailedAnalyzedResume = await response.json();
        setResumeData(data);

        // Simulate fetching PDF URL or use a hardcoded one
        // If you have an endpoint like /get_resume_pdf/{resume_id}
        const pdfResponse = await fetch(`http://127.0.0.1:8000/get_resume_pdf?resume_ID=${resumeId}`);
        if (pdfResponse.ok) {
          const blob = await pdfResponse.blob();
          setPdfUrl(URL.createObjectURL(blob));
        } else {
          console.warn("Could not fetch PDF.");
          setPdfUrl(MOCK_PDF_URL); // Fallback to mock
        }
        // setPdfUrl(MOCK_PDF_URL); // Using mock for now

      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "An unknown error occurred.");
        // For demonstration, if API fails, try to use some hardcoded data for UI structure
        setResumeData({
          id: parseInt(resumeId), Name: `Candidate ${resumeId} (Fallback)`, Email: "fallback@example.com",
          Experience: "Fallback experience details.", Skills: "Fallback skills.", Education: "Fallback Education",
          Job_Desc: "N/A", Extra: "N/A", Level: "N/A", Linkedin_link: "#", Phone_Number: "N/A", Portfolio_link: "#",
          ResumeID: parseInt(resumeId), Education_Similarity: 0.5, Experience_Similarity: 0.5, Level_Similarity: 0.5,
          Skill_Similarity: 0.7, ai_generated_score: 30, is_analyzed: true, job_role_id: 1,
          // These might be needed by ChatInterface, adjust based on its needs
          matchScore: 60, spamScore: 10, keywords: ["Fallback", "Data"], status: "Maybe"
        });
        setPdfUrl(MOCK_PDF_URL);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResumeDetails();

    // Cleanup object URL if PDF was fetched as blob
    return () => {
        if (pdfUrl && pdfUrl.startsWith('blob:')) {
            URL.revokeObjectURL(pdfUrl);
        }
    }

  }, [resumeId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading resume analysis...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Error Loading Resume</h2>
        <p className="text-destructive">{error}</p>
        {/* Optionally, provide fallback data display if resumeData has fallback content */}
        {resumeData && (
            <div className="mt-6 text-left">
                <p className="text-muted-foreground">Displaying fallback data for UI structure.</p>
                <UserResumeDisplay resume={resumeData} />
                <div className="mt-6">
                    <h3 className="text-xl font-semibold mb-2">Chat (Limited Fallback)</h3>
                    <ChatInterface
                        resumeId={resumeId}
                        // Adapt API data to what ChatInterface expects
                        // This 'AnalyzedResume' type is for ChatInterface's internal use.
                        // It might differ from DetailedAnalyzedResume.
                        selectedResumeForChat={{
                            id: resumeData.ResumeID.toString(),
                            candidateName: resumeData.Name,
                            aiGeneratedScore: resumeData.ai_generated_score,
                            matchScore: resumeData.matchScore || 0, // Provide default if not in API
                            spamScore: resumeData.spamScore || 0,  // Provide default
                            keywords: resumeData.keywords || ["fallback"],
                            status: resumeData.status || 'Maybe',
                            experience: resumeData.Experience.length > 10 ? 5 : 2, // Estimate experience
                            lastPosition: "Analyst", // Placeholder
                            education: resumeData.Education,
                        }}
                    />
                </div>
            </div>
        )}
      </div>
    );
  }

  if (!resumeData) {
    return <div className="container mx-auto p-6 text-center">No resume data available.</div>;
  }

  // Prepare data for ChatInterface (it expects a specific AnalyzedResume structure)
  // You'll need to map fields from DetailedAnalyzedResume to AnalyzedResume.
  // This is important if ChatInterface was built with the mock data structure.
  const chatResumeProps = {
    id: resumeData.ResumeID.toString(), // ChatInterface might expect string ID
    candidateName: resumeData.Name,
    aiGeneratedScore: resumeData.ai_generated_score,
    // These might not be directly in your /get_job_application response,
    // so you might need to calculate them, fetch them separately, or use placeholders.
    matchScore: resumeData.matchScore || Math.round(resumeData.Skill_Similarity * 100) || 70, // Example
    spamScore: resumeData.spamScore || 15, // Example placeholder
    keywords: resumeData.Skills?.split(',').map(s => s.trim()).slice(0,5) || ["API", "Data"], // Parse from Skills
    status: resumeData.status || 'Maybe', // Placeholder if not available
    experience: parseInt(resumeData.Experience.split(" ")[0]) || 5, // Very basic parsing
    lastPosition: resumeData.Level || "Developer", // Placeholder
    education: resumeData.Education,
  };


  return (
    <div className="container mx-auto py-8 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Resume PDF & Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-6 w-6 text-primary" />
                Resume Document
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pdfUrl ? (
                <iframe
                  src={pdfUrl}
                  className="w-full h-[700px] border rounded-md"
                  title={`${resumeData.Name}'s Resume`}
                />
              ) : (
                <div className="h-[700px] flex items-center justify-center text-muted-foreground">
                  PDF could not be loaded.
                </div>
              )}
            </CardContent>
          </Card>

          <UserResumeDisplay resume={resumeData} />
        </div>

        {/* Right Column: Chat Interface */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24"> {/* Make chat sticky on scroll */}
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="mr-2 h-6 w-6 text-primary" />
                AI Analysis Chat
              </CardTitle>
              <CardDescription>Ask questions about {resumeData.Name}.</CardDescription>
            </CardHeader>
            <CardContent>
              <ChatInterface
                resumeId={resumeId} // Pass the actual resumeId for the API
                selectedResumeForChat={chatResumeProps} // Pass the mapped data
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}