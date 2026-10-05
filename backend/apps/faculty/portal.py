from django.db.models import Subquery
from rest_framework import serializers, viewsets

from apps.academics.models import CourseOffering
from apps.students.models import CourseOfferingEnrollment, Enrollment
from .models import Faculty, FacultyCourseAssignment
from .permissions import FacultyAccessPermission


class FacultyMyCourseSerializer(serializers.ModelSerializer):
    faculty = serializers.IntegerField(source="faculty.id", read_only=True)
    course_id = serializers.IntegerField(source="offering.course.id", read_only=True)
    course_code = serializers.CharField(source="offering.course.code", read_only=True)
    course_name = serializers.CharField(source="offering.course.name", read_only=True)
    credits = serializers.IntegerField(source="offering.course.credits", read_only=True)
    academic_year_name = serializers.CharField(source="offering.academic_year.name", read_only=True)
    semester_number = serializers.IntegerField(source="offering.semester.number", read_only=True)
    program_name = serializers.CharField(source="offering.semester.program.name", read_only=True)
    section = serializers.CharField(source="offering.section", read_only=True)
    offering_status = serializers.CharField(source="offering.status", read_only=True)
    capacity = serializers.IntegerField(source="offering.capacity", read_only=True)

    class Meta:
        model = FacultyCourseAssignment
        fields = [
            "id", "offering", "faculty", "course_id", "course_code", "course_name", "credits",
            "academic_year_name", "semester_number", "program_name", "section",
            "offering_status", "capacity", "assigned_date", "is_active",
        ]


class FacultyMyStudentSerializer(serializers.ModelSerializer):
    student_id = serializers.CharField(source="student_enrollment.student.student_id", read_only=True)
    student_name = serializers.SerializerMethodField()
    admission_number = serializers.CharField(source="student_enrollment.student.admission_number", read_only=True)
    program_name = serializers.CharField(source="offering.semester.program.name", read_only=True)
    offering_section = serializers.CharField(source="offering.section", read_only=True)
    course_code = serializers.CharField(source="offering.course.code", read_only=True)
    course_name = serializers.CharField(source="offering.course.name", read_only=True)
    semester_number = serializers.IntegerField(source="offering.semester.number", read_only=True)
    academic_year_name = serializers.CharField(source="offering.academic_year.name", read_only=True)

    class Meta:
        model = CourseOfferingEnrollment
        fields = [
            "id", "student_id", "student_name", "admission_number", "program_name",
            "offering", "offering_section", "course_code", "course_name",
            "semester_number", "academic_year_name", "status", "enrolled_date",
        ]

    def get_student_name(self, obj):
        user = obj.student_enrollment.student.user
        return user.get_full_name().strip() if user else obj.student_enrollment.student.student_id


class FacultyMyCourseViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = FacultyMyCourseSerializer
    permission_classes = [FacultyAccessPermission]
    search_fields = [
        "offering__course__code", "offering__course__name",
        "offering__section", "offering__semester__program__name",
    ]
    ordering_fields = [
        "offering__course__code", "offering__semester__number",
        "offering__section", "assigned_date",
    ]
    ordering = ["offering__course__code", "offering__section"]

    def get_queryset(self):
        faculty = getattr(self.request.user, "faculty", None)
        if not faculty or faculty.status != Faculty.Status.ACTIVE:
            return FacultyCourseAssignment.objects.none()

        return FacultyCourseAssignment.objects.select_related(
            "offering__course",
            "offering__academic_year",
            "offering__semester__program",
        ).filter(
            faculty=faculty,
            is_active=True,
            offering__is_active=True,
            offering__status__in=[
                CourseOffering.Status.PLANNED,
                CourseOffering.Status.OPEN,
            ],
            offering__semester__is_active=True,
            offering__academic_year__start_date__isnull=False,
        )


class FacultyMyStudentViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = FacultyMyStudentSerializer
    permission_classes = [FacultyAccessPermission]
    search_fields = [
        "student_enrollment__student__student_id",
        "student_enrollment__student__admission_number",
        "student_enrollment__student__user__first_name",
        "student_enrollment__student__user__last_name",
        "offering__course__code",
        "offering__course__name",
        "offering__section",
    ]
    ordering_fields = [
        "student_enrollment__student__student_id",
        "offering__course__code",
        "enrolled_date",
    ]
    ordering = [
        "student_enrollment__student__student_id",
        "offering__course__code",
    ]

    def get_queryset(self):
        faculty = getattr(self.request.user, "faculty", None)
        if not faculty or faculty.status != Faculty.Status.ACTIVE:
            return CourseOfferingEnrollment.objects.none()

        assigned_offerings = FacultyCourseAssignment.objects.filter(
            faculty=faculty,
            is_active=True,
            offering__is_active=True,
            offering__status__in=[
                CourseOffering.Status.PLANNED,
                CourseOffering.Status.OPEN,
            ],
            offering__semester__is_active=True,
        ).values("offering_id")

        queryset = CourseOfferingEnrollment.objects.select_related(
            "student_enrollment__student__user",
            "offering__course",
            "offering__academic_year",
            "offering__semester__program",
        ).filter(
            offering_id__in=Subquery(assigned_offerings),
            student_enrollment__status=Enrollment.Status.ACTIVE,
            status=CourseOfferingEnrollment.Status.ENROLLED,
            offering__status__in=[
                CourseOffering.Status.PLANNED,
                CourseOffering.Status.OPEN,
            ],
            offering__semester__is_active=True,
            offering__is_active=True,
        ).distinct()

        offering_id = self.request.query_params.get("offering")
        if offering_id:
            queryset = queryset.filter(offering_id=offering_id)

        return queryset
