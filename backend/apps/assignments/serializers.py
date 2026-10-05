from django.utils import timezone
from rest_framework import serializers

from apps.faculty.models import FacultyCourseAssignment
from apps.students.models import CourseOfferingEnrollment
from .models import Assignment, AssignmentSubmission


class AssignmentSerializer(serializers.ModelSerializer):
    course_code = serializers.CharField(source="offering.course.code", read_only=True)
    course_name = serializers.CharField(source="offering.course.name", read_only=True)
    section = serializers.CharField(source="offering.section", read_only=True)
    academic_year_name = serializers.CharField(source="offering.academic_year.name", read_only=True)
    semester_number = serializers.IntegerField(source="offering.semester.number", read_only=True)
    program_name = serializers.CharField(source="offering.semester.program.name", read_only=True)
    submission_count = serializers.SerializerMethodField()

    class Meta:
        model = Assignment
        fields = [
            "id", "offering", "course_code", "course_name", "section",
            "academic_year_name", "semester_number", "program_name",
            "title", "description", "due_date", "max_marks", "attachment",
            "status", "is_active", "submission_count", "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "course_code", "course_name", "section",
            "academic_year_name", "semester_number", "program_name",
            "submission_count", "created_at", "updated_at",
        ]

    def get_submission_count(self, obj):
        return obj.submissions.count()

    def validate(self, attrs):
        offering = attrs.get("offering") or getattr(self.instance, "offering", None)
        due_date = attrs.get("due_date") or getattr(self.instance, "due_date", None)
        if offering:
            if not offering.is_active or offering.status in {"CLOSED", "CANCELLED"}:
                raise serializers.ValidationError({"offering": "Only active, open course offerings can have assignments."})
            user = self.context["request"].user
            if user.groups.filter(name="FACULTY").exists() and not user.groups.filter(name__in={"ADMIN", "HOD"}).exists():
                faculty = getattr(user, "faculty", None)
                if not faculty or not FacultyCourseAssignment.objects.filter(
                    faculty=faculty, offering=offering, is_active=True
                ).exists():
                    raise serializers.ValidationError({"offering": "You are not assigned to this course offering."})
        if due_date and due_date <= timezone.now():
            raise serializers.ValidationError({"due_date": "Due date must be in the future."})
        return attrs


class AssignmentSubmissionSerializer(serializers.ModelSerializer):
    student_id = serializers.CharField(source="student.student_id", read_only=True)
    student_name = serializers.SerializerMethodField()
    assignment_title = serializers.CharField(source="assignment.title", read_only=True)
    course_code = serializers.CharField(source="assignment.offering.course.code", read_only=True)

    class Meta:
        model = AssignmentSubmission
        fields = [
            "id", "assignment", "assignment_title", "course_code", "student",
            "student_id", "student_name", "submitted_at", "file", "answer_text",
            "marks", "feedback", "status", "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "student", "student_id", "student_name", "submitted_at",
            "created_at", "updated_at",
        ]

    def get_student_name(self, obj):
        return obj.student.user.get_full_name().strip() if obj.student.user else obj.student.student_id

    def get_extra_kwargs(self):
        extra = super().get_extra_kwargs()
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if user and user.groups.filter(name="STUDENT").exists() and not user.groups.filter(name__in={"ADMIN", "HOD", "FACULTY"}).exists():
            extra.update({
                "marks": {"read_only": True},
                "feedback": {"read_only": True},
                "status": {"read_only": True},
            })
        return extra

    def validate(self, attrs):
        request = self.context["request"]
        assignment = attrs.get("assignment") or getattr(self.instance, "assignment", None)
        if not assignment:
            return attrs
        if not assignment.is_active or assignment.status != Assignment.Status.PUBLISHED:
            raise serializers.ValidationError({"assignment": "Only published active assignments accept submissions."})
        student = getattr(request.user, "student", None)
        is_student = request.user.groups.filter(name="STUDENT").exists()
        is_manager = request.user.is_superuser or request.user.groups.filter(name__in={"ADMIN", "HOD", "FACULTY"}).exists()
        if not student or not is_student:
            if is_manager:
                return attrs
            raise serializers.ValidationError({"assignment": "Only students can submit assignments."})
        enrolled = CourseOfferingEnrollment.objects.filter(
            offering=assignment.offering,
            student_enrollment__student=student,
            student_enrollment__status="ACTIVE",
            status=CourseOfferingEnrollment.Status.ENROLLED,
        ).exists()
        if not enrolled:
            raise serializers.ValidationError({"assignment": "You are not enrolled in this course offering."})
        return attrs
