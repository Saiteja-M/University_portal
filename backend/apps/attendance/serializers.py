from rest_framework import serializers

from apps.academics.models import CourseOffering
from apps.students.models import Student
from .models import AttendanceRecord, AttendanceSession


class AttendanceSessionSerializer(serializers.ModelSerializer):
    offering = serializers.PrimaryKeyRelatedField(
        queryset=CourseOffering.objects.select_related("course", "academic_year", "semester"),
        required=True,
    )
    faculty = serializers.PrimaryKeyRelatedField(required=False, queryset=AttendanceSession._meta.get_field("faculty").remote_field.model.objects.all())
    course = serializers.PrimaryKeyRelatedField(required=False, queryset=AttendanceSession._meta.get_field("course").remote_field.model.objects.all())
    academic_year = serializers.PrimaryKeyRelatedField(required=False, queryset=AttendanceSession._meta.get_field("academic_year").remote_field.model.objects.all())
    semester = serializers.PrimaryKeyRelatedField(required=False, queryset=AttendanceSession._meta.get_field("semester").remote_field.model.objects.all())

    offering_course_code = serializers.CharField(source="offering.course.code", read_only=True)
    offering_course_name = serializers.CharField(source="offering.course.name", read_only=True)
    offering_section = serializers.CharField(source="offering.section", read_only=True)
    faculty_employee_id = serializers.CharField(source="faculty.employee_id", read_only=True)
    faculty_name = serializers.SerializerMethodField()
    course_code = serializers.CharField(source="course.code", read_only=True)
    course_name = serializers.CharField(source="course.name", read_only=True)
    academic_year_name = serializers.CharField(source="academic_year.name", read_only=True)
    semester_number = serializers.IntegerField(source="semester.number", read_only=True)
    record_count = serializers.IntegerField(source="records.count", read_only=True)

    class Meta:
        model = AttendanceSession
        fields = (
            "id", "faculty", "offering", "offering_course_code", "offering_course_name",
            "offering_section", "faculty_employee_id", "faculty_name", "course", "course_code",
            "course_name", "academic_year", "academic_year_name", "semester", "semester_number",
            "session_date", "period", "topic", "remarks", "record_count", "created_at", "updated_at",
        )
        read_only_fields = (
            "id", "faculty_employee_id", "faculty_name", "course_code", "course_name",
            "academic_year_name", "semester_number", "record_count", "created_at", "updated_at",
        )

    def get_faculty_name(self, obj):
        user = getattr(obj.faculty, "user", None)
        return user.get_full_name() or user.username if user else obj.faculty.faculty_id

    def validate(self, attrs):
        offering = attrs.get("offering")
        if not offering:
            raise serializers.ValidationError({"offering": "A course offering is required."})

        request = self.context.get("request")
        user = getattr(request, "user", None)
        faculty = attrs.get("faculty")
        current_faculty = getattr(user, "faculty", None) if user and user.is_authenticated else None
        if not faculty and current_faculty:
            faculty = current_faculty
            attrs["faculty"] = faculty
        if not faculty:
            raise serializers.ValidationError({"faculty": "A faculty member is required."})
        if getattr(faculty, "status", None) != faculty.Status.ACTIVE:
            raise serializers.ValidationError({"faculty": "The selected faculty member is not active."})
        if current_faculty and getattr(getattr(user, "profile", None), "user_type", None) == "FACULTY" and faculty.id != current_faculty.id:
            raise serializers.ValidationError({"faculty": "Faculty users can create attendance only for themselves."})
        if not offering.is_active or offering.status in {"CLOSED", "CANCELLED"}:
            raise serializers.ValidationError({"offering": "The course offering is not open for attendance."})
        if not offering.faculty_assignments.filter(faculty=faculty, is_active=True).exists():
            raise serializers.ValidationError({"faculty": "The faculty member is not actively assigned to this course offering."})

        attrs["course"] = offering.course
        attrs["academic_year"] = offering.academic_year
        attrs["semester"] = offering.semester

        session_date = attrs.get("session_date")
        if session_date and not (offering.academic_year.start_date <= session_date <= offering.academic_year.end_date):
            raise serializers.ValidationError({"session_date": "The session date must fall within the academic year."})
        period = attrs.get("period")
        if period is not None and period < 1:
            raise serializers.ValidationError({"period": "Period must be greater than or equal to 1."})
        return attrs


class AttendanceRecordSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    student_id = serializers.CharField(source="student.student_id", read_only=True)

    class Meta:
        model = AttendanceRecord
        fields = ("id", "session", "student", "student_id", "student_name", "status", "marked_at", "remarks")
        read_only_fields = ("id", "student_id", "student_name", "marked_at")

    def get_student_name(self, obj):
        user = getattr(obj.student, "user", None)
        return user.get_full_name() or user.username if user else obj.student.student_id

    def validate(self, attrs):
        session = attrs.get("session", getattr(self.instance, "session", None))
        student = attrs.get("student", getattr(self.instance, "student", None))
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if user and user.is_authenticated and getattr(getattr(user, "profile", None), "user_type", None) == "FACULTY":
            current_faculty = getattr(user, "faculty", None)
            if not current_faculty or not session or session.faculty_id != current_faculty.id:
                raise serializers.ValidationError({"session": "Faculty users can modify attendance only for their own sessions."})
        if session and student and not student.enrollments.filter(
            semester_id=session.semester_id, academic_year_id=session.academic_year_id, status="ACTIVE"
        ).exists():
            raise serializers.ValidationError({"student": "The student does not have an active enrollment in the selected semester and academic year."})
        return attrs


class EnrolledStudentSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = ("id", "student_id", "student_name", "program")

    def get_student_name(self, obj):
        return obj.user.get_full_name() or obj.user.username
