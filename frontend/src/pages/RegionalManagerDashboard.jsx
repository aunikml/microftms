import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Grid,
  Chip,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Divider,
  useTheme,
  Button
} from '@mui/material';
import {
  Search,
  Person,
  CheckCircle,
  TrendingUp,
  Business,
  Layers,
  Group,
  Close,
  PeopleAltOutlined
} from '@mui/icons-material';
import { api } from '../context/AuthContext';

const RegionalManagerDashboard = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [trainees, setTrainees] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCohort, setSelectedCohort] = useState('All');

  const [traineeSearchTerm, setTraineeSearchTerm] = useState('');
  const [traineeSearchResults, setTraineeSearchResults] = useState([]);
  const [traineeSearchLoading, setTraineeSearchLoading] = useState(false);
  const [selectedTrainee, setSelectedTrainee] = useState(null);
  const [traineeDetailsOpen, setTraineeDetailsOpen] = useState(false);

  useEffect(() => {
    if (!traineeSearchTerm.trim()) {
      setTraineeSearchResults([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      setTraineeSearchLoading(true);
      try {
        const res = await api.get(`participants/?search=${encodeURIComponent(traineeSearchTerm)}`);
        setTraineeSearchResults(res.data);
      } catch (err) {
        console.error("Error searching trainees:", err);
      } finally {
        setTraineeSearchLoading(false);
      }
    }, 450);
    return () => clearTimeout(delayDebounce);
  }, [traineeSearchTerm]);

  const renderTraineeSearchWidget = () => (
    <Box sx={{ mb: 4 }}>
      <Card sx={{ p: 1, overflow: 'visible', borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <PeopleAltOutlined color="primary" /> Trainee Quick Search
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Search for a participant/trainee by ID/PIN, first name, or last name to view their profile and attendance record.
          </Typography>
          
          <Box sx={{ position: 'relative', width: '100%', maxWidth: 500 }}>
            <TextField
              fullWidth
              label="Enter Trainee PIN/ID or Name"
              variant="outlined"
              size="small"
              value={traineeSearchTerm}
              onChange={(e) => setTraineeSearchTerm(e.target.value)}
              placeholder="e.g. PART-C..."
              slotProps={{
                input: {
                  endAdornment: traineeSearchLoading ? <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} /> : null
                }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px'
                }
              }}
            />
            
            {/* Auto-suggest dropdown */}
            {traineeSearchResults.length > 0 && (
              <Paper 
                elevation={6} 
                sx={{ 
                  position: 'absolute', 
                  top: '100%', 
                  left: 0, 
                  right: 0, 
                  zIndex: 1100, 
                  mt: 1, 
                  maxHeight: 300, 
                  overflowY: 'auto',
                  borderRadius: '10px',
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper'
                }}
              >
                <List disablePadding>
                  {traineeSearchResults.map((trainee) => (
                    <ListItem 
                      key={trainee.id} 
                      disablePadding
                      sx={{
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        '&:last-child': { borderBottom: 'none' }
                      }}
                    >
                      <ListItemButton 
                        onClick={() => {
                          setSelectedTrainee(trainee);
                          setTraineeDetailsOpen(true);
                          setTraineeSearchTerm('');
                          setTraineeSearchResults([]);
                        }}
                        sx={{ py: 1.5 }}
                      >
                        <ListItemText 
                          primary={
                            <Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
                              {trainee.first_name} {trainee.last_name}
                            </Typography>
                          }
                          secondary={
                            <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                              <Chip 
                                label={trainee.participant_id} 
                                size="small" 
                                sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, bgcolor: 'action.hover' }} 
                              />
                              {trainee.cohort_code && (
                                <Chip 
                                  label={`Cohort: ${trainee.cohort_code}`} 
                                  size="small" 
                                  variant="outlined"
                                  sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }} 
                                />
                              )}
                              {trainee.regional_office_details?.name && (
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', ml: 0.5 }}>
                                  RO: {trainee.regional_office_details.name}
                                </Typography>
                              )}
                            </Box>
                          }
                          secondaryTypographyProps={{ component: 'div' }}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}

            {traineeSearchTerm.trim() && !traineeSearchLoading && traineeSearchResults.length === 0 && (
              <Paper 
                elevation={2} 
                sx={{ 
                  position: 'absolute', 
                  top: '100%', 
                  left: 0, 
                  right: 0, 
                  zIndex: 1100, 
                  mt: 1, 
                  p: 2, 
                  borderRadius: '10px',
                  border: '1px solid',
                  borderColor: 'divider',
                  textAlign: 'center',
                  bgcolor: 'background.paper'
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  No trainees found matching "{traineeSearchTerm}"
                </Typography>
              </Paper>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Trainee Details Dialog */}
      <Dialog
        open={traineeDetailsOpen}
        onClose={() => setTraineeDetailsOpen(false)}
        maxWidth="sm"
        fullWidth
        scroll="paper"
        PaperProps={{
          sx: { 
            borderRadius: '20px', 
            overflow: 'hidden', 
            boxShadow: '0 24px 48px rgba(0,0,0,0.15)',
            bgcolor: 'background.paper'
          }
        }}
      >
        {selectedTrainee && (
          <>
            {/* Dialog Header Banner with Brand Colors */}
            <Box 
              sx={{ 
                background: !isDarkMode
                  ? 'linear-gradient(135deg, #be123c 0%, #ea580c 100%)'
                  : 'linear-gradient(135deg, #881337 0%, #7c2d12 100%)',
                p: 3, 
                color: '#fff',
                position: 'relative'
              }}
            >
              <IconButton 
                onClick={() => setTraineeDetailsOpen(false)}
                sx={{ position: 'absolute', top: 16, right: 16, color: '#fff' }}
              >
                <Close />
              </IconButton>
              
              <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: '"Outfit", "Plus Jakarta Sans", sans-serif', letterSpacing: '-0.5px', mb: 0.5 }}>
                Trainee Profile
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.85, fontWeight: 600 }}>
                PIN: {selectedTrainee.participant_id}
              </Typography>
            </Box>

            <DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Personal Information */}
              <Box>
                <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 800, mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.8px', fontSize: '0.75rem' }}>
                  Personal Information
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: '12px', bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider' }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
                        Full Name
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 700 }}>
                        {selectedTrainee.first_name} {selectedTrainee.last_name}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
                        Email Address
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, wordBreak: 'break-all' }}>
                        {selectedTrainee.email}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
                        Phone Number
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {selectedTrainee.phone_number || 'N/A'}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Box>

              {/* Cohort & Office Information */}
              <Box>
                <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 800, mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.8px', fontSize: '0.75rem' }}>
                  Academic & Geography
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: '12px', bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider' }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
                        Cohort / Program
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {selectedTrainee.cohort_name || 'N/A'} ({selectedTrainee.cohort_code || 'N/A'}) • <span style={{ textTransform: 'capitalize' }}>{selectedTrainee.program || 'N/A'}</span>
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
                        Regional Office
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {selectedTrainee.regional_office_details?.name || 'N/A'}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Box>

              {/* Attendance Breakdown */}
              <Box>
                <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 800, mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.8px', fontSize: '0.75rem' }}>
                  Training Attendance Summary
                </Typography>
                
                <Grid container spacing={2}>
                  {['basic', 'refresher_1', 'refresher_2'].map((stageKey) => {
                    const stageData = selectedTrainee.attendance_by_stage?.[stageKey] || {
                      status: 'Pending',
                      present: 0,
                      absent: 0,
                      late: 0,
                      total: 0
                    };
                    
                    let label = 'Basic';
                    if (stageKey === 'refresher_1') label = 'Refresher 1';
                    if (stageKey === 'refresher_2') label = 'Refresher 2';

                    let statusColor = 'default';
                    if (stageData.status.toLowerCase() === 'completed') statusColor = 'success';
                    if (stageData.status.toLowerCase() === 'scheduled') statusColor = 'warning';

                    return (
                      <Grid item xs={12} md={4} key={stageKey}>
                        <Paper 
                          variant="outlined" 
                          sx={{ 
                            p: 2, 
                            borderRadius: '12px', 
                            height: '100%', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: 1.5,
                            border: '1px solid',
                            borderColor: 'divider',
                            position: 'relative',
                            overflow: 'hidden'
                          }}
                        >
                          {/* Mini decorative accent border matching status */}
                          <Box 
                            sx={{ 
                              position: 'absolute', 
                              top: 0, 
                              left: 0, 
                              right: 0, 
                              height: 4, 
                              bgcolor: stageData.status.toLowerCase() === 'completed' ? 'success.main' : 
                                       stageData.status.toLowerCase() === 'scheduled' ? 'warning.main' : 'text.disabled'
                            }}
                          />
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              {label}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ mt: 'auto' }}>
                            <Chip 
                              label={stageData.status} 
                              size="small" 
                              color={statusColor}
                              sx={{ fontSize: '0.65rem', fontWeight: 800, height: 18, mb: 1.5 }}
                            />
                            
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="caption" color="text.secondary">Present:</Typography>
                                <Typography variant="caption" sx={{ fontWeight: 700, color: 'success.main' }}>{stageData.present}d</Typography>
                              </Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="caption" color="text.secondary">Absent:</Typography>
                                <Typography variant="caption" sx={{ fontWeight: 700, color: 'error.main' }}>{stageData.absent}d</Typography>
                              </Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="caption" color="text.secondary">Late:</Typography>
                                <Typography variant="caption" sx={{ fontWeight: 700, color: 'warning.main' }}>{stageData.late}d</Typography>
                              </Box>
                            </Box>
                          </Box>
                        </Paper>
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>
            </DialogContent>

            <DialogActions sx={{ p: 2.5, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
              <Button 
                onClick={() => setTraineeDetailsOpen(false)} 
                variant="outlined" 
                sx={{ 
                  borderRadius: '10px', 
                  fontWeight: 700, 
                  px: 3,
                  textTransform: 'none'
                }}
              >
                Close Profile
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get('dashboards/regional-manager/');
        setTrainees(res.data);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.detail || 'Failed to retrieve Regional Manager dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // Group trainees by cohort to compute breakdown
  const cohortBreakdown = React.useMemo(() => {
    const counts = {};
    trainees.forEach(t => {
      const code = t.cohort_code || 'Unknown';
      const name = t.cohort_name || 'Unknown Cohort';
      const id = t.cohort_id || 'unknown';
      const key = `${id}_${code}`;
      if (!counts[key]) {
        counts[key] = {
          id,
          cohort_code: code,
          name,
          count: 0
        };
      }
      counts[key].count += 1;
    });
    return Object.values(counts).sort((a, b) => a.cohort_code.localeCompare(b.cohort_code));
  }, [trainees]);

  // Filter trainees based on search query and selected cohort
  const filteredTrainees = trainees.filter((t) => {
    // Cohort filter
    if (selectedCohort !== 'All' && String(t.cohort_code) !== selectedCohort) {
      return false;
    }
    // Search query filter
    const query = searchQuery.toLowerCase();
    const fullName = t.name.toLowerCase();
    return (
      fullName.includes(query) ||
      t.email.toLowerCase().includes(query) ||
      t.participant_id.toLowerCase().includes(query) ||
      t.regional_office.toLowerCase().includes(query) ||
      t.batch_name.toLowerCase().includes(query) ||
      (t.cohort_code && t.cohort_code.toLowerCase().includes(query)) ||
      (t.cohort_name && t.cohort_name.toLowerCase().includes(query))
    );
  });

  const getAttendanceChip = (attendanceVal) => {
    if (attendanceVal === 'N/A') {
      return <Chip label="N/A" size="small" variant="outlined" sx={{ fontWeight: 700, color: 'text.secondary' }} />;
    }
    const percent = parseInt(attendanceVal.split('%')[0], 10);
    let color = 'error';
    if (percent >= 80) color = 'success';
    else if (percent >= 50) color = 'warning';

    return (
      <Chip 
        label={attendanceVal} 
        size="small" 
        color={color} 
        sx={{ fontWeight: 750, minWidth: 80 }} 
      />
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Calculate high-level metrics
  const totalTrainees = trainees.length;
  const officesCount = new Set(trainees.map(t => t.regional_office).filter(o => o !== '-')).size;
  
  // Calculate average basic attendance
  const basicRates = trainees
    .map(t => t.basic_attendance)
    .filter(r => r !== 'N/A')
    .map(r => parseInt(r.split('%')[0], 10));
  const avgBasicRate = basicRates.length > 0 
    ? Math.round(basicRates.reduce((a, b) => a + b, 0) / basicRates.length) 
    : 0;

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.5px' }}>
          Regional Manager Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Monitor progression and attendance records for trainees in your regional offices.
        </Typography>
      </Box>

      {renderTraineeSearchWidget()}

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Metrics Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2.5, py: 2.5 }}>
              <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', width: 48, height: 48, borderRadius: 2 }}>
                <Person />
              </Avatar>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                  Total Trainees
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>
                  {totalTrainees}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2.5, py: 2.5 }}>
              <Avatar sx={{ bgcolor: 'secondary.light', color: 'secondary.main', width: 48, height: 48, borderRadius: 2 }}>
                <Business />
              </Avatar>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                  Regional Offices
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>
                  {officesCount}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2.5, py: 2.5 }}>
              <Avatar sx={{ bgcolor: 'success.light', color: 'success.main', width: 48, height: 48, borderRadius: 2 }}>
                <TrendingUp />
              </Avatar>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                  Avg. Basic Attendance
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>
                  {avgBasicRate}%
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Cohorts Breakdown Grid */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Layers color="primary" /> Cohorts Breakdown
        </Typography>
        <Grid container spacing={3}>
          {/* "All Cohorts" Card */}
          <Grid item xs={12} sm={6} md={3}>
            <Card
              onClick={() => setSelectedCohort('All')}
              sx={{
                cursor: 'pointer',
                borderRadius: 3,
                border: '2px solid',
                borderColor: selectedCohort === 'All' ? 'primary.main' : 'divider',
                backgroundColor: selectedCohort === 'All' ? 'action.hover' : 'background.paper',
                boxShadow: selectedCohort === 'All' ? 2 : 'none',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 2,
                  borderColor: 'primary.main'
                }
              }}
            >
              <CardContent sx={{ py: 2, px: 2.5, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', width: 36, height: 36, borderRadius: 1.5 }}>
                    <Group fontSize="small" />
                  </Avatar>
                  {selectedCohort === 'All' && (
                    <Chip label="Active Filter" color="primary" size="small" sx={{ fontWeight: 700, height: 20, fontSize: '0.65rem' }} />
                  )}
                </Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                  All Cohorts
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, color: 'primary.main', mt: 1 }}>
                  {totalTrainees} <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'text.secondary' }}>trainees</span>
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Individual Cohort Cards */}
          {cohortBreakdown.map((cohort) => {
            const isSelected = selectedCohort === cohort.cohort_code;
            return (
              <Grid item xs={12} sm={6} md={3} key={cohort.id}>
                <Card
                  onClick={() => setSelectedCohort(isSelected ? 'All' : cohort.cohort_code)}
                  sx={{
                    cursor: 'pointer',
                    borderRadius: 3,
                    border: '2px solid',
                    borderColor: isSelected ? 'primary.main' : 'divider',
                    backgroundColor: isSelected ? 'action.hover' : 'background.paper',
                    boxShadow: isSelected ? 2 : 'none',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 2,
                      borderColor: 'primary.main'
                    }
                  }}
                >
                  <CardContent sx={{ py: 2, px: 2.5, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Avatar sx={{ bgcolor: isSelected ? 'primary.light' : 'secondary.light', color: isSelected ? 'primary.main' : 'secondary.main', width: 36, height: 36, borderRadius: 1.5 }}>
                        <Layers fontSize="small" />
                      </Avatar>
                      {isSelected && (
                        <Chip label="Active Filter" color="primary" size="small" sx={{ fontWeight: 700, height: 20, fontSize: '0.65rem' }} />
                      )}
                    </Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, textTransform: 'uppercase' }} noWrap>
                      {cohort.cohort_code}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }} noWrap>
                      {cohort.name}
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: 'text.primary', mt: 0.5 }}>
                      {cohort.count} <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'text.secondary' }}>trainees</span>
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Box>

      {/* Main List */}
      <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
        <CardContent sx={{ p: 0 }}>

          <TableContainer component={Paper} elevation={0} sx={{ border: 'none' }}>
            <Table>
              <TableHead sx={{ bgcolor: (theme) => theme.palette.mode === 'light' ? '#f8fafc' : '#1e293b' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Participant ID</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Phone</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Cohort</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Batch</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Regional Office</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Basic Attendance</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Refresher 1</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Refresher 2</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTrainees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                      {searchQuery || selectedCohort !== 'All' ? "No matching trainees found." : "No trainees enrolled under your regional offices."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTrainees.map((t) => (
                    <TableRow key={t.id} hover>
                      <TableCell 
                        sx={{ 
                          fontWeight: 700, 
                          color: 'primary.main', 
                          cursor: 'pointer',
                          '&:hover': { textDecoration: 'underline' }
                        }}
                        onClick={async () => {
                          const nameParts = t.name.split(' ');
                          const firstName = nameParts[0] || '';
                          const lastName = nameParts.slice(1).join(' ') || '';
                          
                          setSelectedTrainee({
                            id: t.id,
                            participant_id: t.participant_id,
                            first_name: firstName,
                            last_name: lastName,
                            email: t.email,
                            phone_number: t.phone !== '-' ? t.phone : '',
                            cohort_name: t.cohort_name !== '-' ? t.cohort_name : '',
                            cohort_code: t.cohort_code !== '-' ? t.cohort_code : '',
                            batch_name: t.batch_name,
                            regional_office_details: { name: t.regional_office },
                            attendance_by_stage: {
                              basic: { status: 'Pending', present: 0, absent: 0, late: 0 },
                              refresher_1: { status: 'Pending', present: 0, absent: 0, late: 0 },
                              refresher_2: { status: 'Pending', present: 0, absent: 0, late: 0 }
                            }
                          });
                          setTraineeDetailsOpen(true);

                          try {
                            const res = await api.get(`participants/${t.id}/`);
                            setSelectedTrainee(res.data);
                          } catch (err) {
                            console.error("Error loading trainee details:", err);
                          }
                        }}
                      >
                        {t.participant_id}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{t.name}</TableCell>
                      <TableCell>{t.email}</TableCell>
                      <TableCell>{t.phone}</TableCell>
                      <TableCell>
                        <Box>
                          <Chip label={t.cohort_code} size="small" color="secondary" variant="outlined" sx={{ fontWeight: 700, mb: 0.5 }} />
                          <Typography variant="caption" display="block" color="text.secondary" noWrap sx={{ maxWidth: 120 }}>
                            {t.cohort_name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{t.batch_name}</TableCell>
                      <TableCell>
                        <Chip label={t.regional_office} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                      </TableCell>
                      <TableCell align="center">{getAttendanceChip(t.basic_attendance)}</TableCell>
                      <TableCell align="center">{getAttendanceChip(t.refresher_1_attendance)}</TableCell>
                      <TableCell align="center">{getAttendanceChip(t.refresher_2_attendance)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default RegionalManagerDashboard;
