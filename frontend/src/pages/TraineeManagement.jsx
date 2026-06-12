import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Grid,
  Autocomplete
} from '@mui/material';
import { Add, Refresh, Edit, Delete, Visibility } from '@mui/icons-material';
import { api } from '../context/AuthContext';

const TraineeManagement = () => {
  const navigate = useNavigate();
  const [cohorts, setCohorts] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Divisions and locations states
  const [divisions, setDivisions] = useState([]);
  const [locations, setLocations] = useState([]);
  const [locationsLoading, setLocationsLoading] = useState(false);

  // Dialog states - Batch
  const [batchOpen, setBatchOpen] = useState(false);
  const [batchEditOpen, setBatchEditOpen] = useState(false);
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [batchForm, setBatchForm] = useState({
    division: '',
    program: 'dabi',
    cohort: '',
    location: '',
    start_date: ''
  });
  const [batchSubmitting, setBatchSubmitting] = useState(false);
  const [batchError, setBatchError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [cohortsRes, batchesRes, divisionsRes] = await Promise.all([
        api.get('cohorts/'),
        api.get('batches/'),
        api.get('regional-offices/divisions/')
      ]);
      setCohorts(cohortsRes.data);
      setBatches(batchesRes.data);
      setDivisions(divisionsRes.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load training batch structures.');
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async () => {
    setLocationsLoading(true);
    try {
      const res = await api.get('regional-offices/divisions/locations/');
      if (Array.isArray(res.data)) {
        setLocations(res.data);
      }
    } catch (err) {
      console.warn("Failed to fetch locations", err);
    } finally {
      setLocationsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchLocations();
  }, []);

  // --- BATCH HANDLERS ---
  const handleBatchOpen = () => {
    setBatchForm({
      division: divisions.length > 0 ? divisions[0].id : '',
      program: 'dabi',
      cohort: cohorts.length > 0 ? cohorts[0].id : '',
      location: '',
      start_date: new Date().toISOString().split('T')[0]
    });
    setBatchError('');
    setBatchOpen(true);
  };

  const handleBatchSubmit = async (e) => {
    e.preventDefault();
    if (!batchForm.division || !batchForm.program || !batchForm.cohort || !batchForm.location || !batchForm.start_date) {
      setBatchError('Please fill in all required fields.');
      return;
    }
    setBatchSubmitting(true);
    setBatchError('');

    try {
      await api.post('batches/', batchForm);
      setBatchOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      setBatchError(
        err.response?.data?.detail || 
        err.response?.data?.location?.[0] || 
        err.response?.data?.division?.[0] || 
        'Failed to create batch.'
      );
    } finally {
      setBatchSubmitting(false);
    }
  };

  const handleBatchEditOpen = (batch) => {
    setSelectedBatch(batch);
    setBatchForm({
      division: batch.division || '',
      program: batch.program || 'dabi',
      cohort: batch.cohort,
      location: batch.location,
      start_date: batch.start_date
    });
    setBatchError('');
    setBatchEditOpen(true);
  };

  const handleBatchEditSubmit = async (e) => {
    e.preventDefault();
    if (!batchForm.division || !batchForm.program || !batchForm.cohort || !batchForm.location || !batchForm.start_date) {
      setBatchError('Please fill in all fields.');
      return;
    }
    setBatchSubmitting(true);
    setBatchError('');

    try {
      await api.patch(`batches/${selectedBatch.id}/`, batchForm);
      setBatchEditOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      setBatchError(
        err.response?.data?.detail || 
        err.response?.data?.location?.[0] || 
        err.response?.data?.division?.[0] || 
        'Failed to edit batch.'
      );
    } finally {
      setBatchSubmitting(false);
    }
  };

  const handleBatchDeleteOpen = (batch) => {
    setSelectedBatch(batch);
    setBatchError('');
    setBatchDeleteOpen(true);
  };

  const handleBatchDeleteSubmit = async () => {
    setBatchSubmitting(true);
    setBatchError('');
    try {
      await api.delete(`batches/${selectedBatch.id}/`);
      setBatchDeleteOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      setBatchError(err.response?.data?.detail || 'Failed to delete batch.');
    } finally {
      setBatchSubmitting(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5, letterSpacing: '-0.5px' }}>
            Trainee Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Organize training schedules and track active student batches.
          </Typography>
        </Box>
        <Box>
          <IconButton onClick={fetchData} disabled={loading} color="primary" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Refresh />
          </IconButton>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleBatchOpen}
              disabled={cohorts.length === 0}
              sx={{
                background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                color: '#fff',
                fontWeight: 700,
                borderRadius: 2
              }}
            >
              Create Batch
            </Button>
          </Box>

          <Card>
            <CardContent sx={{ p: 0 }}>
              <TableContainer component={Paper} elevation={0} sx={{ border: 'none' }}>
                <Table>
                  <TableHead sx={{ bgcolor: (theme) => theme.palette.mode === 'light' ? '#f8fafc' : '#1e293b' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Batch Name</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Division</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Training Location</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Start Date</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Cohort</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Participants</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {batches.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                          {cohorts.length === 0 ? "Create a Cohort first to start creating Batches." : "No batches registered in the system."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      batches.map((b) => (
                        <TableRow key={b.id} hover>
                          <TableCell sx={{ fontWeight: 600 }}>{b.batch_name}</TableCell>
                          <TableCell>{b.division_details?.name || 'No Division'}</TableCell>
                          <TableCell>{b.location}</TableCell>
                          <TableCell>{b.start_date}</TableCell>
                          <TableCell>{b.cohort_details?.name || b.cohort}</TableCell>
                          <TableCell>{b.participant_count}</TableCell>
                          <TableCell align="right">
                            <IconButton size="small" onClick={() => navigate(`/batches/${b.id}`)} color="success" sx={{ mr: 1 }}>
                              <Visibility fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleBatchEditOpen(b)} color="primary" sx={{ mr: 1 }}>
                              <Edit fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleBatchDeleteOpen(b)} color="error">
                              <Delete fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </>
      )}

      {/* --- BATCH MODALS --- */}
      {/* Create Batch */}
      <Dialog open={batchOpen} onClose={() => setBatchOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Create Training Batch</DialogTitle>
        <DialogContent>
          {batchError && <Alert severity="error" sx={{ mb: 2 }}>{batchError}</Alert>}
          <Box 
            component="form" 
            noValidate 
            sx={{ 
              mt: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: 2.5
            }}
          >
            <FormControl fullWidth required>
              <InputLabel id="batch-division-label">Division</InputLabel>
              <Select
                labelId="batch-division-label"
                value={batchForm.division}
                label="Division"
                onChange={(e) => setBatchForm({ ...batchForm, division: e.target.value })}
              >
                {divisions.map((d) => (
                  <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel id="batch-program-label">Program</InputLabel>
              <Select
                labelId="batch-program-label"
                value={batchForm.program}
                label="Program"
                onChange={(e) => setBatchForm({ ...batchForm, program: e.target.value })}
              >
                <MenuItem value="dabi">Dabi</MenuItem>
                <MenuItem value="progoti">Progoti</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel id="batch-cohort-label">Cohort Category</InputLabel>
              <Select
                labelId="batch-cohort-label"
                value={batchForm.cohort}
                label="Cohort Category"
                onChange={(e) => setBatchForm({ ...batchForm, cohort: e.target.value })}
              >
                {cohorts.map((c) => (
                  <MenuItem key={c.id} value={c.id}>{c.name} ({c.cohort_code})</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Autocomplete
              id="create-batch-location"
              options={locations}
              value={batchForm.location || null}
              onChange={(event, newValue) => {
                setBatchForm({ ...batchForm, location: newValue || '' });
              }}
              loading={locationsLoading}
              renderInput={(params) => (
                <TextField
                  {...params}
                  required
                  label="Training Location"
                  placeholder="Search and select location..."
                />
              )}
            />

            <TextField
              name="start_date"
              required
              fullWidth
              type="date"
              label="Start Date"
              InputLabelProps={{ shrink: true }}
              value={batchForm.start_date}
              onChange={(e) => setBatchForm({ ...batchForm, start_date: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setBatchOpen(false)} variant="outlined" sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={batchSubmitting}
            onClick={handleBatchSubmit}
            sx={{
              borderRadius: 2,
              background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
              color: '#fff',
              fontWeight: 700,
              px: 3
            }}
          >
            {batchSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Create Batch'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Batch */}
      <Dialog open={batchEditOpen} onClose={() => setBatchEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Edit Batch details</DialogTitle>
        <DialogContent>
          {batchError && <Alert severity="error" sx={{ mb: 2 }}>{batchError}</Alert>}
          <Box 
            component="form" 
            noValidate 
            sx={{ 
              mt: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: 2.5
            }}
          >
            <FormControl fullWidth required>
              <InputLabel id="edit-batch-division-label">Division</InputLabel>
              <Select
                labelId="edit-batch-division-label"
                value={batchForm.division}
                label="Division"
                onChange={(e) => setBatchForm({ ...batchForm, division: e.target.value })}
              >
                {divisions.map((d) => (
                  <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel id="edit-batch-program-label">Program</InputLabel>
              <Select
                labelId="edit-batch-program-label"
                value={batchForm.program}
                label="Program"
                onChange={(e) => setBatchForm({ ...batchForm, program: e.target.value })}
              >
                <MenuItem value="dabi">Dabi</MenuItem>
                <MenuItem value="progoti">Progoti</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel id="edit-batch-cohort-label">Cohort Category</InputLabel>
              <Select
                labelId="edit-batch-cohort-label"
                value={batchForm.cohort}
                label="Cohort Category"
                onChange={(e) => setBatchForm({ ...batchForm, cohort: e.target.value })}
              >
                {cohorts.map((c) => (
                  <MenuItem key={c.id} value={c.id}>{c.name} ({c.cohort_code})</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Autocomplete
              id="edit-batch-location"
              options={locations}
              value={batchForm.location || null}
              onChange={(event, newValue) => {
                setBatchForm({ ...batchForm, location: newValue || '' });
              }}
              loading={locationsLoading}
              renderInput={(params) => (
                <TextField
                  {...params}
                  required
                  label="Training Location"
                  placeholder="Search and select location..."
                />
              )}
            />

            <TextField
              name="start_date"
              required
              fullWidth
              type="date"
              label="Start Date"
              InputLabelProps={{ shrink: true }}
              value={batchForm.start_date}
              onChange={(e) => setBatchForm({ ...batchForm, start_date: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setBatchEditOpen(false)} variant="outlined" sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={batchSubmitting}
            onClick={handleBatchEditSubmit}
            sx={{
              borderRadius: 2,
              background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
              color: '#fff',
              fontWeight: 700,
              px: 3
            }}
          >
            {batchSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Batch */}
      <Dialog open={batchDeleteOpen} onClose={() => setBatchDeleteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Delete Training Batch</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to permanently delete batch <strong>{selectedBatch?.batch_name}</strong>?
          </Typography>
          <Typography variant="body2" color="error" sx={{ fontWeight: 600 }}>
            Warning: This action is irreversible. All student participants currently enrolled inside this batch will be permanently removed.
          </Typography>
          {batchError && <Alert severity="error" sx={{ mt: 2 }}>{batchError}</Alert>}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setBatchDeleteOpen(false)} variant="outlined" sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={batchSubmitting}
            onClick={handleBatchDeleteSubmit}
            sx={{ borderRadius: 2, px: 3, fontWeight: 700 }}
          >
            {batchSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Delete Batch'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TraineeManagement;
