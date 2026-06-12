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
  Grid
} from '@mui/material';
import { Add, Refresh, Key, CheckCircle, CloudUpload, Download, Edit, Delete } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { api } from '../context/AuthContext';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Dialog state
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    role: 'trainer'
  });

  // Bulk Import state
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importRole, setImportRole] = useState('trainer');
  const [importError, setImportError] = useState('');
  const [importUploading, setImportUploading] = useState(false);
  const [importResult, setImportResult] = useState(null);

  // Edit State
  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    role: 'trainer'
  });
  const [editError, setEditError] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Delete State
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteUser, setDeleteUser] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleEditOpen = (user) => {
    setEditUser(user);
    setEditForm({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone_number: user.phone_number || '',
      role: user.role
    });
    setEditError('');
    setEditOpen(true);
  };

  const handleEditClose = () => setEditOpen(false);

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.email || !editForm.first_name || !editForm.last_name) {
      setEditError('Please fill in all required fields.');
      return;
    }
    setEditError('');
    setEditSubmitting(true);

    try {
      await api.patch(`users/${editUser.id}/`, editForm);
      setEditOpen(false);
      fetchUsers();
    } catch (err) {
      console.error(err);
      if (err.response?.data) {
        const errors = err.response.data;
        const mainError = errors.email || errors.non_field_errors || errors.detail;
        setEditError(Array.isArray(mainError) ? mainError[0] : JSON.stringify(errors));
      } else {
        setEditError('An error occurred while updating the user.');
      }
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteOpen = (user) => {
    setDeleteUser(user);
    setDeleteError('');
    setDeleteOpen(true);
  };

  const handleDeleteClose = () => setDeleteOpen(false);

  const handleDeleteSubmit = async () => {
    setDeleteError('');
    setDeleteSubmitting(true);
    try {
      await api.delete(`users/${deleteUser.id}/`);
      setDeleteOpen(false);
      fetchUsers();
    } catch (err) {
      console.error(err);
      setDeleteError(err.response?.data?.detail || 'Failed to delete user.');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const handleImportOpen = () => {
    setImportOpen(true);
    setImportFile(null);
    setImportRole('trainer');
    setImportError('');
    setImportResult(null);
  };

  const handleImportClose = () => setImportOpen(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setImportFile(e.target.files[0]);
      setImportError('');
    }
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!importFile) {
      setImportError('Please select a CSV file.');
      return;
    }
    setImportError('');
    setImportUploading(true);

    const formData = new FormData();
    formData.append('file', importFile);
    formData.append('role', importRole);

    try {
      const response = await api.post('users/bulk_import/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setImportResult(response.data);
      fetchUsers(); // reload user list
    } catch (err) {
      console.error(err);
      if (err.response?.data?.detail) {
        setImportError(err.response.data.detail);
      } else {
        setImportError('Failed to upload and import CSV file.');
      }
    } finally {
      setImportUploading(false);
    }
  };

  const downloadCSVTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,first_name,last_name,email,phone_number\nJohn,Doe,john@example.com,1234567890\nJane,Smith,jane@example.com,";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "tms_user_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('users/');
      setUsers(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch user directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpen = () => {
    setFormData({
      email: '',
      first_name: '',
      last_name: '',
      phone_number: '',
      role: 'trainer'
    });
    setFormError('');
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.first_name || !formData.last_name) {
      setFormError('Please fill in all required fields.');
      return;
    }
    setFormError('');
    setSubmitting(true);

    try {
      await api.post('users/', formData);
      setOpen(false);
      fetchUsers(); // reload user list
    } catch (err) {
      console.error(err);
      if (err.response?.data) {
        const errors = err.response.data;
        const mainError = errors.email || errors.non_field_errors || errors.detail;
        setFormError(Array.isArray(mainError) ? mainError[0] : JSON.stringify(errors));
      } else {
        setFormError('An error occurred while creating the user.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleChip = (role) => {
    const roleColors = {
      super_admin: { label: 'Super Admin', color: 'error' },
      program_supervisor: { label: 'Supervisor', color: 'primary' },
      batch_manager: { label: 'Batch Manager', color: 'secondary' },
      master_trainer: { label: 'Master Trainer', color: 'success' },
      trainer: { label: 'Trainer', color: 'info' },
      logistic_manager: { label: 'Logistics', color: 'warning' },
      regional_manager: { label: 'RM - Regional Manager', color: 'default' }
    };
    const info = roleColors[role] || { label: role, color: 'default' };
    return <Chip label={info.label} color={info.color} size="small" variant="outlined" sx={{ fontWeight: 600 }} />;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5, letterSpacing: '-0.5px' }}>
            User Accounts
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage system directories, define employee roles, and track onboarding status.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <IconButton onClick={fetchUsers} disabled={loading} color="primary" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Refresh />
          </IconButton>
          <Button
            variant="outlined"
            startIcon={<CloudUpload />}
            onClick={handleImportOpen}
            sx={{
              fontWeight: 700,
              px: 2.5,
              borderRadius: 2
            }}
          >
            Bulk Import CSV
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleOpen}
            sx={{
              background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
              color: '#fff',
              fontWeight: 700,
              px: 2.5,
              borderRadius: 2
            }}
          >
            Create User
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Card>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ border: 'none' }}>
              <Table>
                <TableHead sx={{ bgcolor: (theme) => theme.palette.mode === 'light' ? '#f8fafc' : '#1e293b' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Phone</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Password Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                        No users registered in the system.
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((u) => (
                      <TableRow key={u.id} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{u.full_name}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>{u.phone_number || '-'}</TableCell>
                        <TableCell>{getRoleChip(u.role)}</TableCell>
                        <TableCell>
                          {u.is_password_changed ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'success.main' }}>
                              <CheckCircle fontSize="small" />
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>Set Up</Typography>
                            </Box>
                          ) : (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'warning.main' }}>
                              <Key fontSize="small" />
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>Pending Change</Typography>
                            </Box>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton size="small" onClick={() => handleEditOpen(u)} color="primary" sx={{ mr: 1 }}>
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleDeleteOpen(u)} color="error">
                            <Delete fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Creation Modal */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>Register System User</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            New users will receive a temporary password matching their email address and will be required to change it on their first login.
          </Typography>

          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}

          <Box component="form" noValidate sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="first_name"
                  required
                  fullWidth
                  label="First Name"
                  value={formData.first_name}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="last_name"
                  required
                  fullWidth
                  label="Last Name"
                  value={formData.last_name}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="email"
                  required
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="phone_number"
                  fullWidth
                  label="Phone Number (Optional)"
                  value={formData.phone_number}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel id="role-select-label">System Role</InputLabel>
                  <Select
                    labelId="role-select-label"
                    name="role"
                    value={formData.role}
                    label="System Role"
                    onChange={handleChange}
                  >
                    <MenuItem value="super_admin">Super Admin</MenuItem>
                    <MenuItem value="program_supervisor">Program Supervisor</MenuItem>
                    <MenuItem value="batch_manager">Batch Manager</MenuItem>
                    <MenuItem value="master_trainer">Master Trainer</MenuItem>
                    <MenuItem value="trainer">Trainer</MenuItem>
                    <MenuItem value="logistic_manager">Logistic Manager</MenuItem>
                    <MenuItem value="regional_manager">RM - Regional Manager</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleClose} variant="outlined" sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting}
            onClick={handleSubmit}
            sx={{
              borderRadius: 2,
              background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
              color: '#fff',
              px: 3,
              fontWeight: 700
            }}
          >
            {submitting ? <CircularProgress size={24} color="inherit" /> : 'Register User'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Import Modal */}
      <Dialog open={importOpen} onClose={handleImportClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>Bulk Import Users via CSV</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Upload a CSV file containing user details. Select the role to assign to all imported accounts.
          </Typography>

          {importError && <Alert severity="error" sx={{ mb: 2 }}>{importError}</Alert>}

          {importResult ? (
            <Box sx={{ mt: 2 }}>
              <Alert severity="success" sx={{ mb: 2 }}>
                Import completed successfully!
              </Alert>
              <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
                Results:
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                • Successfully Imported: <strong>{importResult.success_count}</strong> users
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                • Skipped (Already Exists): <strong>{importResult.skipped.length}</strong> users
              </Typography>

              {importResult.errors.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" color="error" sx={{ fontWeight: 700, mb: 1 }}>
                    Validation Failures ({importResult.errors.length}):
                  </Typography>
                  <Box 
                    sx={{ 
                      maxHeight: 150, 
                      overflowY: 'auto', 
                      p: 1.5, 
                      borderRadius: 1.5, 
                      bgcolor: 'action.hover',
                      border: '1px solid',
                      borderColor: 'divider'
                    }}
                  >
                    {importResult.errors.map((err, i) => (
                      <Typography key={i} variant="caption" display="block" sx={{ mb: 0.5 }}>
                        Row {err.row}: {err.email} - <span style={{ color: '#d32f2f' }}>{err.error}</span>
                      </Typography>
                    ))}
                  </Box>
                </Box>
              )}

              {importResult.skipped.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" color="warning.main" sx={{ fontWeight: 700, mb: 1 }}>
                    Skipped Emails ({importResult.skipped.length}):
                  </Typography>
                  <Box 
                    sx={{ 
                      maxHeight: 150, 
                      overflowY: 'auto', 
                      p: 1.5, 
                      borderRadius: 1.5, 
                      bgcolor: 'action.hover',
                      border: '1px solid',
                      borderColor: 'divider'
                    }}
                  >
                    {importResult.skipped.map((skip, i) => (
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

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel id="import-role-select-label">Assign System Role</InputLabel>
                    <Select
                      labelId="import-role-select-label"
                      value={importRole}
                      label="Assign System Role"
                      onChange={(e) => setImportRole(e.target.value)}
                    >
                      <MenuItem value="super_admin">Super Admin</MenuItem>
                      <MenuItem value="program_supervisor">Program Supervisor</MenuItem>
                      <MenuItem value="batch_manager">Batch Manager</MenuItem>
                      <MenuItem value="master_trainer">Master Trainer</MenuItem>
                      <MenuItem value="trainer">Trainer</MenuItem>
                      <MenuItem value="logistic_manager">Logistic Manager</MenuItem>
                      <MenuItem value="regional_manager">RM - Regional Manager</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <Box 
                    sx={{
                      border: '2px dashed',
                      borderColor: 'divider',
                      borderRadius: 2,
                      p: 3,
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
                    <CloudUpload color="action" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {importFile ? importFile.name : 'Click to select CSV File'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Max file size: 5MB. Supports .csv format.
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          {importResult ? (
            <Button onClick={handleImportClose} variant="contained" sx={{ borderRadius: 2, px: 3 }}>
              Close
            </Button>
          ) : (
            <>
              <Button onClick={handleImportClose} variant="outlined" sx={{ borderRadius: 2 }}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={importUploading || !importFile}
                onClick={handleImportSubmit}
                sx={{
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                  color: '#fff',
                  px: 3,
                  fontWeight: 700
                }}
              >
                {importUploading ? <CircularProgress size={24} color="inherit" /> : 'Import CSV'}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={editOpen} onClose={handleEditClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>Edit System User</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Modify user profile details and roles. The user's password status will not be affected.
          </Typography>

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
                  onChange={handleEditChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="last_name"
                  required
                  fullWidth
                  label="Last Name"
                  value={editForm.last_name}
                  onChange={handleEditChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="email"
                  required
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={editForm.email}
                  onChange={handleEditChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="phone_number"
                  fullWidth
                  label="Phone Number (Optional)"
                  value={editForm.phone_number}
                  onChange={handleEditChange}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel id="edit-role-select-label">System Role</InputLabel>
                  <Select
                    labelId="edit-role-select-label"
                    name="role"
                    value={editForm.role}
                    label="System Role"
                    onChange={handleEditChange}
                  >
                    <MenuItem value="super_admin">Super Admin</MenuItem>
                    <MenuItem value="program_supervisor">Program Supervisor</MenuItem>
                    <MenuItem value="batch_manager">Batch Manager</MenuItem>
                    <MenuItem value="master_trainer">Master Trainer</MenuItem>
                    <MenuItem value="trainer">Trainer</MenuItem>
                    <MenuItem value="logistic_manager">Logistic Manager</MenuItem>
                    <MenuItem value="regional_manager">RM - Regional Manager</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
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

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteOpen} onClose={handleDeleteClose} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>Delete User Account</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to permanently delete user <strong>{deleteUser?.full_name}</strong> ({deleteUser?.email})?
          </Typography>
          <Typography variant="body2" color="error" sx={{ fontWeight: 600 }}>
            Warning: This action is irreversible. All associated permissions and configurations will be removed.
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
            sx={{ borderRadius: 2, px: 3, fontWeight: 700 }}
          >
            {deleteSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Delete User'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;
