from django.db import migrations, models
import django.db.models.deletion


def migrate_results_to_offerings(apps, schema_editor):
    Exam = apps.get_model("examinations", "Exam")
    StudentResult = apps.get_model("examinations", "StudentResult")
    CourseOffering = apps.get_model("academics", "CourseOffering")

    for result in StudentResult.objects.select_related("exam", "course").all().iterator():
        exam = result.exam
        course = result.course
        offering, _ = CourseOffering.objects.get_or_create(
            course_id=course.id,
            academic_year_id=exam.semester.academic_year_id,
            semester_id=exam.semester_id,
            section="GENERAL",
            defaults={
                "capacity": 9999,
                "status": "OPEN",
                "is_active": True,
            },
        )
        result.course_offering_id = offering.id
        result.save(update_fields=["course_offering"])


class Migration(migrations.Migration):

    dependencies = [
        ("examinations", "0001_initial"),
        ("academics", "0004_course_offering_and_course_hours"),
    ]

    operations = [
        migrations.AddField(
            model_name="studentresult",
            name="course_offering",
            field=models.ForeignKey(
                null=True,
                blank=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="exam_results",
                to="academics.courseoffering",
            ),
        ),
        migrations.RunPython(
            migrate_results_to_offerings,
            migrations.RunPython.noop,
        ),
    ]
