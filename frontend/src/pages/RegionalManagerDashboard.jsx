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
  MenuItem
} from '@mui/material';
import {
  Search,
  Person,
  CheckCircle,
  TrendingUp,
  Business,
  Layers,
  Group
} from '@mui/icons-material';
import { api } from '../context/AuthContext';

const RegionalManagerDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [trainees, setTrainees] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCohort, setSelectedCohort] = useState('All');

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
          <Box sx={{ p: 2.5, display: 'flex', gap: 2, alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider', flexWrap: 'wrap' }}>
            <TextField
              size="small"
              placeholder="Search trainees by ID, name, office, batch..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ flexGrow: 1, maxWidth: 500, minWidth: 250 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search color="action" fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel id="cohort-filter-label">Filter by Cohort</InputLabel>
              <Select
                labelId="cohort-filter-label"
                id="cohort-filter"
                value={selectedCohort}
                label="Filter by Cohort"
                onChange={(e) => setSelectedCohort(e.target.value)}
              >
                <MenuItem value="All">
                  <em>All Cohorts</em>
                </MenuItem>
                {cohortBreakdown.map((c) => (
                  <MenuItem key={c.id} value={c.cohort_code}>
                    {c.cohort_code} - {c.name} ({c.count})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

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
                      <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>
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
