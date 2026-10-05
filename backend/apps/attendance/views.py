from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.academics.models import AcademicYear, Course, Program, Semester
from apps.students.models import Student

from .models import AttendanceRecord, AttendanceSession
from .permissions import IsAttendanceManager, IsAttendanceViewer
from .reports import download_excel_response, get_class_attendance_report
from .serializers import (
    AttendanceRecordSerializer,
    AttendanceSessionSerializer,
    EnrolledStudentSerializer,
)
from .services import get_enrolled_students, get_session_summary, mark_attendance


class AttendanceSessionViewSet(viewsets.ModelViewSet):
    serializer_class = AttendanceSessionSerializer

    def get_queryset(self):
        queryset = (
            AttendanceSession.objects.select_related(
                "faculty",
                "faculty__user",
                "course",
                "academic_year",
                "semester",
                "semester__program",
                "offering",
                "offering__course",
                "offering__academic_year",
                "offering__semester",
            )
            .prefetch_related("records")
            .all()
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
            if not faculty:
                return queryset.none()
            queryset = queryset.filter(faculty=faculty)
        elif role == "STUDENT":
            student = getattr(user, "student", None)
            if not student:
                return queryset.none()
            queryset = queryset.filter(records__student=student).distinct()
        elif role in {"ADMIN", "HOD"}:
            pass
        else:
            return queryset.none()

        return queryset

    def get_permissions(self):
        read_actions = {"list", "retrieve", "summary", "class_report"}
        permission_class = (
            IsAttendanceViewer
            if self.action in read_actions
            else IsAttendanceManager
        )
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

        if not all(
            [program_id, academic_year_id, semester_id, course_id]
        ):
            return Response(
                {
                    "detail": (
                        "program, academic_year, semester and course "
                        "are required."
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
            }
        )


class AttendanceRecordViewSet(viewsets.ModelViewSet):
    serializer_class = AttendanceRecordSerializer

    def get_queryset(self):
        queryset = (
            AttendanceRecord.objects.select_related(
                "session",
                "session__course",
                "session__faculty",
                "session__academic_year",
                "session__semester",
                "student",
                "student__user",
            ).all()
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
            if not faculty:
                return queryset.none()
            queryset = queryset.filter(session__faculty=faculty)
        elif role == "STUDENT":
            student = getattr(user, "student", None)
            if not student:
                return queryset.none()
            queryset = queryset.filter(student=student)
        elif role in {"ADMIN", "HOD"}:
            pass
        else:
            return queryset.none()

        return queryset

    def get_permissions(self):
        read_actions = {"list", "retrieve", "my_summary"}
        permission_class = (
            IsAttendanceViewer
            if self.action in read_actions
            else IsAttendanceManager
        )
        return [permission_class()]

    @action(detail=False, methods=["get"], url_path="my-summary")
    def my_summary(self, request):
        """Return the authenticated student's own attendance summary."""
        user = request.user
        student = getattr(user, "student", None)

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
        present = records.filter(
            status=AttendanceRecord.Status.PRESENT
        ).count()
        absent = records.filter(
            status=AttendanceRecord.Status.ABSENT
        ).count()
        late = records.filter(
            status=AttendanceRecord.Status.LATE
        ).count()

        attended = present + late
        percentage = round((attended / total) * 100, 2) if total else 0

        course_data = {}

        for record in records:
            course = record.session.course

            if course.id not in course_data:
                course_data[course.id] = {
                    "course_id": course.id,
                    "course_code": course.code,
                    "course_name": course.name,
                    "total_classes": 0,
                    "present": 0,
                    "absent": 0,
                    "late": 0,
                }

            item = course_data[course.id]
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

        recent_records = []

        for record in records[:10]:
            session = record.session
            course = session.course
            recent_records.append(
                {
                    "id": record.id,
                    "date": session.session_date,
                    "course_code": course.code,
                    "course_name": course.name,
                    "period": session.period,
                    "status": record.status,
                    "remarks": record.remarks,
                }
            )

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
                "recent": recent_records,
            },
            status=status.HTTP_200_OK,
        )


class EnrolledStudentViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = EnrolledStudentSerializer
    permission_classes = [IsAttendanceViewer]

    def get_queryset(self):
        academic_year_id = self.request.query_params.get("academic_year")
        semester_id = self.request.query_params.get("semester")

        if not academic_year_id or not semester_id:
            return Student.objects.none()

        try:
            academic_year_id = int(academic_year_id)
            semester_id = int(semester_id)
        except (TypeError, ValueError):
            return Student.objects.none()

        return get_enrolled_students(
            academic_year_id=academic_year_id,
            semester_id=semester_id,
        )
