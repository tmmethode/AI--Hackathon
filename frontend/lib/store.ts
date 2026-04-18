import { configureStore } from "@reduxjs/toolkit";
import jobFormReducer from "@/lib/features/jobs/jobFormSlice";
import jobsReducer from "@/lib/features/jobs/jobsSlice";

export const store = configureStore({
  reducer: {
    jobs: jobsReducer,
    jobForm: jobFormReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
