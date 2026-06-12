import React, { useState, useEffect } from 'react';
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
  Alert,
  CircularProgress,
  Grid
} from '@mui/material';
import { Add, Refresh, Edit, Delete } from '@mui/icons-material';
import { api } from '../context/AuthContext';

const CohortManagement = () => {
  const [cohorts, setCohorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dialog states - Cohort
  const [cohortOpen, setCohortOpen] = useState(false);
  const [cohortEditOpen, setCohortEditOpen] = useState(false);
  const [cohortDeleteOpen, setCohortDeleteOpen] = useState(false);
  const [selectedCohort, setSelectedCohort] = useState(null);
  const [cohortForm, setCohortForm] = useState({ cohort_code: '', name: '', description: '' });
  const [cohortSubmitting, setCohortSubmitting] = useState(false);
  const [cohortError, setCohortError] = useState('');

  const fetchCohortData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('cohorts/');
      setCohorts(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load cohort categories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCohortData();
  }, []);

  // --- COHORT HANDLERS ---
  const handleCohortOpen = () => {
    setCohortForm({ cohort_code: '', name: '', description: '' });
    setCohortError('');
    setCohortOpen(true);
  };

  const handleCohortSubmit = async (e) => {
    e.preventDefault();
    if (!cohortForm.cohort_code || !cohortForm.name) {
      setCohortError('Please fill in Cohort Code and Name.');
      return;
    }
    setCohortSubmitting(true);
    setCohortError('');
    try {
      await api.post('cohorts/', cohortForm);
      setCohortOpen(false);
      fetchCohortData();
    } catch (err) {
      console.error(err);
      setCohortError(err.response?.data?.cohort_code?.[0] || err.response?.data?.detail || 'Failed to create cohort.');
    } finally {
      setCohortSubmitting(false);
    }
  };

  const handleCohortEditOpen = (cohort) => {
    setSelectedCohort(cohort);
    setCohortForm({
      cohort_code: cohort.cohort_code,
      name: cohort.name,
      description: cohort.description || ''
    });
    setCohortError('');
    setCohortEditOpen(true);
  };

  const handleCohortEditSubmit = async (e) => {
    e.preventDefault();
    if (!cohortForm.name) {
      setCohortError('Please fill in Cohort Name.');
      return;
    }
    setCohortSubmitting(true);
    setCohortError('');
    try {
      await api.patch(`cohorts/${selectedCohort.id}/`, cohortForm);
      setCohortEditOpen(false);
      fetchCohortData();
    } catch (err) {
      console.error(err);
      setCohortError(err.response?.data?.detail || 'Failed to edit cohort.');
    } finally {
      setCohortSubmitting(false);
    }
  };

  const handleCohortDeleteOpen = (cohort) => {
    setSelectedCohort(cohort);
    setCohortError('');
    setCohortDeleteOpen(true);
  };

  const handleCohortDeleteSubmit = async () => {
    setCohortSubmitting(true);
    setCohortError('');
    try {
      await api.delete(`cohorts/${selectedCohort.id}/`);
      setCohortDeleteOpen(false);
      fetchCohortData();
    } catch (err) {
      console.error(err);
      setCohortError(err.response?.data?.detail || 'Failed to delete cohort. Check if it has active batches.');
    } finally {
      setCohortSubmitting(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5, letterSpacing: '-0.5px' }}>
            Cohort Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage cohort categories to group training batches and participants.
          </Typography>
        </Box>
        <Box>
          <IconButton onClick={fetchCohortData} disabled={loading} color="primary" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Refresh />
          </IconButton>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCohortOpen}
          sx={{
            background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
            color: '#fff',
            fontWeight: 700,
            borderRadius: 2
          }}
        >
          Create Cohort
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Card>
          <CardContent sx={{ p: 0 }}>
            <TableContainer component={Paper} elevation={0} sx={{ border: 'none' }}>
              <Table>
                <TableHead sx={{ bgcolor: (theme) => theme.palette.mode === 'light' ? '#f8fafc' : '#1e293b' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Cohort Code</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Cohort Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cohorts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                        No cohorts registered in the system.
                      </TableCell>
                    </TableRow>
                  ) : (
                    cohorts.map((c) => (
                      <TableRow key={c.id} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{c.cohort_code}</TableCell>
                        <TableCell>{c.name}</TableCell>
                        <TableCell>{c.description || '-'}</TableCell>
                        <TableCell align="right">
                          <IconButton size="small" onClick={() => handleCohortEditOpen(c)} color="primary" sx={{ mr: 1 }}>
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleCohortDeleteOpen(c)} color="error">
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
      )}

      {/* --- COHORT MODALS --- */}
      {/* Create Cohort */}
      <Dialog open={cohortOpen} onClose={() => setCohortOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Create Cohort Category</DialogTitle>
        <DialogContent>
          {cohortError && <Alert severity="error" sx={{ mb: 2 }}>{cohortError}</Alert>}
          <Box component="form" noValidate sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  name="cohort_code"
                  required
                  fullWidth
                  label="Cohort Code (e.g. BD-WEB)"
                  value={cohortForm.cohort_code}
                  onChange={(e) => setCohortForm({ ...cohortForm, cohort_code: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="name"
                  required
                  fullWidth
                  label="Cohort Name"
                  value={cohortForm.name}
                  onChange={(e) => setCohortForm({ ...cohortForm, name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="description"
                  fullWidth
                  multiline
                  rows={3}
                  label="Description (Optional)"
                  value={cohortForm.description}
                  onChange={(e) => setCohortForm({ ...cohortForm, description: e.target.value })}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setCohortOpen(false)} variant="outlined" sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={cohortSubmitting}
            onClick={handleCohortSubmit}
            sx={{
              borderRadius: 2,
              background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
              color: '#fff',
              fontWeight: 700,
              px: 3
            }}
          >
            {cohortSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Create Cohort'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Cohort */}
      <Dialog open={cohortEditOpen} onClose={() => setCohortEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Edit Cohort Details</DialogTitle>
        <DialogContent>
          {cohortError && <Alert severity="error" sx={{ mb: 2 }}>{cohortError}</Alert>}
          <Box component="form" noValidate sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  name="cohort_code"
                  required
                  fullWidth
                  disabled
                  label="Cohort Code"
                  value={cohortForm.cohort_code}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="name"
                  required
                  fullWidth
                  label="Cohort Name"
                  value={cohortForm.name}
                  onChange={(e) => setCohortForm({ ...cohortForm, name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="description"
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  value={cohortForm.description}
                  onChange={(e) => setCohortForm({ ...cohortForm, description: e.target.value })}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setCohortEditOpen(false)} variant="outlined" sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={cohortSubmitting}
            onClick={handleCohortEditSubmit}
            sx={{
              borderRadius: 2,
              background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
              color: '#fff',
              fontWeight: 700,
              px: 3
            }}
          >
            {cohortSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Cohort */}
      <Dialog open={cohortDeleteOpen} onClose={() => setCohortDeleteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Delete Cohort Category</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to permanently delete cohort <strong>{selectedCohort?.name}</strong> ({selectedCohort?.cohort_code})?
          </Typography>
          <Typography variant="body2" color="error" sx={{ fontWeight: 600 }}>
            Warning: This action is irreversible. It will fail if batches are currently linked to this cohort.
          </Typography>
          {cohortError && <Alert severity="error" sx={{ mt: 2 }}>{cohortError}</Alert>}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setCohortDeleteOpen(false)} variant="outlined" sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={cohortSubmitting}
            onClick={handleCohortDeleteSubmit}
            sx={{ borderRadius: 2, px: 3, fontWeight: 700 }}
          >
            {cohortSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Delete Cohort'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CohortManagement;
