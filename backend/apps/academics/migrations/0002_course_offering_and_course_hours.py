# Generated manually for the portal foundation phase.

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("academics", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="course",
            name="course_category",
            field=models.CharField(
                choices=[
                    ("THEORY", "Theory"),
                    ("LABORATORY", "Laboratory"),
                    ("PROJECT", "Project"),
                    ("SEMINAR", "Seminar"),
                    ("OTHER", "Other"),
                ],
                default="THEORY",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="course",
            name="lecture_hours",
            field=models.PositiveSmallIntegerField(default=0),
        ),
        migrations.AddField(
            model_name="course",
            name="tutorial_hours",
            field=models.PositiveSmallIntegerField(default=0),
        ),
        migrations.AddField(
            model_name="course",
            name="practical_hours",
            field=models.PositiveSmallIntegerField(default=0),
        ),
        migrations.CreateModel(
            name="CourseOffering",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "created_at",
                    models.DateTimeField(auto_now_add=True),
                ),
                (
                    "updated_at",
                    models.DateTimeField(auto_now=True),
                ),
                (
                    "section",
                    models.CharField(max_length=50),
                ),
                (
                    "capacity",
                    models.PositiveIntegerField(default=60),
                ),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("PLANNED", "Planned"),
                            ("OPEN", "Open"),
                            ("CLOSED", "Closed"),
                            ("CANCELLED", "Cancelled"),
                        ],
                        default="PLANNED",
                        max_length=20,
                    ),
                ),
                (
                    "is_active",
                    models.BooleanField(default=True),
                ),
                (
                    "academic_year",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="course_offerings",
                        to="academics.academicyear",
                    ),
                ),
                (
                    "course",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="offerings",
                        to="academics.course",
                    ),
                ),
                (
                    "semester",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="course_offerings",
                        to="academics.semester",
                    ),
                ),
            ],
            options={
                "ordering": [
                    "-academic_year__start_date",
                    "semester__number",
                    "course__code",
                    "section",
                ],
            },
        ),
        migrations.AddConstraint(
            model_name="courseoffering",
            constraint=models.UniqueConstraint(
                fields=(
                    "course",
                    "academic_year",
                    "semester",
                    "section",
                ),
                name="unique_course_offering",
            ),
        ),
    ]
