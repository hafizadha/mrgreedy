import React, { useState } from 'react';
import { UploadCloudIcon, FileTextIcon, AlertCircleIcon, CheckCircle2Icon } from 'lucide-react'; // Added icons
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress'; // For upload progress (optional)

// Define the expected API response structure (adjust as needed)
interface UploadResponse {
  // Assuming your backend returns the parsed resume data or a success message
  Name?: string;
  Email?: string;
  Skills?: string;
  Experience_Similarity?: number;
  // Add other fields your API returns
  message?: string; // For general messages
  error?: string; // For error messages
}

interface FileUploadProps {
  selectedJobTitle: string; // Job title from the selected job
}

export const FileUpload = ({ selectedJobTitle }: FileUploadProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // Changed to single file for simplicity
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'success' | 'error' | 'idle';
    message: string;
    data?: UploadResponse; // To store successful response data
  }>({ type: 'idle', message: '' });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadStatus({ type: 'idle', message: '' }); // Reset status on new file selection
    if (e.target.files && e.target.files.length > 0) {
      // For now, let's handle a single file upload.
      // If you want to support multiple, you'll need to loop or change the API.
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setUploadStatus({ type: 'error', message: 'File size exceeds 10MB limit.' });
        setSelectedFile(null);
        return;
      }
      if (!['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)) {
        setUploadStatus({ type: 'error', message: 'Invalid file type. Only PDF, DOC, DOCX allowed.' });
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
    } else {
      setSelectedFile(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadStatus({ type: 'error', message: 'Please select a file to upload.' });
      return;
    }
    if (!selectedJobTitle) {
      setUploadStatus({ type: 'error', message: 'Please select a job position first.' });
      return;
    }

    setIsLoading(true);
    setUploadProgress(0);
    setUploadStatus({ type: 'idle', message: '' });

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('selected_job', selectedJobTitle); // Send the job title

    try {
      // Replace with your actual API endpoint URL if it's different
      const response = await fetch('/send_job_application', {
        method: 'POST',
        body: formData,
        // If you need to track progress, you might need XMLHttpRequest or a library
        // For simplicity, basic fetch is shown here.
      });

      const responseData: UploadResponse = await response.json();

      if (!response.ok) {
        // Try to get error message from backend response
        const errorMsg = responseData.error || responseData.message || `HTTP error! status: ${response.status}`;
        throw new Error(errorMsg);
      }

      // Handle success
      setUploadStatus({
        type: 'success',
        message: responseData.message || `Resume for ${responseData.Name || selectedFile.name} analyzed successfully!`,
        data: responseData,
      });
      setSelectedFile(null); // Clear selection on successful upload

    } catch (error: any) {
      console.error('Upload failed:', error);
      setUploadStatus({
        type: 'error',
        message: error.message || 'Upload failed. Please try again.',
      });
    } finally {
      setIsLoading(false);
      setUploadProgress(100); // Or reset to 0 after a delay
    }
  };

  const handleGoogleDriveClick = () => {
    alert('Google Drive integration would be implemented here');
    // This would typically involve Google Picker API
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Resume for Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4">
            <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-lg min-h-[150px] items-center">
              <div className="space-y-1 text-center">
                {selectedFile ? (
                  <>
                    <FileTextIcon className="h-12 w-12 text-primary mx-auto" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ({(selectedFile.size / 1024).toFixed(2)} KB)
                    </p>
                    <Button
                      type="button"
                      variant="link"
                      className="text-xs text-destructive"
                      onClick={() => {
                        setSelectedFile(null);
                        setUploadStatus({ type: 'idle', message: '' });
                      }}
                    >
                      Remove file
                    </Button>
                  </>
                ) : (
                  <>
                    <UploadCloudIcon className="h-12 w-12 text-muted-foreground mx-auto" />
                    <div className="flex text-sm text-muted-foreground justify-center mt-2">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary/80 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary"
                      >
                        <span>Upload a file</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          onChange={handleFileChange}
                          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      PDF, DOC, or DOCX up to 10MB
                    </p>
                  </>
                )}
              </div>
            </div>
            {/* Optional: Google Drive Button - implement if needed */}
            {/* <Button type="button" variant="outline" onClick={handleGoogleDriveClick} className="w-full">
              <Image src="/google-drive-icon.svg" alt="Google Drive" width={20} height={20} className="mr-2" />
              Upload from Google Drive
            </Button> */}
          </div>

          {isLoading && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Uploading...</p>
              <Progress value={uploadProgress} className="w-full h-2" />
            </div>
          )}

          {uploadStatus.type === 'success' && (
            <div className="flex items-center p-3 text-sm text-green-700 bg-green-100 rounded-md">
              <CheckCircle2Icon className="w-5 h-5 mr-2" />
              {uploadStatus.message}
              {/* Optionally display some parsed data: */}
              {/* {uploadStatus.data?.Name && <p>Candidate: {uploadStatus.data.Name}</p>} */}
            </div>
          )}
          {uploadStatus.type === 'error' && (
            <div className="flex items-center p-3 text-sm text-red-700 bg-red-100 rounded-md">
              <AlertCircleIcon className="w-5 h-5 mr-2" />
              {uploadStatus.message}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={!selectedFile || isLoading || !selectedJobTitle}
          >
            {isLoading ? 'Analyzing...' : 'Analyze Resume'}
          </Button>
          {!selectedJobTitle && selectedFile && (
            <p className="text-xs text-destructive text-center">
              Please select a job position to enable analysis.
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
};