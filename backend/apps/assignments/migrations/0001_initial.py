import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True
    dependencies = [
        ("academics", "0004_course_offering_and_course_hours"),
        ("students", "0005_course_offering_enrollment"),
    ]
    operations = [
        migrations.CreateModel(
            name="Assignment",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("title", models.CharField(max_length=200)),
                ("description", models.TextField(blank=True)),
                ("due_date", models.DateTimeField()),
                ("max_marks", models.PositiveIntegerField(default=10)),
                ("attachment", models.FileField(blank=True, null=True, upload_to="assignments/")),
                ("status", models.CharField(choices=[("DRAFT", "Draft"), ("PUBLISHED", "Published"), ("CLOSED", "Closed")], default="DRAFT", max_length=20)),
                ("is_active", models.BooleanField(default=True)),
                ("offering", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="assignments", to="academics.courseoffering")),
            ],
            options={"ordering": ["due_date", "-created_at"], "indexes": [models.Index(fields=["offering", "status"], name="assignments_assignment_offering_status_idx"), models.Index(fields=["due_date"], name="assignments_assignment_due_date_idx")]},
        ),
        migrations.CreateModel(
            name="AssignmentSubmission",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("submitted_at", models.DateTimeField(auto_now_add=True)),
                ("file", models.FileField(blank=True, null=True, upload_to="assignments/submissions/")),
                ("answer_text", models.TextField(blank=True)),
                ("marks", models.PositiveIntegerField(blank=True, null=True)),
                ("feedback", models.TextField(blank=True)),
                ("status", models.CharField(choices=[("SUBMITTED", "Submitted"), ("GRADED", "Graded"), ("LATE", "Late")], default="SUBMITTED", max_length=20)),
                ("assignment", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="submissions", to="assignments.assignment")),
                ("student", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="assignment_submissions", to="students.student")),
            ],
            options={"ordering": ["-submitted_at"], "indexes": [models.Index(fields=["assignment", "student"], name="assignments_submission_assignment_student_idx"), models.Index(fields=["status"], name="assignments_submission_status_idx")]},
        ),
        migrations.AddConstraint(
            model_name="assignmentsubmission",
            constraint=models.UniqueConstraint(fields=["assignment", "student"], name="unique_assignment_student_submission"),
        ),
    ]
