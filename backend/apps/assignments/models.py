from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone

from apps.common.models import TimeStampedModel
from apps.academics.models import CourseOffering
from apps.faculty.models import FacultyCourseAssignment
from apps.students.models import CourseOfferingEnrollment, Student


class Assignment(TimeStampedModel):
    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        PUBLISHED = "PUBLISHED", "Published"
        CLOSED = "CLOSED", "Closed"

    offering = models.ForeignKey(CourseOffering, on_delete=models.PROTECT, related_name="assignments")
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    due_date = models.DateTimeField()
    max_marks = models.PositiveIntegerField(default=10)
    attachment = models.FileField(upload_to="assignments/", blank=True, null=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["due_date", "-created_at"]
        indexes = [models.Index(fields=["offering", "status"]), models.Index(fields=["due_date"])]

    def clean(self):
        if self.offering_id:
            if not self.offering.is_active or self.offering.status in {"CLOSED", "CANCELLED"}:
                raise ValidationError({"offering": "Assignments can only be created for an active open course offering."})
            if self.due_date and self.due_date <= timezone.now():
                raise ValidationError({"due_date": "Due date must be in the future."})
            if self.max_marks <= 0:
                raise ValidationError({"max_marks": "Maximum marks must be greater than zero."})

    def __str__(self):
        return f"{self.offering.course.code} - {self.title}"


class AssignmentSubmission(TimeStampedModel):
    class Status(models.TextChoices):
        SUBMITTED = "SUBMITTED", "Submitted"
        GRADED = "GRADED", "Graded"
        LATE = "LATE", "Late"

    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name="submissions")
    student = models.ForeignKey(Student, on_delete=models.PROTECT, related_name="assignment_submissions")
    submitted_at = models.DateTimeField(auto_now_add=True)
    file = models.FileField(upload_to="assignments/submissions/", blank=True, null=True)
    answer_text = models.TextField(blank=True)
    marks = models.PositiveIntegerField(null=True, blank=True)
    feedback = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.SUBMITTED)

    class Meta:
        ordering = ["-submitted_at"]
        constraints = [models.UniqueConstraint(fields=["assignment", "student"], name="unique_assignment_student_submission")]
        indexes = [models.Index(fields=["assignment", "student"]), models.Index(fields=["status"])]

    def clean(self):
        if self.assignment_id and self.student_id:
            assignment = self.assignment
            eligible = CourseOfferingEnrollment.objects.filter(
                offering=assignment.offering,
                student_enrollment__student_id=self.student_id,
                student_enrollment__status=CourseOfferingEnrollment.student_enrollment.field.related_model.Status.ACTIVE,
                status=CourseOfferingEnrollment.Status.ENROLLED,
            ).exists()
            if not eligible:
                raise ValidationError({"student": "Student is not actively enrolled in this course offering."})
            if self.marks is not None and self.marks > assignment.max_marks:
                raise ValidationError({"marks": "Marks cannot exceed the assignment maximum marks."})

    def __str__(self):
        return f"{self.assignment.title} - {self.student.student_id}"
