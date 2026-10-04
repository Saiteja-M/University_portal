from django.db.models import Count, Q
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.academics.models import (
    AcademicYear,
    Course,
    Program,
    Semester,
)
from apps.students.models import Student

from .models import AttendanceRecord, AttendanceSession
from .permissions import (
    IsAttendanceManager,
    IsAttendanceViewer,
)
from .reports import (
    download_excel_response,
    get_class_attendance_report,
)
from .serializers import (
    AttendanceRecordSerializer,
    AttendanceSessionSerializer,
    EnrolledStudentSerializer,
)
from .services import (
    get_enrolled_students,
    get_session_summary,
    mark_attendance,
)


class AttendanceSessionViewSet(viewsets.ModelViewSet):
    serializer_class = AttendanceSessionSerializer

    def get_queryset(self):
        queryset = (
            AttendanceSession.objects
            .select_related(
                "faculty",
                "faculty__user",
                "course",
                "academic_year",
                "semester",
                "semester__program",
            )
            .prefetch_related("records")
        )

        user = self.request.user
        if not user.is_authenticated:
            return queryset.none()

        if user.is_superuser:
            return queryset

        profile = getattr(user, "profile", None)
        if not profile:
            return queryset.none()

        role = profile.user_type
        if role == "FACULTY":
            faculty = getattr(user, "faculty", None)
            return queryset.filter(faculty=faculty) if faculty else queryset.none()

        if role == "STUDENT":
            student = getattr(user, "student", None)
            return (
                queryset.filter(records__student=student).distinct()
                if student
                else queryset.none()
            )

        if role in {"ADMIN", "HOD"}:
            return queryset

        return queryset.none()

    def get_permissions(self):
        if self.action in {"list", "retrieve", "summary"}:
            permission_class = IsAttendanceViewer
        else:
            permission_class = IsAttendanceManager
        return [permission_class()]

    @action(detail=True, methods=["post"], url_path="mark")
    def mark(self, request, pk=None):
        session = self.get_object()
        attendance_data = request.data.get("attendance", [])
        records = mark_attendance(
            session=session,
            attendance_data=attendance_data,
        )
        serializer = AttendanceRecordSerializer(
            records,
            many=True,
            context={"request": request},
        )
        return Response(
            {
                "message": "Attendance saved successfully.",
                "session": session.id,
                "records": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["get"], url_path="summary")
    def summary(self, request, pk=None):
        session = self.get_object()
        return Response(
            get_session_summary(session),
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["get"], url_path="class-report")
    def class_report(self, request):
        program_id = request.query_params.get("program")
        academic_year_id = request.query_params.get("academic_year")
        semester_id = request.query_params.get("semester")
        course_id = request.query_params.get("course")
        export = request.query_params.get("export")

        if not all((program_id, academic_year_id, semester_id, course_id)):
            return Response(
                {
                    "detail": (
                        "program, academic_year, semester and course are required."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            report = get_class_attendance_report(
                program_id=int(program_id),
                academic_year_id=int(academic_year_id),
                semester_id=int(semester_id),
                course_id=int(course_id),
            )
        except (
            ValueError,
            Program.DoesNotExist,
            AcademicYear.DoesNotExist,
            Semester.DoesNotExist,
            Course.DoesNotExist,
        ) as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if export == "excel":
            return download_excel_response(report)

        return Response(
            {
                "program": {
                    "id": report["program"].id,
                    "name": report["program"].name,
                    "department_name": report["program"].department.name,
                },
                "academic_year": {
                    "id": report["academic_year"].id,
                    "name": report["academic_year"].name,
                },
                "year_of_study": report["year_of_study"],
                "semester": {
                    "id": report["semester"].id,
                    "number": report["semester"].number,
                },
                "course": {
                    "id": report["course"].id,
                    "code": report["course"].code,
                    "name": report["course"].name,
                },
                "total_sessions": len(report["sessions"]),
                "students": report["students"],
            },
            status=status.HTTP_200_OK,
        )


class AttendanceRecordViewSet(viewsets.ModelViewSet):
    serializer_class = AttendanceRecordSerializer

    def get_queryset(self):
        queryset = (
            AttendanceRecord.objects
            .select_related(
                "session",
                "session__course",
                "session__faculty",
                "session__academic_year",
                "session__semester",
                "student",
                "student__user",
            )
        )

        user = self.request.user
        if not user.is_authenticated:
            return queryset.none()

        if user.is_superuser:
            return queryset

        profile = getattr(user, "profile", None)
        if not profile:
            return queryset.none()

        role = profile.user_type
        if role == "FACULTY":
            faculty = getattr(user, "faculty", None)
            return queryset.filter(session__faculty=faculty) if faculty else queryset.none()

        if role == "STUDENT":
            student = getattr(user, "student", None)
            return queryset.filter(student=student) if student else queryset.none()

        if role in {"ADMIN", "HOD"}:
            return queryset

        return queryset.none()

    def get_permissions(self):
        if self.action in {"list", "retrieve", "my_summary"}:
            permission_class = IsAttendanceViewer
        else:
            permission_class = IsAttendanceManager
        return [permission_class()]

    @action(detail=False, methods=["get"], url_path="my-summary")
    def my_summary(self, request):
        """Return the authenticated student's own attendance summary."""
        student = getattr(request.user, "student", None)
        if not student:
            return Response(
                {"detail": "Your account is not linked to a student profile."},
                status=status.HTTP_403_FORBIDDEN,
            )

        records = (
            self.get_queryset()
            .filter(student=student)
            .select_related(
                "session",
                "session__course",
                "session__academic_year",
                "session__semester",
            )
            .order_by("-session__session_date", "-session__period")
        )

        total = records.count()
        present = records.filter(status=AttendanceRecord.Status.PRESENT).count()
        absent = records.filter(status=AttendanceRecord.Status.ABSENT).count()
        late = records.filter(status=AttendanceRecord.Status.LATE).count()
        attended = present + late
        percentage = round((attended / total) * 100, 2) if total else 0

        course_data = {}
        for record in records:
            course = record.session.course
            item = course_data.setdefault(
                course.id,
                {
                    "course_id": course.id,
                    "course_code": course.code,
                    "course_name": course.name,
                    "total_classes": 0,
                    "present": 0,
                    "absent": 0,
                    "late": 0,
                },
            )
            item["total_classes"] += 1
            if record.status == AttendanceRecord.Status.PRESENT:
                item["present"] += 1
            elif record.status == AttendanceRecord.Status.ABSENT:
                item["absent"] += 1
            elif record.status == AttendanceRecord.Status.LATE:
                item["late"] += 1

        courses = []
        for item in course_data.values():
            course_total = item["total_classes"]
            course_attended = item["present"] + item["late"]
            item["percentage"] = (
                round((course_attended / course_total) * 100, 2)
                if course_total
                else 0
            )
            courses.append(item)

        recent = [
            {
                "id": record.id,
                "date": record.session.session_date,
                "course_code": record.session.course.code,
                "course_name": record.session.course.name,
                "period": record.session.period,
                "status": record.status,
                "remarks": record.remarks,
            }
            for record in records[:10]
        ]

        return Response(
            {
                "student_id": student.student_id,
                "overall": {
                    "total_classes": total,
                    "present": present,
                    "absent": absent,
                    "late": late,
                    "percentage": percentage,
                },
                "courses": courses,
                "recent": recent,
            },
            status=status.HTTP_200_OK,
        )


class EnrolledStudentViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = EnrolledStudentSerializer
    permission_classes = [IsAttendanceViewer]

    def get_queryset(self):
        queryset = Student.objects.none()
        academic_year_id = self.request.query_params.get("academic_year")
        semester_id = self.request.query_params.get("semester")

        if not academic_year_id or not semester_id:
            return queryset

        try:
            academic_year_id = int(academic_year_id)
            semester_id = int(semester_id)
        except (TypeError, ValueError):
            return queryset

        return get_enrolled_students(
            academic_year_id=academic_year_id,
            semester_id=semester_id,
        )
