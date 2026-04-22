/* tslint:disable */
/* eslint-disable */
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import type { TsoaRoute } from '@tsoa/runtime';
import {  fetchMiddlewares, ExpressTemplateService } from '@tsoa/runtime';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { SidebarController } from './../controllers/SidebarController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { ShortlistController } from './../controllers/ShortlistController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { NotificationController } from './../controllers/NotificationController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { JobController } from './../controllers/JobController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { HistoryController } from './../controllers/HistoryController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { GeminiController } from './../controllers/GeminiController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { DashboardController } from './../controllers/DashboardController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { AuthController } from './../controllers/AuthController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { ApplicantController } from './../controllers/ApplicantController';
import { expressAuthentication } from './../middleware/auth';
// @ts-ignore - no great way to install types from subpackage
import type { Request as ExRequest, Response as ExResponse, RequestHandler, Router } from 'express';

const expressAuthenticationRecasted = expressAuthentication as (req: ExRequest, securityName: string, scopes?: string[], res?: ExResponse) => Promise<any>;


// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

const models: TsoaRoute.Models = {
    "SidebarUsageDTO": {
        "dataType": "refObject",
        "properties": {
            "weeklyCount": {"dataType":"double","required":true},
            "totalCount": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SidebarUsageResponse": {
        "dataType": "refObject",
        "properties": {
            "data": {"ref":"SidebarUsageDTO","required":true},
            "message": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ShortlistSummaryDTO": {
        "dataType": "refObject",
        "properties": {
            "_id": {"dataType":"string","required":true},
            "job": {"dataType":"string","required":true},
            "jobTitle": {"dataType":"string","required":true},
            "department": {"dataType":"string","required":true},
            "runName": {"dataType":"string","required":true},
            "model": {"dataType":"string","required":true},
            "totalApplicants": {"dataType":"double","required":true},
            "shortlistCount": {"dataType":"double","required":true},
            "topMatchScore": {"dataType":"double","required":true},
            "topCandidateName": {"dataType":"string","required":true},
            "screeningStartedAt": {"dataType":"string"},
            "screeningCompletedAt": {"dataType":"string"},
            "screeningDurationSeconds": {"dataType":"double"},
            "createdBy": {"dataType":"string","required":true},
            "createdAt": {"dataType":"string","required":true},
            "updatedAt": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ShortlistListResponse": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"refObject","ref":"ShortlistSummaryDTO"},"required":true},
            "total": {"dataType":"double","required":true},
            "page": {"dataType":"double","required":true},
            "pageSize": {"dataType":"double","required":true},
            "totalPages": {"dataType":"double","required":true},
            "message": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ShortlistSelectItemDTO": {
        "dataType": "refObject",
        "properties": {
            "_id": {"dataType":"string","required":true},
            "runName": {"dataType":"string","required":true},
            "job": {"dataType":"string","required":true},
            "jobTitle": {"dataType":"string","required":true},
            "createdAt": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ShortlistSelectResponse": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"refObject","ref":"ShortlistSelectItemDTO"},"required":true},
            "message": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ShortlistRecommendation": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["Strong Reject"]},{"dataType":"enum","enums":["Reject"]},{"dataType":"enum","enums":["Consider"]},{"dataType":"enum","enums":["Shortlist"]},{"dataType":"enum","enums":["Strong Shortlist"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ShortlistResultEntryDTO": {
        "dataType": "refObject",
        "properties": {
            "candidateRank": {"dataType":"double","required":true},
            "applicantEmail": {"dataType":"string","required":true},
            "fullName": {"dataType":"string","required":true},
            "matchScore": {"dataType":"double","required":true},
            "confidenceScore": {"dataType":"double","required":true},
            "skillsScore": {"dataType":"double","required":true},
            "experienceScore": {"dataType":"double","required":true},
            "educationScore": {"dataType":"double","required":true},
            "relevanceScore": {"dataType":"double","required":true},
            "criticalRequirementGap": {"dataType":"boolean","required":true},
            "strengths": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "gapsOrRisks": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "finalRecommendation": {"ref":"ShortlistRecommendation","required":true},
            "summaryExplanation": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ShortlistEntryDTO": {
        "dataType": "refObject",
        "properties": {
            "candidateRank": {"dataType":"double","required":true},
            "applicantEmail": {"dataType":"string","required":true},
            "fullName": {"dataType":"string","required":true},
            "matchScore": {"dataType":"double","required":true},
            "confidenceScore": {"dataType":"double","required":true},
            "skillsScore": {"dataType":"double","required":true},
            "experienceScore": {"dataType":"double","required":true},
            "educationScore": {"dataType":"double","required":true},
            "relevanceScore": {"dataType":"double","required":true},
            "criticalRequirementGap": {"dataType":"boolean","required":true},
            "strengths": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "gapsOrRisks": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "finalRecommendation": {"ref":"ShortlistRecommendation","required":true},
            "summaryExplanation": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ShortlistDTO": {
        "dataType": "refObject",
        "properties": {
            "_id": {"dataType":"string","required":true},
            "job": {"dataType":"string","required":true},
            "jobTitle": {"dataType":"string","required":true},
            "department": {"dataType":"string","required":true},
            "runName": {"dataType":"string","required":true},
            "model": {"dataType":"string","required":true},
            "totalApplicants": {"dataType":"double","required":true},
            "shortlistCount": {"dataType":"double","required":true},
            "screeningResults": {"dataType":"array","array":{"dataType":"refObject","ref":"ShortlistResultEntryDTO"},"required":true},
            "shortlist": {"dataType":"array","array":{"dataType":"refObject","ref":"ShortlistEntryDTO"},"required":true},
            "instructions": {"dataType":"string"},
            "screeningStartedAt": {"dataType":"string"},
            "screeningCompletedAt": {"dataType":"string"},
            "screeningDurationSeconds": {"dataType":"double"},
            "createdBy": {"dataType":"string","required":true},
            "createdAt": {"dataType":"string","required":true},
            "updatedAt": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ShortlistResponse": {
        "dataType": "refObject",
        "properties": {
            "data": {"ref":"ShortlistDTO","required":true},
            "message": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateShortlistRequest": {
        "dataType": "refObject",
        "properties": {
            "jobId": {"dataType":"string","required":true},
            "runName": {"dataType":"string"},
            "jobTitle": {"dataType":"string","required":true},
            "department": {"dataType":"string"},
            "model": {"dataType":"string"},
            "totalApplicants": {"dataType":"double","required":true},
            "shortlistCount": {"dataType":"double","required":true},
            "screeningResults": {"dataType":"array","array":{"dataType":"refObject","ref":"ShortlistResultEntryDTO"},"required":true},
            "shortlist": {"dataType":"array","array":{"dataType":"refObject","ref":"ShortlistEntryDTO"},"required":true},
            "instructions": {"dataType":"string"},
            "screeningStartedAt": {"dataType":"string"},
            "screeningCompletedAt": {"dataType":"string"},
            "screeningDurationSeconds": {"dataType":"double"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DeleteShortlistResponse": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "message": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "NotificationType": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["screening"]},{"dataType":"enum","enums":["job"]},{"dataType":"enum","enums":["export"]},{"dataType":"enum","enums":["system"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "NotificationDTO": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "type": {"ref":"NotificationType","required":true},
            "title": {"dataType":"string","required":true},
            "body": {"dataType":"string","required":true},
            "detail": {"dataType":"string","required":true},
            "read": {"dataType":"boolean","required":true},
            "createdAt": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "NotificationListResponse": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"refObject","ref":"NotificationDTO"},"required":true},
            "total": {"dataType":"double","required":true},
            "message": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "NotificationResponse": {
        "dataType": "refObject",
        "properties": {
            "data": {"ref":"NotificationDTO","required":true},
            "message": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
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
    "JobSelectItemDTO": {
        "dataType": "refObject",
        "properties": {
            "_id": {"dataType":"string","required":true},
            "title": {"dataType":"string","required":true},
            "status": {"ref":"JobStatus","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "JobSelectResponse": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"refObject","ref":"JobSelectItemDTO"},"required":true},
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
    "HistoryRunSummaryDTO": {
        "dataType": "refObject",
        "properties": {
            "_id": {"dataType":"string","required":true},
            "runName": {"dataType":"string","required":true},
            "jobTitle": {"dataType":"string","required":true},
            "totalApplicants": {"dataType":"double","required":true},
            "shortlistCount": {"dataType":"double","required":true},
            "topMatchScore": {"dataType":"double","required":true},
            "topCandidateName": {"dataType":"string","required":true},
            "screeningCompletedAt": {"dataType":"string"},
            "screeningDurationSeconds": {"dataType":"double"},
            "createdAt": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "HistorySummaryDTO": {
        "dataType": "refObject",
        "properties": {
            "runs": {"dataType":"array","array":{"dataType":"refObject","ref":"HistoryRunSummaryDTO"},"required":true},
            "total": {"dataType":"double","required":true},
            "page": {"dataType":"double","required":true},
            "pageSize": {"dataType":"double","required":true},
            "totalPages": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "HistorySummaryResponse": {
        "dataType": "refObject",
        "properties": {
            "data": {"ref":"HistorySummaryDTO","required":true},
            "message": {"dataType":"string","required":true},
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
            "endpoints": {"dataType":"nestedObjectLiteral","nestedProperties":{"frontendConfig":{"dataType":"string","required":true},"screenBatch":{"dataType":"string","required":true},"screenRun":{"dataType":"string","required":true},"screenCandidate":{"dataType":"string","required":true},"generate":{"dataType":"string","required":true},"health":{"dataType":"string","required":true}},"required":true},
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
            "seed": {"dataType":"double"},
            "topP": {"dataType":"double"},
            "conversationHistory": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"content":{"dataType":"string","required":true},"role":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["user"]},{"dataType":"enum","enums":["assistant"]}],"required":true}}}},
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
    "GeminiBatchRecommendation": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["Strong Reject"]},{"dataType":"enum","enums":["Reject"]},{"dataType":"enum","enums":["Consider"]},{"dataType":"enum","enums":["Shortlist"]},{"dataType":"enum","enums":["Strong Shortlist"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GeminiBatchScreeningResultEntry": {
        "dataType": "refObject",
        "properties": {
            "candidateRank": {"dataType":"double","required":true},
            "applicantEmail": {"dataType":"string","required":true},
            "fullName": {"dataType":"string","required":true},
            "matchScore": {"dataType":"double","required":true},
            "confidenceScore": {"dataType":"double","required":true},
            "skillsScore": {"dataType":"double","required":true},
            "experienceScore": {"dataType":"double","required":true},
            "educationScore": {"dataType":"double","required":true},
            "relevanceScore": {"dataType":"double","required":true},
            "criticalRequirementGap": {"dataType":"boolean","required":true},
            "strengths": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "gapsOrRisks": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "finalRecommendation": {"ref":"GeminiBatchRecommendation","required":true},
            "summaryExplanation": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GeminiBatchShortlistEntry": {
        "dataType": "refObject",
        "properties": {
            "candidateRank": {"dataType":"double","required":true},
            "applicantEmail": {"dataType":"string","required":true},
            "fullName": {"dataType":"string","required":true},
            "matchScore": {"dataType":"double","required":true},
            "confidenceScore": {"dataType":"double","required":true},
            "skillsScore": {"dataType":"double","required":true},
            "experienceScore": {"dataType":"double","required":true},
            "educationScore": {"dataType":"double","required":true},
            "relevanceScore": {"dataType":"double","required":true},
            "criticalRequirementGap": {"dataType":"boolean","required":true},
            "strengths": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "gapsOrRisks": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "finalRecommendation": {"ref":"GeminiBatchRecommendation","required":true},
            "summaryExplanation": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GeminiBatchScreeningResponse": {
        "dataType": "refObject",
        "properties": {
            "jobTitle": {"dataType":"string","required":true},
            "department": {"dataType":"string","required":true},
            "shortlistCount": {"dataType":"double","required":true},
            "totalApplicants": {"dataType":"double","required":true},
            "screeningResults": {"dataType":"array","array":{"dataType":"refObject","ref":"GeminiBatchScreeningResultEntry"},"required":true},
            "shortlist": {"dataType":"array","array":{"dataType":"refObject","ref":"GeminiBatchShortlistEntry"},"required":true},
            "model": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GeminiWeightCriterion": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string"},
            "label": {"dataType":"string","required":true},
            "value": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GeminiBatchJob": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string"},
            "title": {"dataType":"string","required":true},
            "department": {"dataType":"string"},
            "hiringManager": {"dataType":"string"},
            "location": {"dataType":"string"},
            "locationPolicy": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["remote"]},{"dataType":"enum","enums":["hybrid"]},{"dataType":"enum","enums":["onsite"]},{"dataType":"string"}]},
            "employmentType": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["full-time"]},{"dataType":"enum","enums":["part-time"]},{"dataType":"enum","enums":["contract"]},{"dataType":"enum","enums":["internship"]},{"dataType":"string"}]},
            "salaryBand": {"dataType":"string"},
            "summary": {"dataType":"string"},
            "responsibilities": {"dataType":"string"},
            "mustHaveQualifications": {"dataType":"string"},
            "niceToHaveQualifications": {"dataType":"string"},
            "coreHardSkills": {"dataType":"array","array":{"dataType":"string"}},
            "preferredSkills": {"dataType":"array","array":{"dataType":"string"}},
            "coreSoftSkills": {"dataType":"array","array":{"dataType":"string"}},
            "experienceYears": {"dataType":"double"},
            "seniorityLevel": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["junior"]},{"dataType":"enum","enums":["mid"]},{"dataType":"enum","enums":["senior"]},{"dataType":"enum","enums":["lead"]},{"dataType":"enum","enums":["principal"]},{"dataType":"string"}]},
            "educationLevel": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["none"]},{"dataType":"enum","enums":["highschool"]},{"dataType":"enum","enums":["associate"]},{"dataType":"enum","enums":["bachelor"]},{"dataType":"enum","enums":["master"]},{"dataType":"enum","enums":["phd"]},{"dataType":"string"}]},
            "weightCriteria": {"dataType":"array","array":{"dataType":"refObject","ref":"GeminiWeightCriterion"}},
            "status": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GeminiApplicantSkill": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "level": {"dataType":"string"},
            "yearsOfExperience": {"dataType":"double"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GeminiApplicantLanguage": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "proficiency": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GeminiApplicantExperience": {
        "dataType": "refObject",
        "properties": {
            "company": {"dataType":"string"},
            "role": {"dataType":"string"},
            "startDate": {"dataType":"string"},
            "endDate": {"dataType":"string"},
            "description": {"dataType":"string"},
            "technologies": {"dataType":"array","array":{"dataType":"string"}},
            "isCurrent": {"dataType":"boolean"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GeminiApplicantEducation": {
        "dataType": "refObject",
        "properties": {
            "institution": {"dataType":"string"},
            "degree": {"dataType":"string"},
            "fieldOfStudy": {"dataType":"string"},
            "startYear": {"dataType":"double"},
            "endYear": {"dataType":"double"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GeminiApplicantCertification": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "issuer": {"dataType":"string"},
            "issueDate": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GeminiApplicantProject": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "description": {"dataType":"string"},
            "technologies": {"dataType":"array","array":{"dataType":"string"}},
            "role": {"dataType":"string"},
            "link": {"dataType":"string"},
            "startDate": {"dataType":"string"},
            "endDate": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GeminiApplicantAvailability": {
        "dataType": "refObject",
        "properties": {
            "status": {"dataType":"string"},
            "type": {"dataType":"string"},
            "startDate": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GeminiApplicantSocialLinks": {
        "dataType": "refObject",
        "properties": {
            "linkedin": {"dataType":"string"},
            "github": {"dataType":"string"},
            "portfolio": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GeminiBatchApplicant": {
        "dataType": "refObject",
        "properties": {
            "firstName": {"dataType":"string"},
            "lastName": {"dataType":"string"},
            "email": {"dataType":"string","required":true},
            "headline": {"dataType":"string"},
            "bio": {"dataType":"string"},
            "location": {"dataType":"string"},
            "skills": {"dataType":"array","array":{"dataType":"refObject","ref":"GeminiApplicantSkill"}},
            "languages": {"dataType":"array","array":{"dataType":"refObject","ref":"GeminiApplicantLanguage"}},
            "experience": {"dataType":"array","array":{"dataType":"refObject","ref":"GeminiApplicantExperience"}},
            "education": {"dataType":"array","array":{"dataType":"refObject","ref":"GeminiApplicantEducation"}},
            "certifications": {"dataType":"array","array":{"dataType":"refObject","ref":"GeminiApplicantCertification"}},
            "projects": {"dataType":"array","array":{"dataType":"refObject","ref":"GeminiApplicantProject"}},
            "availability": {"ref":"GeminiApplicantAvailability"},
            "socialLinks": {"ref":"GeminiApplicantSocialLinks"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GeminiBatchScreeningRequest": {
        "dataType": "refObject",
        "properties": {
            "job": {"ref":"GeminiBatchJob","required":true},
            "applicants": {"dataType":"array","array":{"dataType":"refObject","ref":"GeminiBatchApplicant"},"required":true},
            "shortlistCount": {"dataType":"double","required":true},
            "instructions": {"dataType":"string"},
            "temperature": {"dataType":"double"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GeminiRecruiterAssistantContextSummary": {
        "dataType": "refObject",
        "properties": {
            "source": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["inline"]},{"dataType":"enum","enums":["database"]},{"dataType":"enum","enums":["mixed"]},{"dataType":"enum","enums":["none"]}],"required":true},
            "jobId": {"dataType":"string"},
            "shortlistId": {"dataType":"string"},
            "jobTitle": {"dataType":"string"},
            "applicantCount": {"dataType":"double","required":true},
            "screeningResultCount": {"dataType":"double","required":true},
            "shortlistCount": {"dataType":"double","required":true},
            "truncatedApplicants": {"dataType":"boolean","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GeminiRecruiterAssistantResponse": {
        "dataType": "refObject",
        "properties": {
            "reply": {"dataType":"string","required":true},
            "model": {"dataType":"string","required":true},
            "usage": {"ref":"GeminiUsageMetadata"},
            "contextUsed": {"ref":"GeminiRecruiterAssistantContextSummary","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GeminiRecruiterAssistantRole": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["user"]},{"dataType":"enum","enums":["assistant"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GeminiRecruiterAssistantMessage": {
        "dataType": "refObject",
        "properties": {
            "role": {"ref":"GeminiRecruiterAssistantRole","required":true},
            "content": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GeminiRecruiterAssistantShortlistContext": {
        "dataType": "refObject",
        "properties": {
            "runName": {"dataType":"string"},
            "jobTitle": {"dataType":"string"},
            "department": {"dataType":"string"},
            "model": {"dataType":"string"},
            "totalApplicants": {"dataType":"double"},
            "shortlistCount": {"dataType":"double"},
            "instructions": {"dataType":"string"},
            "screeningResults": {"dataType":"array","array":{"dataType":"refObject","ref":"GeminiBatchScreeningResultEntry"}},
            "shortlist": {"dataType":"array","array":{"dataType":"refObject","ref":"GeminiBatchShortlistEntry"}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GeminiRecruiterAssistantContext": {
        "dataType": "refObject",
        "properties": {
            "job": {"ref":"GeminiBatchJob"},
            "applicants": {"dataType":"array","array":{"dataType":"refObject","ref":"GeminiBatchApplicant"}},
            "shortlist": {"ref":"GeminiRecruiterAssistantShortlistContext"},
            "contextNote": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GeminiRecruiterAssistantRequest": {
        "dataType": "refObject",
        "properties": {
            "message": {"dataType":"string","required":true},
            "history": {"dataType":"array","array":{"dataType":"refObject","ref":"GeminiRecruiterAssistantMessage"}},
            "jobId": {"dataType":"string"},
            "shortlistId": {"dataType":"string"},
            "applicantEmails": {"dataType":"array","array":{"dataType":"string"}},
            "includeApplicants": {"dataType":"boolean"},
            "applicantLimit": {"dataType":"double"},
            "context": {"ref":"GeminiRecruiterAssistantContext"},
            "temperature": {"dataType":"double"},
            "maxOutputTokens": {"dataType":"double"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DashboardRecentRunDTO": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "title": {"dataType":"string","required":true},
            "createdAt": {"dataType":"string","required":true},
            "applicants": {"dataType":"double","required":true},
            "topMatch": {"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DashboardSpotlightItemDTO": {
        "dataType": "refObject",
        "properties": {
            "jobId": {"dataType":"string","required":true},
            "title": {"dataType":"string","required":true},
            "recentApplicants": {"dataType":"double","required":true},
            "applicantsCount": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DashboardBestRunDTO": {
        "dataType": "refObject",
        "properties": {
            "jobTitle": {"dataType":"string","required":true},
            "topCandidateName": {"dataType":"string","required":true},
            "topMatchScore": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DashboardSummaryDTO": {
        "dataType": "refObject",
        "properties": {
            "userFirstName": {"dataType":"string"},
            "activeJobs": {"dataType":"double","required":true},
            "draftJobs": {"dataType":"double","required":true},
            "totalApplicants": {"dataType":"double","required":true},
            "applicantsIn30Days": {"dataType":"double","required":true},
            "totalShortlists": {"dataType":"double","required":true},
            "shortlistsIn30Days": {"dataType":"double","required":true},
            "averageScreeningRuntimeHours": {"dataType":"double","required":true},
            "timedRunsCount": {"dataType":"double","required":true},
            "weeklyScreeningRuns": {"dataType":"double","required":true},
            "recentRuns": {"dataType":"array","array":{"dataType":"refObject","ref":"DashboardRecentRunDTO"},"required":true},
            "spotlight": {"dataType":"array","array":{"dataType":"refObject","ref":"DashboardSpotlightItemDTO"},"required":true},
            "bestRun": {"dataType":"union","subSchemas":[{"ref":"DashboardBestRunDTO"},{"dataType":"enum","enums":[null]}],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DashboardSummaryResponse": {
        "dataType": "refObject",
        "properties": {
            "data": {"ref":"DashboardSummaryDTO","required":true},
            "message": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UserRole": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["recruiter"]},{"dataType":"enum","enums":["admin"]},{"dataType":"enum","enums":["applicant"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "NotificationPreferences": {
        "dataType": "refObject",
        "properties": {
            "screening": {"dataType":"boolean","required":true},
            "applicants": {"dataType":"boolean","required":true},
            "export": {"dataType":"boolean","required":true},
            "system": {"dataType":"boolean","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ThemePreference": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["light"]},{"dataType":"enum","enums":["dark"]},{"dataType":"enum","enums":["system"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "LanguagePreference": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["en"]},{"dataType":"enum","enums":["fr"]},{"dataType":"enum","enums":["rw"]}],"validators":{}},
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
            "department": {"dataType":"string"},
            "location": {"dataType":"string"},
            "bio": {"dataType":"string"},
            "notificationPreferences": {"ref":"NotificationPreferences"},
            "themePreference": {"ref":"ThemePreference"},
            "languagePreference": {"ref":"LanguagePreference"},
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
    "UserListResponse": {
        "dataType": "refObject",
        "properties": {
            "users": {"dataType":"array","array":{"dataType":"refObject","ref":"IUserResponse"},"required":true},
            "total": {"dataType":"double","required":true},
            "message": {"dataType":"string","required":true},
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
    "AdminUpdateUserRequest": {
        "dataType": "refObject",
        "properties": {
            "email": {"dataType":"string"},
            "firstName": {"dataType":"string"},
            "lastName": {"dataType":"string"},
            "role": {"ref":"UserRole"},
            "phoneNumber": {"dataType":"string"},
            "department": {"dataType":"string"},
            "location": {"dataType":"string"},
            "bio": {"dataType":"string"},
            "profilePicture": {"dataType":"string"},
            "isEmailVerified": {"dataType":"boolean"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResetUserPasswordRequest": {
        "dataType": "refObject",
        "properties": {
            "newPassword": {"dataType":"string","required":true},
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
    "UpdateProfileRequest": {
        "dataType": "refObject",
        "properties": {
            "email": {"dataType":"string"},
            "firstName": {"dataType":"string"},
            "lastName": {"dataType":"string"},
            "phoneNumber": {"dataType":"string"},
            "department": {"dataType":"string"},
            "location": {"dataType":"string"},
            "bio": {"dataType":"string"},
            "profilePicture": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdatePreferencesRequest": {
        "dataType": "refObject",
        "properties": {
            "notificationPreferences": {"ref":"NotificationPreferences"},
            "themePreference": {"ref":"ThemePreference"},
            "languagePreference": {"ref":"LanguagePreference"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ChangePasswordRequest": {
        "dataType": "refObject",
        "properties": {
            "currentPassword": {"dataType":"string","required":true},
            "newPassword": {"dataType":"string","required":true},
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
    "ApplicantSource": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["umurava-platform"]},{"dataType":"enum","enums":["pdf-upload"]},{"dataType":"enum","enums":["csv-import"]},{"dataType":"enum","enums":["paste-links"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "IngestStatus": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["parsed"]},{"dataType":"enum","enums":["pending"]},{"dataType":"enum","enums":["failed"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SkillDTO": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "level": {"dataType":"string"},
            "yearsOfExperience": {"dataType":"double"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "LanguageDTO": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "proficiency": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ExperienceDTO": {
        "dataType": "refObject",
        "properties": {
            "company": {"dataType":"string","required":true},
            "role": {"dataType":"string","required":true},
            "startDate": {"dataType":"string"},
            "endDate": {"dataType":"string"},
            "description": {"dataType":"string"},
            "technologies": {"dataType":"array","array":{"dataType":"string"}},
            "isCurrent": {"dataType":"boolean"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "EducationDTO": {
        "dataType": "refObject",
        "properties": {
            "institution": {"dataType":"string","required":true},
            "degree": {"dataType":"string"},
            "fieldOfStudy": {"dataType":"string"},
            "startYear": {"dataType":"double"},
            "endYear": {"dataType":"double"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CertificationDTO": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "issuer": {"dataType":"string"},
            "issueDate": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ProjectDTO": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "description": {"dataType":"string"},
            "technologies": {"dataType":"array","array":{"dataType":"string"}},
            "role": {"dataType":"string"},
            "link": {"dataType":"string"},
            "startDate": {"dataType":"string"},
            "endDate": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AvailabilityDTO": {
        "dataType": "refObject",
        "properties": {
            "status": {"dataType":"string"},
            "type": {"dataType":"string"},
            "startDate": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SocialLinksDTO": {
        "dataType": "refObject",
        "properties": {
            "linkedin": {"dataType":"string"},
            "github": {"dataType":"string"},
            "portfolio": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "IApplicantResponse": {
        "dataType": "refObject",
        "properties": {
            "firstName": {"dataType":"string","required":true},
            "lastName": {"dataType":"string","required":true},
            "email": {"dataType":"string","required":true},
            "headline": {"dataType":"string"},
            "bio": {"dataType":"string"},
            "location": {"dataType":"string"},
            "skills": {"dataType":"array","array":{"dataType":"refObject","ref":"SkillDTO"}},
            "languages": {"dataType":"array","array":{"dataType":"refObject","ref":"LanguageDTO"}},
            "experience": {"dataType":"array","array":{"dataType":"refObject","ref":"ExperienceDTO"}},
            "education": {"dataType":"array","array":{"dataType":"refObject","ref":"EducationDTO"}},
            "certifications": {"dataType":"array","array":{"dataType":"refObject","ref":"CertificationDTO"}},
            "projects": {"dataType":"array","array":{"dataType":"refObject","ref":"ProjectDTO"}},
            "availability": {"ref":"AvailabilityDTO"},
            "socialLinks": {"ref":"SocialLinksDTO"},
            "_id": {"dataType":"string","required":true},
            "job": {"dataType":"string","required":true},
            "source": {"ref":"ApplicantSource","required":true},
            "ingestStatus": {"ref":"IngestStatus","required":true},
            "ingestError": {"dataType":"string"},
            "sourceFileName": {"dataType":"string"},
            "sourceUrl": {"dataType":"string"},
            "createdBy": {"dataType":"string","required":true},
            "createdAt": {"dataType":"string","required":true},
            "updatedAt": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApplicantListResponse": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"refObject","ref":"IApplicantResponse"},"required":true},
            "total": {"dataType":"double","required":true},
            "page": {"dataType":"double","required":true},
            "pageSize": {"dataType":"double","required":true},
            "totalPages": {"dataType":"double","required":true},
            "message": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApplicantResponse": {
        "dataType": "refObject",
        "properties": {
            "data": {"ref":"IApplicantResponse","required":true},
            "message": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "IngestSummary": {
        "dataType": "refObject",
        "properties": {
            "received": {"dataType":"double","required":true},
            "created": {"dataType":"double","required":true},
            "skipped": {"dataType":"double","required":true},
            "failed": {"dataType":"double","required":true},
            "errors": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true},"email":{"dataType":"string"},"index":{"dataType":"double","required":true}}},"required":true},
            "applicants": {"dataType":"array","array":{"dataType":"refObject","ref":"IApplicantResponse"},"required":true},
            "message": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApplicantProfileInput": {
        "dataType": "refObject",
        "properties": {
            "firstName": {"dataType":"string","required":true},
            "lastName": {"dataType":"string","required":true},
            "email": {"dataType":"string","required":true},
            "headline": {"dataType":"string"},
            "bio": {"dataType":"string"},
            "location": {"dataType":"string"},
            "skills": {"dataType":"array","array":{"dataType":"refObject","ref":"SkillDTO"}},
            "languages": {"dataType":"array","array":{"dataType":"refObject","ref":"LanguageDTO"}},
            "experience": {"dataType":"array","array":{"dataType":"refObject","ref":"ExperienceDTO"}},
            "education": {"dataType":"array","array":{"dataType":"refObject","ref":"EducationDTO"}},
            "certifications": {"dataType":"array","array":{"dataType":"refObject","ref":"CertificationDTO"}},
            "projects": {"dataType":"array","array":{"dataType":"refObject","ref":"ProjectDTO"}},
            "availability": {"ref":"AvailabilityDTO"},
            "socialLinks": {"ref":"SocialLinksDTO"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "IngestPlatformRequest": {
        "dataType": "refObject",
        "properties": {
            "applicants": {"dataType":"array","array":{"dataType":"refObject","ref":"ApplicantProfileInput"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "IngestCsvRequest": {
        "dataType": "refObject",
        "properties": {
            "applicants": {"dataType":"array","array":{"dataType":"refObject","ref":"ApplicantProfileInput"}},
            "csvText": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "IngestFileItem": {
        "dataType": "refObject",
        "properties": {
            "filename": {"dataType":"string","required":true},
            "mimeType": {"dataType":"string"},
            "dataBase64": {"dataType":"string"},
            "email": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "IngestFilesRequest": {
        "dataType": "refObject",
        "properties": {
            "files": {"dataType":"array","array":{"dataType":"refObject","ref":"IngestFileItem"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "IngestLinksRequest": {
        "dataType": "refObject",
        "properties": {
            "links": {"dataType":"array","array":{"dataType":"string"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateApplicantRequest": {
        "dataType": "refObject",
        "properties": {
            "firstName": {"dataType":"string"},
            "lastName": {"dataType":"string"},
            "email": {"dataType":"string"},
            "headline": {"dataType":"string"},
            "bio": {"dataType":"string"},
            "location": {"dataType":"string"},
            "skills": {"dataType":"array","array":{"dataType":"refObject","ref":"SkillDTO"}},
            "languages": {"dataType":"array","array":{"dataType":"refObject","ref":"LanguageDTO"}},
            "experience": {"dataType":"array","array":{"dataType":"refObject","ref":"ExperienceDTO"}},
            "education": {"dataType":"array","array":{"dataType":"refObject","ref":"EducationDTO"}},
            "certifications": {"dataType":"array","array":{"dataType":"refObject","ref":"CertificationDTO"}},
            "projects": {"dataType":"array","array":{"dataType":"refObject","ref":"ProjectDTO"}},
            "availability": {"ref":"AvailabilityDTO"},
            "socialLinks": {"ref":"SocialLinksDTO"},
            "ingestStatus": {"ref":"IngestStatus"},
            "ingestError": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DeleteApplicantResponse": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "message": {"dataType":"string","required":true},
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


    
        const argsSidebarController_getUsage: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/sidebar/usage',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(SidebarController)),
            ...(fetchMiddlewares<RequestHandler>(SidebarController.prototype.getUsage)),

            async function SidebarController_getUsage(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsSidebarController_getUsage, request, response });

                const controller = new SidebarController();

              await templateService.apiHandler({
                methodName: 'getUsage',
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
        const argsShortlistController_listShortlists: Record<string, TsoaRoute.ParameterSchema> = {
                jobId: {"in":"query","name":"jobId","dataType":"string"},
                page: {"default":1,"in":"query","name":"page","dataType":"double"},
                pageSize: {"default":20,"in":"query","name":"pageSize","dataType":"double"},
        };
        app.get('/shortlists',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ShortlistController)),
            ...(fetchMiddlewares<RequestHandler>(ShortlistController.prototype.listShortlists)),

            async function ShortlistController_listShortlists(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsShortlistController_listShortlists, request, response });

                const controller = new ShortlistController();

              await templateService.apiHandler({
                methodName: 'listShortlists',
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
        const argsShortlistController_listShortlistSelect: Record<string, TsoaRoute.ParameterSchema> = {
                jobId: {"in":"query","name":"jobId","dataType":"string"},
                limit: {"default":100,"in":"query","name":"limit","dataType":"double"},
        };
        app.get('/shortlists/select',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ShortlistController)),
            ...(fetchMiddlewares<RequestHandler>(ShortlistController.prototype.listShortlistSelect)),

            async function ShortlistController_listShortlistSelect(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsShortlistController_listShortlistSelect, request, response });

                const controller = new ShortlistController();

              await templateService.apiHandler({
                methodName: 'listShortlistSelect',
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
        const argsShortlistController_getShortlist: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.get('/shortlists/:id',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ShortlistController)),
            ...(fetchMiddlewares<RequestHandler>(ShortlistController.prototype.getShortlist)),

            async function ShortlistController_getShortlist(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsShortlistController_getShortlist, request, response });

                const controller = new ShortlistController();

              await templateService.apiHandler({
                methodName: 'getShortlist',
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
        const argsShortlistController_createShortlist: Record<string, TsoaRoute.ParameterSchema> = {
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
                body: {"in":"body","name":"body","required":true,"ref":"CreateShortlistRequest"},
        };
        app.post('/shortlists',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ShortlistController)),
            ...(fetchMiddlewares<RequestHandler>(ShortlistController.prototype.createShortlist)),

            async function ShortlistController_createShortlist(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsShortlistController_createShortlist, request, response });

                const controller = new ShortlistController();

              await templateService.apiHandler({
                methodName: 'createShortlist',
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
        const argsShortlistController_deleteShortlist: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.delete('/shortlists/:id',
            authenticateMiddleware([{"jwt":["recruiter","admin"]}]),
            ...(fetchMiddlewares<RequestHandler>(ShortlistController)),
            ...(fetchMiddlewares<RequestHandler>(ShortlistController.prototype.deleteShortlist)),

            async function ShortlistController_deleteShortlist(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsShortlistController_deleteShortlist, request, response });

                const controller = new ShortlistController();

              await templateService.apiHandler({
                methodName: 'deleteShortlist',
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
        const argsNotificationController_listNotifications: Record<string, TsoaRoute.ParameterSchema> = {
                limit: {"default":100,"in":"query","name":"limit","dataType":"double"},
        };
        app.get('/notifications',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(NotificationController)),
            ...(fetchMiddlewares<RequestHandler>(NotificationController.prototype.listNotifications)),

            async function NotificationController_listNotifications(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsNotificationController_listNotifications, request, response });

                const controller = new NotificationController();

              await templateService.apiHandler({
                methodName: 'listNotifications',
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
        const argsNotificationController_getNotification: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.get('/notifications/:id',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(NotificationController)),
            ...(fetchMiddlewares<RequestHandler>(NotificationController.prototype.getNotification)),

            async function NotificationController_getNotification(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsNotificationController_getNotification, request, response });

                const controller = new NotificationController();

              await templateService.apiHandler({
                methodName: 'getNotification',
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
        const argsJobController_listJobSelect: Record<string, TsoaRoute.ParameterSchema> = {
                search: {"in":"query","name":"search","dataType":"string"},
                status: {"in":"query","name":"status","dataType":"union","subSchemas":[{"ref":"JobStatus"},{"dataType":"enum","enums":["All"]}]},
                limit: {"default":100,"in":"query","name":"limit","dataType":"double"},
        };
        app.get('/jobs/select',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(JobController)),
            ...(fetchMiddlewares<RequestHandler>(JobController.prototype.listJobSelect)),

            async function JobController_listJobSelect(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsJobController_listJobSelect, request, response });

                const controller = new JobController();

              await templateService.apiHandler({
                methodName: 'listJobSelect',
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
        const argsHistoryController_getSummary: Record<string, TsoaRoute.ParameterSchema> = {
                page: {"default":1,"in":"query","name":"page","dataType":"double"},
                pageSize: {"default":20,"in":"query","name":"pageSize","dataType":"double"},
        };
        app.get('/history/summary',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(HistoryController)),
            ...(fetchMiddlewares<RequestHandler>(HistoryController.prototype.getSummary)),

            async function HistoryController_getSummary(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsHistoryController_getSummary, request, response });

                const controller = new HistoryController();

              await templateService.apiHandler({
                methodName: 'getSummary',
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
            authenticateMiddleware([{"jwt":["recruiter","admin"]}]),
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
            authenticateMiddleware([{"jwt":["recruiter","admin"]}]),
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
            authenticateMiddleware([{"jwt":["recruiter","admin"]}]),
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
            authenticateMiddleware([{"jwt":["recruiter","admin"]}]),
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
        const argsGeminiController_screenBatch: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"GeminiBatchScreeningRequest"},
        };
        app.post('/gemini/screen-batch',
            authenticateMiddleware([{"jwt":["recruiter","admin"]}]),
            ...(fetchMiddlewares<RequestHandler>(GeminiController)),
            ...(fetchMiddlewares<RequestHandler>(GeminiController.prototype.screenBatch)),

            async function GeminiController_screenBatch(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsGeminiController_screenBatch, request, response });

                const controller = new GeminiController();

              await templateService.apiHandler({
                methodName: 'screenBatch',
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
        const argsGeminiController_assistant: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"GeminiRecruiterAssistantRequest"},
        };
        app.post('/gemini/assistant',
            authenticateMiddleware([{"jwt":["recruiter","admin"]}]),
            ...(fetchMiddlewares<RequestHandler>(GeminiController)),
            ...(fetchMiddlewares<RequestHandler>(GeminiController.prototype.assistant)),

            async function GeminiController_assistant(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsGeminiController_assistant, request, response });

                const controller = new GeminiController();

              await templateService.apiHandler({
                methodName: 'assistant',
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
        const argsDashboardController_getSummary: Record<string, TsoaRoute.ParameterSchema> = {
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.get('/dashboard/summary',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(DashboardController)),
            ...(fetchMiddlewares<RequestHandler>(DashboardController.prototype.getSummary)),

            async function DashboardController_getSummary(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsDashboardController_getSummary, request, response });

                const controller = new DashboardController();

              await templateService.apiHandler({
                methodName: 'getSummary',
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
            authenticateMiddleware([{"jwt":["admin"]}]),
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
        const argsAuthController_listUsers: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/auth/users',
            authenticateMiddleware([{"jwt":["admin"]}]),
            ...(fetchMiddlewares<RequestHandler>(AuthController)),
            ...(fetchMiddlewares<RequestHandler>(AuthController.prototype.listUsers)),

            async function AuthController_listUsers(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_listUsers, request, response });

                const controller = new AuthController();

              await templateService.apiHandler({
                methodName: 'listUsers',
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
        const argsAuthController_updateUser: Record<string, TsoaRoute.ParameterSchema> = {
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"AdminUpdateUserRequest"},
        };
        app.patch('/auth/users/:id',
            authenticateMiddleware([{"jwt":["admin"]}]),
            ...(fetchMiddlewares<RequestHandler>(AuthController)),
            ...(fetchMiddlewares<RequestHandler>(AuthController.prototype.updateUser)),

            async function AuthController_updateUser(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_updateUser, request, response });

                const controller = new AuthController();

              await templateService.apiHandler({
                methodName: 'updateUser',
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
        const argsAuthController_resetUserPassword: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"ResetUserPasswordRequest"},
        };
        app.post('/auth/users/:id/reset-password',
            authenticateMiddleware([{"jwt":["admin"]}]),
            ...(fetchMiddlewares<RequestHandler>(AuthController)),
            ...(fetchMiddlewares<RequestHandler>(AuthController.prototype.resetUserPassword)),

            async function AuthController_resetUserPassword(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_resetUserPassword, request, response });

                const controller = new AuthController();

              await templateService.apiHandler({
                methodName: 'resetUserPassword',
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
        const argsAuthController_updateProfile: Record<string, TsoaRoute.ParameterSchema> = {
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"UpdateProfileRequest"},
        };
        app.patch('/auth/me',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AuthController)),
            ...(fetchMiddlewares<RequestHandler>(AuthController.prototype.updateProfile)),

            async function AuthController_updateProfile(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_updateProfile, request, response });

                const controller = new AuthController();

              await templateService.apiHandler({
                methodName: 'updateProfile',
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
        const argsAuthController_updatePreferences: Record<string, TsoaRoute.ParameterSchema> = {
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"UpdatePreferencesRequest"},
        };
        app.patch('/auth/me/preferences',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AuthController)),
            ...(fetchMiddlewares<RequestHandler>(AuthController.prototype.updatePreferences)),

            async function AuthController_updatePreferences(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_updatePreferences, request, response });

                const controller = new AuthController();

              await templateService.apiHandler({
                methodName: 'updatePreferences',
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
        const argsAuthController_changePassword: Record<string, TsoaRoute.ParameterSchema> = {
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"ChangePasswordRequest"},
        };
        app.post('/auth/me/password',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AuthController)),
            ...(fetchMiddlewares<RequestHandler>(AuthController.prototype.changePassword)),

            async function AuthController_changePassword(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_changePassword, request, response });

                const controller = new AuthController();

              await templateService.apiHandler({
                methodName: 'changePassword',
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
        const argsApplicantController_listApplicants: Record<string, TsoaRoute.ParameterSchema> = {
                jobId: {"in":"path","name":"jobId","required":true,"dataType":"string"},
                search: {"in":"query","name":"search","dataType":"string"},
                source: {"in":"query","name":"source","ref":"ApplicantSource"},
                page: {"default":1,"in":"query","name":"page","dataType":"double"},
                pageSize: {"default":20,"in":"query","name":"pageSize","dataType":"double"},
        };
        app.get('/jobs/:jobId/applicants',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ApplicantController)),
            ...(fetchMiddlewares<RequestHandler>(ApplicantController.prototype.listApplicants)),

            async function ApplicantController_listApplicants(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsApplicantController_listApplicants, request, response });

                const controller = new ApplicantController();

              await templateService.apiHandler({
                methodName: 'listApplicants',
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
        const argsApplicantController_getApplicant: Record<string, TsoaRoute.ParameterSchema> = {
                jobId: {"in":"path","name":"jobId","required":true,"dataType":"string"},
                applicantId: {"in":"path","name":"applicantId","required":true,"dataType":"string"},
        };
        app.get('/jobs/:jobId/applicants/:applicantId',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ApplicantController)),
            ...(fetchMiddlewares<RequestHandler>(ApplicantController.prototype.getApplicant)),

            async function ApplicantController_getApplicant(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsApplicantController_getApplicant, request, response });

                const controller = new ApplicantController();

              await templateService.apiHandler({
                methodName: 'getApplicant',
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
        const argsApplicantController_ingestFromPlatform: Record<string, TsoaRoute.ParameterSchema> = {
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
                jobId: {"in":"path","name":"jobId","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"IngestPlatformRequest"},
        };
        app.post('/jobs/:jobId/applicants/platform',
            authenticateMiddleware([{"jwt":["recruiter","admin"]}]),
            ...(fetchMiddlewares<RequestHandler>(ApplicantController)),
            ...(fetchMiddlewares<RequestHandler>(ApplicantController.prototype.ingestFromPlatform)),

            async function ApplicantController_ingestFromPlatform(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsApplicantController_ingestFromPlatform, request, response });

                const controller = new ApplicantController();

              await templateService.apiHandler({
                methodName: 'ingestFromPlatform',
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
        const argsApplicantController_ingestFromCsv: Record<string, TsoaRoute.ParameterSchema> = {
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
                jobId: {"in":"path","name":"jobId","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"IngestCsvRequest"},
        };
        app.post('/jobs/:jobId/applicants/csv',
            authenticateMiddleware([{"jwt":["recruiter","admin"]}]),
            ...(fetchMiddlewares<RequestHandler>(ApplicantController)),
            ...(fetchMiddlewares<RequestHandler>(ApplicantController.prototype.ingestFromCsv)),

            async function ApplicantController_ingestFromCsv(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsApplicantController_ingestFromCsv, request, response });

                const controller = new ApplicantController();

              await templateService.apiHandler({
                methodName: 'ingestFromCsv',
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
        const argsApplicantController_ingestFromFiles: Record<string, TsoaRoute.ParameterSchema> = {
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
                jobId: {"in":"path","name":"jobId","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"IngestFilesRequest"},
        };
        app.post('/jobs/:jobId/applicants/files',
            authenticateMiddleware([{"jwt":["recruiter","admin"]}]),
            ...(fetchMiddlewares<RequestHandler>(ApplicantController)),
            ...(fetchMiddlewares<RequestHandler>(ApplicantController.prototype.ingestFromFiles)),

            async function ApplicantController_ingestFromFiles(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsApplicantController_ingestFromFiles, request, response });

                const controller = new ApplicantController();

              await templateService.apiHandler({
                methodName: 'ingestFromFiles',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 202,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsApplicantController_ingestFromLinks: Record<string, TsoaRoute.ParameterSchema> = {
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
                jobId: {"in":"path","name":"jobId","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"IngestLinksRequest"},
        };
        app.post('/jobs/:jobId/applicants/links',
            authenticateMiddleware([{"jwt":["recruiter","admin"]}]),
            ...(fetchMiddlewares<RequestHandler>(ApplicantController)),
            ...(fetchMiddlewares<RequestHandler>(ApplicantController.prototype.ingestFromLinks)),

            async function ApplicantController_ingestFromLinks(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsApplicantController_ingestFromLinks, request, response });

                const controller = new ApplicantController();

              await templateService.apiHandler({
                methodName: 'ingestFromLinks',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 202,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsApplicantController_updateApplicant: Record<string, TsoaRoute.ParameterSchema> = {
                jobId: {"in":"path","name":"jobId","required":true,"dataType":"string"},
                applicantId: {"in":"path","name":"applicantId","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"UpdateApplicantRequest"},
        };
        app.patch('/jobs/:jobId/applicants/:applicantId',
            authenticateMiddleware([{"jwt":["recruiter","admin"]}]),
            ...(fetchMiddlewares<RequestHandler>(ApplicantController)),
            ...(fetchMiddlewares<RequestHandler>(ApplicantController.prototype.updateApplicant)),

            async function ApplicantController_updateApplicant(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsApplicantController_updateApplicant, request, response });

                const controller = new ApplicantController();

              await templateService.apiHandler({
                methodName: 'updateApplicant',
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
        const argsApplicantController_deleteApplicant: Record<string, TsoaRoute.ParameterSchema> = {
                jobId: {"in":"path","name":"jobId","required":true,"dataType":"string"},
                applicantId: {"in":"path","name":"applicantId","required":true,"dataType":"string"},
        };
        app.delete('/jobs/:jobId/applicants/:applicantId',
            authenticateMiddleware([{"jwt":["recruiter","admin"]}]),
            ...(fetchMiddlewares<RequestHandler>(ApplicantController)),
            ...(fetchMiddlewares<RequestHandler>(ApplicantController.prototype.deleteApplicant)),

            async function ApplicantController_deleteApplicant(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsApplicantController_deleteApplicant, request, response });

                const controller = new ApplicantController();

              await templateService.apiHandler({
                methodName: 'deleteApplicant',
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
