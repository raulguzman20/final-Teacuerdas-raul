// React imports
import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { authService } from '../../../shared/services/auth.service';

// Material-UI imports
import {
  Box,
  TextField,
  Button,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  Link,
} from '@mui/material';

// Asset imports
import TeAcuerdasLogo from '../../../assets/TeAcuerdas.png';
import backgroundImage from '../../../assets/backgroundTeacuerdas.jpg';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    if (!email) {
      setError('Por favor, ingrese su correo electrónico.');
      return;
    }
    
    try {
      const response = await authService.forgotPassword(email);
      
      if (response.success) {
        setMessage(response.message || 'Se ha enviado un enlace de recuperación a tu correo electrónico.');
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } else {
        setError(response.message || 'Error al procesar la solicitud.');
      }
    } catch (err) {
      setError('Ocurrió un error al procesar tu solicitud. Por favor, intenta nuevamente.');
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      m: 0,
      p: 0,
      overflow: 'hidden',
      bgcolor: 'background.default',
    }}>
      <Container maxWidth={false} disableGutters sx={{
        height: '100%',
        width: '100%',
        m: 0,
        p: 0,
      }}>
        <Grid container sx={{ height: '100%', m: 0 }}>
          {/* Left side - Form */}
          <Grid
            item
            xs={12}
            md={6}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: { xs: 'auto', md: '100vh' },
              p: { xs: 2, sm: 3, md: 4 },
              backgroundImage: `url(${backgroundImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                inset: 0,
                bgcolor: 'rgba(255, 255, 255, 0)',
                zIndex: 1,
              },
            }}
          >
            <Card
              elevation={5}
              sx={{
                width: '100%',
                maxWidth: { xs: 420, sm: 440, md: 460 },
                mx: 'auto',
                borderRadius: 2,
                overflow: 'hidden',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                position: 'relative',
                zIndex: 2,
              }}
            >
              <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                <Typography
                  variant="h5"
                  align="center"
                  sx={{
                    mb: 3,
                    fontWeight: 600,
                    color: '#0455a2',
                    fontSize: { xs: '1.25rem', sm: '1.35rem', md: '1.5rem' },
                  }}
                >
                  Recuperar Contraseña
                </Typography>

                {message && (
                  <Typography color="success.main" variant="body2" sx={{ mb: 2, textAlign: 'center' }}>
                    {message}
                  </Typography>
                )}

                {error && (
                  <Typography color="error" variant="body2" sx={{ mb: 2, textAlign: 'center' }}>
                    {error}
                  </Typography>
                )}

                <Box component="form" onSubmit={handleSubmit} noValidate>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      label="Email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      fullWidth
                      variant="outlined"
                      placeholder="Ingrese su email"
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1,
                        },
                      }}
                    />

                    <Button
                      type="submit"
                      variant="contained"
                      fullWidth
                      size="medium"
                      sx={{
                        mt: 2,
                        py: { xs: 1, sm: 1.25 },
                        bgcolor: '#0455a2',
                        '&:hover': {
                          bgcolor: '#6c8221',
                        },
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        fontSize: { xs: '0.85rem', sm: '0.9rem' },
                        borderRadius: 1,
                      }}
                    >
                      Enviar Enlace de Recuperación
                    </Button>

                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.85rem', sm: '0.9rem' } }}>
                        <Link component={RouterLink} to="/" sx={{ color: '#0455a2', textDecoration: 'none' }}>
                          Volver al inicio de sesión
                        </Link>
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Right side - Logo and welcome message */}
          <Grid
            item
            xs={12}
            md={6}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: { xs: 'auto', md: '100vh' },
              p: { xs: 2, sm: 3, md: 4 },
              backgroundColor: '#f5f7fa',
            }}
          >
            <Box sx={{ mb: { xs: 3, md: 4 }, textAlign: 'center', position: 'relative', zIndex: 2 }}>
              <Box
                component="img"
                src={TeAcuerdasLogo}
                alt="Te Acuerdas Logo"
                sx={{
                  width: { xs: 100, sm: 130, md: 160 },
                  height: { xs: 100, sm: 130, md: 160 },
                  objectFit: 'contain',
                  borderRadius: '50%',
                  bgcolor: 'common.white',
                  p: { xs: 1.5, sm: 2.5 },
                }}
              />
            </Box>
            <Box sx={{ textAlign: 'center', position: 'relative', zIndex: 2 }}>
              <Typography
                variant="h3"
                component="h1"
                sx={{
                  fontWeight: 700,
                  color: '#0455a2',
                  mb: { xs: 1.5, md: 2 },
                  textShadow: '1px 1px 3px rgba(0,0,0,0.7)',
                  fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem', lg: '2.5rem' },
                }}
              >
                Recupera tu Acceso
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  color: '#0455a2',
                  mb: { xs: 3, md: 4 },
                  textShadow: '1px 1px 3px rgba(0,0,0,0.3)',
                  fontWeight: 500,
                  fontSize: { xs: '1rem', md: '1.125rem' },
                }}
              >
                Te enviaremos las instrucciones a tu correo
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default ForgotPassword;