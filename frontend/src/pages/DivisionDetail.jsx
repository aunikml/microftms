import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
  Chip,
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
  IconButton,
  CircularProgress,
  Grid,
  Breadcrumbs,
  Autocomplete
} from '@mui/material';
import { 
  Add, 
  Refresh, 
  Edit, 
  Delete, 
  ArrowBack, 
  Business, 
  Map,
  Person
} from '@mui/icons-material';
import { api } from '../context/AuthContext';

const DivisionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [division, setDivision] = useState(null);
  const [offices, setOffices] = useState([]);
  const [managers, setManagers] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Office Create Dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createForm, setCreateForm] = useState({
    name: '',
    location: '',
    regional_managers: []
  });

  // Office Edit Dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');
  const [editObject, setEditObject] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    location: '',
    regional_managers: []
  });

  // Office Delete Dialog state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleteObject, setDeleteObject] = useState(null);

  // Fetch Division & Regional Offices & Managers
  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [divRes, officesRes, managersRes] = await Promise.all([
        api.get(`regional-offices/divisions/${id}/`),
        api.get(`regional-offices/?division=${id}`),
        api.get('users/?role=regional_manager')
      ]);
      setDivision(divRes.data);
      setOffices(officesRes.data);
      setManagers(managersRes.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch division details and regional offices.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  // Create Handlers
  const handleCreateOpen = () => {
    setCreateForm({
      name: '',
      location: '',
      regional_managers: []
    });
    setCreateError('');
    setCreateOpen(true);
  };

  const handleCreateClose = () => setCreateOpen(false);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.name || !createForm.location) {
      setCreateError('Name and Location are required.');
      return;
    }
    setCreateError('');
    setCreateSubmitting(true);
    try {
      const payload = {
        name: createForm.name,
        location: createForm.location,
        division: parseInt(id),
        regional_managers: createForm.regional_managers
      };
      await api.post('regional-offices/', payload);
      setCreateOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      setCreateError(
        err.response?.data?.location?.[0] || 
        err.response?.data?.name?.[0] || 
        err.response?.data?.detail || 
        'Failed to create regional office.'
      );
    } finally {
      setCreateSubmitting(false);
    }
  };

  // Edit Handlers
  const handleEditOpen = (office) => {
    setEditObject(office);
    setEditForm({
      name: office.name,
      location: office.location,
      regional_managers: office.regional_managers || []
    });
    setEditError('');
    setEditOpen(true);
  };

  const handleEditClose = () => setEditOpen(false);

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.name || !editForm.location) {
      setEditError('Name and Location are required.');
      return;
    }
    setEditError('');
    setEditSubmitting(true);
    try {
      const payload = {
        name: editForm.name,
        location: editForm.location,
        division: parseInt(id),
        regional_managers: editForm.regional_managers
      };
      await api.put(`regional-offices/${editObject.id}/`, payload);
      setEditOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      setEditError(
        err.response?.data?.location?.[0] || 
        err.response?.data?.name?.[0] || 
        err.response?.data?.detail || 
        'Failed to update regional office.'
      );
    } finally {
      setEditSubmitting(false);
    }
  };

  // Delete Handlers
  const handleDeleteOpen = (office) => {
    setDeleteObject(office);
    setDeleteError('');
    setDeleteOpen(true);
  };

  const handleDeleteClose = () => setDeleteOpen(false);

  const handleDeleteSubmit = async () => {
    setDeleteError('');
    setDeleteSubmitting(true);
    try {
      await api.delete(`regional-offices/${deleteObject.id}/`);
      setDeleteOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      setDeleteError(err.response?.data?.detail || 'Failed to delete regional office.');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  if (loading && !division) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header Panel */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2 }}>
        <Box>
          <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 1 }}>
            <Link to="/regional-offices" style={{ textDecoration: 'none', color: 'inherit', fontWeight: 600 }}>
              Divisions & Regional Office
            </Link>
            <Typography color="text.primary" sx={{ fontWeight: 600 }}>
              {division?.name || 'Division Details'}
            </Typography>
          </Breadcrumbs>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              startIcon={<ArrowBack />}
              onClick={() => navigate('/regional-offices')}
              sx={{ fontWeight: 700, borderRadius: 2 }}
              color="inherit"
              variant="outlined"
              size="small"
            >
              Back
            </Button>
            <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.5px' }}>
              {division?.name} Details
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <IconButton onClick={fetchData} disabled={loading} color="primary" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Refresh />
          </IconButton>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreateOpen}
            sx={{
              background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
              color: '#fff',
              fontWeight: 700,
              borderRadius: 2,
              px: 3
            }}
          >
            Add Regional Office
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Division Info Card */}
      <Card sx={{ mb: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Map color="primary" /> Included Regions
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
            {division?.included_regions && division.included_regions.length > 0 ? (
              division.included_regions.map((region) => (
                <Chip
                  key={region}
                  label={region}
                  color="primary"
                  variant="outlined"
                  sx={{ fontWeight: 600, borderRadius: 2 }}
                />
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                No regions are currently included in this division. Edit the division to add regions.
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Regional Offices Table */}
      <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
        <CardContent sx={{ p: 0 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, p: 2.5, pb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Business color="primary" /> Regional Offices ({offices.length})
          </Typography>
          <TableContainer component={Paper} elevation={0} sx={{ border: 'none' }}>
            <Table>
              <TableHead sx={{ bgcolor: (theme) => theme.palette.mode === 'light' ? '#f8fafc' : '#1e293b' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, width: '30%' }}>RO Name</TableCell>
                  <TableCell sx={{ fontWeight: 700, width: '25%' }}>Location</TableCell>
                  <TableCell sx={{ fontWeight: 700, width: '30%' }}>Regional Managers</TableCell>
                  <TableCell sx={{ fontWeight: 700, width: '15%' }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading && offices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                      <CircularProgress size={32} />
                    </TableCell>
                  </TableRow>
                ) : offices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                      <Business color="disabled" sx={{ fontSize: 48, mb: 1, display: 'block', mx: 'auto' }} />
                      <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600 }}>
                        No Regional Offices assigned to this division yet.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  offices.map((office) => (
                    <TableRow key={office.id} hover>
                      <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>
                        {office.name}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {office.location}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {office.regional_managers_details && office.regional_managers_details.length > 0 ? (
                            office.regional_managers_details.map((mgr) => (
                              <Chip
                                key={mgr.id}
                                label={`${mgr.first_name} ${mgr.last_name}`}
                                size="small"
                                color="secondary"
                                variant="outlined"
                                icon={<Person fontSize="inherit" />}
                                sx={{ fontWeight: 600 }}
                              />
                            ))
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              No managers assigned
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => handleEditOpen(office)} color="primary" sx={{ mr: 1 }}>
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDeleteOpen(office)} color="error">
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

      {/* RO Create Modal */}
      <Dialog open={createOpen} onClose={handleCreateClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>Add Regional Office</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Add a new Regional Office. The Location selection is limited to the regions included in the <strong>{division?.name}</strong> division.
          </Typography>

          {createError && <Alert severity="error" sx={{ mb: 2 }}>{createError}</Alert>}

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
            <TextField
              required
              fullWidth
              label="Regional Office Name"
              placeholder="e.g. Uttara Regional Office"
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
            />
            
            <Autocomplete
              id="create-ro-location"
              options={division?.included_regions || []}
              value={createForm.location || null}
              onChange={(event, newValue) => {
                setCreateForm({ ...createForm, location: newValue || '' });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  required
                  label="Location"
                  placeholder="Select a location from this division's regions..."
                />
              )}
            />

            <Autocomplete
              multiple
              id="create-ro-managers"
              options={managers}
              getOptionLabel={(option) => `${option.first_name} ${option.last_name} (${option.email})`}
              value={managers.filter((m) => createForm.regional_managers.includes(m.id))}
              onChange={(event, newValue) => {
                setCreateForm({ 
                  ...createForm, 
                  regional_managers: newValue.map((m) => m.id) 
                });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Regional Managers"
                  placeholder="Select regional managers..."
                />
              )}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleCreateClose} variant="outlined" sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={createSubmitting}
            onClick={handleCreateSubmit}
            sx={{
              borderRadius: 2,
              background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
              color: '#fff',
              px: 3,
              fontWeight: 700
            }}
          >
            {createSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* RO Edit Modal */}
      <Dialog open={editOpen} onClose={handleEditClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>Edit Regional Office</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Modify the details of this Regional Office. The Location selection is limited to the regions included in the <strong>{division?.name}</strong> division.
          </Typography>

          {editError && <Alert severity="error" sx={{ mb: 2 }}>{editError}</Alert>}

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
            <TextField
              required
              fullWidth
              label="Regional Office Name"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            />
            
            <Autocomplete
              id="edit-ro-location"
              options={division?.included_regions || []}
              value={editForm.location || null}
              onChange={(event, newValue) => {
                setEditForm({ ...editForm, location: newValue || '' });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  required
                  label="Location"
                  placeholder="Select a location from this division's regions..."
                />
              )}
            />

            <Autocomplete
              multiple
              id="edit-ro-managers"
              options={managers}
              getOptionLabel={(option) => `${option.first_name} ${option.last_name} (${option.email})`}
              value={managers.filter((m) => editForm.regional_managers.includes(m.id))}
              onChange={(event, newValue) => {
                setEditForm({ 
                  ...editForm, 
                  regional_managers: newValue.map((m) => m.id) 
                });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Regional Managers"
                  placeholder="Select regional managers..."
                />
              )}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleEditClose} variant="outlined" sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={editSubmitting}
            onClick={handleEditSubmit}
            sx={{
              borderRadius: 2,
              background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
              color: '#fff',
              px: 3,
              fontWeight: 700
            }}
          >
            {editSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* RO Delete Confirmation Modal */}
      <Dialog open={deleteOpen} onClose={handleDeleteClose} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Are you sure you want to delete the Regional Office <strong>{deleteObject?.name}</strong>? This action is permanent and cannot be undone.
          </Typography>
          {deleteError && <Alert severity="error" sx={{ mt: 2 }}>{deleteError}</Alert>}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleDeleteClose} variant="outlined" sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={deleteSubmitting}
            onClick={handleDeleteSubmit}
            sx={{ borderRadius: 2, fontWeight: 700 }}
          >
            {deleteSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DivisionDetail;
