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
  Tabs,
  Tab,
  Autocomplete
} from '@mui/material';
import { 
  Add, 
  Refresh, 
  Edit, 
  Delete, 
  Search, 
  Business, 
  Map,
  Visibility
} from '@mui/icons-material';
import { api } from '../context/AuthContext';
import axios from 'axios';

const RegionalOfficeManagement = () => {
  const navigate = useNavigate();
  const [divisions, setDivisions] = useState([]);
  const [districts, setDistricts] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [districtsLoading, setDistrictsLoading] = useState(false);
  const [error, setError] = useState('');

  // Search/Filters state
  const [searchName, setSearchName] = useState('');

  // Division Create Dialog state
  const [createDivOpen, setCreateDivOpen] = useState(false);
  const [createDivSubmitting, setCreateDivSubmitting] = useState(false);
  const [createDivError, setCreateDivError] = useState('');
  const [createDivForm, setCreateDivForm] = useState({
    name: '',
    included_regions: []
  });

  // Division Edit Dialog state
  const [editDivOpen, setEditDivOpen] = useState(false);
  const [editDivSubmitting, setEditDivSubmitting] = useState(false);
  const [editDivError, setEditDivError] = useState('');
  const [editDivObject, setEditDivObject] = useState(null);
  const [editDivForm, setEditDivForm] = useState({
    name: '',
    included_regions: []
  });

  // Division Delete Dialog state
  const [deleteDivOpen, setDeleteDivOpen] = useState(false);
  const [deleteDivSubmitting, setDeleteDivSubmitting] = useState(false);
  const [deleteDivError, setDeleteDivError] = useState('');
  const [deleteDivObject, setDeleteDivObject] = useState(null);

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const divisionsRes = await api.get('regional-offices/divisions/');
      setDivisions(divisionsRes.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch divisions.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch districts and upazilas from backend
  const fetchDistricts = async () => {
    setDistrictsLoading(true);
    try {
      const res = await api.get('regional-offices/divisions/locations/');
      if (Array.isArray(res.data)) {
        setDistricts(res.data);
      } else {
        throw new Error("Invalid response format from locations API");
      }
    } catch (err) {
      console.warn("Failed to fetch districts and upazilas from backend, using fallback list.", err);
      setDistricts([
        "Bagerhat", "Bandarban", "Barguna", "Barishal", "Bhola", "Bogra", "Brahmanbaria",
        "Chandpur", "Chattogram", "Chuadanga", "Comilla", "Cox's Bazar", "Dhaka",
        "Dinajpur", "Faridpur", "Feni", "Gaibandha", "Gazipur", "Gopalganj", "Habiganj",
        "Jamalpur", "Jessore", "Jhalokati", "Jhenaidah", "Joypurhat", "Khagrachhari",
        "Khulna", "Kishoreganj", "Kurigram", "Kushtia", "Lakshmipur", "Lalmonirhat",
        "Madaripur", "Magura", "Manikganj", "Meherpur", "Moulvibazar", "Munshiganj",
        "Mymensingh", "Naogaon", "Narail", "Narayanganj", "Narsingdi", "Natore",
        "Nawabganj", "Netrokona", "Nilphamari", "Noakhali", "Pabna", "Panchagarh",
        "Patuakhali", "Pirojpur", "Rajbari", "Rajshahi", "Rangamati", "Rangpur",
        "Satkhira", "Shariatpur", "Sherpur", "Sirajganj", "Sunamganj", "Sylhet",
        "Tangail", "Thakurgaon"
      ]);
    } finally {
      setDistrictsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchDistricts();
  }, []);

  // Filtered lists
  const filteredDivisions = divisions.filter(div => {
    return div.name.toLowerCase().includes(searchName.toLowerCase());
  });

  // Division Create Handlers
  const handleCreateDivOpen = () => {
    setCreateDivForm({
      name: '',
      included_regions: []
    });
    setCreateDivError('');
    setCreateDivOpen(true);
  };

  const handleCreateDivClose = () => setCreateDivOpen(false);

  const handleCreateDivSubmit = async (e) => {
    e.preventDefault();
    if (!createDivForm.name) {
      setCreateDivError('Division Name is required.');
      return;
    }
    setCreateDivError('');
    setCreateDivSubmitting(true);
    try {
      await api.post('regional-offices/divisions/', createDivForm);
      setCreateDivOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      setCreateDivError(err.response?.data?.name?.[0] || err.response?.data?.detail || 'Failed to create division.');
    } finally {
      setCreateDivSubmitting(false);
    }
  };

  // Division Edit Handlers
  const handleEditDivOpen = (div) => {
    setEditDivObject(div);
    setEditDivForm({
      name: div.name,
      included_regions: div.included_regions || []
    });
    setEditDivError('');
    setEditDivOpen(true);
  };

  const handleEditDivClose = () => setEditDivOpen(false);

  const handleEditDivSubmit = async (e) => {
    e.preventDefault();
    if (!editDivForm.name) {
      setEditDivError('Division Name is required.');
      return;
    }
    setEditDivError('');
    setEditDivSubmitting(true);
    try {
      await api.put(`regional-offices/divisions/${editDivObject.id}/`, editDivForm);
      setEditDivOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      setEditDivError(err.response?.data?.name?.[0] || err.response?.data?.detail || 'Failed to update division.');
    } finally {
      setEditDivSubmitting(false);
    }
  };

  // Division Delete Handlers
  const handleDeleteDivOpen = (div) => {
    setDeleteDivObject(div);
    setDeleteDivError('');
    setDeleteDivOpen(true);
  };

  const handleDeleteDivClose = () => setDeleteDivOpen(false);

  const handleDeleteDivSubmit = async () => {
    setDeleteDivError('');
    setDeleteDivSubmitting(true);
    try {
      await api.delete(`regional-offices/divisions/${deleteDivObject.id}/`);
      setDeleteDivOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      setDeleteDivError(err.response?.data?.detail || 'Failed to delete division. Ensure no regional offices are linked to it.');
    } finally {
      setDeleteDivSubmitting(false);
    }
  };

  return (
    <Box>
      {/* Header Panel */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 1 }}>
            <Typography color="text.secondary" sx={{ fontWeight: 600 }}>Administration</Typography>
            <Typography color="text.primary" sx={{ fontWeight: 600 }}>Divisions & Regional Office</Typography>
          </Breadcrumbs>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.5px' }}>
            Divisions & Regional Offices
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreateDivOpen}
          sx={{
            background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
            color: '#fff',
            fontWeight: 700,
            borderRadius: 2,
            px: 3
          }}
        >
          Add Division
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Filters Card */}
      <Card sx={{ mb: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
        <CardContent sx={{ p: 2.5 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={9}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by Division Name..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                InputProps={{
                  startAdornment: <Search color="action" fontSize="small" sx={{ mr: 1 }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={3} sx={{ display: 'flex', gap: 1.5, justifyContent: { md: 'flex-end' } }}>
              <IconButton onClick={fetchData} disabled={loading} color="primary" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Refresh />
              </IconButton>
              {searchName && (
                <Button 
                  variant="text" 
                  color="inherit" 
                  onClick={() => { setSearchName(''); }}
                  sx={{ fontWeight: 700 }}
                >
                  Reset
                </Button>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Divisions Table */}
      <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
        <CardContent sx={{ p: 0 }}>
          <TableContainer component={Paper} elevation={0} sx={{ border: 'none' }}>
            <Table>
              <TableHead sx={{ bgcolor: (theme) => theme.palette.mode === 'light' ? '#f8fafc' : '#1e293b' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, width: '30%' }}>Division Name</TableCell>
                  <TableCell sx={{ fontWeight: 700, width: '50%' }}>Included Regions (Districts & Upazilas)</TableCell>
                  <TableCell sx={{ fontWeight: 700, width: '20%' }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 8 }}>
                      <CircularProgress size={32} />
                    </TableCell>
                  </TableRow>
                ) : filteredDivisions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 8 }}>
                      <Map color="disabled" sx={{ fontSize: 48, mb: 1, display: 'block', mx: 'auto' }} />
                      <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600 }}>
                        No Divisions Found.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDivisions.map((div) => (
                    <TableRow key={div.id} hover>
                      <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>
                        {div.name}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {div.included_regions && div.included_regions.length > 0 ? (
                            div.included_regions.map((reg) => (
                              <Chip
                                key={reg}
                                label={reg}
                                size="small"
                                color="info"
                                variant="outlined"
                                sx={{ fontWeight: 600 }}
                              />
                            ))
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              No regions assigned
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton 
                          size="small" 
                          onClick={() => navigate(`/divisions/${div.id}`)} 
                          color="info" 
                          sx={{ mr: 1 }}
                          title="View Details"
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleEditDivOpen(div)} color="primary" sx={{ mr: 1 }}>
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDeleteDivOpen(div)} color="error">
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

      {/* Division Create Modal */}
      <Dialog open={createDivOpen} onClose={handleCreateDivClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>Create Division</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Add a new Overhead Division and define its included regions. Search and select districts and upazilas fetched dynamically from `bdapis.com`.
          </Typography>

          {createDivError && <Alert severity="error" sx={{ mb: 2 }}>{createDivError}</Alert>}

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
              label="Division Name"
              placeholder="e.g. Dhaka Division"
              value={createDivForm.name}
              onChange={(e) => setCreateDivForm({ ...createDivForm, name: e.target.value })}
            />
            <Autocomplete
              multiple
              id="create-division-included-regions"
              options={districts}
              value={createDivForm.included_regions}
              onChange={(event, newValue) => {
                setCreateDivForm({ ...createDivForm, included_regions: newValue });
              }}
              loading={districtsLoading}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Included Regions (Districts & Upazilas)"
                  placeholder="Search and select locations..."
                />
              )}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleCreateDivClose} variant="outlined" sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={createDivSubmitting}
            onClick={handleCreateDivSubmit}
            sx={{
              borderRadius: 2,
              background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
              color: '#fff',
              px: 3,
              fontWeight: 700
            }}
          >
            {createDivSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Division Edit Modal */}
      <Dialog open={editDivOpen} onClose={handleEditDivClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>Edit Division</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Update the division name and select the districts/upazilas assigned to this division.
          </Typography>

          {editDivError && <Alert severity="error" sx={{ mb: 2 }}>{editDivError}</Alert>}

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
              label="Division Name"
              value={editDivForm.name}
              onChange={(e) => setEditDivForm({ ...editDivForm, name: e.target.value })}
            />
            <Autocomplete
              multiple
              id="edit-division-included-regions"
              options={districts}
              value={editDivForm.included_regions}
              onChange={(event, newValue) => {
                setEditDivForm({ ...editDivForm, included_regions: newValue });
              }}
              loading={districtsLoading}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Included Regions (Districts & Upazilas)"
                  placeholder="Search and select locations..."
                />
              )}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleEditDivClose} variant="outlined" sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={editDivSubmitting}
            onClick={handleEditDivSubmit}
            sx={{
              borderRadius: 2,
              background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
              color: '#fff',
              px: 3,
              fontWeight: 700
            }}
          >
            {editDivSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Division Delete Confirmation Modal */}
      <Dialog open={deleteDivOpen} onClose={handleDeleteDivClose} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Are you sure you want to delete the division <strong>{deleteDivObject?.name}</strong>? This action is permanent and cannot be undone.
          </Typography>
          {deleteDivError && <Alert severity="error" sx={{ mt: 2 }}>{deleteDivError}</Alert>}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleDeleteDivClose} variant="outlined" sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={deleteDivSubmitting}
            onClick={handleDeleteDivSubmit}
            sx={{ borderRadius: 2, fontWeight: 700 }}
          >
            {deleteDivSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RegionalOfficeManagement;
