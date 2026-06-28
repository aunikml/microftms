import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '../assets/logo.png';
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
  SchoolOutlined 
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useThemeMode } from '../context/ThemeContext';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15
    }
  }
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const { mode, toggleColorMode } = useThemeMode();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/dashboard";

  const handleTogglePassword = () => setShowPassword(!showPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setSubmitting(true);

    try {
      const user = await login(email, password);
      if (!user.is_password_changed) {
        navigate('/change-password', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.detail || 'Invalid email or password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        bgcolor: 'background.default',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Left Side: Brand Panel */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          width: { md: '50%', lg: '55%' },
          background: mode === 'light'
            ? 'linear-gradient(135deg, #be123c 0%, #ea580c 50%, #eab308 100%)' // BRAC IED brand colors: Rose/Magenta, Orange, Yellow
            : 'linear-gradient(135deg, #881337 0%, #7c2d12 50%, #713f12 100%)',
          color: '#fff',
          position: 'relative',
          p: 6,
          overflow: 'hidden'
        }}
      >
        {/* Subtle decorative floating circles/blobs in background */}
        <Box 
          sx={{
            position: 'absolute',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
            top: '-10%',
            left: '-10%',
            filter: 'blur(50px)',
            pointerEvents: 'none'
          }}
        />
        <Box 
          sx={{
            position: 'absolute',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.04)',
            bottom: '-20%',
            right: '-10%',
            filter: 'blur(70px)',
            pointerEvents: 'none'
          }}
        />

        <Box sx={{ zIndex: 1, textAlign: 'center', maxWidth: 500, px: 2 }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <Box 
              component="img"
              src={logo}
              alt="BRAC IED Logo"
              sx={{
                maxHeight: 100,
                objectFit: 'contain',
                mb: 4,
                borderRadius: '16px',
                p: 2.5,
                bgcolor: '#ffffff',
                boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
              }}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
          >
            <Typography 
              variant="h3" 
              sx={{ 
                fontFamily: '"Outfit", "Plus Jakarta Sans", sans-serif',
                fontWeight: 800, 
                mb: 2.5, 
                letterSpacing: '-1.5px', 
                textShadow: '0 2px 10px rgba(0,0,0,0.15)',
                lineHeight: 1.2
              }}
            >
              Training Management System
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                opacity: 0.85, 
                fontWeight: 400, 
                lineHeight: 1.7,
                fontSize: '1.1rem'
              }}
            >
              Empowering educators, scaling pedagogical innovations, and transforming educational practices globally. Welcome to the BRAC IED professional learning platform.
            </Typography>
          </motion.div>
        </Box>
      </Box>

      {/* Right Side: Form Panel */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: { xs: 4, sm: 8 },
          position: 'relative',
          bgcolor: 'background.default'
        }}
      >
        {/* Theme Toggle Top Right */}
        <IconButton 
          onClick={toggleColorMode} 
          sx={{ position: 'absolute', top: 24, right: 24 }}
          color="inherit"
        >
          {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
        </IconButton>

        <Box sx={{ width: '100%', maxWidth: 420 }}>
          {/* Logo only visible on mobile/tablet view */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', alignItems: 'center', mb: 5 }}>
            <Box 
              component="img"
              src={logo}
              alt="BRAC IED Logo"
              sx={{ 
                maxHeight: 70,
                objectFit: 'contain',
                mb: 2,
                borderRadius: '8px',
                p: 1.5,
                bgcolor: '#ffffff',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
              }}
            />
          </Box>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants}>
              <Typography 
                variant="h4" 
                component="h1" 
                gutterBottom 
                sx={{ 
                  fontFamily: '"Outfit", "Plus Jakarta Sans", sans-serif',
                  fontWeight: 800, 
                  letterSpacing: '-1px' 
                }}
              >
                Sign In
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                Please enter your registered credentials to access the portal.
              </Typography>
            </motion.div>

            {error && (
              <motion.div variants={itemVariants}>
                <Alert severity="error" sx={{ mb: 3.5, borderRadius: '12px' }}>
                  {error}
                </Alert>
              </motion.div>
            )}

            <Box component="form" onSubmit={handleSubmit} noValidate>
              <motion.div variants={itemVariants}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  sx={{ 
                    mb: 2.5,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                    }
                  }}
                />
              </motion.div>

              <motion.div variants={itemVariants}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={handleTogglePassword} edge="end">
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                  sx={{ 
                    mb: 4,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                    }
                  }}
                />
              </motion.div>

              <motion.div variants={itemVariants} whileTap={{ scale: 0.98 }}>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={submitting}
                  sx={{ 
                    py: 1.8, 
                    fontSize: '1rem',
                    background: 'linear-gradient(135deg, #d81b60 0%, #ea580c 100%)',
                    color: '#fff',
                    fontWeight: 700,
                    borderRadius: '12px',
                    boxShadow: '0 8px 24px rgba(234, 88, 12, 0.2)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #c2185b 0%, #d84315 100%)',
                      boxShadow: '0 12px 30px rgba(234, 88, 12, 0.3)',
                    }
                  }}
                >
                  {submitting ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </motion.div>
            </Box>
          </motion.div>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;
