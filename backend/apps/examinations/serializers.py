from rest_framework import serializers

from apps.academics.models import CourseOffering
from apps.students.models import CourseOfferingEnrollment

from .models import Exam, StudentResult


class ExamSerializer(serializers.ModelSerializer):
    semester_number = serializers.IntegerField(source="semester.number", read_only=True)
    academic_year_name = serializers.CharField(
        source="semester.academic_year.name", read_only=True
    )
    program_name = serializers.CharField(
        source="semester.program.name", read_only=True
    )

    class Meta:
        model = Exam
        fields = [
            "id", "name", "exam_type", "semester", "semester_number",
            "academic_year_name", "program_name", "start_date", "end_date",
            "max_marks", "is_published", "is_active",
        ]
        read_only_fields = [
            "id", "semester_number", "academic_year_name", "program_name",
            "is_published",
        ]

    def validate(self, attrs):
        start_date = attrs.get("start_date", getattr(self.instance, "start_date", None))
        end_date = attrs.get("end_date", getattr(self.instance, "end_date", None))
        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError({"end_date": "End date cannot be earlier than start date."})
        if self.instance and self.instance.is_published:
            changed = set(attrs) - {"is_active"}
            if changed:
                raise serializers.ValidationError(
                    {"exam": "Published examinations cannot be structurally modified."}
                )
        return attrs


class StudentResultSerializer(serializers.ModelSerializer):
    student_id = serializers.CharField(source="student.student_id", read_only=True)
    course_code = serializers.CharField(source="course_offering.course.code", read_only=True)
    course_name = serializers.CharField(source="course_offering.course.name", read_only=True)
    section = serializers.CharField(source="course_offering.section", read_only=True)
    credits = serializers.IntegerField(source="course_offering.course.credits", read_only=True)
    semester_number = serializers.IntegerField(source="exam.semester.number", read_only=True)
    academic_year_name = serializers.CharField(
        source="exam.semester.academic_year.name", read_only=True
    )
    exam_name = serializers.CharField(source="exam.name", read_only=True)
    exam_type = serializers.CharField(source="exam.exam_type", read_only=True)
    max_marks = serializers.IntegerField(source="exam.max_marks", read_only=True)

    class Meta:
        model = StudentResult
        fields = [
            "id", "student_id", "exam", "exam_name", "exam_type",
            "course_offering", "course_code", "course_name", "section",
            "credits", "semester_number", "academic_year_name", "max_marks",
            "marks", "grade", "grade_point", "status", "remarks",
            "created_at", "updated_at",
        ]
        read_only_fields = fields


class AdminStudentResultSerializer(serializers.ModelSerializer):
    student_id = serializers.CharField(source="student.student_id", read_only=True)
    student_name = serializers.SerializerMethodField()
    exam_name = serializers.CharField(source="exam.name", read_only=True)
    exam_type = serializers.CharField(source="exam.exam_type", read_only=True)
    course_code = serializers.CharField(source="course_offering.course.code", read_only=True)
    course_name = serializers.CharField(source="course_offering.course.name", read_only=True)
    section = serializers.CharField(source="course_offering.section", read_only=True)
    credits = serializers.IntegerField(source="course_offering.course.credits", read_only=True)
    max_marks = serializers.IntegerField(source="exam.max_marks", read_only=True)
    semester_number = serializers.IntegerField(source="exam.semester.number", read_only=True)
    academic_year_name = serializers.CharField(
        source="exam.semester.academic_year.name", read_only=True
    )

    class Meta:
        model = StudentResult
        fields = [
            "id", "student", "student_id", "student_name", "exam", "exam_name",
            "exam_type", "course_offering", "course_code", "course_name", "section",
            "credits", "semester_number", "academic_year_name", "max_marks",
            "marks", "grade", "grade_point", "status", "remarks",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "student_id", "student_name", "exam_name", "exam_type",
            "course_code", "course_name", "section", "credits", "max_marks",
            "semester_number", "academic_year_name", "created_at", "updated_at",
        ]

    def get_student_name(self, obj):
        if obj.student.user:
            return obj.student.user.get_full_name().strip() or obj.student.user.username
        return obj.student.student_id

    def validate(self, attrs):
        exam = attrs.get("exam", getattr(self.instance, "exam", None))
        offering = attrs.get(
            "course_offering", getattr(self.instance, "course_offering", None)
        )
        student = attrs.get("student", getattr(self.instance, "student", None))
        marks = attrs.get("marks", getattr(self.instance, "marks", None))

        if exam and exam.is_published and (self.instance is None or "exam" in attrs or "course_offering" in attrs):
            raise serializers.ValidationError(
                {"exam": "Results cannot be created or structurally changed for a published examination."}
            )

        if exam and offering:
            if offering.semester_id != exam.semester_id:
                raise serializers.ValidationError(
                    {"course_offering": "The selected course offering does not belong to the examination semester."}
                )
            if not offering.is_active or offering.status in {
                CourseOffering.Status.CLOSED, CourseOffering.Status.CANCELLED
            }:
                raise serializers.ValidationError(
                    {"course_offering": "The selected course offering is not active."}
                )

        if student and offering:
            eligible = CourseOfferingEnrollment.objects.filter(
                student_enrollment__student=student,
                offering=offering,
                status=CourseOfferingEnrollment.Status.ENROLLED,
                student_enrollment__status="ACTIVE",
            ).exists()
            if not eligible:
                raise serializers.ValidationError(
                    {"student": "The student is not actively enrolled in the selected course offering."}
                )

        if exam and marks is not None and marks > exam.max_marks:
            raise serializers.ValidationError(
                {"marks": f"Marks cannot exceed the examination maximum of {exam.max_marks}."}
            )

        return attrs
