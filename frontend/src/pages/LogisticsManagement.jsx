import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Button,
  Card,
  CardContent,
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
  Checkbox,
  FormControlLabel,
  FormGroup,
  Divider,
  Tooltip,
  Paper,
  Stack,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  Add,
  Refresh,
  Edit,
  Delete,
  Wifi,
  Tv,
  Restaurant,
  DirectionsBus,
  AirportShuttle,
  DirectionsCar,
  LaptopMac,
  HomeWork,
  BorderColor,
  Inventory2,
  CheckCircle,
  Cancel
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { api } from '../context/AuthContext';

const MOCK_LOCATION_DATA = {
  divisions: ["Dhaka", "Chattogram", "Sylhet", "Rajshahi", "Khulna", "Barishal", "Rangpur", "Mymensingh"],
  divisionDetails: {
    dhaka: [
      { district: "Gazipur", upazilla: ["Kaliakair", "Kaliganj", "Kapasia", "Sreepur", "Gazipur Sadar"] },
      { district: "Dhaka", upazilla: ["Dhamrai", "Dohar", "Keraniganj", "Nawabganj", "Savar"] }
    ],
    chattogram: [
      { district: "Chattogram", upazilla: ["Anwara", "Banshkhali", "Boalkhali", "Chandanaish", "Hathazari", "Mirsarai", "Raozan", "Sandwip"] },
      { district: "Cox's Bazar", upazilla: ["Chakaria", "Cox's Bazar Sadar", "Kutubdia", "Maheshkhali", "Ramu", "Teknaf", "Ukhiya"] }
    ],
    sylhet: [
      { district: "Sylhet", upazilla: ["Balaganj", "Beanibazar", "Bishwanath", "Fenchuganj", "Golapganj", "Gowainghat", "Kanaighat", "Sylhet Sadar"] }
    ],
    rajshahi: [
      { district: "Rajshahi", upazilla: ["Bagha", "Bagmara", "Charghat", "Durgapur", "Godagari", "Mohanpur", "Paba", "Puthia", "Tanore"] }
    ]
  }
};

// Facilities rendering helper
const FacilityBadge = ({ active, label, icon: Icon }) => (
  <Tooltip title={`${label}: ${active ? 'Available' : 'Not Available'}`}>
    <Chip
      icon={<Icon sx={{ fontSize: '1rem !important' }} />}
      label={label}
      size="small"
      color={active ? "success" : "default"}
      variant={active ? "filled" : "outlined"}
      sx={{
        fontWeight: 600,
        fontSize: '0.75rem',
        opacity: active ? 1 : 0.45,
        borderStyle: active ? 'solid' : 'dashed',
        '& .MuiChip-icon': {
          color: active ? 'inherit' : 'text.disabled'
        }
      }}
    />
  </Tooltip>
);

