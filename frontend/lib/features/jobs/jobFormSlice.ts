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
  locationPolicy: LocationPolicy;
  employmentType: EmploymentType;
  salaryBand: string;
  summary: string;
  responsibilities: string;
  mustHaveQualifications: string;
  niceToHaveQualifications: string;
  coreHardSkills: string;
  preferredSkills: string;
  coreSoftSkills: string;
  experienceYears: string;
  seniorityLevel: SeniorityLevel;
  educationLevel: EducationLevel;
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
  title: "Senior Frontend Engineer",
  department: "Product & Engineering",
  location: "Remote (Africa/Europe)",
  locationPolicy: "remote",
  employmentType: "full-time",
  salaryBand: "$70,000 - $110,000 USD",
  summary:
    "We are seeking a talented Senior Frontend Engineer to join our Product Engineering team. You will be responsible for building and maintaining high-quality web applications that serve thousands of users daily. This is a key role that influences both the technical direction and user experience of our platform.",
  responsibilities:
    "• Architect, build, and maintain scalable frontend applications using React, TypeScript, and Next.js\n• Collaborate closely with designers, product managers, and backend engineers to deliver exceptional user experiences\n• Lead code reviews and establish engineering best practices across the frontend codebase\n• Mentor junior developers and contribute to a culture of continuous learning\n• Optimize application performance, accessibility, and SEO\n• Participate in sprint planning, technical design discussions, and architecture reviews\n• Write comprehensive unit and integration tests using Testing Library and Cypress\n• Contribute to our design system and component library",
  mustHaveQualifications:
    "• 5+ years of professional frontend development experience\n• Strong proficiency in React, TypeScript, and modern CSS (Tailwind preferred)\n• Experience with server-side rendering (Next.js) and state management\n• Solid understanding of web performance optimization techniques\n• Excellent communication skills and ability to work in distributed teams",
  niceToHaveQualifications:
    "• Experience with GraphQL, REST API design, or backend technologies (Node.js)\n• Familiarity with CI/CD pipelines and deployment automation\n• Contributions to open-source projects\n• Experience in a high-growth SaaS environment",
  coreHardSkills:
    "• TypeScript\n• React\n• Next.js\n• Tailwind CSS\n• Frontend architecture\n• Component-driven development",
  preferredSkills:
    "• GraphQL\n• Design systems\n• Testing Library / Cypress\n• Performance optimization\n• Accessibility auditing\n• Mentoring or tech leadership",
  coreSoftSkills:
    "• Clear written and verbal communication\n• Ownership and accountability\n• Cross-functional collaboration\n• Mentorship mindset\n• Product thinking",
  experienceYears: "5",
  seniorityLevel: "senior",
  educationLevel: "bs",
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

  if (authUser?.role === "admin") {
    throw new Error("Admin job creation needs a recruiter hiring manager, and this screen does not support selecting one yet.");
  }

  return {
    title: state.form.title.trim(),
    department: state.form.department.trim(),
    hiringManager: authUser?.role === "recruiter" ? authUser._id : undefined,
    location: state.form.location.trim(),
    locationPolicy: state.form.locationPolicy,
    employmentType: state.form.employmentType,
    salaryBand: state.form.salaryBand.trim() || undefined,
    summary: state.form.summary.trim(),
    responsibilities: state.form.responsibilities.trim(),
    mustHaveQualifications: state.form.mustHaveQualifications.trim(),
    niceToHaveQualifications: state.form.niceToHaveQualifications.trim() || undefined,
    coreHardSkills: splitLinesToList(state.form.coreHardSkills),
    preferredSkills: splitLinesToList(state.form.preferredSkills),
    coreSoftSkills: splitLinesToList(state.form.coreSoftSkills),
    experienceYears: Number(state.form.experienceYears) || 0,
    seniorityLevel: state.form.seniorityLevel,
    educationLevel: state.form.educationLevel,
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

    if (!payload.title || !payload.department || !payload.location || !payload.summary) {
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
