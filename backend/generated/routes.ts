/* tslint:disable */
/* eslint-disable */
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import type { TsoaRoute } from '@tsoa/runtime';
import {  fetchMiddlewares, ExpressTemplateService } from '@tsoa/runtime';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { JobController } from './../controllers/JobController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { HelloWorldController } from './../controllers/HelloWorldController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { GeminiController } from './../controllers/GeminiController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { AuthController } from './../controllers/AuthController';
import { expressAuthentication } from './../middleware/auth';
// @ts-ignore - no great way to install types from subpackage
import type { Request as ExRequest, Response as ExResponse, RequestHandler, Router } from 'express';

const expressAuthenticationRecasted = expressAuthentication as (req: ExRequest, securityName: string, scopes?: string[], res?: ExResponse) => Promise<any>;


// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

const models: TsoaRoute.Models = {
    "HiringManagerSummary": {
        "dataType": "refObject",
        "properties": {
            "_id": {"dataType":"string","required":true},
            "firstName": {"dataType":"string","required":true},
            "lastName": {"dataType":"string","required":true},
            "email": {"dataType":"string","required":true},
            "profilePicture": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "LocationPolicy": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["remote"]},{"dataType":"enum","enums":["hybrid"]},{"dataType":"enum","enums":["onsite"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "EmploymentType": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["full-time"]},{"dataType":"enum","enums":["part-time"]},{"dataType":"enum","enums":["contract"]},{"dataType":"enum","enums":["internship"]},{"dataType":"enum","enums":["temporary"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SeniorityLevel": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["junior"]},{"dataType":"enum","enums":["mid"]},{"dataType":"enum","enums":["senior"]},{"dataType":"enum","enums":["lead"]},{"dataType":"enum","enums":["manager"]},{"dataType":"enum","enums":["principal"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "EducationLevel": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["none"]},{"dataType":"enum","enums":["hs"]},{"dataType":"enum","enums":["associate"]},{"dataType":"enum","enums":["bs"]},{"dataType":"enum","enums":["ms"]},{"dataType":"enum","enums":["mba"]},{"dataType":"enum","enums":["phd"]},{"dataType":"enum","enums":["professional"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "WeightCriterionDTO": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "label": {"dataType":"string","required":true},
            "value": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "JobStatus": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["Active"]},{"dataType":"enum","enums":["Draft"]},{"dataType":"enum","enums":["Closed"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "IJobResponse": {
        "dataType": "refObject",
        "properties": {
            "_id": {"dataType":"string","required":true},
            "title": {"dataType":"string","required":true},
            "department": {"dataType":"string","required":true},
            "hiringManager": {"ref":"HiringManagerSummary","required":true},
            "location": {"dataType":"string","required":true},
            "locationPolicy": {"ref":"LocationPolicy","required":true},
            "employmentType": {"ref":"EmploymentType","required":true},
            "salaryBand": {"dataType":"string"},
            "summary": {"dataType":"string","required":true},
            "responsibilities": {"dataType":"string","required":true},
            "mustHaveQualifications": {"dataType":"string","required":true},
            "niceToHaveQualifications": {"dataType":"string"},
            "coreHardSkills": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "preferredSkills": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "coreSoftSkills": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "experienceYears": {"dataType":"double","required":true},
            "seniorityLevel": {"ref":"SeniorityLevel","required":true},
            "educationLevel": {"ref":"EducationLevel","required":true},
            "weightCriteria": {"dataType":"array","array":{"dataType":"refObject","ref":"WeightCriterionDTO"},"required":true},
            "status": {"ref":"JobStatus","required":true},
            "applicantsCount": {"dataType":"double","required":true},
            "createdBy": {"dataType":"string","required":true},
            "createdAt": {"dataType":"string","required":true},
            "updatedAt": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "JobListResponse": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"refObject","ref":"IJobResponse"},"required":true},
            "total": {"dataType":"double","required":true},
            "page": {"dataType":"double","required":true},
            "pageSize": {"dataType":"double","required":true},
            "totalPages": {"dataType":"double","required":true},
            "message": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "JobResponse": {
        "dataType": "refObject",
        "properties": {
            "data": {"ref":"IJobResponse","required":true},
            "message": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateJobRequest": {
        "dataType": "refObject",
        "properties": {
            "title": {"dataType":"string","required":true},
            "department": {"dataType":"string","required":true},
            "hiringManager": {"dataType":"string"},
            "location": {"dataType":"string","required":true},
            "locationPolicy": {"ref":"LocationPolicy"},
            "employmentType": {"ref":"EmploymentType"},
            "salaryBand": {"dataType":"string"},
            "summary": {"dataType":"string","required":true},
            "responsibilities": {"dataType":"string","required":true},
            "mustHaveQualifications": {"dataType":"string","required":true},
            "niceToHaveQualifications": {"dataType":"string"},
            "coreHardSkills": {"dataType":"array","array":{"dataType":"string"}},
            "preferredSkills": {"dataType":"array","array":{"dataType":"string"}},
            "coreSoftSkills": {"dataType":"array","array":{"dataType":"string"}},
            "experienceYears": {"dataType":"double"},
            "seniorityLevel": {"ref":"SeniorityLevel"},
            "educationLevel": {"ref":"EducationLevel"},
            "weightCriteria": {"dataType":"array","array":{"dataType":"refObject","ref":"WeightCriterionDTO"}},
            "status": {"ref":"JobStatus"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateJobRequest": {
        "dataType": "refObject",
        "properties": {
            "title": {"dataType":"string"},
            "department": {"dataType":"string"},
            "hiringManager": {"dataType":"string"},
            "location": {"dataType":"string"},
            "locationPolicy": {"ref":"LocationPolicy"},
            "employmentType": {"ref":"EmploymentType"},
            "salaryBand": {"dataType":"string"},
            "summary": {"dataType":"string"},
            "responsibilities": {"dataType":"string"},
            "mustHaveQualifications": {"dataType":"string"},
            "niceToHaveQualifications": {"dataType":"string"},
            "coreHardSkills": {"dataType":"array","array":{"dataType":"string"}},
            "preferredSkills": {"dataType":"array","array":{"dataType":"string"}},
            "coreSoftSkills": {"dataType":"array","array":{"dataType":"string"}},
            "experienceYears": {"dataType":"double"},
            "seniorityLevel": {"ref":"SeniorityLevel"},
            "educationLevel": {"ref":"EducationLevel"},
            "weightCriteria": {"dataType":"array","array":{"dataType":"refObject","ref":"WeightCriterionDTO"}},
            "status": {"ref":"JobStatus"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DeleteJobResponse": {
        "dataType": "refObject",
        "properties": {
            "message": {"dataType":"string","required":true},
            "id": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GeminiFrontendConfigResponse": {
        "dataType": "refObject",
        "properties": {
            "configured": {"dataType":"boolean","required":true},
            "model": {"dataType":"string","required":true},
            "defaults": {"dataType":"nestedObjectLiteral","nestedProperties":{"maxOutputTokens":{"dataType":"double","required":true},"temperature":{"dataType":"double","required":true},"maxShortlistSize":{"dataType":"double","required":true},"minShortlistSize":{"dataType":"double","required":true},"shortlistSize":{"dataType":"double","required":true}},"required":true},
            "contracts": {"dataType":"nestedObjectLiteral","nestedProperties":{"candidateFields":{"dataType":"array","array":{"dataType":"string"},"required":true},"jobFields":{"dataType":"array","array":{"dataType":"string"},"required":true}},"required":true},
            "endpoints": {"dataType":"nestedObjectLiteral","nestedProperties":{"frontendConfig":{"dataType":"string","required":true},"screenRun":{"dataType":"string","required":true},"screenCandidate":{"dataType":"string","required":true},"generate":{"dataType":"string","required":true},"health":{"dataType":"string","required":true}},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GeminiUsageMetadata": {
        "dataType": "refObject",
        "properties": {
            "promptTokenCount": {"dataType":"double"},
            "candidatesTokenCount": {"dataType":"double"},
            "totalTokenCount": {"dataType":"double"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GeminiGenerateResponse": {
        "dataType": "refObject",
        "properties": {
            "text": {"dataType":"string","required":true},
            "model": {"dataType":"string","required":true},
            "usage": {"ref":"GeminiUsageMetadata"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GeminiGenerateRequest": {
        "dataType": "refObject",
        "properties": {
            "prompt": {"dataType":"string","required":true},
            "systemInstruction": {"dataType":"string"},
            "temperature": {"dataType":"double"},
            "maxOutputTokens": {"dataType":"double"},
            "responseMimeType": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["text/plain"]},{"dataType":"enum","enums":["application/json"]}]},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GeminiCriterionAssessment": {
        "dataType": "refObject",
        "properties": {
            "label": {"dataType":"string","required":true},
            "weightPct": {"dataType":"double","required":true},
            "score": {"dataType":"double","required":true},
            "weightedScore": {"dataType":"double","required":true},
            "summary": {"dataType":"string","required":true},
            "evidence": {"dataType":"array","array":{"dataType":"string"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GeminiCandidateScreenResponse": {
        "dataType": "refObject",
        "properties": {
            "recommendation": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["strong_yes"]},{"dataType":"enum","enums":["yes"]},{"dataType":"enum","enums":["maybe"]},{"dataType":"enum","enums":["no"]}],"required":true},
            "score": {"dataType":"double","required":true},
            "mustHaveMatchScore": {"dataType":"double","required":true},
            "dataCompletenessScore": {"dataType":"double","required":true},
            "summary": {"dataType":"string","required":true},
            "strengths": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "concerns": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "evidence": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "criterionAssessments": {"dataType":"array","array":{"dataType":"refObject","ref":"GeminiCriterionAssessment"},"required":true},
            "raw": {"dataType":"string","required":true},
            "model": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GeminiRankingCriterion": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string"},
            "label": {"dataType":"string","required":true},
            "pct": {"dataType":"double","required":true},
            "description": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GeminiJobContext": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string"},
            "title": {"dataType":"string","required":true},
            "department": {"dataType":"string"},
            "locationPolicy": {"dataType":"string"},
            "employmentType": {"dataType":"string"},
            "salaryBand": {"dataType":"string"},
            "summary": {"dataType":"string"},
            "responsibilities": {"dataType":"array","array":{"dataType":"string"}},
            "mustHaveQualifications": {"dataType":"array","array":{"dataType":"string"}},
            "niceToHaveQualifications": {"dataType":"array","array":{"dataType":"string"}},
            "hardSkills": {"dataType":"array","array":{"dataType":"string"}},
            "coreHardSkills": {"dataType":"array","array":{"dataType":"string"}},
            "preferredBonusSkills": {"dataType":"array","array":{"dataType":"string"}},
            "softSkills": {"dataType":"array","array":{"dataType":"string"}},
            "coreSoftSkills": {"dataType":"array","array":{"dataType":"string"}},
            "experience": {"dataType":"string"},
            "seniorityLevel": {"dataType":"string"},
            "educationLevel": {"dataType":"string"},
            "rankingCriteria": {"dataType":"array","array":{"dataType":"refObject","ref":"GeminiRankingCriterion"}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GeminiImportedCandidateData": {
        "dataType": "refObject",
        "properties": {
            "source": {"dataType":"string"},
            "extractedSkills": {"dataType":"array","array":{"dataType":"string"}},
            "experience": {"dataType":"string"},
            "educationLevel": {"dataType":"string"},
            "tags": {"dataType":"array","array":{"dataType":"string"}},
            "certifications": {"dataType":"array","array":{"dataType":"string"}},
            "notes": {"dataType":"array","array":{"dataType":"string"}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GeminiCandidateContext": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string"},
            "fullName": {"dataType":"string"},
            "summary": {"dataType":"string"},
            "resumeText": {"dataType":"string","required":true},
            "importedData": {"ref":"GeminiImportedCandidateData"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GeminiCandidateScreenRequest": {
        "dataType": "refObject",
        "properties": {
            "job": {"ref":"GeminiJobContext","required":true},
            "candidate": {"ref":"GeminiCandidateContext","required":true},
            "instructions": {"dataType":"string"},
            "temperature": {"dataType":"double"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GeminiFrontendScreeningResult": {
        "dataType": "refObject",
        "properties": {
            "recommendation": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["strong_yes"]},{"dataType":"enum","enums":["yes"]},{"dataType":"enum","enums":["maybe"]},{"dataType":"enum","enums":["no"]}],"required":true},
            "score": {"dataType":"double","required":true},
            "mustHaveMatchScore": {"dataType":"double","required":true},
            "dataCompletenessScore": {"dataType":"double","required":true},
            "summary": {"dataType":"string","required":true},
            "strengths": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "concerns": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "evidence": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "criterionAssessments": {"dataType":"array","array":{"dataType":"refObject","ref":"GeminiCriterionAssessment"},"required":true},
            "raw": {"dataType":"string","required":true},
            "model": {"dataType":"string","required":true},
            "candidateId": {"dataType":"string"},
            "candidateName": {"dataType":"string"},
            "shortlisted": {"dataType":"boolean","required":true},
            "rank": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GeminiFrontendScreeningRunResponse": {
        "dataType": "refObject",
        "properties": {
            "runName": {"dataType":"string","required":true},
            "jobTitle": {"dataType":"string","required":true},
            "totalCandidates": {"dataType":"double","required":true},
            "shortlistSize": {"dataType":"double","required":true},
            "shortlistedCount": {"dataType":"double","required":true},
            "model": {"dataType":"string","required":true},
            "rankingCriteria": {"dataType":"array","array":{"dataType":"refObject","ref":"GeminiRankingCriterion"}},
            "summary": {"dataType":"string","required":true},
            "results": {"dataType":"array","array":{"dataType":"refObject","ref":"GeminiFrontendScreeningResult"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GeminiFrontendScreeningRunRequest": {
        "dataType": "refObject",
        "properties": {
            "runName": {"dataType":"string","required":true},
            "job": {"ref":"GeminiJobContext","required":true},
            "candidates": {"dataType":"array","array":{"dataType":"refObject","ref":"GeminiCandidateContext"},"required":true},
            "shortlistSize": {"dataType":"double"},
            "instructions": {"dataType":"string"},
            "temperature": {"dataType":"double"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UserRole": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["recruiter"]},{"dataType":"enum","enums":["admin"]},{"dataType":"enum","enums":["applicant"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "IUserResponse": {
        "dataType": "refObject",
        "properties": {
            "_id": {"dataType":"string","required":true},
            "email": {"dataType":"string","required":true},
            "firstName": {"dataType":"string","required":true},
            "lastName": {"dataType":"string","required":true},
            "role": {"ref":"UserRole","required":true},
            "googleId": {"dataType":"string"},
            "isEmailVerified": {"dataType":"boolean","required":true},
            "profilePicture": {"dataType":"string"},
            "phoneNumber": {"dataType":"string"},
            "createdAt": {"dataType":"string","required":true},
            "updatedAt": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AuthResponse": {
        "dataType": "refObject",
        "properties": {
            "user": {"ref":"IUserResponse","required":true},
            "token": {"dataType":"string","required":true},
            "message": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "RegisterRequest": {
        "dataType": "refObject",
        "properties": {
            "email": {"dataType":"string","required":true},
            "password": {"dataType":"string","required":true},
            "firstName": {"dataType":"string","required":true},
            "lastName": {"dataType":"string","required":true},
            "role": {"ref":"UserRole"},
            "phoneNumber": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "LoginRequest": {
        "dataType": "refObject",
        "properties": {
            "email": {"dataType":"string","required":true},
            "password": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ProfileResponse": {
        "dataType": "refObject",
        "properties": {
            "user": {"ref":"IUserResponse","required":true},
            "message": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "RefreshTokenRequest": {
        "dataType": "refObject",
        "properties": {
            "userId": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GoogleAuthRequest": {
        "dataType": "refObject",
        "properties": {
            "idToken": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
};
const templateService = new ExpressTemplateService(models, {"noImplicitAdditionalProperties":"throw-on-extras","bodyCoercion":true});

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa




export function RegisterRoutes(app: Router) {

    // ###########################################################################################################
    //  NOTE: If you do not see routes for all of your controllers in this file, then you might not have informed tsoa of where to look
    //      Please look into the "controllerPathGlobs" config option described in the readme: https://github.com/lukeautry/tsoa
    // ###########################################################################################################


    
        const argsJobController_listJobs: Record<string, TsoaRoute.ParameterSchema> = {
                search: {"in":"query","name":"search","dataType":"string"},
                status: {"in":"query","name":"status","dataType":"union","subSchemas":[{"ref":"JobStatus"},{"dataType":"enum","enums":["All"]}]},
                page: {"default":1,"in":"query","name":"page","dataType":"double"},
                pageSize: {"default":10,"in":"query","name":"pageSize","dataType":"double"},
        };
        app.get('/jobs',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(JobController)),
            ...(fetchMiddlewares<RequestHandler>(JobController.prototype.listJobs)),

            async function JobController_listJobs(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsJobController_listJobs, request, response });

                const controller = new JobController();

              await templateService.apiHandler({
                methodName: 'listJobs',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsJobController_getJob: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.get('/jobs/:id',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(JobController)),
            ...(fetchMiddlewares<RequestHandler>(JobController.prototype.getJob)),

            async function JobController_getJob(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsJobController_getJob, request, response });

                const controller = new JobController();

              await templateService.apiHandler({
                methodName: 'getJob',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsJobController_createJob: Record<string, TsoaRoute.ParameterSchema> = {
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
                body: {"in":"body","name":"body","required":true,"ref":"CreateJobRequest"},
        };
        app.post('/jobs',
            authenticateMiddleware([{"jwt":["recruiter","admin"]}]),
            ...(fetchMiddlewares<RequestHandler>(JobController)),
            ...(fetchMiddlewares<RequestHandler>(JobController.prototype.createJob)),

            async function JobController_createJob(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsJobController_createJob, request, response });

                const controller = new JobController();

              await templateService.apiHandler({
                methodName: 'createJob',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 201,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsJobController_updateJob: Record<string, TsoaRoute.ParameterSchema> = {
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"UpdateJobRequest"},
        };
        app.put('/jobs/:id',
            authenticateMiddleware([{"jwt":["recruiter","admin"]}]),
            ...(fetchMiddlewares<RequestHandler>(JobController)),
            ...(fetchMiddlewares<RequestHandler>(JobController.prototype.updateJob)),

            async function JobController_updateJob(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsJobController_updateJob, request, response });

                const controller = new JobController();

              await templateService.apiHandler({
                methodName: 'updateJob',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsJobController_patchJob: Record<string, TsoaRoute.ParameterSchema> = {
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"UpdateJobRequest"},
        };
        app.patch('/jobs/:id',
            authenticateMiddleware([{"jwt":["recruiter","admin"]}]),
            ...(fetchMiddlewares<RequestHandler>(JobController)),
            ...(fetchMiddlewares<RequestHandler>(JobController.prototype.patchJob)),

            async function JobController_patchJob(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsJobController_patchJob, request, response });

                const controller = new JobController();

              await templateService.apiHandler({
                methodName: 'patchJob',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsJobController_changeStatus: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"status":{"ref":"JobStatus","required":true}}},
        };
        app.patch('/jobs/:id/status',
            authenticateMiddleware([{"jwt":["recruiter","admin"]}]),
            ...(fetchMiddlewares<RequestHandler>(JobController)),
            ...(fetchMiddlewares<RequestHandler>(JobController.prototype.changeStatus)),

            async function JobController_changeStatus(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsJobController_changeStatus, request, response });

                const controller = new JobController();

              await templateService.apiHandler({
                methodName: 'changeStatus',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsJobController_archiveJob: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.patch('/jobs/:id/archive',
            authenticateMiddleware([{"jwt":["recruiter","admin"]}]),
            ...(fetchMiddlewares<RequestHandler>(JobController)),
            ...(fetchMiddlewares<RequestHandler>(JobController.prototype.archiveJob)),

            async function JobController_archiveJob(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsJobController_archiveJob, request, response });

                const controller = new JobController();

              await templateService.apiHandler({
                methodName: 'archiveJob',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsJobController_deleteJob: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.delete('/jobs/:id',
            authenticateMiddleware([{"jwt":["recruiter","admin"]}]),
            ...(fetchMiddlewares<RequestHandler>(JobController)),
            ...(fetchMiddlewares<RequestHandler>(JobController.prototype.deleteJob)),

            async function JobController_deleteJob(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsJobController_deleteJob, request, response });

                const controller = new JobController();

              await templateService.apiHandler({
                methodName: 'deleteJob',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsHelloWorldController_getHelloWorld: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/hello',
            ...(fetchMiddlewares<RequestHandler>(HelloWorldController)),
            ...(fetchMiddlewares<RequestHandler>(HelloWorldController.prototype.getHelloWorld)),

            async function HelloWorldController_getHelloWorld(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsHelloWorldController_getHelloWorld, request, response });

                const controller = new HelloWorldController();

              await templateService.apiHandler({
                methodName: 'getHelloWorld',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsHelloWorldController_createHelloWorld: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/hello/create',
            ...(fetchMiddlewares<RequestHandler>(HelloWorldController)),
            ...(fetchMiddlewares<RequestHandler>(HelloWorldController.prototype.createHelloWorld)),

            async function HelloWorldController_createHelloWorld(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsHelloWorldController_createHelloWorld, request, response });

                const controller = new HelloWorldController();

              await templateService.apiHandler({
                methodName: 'createHelloWorld',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsGeminiController_health: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/gemini/health',
            ...(fetchMiddlewares<RequestHandler>(GeminiController)),
            ...(fetchMiddlewares<RequestHandler>(GeminiController.prototype.health)),

            async function GeminiController_health(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsGeminiController_health, request, response });

                const controller = new GeminiController();

              await templateService.apiHandler({
                methodName: 'health',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsGeminiController_frontendConfig: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/gemini/frontend-config',
            ...(fetchMiddlewares<RequestHandler>(GeminiController)),
            ...(fetchMiddlewares<RequestHandler>(GeminiController.prototype.frontendConfig)),

            async function GeminiController_frontendConfig(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsGeminiController_frontendConfig, request, response });

                const controller = new GeminiController();

              await templateService.apiHandler({
                methodName: 'frontendConfig',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsGeminiController_generate: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"GeminiGenerateRequest"},
        };
        app.post('/gemini/generate',
            ...(fetchMiddlewares<RequestHandler>(GeminiController)),
            ...(fetchMiddlewares<RequestHandler>(GeminiController.prototype.generate)),

            async function GeminiController_generate(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsGeminiController_generate, request, response });

                const controller = new GeminiController();

              await templateService.apiHandler({
                methodName: 'generate',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsGeminiController_screenCandidate: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"GeminiCandidateScreenRequest"},
        };
        app.post('/gemini/screen-candidate',
            ...(fetchMiddlewares<RequestHandler>(GeminiController)),
            ...(fetchMiddlewares<RequestHandler>(GeminiController.prototype.screenCandidate)),

            async function GeminiController_screenCandidate(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsGeminiController_screenCandidate, request, response });

                const controller = new GeminiController();

              await templateService.apiHandler({
                methodName: 'screenCandidate',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsGeminiController_screenRun: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"GeminiFrontendScreeningRunRequest"},
        };
        app.post('/gemini/screen-run',
            ...(fetchMiddlewares<RequestHandler>(GeminiController)),
            ...(fetchMiddlewares<RequestHandler>(GeminiController.prototype.screenRun)),

            async function GeminiController_screenRun(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsGeminiController_screenRun, request, response });

                const controller = new GeminiController();

              await templateService.apiHandler({
                methodName: 'screenRun',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAuthController_register: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"RegisterRequest"},
        };
        app.post('/auth/register',
            ...(fetchMiddlewares<RequestHandler>(AuthController)),
            ...(fetchMiddlewares<RequestHandler>(AuthController.prototype.register)),

            async function AuthController_register(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_register, request, response });

                const controller = new AuthController();

              await templateService.apiHandler({
                methodName: 'register',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAuthController_login: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"LoginRequest"},
        };
        app.post('/auth/login',
            ...(fetchMiddlewares<RequestHandler>(AuthController)),
            ...(fetchMiddlewares<RequestHandler>(AuthController.prototype.login)),

            async function AuthController_login(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_login, request, response });

                const controller = new AuthController();

              await templateService.apiHandler({
                methodName: 'login',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAuthController_getProfile: Record<string, TsoaRoute.ParameterSchema> = {
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.get('/auth/me',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AuthController)),
            ...(fetchMiddlewares<RequestHandler>(AuthController.prototype.getProfile)),

            async function AuthController_getProfile(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_getProfile, request, response });

                const controller = new AuthController();

              await templateService.apiHandler({
                methodName: 'getProfile',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAuthController_refreshToken: Record<string, TsoaRoute.ParameterSchema> = {
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
                requestBody: {"in":"body","name":"requestBody","ref":"RefreshTokenRequest"},
        };
        app.post('/auth/refresh',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AuthController)),
            ...(fetchMiddlewares<RequestHandler>(AuthController.prototype.refreshToken)),

            async function AuthController_refreshToken(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_refreshToken, request, response });

                const controller = new AuthController();

              await templateService.apiHandler({
                methodName: 'refreshToken',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAuthController_googleAuth: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"GoogleAuthRequest"},
        };
        app.post('/auth/google',
            ...(fetchMiddlewares<RequestHandler>(AuthController)),
            ...(fetchMiddlewares<RequestHandler>(AuthController.prototype.googleAuth)),

            async function AuthController_googleAuth(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_googleAuth, request, response });

                const controller = new AuthController();

              await templateService.apiHandler({
                methodName: 'googleAuth',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa


    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    function authenticateMiddleware(security: TsoaRoute.Security[] = []) {
        return async function runAuthenticationMiddleware(request: any, response: any, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            // keep track of failed auth attempts so we can hand back the most
            // recent one.  This behavior was previously existing so preserving it
            // here
            const failedAttempts: any[] = [];
            const pushAndRethrow = (error: any) => {
                failedAttempts.push(error);
                throw error;
            };

            const secMethodOrPromises: Promise<any>[] = [];
            for (const secMethod of security) {
                if (Object.keys(secMethod).length > 1) {
                    const secMethodAndPromises: Promise<any>[] = [];

                    for (const name in secMethod) {
                        secMethodAndPromises.push(
                            expressAuthenticationRecasted(request, name, secMethod[name], response)
                                .catch(pushAndRethrow)
                        );
                    }

                    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

                    secMethodOrPromises.push(Promise.all(secMethodAndPromises)
                        .then(users => { return users[0]; }));
                } else {
                    for (const name in secMethod) {
                        secMethodOrPromises.push(
                            expressAuthenticationRecasted(request, name, secMethod[name], response)
                                .catch(pushAndRethrow)
                        );
                    }
                }
            }

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            try {
                request['user'] = await Promise.any(secMethodOrPromises);

                // Response was sent in middleware, abort
                if (response.writableEnded) {
                    return;
                }

                next();
            }
            catch(err) {
                // Show most recent error as response
                const error = failedAttempts.pop();
                error.status = error.status || 401;

                // Response was sent in middleware, abort
                if (response.writableEnded) {
                    return;
                }
                next(error);
            }

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        }
    }

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
}

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
