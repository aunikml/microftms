import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Divider, 
  CircularProgress,
  Alert,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  Chip,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Link,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import { 
  PeopleAltOutlined, 
  SchoolOutlined, 
  ClassOutlined, 
  MapOutlined
} from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, GeoJSON } from 'react-leaflet';
import { motion } from 'framer-motion';
import { useAuth, api } from '../context/AuthContext';
import bangladeshDivisions from '../assets/bangladesh_divisions.json';
import 'leaflet/dist/leaflet.css';

// Leaflet marker bug fix (standard Leaflet icons don't load properly with bundlers)
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom dynamic icon helper depending on batch status
const createCustomIcon = (status) => {
  let statusClass = 'marker-active';
  if (status === 'completed') statusClass = 'marker-completed';
  if (status === 'inactive') statusClass = 'marker-inactive';
  
  return L.divIcon({
    className: 'custom-marker',
    html: `<div class="marker-container ${statusClass}">
             <svg viewBox="0 0 24 24" width="30" height="30" class="marker-pin">
               <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/>
             </svg>
           </div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
  });
};

// Predefined coordinates for division centers
const DIVISION_CENTERS = {
  'dhaka division': [23.8103, 90.4125],
  'chattogram division': [22.3569, 91.7832],
  'sylhet division': [24.8949, 91.8687],
  'rajshahi division': [24.3636, 88.6241],
  'khulna division': [22.8456, 89.5403],
  'barishal division': [22.7010, 90.3535],
  'rangpur division': [25.7439, 89.2753],
  'mymensingh division': [24.7471, 90.4203],
};

const Dashboard = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const navigate = useNavigate();
  const isDarkMode = theme.palette.mode === 'dark';

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [divisionalOverviewData, setDivisionalOverviewData] = useState([]);
  const [divisionalLoading, setDivisionalLoading] = useState(true);
  const [divisionalProgram, setDivisionalProgram] = useState('all');

  // Interactive Map States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [sidebarTab, setSidebarTab] = useState(0);
  const [activeDashboardTab, setActiveDashboardTab] = useState(0); // 0 for Map, 1 for Divisional Overview, 2 for Scorecard

  // Leaflet refs
  const mapRef = useRef(null);
  const divisionalMapRef = useRef(null);
  const markerRefs = useRef({});

  // Reset marker refs when batches change
  useEffect(() => {
    markerRefs.current = {};
  }, [dashboardData]);

  // Division Name translation and matching mappers
  const mapShapeToFilter = (shapeName) => {
    if (!shapeName) return '';
    const norm = shapeName.toLowerCase();
    if (norm === 'chittagong') return 'Chattogram';
    if (norm === 'rajshani') return 'Rajshahi';
    if (norm === 'barisal') return 'Barishal';
    return shapeName.charAt(0).toUpperCase() + shapeName.slice(1);
  };

  const isDivisionSelected = (shapeName) => {
    if (selectedDivision === 'All') return false;
    const filterName = mapShapeToFilter(shapeName);
    return filterName.toLowerCase() === selectedDivision.toLowerCase();
  };

  const getDivisionStyle = (feature) => {
    const isSelected = isDivisionSelected(feature.properties.shapeName);
    return {
      color: isSelected ? theme.palette.secondary.main : theme.palette.primary.main,
      weight: isSelected ? 3 : 1.5,
      fillColor: isSelected ? theme.palette.secondary.main : theme.palette.primary.main,
      fillOpacity: isSelected ? 0.15 : 0.04,
    };
  };

  const onEachDivision = (feature, layer) => {
    const shapeName = feature.properties.shapeName;
    const displayName = mapShapeToFilter(shapeName);

    layer.bindTooltip(displayName, {
      sticky: true,
      className: 'division-tooltip',
      direction: 'top'
    });

    layer.on({
      mouseover: (e) => {
        const l = e.target;
        l.setStyle({
          weight: 3,
          fillOpacity: 0.15,
          color: theme.palette.secondary.main
        });
        l.bringToFront();
      },
      mouseout: (e) => {
        const l = e.target;
        const isSelected = isDivisionSelected(shapeName);
        l.setStyle({
          color: isSelected ? theme.palette.secondary.main : theme.palette.primary.main,
          weight: isSelected ? 3 : 1.5,
          fillColor: isSelected ? theme.palette.secondary.main : theme.palette.primary.main,
          fillOpacity: isSelected ? 0.15 : 0.04,
        });
      },
      click: () => {
        const filterName = mapShapeToFilter(shapeName);
        setSelectedDivision(filterName);
      }
    });
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('dashboards/overview/');
      setDashboardData(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load dashboard overview data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDivisionalData = async (programValue = divisionalProgram) => {
    setDivisionalLoading(true);
    try {
      const res = await api.get(`dashboards/divisional-overview/?program=${programValue}`);
      setDivisionalOverviewData(res.data);
    } catch (err) {
      console.error('Failed to load divisional overview data:', err);
    } finally {
      setDivisionalLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'regional_manager') {
      navigate('/rm-dashboard', { replace: true });
      return;
    }
    fetchDashboardData();
    fetchDivisionalData(divisionalProgram);
  }, [user, navigate, divisionalProgram]);

  // Compute unique divisions list for filters
  const getDivisions = () => {
    if (!dashboardData?.batches) return ['All'];
    const divisions = dashboardData.batches.map(b => {
      const parts = b.location.split(' > ');
      return parts[0] ? parts[0].trim() : '';
    }).filter(Boolean);
    return ['All', ...new Set(divisions)];
  };

  // Compute division wise participant count
  const getDivisionParticipantCounts = () => {
    if (!dashboardData?.batches) return [];
    const counts = {};
    const filtered = dashboardData.batches.filter(b => {
      const matchesStatus = selectedStatus === 'All' || b.status.toLowerCase() === selectedStatus.toLowerCase();
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        b.batch_name.toLowerCase().includes(searchLower) ||
        b.location.toLowerCase().includes(searchLower) ||
        (b.trainers_details && b.trainers_details.some(t => t.full_name.toLowerCase().includes(searchLower)));
      return matchesStatus && matchesSearch;
    });
    filtered.forEach(b => {
      const parts = b.location.split(' > ');
      const division = parts[0] ? parts[0].trim() : 'Unknown';
      const count = b.participant_count || 0;
      counts[division] = (counts[division] || 0) + count;
    });
    return Object.entries(counts)
      .map(([division, count]) => ({ division, count }))
      .sort((a, b) => b.count - a.count);
  };

  // Filter batches based on search query, selected status, and selected division
  const getFilteredBatches = () => {
    if (!dashboardData?.batches) return [];
    return dashboardData.batches.filter(b => {
      const parts = b.location.split(' > ');
      const division = parts[0] ? parts[0].trim() : '';
      
      const matchesDivision = selectedDivision === 'All' || division.toLowerCase() === selectedDivision.toLowerCase();
      const matchesStatus = selectedStatus === 'All' || b.status.toLowerCase() === selectedStatus.toLowerCase();
      
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        b.batch_name.toLowerCase().includes(searchLower) ||
        b.location.toLowerCase().includes(searchLower) ||
        (b.trainers_details && b.trainers_details.some(t => t.full_name.toLowerCase().includes(searchLower)));
        
      return matchesDivision && matchesStatus && matchesSearch;
    });
  };

  // Zoom and pan to a batch coordinates and open popup programmatically
  const handleBatchSelect = (batch) => {
    if (!batch.latitude || !batch.longitude) return;
    const lat = parseFloat(batch.latitude);
    const lng = parseFloat(batch.longitude);
    
    if (mapRef.current) {
      mapRef.current.setView([lat, lng], 10, { animate: true, duration: 1.2 });
    }
    
    const marker = markerRefs.current[batch.id];
    if (marker) {
      setTimeout(() => {
        marker.openPopup();
      }, 400);
    }
  };

  // Tile layer URL based on light/dark mode
  const tileLayerUrl = isDarkMode 
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

  // Motion variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
  };

  const getStatsCards = () => {
    const metrics = dashboardData?.metrics;
    const batches = dashboardData?.batches || [];
    const active = batches.filter(b => b.status === 'active').length;
    const completed = batches.filter(b => b.status === 'completed').length;
    const inactive = batches.filter(b => b.status === 'inactive').length;

    return {
      trainers: metrics ? String(metrics.total_trainers) : "0",
      trainees: metrics ? String(metrics.total_participants) : "0",
      activeBatches: String(active),
      completedBatches: String(completed),
      inactiveBatches: String(inactive)
    };
  };

  const getCohortMetrics = () => {
    if (!dashboardData?.batches) return [];
    const cohorts = {};
    dashboardData.batches.forEach(b => {
      const cohortCode = b.cohort_details?.cohort_code || 'Unknown';
      const cohortName = b.cohort_details?.name || 'Unassigned Cohorts';
      if (!cohorts[cohortCode]) {
        cohorts[cohortCode] = {
          code: cohortCode,
          name: cohortName,
          batchCount: 0,
          traineeCount: 0
        };
      }
      cohorts[cohortCode].batchCount += 1;
      cohorts[cohortCode].traineeCount += (b.participant_count || 0);
    });
    return Object.values(cohorts);
  };

  // Group regional offices by division to calculate division-wide stats
  const divisionStats = React.useMemo(() => {
    const stats = {};
    divisionalOverviewData.forEach(office => {
      const div = office.division_name || 'No Division';
      if (!stats[div]) {
        stats[div] = {
          name: div,
          officeCount: 0,
          traineeCount: 0,
          offices: []
        };
      }
      stats[div].officeCount += 1;
      const trainees = office.cohorts.reduce((sum, coh) => sum + coh.total_trainees, 0);
      stats[div].traineeCount += trainees;
      stats[div].offices.push(office);
    });
    return Object.values(stats).sort((a, b) => a.name.localeCompare(b.name));
  }, [divisionalOverviewData]);

  // Zoom/pan to division center when a division in the list is clicked
  const handleDivisionSelect = (divisionName) => {
    const cleanName = divisionName.toLowerCase().replace('division', '').trim();
    
    // Find matching key in DIVISION_CENTERS
    let center = [23.6850, 90.3563];
    for (const key of Object.keys(DIVISION_CENTERS)) {
      if (key.includes(cleanName)) {
        center = DIVISION_CENTERS[key];
        break;
      }
    }
    
    if (divisionalMapRef.current) {
      divisionalMapRef.current.setView(center, 9, { animate: true, duration: 1.2 });
    }
  };

  const isTrainerRole = ['trainer', 'master_trainer'].includes(user?.role);

  if (isTrainerRole) {
    return (
      <Box>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, letterSpacing: '-0.5px' }}>
            Welcome back, {user?.first_name}!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Role: <strong style={{ textTransform: 'capitalize' }}>{user?.role?.replace('_', ' ')}</strong>
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            label="Search Batches"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ minWidth: 240, bgcolor: 'background.paper' }}
          />
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Filter by Division</InputLabel>
            <Select
              value={selectedDivision}
              label="Filter by Division"
              onChange={(e) => setSelectedDivision(e.target.value)}
              sx={{ bgcolor: 'background.paper' }}
            >
              {getDivisions().map(div => (
                <MenuItem key={div} value={div}>{div}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Filter by Status</InputLabel>
            <Select
              value={selectedStatus}
              label="Filter by Status"
              onChange={(e) => setSelectedStatus(e.target.value)}
              sx={{ bgcolor: 'background.paper' }}
            >
              <MenuItem value="All">All Statuses</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
          {!loading && (
            <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto', fontWeight: 600 }}>
              Showing {getFilteredBatches().length} batches
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 3, flexWrap: { xs: 'wrap', lg: 'nowrap' }, alignItems: 'stretch' }}>
          {/* Left Column: List Overview */}
          <Card sx={{ height: 600, flexGrow: 1, display: 'flex', flexDirection: 'column', p: 0.5, borderRadius: 3 }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%', flexGrow: 1, p: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 800, mb: 2 }}>
                  My Assigned Batches
                </Typography>
                
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
                    <CircularProgress />
                  </Box>
                ) : getFilteredBatches().length === 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', flexGrow: 1, py: 4, border: '2px dashed', borderColor: 'divider', borderRadius: 3 }}>
                    <ClassOutlined sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.35, mb: 2 }} />
                    <Typography variant="subtitle1" fontWeight={700} color="text.secondary">
                      No Assigned Batches Found
                    </Typography>
                  </Box>
                ) : (
                  <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, flexGrow: 1, maxHeight: 460, overflowY: 'auto' }}>
                    <Table stickyHeader size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 800, py: 1.5, bgcolor: 'action.hover' }}>Batch Name</TableCell>
                          <TableCell sx={{ fontWeight: 800, py: 1.5, bgcolor: 'action.hover' }}>Location</TableCell>
                          <TableCell sx={{ fontWeight: 800, py: 1.5, bgcolor: 'action.hover' }}>Start Date</TableCell>
                          <TableCell sx={{ fontWeight: 800, py: 1.5, bgcolor: 'action.hover' }} align="right">Trainees</TableCell>
                          <TableCell sx={{ fontWeight: 800, py: 1.5, bgcolor: 'action.hover' }} align="center">Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {getFilteredBatches().map((batch) => (
                          <TableRow 
                            key={batch.id} 
                            hover 
                            onClick={() => handleBatchSelect(batch)}
                            sx={{ cursor: 'pointer' }}
                          >
                            <TableCell sx={{ py: 1.5 }}>
                              <Link
                                component="button"
                                variant="body2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/batches/${batch.id}`);
                                }}
                                sx={{ 
                                  fontWeight: 700, 
                                  color: 'primary.main', 
                                  textDecoration: 'none',
                                  textAlign: 'left',
                                  '&:hover': { textDecoration: 'underline' }
                                }}
                              >
                                {batch.batch_name}
                              </Link>
                            </TableCell>
                            <TableCell sx={{ color: 'text.secondary', fontWeight: 500, py: 1.5 }}>
                              {batch.location.replace(/ > /g, ' • ')}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600, py: 1.5 }}>{batch.start_date}</TableCell>
                            <TableCell align="right" sx={{ py: 1.5 }}>
                              <Chip 
                                label={`${batch.participant_count}`} 
                                size="small" 
                                sx={{ 
                                  fontWeight: 700, 
                                  bgcolor: 'primary.light', 
                                  color: 'primary.main',
                                  border: 'none',
                                  fontSize: '0.75rem'
                                }}
                              />
                            </TableCell>
                            <TableCell align="center" sx={{ py: 1.5 }}>
                              <Chip 
                                label={batch.status} 
                                size="small" 
                                color={
                                  batch.status === 'active' ? 'success' : 
                                  batch.status === 'completed' ? 'info' : 'default'
                                }
                                sx={{ 
                                  fontSize: '0.75rem', 
                                  textTransform: 'capitalize',
                                  fontWeight: 700
                                }} 
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>

          {/* Right Column: Map Overview */}
          <Card sx={{ height: 600, width: { xs: '100%', lg: 450 }, flexShrink: 0, display: 'flex', flexDirection: 'column', p: 0.5, borderRadius: 3 }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%', flexGrow: 1, p: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <MapOutlined color="primary" /> Map Location Overview
                </Typography>
                
                <Box 
                  sx={{ 
                    flexGrow: 1, 
                    borderRadius: 2, 
                    overflow: 'hidden', 
                    border: (theme) => `2px solid ${theme.palette.primary.main}`,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    zIndex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                  }}
                >
                  {loading ? (
                    <CircularProgress />
                  ) : (
                    <MapContainer 
                      center={[23.6850, 90.3563]} 
                      zoom={7} 
                      style={{ height: '100%', width: '100%', position: 'absolute', top: 0, left: 0 }}
                      ref={mapRef}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
                        url={tileLayerUrl}
                      />
                      <GeoJSON
                        key={`trainer-${theme.palette.mode}-${selectedDivision}`}
                        data={bangladeshDivisions}
                        style={getDivisionStyle}
                        onEachFeature={onEachDivision}
                      />
                      {getFilteredBatches().filter(b => b.latitude && b.longitude).map((batch) => {
                        const lat = parseFloat(batch.latitude);
                        const lng = parseFloat(batch.longitude);
                        return (
                          <Marker 
                            key={batch.id} 
                            position={[lat, lng]}
                            icon={createCustomIcon(batch.status)}
                            ref={(ref) => {
                              if (ref) markerRefs.current[batch.id] = ref;
                            }}
                            eventHandlers={{
                              click: () => {
                                if (mapRef.current) {
                                  mapRef.current.setView([lat, lng], 10, { animate: true });
                                }
                              }
                            }}
                          >
                            <Tooltip direction="top" offset={[0, -10]} opacity={0.9}>
                              <Box sx={{ p: 0.25 }}>
                                <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.75rem' }}>
                                  {batch.batch_name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', display: 'block' }}>
                                  {batch.location.split(' > ')[0]} • {batch.participant_count} Trainees
                                </Typography>
                              </Box>
                            </Tooltip>
                            <Popup>
                              <Box sx={{ p: 0.5, minWidth: 220 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                                  <Typography 
                                    variant="subtitle2" 
                                    sx={{ 
                                      fontWeight: 800, 
                                      color: 'primary.main',
                                      cursor: 'pointer',
                                      '&:hover': { textDecoration: 'underline' },
                                      mr: 1
                                    }}
                                    onClick={() => navigate(`/batches/${batch.id}`)}
                                  >
                                    {batch.batch_name}
                                  </Typography>
                                  <Chip 
                                    label={batch.status} 
                                    size="small" 
                                    color={
                                      batch.status === 'active' ? 'success' : 
                                      batch.status === 'completed' ? 'info' : 'default'
                                    }
                                    sx={{ 
                                      fontSize: '0.65rem', 
                                      height: 18, 
                                      textTransform: 'capitalize',
                                      fontWeight: 700
                                    }} 
                                  />
                                </Box>
                                <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 1 }}>
                                  {batch.location.replace(/ > /g, ' • ')}
                                </Typography>
                                <Divider sx={{ my: 0.5 }} />
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, mt: 0.5 }}>
                                  <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                                    <strong>Start Date:</strong> {batch.start_date}
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                                    <strong>Total Trainees:</strong> {batch.participant_count}
                                  </Typography>
                                  <Box sx={{ mt: 1 }}>
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      fullWidth
                                      onClick={() => navigate(`/batches/${batch.id}`)}
                                      sx={{ fontWeight: 700, borderRadius: 1.5, textTransform: 'none' }}
                                    >
                                      Go to Details Page
                                    </Button>
                                  </Box>
                                </Box>
                              </Box>
                            </Popup>
                          </Marker>
                        );
                      })}
                    </MapContainer>
                  )}
                </Box>
              </CardContent>
            </Card>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, letterSpacing: '-0.5px' }}>
          Welcome back, {user?.first_name}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Role: <strong style={{ textTransform: 'capitalize' }}>{user?.role?.replace('_', ' ')}</strong>
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
        <Tabs value={activeDashboardTab} onChange={(e, val) => setActiveDashboardTab(val)}>
          <Tab label="Overview Map" sx={{ fontWeight: 700 }} />
          <Tab label="Divisional Overview" sx={{ fontWeight: 700 }} />
          <Tab label="System Scorecard" sx={{ fontWeight: 700 }} />
        </Tabs>
      </Box>

      {/* Tab Panel 1: Map View */}
      {activeDashboardTab === 0 && (
        <Box>
          {/* Search and Filters Header */}
          <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              label="Search Batches or Trainers"
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ minWidth: 280, bgcolor: 'background.paper' }}
            />
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Filter by Division</InputLabel>
              <Select
                value={selectedDivision}
                label="Filter by Division"
                onChange={(e) => setSelectedDivision(e.target.value)}
                sx={{ bgcolor: 'background.paper' }}
              >
                {getDivisions().map(div => (
                  <MenuItem key={div} value={div}>{div}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Filter by Status</InputLabel>
              <Select
                value={selectedStatus}
                label="Filter by Status"
                onChange={(e) => setSelectedStatus(e.target.value)}
                sx={{ bgcolor: 'background.paper' }}
              >
                <MenuItem value="All">All Statuses</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
            {!loading && (
              <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto', fontWeight: 600 }}>
                Showing {getFilteredBatches().length} of {dashboardData?.batches?.length || 0} batches
              </Typography>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 3, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
            {/* Map View of All Batches */}
            <Card sx={{ p: 0.5, height: 600, flexGrow: 1, display: 'flex', flexDirection: 'column', borderRadius: 3 }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%', flexGrow: 1 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MapOutlined color="primary" /> Overview Map
                </Typography>
                
                <Box 
                  sx={{ 
                    flexGrow: 1, 
                    borderRadius: 2, 
                    overflow: 'hidden', 
                    border: (theme) => `2px solid ${theme.palette.primary.main}`,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    zIndex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                  }}
                >
                  {loading ? (
                    <CircularProgress />
                  ) : (
                    <MapContainer 
                      center={[23.6850, 90.3563]} 
                      zoom={7} 
                      style={{ height: '100%', width: '100%', position: 'absolute', top: 0, left: 0 }}
                      ref={mapRef}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
                        url={tileLayerUrl}
                      />
                      <GeoJSON
                        key={`${theme.palette.mode}-${selectedDivision}`}
                        data={bangladeshDivisions}
                        style={getDivisionStyle}
                        onEachFeature={onEachDivision}
                      />
                      {getFilteredBatches().filter(b => b.latitude && b.longitude).map((batch) => {
                        const lat = parseFloat(batch.latitude);
                        const lng = parseFloat(batch.longitude);
                        return (
                          <Marker 
                            key={batch.id} 
                            position={[lat, lng]}
                            icon={createCustomIcon(batch.status)}
                            ref={(ref) => {
                              if (ref) markerRefs.current[batch.id] = ref;
                            }}
                            eventHandlers={{
                              click: () => {
                                if (mapRef.current) {
                                  mapRef.current.setView([lat, lng], 10, { animate: true });
                                }
                              }
                            }}
                          >
                            <Tooltip direction="top" offset={[0, -10]} opacity={0.9}>
                              <Box sx={{ p: 0.25 }}>
                                <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.75rem' }}>
                                  {batch.batch_name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', display: 'block' }}>
                                  {batch.location.split(' > ')[0]} • {batch.participant_count} Trainees
                                </Typography>
                              </Box>
                            </Tooltip>
                            <Popup>
                              <Box sx={{ p: 0.5, minWidth: 220 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                                  <Typography 
                                    variant="subtitle2" 
                                    sx={{ 
                                      fontWeight: 800, 
                                      color: 'primary.main',
                                      cursor: 'pointer',
                                      '&:hover': { textDecoration: 'underline' },
                                      mr: 1
                                    }}
                                    onClick={() => navigate(`/batches/${batch.id}`)}
                                  >
                                    {batch.batch_name}
                                  </Typography>
                                  <Chip 
                                    label={batch.status} 
                                    size="small" 
                                    color={
                                      batch.status === 'active' ? 'success' : 
                                      batch.status === 'completed' ? 'info' : 'default'
                                    }
                                    sx={{ 
                                      fontSize: '0.65rem', 
                                      height: 18, 
                                      textTransform: 'capitalize',
                                      fontWeight: 700
                                    }} 
                                  />
                                </Box>
                                <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 1 }}>
                                  {batch.location.replace(/ > /g, ' • ')}
                                </Typography>
                                
                                <Divider sx={{ my: 0.5 }} />
                                
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, mt: 0.5 }}>
                                  <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                                    <strong>Start Date:</strong> {batch.start_date}
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                                    <strong>Total Trainees:</strong> {batch.participant_count}
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 700, mt: 0.5 }}>
                                    Trainers:
                                  </Typography>
                                  {batch.trainers_details && batch.trainers_details.length > 0 ? (
                                    <Box sx={{ pl: 1 }}>
                                      {batch.trainers_details.map(t => (
                                        <Typography key={t.id} variant="caption" display="block" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                          • {t.full_name} ({t.role.replace('_', ' ')})
                                        </Typography>
                                      ))}
                                    </Box>
                                  ) : (
                                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', pl: 1, fontSize: '0.75rem' }}>
                                      No trainers assigned
                                    </Typography>
                                  )}
                                </Box>
                              </Box>
                            </Popup>
                          </Marker>
                        );
                      })}
                    </MapContainer>
                  )}
                </Box>
              </CardContent>
            </Card>

            {/* Synced Interactive Sidebar */}
            <Card sx={{ p: 0.5, height: 600, width: { xs: '100%', md: 380 }, flexShrink: 0, display: 'flex', flexDirection: 'column', borderRadius: 3 }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%', flexGrow: 1, p: 2 }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                  <Tabs value={sidebarTab} onChange={(e, val) => setSidebarTab(val)} variant="fullWidth">
                    <Tab label="Batches" sx={{ fontWeight: 700, fontSize: '0.85rem' }} />
                    <Tab label="Division Stats" sx={{ fontWeight: 700, fontSize: '0.85rem' }} />
                  </Tabs>
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {sidebarTab === 0 
                    ? 'Click on a batch card below to locate it on the map and view detailed popup.' 
                    : 'Click on a division card below to filter the map view and dashboard data.'}
                </Typography>
                
                {sidebarTab === 0 && (
                  <Box 
                    sx={{ 
                      flexGrow: 1, 
                      overflowY: 'auto', 
                      maxHeight: 450,
                      pr: 0.5,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1.5
                    }}
                  >
                    {getFilteredBatches().map((batch) => (
                      <Card 
                        key={batch.id} 
                        variant="outlined" 
                        sx={{ 
                          cursor: 'pointer',
                          flexShrink: 0,
                          transition: 'all 0.2s',
                          borderRadius: 2,
                          '&:hover': { 
                            borderColor: 'primary.main',
                            bgcolor: 'action.hover',
                            transform: 'translateY(-2px)',
                            boxShadow: (theme) => theme.shadows[1]
                          }
                        }}
                        onClick={() => handleBatchSelect(batch)}
                      >
                        <CardContent sx={{ p: '12px !important' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                              {batch.batch_name}
                            </Typography>
                            <Chip 
                              label={batch.status} 
                              size="small" 
                              color={
                                batch.status === 'active' ? 'success' : 
                                batch.status === 'completed' ? 'info' : 'default'
                              }
                              sx={{ 
                                fontSize: '0.6rem', 
                                height: 16, 
                                textTransform: 'capitalize',
                                fontWeight: 700,
                                ml: 1
                              }} 
                            />
                          </Box>
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                            {batch.location.replace(/ > /g, ' • ')}
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                              Start: {batch.start_date}
                            </Typography>
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                px: 1, 
                                py: 0.25, 
                                borderRadius: 1, 
                                bgcolor: 'primary.light', 
                                color: 'primary.dark',
                                fontWeight: 700,
                                fontSize: '0.7rem'
                              }}
                            >
                              {batch.participant_count} Trainees
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                    {getFilteredBatches().length === 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', py: 4, flexGrow: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                          No matching batches found
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}

                {sidebarTab === 1 && (
                  <Box 
                    sx={{ 
                      flexGrow: 1, 
                      overflowY: 'auto', 
                      maxHeight: 450,
                      pr: 0.5,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1.5
                    }}
                  >
                    {(() => {
                      const divCounts = getDivisionParticipantCounts();

                      return divCounts.map((item, idx) => {
                        const isSelected = selectedDivision.toLowerCase() === item.division.toLowerCase();

                        return (
                          <Card
                            key={idx}
                            variant="outlined"
                            onClick={() => setSelectedDivision(isSelected ? 'All' : item.division)}
                            sx={{
                              cursor: 'pointer',
                              borderColor: isSelected ? 'secondary.main' : 'divider',
                              transition: 'all 0.2s',
                              borderRadius: 2,
                              bgcolor: isSelected ? 'action.selected' : 'background.paper',
                              '&:hover': {
                                borderColor: 'secondary.main',
                                bgcolor: 'action.hover',
                                transform: 'translateY(-2px)',
                                boxShadow: theme.shadows[1]
                              }
                            }}
                          >
                            <CardContent sx={{ p: '12px !important' }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                                  {item.division} Division
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 800, color: 'secondary.main' }}>
                                  {item.count} Trainees
                                </Typography>
                              </Box>
                            </CardContent>
                          </Card>
                        );
                      });
                    })()}
                    {getDivisionParticipantCounts().length === 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', py: 4, flexGrow: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                          No division data available
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>
        </Box>
      )}

      {/* Tab Panel 2: Divisional Overview */}
      {activeDashboardTab === 1 && (
        <Box>
          {/* Program Filter Toolbar */}
          <Box 
            sx={{ 
              mb: 3, 
              display: 'flex', 
              gap: 2, 
              flexWrap: 'wrap', 
              alignItems: 'center',
              bgcolor: 'background.paper',
              p: 2,
              borderRadius: 3,
              boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.05)',
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.secondary' }}>
              Filter Overview by Program:
            </Typography>
            <ToggleButtonGroup
              value={divisionalProgram}
              exclusive
              onChange={(e, newProg) => {
                if (newProg !== null) setDivisionalProgram(newProg);
              }}
              size="small"
              sx={{
                bgcolor: 'action.hover',
                '& .MuiToggleButtonGroup-grouped': {
                  border: 0,
                  px: 2.5,
                  py: 0.75,
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  textTransform: 'capitalize',
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': {
                      bgcolor: 'primary.dark',
                    }
                  }
                }
              }}
            >
              <ToggleButton value="all">
                All Programs
              </ToggleButton>
              <ToggleButton value="dabi">
                Dabi
              </ToggleButton>
              <ToggleButton value="progoti">
                Progoti
              </ToggleButton>
            </ToggleButtonGroup>
            
            {!divisionalLoading && (
              <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto', fontWeight: 700 }}>
                Active Program: <span style={{ textTransform: 'capitalize', color: theme.palette.primary.main }}>{divisionalProgram}</span>
              </Typography>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 3, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
            {/* Map View of All Regional Offices */}
            <Card sx={{ p: 0.5, height: 600, flexGrow: 1, display: 'flex', flexDirection: 'column', borderRadius: 3 }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%', flexGrow: 1 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MapOutlined color="primary" /> Divisional Overview Map
                </Typography>
                
                <Box 
                  sx={{ 
                    flexGrow: 1, 
                    borderRadius: 2, 
                    overflow: 'hidden', 
                    border: (theme) => `2px solid ${theme.palette.secondary.main}`,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    zIndex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                  }}
                >
                  {divisionalLoading ? (
                    <CircularProgress />
                  ) : (
                    <MapContainer 
                      center={[23.6850, 90.3563]} 
                      zoom={7} 
                      style={{ height: '100%', width: '100%', position: 'absolute', top: 0, left: 0 }}
                      ref={divisionalMapRef}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
                        url={tileLayerUrl}
                      />
                      <GeoJSON
                        key={`divisional-${theme.palette.mode}`}
                        data={bangladeshDivisions}
                        style={getDivisionStyle}
                        onEachFeature={onEachDivision}
                      />
                      {divisionalOverviewData.filter(ro => ro.latitude && ro.longitude).map((office) => {
                        const lat = parseFloat(office.latitude);
                        const lng = parseFloat(office.longitude);
                        
                        const totalCohorts = office.cohorts.length;
                        const totalOfficeTrainees = office.cohorts.reduce((a, b) => a + b.total_trainees, 0);

                        return (
                          <Marker 
                            key={office.id} 
                            position={[lat, lng]}
                            icon={createCustomIcon(totalOfficeTrainees > 0 ? 'completed' : 'inactive')}
                          >
                            <Tooltip direction="top" offset={[0, -10]} opacity={0.9}>
                              <Box sx={{ p: 0.25 }}>
                                <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.75rem' }}>
                                  {office.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', display: 'block' }}>
                                  Division: {office.division_name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', display: 'block' }}>
                                  RM: {office.regional_managers && office.regional_managers.length > 0 ? office.regional_managers.join(', ') : 'None'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', display: 'block' }}>
                                  {totalCohorts} Cohorts • {totalOfficeTrainees} Trainees
                                </Typography>
                              </Box>
                            </Tooltip>
                            <Popup>
                              <Box sx={{ p: 0.5, minWidth: 260, maxWidth: 320 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'secondary.main', mb: 0.5 }}>
                                  {office.name}
                                </Typography>
                                <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 0.5 }}>
                                  Division: {office.division_name} • Location: {office.location}
                                </Typography>
                                <Typography variant="caption" display="block" sx={{ fontWeight: 700, color: 'text.secondary', mb: 1 }}>
                                  Manager: {office.regional_managers && office.regional_managers.length > 0 ? office.regional_managers.join(', ') : 'None assigned'}
                                </Typography>
                                <Divider sx={{ my: 0.5 }} />
                                
                                <Typography variant="body2" sx={{ fontWeight: 800, mt: 1, mb: 0.5 }}>
                                  Cohorts Active ({totalCohorts})
                                </Typography>
                                
                                {office.cohorts.length === 0 ? (
                                  <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', display: 'block', py: 1 }}>
                                    No active trainees or cohorts in this office
                                  </Typography>
                                ) : (
                                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1, maxHeight: 220, overflowY: 'auto', pr: 0.5 }}>
                                    {office.cohorts.map((coh) => (
                                      <Box key={coh.cohort_code} sx={{ p: 1, borderRadius: 2, bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider' }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                            {coh.cohort_code}
                                          </Typography>
                                          <Chip 
                                            label={`${coh.total_trainees} Trainees`} 
                                            size="small" 
                                            color="primary"
                                            sx={{ fontSize: '0.65rem', height: 18, fontWeight: 700 }}
                                          />
                                        </Box>
                                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                          {coh.cohort_name}
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                          <Chip 
                                            label={`Basic: ${coh.stages.basic}`} 
                                            size="small" 
                                            variant="outlined" 
                                            sx={{ fontSize: '0.6rem', height: 16, fontWeight: 600 }} 
                                          />
                                          <Chip 
                                            label={`Ref 1: ${coh.stages.refresher_1}`} 
                                            size="small" 
                                            variant="outlined" 
                                            sx={{ fontSize: '0.6rem', height: 16, fontWeight: 600 }} 
                                          />
                                          <Chip 
                                            label={`Ref 2: ${coh.stages.refresher_2}`} 
                                            size="small" 
                                            variant="outlined" 
                                            sx={{ fontSize: '0.6rem', height: 16, fontWeight: 600 }} 
                                          />
                                        </Box>
                                      </Box>
                                    ))}
                                  </Box>
                                )}
                              </Box>
                            </Popup>
                          </Marker>
                        );
                      })}
                    </MapContainer>
                  )}
                </Box>
              </CardContent>
            </Card>

            {/* List Sidebar for Divisions */}
            <Card sx={{ p: 0.5, height: 600, width: { xs: '100%', md: 380 }, flexShrink: 0, display: 'flex', flexDirection: 'column', borderRadius: 3 }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%', flexGrow: 1, p: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>
                  Divisions Overview List
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Click on a division card to focus the map and see all its regional offices.
                </Typography>
                
                <Box 
                  sx={{ 
                    flexGrow: 1, 
                    overflowY: 'auto', 
                    maxHeight: 450,
                    pr: 0.5,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5
                  }}
                >
                  {divisionalLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : divisionStats.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', textAlign: 'center', py: 4 }}>
                      No divisions found
                    </Typography>
                  ) : (
                    divisionStats.map((div) => {
                      return (
                        <Card 
                          key={div.name} 
                          variant="outlined"
                          onClick={() => handleDivisionSelect(div.name)}
                          sx={{ 
                            borderRadius: 2,
                            borderColor: 'divider',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': {
                              borderColor: 'primary.main',
                              bgcolor: 'action.hover',
                              transform: 'translateY(-2px)',
                              boxShadow: theme.shadows[1]
                            }
                          }}
                        >
                          <CardContent sx={{ p: '12px !important' }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                              {div.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                              Contains {div.officeCount} Regional Offices
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="caption" sx={{ fontWeight: 700, px: 1, py: 0.25, borderRadius: 1, bgcolor: 'primary.light', color: 'primary.dark' }}>
                                {div.traineeCount} Trainees
                              </Typography>
                            </Box>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>
      )}

      {/* Tab Panel 3: Scorecard */}
      {activeDashboardTab === 2 && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
              System Totals
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <motion.div variants={itemVariants} whileHover={{ y: -5 }}>
                  <Card sx={{ p: 1, borderRadius: 3 }}>
                    <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontWeight: 600 }}>
                          Total Trainers
                        </Typography>
                        {loading ? (
                          <CircularProgress size={24} thickness={5} sx={{ mt: 1 }} />
                        ) : (
                          <Typography variant="h4" sx={{ fontWeight: 800 }}>
                            {getStatsCards().trainers}
                          </Typography>
                        )}
                      </Box>
                      <Box sx={{ width: 48, height: 48, borderRadius: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'secondary.light', color: 'secondary.main', flexShrink: 0 }}>
                        <SchoolOutlined />
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>

              <Grid item xs={12} sm={6}>
                <motion.div variants={itemVariants} whileHover={{ y: -5 }}>
                  <Card sx={{ p: 1, borderRadius: 3 }}>
                    <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontWeight: 600 }}>
                          Total Trainees
                        </Typography>
                        {loading ? (
                          <CircularProgress size={24} thickness={5} sx={{ mt: 1 }} />
                        ) : (
                          <Typography variant="h4" sx={{ fontWeight: 800 }}>
                            {getStatsCards().trainees}
                          </Typography>
                        )}
                      </Box>
                      <Box sx={{ width: 48, height: 48, borderRadius: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'warning.light', color: 'warning.main', flexShrink: 0 }}>
                        <PeopleAltOutlined />
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
              Batch Status Breakdown
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <motion.div variants={itemVariants} whileHover={{ y: -5 }}>
                  <Card sx={{ p: 1, borderRadius: 3, borderLeft: '5px solid', borderLeftColor: 'success.main' }}>
                    <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontWeight: 600 }}>
                          Active Batches
                        </Typography>
                        {loading ? (
                          <CircularProgress size={24} thickness={5} sx={{ mt: 1 }} />
                        ) : (
                          <Typography variant="h4" sx={{ fontWeight: 800 }}>
                            {getStatsCards().activeBatches}
                          </Typography>
                        )}
                      </Box>
                      <Box sx={{ width: 48, height: 48, borderRadius: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'success.light', color: 'success.main', flexShrink: 0 }}>
                        <ClassOutlined />
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>

              <Grid item xs={12} md={4}>
                <motion.div variants={itemVariants} whileHover={{ y: -5 }}>
                  <Card sx={{ p: 1, borderRadius: 3, borderLeft: '5px solid', borderLeftColor: 'info.main' }}>
                    <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontWeight: 600 }}>
                          Completed Batches
                        </Typography>
                        {loading ? (
                          <CircularProgress size={24} thickness={5} sx={{ mt: 1 }} />
                        ) : (
                          <Typography variant="h4" sx={{ fontWeight: 800 }}>
                            {getStatsCards().completedBatches}
                          </Typography>
                        )}
                      </Box>
                      <Box sx={{ width: 48, height: 48, borderRadius: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'info.light', color: 'info.main', flexShrink: 0 }}>
                        <ClassOutlined />
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>

              <Grid item xs={12} md={4}>
                <motion.div variants={itemVariants} whileHover={{ y: -5 }}>
                  <Card sx={{ p: 1, borderRadius: 3, borderLeft: '5px solid', borderLeftColor: 'text.disabled' }}>
                    <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontWeight: 600 }}>
                          Inactive Batches
                        </Typography>
                        {loading ? (
                          <CircularProgress size={24} thickness={5} sx={{ mt: 1 }} />
                        ) : (
                          <Typography variant="h4" sx={{ fontWeight: 800 }}>
                            {getStatsCards().inactiveBatches}
                          </Typography>
                        )}
                      </Box>
                      <Box sx={{ width: 48, height: 48, borderRadius: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'action.hover', color: 'text.secondary', flexShrink: 0 }}>
                        <ClassOutlined />
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            </Grid>
          </Box>

          {/* Cohort Breakdown */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
              Cohort Breakdown
            </Typography>
            <Card sx={{ borderRadius: 3, p: 1 }}>
              <CardContent sx={{ p: 1 }}>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : getCohortMetrics().length === 0 ? (
                  <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                    No cohort data available.
                  </Typography>
                ) : (
                  <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: 'action.hover' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 800 }}>Cohort Code</TableCell>
                          <TableCell sx={{ fontWeight: 800 }}>Cohort Name</TableCell>
                          <TableCell sx={{ fontWeight: 800 }} align="right">Number of Batches</TableCell>
                          <TableCell sx={{ fontWeight: 800 }} align="right">Total Enrolled Trainees</TableCell>
                          <TableCell sx={{ fontWeight: 800 }} align="right">Avg. Trainees / Batch</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {getCohortMetrics().map((cohort) => (
                          <TableRow key={cohort.code} hover>
                            <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>
                              {cohort.code}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>
                              {cohort.name}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600 }}>
                              <Chip 
                                label={cohort.batchCount} 
                                size="small" 
                                sx={{ fontWeight: 700, bgcolor: 'action.selected' }} 
                              />
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>
                              {cohort.traineeCount}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                              {cohort.batchCount > 0 ? (cohort.traineeCount / cohort.batchCount).toFixed(1) : '0.0'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </Box>
        </motion.div>
      )}
    </Box>
  );
};

export default Dashboard;
