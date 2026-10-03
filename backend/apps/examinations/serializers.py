from rest_framework import serializers

from .models import Exam, StudentResult


class ExamSerializer(serializers.ModelSerializer):
    semester_number = serializers.IntegerField(
        source="semester.number",
        read_only=True,
    )

    academic_year_name = serializers.CharField(
        source="semester.academic_year.name",
        read_only=True,
    )

    class Meta:
        model = Exam
        fields = [
            "id",
            "name",
            "exam_type",
            "semester",
            "semester_number",
            "academic_year_name",
            "start_date",
            "end_date",
            "max_marks",
            "is_published",
            "is_active",
        ]

        read_only_fields = [
            "id",
            "semester_number",
            "academic_year_name",
            "is_published",
        ]

    def validate(self, attrs):
        start_date = attrs.get(
            "start_date",
            getattr(self.instance, "start_date", None),
        )

        end_date = attrs.get(
            "end_date",
            getattr(self.instance, "end_date", None),
        )

        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError(
                {
                    "end_date": (
                        "End date cannot be earlier than "
                        "start date."
                    )
                }
            )

        return attrs


class StudentResultSerializer(serializers.ModelSerializer):
    student_id = serializers.CharField(
        source="student.student_id",
        read_only=True,
    )

    course_code = serializers.CharField(
        source="course.code",
        read_only=True,
    )

    course_name = serializers.CharField(
        source="course.name",
        read_only=True,
    )

    credits = serializers.IntegerField(
        source="course.credits",
        read_only=True,
    )

    semester_number = serializers.IntegerField(
        source="exam.semester.number",
        read_only=True,
    )

    academic_year_name = serializers.CharField(
        source="exam.semester.academic_year.name",
        read_only=True,
    )

    exam_name = serializers.CharField(
        source="exam.name",
        read_only=True,
    )

    exam_type = serializers.CharField(
        source="exam.exam_type",
        read_only=True,
    )

    max_marks = serializers.IntegerField(
        source="exam.max_marks",
        read_only=True,
    )

    class Meta:
        model = StudentResult

        fields = [
            "id",
            "student_id",
            "exam",
            "exam_name",
            "exam_type",
            "course",
            "course_code",
            "course_name",
            "credits",
            "semester_number",
            "academic_year_name",
            "max_marks",
            "marks",
            "grade",
            "grade_point",
            "status",
            "remarks",
            "created_at",
            "updated_at",
        ]

        read_only_fields = fields


class AdminStudentResultSerializer(
    serializers.ModelSerializer,
):
    student_id = serializers.CharField(
        source="student.student_id",
        read_only=True,
    )

    student_name = serializers.SerializerMethodField()

    exam_name = serializers.CharField(
        source="exam.name",
        read_only=True,
    )

    exam_type = serializers.CharField(
        source="exam.exam_type",
        read_only=True,
    )

    course_code = serializers.CharField(
        source="course.code",
        read_only=True,
    )

    course_name = serializers.CharField(
        source="course.name",
        read_only=True,
    )

    credits = serializers.IntegerField(
        source="course.credits",
        read_only=True,
    )

    max_marks = serializers.IntegerField(
        source="exam.max_marks",
        read_only=True,
    )

    semester_number = serializers.IntegerField(
        source="exam.semester.number",
        read_only=True,
    )

    class Meta:
        model = StudentResult

        fields = [
            "id",
            "student",
            "student_id",
            "student_name",
            "exam",
            "exam_name",
            "exam_type",
            "course",
            "course_code",
            "course_name",
            "credits",
            "semester_number",
            "max_marks",
            "marks",
            "grade",
            "grade_point",
            "status",
            "remarks",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "student_id",
            "student_name",
            "exam_name",
            "exam_type",
            "course_code",
            "course_name",
            "credits",
            "max_marks",
            "semester_number",
            "created_at",
            "updated_at",
        ]

    def get_student_name(self, obj):
        return obj.student.user.get_full_name().strip() or (
            obj.student.user.username
        )

    def validate(self, attrs):
        exam = attrs.get(
            "exam",
            getattr(self.instance, "exam", None),
        )

        course = attrs.get(
            "course",
            getattr(self.instance, "course", None),
        )

        marks = attrs.get(
            "marks",
            getattr(self.instance, "marks", None),
        )

        if exam and course:
            if course.semester_id != exam.semester_id:
                raise serializers.ValidationError(
                    {
                        "course": (
                            "The selected course does not "
                            "belong to the selected exam semester."
                        )
                    }
                )

        if exam and marks is not None:
            if marks > exam.max_marks:
                raise serializers.ValidationError(
                    {
                        "marks": (
                            f"Marks cannot exceed the exam "
                            f"maximum of {exam.max_marks}."
                        )
                    }
                )

        return attrs