import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Grid,
  Breadcrumbs,
  Link,
  Tooltip
} from '@mui/material';
import {
  Settings,
  Save,
  Help,
  Lock,
  AdminPanelSettings
} from '@mui/icons-material';
import { api } from '../context/AuthContext';

const GoogleIntegrations = () => {
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch current credentials
  const fetchCredentials = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.get('google-integrations/config/get-credentials/');
      setClientId(res.data.client_id || '');
      setClientSecret(res.data.client_secret || '');
    } catch (err) {
      console.error(err);
      setError('Failed to fetch existing Google Integration credentials.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredentials();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!clientId.trim() || !clientSecret.trim()) {
      setError('Both Client ID and Client Secret are required.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await api.post('google-integrations/config/save-credentials/', {
        client_id: clientId.trim(),
        client_secret: clientSecret.trim()
      });
      setSuccess(res.data.message || 'Credentials updated successfully.');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to save Google Integration credentials.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link underline="hover" color="inherit" href="/dashboard" sx={{ fontWeight: 600 }}>
          Dashboard
        </Link>
        <Typography color="text.primary" sx={{ fontWeight: 600 }}>Google Integrations</Typography>
      </Breadcrumbs>

      {/* Page Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box 
          sx={{ 
            width: 44, 
            height: 44, 
            borderRadius: 2.5, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            bgcolor: 'primary.light', 
            color: 'primary.main' 
          }}
        >
          <AdminPanelSettings />
        </Box>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.5px' }}>
            Google API Integrations
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configure Google OAuth credentials to enable trainers to sync their training schedules automatically.
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column: Form Config */}
        <Grid item xs={12} lg={7}>
          <Card 
            sx={{ 
              borderRadius: 3, 
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: 'none',
              bgcolor: 'background.paper'
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                OAuth Credentials Settings
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Configure the client credentials for your Google Cloud Project. This app runs on localhost and redirects authentication calls back to the TMS backend service.
              </Typography>

              {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
              {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

              <Box component="form" onSubmit={handleSave} noValidate>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <TextField
                    fullWidth
                    label="Google Client ID"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    placeholder="example-12345.apps.googleusercontent.com"
                    variant="outlined"
                    required
                  />

                  <TextField
                    fullWidth
                    type="password"
                    label="Google Client Secret"
                    value={clientSecret}
                    onChange={(e) => setClientSecret(e.target.value)}
                    placeholder="••••••••••••••••••••••••"
                    variant="outlined"
                    required
                    InputProps={{
                      startAdornment: <Lock color="action" sx={{ mr: 1, fontSize: '1.1rem' }} />
                    }}
                  />

                  <Divider sx={{ my: 1 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={saving}
                      startIcon={<Save />}
                      sx={{
                        background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                        color: '#fff',
                        fontWeight: 700,
                        borderRadius: 2,
                        px: 4,
                        py: 1.2
                      }}
                    >
                      {saving ? 'Saving...' : 'Save Configuration'}
                    </Button>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column: Integration Setup Guide */}
        <Grid item xs={12} lg={5}>
          <Card 
            sx={{ 
              borderRadius: 3, 
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: 'none',
              bgcolor: 'background.paper',
              height: '100%'
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Help color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  Setup Instructions
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              <Typography variant="body2" color="text.secondary" paragraph>
                To generate these credentials, complete the following steps in the Google Cloud Console:
              </Typography>

              <Typography variant="subtitle2" sx={{ fontWeight: 800, mt: 2, mb: 0.5 }}>
                1. Create a Project & Enable API
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Create a project in the <Link href="https://console.cloud.google.com" target="_blank" rel="noopener">Google Cloud Console</Link>, and enable the <strong>Google Calendar API</strong> in the API Library.
              </Typography>

              <Typography variant="subtitle2" sx={{ fontWeight: 800, mt: 2, mb: 0.5 }}>
                2. Configure OAuth Consent Screen
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Set the User Type to <strong>External</strong>. Under Scopes, add the <strong>Google Calendar API scope</strong>: <code>.../auth/calendar.events</code>. Add any test Gmail accounts under Test Users since the app is in Testing mode.
              </Typography>

              <Typography variant="subtitle2" sx={{ fontWeight: 800, mt: 2, mb: 0.5 }}>
                3. Create OAuth 2.0 Credentials
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Go to Credentials &rarr; Create Credentials &rarr; OAuth client ID. Select <strong>Web application</strong>.
              </Typography>

              <Typography variant="subtitle2" sx={{ fontWeight: 800, mt: 2, mb: 0.5 }}>
                4. Configure Redirect URIs
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                In the credential settings, add the following authorized callback URI:
              </Typography>
              <Box 
                sx={{ 
                  p: 1.5, 
                  borderRadius: 1.5, 
                  bgcolor: 'action.hover', 
                  fontFamily: 'monospace', 
                  fontSize: '0.8rem', 
                  border: '1px solid', 
                  borderColor: 'divider',
                  wordBreak: 'break-all'
                }}
              >
                http://localhost:8000/api/google-integrations/oauth/oauth2callback/
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default GoogleIntegrations;
