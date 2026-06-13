import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        padding: 2,
      }}
    >
      <Typography
        variant="h1"
        sx={{
          fontSize: '120px',
          fontWeight: 700,
          color: '#1976d2',
          margin: 0,
        }}
      >
        404
      </Typography>
      <Typography
        variant="h4"
        sx={{
          fontWeight: 600,
          color: '#333',
          marginY: 2,
        }}
      >
        Page Not Found
      </Typography>
      <Typography
        variant="body1"
        sx={{
          color: '#666',
          marginBottom: 4,
          textAlign: 'center',
          maxWidth: 400,
        }}
      >
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </Typography>
      <Button
        variant="contained"
        size="large"
        onClick={() => navigate('/dashboard', { replace: true })}
        sx={{
          backgroundColor: '#1976d2',
          paddingX: 4,
          paddingY: 1.5,
        }}
      >
        Go to Dashboard
      </Button>
    </Box>
  );
}
