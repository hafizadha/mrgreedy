import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  Typography,
  Button,
  Container,
  InputAdornment,
  IconButton,
  Snackbar,
  Alert,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { keyframes } from '@mui/system';
import { useTheme } from '@mui/material/styles';
import axios from 'axios';

// Mock data for jobs
const mockJobs = [
  {
    id: 1,
    title: 'Senior Software Engineer',
    location: 'New York, NY',
    description: 'We are looking for a Senior Software Engineer to join our team. The ideal candidate will have experience in React, TypeScript, and modern web development practices. You will be responsible for building and maintaining our web applications, working closely with the product team to deliver high-quality features.',
  },
  {
    id: 2,
    title: 'Product Manager',
    location: 'Remote',
    description: "",
  },
  {
    id: 3,
    title: 'UX Designer',
    location: 'San Francisco, CA',
    description: 'We need a talented UX Designer to create amazing user experiences. You will be responsible for designing intuitive and engaging interfaces, conducting user research, and collaborating with the development team to implement your designs. A strong portfolio and experience with modern design tools are required.',
  },
];

const slideUp = keyframes`
  0% {
    transform: translateY(20px);
    opacity: 0;
  }
  10% {
    transform: translateY(0);
    opacity: 1;
  }
  90% {
    transform: translateY(0);
    opacity: 1;
  }
  100% {
    transform: translateY(-20px);
    opacity: 0;
  }
`;

interface Job {
  id: number;
  title: string;
  location: string;
  description: string;
}

interface JobResponse {
  job_role: string;
  location: string;
  job_description: string;
}

