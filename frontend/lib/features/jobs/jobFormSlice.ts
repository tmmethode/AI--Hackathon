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

export const DEFAULT_WEIGHT_CRITERIA: WeightCriterion[] = [
  { id: "must-have-qualifications", label: "Must-have Qualifications", value: 30 },
  { id: "nice-to-have-qualifications", label: "Nice-to-have Qualifications", value: 10 },
  { id: "core-skills", label: "Core Hard & Soft Skills", value: 25 },
  { id: "experience-seniority", label: "Years of Experience & Seniority Level", value: 25 },
  { id: "education", label: "Educational Background", value: 10 },
];

interface JobFormFields {
  title: string;
  location: string;
  locationPolicy: LocationPolicy | "";
  employmentType: EmploymentType | "";
  salaryBand: string;
  description: string;
  responsibilities: string;
  mustHaveQualifications: string;
  niceToHaveQualifications: string;
  coreHardSkills: string;
  coreSoftSkills: string;
  experienceYears: string;
  seniorityLevel: SeniorityLevel | "";
  educationLevel: EducationLevel | "";
}

export interface ParsedJobImportData {
  title?: string;
  hiringManager?: string;
  location?: string;
  locationPolicy?: LocationPolicy;
  employmentType?: EmploymentType;
  salaryBand?: string;
  description?: string;
  responsibilities?: string;
  mustHaveQualifications?: string;
  niceToHaveQualifications?: string;
  coreHardSkills?: string[];
  coreSoftSkills?: string[];
  experienceYears?: number;
  seniorityLevel?: SeniorityLevel;
  educationLevel?: EducationLevel;
  weightCriteria?: WeightCriterion[];
  status?: "Active" | "Draft" | "Closed";
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
  location: "",
  locationPolicy: "",
  employmentType: "",
  salaryBand: "",
  description: "",
  responsibilities: "",
  mustHaveQualifications: "",
  niceToHaveQualifications: "",
  coreHardSkills: "",
  coreSoftSkills: "",
  experienceYears: "",
  seniorityLevel: "",
  educationLevel: "",
};

const initialState: JobFormState = {
  form: initialForm,
  weightCriteria: DEFAULT_WEIGHT_CRITERIA.map((criterion) => ({ ...criterion })),
  showSuccessModal: false,
  createdJobTitle: "",
  error: "",
  isSubmitting: false,
};