const LogisticsManagement = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [items, setItems] = useState([]);
  const [accommodations, setAccommodations] = useState([]);
  const [transports, setTransports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dialog States
  const [dialogType, setDialogType] = useState(null); // 'item', 'accommodation', 'transport'
  const [isEdit, setIsEdit] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // bdapis.com state
  const [bdDivisions, setBdDivisions] = useState([]);
  const [bdDistricts, setBdDistricts] = useState([]);
  const [bdSubdistricts, setBdSubdistricts] = useState([]);
  const [locationLoading, setLocationLoading] = useState(false);

  // Cascading Selection state
  const [selectedDiv, setSelectedDiv] = useState('');
  const [selectedDist, setSelectedDist] = useState('');
  const [selectedSub, setSelectedSub] = useState('');

  // --- LOCATION FETCHING MECHANICS (bdapis.com with local mock fallback) ---
  const fetchDivisions = async () => {
    try {
      const res = await axios.get('https://bdapis.com/api/v1.2/divisions');
      if (res.data && res.data.data) {
        setBdDivisions(res.data.data.map(d => d.division));
      } else {
        setBdDivisions(MOCK_LOCATION_DATA.divisions);
      }
    } catch (err) {
      console.warn("bdapis.com failed, using local mock divisions fallback", err);
      setBdDivisions(MOCK_LOCATION_DATA.divisions);
    }
  };

  const fetchDistrictsForDivision = async (divisionName) => {
    if (!divisionName) return;
    setLocationLoading(true);
    try {
      const res = await axios.get(`https://bdapis.com/api/v1.2/division/${divisionName.toLowerCase()}`);
      if (res.data && res.data.data) {
        setBdDistricts(res.data.data);
      } else {
        setBdDistricts(MOCK_LOCATION_DATA.divisionDetails[divisionName.toLowerCase()] || []);
      }
    } catch (err) {
      console.warn(`bdapis.com failed for division ${divisionName}, using local mock districts fallback`, err);
      setBdDistricts(MOCK_LOCATION_DATA.divisionDetails[divisionName.toLowerCase()] || []);
    } finally {
      setLocationLoading(false);
    }
  };

  const handleDivisionChange = async (division) => {
    setSelectedDiv(division);
    setSelectedDist('');
    setSelectedSub('');
    setBdDistricts([]);
    setBdSubdistricts([]);
    await fetchDistrictsForDivision(division);
  };

  const handleDistrictChange = (districtName) => {
    setSelectedDist(districtName);
    setSelectedSub('');
    const distDetail = bdDistricts.find(d => d.district === districtName);
    if (distDetail && distDetail.upazilla) {
      setBdSubdistricts(distDetail.upazilla);
    } else {
      setBdSubdistricts([]);
    }
  };

  // Unified Form States
  const [itemForm, setItemForm] = useState({ name: '', quantity: 1, unit_cost: '' });
  const [accommodationForm, setAccommodationForm] = useState({
    name: '',
    type: 'training_center',
    room_type: 'single',
    room_unit_cost: '',
    classroom_type: 'std_classroom',
    classroom_unit_cost: '',
    has_wifi: false,
    has_projector: false,
    has_whiteboard: false,
    has_dining: false
  });
  const [transportForm, setTransportForm] = useState({
    name: '',
    type: 'bus',
    capacity: 40,
    unit_cost: ''
  });

  // Delete State
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'item'|'accommodation'|'transport', id, name }
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [itemsRes, accRes, transRes] = await Promise.all([
        api.get('logistics/items/'),
        api.get('logistics/accommodations/'),
        api.get('logistics/transports/')
      ]);
      setItems(itemsRes.data);
      setAccommodations(accRes.data);
      setTransports(transRes.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch logistics registers. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchDivisions();
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // --- Dialogue Open Handlers ---
  const handleOpenAdd = () => {
    setIsEdit(false);
    setSelectedRecord(null);
    setFormError('');

    setSelectedDiv('');
    setSelectedDist('');
    setSelectedSub('');
    setBdDistricts([]);
    setBdSubdistricts([]);

    if (activeTab === 0 || activeTab === 1) {
      setItemForm({
        name: '',
        quantity: 1,
        unit_cost: ''
      });
      setDialogType('item');
    } else if (activeTab === 2) {
      setAccommodationForm({
        name: '',
        type: 'training_center',
        room_type: 'single',
        room_unit_cost: '',
        classroom_type: 'std_classroom',
        classroom_unit_cost: '',
        has_wifi: false,
        has_projector: false,
        has_whiteboard: false,
        has_dining: false
      });
      setDialogType('accommodation');
    } else if (activeTab === 3) {
      setTransportForm({
        name: '',
        type: 'bus',
        capacity: 40,
        unit_cost: ''
      });
      setDialogType('transport');
    }
  };

  const handleOpenEdit = (record, type) => {
    setIsEdit(true);
    setSelectedRecord(record);
    setFormError('');

    if (type === 'item') {
      setItemForm({
        name: record.name,
        quantity: record.quantity,
        unit_cost: record.unit_cost || ''
      });
      setDialogType('item');
    } else if (type === 'accommodation') {
      setAccommodationForm({
        name: record.name,
        type: record.type,
        room_type: record.room_type,
        room_unit_cost: record.room_unit_cost,
        classroom_type: record.classroom_type,
        classroom_unit_cost: record.classroom_unit_cost,
        has_wifi: record.has_wifi,
        has_projector: record.has_projector,
        has_whiteboard: record.has_whiteboard,
        has_dining: record.has_dining
      });

      // Parse location parts
      const parts = (record.location || '').split(' > ');
      const div = parts[0] || '';
      const dist = parts[1] || '';
      const sub = parts[2] || '';

      setSelectedDiv(div);
      setDialogType('accommodation');

      if (div) {
        setLocationLoading(true);
        (async () => {
          try {
            let districtData = [];
            const res = await axios.get(`https://bdapis.com/api/v1.2/division/${div.toLowerCase()}`);
            if (res.data && res.data.data) {
              districtData = res.data.data;
            } else {
              districtData = MOCK_LOCATION_DATA.divisionDetails[div.toLowerCase()] || [];
            }
            setBdDistricts(districtData);
            setSelectedDist(dist);

            // Pre-populate upazillas
            const distDetail = districtData.find(d => d.district === dist);
            if (distDetail && distDetail.upazilla) {
              setBdSubdistricts(distDetail.upazilla);
              setSelectedSub(sub);
            } else {
              setBdSubdistricts([]);
              setSelectedSub('');
            }
          } catch (err) {
            console.warn("Failed fetching districts on edit, loading mock fallback", err);
            const fallbackDistricts = MOCK_LOCATION_DATA.divisionDetails[div.toLowerCase()] || [];
            setBdDistricts(fallbackDistricts);
            setSelectedDist(dist);

            const distDetail = fallbackDistricts.find(d => d.district === dist);
            if (distDetail && distDetail.upazilla) {
              setBdSubdistricts(distDetail.upazilla);
              setSelectedSub(sub);
            } else {
              setBdSubdistricts([]);
              setSelectedSub('');
            }
          } finally {
            setLocationLoading(false);
          }
        })();
      } else {
        setSelectedDist('');
        setSelectedSub('');
        setBdDistricts([]);
        setBdSubdistricts([]);
      }
    } else if (type === 'transport') {
      setTransportForm({
        name: record.name,
        type: record.type,
        capacity: record.capacity,
        unit_cost: record.unit_cost
      });
      setDialogType('transport');
    }
  };

  const handleCloseDialog = () => {
    setDialogType(null);
    setSelectedRecord(null);
  };

  // --- Deletion Handlers ---
  const handleOpenDelete = (id, name, type) => {
    setDeleteTarget({ id, name, type });
    setDeleteOpen(true);
  };

  const handleCloseDelete = () => {
    setDeleteOpen(false);
    setDeleteTarget(null);
  };

  const handleDeleteSubmit = async () => {
    if (!deleteTarget) return;
    setDeleteSubmitting(true);
    try {
      let endpoint = '';
      if (deleteTarget.type === 'item') {
        endpoint = `logistics/items/${deleteTarget.id}/`;
      } else if (deleteTarget.type === 'accommodation') {
        endpoint = `logistics/accommodations/${deleteTarget.id}/`;
      } else if (deleteTarget.type === 'transport') {
        endpoint = `logistics/transports/${deleteTarget.id}/`;
      }

      await api.delete(endpoint);
      handleCloseDelete();
      fetchData();
    } catch (err) {
      console.error(err);
      setError('Failed to delete resource. Please try again.');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  // --- Submission Handlers ---
  const handleItemSubmit = async (e) => {
    e.preventDefault();
    if (!itemForm.name || itemForm.quantity < 0 || itemForm.unit_cost === '') {
      setFormError('Please fill in all fields with valid numbers.');
      return;
    }

    const payload = {
      name: itemForm.name,
      category: activeTab === 0 ? 'stationary' : 'it',
      quantity: parseInt(itemForm.quantity, 10),
      unit_cost: parseFloat(itemForm.unit_cost)
    };

    setSubmitting(true);
    setFormError('');
    try {
      if (isEdit) {
        await api.put(`logistics/items/${selectedRecord.id}/`, payload);
      } else {
        await api.post('logistics/items/', payload);
      }
      handleCloseDialog();
      fetchData();
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.detail || 'An error occurred while saving the item.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAccommodationSubmit = async (e) => {
    e.preventDefault();
    if (!accommodationForm.name || accommodationForm.room_unit_cost === '' || accommodationForm.classroom_unit_cost === '' || !selectedDiv || !selectedDist || !selectedSub) {
      setFormError('Please fill in all fields, including location selections.');
      return;
    }

    const locationString = `${selectedDiv} > ${selectedDist} > ${selectedSub}`;
    const payload = {
      ...accommodationForm,
      location: locationString,
      room_unit_cost: parseFloat(accommodationForm.room_unit_cost),
      classroom_unit_cost: parseFloat(accommodationForm.classroom_unit_cost)
    };

    setSubmitting(true);
    setFormError('');
    try {
      if (isEdit) {
        await api.put(`logistics/accommodations/${selectedRecord.id}/`, payload);
      } else {
        await api.post('logistics/accommodations/', payload);
      }
      handleCloseDialog();
      fetchData();
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.detail || 'An error occurred while saving accommodation properties.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransportSubmit = async (e) => {
    e.preventDefault();
    if (!transportForm.name || transportForm.capacity <= 0 || transportForm.unit_cost === '') {
      setFormError('Please fill in all fields with valid transportation parameters.');
      return;
    }

    const payload = {
      ...transportForm,
      capacity: parseInt(transportForm.capacity, 10),
      unit_cost: parseFloat(transportForm.unit_cost)
    };

    setSubmitting(true);
    setFormError('');
    try {
      if (isEdit) {
        await api.put(`logistics/transports/${selectedRecord.id}/`, payload);
      } else {
        await api.post('logistics/transports/', payload);
      }
      handleCloseDialog();
      fetchData();
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.detail || 'An error occurred while saving transportation assets.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter lists based on categories
  const stationaryItems = items.filter(i => i.category === 'stationary');
  const itItems = items.filter(i => i.category === 'it');

  // Helper mapping transport types
  const getTransportIcon = (type) => {
    switch (type) {
      case 'bus': return <DirectionsBus />;
      case 'microbus': return <AirportShuttle />;
      default: return <DirectionsCar />;
    }
  };

  return (
    <Box>
      {/* Top Banner Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5, letterSpacing: '-0.5px' }}>
            Logistics Onboarding
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage system registers for Stationary, IT Assets, Training Accommodations, and Transports.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <IconButton onClick={fetchData} disabled={loading} color="primary" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Refresh />
          </IconButton>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleOpenAdd}
            disabled={loading}
            sx={{
              background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
              fontWeight: 700,
              borderRadius: 2,
              px: 2.5
            }}
          >
            {activeTab === 0 && 'Onboard Stationary'}
            {activeTab === 1 && 'Onboard IT Item'}
            {activeTab === 2 && 'Onboard Accommodation'}
            {activeTab === 3 && 'Onboard Transport'}
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* Tabs Layout */}
      <Paper elevation={0} sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'transparent', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              fontWeight: 700,
              fontSize: '0.95rem',
              minWidth: 120,
              textTransform: 'none',
              py: 2
            }
          }}
        >
          <Tab icon={<Inventory2 sx={{ mr: 1, fontSize: '1.2rem' }} />} iconPosition="start" label="Stationary" />
          <Tab icon={<LaptopMac sx={{ mr: 1, fontSize: '1.2rem' }} />} iconPosition="start" label="IT Logistics" />
          <Tab icon={<HomeWork sx={{ mr: 1, fontSize: '1.2rem' }} />} iconPosition="start" label="Accommodation" />
          <Tab icon={<DirectionsBus sx={{ mr: 1, fontSize: '1.2rem' }} />} iconPosition="start" label="Transport" />
        </Tabs>
      </Paper>

      {/* Loading state indicator */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
          >
            {/* TAB CONTENT: STATIONARY */}
            {activeTab === 0 && (
              <Box>
                {stationaryItems.length === 0 ? (
                  <Paper variant="outlined" sx={{ py: 6, textAlign: 'center', borderStyle: 'dashed', borderRadius: 3 }}>
                    <Inventory2 sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.35, mb: 1.5 }} />
                    <Typography variant="subtitle1" fontWeight={600} color="text.secondary">
                      No Stationary Onboarded Yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Get started by onboarding stationary items.
                    </Typography>
                    <Button variant="outlined" startIcon={<Add />} onClick={handleOpenAdd}>
                      Onboard Stationary
                    </Button>
                  </Paper>
                ) : (
                  <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
                    <Table>
                      <TableHead sx={{ bgcolor: 'action.hover' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>Item Name</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Available Qty</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Unit Cost</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, pr: 3 }}>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {stationaryItems.map((item) => (
                          <TableRow key={item.id} hover>
                            <TableCell sx={{ fontWeight: 600 }}>{item.name}</TableCell>
                            <TableCell>{item.quantity} Units</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>
                              ${parseFloat(item.unit_cost || 0).toFixed(2)}
                            </TableCell>
                            <TableCell align="right" sx={{ pr: 2 }}>
                              <IconButton size="small" onClick={() => handleOpenEdit(item, 'item')} color="primary">
                                <Edit fontSize="small" />
                              </IconButton>
                              <IconButton size="small" onClick={() => handleOpenDelete(item.id, item.name, 'item')} color="error">
                                <Delete fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            )}

            {/* TAB CONTENT: IT LOGISTICS */}
            {activeTab === 1 && (
              <Box>
                {itItems.length === 0 ? (
                  <Paper variant="outlined" sx={{ py: 6, textAlign: 'center', borderStyle: 'dashed', borderRadius: 3 }}>
                    <LaptopMac sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.35, mb: 1.5 }} />
                    <Typography variant="subtitle1" fontWeight={600} color="text.secondary">
                      No IT Logistics Onboarded Yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Get started by onboarding IT items.
                    </Typography>
                    <Button variant="outlined" startIcon={<Add />} onClick={handleOpenAdd}>
                      Onboard IT Item
                    </Button>
                  </Paper>
                ) : (
                  <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
                    <Table>
                      <TableHead sx={{ bgcolor: 'action.hover' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>Item Name</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Available Qty</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Unit Cost</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, pr: 3 }}>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {itItems.map((item) => (
                          <TableRow key={item.id} hover>
                            <TableCell sx={{ fontWeight: 600 }}>{item.name}</TableCell>
                            <TableCell>{item.quantity} Units</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>
                              ${parseFloat(item.unit_cost || 0).toFixed(2)}
                            </TableCell>
                            <TableCell align="right" sx={{ pr: 2 }}>
                              <IconButton size="small" onClick={() => handleOpenEdit(item, 'item')} color="primary">
                                <Edit fontSize="small" />
                              </IconButton>
                              <IconButton size="small" onClick={() => handleOpenDelete(item.id, item.name, 'item')} color="error">
                                <Delete fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            )}

            {/* TAB CONTENT: ACCOMMODATION */}
            {activeTab === 2 && (
              <Box>
                {accommodations.length === 0 ? (
                  <Paper variant="outlined" sx={{ py: 6, textAlign: 'center', borderStyle: 'dashed', borderRadius: 3 }}>
                    <HomeWork sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.35, mb: 1.5 }} />
                    <Typography variant="subtitle1" fontWeight={600} color="text.secondary">
                      No Accommodations Onboarded Yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Register hotel partnerships or dedicated training centers.
                    </Typography>
                    <Button variant="outlined" startIcon={<Add />} onClick={handleOpenAdd}>
                      Onboard Accommodation
                    </Button>
                  </Paper>
                ) : (
                  <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
                    <Table>
                      <TableHead sx={{ bgcolor: 'action.hover' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>Property Name</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Location</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Room Config</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Classroom Config</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Facilities</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, pr: 3 }}>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {accommodations.map((acc) => (
                          <TableRow key={acc.id} hover>
                            <TableCell sx={{ fontWeight: 600 }}>{acc.name}</TableCell>
                            <TableCell sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
                              {acc.location || 'N/A'}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={acc.type === 'training_center' ? 'Training Center' : 'Hotel'}
                                size="small"
                                color={acc.type === 'training_center' ? 'info' : 'secondary'}
                                sx={{ fontWeight: 700, height: 22 }}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {acc.room_type === 'suite' ? 'Suite' : acc.room_type === 'single' ? 'Single' : 'Twin Share'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                ${parseFloat(acc.room_unit_cost || 0).toFixed(2)} / night
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {acc.classroom_type === 'conference_room' ? 'Conference Room' : 'Std Classroom'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                ${parseFloat(acc.classroom_unit_cost || 0).toFixed(2)} / day
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Stack direction="row" spacing={0.5} flexWrap="wrap">
                                <FacilityBadge active={acc.has_wifi} label="WiFi" icon={Wifi} />
                                <FacilityBadge active={acc.has_projector} label="Projector" icon={Tv} />
                                <FacilityBadge active={acc.has_whiteboard} label="Whiteboard" icon={BorderColor} />
                                <FacilityBadge active={acc.has_dining} label="Dining" icon={Restaurant} />
                              </Stack>
                            </TableCell>
                            <TableCell align="right" sx={{ pr: 2 }}>
                              <IconButton size="small" onClick={() => handleOpenEdit(acc, 'accommodation')} color="primary">
                                <Edit fontSize="small" />
                              </IconButton>
                              <IconButton size="small" onClick={() => handleOpenDelete(acc.id, acc.name, 'accommodation')} color="error">
                                <Delete fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            )}

            {/* TAB CONTENT: TRANSPORT */}
            {activeTab === 3 && (
              <Box>
                {transports.length === 0 ? (
                  <Paper variant="outlined" sx={{ py: 6, textAlign: 'center', borderStyle: 'dashed', borderRadius: 3 }}>
                    <DirectionsBus sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.35, mb: 1.5 }} />
                    <Typography variant="subtitle1" fontWeight={600} color="text.secondary">
                      No Transport Assets Onboarded Yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Register transport vehicles like Coasters, Mini Buses, or microcars.
                    </Typography>
                    <Button variant="outlined" startIcon={<Add />} onClick={handleOpenAdd}>
                      Onboard Transport
                    </Button>
                  </Paper>
                ) : (
                  <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
                    <Table>
                      <TableHead sx={{ bgcolor: 'action.hover' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>Vehicle Name</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Max Capacity</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Rental Cost</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, pr: 3 }}>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {transports.map((trans) => (
                          <TableRow key={trans.id} hover>
                            <TableCell sx={{ fontWeight: 600 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {getTransportIcon(trans.type)}
                                {trans.name}
                              </Box>
                            </TableCell>
                            <TableCell sx={{ textTransform: 'capitalize' }}>{trans.type}</TableCell>
                            <TableCell>{trans.capacity} Seats</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>
                              ${parseFloat(trans.unit_cost || 0).toFixed(2)}
                            </TableCell>
                            <TableCell align="right" sx={{ pr: 2 }}>
                              <IconButton size="small" onClick={() => handleOpenEdit(trans, 'transport')} color="primary">
                                <Edit fontSize="small" />
                              </IconButton>
                              <IconButton size="small" onClick={() => handleOpenDelete(trans.id, trans.name, 'transport')} color="error">
                                <Delete fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* --- ADD / EDIT ITEM DIALOG (Stationary & IT) --- */}
      <Dialog open={dialogType === 'item'} onClose={handleCloseDialog} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          {isEdit ? 'Edit Asset Parameters' : activeTab === 0 ? 'Onboard Stationary Item' : 'Onboard IT Logistics Asset'}
        </DialogTitle>
        <Box component="form" onSubmit={handleItemSubmit}>
          <DialogContent sx={{ pt: 1 }}>
            {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
            <Stack spacing={2.5}>
              <TextField
                label="Item Name"
                variant="outlined"
                fullWidth
                required
                value={itemForm.name}
                onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                placeholder={activeTab === 0 ? "e.g. Whiteboard Markers" : "e.g. Core i7 Laptop"}
              />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    label="Available Quantity"
                    type="number"
                    variant="outlined"
                    fullWidth
                    required
                    value={itemForm.quantity}
                    onChange={(e) => setItemForm({ ...itemForm, quantity: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                    inputProps={{ min: 0 }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Unit Cost ($)"
                    type="number"
                    variant="outlined"
                    fullWidth
                    required
                    value={itemForm.unit_cost}
                    onChange={(e) => setItemForm({ ...itemForm, unit_cost: e.target.value })}
                    inputProps={{ step: "0.01", min: 0 }}
                  />
                </Grid>
              </Grid>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={handleCloseDialog} color="inherit">Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              sx={{
                background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                fontWeight: 700
              }}
            >
              {submitting ? 'Saving...' : 'Save Register'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* --- ADD / EDIT ACCOMMODATION DIALOG --- */}
      <Dialog open={dialogType === 'accommodation'} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          {isEdit ? 'Edit Accommodation Settings' : 'Onboard New Accommodation Register'}
        </DialogTitle>
        <Box component="form" onSubmit={handleAccommodationSubmit}>
          <DialogContent sx={{ pt: 1 }}>
            {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
            <Stack spacing={2.5}>
              <TextField
                label="Property / Facility Name"
                variant="outlined"
                fullWidth
                required
                value={accommodationForm.name}
                onChange={(e) => setAccommodationForm({ ...accommodationForm, name: e.target.value })}
                placeholder="e.g. BRAC Center Inn"
              />

              <FormControl fullWidth>
                <InputLabel>Facility Type</InputLabel>
                <Select
                  value={accommodationForm.type}
                  label="Facility Type"
                  onChange={(e) => setAccommodationForm({ ...accommodationForm, type: e.target.value })}
                >
                  <MenuItem value="training_center">Training Center</MenuItem>
                  <MenuItem value="hotel">Hotel</MenuItem>
                </Select>
              </FormControl>

              <Divider sx={{ my: 0.5 }}>Location Parameters</Divider>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth required>
                    <InputLabel id="acc-division-label">Division</InputLabel>
                    <Select
                      labelId="acc-division-label"
                      value={selectedDiv}
                      label="Division"
                      onChange={(e) => handleDivisionChange(e.target.value)}
                    >
                      {bdDivisions.map((div) => (
                        <MenuItem key={div} value={div}>{div}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth required disabled={!selectedDiv || locationLoading}>
                    <InputLabel id="acc-district-label">District</InputLabel>
                    <Select
                      labelId="acc-district-label"
                      value={selectedDist}
                      label="District"
                      onChange={(e) => handleDistrictChange(e.target.value)}
                    >
                      {bdDistricts.map((distObj) => (
                        <MenuItem key={distObj.district} value={distObj.district}>{distObj.district}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth required disabled={!selectedDist}>
                    <InputLabel id="acc-subdistrict-label">Upazila / Subdistrict</InputLabel>
                    <Select
                      labelId="acc-subdistrict-label"
                      value={selectedSub}
                      label="Upazila / Subdistrict"
                      onChange={(e) => setSelectedSub(e.target.value)}
                    >
                      {bdSubdistricts.map((subName) => (
                        <MenuItem key={subName} value={subName}>{subName}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Divider sx={{ my: 1 }}>Room Parameters</Divider>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>Room Accommodation Type</InputLabel>
                    <Select
                      value={accommodationForm.room_type}
                      label="Room Accommodation Type"
                      onChange={(e) => setAccommodationForm({ ...accommodationForm, room_type: e.target.value })}
                    >
                      <MenuItem value="suite">Suite</MenuItem>
                      <MenuItem value="single">Single Accommodation</MenuItem>
                      <MenuItem value="twin_share">Twin Share</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Room Unit Cost ($ / night)"
                    type="number"
                    variant="outlined"
                    fullWidth
                    required
                    value={accommodationForm.room_unit_cost}
                    onChange={(e) => setAccommodationForm({ ...accommodationForm, room_unit_cost: e.target.value })}
                    inputProps={{ step: "0.01", min: 0 }}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 1 }}>Classroom Parameters</Divider>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>Classroom Type</InputLabel>
                    <Select
                      value={accommodationForm.classroom_type}
                      label="Classroom Type"
                      onChange={(e) => setAccommodationForm({ ...accommodationForm, classroom_type: e.target.value })}
                    >
                      <MenuItem value="conference_room">Conference Room</MenuItem>
                      <MenuItem value="std_classroom">Standard Classroom</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Classroom Cost ($ / day)"
                    type="number"
                    variant="outlined"
                    fullWidth
                    required
                    value={accommodationForm.classroom_unit_cost}
                    onChange={(e) => setAccommodationForm({ ...accommodationForm, classroom_unit_cost: e.target.value })}
                    inputProps={{ step: "0.01", min: 0 }}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 1 }}>Utility Facilities Available</Divider>
              <FormGroup row sx={{ justifyContent: 'space-around' }}>
                <FormControlLabel
                  control={<Checkbox checked={accommodationForm.has_wifi} onChange={(e) => setAccommodationForm({ ...accommodationForm, has_wifi: e.target.checked })} />}
                  label="WiFi"
                />
                <FormControlLabel
                  control={<Checkbox checked={accommodationForm.has_projector} onChange={(e) => setAccommodationForm({ ...accommodationForm, has_projector: e.target.checked })} />}
                  label="Projector"
                />
                <FormControlLabel
                  control={<Checkbox checked={accommodationForm.has_whiteboard} onChange={(e) => setAccommodationForm({ ...accommodationForm, has_whiteboard: e.target.checked })} />}
                  label="Whiteboard"
                />
                <FormControlLabel
                  control={<Checkbox checked={accommodationForm.has_dining} onChange={(e) => setAccommodationForm({ ...accommodationForm, has_dining: e.target.checked })} />}
                  label="Dining"
                />
              </FormGroup>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={handleCloseDialog} color="inherit">Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              sx={{
                background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                fontWeight: 700
              }}
            >
              {submitting ? 'Saving...' : 'Save Accommodation'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* --- ADD / EDIT TRANSPORT DIALOG --- */}
      <Dialog open={dialogType === 'transport'} onClose={handleCloseDialog} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          {isEdit ? 'Edit Transport Asset' : 'Onboard Transportation Vehicle'}
        </DialogTitle>
        <Box component="form" onSubmit={handleTransportSubmit}>
          <DialogContent sx={{ pt: 1 }}>
            {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
            <Stack spacing={2.5}>
              <TextField
                label="Vehicle Identifier Name"
                variant="outlined"
                fullWidth
                required
                value={transportForm.name}
                onChange={(e) => setTransportForm({ ...transportForm, name: e.target.value })}
                placeholder="e.g. Coaster Bus #03"
              />

              <FormControl fullWidth>
                <InputLabel>Vehicle Class Type</InputLabel>
                <Select
                  value={transportForm.type}
                  label="Vehicle Class Type"
                  onChange={(e) => setTransportForm({ ...transportForm, type: e.target.value })}
                >
                  <MenuItem value="bus">Bus</MenuItem>
                  <MenuItem value="microbus">Microbus</MenuItem>
                  <MenuItem value="car">Standard Sedan Car</MenuItem>
                </Select>
              </FormControl>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    label="Seating Capacity"
                    type="number"
                    variant="outlined"
                    fullWidth
                    required
                    value={transportForm.capacity}
                    onChange={(e) => setTransportForm({ ...transportForm, capacity: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                    inputProps={{ min: 1 }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Rental Cost ($)"
                    type="number"
                    variant="outlined"
                    fullWidth
                    required
                    value={transportForm.unit_cost}
                    onChange={(e) => setTransportForm({ ...transportForm, unit_cost: e.target.value })}
                    inputProps={{ step: "0.01", min: 0 }}
                  />
                </Grid>
              </Grid>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={handleCloseDialog} color="inherit">Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              sx={{
                background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                fontWeight: 700
              }}
            >
              {submitting ? 'Saving...' : 'Save Transport'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* --- DELETE CONFIRMATION DIALOG --- */}
      <Dialog open={deleteOpen} onClose={handleCloseDelete} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to permanently delete the resource <strong>{deleteTarget?.name}</strong>?
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            This action cannot be undone and will immediately wipe it from databases.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCloseDelete} color="inherit">Cancel</Button>
          <Button
            onClick={handleDeleteSubmit}
            variant="contained"
            color="error"
            disabled={deleteSubmitting}
            sx={{ fontWeight: 700 }}
          >
            {deleteSubmitting ? 'Deleting...' : 'Delete Register'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LogisticsManagement;
