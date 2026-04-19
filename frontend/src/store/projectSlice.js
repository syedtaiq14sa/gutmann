import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

export const fetchDashboardData = createAsyncThunk('projects/fetchDashboard', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/dashboard/projects');
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || { message: 'Failed to fetch projects' });
  }
});

export const fetchProjectById = createAsyncThunk('projects/fetchById', async (id, { rejectWithValue }) => {
  try {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || { message: 'Failed to fetch project' });
  }
});

export const updateProjectStatus = createAsyncThunk('projects/updateStatus', async ({ id, status, notes }, { rejectWithValue }) => {
  try {
    const response = await api.patch(`/projects/${id}/status`, { status, notes });
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || { message: 'Failed to update status' });
  }
});

const projectSlice = createSlice({
  name: 'projects',
  initialState: {
    projects: [],
    currentProject: null,
    loading: false,
    error: null
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.projects = action.payload;
        state.loading = false;
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message;
      })
      .addCase(fetchProjectById.fulfilled, (state, action) => {
        state.currentProject = action.payload;
        state.loading = false;
      })
      .addCase(updateProjectStatus.fulfilled, (state, action) => {
        const index = state.projects.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.projects[index] = action.payload;
        }
      });
  }
});

export default projectSlice.reducer;
