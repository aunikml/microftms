import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Card, 
  CardContent, 
  TextField, 
  Button, 
  Typography, 
  IconButton, 
  InputAdornment,
  Alert,
  CircularProgress
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff, 
  Brightness4, 
  Brightness7, 
  LockOutlined 
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useThemeMode } from '../context/ThemeContext';

const ChangePassword = () => {
  const [tempPassword, setTempPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { changePassword, logout } = useAuth();
  const { mode, toggleColorMode } = useThemeMode();
  const navigate = useNavigate();

  const handleTogglePassword = () => setShowPass(!showPass);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tempPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      await changePassword(tempPassword, newPassword);
      setSuccess('Password changed successfully! Redirecting...');
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 2000);
    } catch (err) {
      console.error(err);
      if (typeof err === 'object') {
        const errorMsg = err.old_password || err.new_password || err.non_field_errors || err.detail;
        setError(Array.isArray(errorMsg) ? errorMsg[0] : errorMsg || 'Failed to update password.');
      } else {
        setError('Failed to update password.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: mode === 'light'
          ? 'radial-gradient(circle at 10% 20%, rgb(239, 246, 255) 0%, rgb(219, 234, 254) 100%)'
          : 'radial-gradient(circle at 10% 20%, rgb(15, 23, 42) 0%, rgb(30, 41, 59) 100%)',
        position: 'relative',
        p: 2
      }}
    >
      <IconButton 
        onClick={toggleColorMode} 
        sx={{ position: 'absolute', top: 16, right: 16 }}
        color="inherit"
      >
        {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
      </IconButton>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card sx={{ width: '100%', maxWidth: 485, overflow: 'visible', p: 1 }}>
          <CardContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3, mt: 1 }}>
              <Box 
                sx={{ 
                  width: 56, 
                  height: 56, 
                  borderRadius: '16px', 
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: '#fff',
                  mb: 2,
                  boxShadow: '0 8px 16px rgba(245, 158, 11, 0.3)'
                }}
              >
                <LockOutlined fontSize="large" />
              </Box>
              <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 800 }}>
                Setup New Password
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center">
                This is your first login. For security, please choose a new password. Your temporary password is your email address.
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
                {success}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} noValidate>
              <TextField
                margin="normal"
                required
                fullWidth
                label="Temporary Password"
                type={showPass ? 'text' : 'password'}
                id="tempPassword"
                value={tempPassword}
                onChange={(e) => setTempPassword(e.target.value)}
                sx={{ mb: 2 }}
                placeholder="Check your email if different"
              />
              <TextField
                margin="normal"
                required
                fullWidth
                label="New Password"
                type={showPass ? 'text' : 'password'}
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                label="Confirm New Password"
                type={showPass ? 'text' : 'password'}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={handleTogglePassword} edge="end">
                        {showPass ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                sx={{ mb: 3 }}
              />

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={logout}
                  sx={{ py: 1.2, fontWeight: 600, borderRadius: '8px' }}
                >
                  Cancel & Log Out
                </Button>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={submitting}
                  sx={{ 
                    py: 1.2, 
                    fontWeight: 700, 
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                    color: '#fff',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #4338ca 0%, #4f46e5 100%)',
                    }
                  }}
                >
                  {submitting ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'Save Password'
                  )}
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </motion.div>
    </Box>
  );
};

export default ChangePassword;
