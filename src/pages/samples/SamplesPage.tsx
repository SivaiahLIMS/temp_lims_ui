import React, { useState } from 'react';
import {
  Box,
  Card,
  Button,
  Typography,
  Chip,
  Stack,
  TextField,
  InputAdornment,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Add, Search, FilterList } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { samplesApi } from '../../api/endpoints';
import { useUIStore } from '../../store/uiStore';

interface Sample {
  id: string;
  sampleId: string;
  name: string;
  type: string;
  status: string;
  assignedLab: string;
  receivedDate: string;
}

export default function SamplesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { currentBranchId } = useUIStore();

  const placeholderData: Sample[] = [];

  const { data: apiData, isLoading, isError, error } = useQuery({
    queryKey: ['samples', currentBranchId],
    queryFn: () => samplesApi.list(currentBranchId),
  });

  const apiRows: Sample[] = Array.isArray(apiData)
    ? apiData.map((s: any) => ({
        id: String(s.id ?? s.sampleId),
        sampleId: s.sampleCode ?? s.code ?? `SM-${s.id}`,
        name: s.sampleName ?? s.name ?? 'Unknown Sample',
        type: s.testType ?? s.type ?? 'General',
        status: s.status ?? 'Pending',
        assignedLab: s.laboratory ?? s.lab ?? s.assignedLab ?? 'Lab 1',
        receivedDate: s.receivedAt?.split('T')[0] ?? s.receivedDate ?? '',
      }))
    : [];

  const rows = apiRows;

  const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case 'Tested':
        return 'success';
      case 'Testing':
        return 'warning';
      case 'Rejected':
        return 'error';
      case 'Pending':
      default:
        return 'default';
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'sampleId',
      headerName: 'Sample ID',
      flex: 1,
      minWidth: 120,
    },
    {
      field: 'name',
      headerName: 'Name',
      flex: 2,
      minWidth: 200,
    },
    {
      field: 'type',
      headerName: 'Type',
      flex: 1,
      minWidth: 130,
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 1,
      minWidth: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getStatusColor(params.value)}
          variant="filled"
          size="small"
        />
      ),
    },
    {
      field: 'assignedLab',
      headerName: 'Assigned Lab',
      flex: 1,
      minWidth: 130,
    },
    {
      field: 'receivedDate',
      headerName: 'Received Date',
      flex: 1,
      minWidth: 130,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      minWidth: 100,
      sortable: false,
      renderCell: () => (
        <Button variant="text" size="small" color="primary">
          View
        </Button>
      ),
    },
  ];

  const filteredRows = rows.filter(
    (item) =>
      item.sampleId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box sx={{ padding: 3 }}>
      <Box sx={{ marginBottom: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, marginBottom: 2 }}>
          Samples & Tests
        </Typography>

        <Card sx={{ padding: 2 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ marginBottom: 2 }}
          >
            <TextField
              placeholder="Search samples..."
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ flex: 1 }}
            />
            <Button
              startIcon={<FilterList />}
              variant="outlined"
              size="small"
            >
              Filter
            </Button>
            <Button
              startIcon={<Add />}
              variant="contained"
              size="small"
              sx={{ backgroundColor: '#1976d2' }}
            >
              New Sample
            </Button>
          </Stack>

          {isError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => {}}>
              {(error as Error)?.message ?? 'Failed to load samples'}
            </Alert>
          )}
          <Box sx={{ height: 500, width: '100%' }}>
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress />
              </Box>
            ) : (
              <DataGrid
                rows={filteredRows}
                columns={columns}
                pageSizeOptions={[5, 10, 25]}
                initialState={{
                  pagination: {
                    paginationModel: {
                      pageSize: 10,
                    },
                  },
                }}
                disableRowSelectionOnClick
              />
            )}
          </Box>
        </Card>
      </Box>
    </Box>
  );
}
