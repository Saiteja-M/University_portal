from django.contrib.auth.models import Group, User
from django.db import transaction
from django.utils import timezone
from rest_framework import serializers
from apps.accounts.models import UserProfile
from .models import Faculty, FacultyProfile, FacultyQualification, FacultyExperience, FacultyCourseAssignment


class FacultyProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    class Meta:
        model = FacultyProfile
        fields = ["id","faculty","first_name","last_name","full_name","date_of_birth","gender","blood_group","phone_number","alternate_phone_number","institutional_email","personal_email","address","city","state","postal_code","photo","created_at","updated_at"]
        read_only_fields = ["id","full_name","created_at","updated_at"]
    def get_full_name(self, obj): return f"{obj.first_name or ''} {obj.last_name or ''}".strip()


class FacultyQualificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = FacultyQualification
        fields = ["id","faculty","degree","specialization","institution","university","year_of_passing","grade_or_percentage","created_at","updated_at"]
        read_only_fields = ["id","created_at","updated_at"]


class FacultyExperienceSerializer(serializers.ModelSerializer):
    class Meta:
        model = FacultyExperience
        fields = ["id","faculty","organization","designation","start_date","end_date","description","created_at","updated_at"]
        read_only_fields = ["id","created_at","updated_at"]
    def validate(self, attrs):
        if attrs.get("start_date") and attrs.get("end_date") and attrs["end_date"] < attrs["start_date"]:
            raise serializers.ValidationError({"end_date":"End date must be greater than or equal to start date."})
        return attrs


class FacultySerializer(serializers.ModelSerializer):
    profile = FacultyProfileSerializer(read_only=True)
    qualifications = FacultyQualificationSerializer(many=True, read_only=True)
    experiences = FacultyExperienceSerializer(many=True, read_only=True)
    department_name = serializers.CharField(source="department.name", read_only=True)
    faculty_id = serializers.CharField(required=False, allow_blank=True)
    create_username = serializers.CharField(write_only=True, required=False)
    create_password = serializers.CharField(write_only=True, required=False, min_length=8)
    create_first_name = serializers.CharField(write_only=True, required=False)
    create_last_name = serializers.CharField(write_only=True, required=False)
    create_email = serializers.EmailField(write_only=True, required=False, allow_blank=True)
    class Meta:
        model = Faculty
        fields = ["id","faculty_id","employee_id","department","department_name","designation","employment_type","joining_date","status","user","create_username","create_password","create_first_name","create_last_name","create_email","profile","qualifications","experiences","created_at","updated_at"]
        read_only_fields = ["id","department_name","user","profile","qualifications","experiences","created_at","updated_at"]
    def validate(self, attrs):
        username, password = attrs.get("create_username"), attrs.get("create_password")
        if bool(username) != bool(password):
            raise serializers.ValidationError({"create_password":"Username and password are required together."} if username else {"create_username":"Username and password are required together."})
        if username and User.objects.filter(username=username).exists():
            raise serializers.ValidationError({"create_username":"A user with this username already exists."})
        employee_id = attrs.get("employee_id")
        if employee_id:
            existing = Faculty.objects.filter(employee_id=employee_id)
            if self.instance:
                existing = existing.exclude(pk=self.instance.pk)
            if existing.exists():
                raise serializers.ValidationError({"employee_id":"A faculty member with this employee ID already exists."})

        department = attrs.get("department", getattr(self.instance, "department", None))
        if department and not department.is_active:
            raise serializers.ValidationError({"department":"Faculty must belong to an active department."})

        joining_date = attrs.get("joining_date", getattr(self.instance, "joining_date", None))
        if joining_date and joining_date > timezone.localdate():
            raise serializers.ValidationError({"joining_date":"Joining date cannot be in the future."})
        return attrs
    def create(self, validated_data):
        username = validated_data.pop("create_username", None)
        password = validated_data.pop("create_password", None)
        first_name = validated_data.pop("create_first_name", "")
        last_name = validated_data.pop("create_last_name", "")
        email = validated_data.pop("create_email", "")
        validated_data.setdefault("faculty_id", validated_data["employee_id"])
        with transaction.atomic():
            user = None
            if username:
                user = User.objects.create_user(username=username, password=password, first_name=first_name, last_name=last_name, email=email, is_active=True)
                UserProfile.objects.create(user=user, user_type=UserProfile.UserType.FACULTY, employee_or_student_id=validated_data["employee_id"])
                group, _ = Group.objects.get_or_create(name="FACULTY")
                user.groups.add(group)
            return Faculty.objects.create(user=user, **validated_data)


class FacultyCourseAssignmentSerializer(serializers.ModelSerializer):
    faculty_name = serializers.SerializerMethodField()
    faculty_employee_id = serializers.CharField(source="faculty.employee_id", read_only=True)
    course_code = serializers.CharField(source="offering.course.code", read_only=True)
    course_name = serializers.CharField(source="offering.course.name", read_only=True)
    academic_year_name = serializers.CharField(source="offering.academic_year.name", read_only=True)
    semester_number = serializers.IntegerField(source="offering.semester.number", read_only=True)
    program_name = serializers.CharField(source="offering.semester.program.name", read_only=True)
    section = serializers.CharField(source="offering.section", read_only=True)
    class Meta:
        model = FacultyCourseAssignment
        fields = ["id","faculty","faculty_name","faculty_employee_id","offering","course_code","course_name","academic_year_name","semester_number","program_name","section","assigned_date","is_active","created_at","updated_at"]
        read_only_fields = ["id","faculty_name","faculty_employee_id","course_code","course_name","academic_year_name","semester_number","program_name","section","created_at","updated_at"]
    def get_faculty_name(self, obj):
        user = getattr(obj.faculty, "user", None)
        return user.get_full_name() or user.username if user else obj.faculty.faculty_id
    def validate(self, attrs):
        faculty, offering = attrs.get("faculty"), attrs.get("offering")
        if faculty and faculty.status != Faculty.Status.ACTIVE:
            raise serializers.ValidationError({"faculty":"Only active faculty can be assigned to a course offering."})
        if offering and (not offering.is_active or offering.status in {"CLOSED","CANCELLED"}):
            raise serializers.ValidationError({"offering":"Only active open/planned course offerings can receive a faculty assignment."})
        return attrs
