import { apiClient } from "../../../lib/axios";

import type {
  Faculty,
  FacultyQualification,
  FacultyExperience,
  FacultyCourseAssignment,
} from "../types/faculty.types";

import type {
  FacultyCreateData,
} from "../types/faculty";
/* =========================================================
   Generic API Types
========================================================= */

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/* =========================================================
   Faculty List Parameters
========================================================= */

export interface FacultyListParams {
  search?: string;
  department?: number | string;
  status?: string;
  employment_type?: string;
  employment_status?: string;
  is_active?: boolean;
  faculty?: number;
  page?: number;
  page_size?: number;
  ordering?: string;
}

/* =========================================================
   Faculty Data Types
========================================================= */


export type FacultyUpdateData = Partial<Faculty>;

export type FacultyProfileCreateData = FormData;

export type FacultyProfileUpdateData = FormData;

export type FacultyCourseAssignmentCreateData =
  Partial<FacultyCourseAssignment>;

export type FacultyCourseAssignmentUpdateData =
  Partial<FacultyCourseAssignment>;

/* =========================================================
   Faculty API
========================================================= */

const faculty = {
  list: async (
    params?: FacultyListParams,
  ): Promise<PaginatedResponse<Faculty>> => {
    const response = await apiClient.get<
      PaginatedResponse<Faculty>
    >(
      "/faculty/faculty/",
      { params },
    );

    return response.data;
  },

  get: async (
    id: number,
  ): Promise<Faculty> => {
    const response =
      await apiClient.get<Faculty>(
        `/faculty/faculty/${id}/`,
      );

    return response.data;
  },

  create: async (
    data: FacultyCreateData,
  ): Promise<Faculty> => {
    const response =
      await apiClient.post<Faculty>(
        "/faculty/faculty/",
        data,
      );

    return response.data;
  },

  update: async (
    id: number,
    data: FacultyUpdateData,
  ): Promise<Faculty> => {
    const response =
      await apiClient.patch<Faculty>(
        `/faculty/faculty/${id}/`,
        data,
      );

    return response.data;
  },

  delete: async (
    id: number,
  ): Promise<void> => {
    await apiClient.delete(
      `/faculty/faculty/${id}/`,
    );
  },
};

/* =========================================================
   Faculty Profiles API
========================================================= */

const profiles = {
  list: async (
    params?: { faculty?: number },
  ): Promise<PaginatedResponse<Faculty>> => {
    const response =
      await apiClient.get<
        PaginatedResponse<Faculty>
      >(
        "/faculty/profiles/",
        { params },
      );

    return response.data;
  },

  get: async (
    id: number,
  ): Promise<Faculty> => {
    const response =
      await apiClient.get<Faculty>(
        `/faculty/profiles/${id}/`,
      );

    return response.data;
  },

  create: async (
    data: FacultyProfileCreateData,
  ): Promise<Faculty> => {
    const response =
      await apiClient.post<Faculty>(
        "/faculty/profiles/",
        data,
      );

    return response.data;
  },

  update: async (
    id: number,
    data: FacultyProfileUpdateData,
  ): Promise<Faculty> => {
    const response =
      await apiClient.patch<Faculty>(
        `/faculty/profiles/${id}/`,
        data,
      );

    return response.data;
  },

  delete: async (
    id: number,
  ): Promise<void> => {
    await apiClient.delete(
      `/faculty/profiles/${id}/`,
    );
  },
};

/* =========================================================
   Qualifications API
========================================================= */

const qualifications = {
  list: async (
    params?: { faculty?: number },
  ): Promise<
    PaginatedResponse<FacultyQualification>
  > => {
    const response =
      await apiClient.get<
        PaginatedResponse<FacultyQualification>
      >(
        "/faculty/qualifications/",
        { params },
      );

    return response.data;
  },

  get: async (
    id: number,
  ): Promise<FacultyQualification> => {
    const response =
      await apiClient.get<FacultyQualification>(
        `/faculty/qualifications/${id}/`,
      );

    return response.data;
  },

  create: async (
    data: Partial<FacultyQualification>,
  ): Promise<FacultyQualification> => {
    const response =
      await apiClient.post<FacultyQualification>(
        "/faculty/qualifications/",
        data,
      );

    return response.data;
  },

  update: async (
    id: number,
    data: Partial<FacultyQualification>,
  ): Promise<FacultyQualification> => {
    const response =
      await apiClient.patch<FacultyQualification>(
        `/faculty/qualifications/${id}/`,
        data,
      );

    return response.data;
  },

  delete: async (
    id: number,
  ): Promise<void> => {
    await apiClient.delete(
      `/faculty/qualifications/${id}/`,
    );
  },
};

/* =========================================================
   Experiences API
========================================================= */

const experiences = {
  list: async (
    params?: { faculty?: number },
  ): Promise<
    PaginatedResponse<FacultyExperience>
  > => {
    const response =
      await apiClient.get<
        PaginatedResponse<FacultyExperience>
      >(
        "/faculty/experiences/",
        { params },
      );

    return response.data;
  },

  get: async (
    id: number,
  ): Promise<FacultyExperience> => {
    const response =
      await apiClient.get<FacultyExperience>(
        `/faculty/experiences/${id}/`,
      );

    return response.data;
  },

  create: async (
    data: Partial<FacultyExperience>,
  ): Promise<FacultyExperience> => {
    const response =
      await apiClient.post<FacultyExperience>(
        "/faculty/experiences/",
        data,
      );

    return response.data;
  },

  update: async (
    id: number,
    data: Partial<FacultyExperience>,
  ): Promise<FacultyExperience> => {
    const response =
      await apiClient.patch<FacultyExperience>(
        `/faculty/experiences/${id}/`,
        data,
      );

    return response.data;
  },

  delete: async (
    id: number,
  ): Promise<void> => {
    await apiClient.delete(
      `/faculty/experiences/${id}/`,
    );
  },
};

/* =========================================================
   Course Assignments API
========================================================= */

const courseAssignments = {
  list: async (
    params?: { faculty?: number },
  ): Promise<
    PaginatedResponse<FacultyCourseAssignment>
  > => {
    const response =
      await apiClient.get<
        PaginatedResponse<FacultyCourseAssignment>
      >(
        "/faculty/course-assignments/",
        { params },
      );

    return response.data;
  },

  get: async (
    id: number,
  ): Promise<FacultyCourseAssignment> => {
    const response =
      await apiClient.get<FacultyCourseAssignment>(
        `/faculty/course-assignments/${id}/`,
      );

    return response.data;
  },

  create: async (
    data: FacultyCourseAssignmentCreateData,
  ): Promise<FacultyCourseAssignment> => {
    const response =
      await apiClient.post<FacultyCourseAssignment>(
        "/faculty/course-assignments/",
        data,
      );

    return response.data;
  },

  update: async (
    id: number,
    data: FacultyCourseAssignmentUpdateData,
  ): Promise<FacultyCourseAssignment> => {
    const response =
      await apiClient.patch<FacultyCourseAssignment>(
        `/faculty/course-assignments/${id}/`,
        data,
      );

    return response.data;
  },

  delete: async (
    id: number,
  ): Promise<void> => {
    await apiClient.delete(
      `/faculty/course-assignments/${id}/`,
    );
  },
};

/* =========================================================
   Export
========================================================= */

export const facultyApi = {
  faculty,
  profiles,
  qualifications,
  experiences,
  courseAssignments,
};