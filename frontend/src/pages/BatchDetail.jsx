import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Grid,
  Breadcrumbs,
  Link,
  Divider,
  Tooltip,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Tabs,
  Tab,
  Chip,
  Stack,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import {
  ArrowBack,
  Add,
  CloudUpload,
  Download,
  Search,
  Edit,
  Delete,
  Refresh,
  Person,
  School,
  Save,
  CheckCircle,
  Cancel,
  AccessTime,
  CalendarToday,
  LocalShipping,
  Hotel,
  Devices,
  Lock,
  LockOpen
} from '@mui/icons-material';
import { useAuth, api } from '../context/AuthContext';

const BatchDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const canManageBatch = ['super_admin', 'program_supervisor', 'batch_manager', 'regional_manager'].includes(user?.role);

  const [batch, setBatch] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [regionalOffices, setRegionalOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog State - Manual Participant Add
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ first_name: '', last_name: '', email: '', phone_number: '' });
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addError, setAddError] = useState('');

  // Dialog State - Participant Edit
  const [editOpen, setEditOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [editForm, setEditForm] = useState({ first_name: '', last_name: '', email: '', phone_number: '' });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');

  // Dialog State - Participant Delete
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Dialog State - CSV Upload
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadUploading, setUploadUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadResult, setUploadResult] = useState(null);

  // Dialog State - Assign Trainer
  const [assignOpen, setAssignOpen] = useState(false);
  const [availableTrainers, setAvailableTrainers] = useState([]);
  const [selectedTrainerId, setSelectedTrainerId] = useState('');
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [assignError, setAssignError] = useState('');

  // Dialog State - Remove Trainer
  const [removeOpen, setRemoveOpen] = useState(false);
  const [trainerToRemove, setTrainerToRemove] = useState(null);
  const [removeSubmitting, setRemoveSubmitting] = useState(false);
  const [removeError, setRemoveError] = useState('');
  
  // Dialog State - Schedule Stage
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({ stage_type: '', format: 'online', start_date: '', end_date: '' });
  const [scheduleSubmitting, setScheduleSubmitting] = useState(false);
  const [scheduleError, setScheduleError] = useState('');
  const [selectedStageId, setSelectedStageId] = useState(null);
  const [stageError, setStageError] = useState('');
  const [selectedAttendanceStage, setSelectedAttendanceStage] = useState('basic');

  // Google Calendar Integration states for Trainers
  const [googleConfigured, setGoogleConfigured] = useState(false);
  const [googleLinked, setGoogleLinked] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState('');
  // Attendance state
  const [activeSubTab, setActiveSubTab] = useState(0);

  // Logistics request state variables
  const [logisticsRequest, setLogisticsRequest] = useState(null);
  const [logisticsLoading, setLogisticsLoading] = useState(false);
  const [availableItems, setAvailableItems] = useState([]);
  const [availableAccommodations, setAvailableAccommodations] = useState([]);
  const [logisticsDialogOpen, setLogisticsDialogOpen] = useState(false);
  const [logisticsSubmitting, setLogisticsSubmitting] = useState(false);
  const [logisticsError, setLogisticsError] = useState('');
  const [logisticsDeleteOpen, setLogisticsDeleteOpen] = useState(false);
  const [logisticsDeleteSubmitting, setLogisticsDeleteSubmitting] = useState(false);
  const [selectedLogisticsTab, setSelectedLogisticsTab] = useState('accommodation');

  const [logisticsForm, setLogisticsForm] = useState({
    accommodation: '',
    check_in_date: '',
    check_out_date: '',
    num_trainers: '',
    stationary_items: [],
    it_items: []
  });

  const fetchLogisticsData = async () => {
    setLogisticsLoading(true);
    setLogisticsError('');
    try {
      const [reqRes, itemsRes, accRes] = await Promise.all([
        api.get(`logistics/requests/?batch=${id}`),
        api.get('logistics/items/'),
        api.get('logistics/accommodations/')
      ]);
      setAvailableItems(itemsRes.data);
      setAvailableAccommodations(accRes.data);
      if (reqRes.data && reqRes.data.length > 0) {
        setLogisticsRequest(reqRes.data[0]);
      } else {
        setLogisticsRequest(null);
      }
    } catch (err) {
      console.error(err);
      setLogisticsError('Failed to load logistics request details.');
    } finally {
      setLogisticsLoading(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 3) {
      fetchLogisticsData();
    }
  }, [activeSubTab, id]);

  const handleOpenLogisticsDialog = () => {
    setLogisticsError('');
    if (logisticsRequest) {
      const itemsList = logisticsRequest.requested_items || [];
      const stationary = itemsList
        .filter(i => i.item_details?.category === 'stationary')
        .map(i => ({ item_id: i.item, quantity: i.quantity }));
      const it = itemsList
        .filter(i => i.item_details?.category === 'it')
        .map(i => ({ item_id: i.item, quantity: i.quantity }));

      setLogisticsForm({
        accommodation: logisticsRequest.accommodation || '',
        check_in_date: logisticsRequest.check_in_date || '',
        check_out_date: logisticsRequest.check_out_date || '',
        num_trainers: logisticsRequest.num_trainers || '',
        stationary_items: stationary,
        it_items: it,
        request_accommodation: !!logisticsRequest.check_in_date
      });
    } else {
      setLogisticsForm({
        accommodation: '',
        check_in_date: '',
        check_out_date: '',
        num_trainers: '',
        stationary_items: [],
        it_items: [],
        request_accommodation: false
      });
    }
    setLogisticsDialogOpen(true);
  };

  const handleLogisticsSubmit = async (e) => {
    e.preventDefault();
    setLogisticsError('');
    
    if (logisticsForm.request_accommodation) {
      if (!logisticsForm.check_in_date || !logisticsForm.check_out_date) {
        setLogisticsError('Please specify check-in and check-out dates.');
        return;
      }
      if (new Date(logisticsForm.check_in_date) > new Date(logisticsForm.check_out_date)) {
        setLogisticsError('Check-out date must be after check-in date.');
        return;
      }
      if (!logisticsForm.num_trainers || parseInt(logisticsForm.num_trainers, 10) <= 0) {
        setLogisticsError('Number of trainers must be at least 1.');
        return;
      }
    }

    const combinedItems = [
      ...logisticsForm.stationary_items.map(i => ({ ...i, source: 'stationary' })),
      ...logisticsForm.it_items.map(i => ({ ...i, source: 'it' }))
    ];

    const items_input = [];
    const itemIdsSeen = new Set();
    for (const entry of combinedItems) {
      if (!entry.item_id) continue;
      const itemId = parseInt(entry.item_id, 10);
      if (itemIdsSeen.has(itemId)) {
        setLogisticsError('Duplicate items requested. Please adjust quantities on a single row.');
        return;
      }
      itemIdsSeen.add(itemId);

      const qty = parseInt(entry.quantity, 10);
      if (isNaN(qty) || qty <= 0) {
        setLogisticsError('Quantity must be a positive integer.');
        return;
      }
      items_input.push({ item_id: itemId, quantity: qty });
    }

    setLogisticsSubmitting(true);
    try {
      const payload = {
        batch: parseInt(id, 10),
        accommodation: null,
        check_in_date: logisticsForm.request_accommodation ? logisticsForm.check_in_date : null,
        check_out_date: logisticsForm.request_accommodation ? logisticsForm.check_out_date : null,
        num_trainers: logisticsForm.request_accommodation ? parseInt(logisticsForm.num_trainers, 10) : null,
        items_input
      };

      if (logisticsRequest) {
        await api.put(`logistics/requests/${logisticsRequest.id}/`, payload);
      } else {
        await api.post('logistics/requests/', payload);
      }
      setLogisticsDialogOpen(false);
      fetchLogisticsData();
    } catch (err) {
      console.error(err);
      setLogisticsError(err.response?.data?.detail || 'An error occurred while saving the logistics request.');
    } finally {
      setLogisticsSubmitting(false);
    }
  };

  const handleLogisticsDelete = async () => {
    if (!logisticsRequest) return;
    setLogisticsDeleteSubmitting(true);
    try {
      await api.delete(`logistics/requests/${logisticsRequest.id}/`);
      setLogisticsDeleteOpen(false);
      fetchLogisticsData();
    } catch (err) {
      console.error(err);
      setLogisticsError('Failed to delete logistics request.');
    } finally {
      setLogisticsDeleteSubmitting(false);
    }
  };

  const handleAddFormRow = (type) => {
    if (type === 'stationary') {
      setLogisticsForm(prev => ({
        ...prev,
        stationary_items: [...prev.stationary_items, { item_id: '', quantity: 1 }]
      }));
    } else if (type === 'it') {
      setLogisticsForm(prev => ({
        ...prev,
        it_items: [...prev.it_items, { item_id: '', quantity: 1 }]
      }));
    }
  };

  const handleRemoveFormRow = (type, index) => {
    if (type === 'stationary') {
      setLogisticsForm(prev => ({
        ...prev,
        stationary_items: prev.stationary_items.filter((_, i) => i !== index)
      }));
    } else if (type === 'it') {
      setLogisticsForm(prev => ({
        ...prev,
        it_items: prev.it_items.filter((_, i) => i !== index)
      }));
    }
  };

  const handleFormRowChange = (type, index, field, value) => {
    if (type === 'stationary') {
      const updated = [...logisticsForm.stationary_items];
      updated[index] = { ...updated[index], [field]: value };
      setLogisticsForm(prev => ({ ...prev, stationary_items: updated }));
    } else if (type === 'it') {
      const updated = [...logisticsForm.it_items];
      updated[index] = { ...updated[index], [field]: value };
      setLogisticsForm(prev => ({ ...prev, it_items: updated }));
    }
  };

  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceSaving, setAttendanceSaving] = useState(false);
  const [attendanceSavedStatus, setAttendanceSavedStatus] = useState('none'); // 'saved', 'unsaved', 'none'
  const [attendanceError, setAttendanceError] = useState('');
  const [attendanceSuccess, setAttendanceSuccess] = useState('');



  const fetchBatchAndParticipants = async () => {
    setLoading(true);
    setError('');
    try {
      const [batchRes, participantsRes] = await Promise.all([
        api.get(`batches/${id}/`),
        api.get(`participants/?batch=${id}`)
      ]);
      setBatch(batchRes.data);
      setParticipants(participantsRes.data);
      // Auto-default attendanceDate to batch start_date if stage is 'basic'
      if (batchRes.data && batchRes.data.start_date) {
        setAttendanceDate(batchRes.data.start_date);
      }
      if (batchRes.data && batchRes.data.division) {
        const roRes = await api.get(`regional-offices/?division=${batchRes.data.division}`);
        setRegionalOffices(roRes.data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to retrieve batch and participant records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatchAndParticipants();
  }, [id]);
  // --- BATCH STAGE SCHEDULE HANDLERS ---
  const handleCompleteStage = async (stageId) => {
    setStageError('');
    try {
      await api.patch(`batch-stages/${stageId}/`, { status: 'completed' });
      fetchBatchAndParticipants();
    } catch (err) {
      console.error(err);
      setStageError(err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || 'Failed to complete stage.');
    }
  };

  const handleOpenScheduleDialog = (stageType, existingStage = null) => {
    setScheduleError('');
    if (existingStage) {
      setScheduleForm({
        stage_type: stageType,
        format: existingStage.format || 'online',
        start_date: existingStage.start_date || '',
        end_date: existingStage.end_date || ''
      });
      setSelectedStageId(existingStage.id);
    } else {
      setScheduleForm({
        stage_type: stageType,
        format: 'online',
        start_date: '',
        end_date: ''
      });
      setSelectedStageId(null);
    }
    setScheduleOpen(true);
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    setScheduleError('');
    
    if (!scheduleForm.start_date || !scheduleForm.end_date) {
      setScheduleError('Please specify start and end dates.');
      return;
    }
    if (new Date(scheduleForm.start_date) > new Date(scheduleForm.end_date)) {
      setScheduleError('End date cannot be before start date.');
      return;
    }

    setScheduleSubmitting(true);
    try {
      const payload = {
        format: scheduleForm.format,
        start_date: scheduleForm.start_date,
        end_date: scheduleForm.end_date,
        status: 'scheduled'
      };

      if (selectedStageId) {
        await api.patch(`batch-stages/${selectedStageId}/`, payload);
      } else {
        await api.post('batch-stages/', {
          ...payload,
          batch: parseInt(id, 10),
          stage_type: scheduleForm.stage_type
        });
      }
      setScheduleOpen(false);
      fetchBatchAndParticipants();
    } catch (err) {
      console.error(err);
      setScheduleError(
        err.response?.data?.detail || 
        err.response?.data?.non_field_errors?.[0] || 
        err.response?.data?.end_date?.[0] || 
        'An error occurred while saving the stage schedule.'
      );
    } finally {
      setScheduleSubmitting(false);
    }
  };


  // --- TRAINER ASSIGNMENT HANDLERS ---
  const fetchAvailableTrainers = async () => {
    try {
      const res = await api.get('users/?role=trainer,master_trainer');
      setAvailableTrainers(res.data);
    } catch (err) {
      console.error(err);
      setAssignError('Failed to load available trainers.');
    }
  };

  const handleAssignTrainerOpen = () => {
    setSelectedTrainerId('');
    setAssignError('');
    setAvailableTrainers([]);
    setAssignOpen(true);
    fetchAvailableTrainers();
  };

  const handleAssignTrainerSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTrainerId) return;
    setAssignSubmitting(true);
    setAssignError('');
    try {
      await api.post(`batches/${id}/assign_trainer/`, { user_id: selectedTrainerId });
      setAssignOpen(false);
      fetchBatchAndParticipants();
    } catch (err) {
      console.error(err);
      setAssignError(err.response?.data?.detail || 'Failed to assign trainer.');
    } finally {
      setAssignSubmitting(false);
    }
  };

  const handleRemoveTrainerOpen = (trainer) => {
    setTrainerToRemove(trainer);
    setRemoveError('');
    setRemoveOpen(true);
  };

  const handleRemoveTrainerSubmit = async () => {
    if (!trainerToRemove) return;
    setRemoveSubmitting(true);
    setRemoveError('');
    try {
      await api.post(`batches/${id}/remove_trainer/`, { user_id: trainerToRemove.id });
      setRemoveOpen(false);
      fetchBatchAndParticipants();
    } catch (err) {
      console.error(err);
      setRemoveError(err.response?.data?.detail || 'Failed to remove trainer.');
    } finally {
      setRemoveSubmitting(false);
    }
  };

  // --- GOOGLE CALENDAR SYNC HANDLERS ---
  const isTrainerRole = ['trainer', 'master_trainer'].includes(user?.role);

  const checkGoogleStatus = async () => {
    setGoogleLoading(true);
    try {
      const configRes = await api.get('google-integrations/config/status-check/');
      setGoogleConfigured(configRes.data.is_configured);

      if (isTrainerRole) {
        const statusRes = await api.get('google-integrations/oauth/connection-status/');
        setGoogleLinked(statusRes.data.is_linked);
        setGoogleEmail(statusRes.data.email || '');
      }
    } catch (err) {
      console.error('Failed to fetch Google Integration status:', err);
    } finally {
      setGoogleLoading(false);
    }
  };

  useEffect(() => {
    if (batch && user) {
      checkGoogleStatus();
    }
  }, [batch, user]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('google_success') === 'true') {
      window.history.replaceState({}, document.title, window.location.pathname);
      // Connected successfully banner will be shown automatically based on checkGoogleStatus
    } else if (params.get('google_error')) {
      const err = params.get('google_error');
      setGoogleError(err === 'auth_failed' ? 'Google Calendar authentication failed.' : 'Failed to connect Google Calendar.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleLinkGoogleCalendar = async () => {
    try {
      setGoogleLoading(true);
      setGoogleError('');
      const res = await api.get(`google-integrations/oauth/auth-url/?batch_id=${id}`);
      if (res.data.authorization_url) {
        window.location.href = res.data.authorization_url;
      } else {
        setGoogleError('Failed to generate Google auth URL.');
      }
    } catch (err) {
      console.error(err);
      setGoogleError(err.response?.data?.error || 'Failed to connect with Google Calendar.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleDisconnectGoogleCalendar = async () => {
    try {
      setGoogleLoading(true);
      setGoogleError('');
      await api.post('google-integrations/oauth/disconnect/');
      setGoogleLinked(false);
      setGoogleEmail('');
    } catch (err) {
      console.error(err);
      setGoogleError(err.response?.data?.error || 'Failed to unlink Google account.');
    } finally {
      setGoogleLoading(false);
    }
  };

  // --- ATTENDANCE SYSTEM HANDLERS ---
  const fetchAttendance = async () => {
    if (!id || !attendanceDate) return;
    setAttendanceLoading(true);
    setAttendanceError('');
    setAttendanceSuccess('');
    try {
      const stage = getStageData(selectedAttendanceStage);
      const stageParam = stage ? `&stage=${stage.id}` : '';
      const res = await api.get(`batches/${id}/get_attendance/?date=${attendanceDate}${stageParam}`);
      if (res.data && res.data.length > 0) {
        const recordsObj = {};
        res.data.forEach(rec => {
          recordsObj[rec.participant] = rec.status;
        });
        setAttendanceRecords(recordsObj);
        setAttendanceSavedStatus('saved');
      } else {
        const defaultRecords = {};
        participants.forEach(p => {
          defaultRecords[p.id] = 'present';
        });
        setAttendanceRecords(defaultRecords);
        setAttendanceSavedStatus('none');
      }
    } catch (err) {
      console.error(err);
      setAttendanceError(err.response?.data?.detail || 'Failed to load attendance records.');
    } finally {
      setAttendanceLoading(false);
    }
  };

  const handleSaveAttendance = async () => {
    if (!attendanceDate) return;
    setAttendanceSaving(true);
    setAttendanceError('');
    setAttendanceSuccess('');
    const recordsPayload = Object.keys(attendanceRecords).map(key => ({
      participant_id: parseInt(key, 10),
      status: attendanceRecords[key]
    }));
    try {
      const stage = getStageData(selectedAttendanceStage);
      await api.post(`batches/${id}/save_attendance/`, {
        date: attendanceDate,
        records: recordsPayload,
        stage: stage ? stage.id : null
      });
      setAttendanceSavedStatus('saved');
      setAttendanceSuccess('Attendance recorded and saved successfully!');
    } catch (err) {
      console.error(err);
      setAttendanceError(err.response?.data?.detail || 'Failed to save attendance records.');
    } finally {
      setAttendanceSaving(false);
    }
  };

  const handleStatusChange = (participantId, newStatus) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [participantId]: newStatus
    }));
    setAttendanceSavedStatus('unsaved');
  };

  const handleMarkAllStatus = (statusVal) => {
    const updated = {};
    participants.forEach(p => {
      updated[p.id] = statusVal;
    });
    setAttendanceRecords(updated);
    setAttendanceSavedStatus('unsaved');
  };

  useEffect(() => {
    if (activeSubTab === 2 && participants.length > 0) {
      fetchAttendance();
    }
  }, [activeSubTab, attendanceDate, participants, selectedAttendanceStage]);



  // --- MANUAL ADD ---
  const handleAddOpen = () => {
    setAddForm({ first_name: '', last_name: '', email: '', phone_number: '' });
    setAddError('');
    setAddOpen(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!addForm.first_name || !addForm.last_name || !addForm.email) {
      setAddError('Please fill in all required fields.');
      return;
    }
    setAddSubmitting(true);
    setAddError('');
    try {
      await api.post(`batches/${id}/add_participant/`, addForm);
      setAddOpen(false);
      fetchBatchAndParticipants();
    } catch (err) {
      console.error(err);
      setAddError(err.response?.data?.detail || 'Failed to add participant.');
    } finally {
      setAddSubmitting(false);
    }
  };

  // --- MANUAL EDIT ---
  const handleEditOpen = (p) => {
    setSelectedParticipant(p);
    setEditForm({
      first_name: p.first_name,
      last_name: p.last_name,
      email: p.email,
      phone_number: p.phone_number || ''
    });
    setEditError('');
    setEditOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.first_name || !editForm.last_name || !editForm.email) {
      setEditError('Please fill in all required fields.');
      return;
    }
    setEditSubmitting(true);
    setEditError('');
    try {
      await api.patch(`participants/${selectedParticipant.id}/`, editForm);
      setEditOpen(false);
      fetchBatchAndParticipants();
    } catch (err) {
      console.error(err);
      setEditError(err.response?.data?.detail || 'Failed to edit participant details.');
    } finally {
      setEditSubmitting(false);
    }
  };

  // --- MANUAL DELETE ---
  const handleDeleteOpen = (p) => {
    setSelectedParticipant(p);
    setDeleteError('');
    setDeleteOpen(true);
  };

  const handleDeleteSubmit = async () => {
    setDeleteSubmitting(true);
    setDeleteError('');
    try {
      await api.delete(`participants/${selectedParticipant.id}/`);
      setDeleteOpen(false);
      fetchBatchAndParticipants();
    } catch (err) {
      console.error(err);
      setDeleteError(err.response?.data?.detail || 'Failed to delete participant record.');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  // --- CSV UPLOAD ---
  const handleUploadOpen = () => {
    setUploadFile(null);
    setUploadError('');
    setUploadResult(null);
    setUploadOpen(true);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadFile(e.target.files[0]);
      setUploadError('');
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError('Please choose a file first.');
      return;
    }
    setUploadUploading(true);
    setUploadError('');
    const formData = new FormData();
    formData.append('file', uploadFile);

    try {
      const response = await api.post(`batches/${id}/upload_participants/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setUploadResult(response.data);
      fetchBatchAndParticipants();
    } catch (err) {
      console.error(err);
      setUploadError(err.response?.data?.detail || 'Failed to parse and upload CSV.');
    } finally {
      setUploadUploading(false);
    }
  };

  const downloadCSVTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,first_name,last_name,email,phone_number\nKabir,Chowdhury,kabir@tms.com,01700000001\nFatima,Khatun,fatima@tms.com,";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "tms_participants_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Search filter
  const filteredParticipants = participants.filter((p) => {
    const query = searchQuery.toLowerCase();
    const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
    return (
      fullName.includes(query) ||
      p.email.toLowerCase().includes(query) ||
      p.participant_id.toLowerCase().includes(query)
    );
  });

  const canEditStages = canManageBatch || batch?.trainers_details?.some(t => t.id === user?.id);

  const getStageData = (stageType) => {
    return batch?.stages?.find(s => s.stage_type === stageType) || null;
  };

  const currentStage = getStageData(selectedAttendanceStage);
  const isStageScheduled = selectedAttendanceStage === 'basic' || !!(currentStage && currentStage.start_date);
  const minDate = selectedAttendanceStage === 'basic' 
    ? (currentStage?.start_date || batch?.start_date || '') 
    : (currentStage?.start_date || '');
  const maxDate = selectedAttendanceStage === 'basic' 
    ? (currentStage?.end_date || batch?.start_date || '') 
    : (currentStage?.end_date || '');

  const handleStageChange = (e) => {
    const stageType = e.target.value;
    setSelectedAttendanceStage(stageType);
    const stageObj = getStageData(stageType);
    if (stageType === 'basic') {
      setAttendanceDate(stageObj?.start_date || batch?.start_date || '');
    } else {
      setAttendanceDate(stageObj?.start_date || '');
    }
    setAttendanceSavedStatus('none');
  };

  const handleUpdateParticipantOffice = async (participantId, officeId) => {
    try {
      await api.patch(`participants/${participantId}/`, {
        regional_office: officeId || null
      });
      setParticipants(prev => prev.map(p => {
        if (p.id === participantId) {
          const matchedOffice = regionalOffices.find(ro => ro.id === officeId);
          return {
            ...p,
            regional_office: officeId,
            regional_office_details: matchedOffice || null
          };
        }
        return p;
      }));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && !batch) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Breadcrumbs */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link underline="hover" color="inherit" href="/trainees" sx={{ cursor: 'pointer', fontWeight: 600 }}>
          Trainee Management
        </Link>
        <Typography color="text.primary" sx={{ fontWeight: 600 }}>Batch Detail</Typography>
      </Breadcrumbs>

      {/* Header Panel */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <IconButton onClick={() => navigate('/trainees')} color="primary" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <ArrowBack />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.5px' }}>
              {batch?.batch_name}
            </Typography>

          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Cohort: <strong>{batch?.cohort_details?.name} ({batch?.cohort_details?.cohort_code})</strong> | Location: <strong>{batch?.location}</strong> | Start Date: <strong>{batch?.start_date}</strong>
          </Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}


      {/* Trainees Workspace */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 0.5 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ width: 44, height: 44, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'primary.light', color: 'primary.main' }}>
                  <Person />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Enrolled Trainees
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>
                    {participants.length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 0.5 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ width: 44, height: 44, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'secondary.light', color: 'secondary.main' }}>
                  <School />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Assigned Trainers
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>
                    {batch?.trainers_details?.length || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tab Selector */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeSubTab} onChange={(e, val) => setActiveSubTab(val)} aria-label="batch sub tabs">
          <Tab label="Trainees" sx={{ fontWeight: 600 }} />
          <Tab label="Trainers" sx={{ fontWeight: 600 }} />
          <Tab label="Attendance Tracking" sx={{ fontWeight: 600 }} />
          <Tab label="Logistics" sx={{ fontWeight: 600 }} />
          <Tab label="Stage Schedule" sx={{ fontWeight: 600 }} />
        </Tabs>
      </Box>

      {activeSubTab === 0 && (
        <Box>
          {/* Search & Actions Panel */}
          <Card sx={{ mb: 4 }}>
            <CardContent sx={{ py: 2.5 }}>
              <Grid container spacing={2} alignItems="center" justifyContent="space-between">
                <Grid item xs={12} md={5}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Search by ID, Name or Email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                      startAdornment: <Search color="action" fontSize="small" sx={{ mr: 1 }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={7} sx={{ display: 'flex', gap: 1.5, justifyContent: { md: 'flex-end' } }}>
                  <IconButton onClick={fetchBatchAndParticipants} disabled={loading} color="primary" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <Refresh />
                  </IconButton>
                  <Button
                    variant="outlined"
                    startIcon={<CloudUpload />}
                    onClick={handleUploadOpen}
                    sx={{ fontWeight: 700, borderRadius: 2 }}
                  >
                    Import CSV
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={handleAddOpen}
                    sx={{
                      background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                      color: '#fff',
                      fontWeight: 700,
                      borderRadius: 2
                    }}
                  >
                    Add Trainee
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Participants Table */}
          <Card sx={{ mb: 4 }}>
            <CardContent sx={{ p: 0 }}>
              <TableContainer component={Paper} elevation={0} sx={{ border: 'none' }}>
                <Table>
                  <TableHead sx={{ bgcolor: (theme) => theme.palette.mode === 'light' ? '#f8fafc' : '#1e293b' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Participant ID</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Phone Number</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Regional Office</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredParticipants.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                          {searchQuery ? "No matching participants found." : "No trainees added to this batch yet. Add manually or import via CSV."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredParticipants.map((p) => (
                        <TableRow key={p.id} hover>
                          <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>
                            {p.participant_id}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>
                            {p.first_name} {p.last_name}
                          </TableCell>
                          <TableCell>{p.email}</TableCell>
                          <TableCell>{p.phone_number || '-'}</TableCell>
                          <TableCell sx={{ minWidth: 180 }}>
                            {canManageBatch ? (
                              <FormControl size="small" fullWidth sx={{ minWidth: 160 }}>
                                <Select
                                  value={p.regional_office || ''}
                                  onChange={(e) => handleUpdateParticipantOffice(p.id, e.target.value ? parseInt(e.target.value, 10) : null)}
                                  displayEmpty
                                  sx={{ 
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                    '& .MuiSelect-select': { py: 1 }
                                  }}
                                >
                                  <MenuItem value="">
                                    <em>None</em>
                                  </MenuItem>
                                  {regionalOffices.map((ro) => (
                                    <MenuItem key={ro.id} value={ro.id}>
                                      {ro.name}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            ) : (
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {p.regional_office_details?.name || '-'}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <IconButton size="small" onClick={() => handleEditOpen(p)} color="primary" sx={{ mr: 1 }}>
                              <Edit fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleDeleteOpen(p)} color="error">
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
        </Box>
      )}

      {activeSubTab === 1 && (
        <Box>
          {/* Google Calendar Connection Card for Trainers and Admins/Managers */}
          {((isTrainerRole && batch?.trainers_details?.some(t => t.id === user?.id)) || canManageBatch) && (
            <Card sx={{ mb: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider', position: 'relative', overflow: 'hidden', boxShadow: 'none' }}>
              <Box sx={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', bgcolor: !googleConfigured ? 'warning.main' : (isTrainerRole ? (googleLinked ? 'success.main' : 'primary.main') : 'success.main') }} />
              <CardContent sx={{ p: 3 }}>
                <Grid container spacing={3} alignItems="center">
                  <Grid item xs={12} md={8}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ 
                        width: 44, 
                        height: 44, 
                        borderRadius: 2, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        bgcolor: !googleConfigured ? 'warning.light' : (isTrainerRole ? (googleLinked ? 'success.light' : 'primary.light') : 'success.light'), 
                        color: !googleConfigured ? 'warning.main' : (isTrainerRole ? (googleLinked ? 'success.main' : 'primary.main') : 'success.main') 
                      }}>
                        <CalendarToday />
                      </Box>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                          {!googleConfigured 
                            ? 'Google Calendar Sync Not Configured' 
                            : isTrainerRole 
                              ? (googleLinked 
                                ? 'Schedules are synchronized with Google Calendar automatically' 
                                : 'Link Your Google Calendar')
                              : 'Google Calendar Integration Configured'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {!googleConfigured 
                            ? 'The System Administrator has not configured the Google OAuth credentials yet. Please contact admin to enable calendar sync.' 
                            : isTrainerRole 
                              ? (googleLinked 
                                ? `Connected to Google Account: ${googleEmail}. All batch start dates you are assigned to will automatically publish to your calendar.` 
                                : 'Connect your Google account to automatically sync your batch start dates to your personal Google Calendar.')
                              : 'Google Calendar sync is globally configured. Trainers assigned to this batch can link their personal Google accounts to synchronize their schedules automatically.'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: { md: 'flex-end' } }}>
                    {googleLoading ? (
                      <CircularProgress size={24} />
                    ) : !googleConfigured ? (
                      user?.role === 'super_admin' ? (
                        <Button 
                          variant="contained" 
                          color="warning" 
                          onClick={() => navigate('/google-integrations')}
                          sx={{ borderRadius: 2, fontWeight: 700 }}
                        >
                          Configure OAuth
                        </Button>
                      ) : (
                        <Button variant="outlined" disabled color="warning" sx={{ borderRadius: 2, fontWeight: 700 }}>
                          OAuth Unavailable
                        </Button>
                      )
                    ) : isTrainerRole ? (
                      googleLinked ? (
                        <Button 
                          variant="outlined" 
                          color="error" 
                          onClick={handleDisconnectGoogleCalendar}
                          sx={{ borderRadius: 2, fontWeight: 700 }}
                        >
                          Disconnect Google Account
                        </Button>
                      ) : (
                        <Button 
                          variant="contained" 
                          color="primary" 
                          onClick={handleLinkGoogleCalendar}
                          sx={{ 
                            borderRadius: 2, 
                            fontWeight: 700,
                            background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                            color: '#fff',
                          }}
                        >
                          Link Google Calendar
                        </Button>
                      )
                    ) : (
                      <Chip 
                        label="Globally Active" 
                        color="success" 
                        sx={{ fontWeight: 700, borderRadius: 1.5 }}
                      />
                    )}
                  </Grid>
                </Grid>
                {googleError && <Alert severity="error" sx={{ mt: 2 }}>{googleError}</Alert>}
              </CardContent>
            </Card>
          )}

          {/* Header Action Panel */}
          <Card sx={{ mb: 4 }}>
            <CardContent sx={{ py: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  Instructors & Trainers
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Manage the trainers and master trainers assigned to instruct this batch.
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleAssignTrainerOpen}
                sx={{
                  background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                  color: '#fff',
                  fontWeight: 700,
                  borderRadius: 2
                }}
              >
                Assign Trainer
              </Button>
            </CardContent>
          </Card>

          {/* Trainers Grid Cards */}
          {!batch?.trainers_details || batch.trainers_details.length === 0 ? (
            <Card sx={{ py: 8, textAlign: 'center', bgcolor: 'background.paper' }}>
              <School color="action" sx={{ fontSize: 64, mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 700 }} color="text.secondary">
                No trainers assigned to this batch.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Assign trainers to enable them to take attendance and manage class details.
              </Typography>
              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={handleAssignTrainerOpen}
                sx={{ fontWeight: 700, borderRadius: 2 }}
              >
                Assign First Trainer
              </Button>
            </Card>
          ) : (
            <Grid container spacing={3}>
              {batch.trainers_details.map((trainer) => (
                <Grid item xs={12} sm={6} md={4} key={trainer.id}>
                  <Card sx={{ position: 'relative', height: '100%', border: '1px solid', borderColor: 'divider' }}>
                    <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'primary.light', color: 'primary.main', fontWeight: 800, fontSize: 18 }}>
                        {trainer.first_name[0].toUpperCase()}{trainer.last_name[0].toUpperCase()}
                      </Box>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body1" sx={{ fontWeight: 700 }}>
                          {trainer.first_name} {trainer.last_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                          {trainer.email}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
                          <Typography variant="caption" sx={{ px: 1, py: 0.25, bgcolor: trainer.role === 'master_trainer' ? 'error.light' : 'info.light', color: trainer.role === 'master_trainer' ? 'error.main' : 'info.main', borderRadius: 1, fontWeight: 700, fontSize: '9px', textTransform: 'uppercase' }}>
                            {trainer.role === 'master_trainer' ? 'Master Trainer' : 'Trainer'}
                          </Typography>
                          {googleConfigured && (
                            <Typography variant="caption" sx={{ px: 1, py: 0.25, bgcolor: trainer.is_google_linked ? 'success.light' : 'action.selected', color: trainer.is_google_linked ? 'success.main' : 'text.secondary', borderRadius: 1, fontWeight: 700, fontSize: '9px', textTransform: 'uppercase' }}>
                              {trainer.is_google_linked ? 'Google Linked' : 'Google Pending'}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveTrainerOpen(trainer)}
                        sx={{ position: 'absolute', top: 12, right: 12 }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {activeSubTab === 2 && (
        <Box>
          {/* Header Actions Card */}
          <Card sx={{ mb: 4 }}>
            <CardContent sx={{ py: 2.5 }}>
              <Grid container spacing={2} alignItems="center" justifyContent="space-between">
                <Grid item xs={12} md={7} sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel id="attendance-stage-label">Training Stage</InputLabel>
                    <Select
                      labelId="attendance-stage-label"
                      id="attendance-stage-select"
                      value={selectedAttendanceStage}
                      label="Training Stage"
                      onChange={handleStageChange}
                      disabled={attendanceLoading || attendanceSaving}
                    >
                      <MenuItem value="basic">Basic Training</MenuItem>
                      <MenuItem value="refresher_1">Refresher Course 1</MenuItem>
                      <MenuItem value="refresher_2">Refresher Course 2</MenuItem>
                    </Select>
                  </FormControl>

                  <TextField
                    type="date"
                    label="Attendance Date"
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ min: minDate, max: maxDate }}
                    value={attendanceDate}
                    onChange={(e) => {
                      setAttendanceDate(e.target.value);
                      setAttendanceSavedStatus('none');
                    }}
                    disabled={attendanceLoading || attendanceSaving || !isStageScheduled}
                  />
                  {attendanceSavedStatus === 'saved' && (
                    <Alert icon={<CheckCircle fontSize="inherit" />} severity="success" sx={{ py: 0.25, px: 2, '& .MuiAlert-message': { py: 0.25 } }}>
                      Saved
                    </Alert>
                  )}
                  {attendanceSavedStatus === 'unsaved' && (
                    <Alert severity="warning" sx={{ py: 0.25, px: 2, '& .MuiAlert-message': { py: 0.25 } }}>
                      Unsaved changes
                    </Alert>
                  )}
                  {attendanceSavedStatus === 'none' && (
                    <Alert severity="info" sx={{ py: 0.25, px: 2, '& .MuiAlert-message': { py: 0.25 } }}>
                      No record
                    </Alert>
                  )}
                </Grid>
                <Grid item xs={12} md={5} sx={{ display: 'flex', gap: 1.5, justifyContent: { md: 'flex-end' } }}>
                  <Button
                    variant="outlined"
                    color="success"
                    size="small"
                    startIcon={<CheckCircle />}
                    onClick={() => handleMarkAllStatus('present')}
                    disabled={attendanceLoading || attendanceSaving || participants.length === 0 || !isStageScheduled}
                    sx={{ fontWeight: 700, borderRadius: 1.5 }}
                  >
                    All Present
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    startIcon={<Cancel />}
                    onClick={() => handleMarkAllStatus('absent')}
                    disabled={attendanceLoading || attendanceSaving || participants.length === 0 || !isStageScheduled}
                    sx={{ fontWeight: 700, borderRadius: 1.5 }}
                  >
                    All Absent
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<Save />}
                    onClick={handleSaveAttendance}
                    disabled={attendanceLoading || attendanceSaving || participants.length === 0 || !isStageScheduled}
                    sx={{
                      background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                      color: '#fff',
                      fontWeight: 700,
                      borderRadius: 2
                    }}
                  >
                    {attendanceSaving ? <CircularProgress size={24} color="inherit" /> : 'Save Attendance'}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {attendanceError && <Alert severity="error" sx={{ mb: 3 }}>{attendanceError}</Alert>}
          {attendanceSuccess && <Alert severity="success" sx={{ mb: 3 }}>{attendanceSuccess}</Alert>}

          {!isStageScheduled ? (
            <Alert severity="warning" sx={{ mb: 4, py: 2, borderRadius: 2, fontWeight: 600 }}>
              This training stage has not been scheduled yet. Please schedule it first under the Stage Schedule tab.
            </Alert>
          ) : (
            <Grid container spacing={3}>
              {/* Left Column: Attendance Status Selector Table */}
              <Grid item xs={12} lg={8}>
                <Card sx={{ mb: 4 }}>
                  <CardContent sx={{ p: 0 }}>
                    <TableContainer component={Paper} elevation={0} sx={{ border: 'none' }}>
                      <Table>
                        <TableHead sx={{ bgcolor: (theme) => theme.palette.mode === 'light' ? '#f8fafc' : '#1e293b' }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>Trainee Name</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Participant ID</TableCell>
                            <TableCell sx={{ fontWeight: 700 }} align="center">Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {attendanceLoading ? (
                            <TableRow>
                              <TableCell colSpan={3} align="center" sx={{ py: 6 }}>
                                <CircularProgress />
                              </TableCell>
                            </TableRow>
                          ) : participants.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={3} align="center" sx={{ py: 6 }}>
                                No trainees enrolled in this batch.
                              </TableCell>
                            </TableRow>
                          ) : (
                            participants.map((p) => {
                              const currentStatus = attendanceRecords[p.id] || 'present';
                              return (
                                <TableRow key={p.id} hover>
                                  <TableCell sx={{ fontWeight: 600 }}>
                                    {p.first_name} {p.last_name}
                                  </TableCell>
                                  <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>
                                    {p.participant_id}
                                  </TableCell>
                                  <TableCell align="center">
                                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                                      <Button
                                        size="small"
                                        variant={currentStatus === 'present' ? 'contained' : 'outlined'}
                                        color="success"
                                        startIcon={currentStatus === 'present' ? <CheckCircle /> : null}
                                        onClick={() => handleStatusChange(p.id, 'present')}
                                        sx={{ 
                                          borderRadius: 1.5,
                                          fontWeight: 700,
                                          textTransform: 'none',
                                          px: 2,
                                          py: 0.5,
                                          minWidth: '95px'
                                        }}
                                      >
                                        Present
                                      </Button>
                                      <Button
                                        size="small"
                                        variant={currentStatus === 'late' ? 'contained' : 'outlined'}
                                        color="warning"
                                        startIcon={currentStatus === 'late' ? <AccessTime /> : null}
                                        onClick={() => handleStatusChange(p.id, 'late')}
                                        sx={{ 
                                          borderRadius: 1.5,
                                          fontWeight: 700,
                                          textTransform: 'none',
                                          px: 2,
                                          py: 0.5,
                                          minWidth: '90px'
                                        }}
                                      >
                                        Late
                                      </Button>
                                      <Button
                                        size="small"
                                        variant={currentStatus === 'absent' ? 'contained' : 'outlined'}
                                        color="error"
                                        startIcon={currentStatus === 'absent' ? <Cancel /> : null}
                                        onClick={() => handleStatusChange(p.id, 'absent')}
                                        sx={{ 
                                          borderRadius: 1.5,
                                          fontWeight: 700,
                                          textTransform: 'none',
                                          px: 2,
                                          py: 0.5,
                                          minWidth: '90px'
                                        }}
                                      >
                                        Absent
                                      </Button>
                                    </Box>
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>

              {/* Right Column: Attendance Statistics Summary */}
              <Grid item xs={12} lg={4}>
                <Card>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                      Daily Metrics ({attendanceDate})
                    </Typography>
                    <Divider sx={{ mb: 2.5 }} />

                    {(() => {
                      const total = participants.length;
                      const present = Object.values(attendanceRecords).filter(v => v === 'present').length;
                      const late = Object.values(attendanceRecords).filter(v => v === 'late').length;
                      const absent = Object.values(attendanceRecords).filter(v => v === 'absent').length;
                      const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

                      return (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                          <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                                Attendance Rate (Present + Late)
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 800, color: rate > 80 ? 'success.main' : rate > 50 ? 'warning.main' : 'error.main' }}>
                                {rate}%
                              </Typography>
                            </Box>
                            <Box sx={{ height: 8, bgcolor: 'action.hover', borderRadius: 1, overflow: 'hidden' }}>
                              <Box 
                                sx={{ 
                                  height: '100%', 
                                  width: `${rate}%`, 
                                  bgcolor: rate > 80 ? 'success.main' : rate > 50 ? 'warning.main' : 'error.main',
                                  transition: 'width 0.3s ease'
                                }} 
                              />
                            </Box>
                          </Box>

                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                                Total Trainees:
                              </Typography>
                              <Typography variant="body1" sx={{ fontWeight: 700 }}>
                                {total}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body2" color="success.main" sx={{ fontWeight: 700 }}>
                                Present:
                              </Typography>
                              <Typography variant="body1" sx={{ fontWeight: 700, color: 'success.main' }}>
                                {present}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body2" color="warning.main" sx={{ fontWeight: 700 }}>
                                Late:
                              </Typography>
                              <Typography variant="body1" sx={{ fontWeight: 700, color: 'warning.main' }}>
                                {late}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body2" color="error.main" sx={{ fontWeight: 700 }}>
                                Absent:
                              </Typography>
                              <Typography variant="body1" sx={{ fontWeight: 700, color: 'error.main' }}>
                                {absent}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      );
                    })()}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </Box>
      )}

      {activeSubTab === 3 && (
        <Box>
          {logisticsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : logisticsRequest ? (
            <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
                      Logistics Request Summary
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Created by: <strong>{logisticsRequest.created_by_email || logisticsRequest.created_by || 'Trainer'}</strong> on {new Date(logisticsRequest.created_at).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1.5}>
                    <Button variant="outlined" startIcon={<Edit />} onClick={handleOpenLogisticsDialog}>
                      Modify Request
                    </Button>
                    <Button variant="contained" color="error" startIcon={<Delete />} onClick={() => setLogisticsDeleteOpen(true)}>
                      Delete Request
                    </Button>
                  </Stack>
                </Box>

                <Grid container spacing={3} sx={{ mb: 4 }}>
                  {/* Accommodation Card */}
                  <Grid item xs={12} md={4}>
                    <Card
                      onClick={() => setSelectedLogisticsTab('accommodation')}
                      sx={{
                        cursor: 'pointer',
                        borderRadius: 3,
                        border: '2px solid',
                        borderColor: selectedLogisticsTab === 'accommodation' ? 'primary.main' : 'divider',
                        boxShadow: selectedLogisticsTab === 'accommodation' ? 3 : 1,
                        transform: selectedLogisticsTab === 'accommodation' ? 'translateY(-2px)' : 'none',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: 2,
                          borderColor: selectedLogisticsTab === 'accommodation' ? 'primary.main' : 'primary.light'
                        },
                        bgcolor: selectedLogisticsTab === 'accommodation' ? 'action.selected' : 'background.paper',
                        p: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        height: '100%',
                        justifyContent: 'center'
                      }}
                    >
                      <Box sx={{ 
                        p: 1.5, 
                        borderRadius: '50%', 
                        bgcolor: selectedLogisticsTab === 'accommodation' ? 'primary.light' : 'action.hover',
                        color: selectedLogisticsTab === 'accommodation' ? 'primary.main' : 'text.secondary',
                        mb: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Hotel sx={{ fontSize: 28 }} />
                      </Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                        Accommodation
                      </Typography>
                      {logisticsRequest.check_in_date ? (
                        <Chip
                          label={logisticsRequest.accommodation_status === 'approved' ? 'Approved' : 'Pending'}
                          color={logisticsRequest.accommodation_status === 'approved' ? 'success' : 'warning'}
                          size="small"
                          sx={{ fontWeight: 700, px: 1 }}
                        />
                      ) : (
                        <Chip
                          label="Not Requested"
                          variant="outlined"
                          size="small"
                          sx={{ fontWeight: 600, px: 1, color: 'text.secondary', borderColor: 'divider' }}
                        />
                      )}
                    </Card>
                  </Grid>

                  {/* Stationary Card */}
                  <Grid item xs={12} md={4}>
                    <Card
                      onClick={() => setSelectedLogisticsTab('stationary')}
                      sx={{
                        cursor: 'pointer',
                        borderRadius: 3,
                        border: '2px solid',
                        borderColor: selectedLogisticsTab === 'stationary' ? 'primary.main' : 'divider',
                        boxShadow: selectedLogisticsTab === 'stationary' ? 3 : 1,
                        transform: selectedLogisticsTab === 'stationary' ? 'translateY(-2px)' : 'none',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: 2,
                          borderColor: selectedLogisticsTab === 'stationary' ? 'primary.main' : 'primary.light'
                        },
                        bgcolor: selectedLogisticsTab === 'stationary' ? 'action.selected' : 'background.paper',
                        p: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        height: '100%',
                        justifyContent: 'center'
                      }}
                    >
                      <Box sx={{ 
                        p: 1.5, 
                        borderRadius: '50%', 
                        bgcolor: selectedLogisticsTab === 'stationary' ? 'primary.light' : 'action.hover',
                        color: selectedLogisticsTab === 'stationary' ? 'primary.main' : 'text.secondary',
                        mb: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <LocalShipping sx={{ fontSize: 28 }} />
                      </Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                        Stationary Items
                      </Typography>
                      {logisticsRequest.requested_items.filter(i => i.item_details?.category === 'stationary').length > 0 ? (
                        <Chip
                          label={logisticsRequest.stationary_status === 'approved' ? 'Approved' : 'Pending'}
                          color={logisticsRequest.stationary_status === 'approved' ? 'success' : 'warning'}
                          size="small"
                          sx={{ fontWeight: 700, px: 1 }}
                        />
                      ) : (
                        <Chip
                          label="Not Requested"
                          variant="outlined"
                          size="small"
                          sx={{ fontWeight: 600, px: 1, color: 'text.secondary', borderColor: 'divider' }}
                        />
                      )}
                    </Card>
                  </Grid>

                  {/* IT Assets Card */}
                  <Grid item xs={12} md={4}>
                    <Card
                      onClick={() => setSelectedLogisticsTab('it')}
                      sx={{
                        cursor: 'pointer',
                        borderRadius: 3,
                        border: '2px solid',
                        borderColor: selectedLogisticsTab === 'it' ? 'primary.main' : 'divider',
                        boxShadow: selectedLogisticsTab === 'it' ? 3 : 1,
                        transform: selectedLogisticsTab === 'it' ? 'translateY(-2px)' : 'none',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: 2,
                          borderColor: selectedLogisticsTab === 'it' ? 'primary.main' : 'primary.light'
                        },
                        bgcolor: selectedLogisticsTab === 'it' ? 'action.selected' : 'background.paper',
                        p: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        height: '100%',
                        justifyContent: 'center'
                      }}
                    >
                      <Box sx={{ 
                        p: 1.5, 
                        borderRadius: '50%', 
                        bgcolor: selectedLogisticsTab === 'it' ? 'primary.light' : 'action.hover',
                        color: selectedLogisticsTab === 'it' ? 'primary.main' : 'text.secondary',
                        mb: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Devices sx={{ fontSize: 28 }} />
                      </Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                        IT Assets
                      </Typography>
                      {logisticsRequest.requested_items.filter(i => i.item_details?.category === 'it').length > 0 ? (
                        <Chip
                          label={logisticsRequest.it_status === 'approved' ? 'Approved' : 'Pending'}
                          color={logisticsRequest.it_status === 'approved' ? 'success' : 'warning'}
                          size="small"
                          sx={{ fontWeight: 700, px: 1 }}
                        />
                      ) : (
                        <Chip
                          label="Not Requested"
                          variant="outlined"
                          size="small"
                          sx={{ fontWeight: 600, px: 1, color: 'text.secondary', borderColor: 'divider' }}
                        />
                      )}
                    </Card>
                  </Grid>
                </Grid>

                {/* Detail Panel */}
                <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, bgcolor: 'background.paper' }}>
                  {selectedLogisticsTab === 'accommodation' && (
                    <Box>
                      {logisticsRequest.check_in_date ? (
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                            <Hotel color="primary" sx={{ fontSize: 28 }} />
                            <Typography variant="h6" sx={{ fontWeight: 800 }}>
                              Accommodation Details
                            </Typography>
                          </Box>
                          <Grid container spacing={3} sx={{ mb: 3 }}>
                            <Grid item xs={12} sm={4}>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 700, letterSpacing: '0.5px' }}>
                                DATES REQUESTED
                              </Typography>
                              <Typography variant="body1" sx={{ fontWeight: 700, mt: 0.5 }}>
                                {new Date(logisticsRequest.check_in_date).toLocaleDateString()} - {new Date(logisticsRequest.check_out_date).toLocaleDateString()}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 700, letterSpacing: '0.5px' }}>
                                DURATION
                              </Typography>
                              <Typography variant="body1" sx={{ fontWeight: 700, mt: 0.5 }}>
                                {Math.max(1, Math.ceil((new Date(logisticsRequest.check_out_date) - new Date(logisticsRequest.check_in_date)) / (1000 * 60 * 60 * 24)))} nights
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 700, letterSpacing: '0.5px' }}>
                                NUMBER OF TRAINERS
                              </Typography>
                              <Typography variant="body1" sx={{ fontWeight: 700, mt: 0.5 }}>
                                {logisticsRequest.num_trainers} {logisticsRequest.num_trainers === 1 ? 'trainer' : 'trainers'}
                              </Typography>
                            </Grid>
                          </Grid>

                          {logisticsRequest.accommodation_status === 'approved' && logisticsRequest.accommodation_details ? (
                            <Box sx={{ mt: 3, pt: 3, borderTop: '1px dashed', borderColor: 'divider' }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, color: 'success.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CheckCircle fontSize="small" /> Approved Property Assignment
                              </Typography>
                              
                              <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                  <Card variant="outlined" sx={{ p: 2.5, borderRadius: 2, height: '100%', bgcolor: 'action.hover' }}>
                                    <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700, mb: 0.5 }}>
                                      PROPERTY NAME
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 700, mb: 1 }}>
                                      {logisticsRequest.accommodation_details.name}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      {logisticsRequest.accommodation_details.location}
                                    </Typography>
                                  </Card>
                                </Grid>
                                
                                <Grid item xs={12} md={6}>
                                  <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>
                                        ROOM ASSIGNMENT
                                      </Typography>
                                      <Typography variant="body1" sx={{ fontWeight: 700, mt: 0.5 }}>
                                        {logisticsRequest.accommodation_details.room_type === 'suite' ? 'Suite' : logisticsRequest.accommodation_details.room_type === 'single' ? 'Single' : 'Twin Share'}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary" display="block">
                                        ${parseFloat(logisticsRequest.accommodation_details.room_unit_cost || 0).toFixed(2)} / night
                                      </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>
                                        CLASSROOM TYPE
                                      </Typography>
                                      <Typography variant="body1" sx={{ fontWeight: 700, mt: 0.5 }}>
                                        {logisticsRequest.accommodation_details.classroom_type === 'conference_room' ? 'Conference Room' : 'Std Classroom'}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary" display="block">
                                        ${parseFloat(logisticsRequest.accommodation_details.classroom_unit_cost || 0).toFixed(2)} / day
                                      </Typography>
                                    </Grid>
                                  </Grid>
                                  
                                  <Box sx={{ mt: 3 }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 1 }}>
                                      AMENITIES AVAILABLE
                                    </Typography>
                                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ gap: 1 }}>
                                      {logisticsRequest.accommodation_details.has_wifi && <Chip label="WiFi" size="small" color="primary" variant="outlined" sx={{ fontWeight: 600 }} />}
                                      {logisticsRequest.accommodation_details.has_projector && <Chip label="Projector" size="small" color="primary" variant="outlined" sx={{ fontWeight: 600 }} />}
                                      {logisticsRequest.accommodation_details.has_whiteboard && <Chip label="Whiteboard" size="small" color="primary" variant="outlined" sx={{ fontWeight: 600 }} />}
                                      {logisticsRequest.accommodation_details.has_dining && <Chip label="Dining" size="small" color="primary" variant="outlined" sx={{ fontWeight: 600 }} />}
                                    </Stack>
                                  </Box>
                                </Grid>
                              </Grid>
                            </Box>
                          ) : (
                            <Box sx={{ mt: 3, pt: 3, borderTop: '1px dashed', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1.5, p: 2, bgcolor: 'warning.light', borderRadius: 2, color: 'warning.contrastText' }}>
                              <AccessTime color="warning" />
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                This request is pending review and assignment of property details by the logistics manager.
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      ) : (
                        <Box sx={{ py: 6, textAlign: 'center' }}>
                          <Hotel color="action" sx={{ fontSize: 48, opacity: 0.4, mb: 2 }} />
                          <Typography variant="body1" sx={{ fontWeight: 700 }} color="text.secondary">
                            No Accommodation Requested
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            Accommodation bookings were not selected in this logistics request.
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  )}

                  {selectedLogisticsTab === 'stationary' && (
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                        <LocalShipping color="primary" sx={{ fontSize: 28 }} />
                        <Typography variant="h6" sx={{ fontWeight: 800 }}>
                          Stationary Items Detail
                        </Typography>
                      </Box>
                      
                      {logisticsRequest.requested_items.filter(i => i.item_details?.category === 'stationary').length === 0 ? (
                        <Box sx={{ py: 6, textAlign: 'center' }}>
                          <LocalShipping color="action" sx={{ fontSize: 48, opacity: 0.4, mb: 2 }} />
                          <Typography variant="body1" sx={{ fontWeight: 700 }} color="text.secondary">
                            No Stationary Items Requested
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            No stationary items were added to this logistics request.
                          </Typography>
                        </Box>
                      ) : (
                        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                          <Table>
                            <TableHead sx={{ bgcolor: 'action.hover' }}>
                              <TableRow>
                                <TableCell sx={{ fontWeight: 700 }}>Item Name</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                                <TableCell sx={{ fontWeight: 700 }} align="right">Requested Qty</TableCell>
                                <TableCell sx={{ fontWeight: 700 }} align="center">Status</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {logisticsRequest.requested_items
                                .filter(i => i.item_details?.category === 'stationary')
                                .map((reqItem) => (
                                  <TableRow key={reqItem.id} hover>
                                    <TableCell sx={{ fontWeight: 600 }}>{reqItem.item_details?.name || 'Stationary'}</TableCell>
                                    <TableCell sx={{ textTransform: 'capitalize' }}>stationary</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                                      {reqItem.quantity}
                                    </TableCell>
                                    <TableCell align="center">
                                      <Chip
                                        label={logisticsRequest.stationary_status === 'approved' ? 'Approved' : 'Pending'}
                                        color={logisticsRequest.stationary_status === 'approved' ? 'success' : 'warning'}
                                        size="small"
                                        sx={{ fontWeight: 700 }}
                                      />
                                    </TableCell>
                                  </TableRow>
                                ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      )}
                    </Box>
                  )}

                  {selectedLogisticsTab === 'it' && (
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                        <Devices color="primary" sx={{ fontSize: 28 }} />
                        <Typography variant="h6" sx={{ fontWeight: 800 }}>
                          IT Assets Detail
                        </Typography>
                      </Box>
                      
                      {logisticsRequest.requested_items.filter(i => i.item_details?.category === 'it').length === 0 ? (
                        <Box sx={{ py: 6, textAlign: 'center' }}>
                          <Devices color="action" sx={{ fontSize: 48, opacity: 0.4, mb: 2 }} />
                          <Typography variant="body1" sx={{ fontWeight: 700 }} color="text.secondary">
                            No IT Assets Requested
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            No IT devices or components were added to this logistics request.
                          </Typography>
                        </Box>
                      ) : (
                        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                          <Table>
                            <TableHead sx={{ bgcolor: 'action.hover' }}>
                              <TableRow>
                                <TableCell sx={{ fontWeight: 700 }}>Asset Name</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                                <TableCell sx={{ fontWeight: 700 }} align="right">Requested Qty</TableCell>
                                <TableCell sx={{ fontWeight: 700 }} align="center">Status</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {logisticsRequest.requested_items
                                .filter(i => i.item_details?.category === 'it')
                                .map((reqItem) => (
                                  <TableRow key={reqItem.id} hover>
                                    <TableCell sx={{ fontWeight: 600 }}>{reqItem.item_details?.name || 'IT Asset'}</TableCell>
                                    <TableCell>IT Asset</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                                      {reqItem.quantity}
                                    </TableCell>
                                    <TableCell align="center">
                                      <Chip
                                        label={logisticsRequest.it_status === 'approved' ? 'Approved' : 'Pending'}
                                        color={logisticsRequest.it_status === 'approved' ? 'success' : 'warning'}
                                        size="small"
                                        sx={{ fontWeight: 700 }}
                                      />
                                    </TableCell>
                                  </TableRow>
                                ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      )}
                    </Box>
                  )}
                </Paper>
              </CardContent>
            </Card>
          ) : (
            <Paper variant="outlined" sx={{ py: 8, textAlign: 'center', borderStyle: 'dashed', borderRadius: 3 }}>
              <LocalShipping sx={{ fontSize: 56, color: 'text.secondary', opacity: 0.35, mb: 2 }} />
              <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                No Logistics Request Found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 450, mx: 'auto', mb: 3 }}>
                You haven't requested any resources for this batch yet. Instructors can request stationary packages, IT devices, and accommodation bookings.
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleOpenLogisticsDialog}
                sx={{
                  background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                  fontWeight: 700,
                  borderRadius: 2
                }}
              >
                Request Batch Logistics
              </Button>
            </Paper>
          )}
        </Box>
      )}

      {activeSubTab === 4 && (
        <Box>
          {stageError && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setStageError('')}>
              {stageError}
            </Alert>
          )}

          <Card sx={{ mb: 4 }}>
            <CardContent sx={{ py: 2.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Training Progression & Stage Schedule
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Track and schedule the progression of trainees through the three standard stages: Basic Training, Refresher 1, and Refresher 2.
              </Typography>
            </CardContent>
          </Card>

          <Stack spacing={4} sx={{ position: 'relative', py: 2 }}>
            {/* Custom line connector behind items */}
            <Box 
              sx={{ 
                position: 'absolute', 
                left: { xs: 24, sm: 40 }, 
                top: 40, 
                bottom: 40, 
                width: 2, 
                bgcolor: 'divider',
                zIndex: 0
              }} 
            />

            {/* STAGE 1: BASIC */}
            {(() => {
              const stage = getStageData('basic');
              const isCompleted = stage?.status === 'completed';
              return (
                <Card sx={{ 
                  borderRadius: 3, 
                  border: '1px solid', 
                  borderColor: isCompleted ? 'success.light' : 'primary.light', 
                  position: 'relative', 
                  zIndex: 1, 
                  ml: { xs: 6, sm: 10 },
                  transition: 'all 0.3s ease',
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 }
                }}>
                  <Box sx={{ 
                    position: 'absolute', 
                    left: { xs: -48, sm: -70 }, 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    width: { xs: 32, sm: 40 }, 
                    height: { xs: 32, sm: 40 }, 
                    borderRadius: '50%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    bgcolor: isCompleted ? 'success.main' : 'primary.main', 
                    color: '#fff',
                    boxShadow: 2
                  }}>
                    {isCompleted ? <CheckCircle fontSize="small" /> : <CalendarToday fontSize="small" />}
                  </Box>
                  <CardContent sx={{ p: 3 }}>
                    <Grid container spacing={2} alignItems="center" justifyContent="space-between">
                      <Grid item xs={12} md={7}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
                          Stage 1 (Required)
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>
                          Basic Training
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Fundamental training course initialized automatically on batch registration.
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1.5, mt: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                          <Chip 
                            label={isCompleted ? 'Completed' : 'Scheduled'} 
                            color={isCompleted ? 'success' : 'primary'} 
                            size="small" 
                            sx={{ fontWeight: 700 }} 
                          />
                          <Chip label="Face-to-Face" variant="outlined" size="small" sx={{ fontWeight: 600 }} />
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                            Date: {stage?.start_date || batch?.start_date}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={5} sx={{ display: 'flex', justifyContent: { md: 'flex-end' } }}>
                        {!isCompleted && canEditStages && stage && (
                          <Button
                            variant="contained"
                            color="success"
                            startIcon={<CheckCircle />}
                            onClick={() => handleCompleteStage(stage.id)}
                            sx={{ fontWeight: 700, borderRadius: 2 }}
                          >
                            Mark Completed
                          </Button>
                        )}
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              );
            })()}

            {/* STAGE 2: REFRESHER 1 */}
            {(() => {
              const basicStage = getStageData('basic');
              const isBasicCompleted = basicStage?.status === 'completed';
              const stage = getStageData('refresher_1');
              const isCompleted = stage?.status === 'completed';
              const isScheduled = stage?.status === 'scheduled';
              const isLocked = false;

              return (
                <Card sx={{ 
                  borderRadius: 3, 
                  border: '1px solid', 
                  borderColor: isLocked ? 'divider' : isCompleted ? 'success.light' : isScheduled ? 'secondary.light' : 'warning.light', 
                  position: 'relative', 
                  zIndex: 1, 
                  ml: { xs: 6, sm: 10 },
                  opacity: isLocked ? 0.65 : 1,
                  bgcolor: isLocked ? 'action.hover' : 'background.paper',
                  transition: 'all 0.3s ease',
                  '&:hover': isLocked ? {} : { transform: 'translateY(-2px)', boxShadow: 3 }
                }}>
                  <Box sx={{ 
                    position: 'absolute', 
                    left: { xs: -48, sm: -70 }, 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    width: { xs: 32, sm: 40 }, 
                    height: { xs: 32, sm: 40 }, 
                    borderRadius: '50%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    bgcolor: isLocked ? 'text.disabled' : isCompleted ? 'success.main' : isScheduled ? '#ec4899' : 'warning.main', 
                    color: '#fff',
                    boxShadow: isLocked ? 0 : 2
                  }}>
                    {isLocked ? <Lock fontSize="small" /> : isCompleted ? <CheckCircle fontSize="small" /> : isScheduled ? <CalendarToday fontSize="small" /> : <LockOpen fontSize="small" />}
                  </Box>
                  <CardContent sx={{ p: 3 }}>
                    <Grid container spacing={2} alignItems="center" justifyContent="space-between">
                      <Grid item xs={12} md={7}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
                          Stage 2
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                          Refresher Course 1 {isLocked && <Chip label="Locked" size="small" variant="outlined" sx={{ fontWeight: 700 }} />}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          First refresher training stage. Can be scheduled online or face-to-face.
                        </Typography>
                        {!isLocked && (
                          <Box sx={{ display: 'flex', gap: 1.5, mt: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                            <Chip 
                              label={isCompleted ? 'Completed' : isScheduled ? 'Scheduled' : 'Pending Schedule'} 
                              color={isCompleted ? 'success' : isScheduled ? 'secondary' : 'warning'} 
                              size="small" 
                              sx={{ 
                                fontWeight: 700,
                                bgcolor: isScheduled ? '#ec4899' : undefined,
                                color: isScheduled ? '#fff' : undefined
                              }} 
                            />
                            {stage?.format && (
                              <Chip 
                                label={stage.format === 'online' ? 'Online' : 'Face-to-Face'} 
                                variant="outlined" 
                                size="small" 
                                sx={{ fontWeight: 600 }} 
                              />
                            )}
                            {stage?.start_date && (
                              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                                Date: {stage.start_date} {stage.end_date !== stage.start_date ? `to ${stage.end_date}` : ''}
                              </Typography>
                            )}
                          </Box>
                        )}
                      </Grid>
                      <Grid item xs={12} md={5} sx={{ display: 'flex', gap: 1.5, justifyContent: { md: 'flex-end' }, flexWrap: 'wrap' }}>
                        {!isLocked && canEditStages && (
                          <>
                            {!stage && (
                              <Button
                                variant="contained"
                                startIcon={<Add />}
                                onClick={() => handleOpenScheduleDialog('refresher_1')}
                                sx={{ 
                                  fontWeight: 700, 
                                  borderRadius: 2,
                                  background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
                                  color: '#fff'
                                }}
                              >
                                Schedule Stage
                              </Button>
                            )}
                            {isScheduled && (
                              <>
                                <Button
                                  variant="outlined"
                                  onClick={() => handleOpenScheduleDialog('refresher_1', stage)}
                                  sx={{ fontWeight: 700, borderRadius: 2, color: '#ec4899', borderColor: '#ec4899', '&:hover': { borderColor: '#db2777', bgcolor: '#fdf2f8' } }}
                                >
                                  Reschedule
                                </Button>
                                <Button
                                  variant="contained"
                                  color="success"
                                  startIcon={<CheckCircle />}
                                  onClick={() => handleCompleteStage(stage.id)}
                                  sx={{ fontWeight: 700, borderRadius: 2 }}
                                >
                                  Mark Completed
                                </Button>
                              </>
                            )}
                          </>
                        )}
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              );
            })()}

            {/* STAGE 3: REFRESHER 2 */}
            {(() => {
              const refresher1Stage = getStageData('refresher_1');
              const isRefresher1Completed = refresher1Stage?.status === 'completed';
              const stage = getStageData('refresher_2');
              const isCompleted = stage?.status === 'completed';
              const isScheduled = stage?.status === 'scheduled';
              const isLocked = false;

              return (
                <Card sx={{ 
                  borderRadius: 3, 
                  border: '1px solid', 
                  borderColor: isLocked ? 'divider' : isCompleted ? 'success.light' : isScheduled ? 'violet.light' : 'warning.light', 
                  position: 'relative', 
                  zIndex: 1, 
                  ml: { xs: 6, sm: 10 },
                  opacity: isLocked ? 0.65 : 1,
                  bgcolor: isLocked ? 'action.hover' : 'background.paper',
                  transition: 'all 0.3s ease',
                  '&:hover': isLocked ? {} : { transform: 'translateY(-2px)', boxShadow: 3 }
                }}>
                  <Box sx={{ 
                    position: 'absolute', 
                    left: { xs: -48, sm: -70 }, 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    width: { xs: 32, sm: 40 }, 
                    height: { xs: 32, sm: 40 }, 
                    borderRadius: '50%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    bgcolor: isLocked ? 'text.disabled' : isCompleted ? 'success.main' : isScheduled ? '#8b5cf6' : 'warning.main', 
                    color: '#fff',
                    boxShadow: isLocked ? 0 : 2
                  }}>
                    {isLocked ? <Lock fontSize="small" /> : isCompleted ? <CheckCircle fontSize="small" /> : isScheduled ? <CalendarToday fontSize="small" /> : <LockOpen fontSize="small" />}
                  </Box>
                  <CardContent sx={{ p: 3 }}>
                    <Grid container spacing={2} alignItems="center" justifyContent="space-between">
                      <Grid item xs={12} md={7}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
                          Stage 3
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                          Refresher Course 2 {isLocked && <Chip label="Locked" size="small" variant="outlined" sx={{ fontWeight: 700 }} />}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Second refresher training stage. Can be scheduled online or face-to-face.
                        </Typography>
                        {!isLocked && (
                          <Box sx={{ display: 'flex', gap: 1.5, mt: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                            <Chip 
                              label={isCompleted ? 'Completed' : isScheduled ? 'Scheduled' : 'Pending Schedule'} 
                              color={isCompleted ? 'success' : isScheduled ? 'primary' : 'warning'} 
                              size="small" 
                              sx={{ 
                                fontWeight: 700,
                                bgcolor: isScheduled ? '#8b5cf6' : undefined,
                                color: isScheduled ? '#fff' : undefined
                              }} 
                            />
                            {stage?.format && (
                              <Chip 
                                label={stage.format === 'online' ? 'Online' : 'Face-to-Face'} 
                                variant="outlined" 
                                size="small" 
                                sx={{ fontWeight: 600 }} 
                              />
                            )}
                            {stage?.start_date && (
                              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                                Date: {stage.start_date} {stage.end_date !== stage.start_date ? `to ${stage.end_date}` : ''}
                              </Typography>
                            )}
                          </Box>
                        )}
                      </Grid>
                      <Grid item xs={12} md={5} sx={{ display: 'flex', gap: 1.5, justifyContent: { md: 'flex-end' }, flexWrap: 'wrap' }}>
                        {!isLocked && canEditStages && (
                          <>
                            {!stage && (
                              <Button
                                variant="contained"
                                startIcon={<Add />}
                                onClick={() => handleOpenScheduleDialog('refresher_2')}
                                sx={{ 
                                  fontWeight: 700, 
                                  borderRadius: 2,
                                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                                  color: '#fff'
                                }}
                              >
                                Schedule Stage
                              </Button>
                            )}
                            {isScheduled && (
                              <>
                                <Button
                                  variant="outlined"
                                  onClick={() => handleOpenScheduleDialog('refresher_2', stage)}
                                  sx={{ fontWeight: 700, borderRadius: 2, color: '#8b5cf6', borderColor: '#8b5cf6', '&:hover': { borderColor: '#7c3aed', bgcolor: '#f5f3ff' } }}
                                >
                                  Reschedule
                                </Button>
                                <Button
                                  variant="contained"
                                  color="success"
                                  startIcon={<CheckCircle />}
                                  onClick={() => handleCompleteStage(stage.id)}
                                  sx={{ fontWeight: 700, borderRadius: 2 }}
                                >
                                  Mark Completed
                                </Button>
                              </>
                            )}
                          </>
                        )}
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              );
            })()}
          </Stack>
        </Box>
      )}

      {/* --- LOGISTICS REQUEST MODAL --- */}
      <Dialog open={logisticsDialogOpen} onClose={() => setLogisticsDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          {logisticsRequest ? 'Modify Logistics Request' : 'Request Batch Logistics Resources'}
        </DialogTitle>
        <Box component="form" onSubmit={handleLogisticsSubmit}>
          <DialogContent sx={{ pt: 1 }}>
            {logisticsError && <Alert severity="error" sx={{ mb: 2 }}>{logisticsError}</Alert>}
            
            <Stack spacing={3}>
              {/* Accommodation section */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Hotel fontSize="small" color="primary" /> Accommodation Booking
                </Typography>
                
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={logisticsForm.request_accommodation} 
                      onChange={(e) => setLogisticsForm({ ...logisticsForm, request_accommodation: e.target.checked })} 
                      color="primary"
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Request Accommodation for Batch Trainers
                    </Typography>
                  }
                  sx={{ mb: 2 }}
                />

                {logisticsForm.request_accommodation && (
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        type="date"
                        label="Check-In Date"
                        size="small"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        required
                        value={logisticsForm.check_in_date}
                        onChange={(e) => setLogisticsForm({ ...logisticsForm, check_in_date: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        type="date"
                        label="Check-Out Date"
                        size="small"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        required
                        value={logisticsForm.check_out_date}
                        onChange={(e) => setLogisticsForm({ ...logisticsForm, check_out_date: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        type="number"
                        label="Number of Trainers"
                        size="small"
                        fullWidth
                        required
                        value={logisticsForm.num_trainers}
                        onChange={(e) => setLogisticsForm({ ...logisticsForm, num_trainers: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                        inputProps={{ min: 1 }}
                      />
                    </Grid>
                  </Grid>
                )}
              </Box>

              <Divider />

              {/* Stationary section */}
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocalShipping fontSize="small" color="primary" /> Stationary Supplies
                  </Typography>
                  <Button size="small" startIcon={<Add />} onClick={() => handleAddFormRow('stationary')}>
                    Add Item
                  </Button>
                </Box>
                {logisticsForm.stationary_items.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 1, border: '1px dashed', borderColor: 'divider', borderRadius: 1 }}>
                    No stationary requested. Click 'Add Item' to add supplies.
                  </Typography>
                ) : (
                  <Stack spacing={1.5}>
                    {logisticsForm.stationary_items.map((row, idx) => (
                      <Grid container spacing={2} key={idx} alignItems="center">
                        <Grid item xs={7}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Item Name</InputLabel>
                            <Select
                              value={row.item_id}
                              label="Item Name"
                              onChange={(e) => handleFormRowChange('stationary', idx, 'item_id', e.target.value)}
                            >
                              {availableItems.filter(i => i.category === 'stationary').map((item) => (
                                <MenuItem key={item.id} value={item.id}>
                                  {item.name} (Available: {item.quantity})
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={3}>
                          <TextField
                            label="Qty"
                            type="number"
                            size="small"
                            fullWidth
                            value={row.quantity}
                            onChange={(e) => handleFormRowChange('stationary', idx, 'quantity', Math.max(1, parseInt(e.target.value, 10) || 1))}
                            inputProps={{ min: 1 }}
                          />
                        </Grid>
                        <Grid item xs={2} align="center">
                          <IconButton size="small" color="error" onClick={() => handleRemoveFormRow('stationary', idx)}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Grid>
                      </Grid>
                    ))}
                  </Stack>
                )}
              </Box>

              <Divider />

              {/* IT section */}
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Devices fontSize="small" color="primary" /> IT Logistics Assets
                  </Typography>
                  <Button size="small" startIcon={<Add />} onClick={() => handleAddFormRow('it')}>
                    Add Asset
                  </Button>
                </Box>
                {logisticsForm.it_items.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 1, border: '1px dashed', borderColor: 'divider', borderRadius: 1 }}>
                    No IT assets requested. Click 'Add Asset' to request hardware.
                  </Typography>
                ) : (
                  <Stack spacing={1.5}>
                    {logisticsForm.it_items.map((row, idx) => (
                      <Grid container spacing={2} key={idx} alignItems="center">
                        <Grid item xs={7}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Asset Name</InputLabel>
                            <Select
                              value={row.item_id}
                              label="Asset Name"
                              onChange={(e) => handleFormRowChange('it', idx, 'item_id', e.target.value)}
                            >
                              {availableItems.filter(i => i.category === 'it').map((item) => (
                                <MenuItem key={item.id} value={item.id}>
                                  {item.name} (Available: {item.quantity})
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={3}>
                          <TextField
                            label="Qty"
                            type="number"
                            size="small"
                            fullWidth
                            value={row.quantity}
                            onChange={(e) => handleFormRowChange('it', idx, 'quantity', Math.max(1, parseInt(e.target.value, 10) || 1))}
                            inputProps={{ min: 1 }}
                          />
                        </Grid>
                        <Grid item xs={2} align="center">
                          <IconButton size="small" color="error" onClick={() => handleRemoveFormRow('it', idx)}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Grid>
                      </Grid>
                    ))}
                  </Stack>
                )}
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setLogisticsDialogOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={logisticsSubmitting}
              sx={{
                background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                fontWeight: 700
              }}
            >
              {logisticsSubmitting ? 'Submitting...' : 'Save Request'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* --- DELETE LOGISTICS REQUEST CONFIRMATION DIALOG --- */}
      <Dialog open={logisticsDeleteOpen} onClose={() => setLogisticsDeleteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Confirm Request Deletion</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to permanently delete this logistics request?
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            This will release any reserved resources in the registry.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setLogisticsDeleteOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleLogisticsDelete}
            variant="contained"
            color="error"
            disabled={logisticsDeleteSubmitting}
            sx={{ fontWeight: 700 }}
          >
            {logisticsDeleteSubmitting ? 'Deleting...' : 'Delete Request'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* --- ADD PARTICIPANT DIALOG --- */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Add Participant Manually</DialogTitle>
        <DialogContent>
          {addError && <Alert severity="error" sx={{ mb: 2 }}>{addError}</Alert>}
          <Box component="form" noValidate sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="first_name"
                  required
                  fullWidth
                  label="First Name"
                  value={addForm.first_name}
                  onChange={(e) => setAddForm({ ...addForm, first_name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="last_name"
                  required
                  fullWidth
                  label="Last Name"
                  value={addForm.last_name}
                  onChange={(e) => setAddForm({ ...addForm, last_name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="email"
                  required
                  fullWidth
                  type="email"
                  label="Email Address"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="phone_number"
                  fullWidth
                  label="Phone Number (Optional)"
                  value={addForm.phone_number}
                  onChange={(e) => setAddForm({ ...addForm, phone_number: e.target.value })}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setAddOpen(false)} variant="outlined" sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={addSubmitting}
            onClick={handleAddSubmit}
            sx={{
              borderRadius: 2,
              background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
              color: '#fff',
              fontWeight: 700,
              px: 3
            }}
          >
            {addSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Register Trainee'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* --- EDIT PARTICIPANT DIALOG --- */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Edit Trainee Details</DialogTitle>
        <DialogContent>
          {editError && <Alert severity="error" sx={{ mb: 2 }}>{editError}</Alert>}
          <Box component="form" noValidate sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="first_name"
                  required
                  fullWidth
                  label="First Name"
                  value={editForm.first_name}
                  onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="last_name"
                  required
                  fullWidth
                  label="Last Name"
                  value={editForm.last_name}
                  onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="email"
                  required
                  fullWidth
                  type="email"
                  label="Email Address"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="phone_number"
                  fullWidth
                  label="Phone Number"
                  value={editForm.phone_number}
                  onChange={(e) => setEditForm({ ...editForm, phone_number: e.target.value })}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setEditOpen(false)} variant="outlined" sx={{ borderRadius: 2 }}>
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
              fontWeight: 700,
              px: 3
            }}
          >
            {editSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* --- DELETE PARTICIPANT DIALOG --- */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Delete Trainee Enrollment</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to permanently delete student <strong>{selectedParticipant?.first_name} {selectedParticipant?.last_name}</strong> ({selectedParticipant?.participant_id})?
          </Typography>
          <Typography variant="body2" color="error" sx={{ fontWeight: 600 }}>
            Warning: This will permanently remove them from this batch.
          </Typography>
          {deleteError && <Alert severity="error" sx={{ mt: 2 }}>{deleteError}</Alert>}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setDeleteOpen(false)} variant="outlined" sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={deleteSubmitting}
            onClick={handleDeleteSubmit}
            sx={{ borderRadius: 2, px: 3, fontWeight: 700 }}
          >
            {deleteSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Delete Enrollment'}
          </Button>
        </DialogActions>
      </Dialog>


      {/* --- CSV BULK IMPORT DIALOG --- */}
      <Dialog open={uploadOpen} onClose={() => setUploadOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Import Batch Participants via CSV</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Upload a CSV file containing participant records. Existing emails in this batch will be skipped.
          </Typography>

          {uploadError && <Alert severity="error" sx={{ mb: 2 }}>{uploadError}</Alert>}

          {uploadResult ? (
            <Box sx={{ mt: 2 }}>
              <Alert severity="success" sx={{ mb: 2 }}>Import process finished!</Alert>
              <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>Results:</Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                • Enrolled Successfully: <strong>{uploadResult.success_count}</strong> trainees
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                • Skipped (Already Enrolled): <strong>{uploadResult.skipped.length}</strong> trainees
              </Typography>

              {uploadResult.errors.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" color="error" sx={{ fontWeight: 700, mb: 1 }}>
                    Validation Failures ({uploadResult.errors.length}):
                  </Typography>
                  <Box sx={{ maxHeight: 150, overflowY: 'auto', p: 1.5, borderRadius: 1.5, bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider' }}>
                    {uploadResult.errors.map((err, i) => (
                      <Typography key={i} variant="caption" display="block" sx={{ mb: 0.5 }}>
                        Row {err.row}: {err.email} - <span style={{ color: '#d32f2f' }}>{err.error}</span>
                      </Typography>
                    ))}
                  </Box>
                </Box>
              )}

              {uploadResult.skipped.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" color="warning.main" sx={{ fontWeight: 700, mb: 1 }}>
                    Skipped Entries ({uploadResult.skipped.length}):
                  </Typography>
                  <Box sx={{ maxHeight: 150, overflowY: 'auto', p: 1.5, borderRadius: 1.5, bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider' }}>
                    {uploadResult.skipped.map((skip, i) => (
                      <Typography key={i} variant="caption" display="block" sx={{ mb: 0.5 }}>
                        Row {skip.row}: {skip.email} - {skip.reason}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          ) : (
            <Box component="form" noValidate sx={{ mt: 1 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<Download />}
                onClick={downloadCSVTemplate}
                sx={{ mb: 3 }}
              >
                Download CSV Template
              </Button>

              <Box 
                sx={{
                  border: '2px dashed',
                  borderColor: 'divider',
                  borderRadius: 2,
                  p: 4,
                  textAlign: 'center',
                  cursor: 'pointer',
                  bgcolor: 'background.default',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'action.hover'
                  }
                }}
                component="label"
              >
                <input
                  type="file"
                  accept=".csv"
                  hidden
                  onChange={handleFileChange}
                />
                <CloudUpload color="action" sx={{ fontSize: 48, mb: 1 }} />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {uploadFile ? uploadFile.name : 'Select Trainees CSV file'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Maximum size: 5MB. Must match template headers.
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          {uploadResult ? (
            <Button onClick={() => setUploadOpen(false)} variant="contained" sx={{ borderRadius: 2, px: 3 }}>
              Close
            </Button>
          ) : (
            <>
              <Button onClick={() => setUploadOpen(false)} variant="outlined" sx={{ borderRadius: 2 }}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={uploadUploading || !uploadFile}
                onClick={handleUploadSubmit}
                sx={{
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                  color: '#fff',
                  px: 3,
                  fontWeight: 700
                }}
              >
                {uploadUploading ? <CircularProgress size={24} color="inherit" /> : 'Import CSV'}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* --- ASSIGN TRAINER DIALOG --- */}
      <Dialog open={assignOpen} onClose={() => setAssignOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Assign Trainer to Batch</DialogTitle>
        <DialogContent>
          {assignError && <Alert severity="error" sx={{ mb: 2 }}>{assignError}</Alert>}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select a trainer or master trainer from the system to assign to this training batch.
          </Typography>
          <Box sx={{ mt: 1 }}>
            <FormControl fullWidth required>
              <InputLabel id="assign-trainer-select-label">Select Trainer</InputLabel>
              <Select
                labelId="assign-trainer-select-label"
                value={selectedTrainerId}
                label="Select Trainer"
                onChange={(e) => setSelectedTrainerId(e.target.value)}
              >
                {availableTrainers.length === 0 ? (
                  <MenuItem disabled value="">
                    No available trainers found
                  </MenuItem>
                ) : (
                  availableTrainers
                    .filter(t => !batch?.trainers_details?.some(assigned => assigned.id === t.id))
                    .map((t) => (
                      <MenuItem key={t.id} value={t.id}>
                        {t.first_name} {t.last_name} ({t.email} - {t.role === 'master_trainer' ? 'MT' : 'Trainer'})
                      </MenuItem>
                    ))
                )}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setAssignOpen(false)} variant="outlined" sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={assignSubmitting || !selectedTrainerId}
            onClick={handleAssignTrainerSubmit}
            sx={{
              borderRadius: 2,
              background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
              color: '#fff',
              fontWeight: 700,
              px: 3
            }}
          >
            {assignSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Assign'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* --- REMOVE TRAINER DIALOG --- */}
      <Dialog open={removeOpen} onClose={() => setRemoveOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Remove Trainer Assignment</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to remove trainer <strong>{trainerToRemove?.first_name} {trainerToRemove?.last_name}</strong> from this batch?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            They will no longer be listed as an instructor for this training batch.
          </Typography>
          {removeError && <Alert severity="error" sx={{ mt: 2 }}>{removeError}</Alert>}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setRemoveOpen(false)} variant="outlined" sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={removeSubmitting}
            onClick={handleRemoveTrainerSubmit}
            sx={{ borderRadius: 2, px: 3, fontWeight: 700 }}
          >
            {removeSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Remove'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* --- SCHEDULE STAGE DIALOG --- */}
      <Dialog open={scheduleOpen} onClose={() => setScheduleOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          {selectedStageId ? 'Reschedule Training Stage' : 'Schedule Training Stage'}
        </DialogTitle>
        <Box component="form" onSubmit={handleScheduleSubmit}>
          <DialogContent sx={{ pt: 1 }}>
            {scheduleError && <Alert severity="error" sx={{ mb: 2 }}>{scheduleError}</Alert>}
            
            <Stack spacing={3}>
              <Typography variant="body2" color="text.secondary">
                Provide format, start date, and end date for <strong>{scheduleForm.stage_type === 'refresher_1' ? 'Refresher 1' : 'Refresher 2'}</strong>.
              </Typography>
              
              <FormControl fullWidth size="small" required>
                <InputLabel>Training Format</InputLabel>
                <Select
                  value={scheduleForm.format}
                  label="Training Format"
                  onChange={(e) => setScheduleForm({ ...scheduleForm, format: e.target.value })}
                >
                  <MenuItem value="online">Online</MenuItem>
                  <MenuItem value="face_to_face">Face-to-Face</MenuItem>
                </Select>
              </FormControl>

              <TextField
                type="date"
                label="Start Date"
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true }}
                required
                value={scheduleForm.start_date}
                onChange={(e) => setScheduleForm({ ...scheduleForm, start_date: e.target.value })}
              />

              <TextField
                type="date"
                label="End Date"
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true }}
                required
                value={scheduleForm.end_date}
                onChange={(e) => setScheduleForm({ ...scheduleForm, end_date: e.target.value })}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setScheduleOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={scheduleSubmitting}
              sx={{
                background: scheduleForm.stage_type === 'refresher_1' 
                  ? 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)' 
                  : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                fontWeight: 700,
                color: '#fff'
              }}
            >
              {scheduleSubmitting ? 'Saving...' : 'Save Schedule'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );

};

export default BatchDetail;
