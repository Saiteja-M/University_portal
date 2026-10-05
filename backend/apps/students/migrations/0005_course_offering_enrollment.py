from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("students", "0004_studentprofile_photo"),
        ("academics", "0004_course_offering_and_course_hours"),
    ]

    operations = [
        migrations.CreateModel(
            name="CourseOfferingEnrollment",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("status", models.CharField(choices=[("ENROLLED", "Enrolled"), ("DROPPED", "Dropped"), ("COMPLETED", "Completed")], default="ENROLLED", max_length=20)),
                ("enrolled_date", models.DateField()),
                ("offering", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="student_enrollments", to="academics.courseoffering")),
                ("student_enrollment", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="course_offering_enrollments", to="students.enrollment")),
            ],
            options={
                "ordering": ["student_enrollment__student__student_id"],
                "constraints": [models.UniqueConstraint(fields=("student_enrollment", "offering"), name="unique_student_enrollment_course_offering")],
            },
        ),
    ]
