import { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Paper, 
  TextField, 
  Button, 
  Typography, 
  Container,
  Checkbox,
  FormControlLabel,
  Link,
  CircularProgress
} from '@mui/material';
import { useAuth } from '../context/AuthContext';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const isMountedRef = useRef(true);
  const { login } = useAuth();

  useEffect(() => {
    return () => { isMountedRef.current = false; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const MIN_SPINNER_MS = 3000; // asegura que el loader sea visible al menos este tiempo
    const start = Date.now();
    try {
      setLoading(true);
      await login({ email, password });
    } finally {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, MIN_SPINNER_MS - elapsed);
      if (remaining) {
        await new Promise((resolve) => setTimeout(resolve, remaining));
      }
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ 
        height: '100vh',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        mt: -10
      }}>
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography variant="h4" align="center" sx={{ mb: 4, color: '#0455a2' }}>
            Iniciar Sesión
          </Typography>
          
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                fullWidth
              />
              
              <TextField
                label="Contraseña"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                fullWidth
              />
              
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mt: 1
              }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      sx={{ color: '#0455a2', '&.Mui-checked': { color: '#0455a2' } }}
                    />
                  }
                  label="Mantener sesión iniciada"
                />
                <Link 
                  href="/forgot-password"
                  sx={{ 
                    color: '#0455a2',
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' }
                  }}
                >
                  ¿Olvidó su contraseña?
                </Link>
              </Box>
              
              <Button 
                type="submit" 
                variant="contained" 
                fullWidth
                disabled={loading}
                sx={{ 
                  mt: 2,
                  backgroundColor: loading ? '#7c9427' : '#0455a2',
                  color: '#fff',
                  '&:hover': {
                    backgroundColor: '#7c9427'
                  },
                  '&.Mui-disabled': {
                    backgroundColor: loading ? '#7c9427' : '#0455a2', // mantener el color cuando está deshabilitado por loading
                    color: '#fff'
                  }
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Iniciar Sesión'}
              </Button>
            </Box>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default Auth;