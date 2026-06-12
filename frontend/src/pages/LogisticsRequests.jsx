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
  IconButton,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Stack,
  Divider,
  Grid,
  Tooltip,
  Checkbox,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Refresh,
  CheckCircle,
  Inventory,
  Devices,
  Hotel,
  Warning,
  Check,
  Close,
  FiberNew
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../context/AuthContext';

const LogisticsRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Dialog state
  const [activeRequest, setActiveRequest] = useState(null);
  const [dialogCategory, setDialogCategory] = useState(null); // 'stationary', 'it', 'accommodation'
  const [submitting, setSubmitting] = useState(false);
  const [dialogError, setDialogError] = useState('');

  // Accommodation selection states
  const [accommodations, setAccommodations] = useState([]);
  const [accommodationsLoading, setAccommodationsLoading] = useState(false);
  const [showAllAccommodations, setShowAllAccommodations] = useState(false);
  const [selectedAccommodationId, setSelectedAccommodationId] = useState('');

  const fetchAccommodations = async () => {
    setAccommodationsLoading(true);
    try {
      const response = await api.get('logistics/accommodations/');
      setAccommodations(response.data);
    } catch (err) {
      console.error('Failed to fetch accommodations:', err);
    } finally {
      setAccommodationsLoading(false);
    }
  };

  const fetchRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('logistics/requests/');
      setRequests(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch logistics requests from the server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleOpenDialog = async (request, category) => {
    setActiveRequest(request);
    setDialogCategory(category);
    setDialogError('');

    if (category === 'accommodation') {
      setSelectedAccommodationId(request.accommodation || '');
      setShowAllAccommodations(false);
      fetchAccommodations();
    }

    // If request is not opened yet, mark it as opened on the backend
    if (!request.is_opened) {
      try {
        await api.patch(`logistics/requests/${request.id}/`, { is_opened: true });
        // Update local state to avoid full reload
        setRequests(prev => 
          prev.map(r => r.id === request.id ? { ...r, is_opened: true } : r)
        );
      } catch (err) {
        console.error('Failed to mark request as opened:', err);
      }
    }
  };

  const handleCloseDialog = () => {
    setActiveRequest(null);
    setDialogCategory(null);
    setDialogError('');
  };

  const handleApprove = async () => {
    if (!activeRequest || !dialogCategory) return;
    
    const isAccommodation = dialogCategory === 'accommodation';
    if (isAccommodation && !selectedAccommodationId) {
      setDialogError('Please select a property to approve.');
      return;
    }
    
    setSubmitting(true);
    setDialogError('');

    try {
      let payload = {};
      if (isAccommodation) {
        payload = {
          accommodation: parseInt(selectedAccommodationId, 10),
          accommodation_status: 'approved'
        };
      } else {
        payload = { [`${dialogCategory}_status`]: 'approved' };
      }
      
      const res = await api.patch(`logistics/requests/${activeRequest.id}/`, payload);
      
      // Update local request data
      setRequests(prev =>
        prev.map(r => r.id === activeRequest.id ? res.data : r)
      );
      handleCloseDialog();
    } catch (err) {
      console.error(err);
      setDialogError(err.response?.data?.detail || 'An error occurred while approving the request.');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to check if a category was requested
  const isCategoryRequested = (req, category) => {
    if (category === 'accommodation') {
      return !!req.check_in_date;
    }
    return req.requested_items.some(i => i.item_details?.category === category);
  };

  // Helper to format date
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Stock status recommendation helper
  const getRecommendation = (requestedQty, availableStock) => {
    const diff = availableStock - requestedQty;
    if (diff >= 50) {
      return {
        text: 'Safe To Approve',
        color: 'success',
        bg: 'rgba(46, 125, 50, 0.08)',
        border: 'rgba(46, 125, 50, 0.3)'
      };
    } else if (diff >= 10) {
      return {
        text: 'Approve and Re-stock',
        color: 'warning',
        bg: 'rgba(237, 108, 2, 0.08)',
        border: 'rgba(237, 108, 2, 0.3)'
      };
    } else {
      return {
        text: 'Re-stock and approve',
        color: 'error',
        bg: 'rgba(211, 47, 47, 0.08)',
        border: 'rgba(211, 47, 47, 0.3)'
      };
    }
  };

  // Render Status Chip for table
  const renderStatusChip = (req, category) => {
    const isRequested = isCategoryRequested(req, category);
    if (!isRequested) {
      return (
        <Chip
          label="Not Requested"
          size="small"
          variant="outlined"
          sx={{ opacity: 0.5, fontWeight: 500, minWidth: 110 }}
        />
      );
    }

    const statusVal = req[`${category}_status`] || 'pending';
    const isApproved = statusVal === 'approved';

    return (
      <Chip
        label={isApproved ? 'Approved' : 'Pending'}
        color={isApproved ? 'success' : 'warning'}
        onClick={() => handleOpenDialog(req, category)}
        icon={isApproved ? <CheckCircle style={{ fontSize: '14px' }} /> : <Warning style={{ fontSize: '14px' }} />}
        sx={{
          fontWeight: 700,
          minWidth: 110,
          cursor: 'pointer',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
          },
          transition: 'all 0.2s'
        }}
      />
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5, letterSpacing: '-0.5px' }}>
            Trainer Logistics Requests
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Process incoming resource requests for batches. Evaluate stock levels and recommendations before approval.
          </Typography>
        </Box>
        <IconButton onClick={fetchRequests} disabled={loading} color="primary" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <Refresh />
        </IconButton>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : requests.length === 0 ? (
        <Paper variant="outlined" sx={{ py: 8, textAlign: 'center', borderStyle: 'dashed', borderRadius: 3 }}>
          <CheckCircle sx={{ fontSize: 56, color: 'text.secondary', opacity: 0.35, mb: 2 }} />
          <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
            All Caught Up!
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 450, mx: 'auto' }}>
            There are no logistics requests submitted by trainers yet. When a trainer requests supplies or accommodations, they will appear here.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <Table>
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Batch & Cohort</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Requester</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Date Received</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Stationary</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">IT Logistics</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Accommodation</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.map((req) => (
                <TableRow key={req.id} hover sx={{ position: 'relative' }}>
                  <TableCell sx={{ fontWeight: 700 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {req.batch_name}
                      {!req.is_opened && (
                        <Chip
                          icon={<FiberNew sx={{ fontSize: '18px !important', color: '#fff !important' }} />}
                          label="NEW"
                          size="small"
                          sx={{
                            background: 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)',
                            color: '#fff',
                            fontWeight: 800,
                            height: 20,
                            '& .MuiChip-label': { px: 1 }
                          }}
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>{req.created_by_name}</TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>
                    {formatDate(req.created_at)}
                  </TableCell>
                  <TableCell align="center">{renderStatusChip(req, 'stationary')}</TableCell>
                  <TableCell align="center">{renderStatusChip(req, 'it')}</TableCell>
                  <TableCell align="center">{renderStatusChip(req, 'accommodation')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Detail & Process Modal */}
      <Dialog open={!!activeRequest && !!dialogCategory} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        {activeRequest && dialogCategory && (() => {
          const isApproved = activeRequest[`${dialogCategory}_status`] === 'approved';
          const items = activeRequest.requested_items.filter(i => i.item_details?.category === dialogCategory);
          const iconColor = dialogCategory === 'stationary' ? 'primary' : dialogCategory === 'it' ? 'secondary' : 'info';
          const icon = dialogCategory === 'stationary' ? <Inventory /> : dialogCategory === 'it' ? <Devices /> : <Hotel />;

          return (
            <>
              <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ color: `${iconColor}.main`, display: 'flex', alignItems: 'center' }}>{icon}</Box>
                Review {dialogCategory.charAt(0).toUpperCase() + dialogCategory.slice(1)} Request - {activeRequest.batch_name}
              </DialogTitle>
              
              <DialogContent dividers>
                {dialogError && <Alert severity="error" sx={{ mb: 2 }}>{dialogError}</Alert>}

                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    Requester: <strong>{activeRequest.created_by_name} ({activeRequest.created_by_email})</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Received on: <strong>{formatDate(activeRequest.created_at)}</strong>
                  </Typography>
                </Box>

                {dialogCategory === 'accommodation' ? (
                  <Box>
                    <Grid container spacing={3} sx={{ mb: 3 }}>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
                          CHECK-IN DATE
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 700 }}>
                          {formatDate(activeRequest.check_in_date)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
                          CHECK-OUT DATE
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 700 }}>
                          {formatDate(activeRequest.check_out_date)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
                          TRAINERS COUNT
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 700 }}>
                          {activeRequest.num_trainers}
                        </Typography>
                      </Grid>
                    </Grid>

                    <Divider sx={{ my: 2.5 }} />

                    {isApproved ? (
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CheckCircle color="success" /> Approved Property Detail
                        </Typography>
                        <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                          <Typography variant="h6" sx={{ fontWeight: 800 }}>
                            {activeRequest.accommodation_details?.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {activeRequest.accommodation_details?.location}
                          </Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                                ROOM TYPE
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                {activeRequest.accommodation_details?.room_type === 'suite' ? 'Suite' : activeRequest.accommodation_details?.room_type === 'single' ? 'Single' : 'Twin Share'} (${activeRequest.accommodation_details?.room_unit_cost}/night)
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                                CLASSROOM TYPE
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                {activeRequest.accommodation_details?.classroom_type === 'conference_room' ? 'Conference Room' : 'Std Classroom'} (${activeRequest.accommodation_details?.classroom_unit_cost}/day)
                              </Typography>
                            </Grid>
                          </Grid>
                          {/* Facilities */}
                          <Box sx={{ mt: 2.5 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
                              FACILITIES
                            </Typography>
                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ gap: 1 }}>
                              {activeRequest.accommodation_details?.has_wifi && <Chip label="WiFi" size="small" color="success" variant="outlined" />}
                              {activeRequest.accommodation_details?.has_projector && <Chip label="Projector" size="small" color="success" variant="outlined" />}
                              {activeRequest.accommodation_details?.has_whiteboard && <Chip label="Whiteboard" size="small" color="success" variant="outlined" />}
                              {activeRequest.accommodation_details?.has_dining && <Chip label="Dining" size="small" color="success" variant="outlined" />}
                            </Stack>
                          </Box>
                        </Paper>
                      </Box>
                    ) : (
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                          Select Property for Approval
                        </Typography>

                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={showAllAccommodations}
                              onChange={(e) => setShowAllAccommodations(e.target.checked)}
                              color="primary"
                            />
                          }
                          label={
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              Show all properties (-show all)
                            </Typography>
                          }
                          sx={{ mb: 2 }}
                        />

                        {accommodationsLoading ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 2 }}>
                            <CircularProgress size={20} />
                            <Typography variant="body2" color="text.secondary">Loading properties...</Typography>
                          </Box>
                        ) : (
                          <Box>
                            <FormControl fullWidth size="small" sx={{ mb: 2.5 }}>
                              <InputLabel>Select Property</InputLabel>
                              <Select
                                value={selectedAccommodationId}
                                label="Select Property"
                                onChange={(e) => setSelectedAccommodationId(e.target.value)}
                              >
                                {(() => {
                                  const getDivision = (loc) => {
                                    if (!loc) return '';
                                    return loc.split(' > ')[0].trim().toLowerCase();
                                  };
                                  const batchDivision = getDivision(activeRequest.batch_location);
                                  const filtered = showAllAccommodations
                                    ? accommodations
                                    : accommodations.filter(acc => getDivision(acc.location) === batchDivision);

                                  if (filtered.length === 0) {
                                    return (
                                      <MenuItem value="" disabled>
                                        No properties found in {activeRequest.batch_location?.split(' > ')[0] || 'batch location'}. Check "Show all properties".
                                      </MenuItem>
                                    );
                                  }
                                  return filtered.map(acc => (
                                    <MenuItem key={acc.id} value={acc.id}>
                                      {acc.name} ({acc.location})
                                    </MenuItem>
                                  ));
                                })()}
                              </Select>
                            </FormControl>

                            {selectedAccommodationId && (() => {
                              const selectedAcc = accommodations.find(a => a.id === parseInt(selectedAccommodationId, 10));
                              if (!selectedAcc) return null;
                              return (
                                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, bgcolor: 'action.hover' }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                                    Property Summary: {selectedAcc.name}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                                    Location: {selectedAcc.location}
                                  </Typography>
                                  <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                                        ROOM TYPE
                                      </Typography>
                                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                        {selectedAcc.room_type === 'suite' ? 'Suite' : selectedAcc.room_type === 'single' ? 'Single' : 'Twin Share'} (${selectedAcc.room_unit_cost}/night)
                                      </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                                        CLASSROOM TYPE
                                      </Typography>
                                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                        {selectedAcc.classroom_type === 'conference_room' ? 'Conference Room' : 'Std Classroom'} (${selectedAcc.classroom_unit_cost}/day)
                                      </Typography>
                                    </Grid>
                                  </Grid>
                                  {/* Facilities */}
                                  <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 2 }}>
                                    {selectedAcc.has_wifi && <Chip label="WiFi" size="small" color="primary" variant="outlined" />}
                                    {selectedAcc.has_projector && <Chip label="Projector" size="small" color="primary" variant="outlined" />}
                                    {selectedAcc.has_whiteboard && <Chip label="Whiteboard" size="small" color="primary" variant="outlined" />}
                                    {selectedAcc.has_dining && <Chip label="Dining" size="small" color="primary" variant="outlined" />}
                                  </Stack>
                                </Paper>
                              );
                            })()}
                          </Box>
                        )}
                      </Box>
                    )}
                  </Box>
                ) : (
                  <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                    <Table size="medium">
                      <TableHead sx={{ bgcolor: 'action.hover' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>Item Name</TableCell>
                          <TableCell sx={{ fontWeight: 700 }} align="right">Requested Qty</TableCell>
                          <TableCell sx={{ fontWeight: 700 }} align="right">Available Stock</TableCell>
                          <TableCell sx={{ fontWeight: 700 }} align="center">Recommendation</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {items.map((reqItem) => {
                          const requested = reqItem.quantity || 0;
                          const available = reqItem.item_details?.quantity || 0;
                          const rec = getRecommendation(requested, available);

                          return (
                            <TableRow key={reqItem.id}>
                              <TableCell sx={{ fontWeight: 600 }}>{reqItem.item_details?.name}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700 }}>{requested}</TableCell>
                              <TableCell align="right">{available}</TableCell>
                              <TableCell align="center">
                                <Box sx={{
                                  px: 1.5,
                                  py: 0.75,
                                  borderRadius: 1.5,
                                  bgcolor: rec.bg,
                                  border: '1px solid',
                                  borderColor: rec.border,
                                  color: `${rec.color}.main`,
                                  fontWeight: 700,
                                  fontSize: '0.8rem',
                                  display: 'inline-block'
                                }}>
                                  {rec.text}
                                </Box>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </DialogContent>

              <DialogActions sx={{ p: 2.5 }}>
                <Button variant="outlined" onClick={handleCloseDialog} disabled={submitting}>
                  Cancel
                </Button>
                {!isApproved && (
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <Check />}
                    onClick={handleApprove}
                    disabled={submitting}
                    sx={{ fontWeight: 700 }}
                  >
                    Approve
                  </Button>
                )}
              </DialogActions>
            </>
          );
        })()}
      </Dialog>
    </Box>
  );
};

export default LogisticsRequests;