function clampWeight(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

function canonicalCriterionId(criterion: WeightCriterion): string | undefined {
  const id = criterion.id.trim().toLowerCase();
  const label = criterion.label.trim().toLowerCase();

  if (["must-have-qualifications", "must-have", "mandatory", "requirements"].includes(id) || label.includes("must-have") || label.includes("mandatory") || label.includes("non-negotiable")) {
    return "must-have-qualifications";
  }

  if (["nice-to-have-qualifications", "nice-to-have", "preferred", "bonus"].includes(id) || label.includes("nice-to-have") || label.includes("preferred") || label.includes("bonus")) {
    return "nice-to-have-qualifications";
  }

  if (["technical-skills", "skills", "skill-match", "core-hard-skills", "soft-skills", "culture", "culture-soft-skills", "core-skills", "relevance"].includes(id) || label.includes("technical") || label.includes("skill") || label.includes("culture") || label.includes("soft")) {
    return "core-skills";
  }

  if (["experience", "years-of-experience", "experience-seniority"].includes(id) || label.includes("experience") || label.includes("seniority")) {
    return "experience-seniority";
  }

  if (["education", "educational-background", "education-level"].includes(id) || label.includes("education")) {
    return "education";
  }

  return undefined;
}

function normalizeWeightCriteria(criteria?: WeightCriterion[]): WeightCriterion[] {
  if (!criteria || criteria.length === 0) {
    return DEFAULT_WEIGHT_CRITERIA.map((criterion) => ({ ...criterion }));
  }

  const valuesById = new Map<string, number>();

  for (const criterion of criteria) {
    const id = canonicalCriterionId(criterion);
    if (!id || valuesById.has(id)) {
      continue;
    }

    valuesById.set(id, clampWeight(Number(criterion.value)));
  }

  const normalized = DEFAULT_WEIGHT_CRITERIA.map((criterion) => ({
    ...criterion,
    value: valuesById.get(criterion.id) ?? criterion.value,
  }));

  return rebalanceWeightCriteria(normalized, normalized[0].id, normalized[0].value);
}

function distributeRemaining(criteria: WeightCriterion[], remainingTotal: number): WeightCriterion[] {
  if (criteria.length === 0) {
    return [];
  }

  const oldTotal = criteria.reduce((sum, criterion) => sum + criterion.value, 0);

  if (oldTotal <= 0) {
    const base = Math.floor(remainingTotal / criteria.length);
    let diff = remainingTotal - base * criteria.length;

    return criteria.map((criterion) => {
      const value = base + (diff > 0 ? 1 : 0);
      diff -= diff > 0 ? 1 : 0;
      return { ...criterion, value };
    });
  }

  const distributed = criteria.map((criterion) => ({
    ...criterion,
    value: Math.floor((criterion.value / oldTotal) * remainingTotal),
  }));
  let diff = remainingTotal - distributed.reduce((sum, criterion) => sum + criterion.value, 0);

  return distributed.map((criterion) => {
    if (diff <= 0) {
      return criterion;
    }

    diff -= 1;
    return { ...criterion, value: criterion.value + 1 };
  });
}

function rebalanceWeightCriteria(
  criteria: WeightCriterion[],
  changedId: string,
  nextValue: number
): WeightCriterion[] {
  const canonical = normalizeWeightCriteriaShape(criteria);
  const clampedValue = clampWeight(nextValue);
  const changed = canonical.find((criterion) => criterion.id === changedId);

  if (!changed) {
    return canonical;
  }

  const others = canonical.filter((criterion) => criterion.id !== changedId);
  const rebalancedOthers = distributeRemaining(others, 100 - clampedValue);
  const valuesById = new Map(
    [{ ...changed, value: clampedValue }, ...rebalancedOthers].map((criterion) => [
      criterion.id,
      criterion.value,
    ])
  );

  return canonical.map((criterion) => ({
    ...criterion,
    value: valuesById.get(criterion.id) ?? 0,
  }));
}

function normalizeWeightCriteriaShape(criteria: WeightCriterion[]): WeightCriterion[] {
  const valuesById = new Map(criteria.map((criterion) => [criterion.id, criterion.value]));

  return DEFAULT_WEIGHT_CRITERIA.map((criterion) => ({
    ...criterion,
    value: clampWeight(Number(valuesById.get(criterion.id) ?? criterion.value)),
  }));
}

function buildPayload(state: JobFormState, status: CreateJobPayload["status"]): CreateJobPayload {
  const authUser = getStoredAuthUser();
  const hiringManagerId =
    authUser?.role === "recruiter" || authUser?.role === "admin" ? authUser._id : undefined;

  return {
    title: state.form.title.trim(),
    hiringManager: hiringManagerId,
    location: state.form.location.trim(),
    locationPolicy: state.form.locationPolicy as LocationPolicy,
    employmentType: state.form.employmentType as EmploymentType,
    salaryBand: state.form.salaryBand.trim() || undefined,
    description: state.form.description.trim(),
    responsibilities: state.form.responsibilities.trim(),
    mustHaveQualifications: state.form.mustHaveQualifications.trim(),
    niceToHaveQualifications: state.form.niceToHaveQualifications.trim() || undefined,
    coreHardSkills: splitLinesToList(state.form.coreHardSkills),
    preferredSkills: [],
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
      !payload.location ||
      !payload.description ||
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
      state.weightCriteria = rebalanceWeightCriteria(
        state.weightCriteria,
        action.payload.id,
        action.payload.value
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
    mergeParsedJobData(state, action: PayloadAction<ParsedJobImportData>) {
      const parsed = action.payload;
      const nextForm = { ...state.form };

      if (parsed.title) nextForm.title = parsed.title;
      if (parsed.location) nextForm.location = parsed.location;
      if (parsed.locationPolicy) nextForm.locationPolicy = parsed.locationPolicy;
      if (parsed.employmentType) nextForm.employmentType = parsed.employmentType;
      if (parsed.salaryBand) nextForm.salaryBand = parsed.salaryBand;
      if (parsed.description) nextForm.description = parsed.description;
      if (parsed.responsibilities) nextForm.responsibilities = parsed.responsibilities;
      if (parsed.mustHaveQualifications) nextForm.mustHaveQualifications = parsed.mustHaveQualifications;
      if (parsed.niceToHaveQualifications) nextForm.niceToHaveQualifications = parsed.niceToHaveQualifications;
      if (Array.isArray(parsed.coreHardSkills) && parsed.coreHardSkills.length > 0) {
        nextForm.coreHardSkills = parsed.coreHardSkills.join("\n");
      }
      if (Array.isArray(parsed.coreSoftSkills) && parsed.coreSoftSkills.length > 0) {
        nextForm.coreSoftSkills = parsed.coreSoftSkills.join("\n");
      }
      if (typeof parsed.experienceYears === "number" && Number.isFinite(parsed.experienceYears)) {
        nextForm.experienceYears = String(Math.max(0, Math.round(parsed.experienceYears)));
      }
      if (parsed.seniorityLevel) nextForm.seniorityLevel = parsed.seniorityLevel;
      if (parsed.educationLevel) nextForm.educationLevel = parsed.educationLevel;

      state.form = nextForm;

      if (Array.isArray(parsed.weightCriteria) && parsed.weightCriteria.length > 0) {
        state.weightCriteria = normalizeWeightCriteria(parsed.weightCriteria);
      }
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
  mergeParsedJobData,
  removeWeightCriterion,
  setShowSuccessModal,
  updateFormField,
  updateWeightLabel,
  updateWeightValue,
} = jobFormSlice.actions;

export default jobFormSlice.reducer;
