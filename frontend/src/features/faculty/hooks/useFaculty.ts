import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  facultyApi,
} from '../api/facultyApi'

import type {
  FacultyListParams,
  FacultyProfileCreateData,
  FacultyProfileUpdateData,
  FacultyUpdateData,
  FacultyCourseAssignmentCreateData,
  FacultyCourseAssignmentUpdateData,
} from '../api/facultyApi'

import type {
  FacultyCreateData,
} from '../types/faculty'

/* =========================================================
   Query Keys
========================================================= */

const facultyKeys = {
  all: ["faculty"] as const,

  faculty: (
    params?: FacultyListParams,
  ) =>
    [
      "faculty",
      "faculty",
      params,
    ] as const,

  facultyDetail: (
    id: number,
  ) =>
    [
      "faculty",
      "faculty",
      id,
    ] as const,

  profiles: (
    params?: { faculty?: number },
  ) =>
    [
      "faculty",
      "profiles",
      params,
    ] as const,

  profileDetail: (
    id: number,
  ) =>
    [
      "faculty",
      "profiles",
      id,
    ] as const,

  courseAssignments: (
    params?: { faculty?: number },
  ) =>
    [
      "faculty",
      "course-assignments",
      params,
    ] as const,

  courseAssignmentDetail: (
    id: number,
  ) =>
    [
      "faculty",
      "course-assignments",
      id,
    ] as const,
};

/* =========================================================
   Faculty
========================================================= */

export function useFaculty(
  params?: FacultyListParams,
) {
  return useQuery({
    queryKey: facultyKeys.faculty(
      params,
    ),

    queryFn: () =>
      facultyApi.faculty.list(
        params,
      ),
  });
}

export function useFacultyById(
  id?: number,
) {
  return useQuery({
    queryKey:
      facultyKeys.facultyDetail(
        id ?? 0,
      ),

    queryFn: () =>
      facultyApi.faculty.get(
        id as number,
      ),

    enabled: Boolean(id),
  });
}

export function useCreateFaculty() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: (
      data: FacultyCreateData,
    ) =>
      facultyApi.faculty.create(
        data,
      ),

    onSuccess: () => {
      void queryClient.invalidateQueries(
        {
          queryKey:
            facultyKeys.all,
        },
      );
    },
  });
}

export function useUpdateFaculty() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: FacultyUpdateData;
    }) =>
      facultyApi.faculty.update(
        id,
        data,
      ),

    onSuccess: () => {
      void queryClient.invalidateQueries(
        {
          queryKey:
            facultyKeys.all,
        },
      );
    },
  });
}

export function useDeleteFaculty() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: (
      id: number,
    ) =>
      facultyApi.faculty.delete(
        id,
      ),

    onSuccess: () => {
      void queryClient.invalidateQueries(
        {
          queryKey:
            facultyKeys.all,
        },
      );
    },
  });
}

/* =========================================================
   Faculty Profiles
========================================================= */

export function useFacultyProfiles(
  params?: { faculty?: number },
) {
  return useQuery({
    queryKey:
      facultyKeys.profiles(
        params,
      ),

    queryFn: () =>
      facultyApi.profiles.list(
        params,
      ),
  });
}

export function useFacultyProfileById(
  id?: number,
) {
  return useQuery({
    queryKey:
      facultyKeys.profileDetail(
        id ?? 0,
      ),

    queryFn: () =>
      facultyApi.profiles.get(
        id as number,
      ),

    enabled: Boolean(id),
  });
}

export function useCreateFacultyProfile() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: (
      data: FacultyProfileCreateData,
    ) =>
      facultyApi.profiles.create(
        data,
      ),

    onSuccess: () => {
      void queryClient.invalidateQueries(
        {
          queryKey:
            facultyKeys.all,
        },
      );
    },
  });
}

export function useUpdateFacultyProfile() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: FacultyProfileUpdateData;
    }) =>
      facultyApi.profiles.update(
        id,
        data,
      ),

    onSuccess: () => {
      void queryClient.invalidateQueries(
        {
          queryKey:
            facultyKeys.all,
        },
      );
    },
  });
}

/* =========================================================
   Faculty Course Assignments
========================================================= */

export function useFacultyCourseAssignments(
  params?: { faculty?: number },
) {
  return useQuery({
    queryKey:
      facultyKeys.courseAssignments(
        params,
      ),

    queryFn: () =>
      facultyApi.courseAssignments.list(
        params,
      ),
  });
}

export function useFacultyCourseAssignmentById(
  id?: number,
) {
  return useQuery({
    queryKey:
      facultyKeys.courseAssignmentDetail(
        id ?? 0,
      ),

    queryFn: () =>
      facultyApi.courseAssignments.get(
        id as number,
      ),

    enabled: Boolean(id),
  });
}

export function useCreateFacultyCourseAssignment() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: (
      data: FacultyCourseAssignmentCreateData,
    ) =>
      facultyApi.courseAssignments.create(
        data,
      ),

    onSuccess: () => {
      void queryClient.invalidateQueries(
        {
          queryKey:
            facultyKeys.all,
        },
      );
    },
  });
}

export function useUpdateFacultyCourseAssignment() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: FacultyCourseAssignmentUpdateData;
    }) =>
      facultyApi.courseAssignments.update(
        id,
        data,
      ),

    onSuccess: () => {
      void queryClient.invalidateQueries(
        {
          queryKey:
            facultyKeys.all,
        },
      );
    },
  });
}

export function useDeleteFacultyCourseAssignment() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: (
      id: number,
    ) =>
      facultyApi.courseAssignments.delete(
        id,
      ),

    onSuccess: () => {
      void queryClient.invalidateQueries(
        {
          queryKey:
            facultyKeys.all,
        },
      );
    },
  });
}