const JobPortal: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const placeholders = [
    'Search for jobs...',
    'Software Engineer...',
    'Product Manager...',
    'Data Scientist...',
    'UX Designer...',
    'Marketing Specialist...',
  ];

  const theme = useTheme();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Fetch jobs from backend on component mount
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await axios.get('http://localhost:8000/get_available_jobs');
        const fetchedJobs = (response.data as JobResponse[]).map((job, index) => ({
          id: index + 1,
          title: job.job_role || 'Untitled Position',
          description: job.job_description || 'No Description Available',
          location: job.location || 'Location not specified'
        }));
        setJobs(fetchedJobs);
        if (fetchedJobs.length > 0) {
          setSelectedJob(fetchedJobs[0]);
        }
      } catch (err) {
        console.error('Error fetching jobs:', err);
        setError('Failed to load jobs. Please try again later.');
        // Fallback to mock data if fetch fails
        setJobs(mockJobs);
        setSelectedJob(mockJobs[0]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobs();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 4000); // Match the animation duration

    return () => clearInterval(interval);
  }, [placeholders.length]); // Add dependency

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile || !selectedJob) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('selected_job', selectedJob.title);

      const response = await axios.post('http://localhost:8000/send_job_application', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data) {
        setShowSuccess(true);
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit application');
      console.error('Error submitting application:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccess(false);
  };

  // Update filtered jobs to use fetched jobs instead of mockJobs
  const filteredJobs = jobs.filter(job => 
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Update selected job if it's filtered out
  useEffect(() => {
    if (selectedJob && !filteredJobs.find(job => job.id === selectedJob.id)) {
      setSelectedJob(filteredJobs[0] || null);
    }
  }, [filteredJobs, selectedJob]);

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <Typography>Loading available positions...</Typography>
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      ) : (
        <Box sx={{ display: 'flex', gap: 3 }}>
          {/* Left Column - Search and Job List */}
          <Box sx={{ width: '30%' }}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2,
                border: '1px solid #e0e0e0',
                borderRadius: 2,
                backgroundColor: '#ffffff',
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder={placeholders[placeholderIndex]}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: theme.palette.divider,
                      },
                      '&:hover fieldset': {
                        borderColor: theme.palette.primary.main,
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: theme.palette.primary.main,
                      },
                      '& input::placeholder': {
                        animation: `${slideUp} 4s cubic-bezier(0.4, 0, 0.2, 1) infinite`,
                        display: 'block',
                        position: 'relative',
                        transition: 'all 0.3s ease-in-out',
                      },
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: theme.palette.text.secondary }} />
                      </InputAdornment>
                    ),
                  }}
                />
                <IconButton
                  onClick={() => setShowFilters(!showFilters)}
                  sx={{
                    border: '1px solid',
                    borderColor: showFilters ? theme.palette.primary.main : theme.palette.divider,
                    color: showFilters ? theme.palette.primary.main : theme.palette.text.secondary,
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover,
                      borderColor: theme.palette.primary.main,
                    },
                  }}
                >
                  <FilterListIcon />
                </IconButton>
              </Box>

              {/* Filter Panel - Add your filter options here */}
              {showFilters && (
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    mb: 2,
                    border: '1px solid',
                    borderColor: theme.palette.divider,
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="subtitle2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                    Filter Options
                  </Typography>
                  {/* Add your filter components here */}
                </Paper>
              )}

              <List sx={{ p: 0, flex: 1, overflow: 'auto' }}>
                {filteredJobs.map((job) => (
                  <ListItem key={job.id} disablePadding sx={{ mb: 1 }}>
                    <ListItemButton
                      selected={selectedJob?.id === job.id}
                      onClick={() => setSelectedJob(job)}
                      sx={{
                        border: '1px solid #e0e0e0',
                        borderRadius: 1,
                        '&.Mui-selected': {
                          backgroundColor: '#f5f5f5',
                          borderColor: '#bdbdbd',
                        },
                        '&:hover': {
                          backgroundColor: '#fafafa',
                          borderColor: '#bdbdbd',
                        },
                      }}
                    >
                      <ListItemText
                        primary={
                          <Typography variant="subtitle1" sx={{ fontWeight: 500, color: '#212121' }}>
                            {job.title}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="body2" sx={{ color: '#757575' }}>
                            {job.location}
                          </Typography>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Box>

          {/* Right Column - Job Description */}
          <Box sx={{ width: '70%' }}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 3,
                border: '1px solid #e0e0e0',
                borderRadius: 2,
                backgroundColor: '#ffffff',
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Typography variant="h5" gutterBottom sx={{ color: '#212121', fontWeight: 600 }}>
                  {selectedJob?.title}
                </Typography>
                <Typography variant="subtitle1" sx={{ color: '#757575', mb: 3 }}>
                  {selectedJob?.location}
                </Typography>
                <Typography variant="body1" paragraph sx={{ color: '#424242', lineHeight: 1.7 }}>
                  {selectedJob?.description}
                </Typography>
              </Box>
              
              <Box sx={{ mt: 4, borderTop: '1px solid #e0e0e0', pt: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ color: '#212121', fontWeight: 600 }}>
                  Apply for this position
                </Typography>
                <Box sx={{ 
                  mt: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  alignItems: 'flex-start'
                }}>
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    gap: 2,
                    width: '100%'
                  }}>
                    <input
                      accept=".pdf,.doc,.docx"
                      style={{ display: 'none' }}
                      id="resume-file"
                      type="file"
                      onChange={handleFileChange}
                      ref={fileInputRef}
                    />
                    <label htmlFor="resume-file">
                      <Button
                        variant="outlined"
                        component="span"
                        size="large"
                        sx={{ 
                          borderColor: '#e0e0e0',
                          color: '#424242',
                          minWidth: '250px',
                          height: '48px',
                          fontSize: '1rem',
                          '&:hover': {
                            borderColor: '#bdbdbd',
                            backgroundColor: '#fafafa',
                          },
                        }}
                      >
                        Upload Resume
                      </Button>
                    </label>
                    {selectedFile && (
                      <Typography variant="body2" sx={{ color: '#757575' }}>
                        Selected file: {selectedFile.name}
                      </Typography>
                    )}
                  </Box>
                  <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={!selectedFile || isSubmitting}
                    size="large"
                    sx={{ 
                      backgroundColor: '#212121',
                      minWidth: '250px',
                      height: '48px',
                      fontSize: '1rem',
                      '&:hover': {
                        backgroundColor: '#000000',
                      },
                      '&.Mui-disabled': {
                        backgroundColor: '#e0e0e0',
                        color: '#9e9e9e',
                      },
                    }}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Application'}
                  </Button>
                </Box>
              </Box>
            </Paper>
          </Box>
        </Box>
      )}

      {/* Success Snackbar */}
      <Snackbar
        open={showSuccess}
        autoHideDuration={4000}
        onClose={handleCloseSuccess}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSuccess}
          severity="success"
          icon={<CheckCircleIcon />}
          sx={{
            width: '100%',
            backgroundColor: theme.palette.success.main,
            color: '#fff',
            '& .MuiAlert-icon': {
              color: '#fff',
            },
          }}
        >
          We received your resume! We'll review your application for {selectedJob?.title}.
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default JobPortal;
export type { Job }; 