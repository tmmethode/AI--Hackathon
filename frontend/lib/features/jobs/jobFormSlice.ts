import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  createJob as createJobRequest,
  getStoredAuthUser,
  splitLinesToList,
  type CreateJobPayload,
  type EducationLevel,
  type EmploymentType,
  type JobResponse,
  type LocationPolicy,
  type SeniorityLevel,
} from "@/lib/jobs";

export interface WeightCriterion {
  id: string;
  label: string;
  value: number;
}

interface JobFormFields {
  title: string;
  department: string;
  location: string;
  locationPolicy: LocationPolicy | "";
  employmentType: EmploymentType | "";
  salaryBand: string;
  summary: string;
  responsibilities: string;
  mustHaveQualifications: string;
  niceToHaveQualifications: string;
  coreHardSkills: string;
  preferredSkills: string;
  coreSoftSkills: string;
  experienceYears: string;
  seniorityLevel: SeniorityLevel | "";
  educationLevel: EducationLevel | "";
}

interface JobFormState {
  form: JobFormFields;
  weightCriteria: WeightCriterion[];
  showSuccessModal: boolean;
  createdJobTitle: string;
  error: string;
  isSubmitting: boolean;
}

const initialForm: JobFormFields = {
  title: "",
  department: "",
  location: "",
  locationPolicy: "",
  employmentType: "",
  salaryBand: "",
  summary: "",
  responsibilities: "",
  mustHaveQualifications: "",
  niceToHaveQualifications: "",
  coreHardSkills: "",
  preferredSkills: "",
  coreSoftSkills: "",
  experienceYears: "",
  seniorityLevel: "",
  educationLevel: "",
};

const initialState: JobFormState = {
  form: initialForm,
  weightCriteria: [
    { id: "technical-skills", label: "Technical Skills", value: 40 },
    { id: "experience", label: "Years of Experience", value: 30 },
    { id: "soft-skills", label: "Culture & Soft Skills", value: 20 },
    { id: "education", label: "Educational Background", value: 10 },
  ],
  showSuccessModal: false,
  createdJobTitle: "",
  error: "",
  isSubmitting: false,
};

function buildPayload(state: JobFormState, status: CreateJobPayload["status"]): CreateJobPayload {
  const authUser = getStoredAuthUser();
  const hiringManagerId =
    authUser?.role === "recruiter" || authUser?.role === "admin" ? authUser._id : undefined;

  return {
    title: state.form.title.trim(),
    department: state.form.department.trim(),
    hiringManager: hiringManagerId,
    location: state.form.location.trim(),
    locationPolicy: state.form.locationPolicy as LocationPolicy,
    employmentType: state.form.employmentType as EmploymentType,
    salaryBand: state.form.salaryBand.trim() || undefined,
    summary: state.form.summary.trim(),
    responsibilities: state.form.responsibilities.trim(),
    mustHaveQualifications: state.form.mustHaveQualifications.trim(),
    niceToHaveQualifications: state.form.niceToHaveQualifications.trim() || undefined,
    coreHardSkills: splitLinesToList(state.form.coreHardSkills),
    preferredSkills: splitLinesToList(state.form.preferredSkills),
    coreSoftSkills: splitLinesToList(state.form.coreSoftSkills),
    experienceYears: Number(state.form.experienceYears) || 0,
    seniorityLevel: state.form.seniorityLevel as SeniorityLevel,
    educationLevel: state.form.educationLevel as EducationLevel,
    weightCriteria: state.weightCriteria
      .map((criterion) => ({
        id: criterion.id,
        label: criterion.label.trim(),
        value: criterion.value,
      }))
      .filter((criterion) => criterion.label.length > 0),
    status,
  };
}

export const submitJob = createAsyncThunk<
  JobResponse,
  { status: CreateJobPayload["status"] },
  { state: { jobForm: JobFormState }; rejectValue: string }
>("jobForm/submitJob", async ({ status }, { getState, rejectWithValue }) => {
  try {
    const payload = buildPayload(getState().jobForm, status);

    if (
      !payload.title ||
      !payload.department ||
      !payload.location ||
      !payload.summary ||
      !getState().jobForm.form.locationPolicy ||
      !getState().jobForm.form.employmentType ||
      !getState().jobForm.form.seniorityLevel ||
      !getState().jobForm.form.educationLevel
    ) {
      throw new Error("Please complete the required job details before saving.");
    }

    return await createJobRequest(payload);
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Failed to save the job.");
  }
});

const jobFormSlice = createSlice({
  name: "jobForm",
  initialState,
  reducers: {
    updateFormField(
      state,
      action: PayloadAction<{ field: keyof JobFormFields; value: JobFormFields[keyof JobFormFields] }>
    ) {
      state.form = {
        ...state.form,
        [action.payload.field]: action.payload.value,
      };
    },
    updateWeightLabel(state, action: PayloadAction<{ id: string; label: string }>) {
      state.weightCriteria = state.weightCriteria.map((criterion) =>
        criterion.id === action.payload.id ? { ...criterion, label: action.payload.label } : criterion
      );
    },
    updateWeightValue(state, action: PayloadAction<{ id: string; value: number }>) {
      const otherTotal = state.weightCriteria.reduce(
        (sum, criterion) => (criterion.id === action.payload.id ? sum : sum + criterion.value),
        0
      );
      const maxAllowed = Math.max(0, 100 - otherTotal);
      const normalizedValue = Number.isNaN(action.payload.value)
        ? 0
        : Math.min(maxAllowed, Math.max(0, action.payload.value));

      state.weightCriteria = state.weightCriteria.map((criterion) =>
        criterion.id === action.payload.id ? { ...criterion, value: normalizedValue } : criterion
      );
    },
    addWeightCriterion(state) {
      state.weightCriteria.push({
        id: `criterion-${Date.now()}`,
        label: `Custom Criterion ${state.weightCriteria.length - 3}`,
        value: 0,
      });
    },
    removeWeightCriterion(state, action: PayloadAction<string>) {
      state.weightCriteria = state.weightCriteria.filter((criterion) => criterion.id !== action.payload);
    },
    setShowSuccessModal(state, action: PayloadAction<boolean>) {
      state.showSuccessModal = action.payload;
    },
    clearJobFormError(state) {
      state.error = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitJob.pending, (state) => {
        state.isSubmitting = true;
        state.error = "";
      })
      .addCase(submitJob.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.showSuccessModal = true;
        state.createdJobTitle = action.payload.data.title;
      })
      .addCase(submitJob.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload || "Failed to save the job.";
      });
  },
});

export const {
  addWeightCriterion,
  clearJobFormError,
  removeWeightCriterion,
  setShowSuccessModal,
  updateFormField,
  updateWeightLabel,
  updateWeightValue,
} = jobFormSlice.actions;

export default jobFormSlice.reducer;
