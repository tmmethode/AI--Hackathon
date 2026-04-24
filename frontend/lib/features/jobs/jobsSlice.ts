import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  archiveJob as archiveJobRequest,
  deleteJob as deleteJobRequest,
  listJobs,
  updateJob as updateJobRequest,
  type JobsResponse,
  type JobRecord,
  type JobResponse,
  type JobStatus,
  type UpdateJobPayload,
} from "@/lib/jobs";

type JobsFilterStatus = JobStatus | "All";

interface JobsState {
  items: JobRecord[];
  search: string;
  statusFilter: JobsFilterStatus;
  selectedId: string;
  page: number;
  total: number;
  totalPages: number;
  menuOpen: string | null;
  deleteTarget: string | null;
  showArchiveConfirm: string | null;
  showJobDetails: boolean;
  isLoading: boolean;
  isMutatingId: string | null;
  error: string;
}

const initialState: JobsState = {
  items: [],
  search: "",
  statusFilter: "All",
  selectedId: "",
  page: 1,
  total: 0,
  totalPages: 1,
  menuOpen: null,
  deleteTarget: null,
  showArchiveConfirm: null,
  showJobDetails: false,
  isLoading: true,
  isMutatingId: null,
  error: "",
};

export const fetchJobs = createAsyncThunk<
  JobsResponse,
  void,
  { state: { jobs: JobsState }; rejectValue: string }
>("jobs/fetchJobs", async (_, { getState, rejectWithValue }) => {
  try {
    const state = getState().jobs;
    return await listJobs({
      search: state.search,
      status: state.statusFilter,
      page: state.page,
      pageSize: 5,
    });
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to load jobs.");
  }
});

export const archiveJob = createAsyncThunk<
  JobResponse,
  string,
  { rejectValue: string }
>("jobs/archiveJob", async (id, { rejectWithValue }) => {
  try {
    return await archiveJobRequest(id);
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to archive the job.");
  }
});

export const deleteJob = createAsyncThunk<
  { id: string; message: string },
  string,
  { rejectValue: string }
>("jobs/deleteJob", async (id, { rejectWithValue }) => {
  try {
    return await deleteJobRequest(id);
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to delete the job.");
  }
});

export const updateJob = createAsyncThunk<
  JobResponse,
  { id: string; payload: UpdateJobPayload },
  { rejectValue: string }
>("jobs/updateJob", async ({ id, payload }, { rejectWithValue }) => {
  try {
    return await updateJobRequest(id, payload);
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to update the job.");
  }
});

const jobsSlice = createSlice({
  name: "jobs",
  initialState,
  reducers: {
    setSearch(state, action: PayloadAction<string>) {
      state.search = action.payload;
      state.page = 1;
    },
    setStatusFilter(state, action: PayloadAction<JobsFilterStatus>) {
      state.statusFilter = action.payload;
      state.page = 1;
    },
    setSelectedId(state, action: PayloadAction<string>) {
      state.selectedId = action.payload;
    },
    setPage(state, action: PayloadAction<number>) {
      state.page = action.payload;
    },
    setMenuOpen(state, action: PayloadAction<string | null>) {
      state.menuOpen = action.payload;
    },
    setDeleteTarget(state, action: PayloadAction<string | null>) {
      state.deleteTarget = action.payload;
    },
    setShowArchiveConfirm(state, action: PayloadAction<string | null>) {
      state.showArchiveConfirm = action.payload;
    },
    setShowJobDetails(state, action: PayloadAction<boolean>) {
      state.showJobDetails = action.payload;
    },
    clearJobsError(state) {
      state.error = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchJobs.pending, (state) => {
        state.isLoading = true;
        state.error = "";
      })
      .addCase(fetchJobs.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.data;
        state.total = action.payload.total;
        state.totalPages = action.payload.totalPages;

        if (!state.items.some((job) => job._id === state.selectedId)) {
          state.selectedId = state.items[0]?._id ?? "";
        }
      })
      .addCase(fetchJobs.rejected, (state, action) => {
        state.isLoading = false;
        state.items = [];
        state.total = 0;
        state.totalPages = 1;
        state.selectedId = "";
        state.error = action.payload || "Failed to load jobs.";
      })
      .addCase(archiveJob.pending, (state, action) => {
        state.isMutatingId = action.meta.arg;
        state.error = "";
      })
      .addCase(archiveJob.fulfilled, (state, action) => {
        state.isMutatingId = null;
        state.showArchiveConfirm = null;
        state.menuOpen = null;
        state.items = state.items.map((job) => (job._id === action.payload.data._id ? action.payload.data : job));
      })
      .addCase(archiveJob.rejected, (state, action) => {
        state.isMutatingId = null;
        state.error = action.payload || "Failed to archive the job.";
      })
      .addCase(deleteJob.pending, (state, action) => {
        state.isMutatingId = action.meta.arg;
        state.error = "";
      })
      .addCase(deleteJob.fulfilled, (state, action) => {
        state.isMutatingId = null;
        state.deleteTarget = null;
        state.menuOpen = null;
        state.showJobDetails = false;

        state.items = state.items.filter((job) => job._id !== action.payload.id);
        state.total = Math.max(0, state.total - 1);

        if (state.selectedId === action.payload.id) {
          state.selectedId = state.items[0]?._id ?? "";
        }

        if (state.items.length === 0 && state.page > 1) {
          state.page -= 1;
        }
      })
      .addCase(deleteJob.rejected, (state, action) => {
        state.isMutatingId = null;
        state.error = action.payload || "Failed to delete the job.";
      })
      .addCase(updateJob.pending, (state, action) => {
        state.isMutatingId = action.meta.arg.id;
        state.error = "";
      })
      .addCase(updateJob.fulfilled, (state, action) => {
        state.isMutatingId = null;
        state.menuOpen = null;
        state.items = state.items.map((job) => (job._id === action.payload.data._id ? action.payload.data : job));
        state.selectedId = action.payload.data._id;
      })
      .addCase(updateJob.rejected, (state, action) => {
        state.isMutatingId = null;
        state.error = action.payload || "Failed to update the job.";
      });
  },
});

export const {
  clearJobsError,
  setDeleteTarget,
  setMenuOpen,
  setPage,
  setSearch,
  setSelectedId,
  setShowArchiveConfirm,
  setShowJobDetails,
  setStatusFilter,
} = jobsSlice.actions;

export default jobsSlice.reducer;
