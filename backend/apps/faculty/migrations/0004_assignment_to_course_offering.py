from django.db import migrations, models
import django.db.models.deletion


def migrate_assignments_to_offerings(apps, schema_editor):
    FacultyCourseAssignment = apps.get_model("faculty", "FacultyCourseAssignment")
    CourseOffering = apps.get_model("academics", "CourseOffering")

    for assignment in FacultyCourseAssignment.objects.all().iterator():
        offering, _ = CourseOffering.objects.get_or_create(
            course_id=assignment.course_id,
            academic_year_id=assignment.academic_year_id,
            semester_id=assignment.semester_id,
            section=(assignment.section or "").strip().upper(),
            defaults={
                "capacity": 60,
                "status": "OPEN" if assignment.is_active else "CLOSED",
                "is_active": assignment.is_active,
            },
        )
        assignment.offering_id = offering.id
        assignment.save(update_fields=["offering"])


class Migration(migrations.Migration):
    # Keep data migration separate from schema changes. PostgreSQL can reject
    # later ALTER TABLE statements when trigger events from the data migration
    # are still pending in the same migration transaction.
    atomic = False

    dependencies = [
        ("academics", "0004_course_offering_and_course_hours"),
        ("faculty", "0003_alter_faculty_faculty_id_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="facultycourseassignment",
            name="offering",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="faculty_assignments",
                to="academics.courseoffering",
            ),
        ),
        migrations.RunPython(
            migrate_assignments_to_offerings,
            migrations.RunPython.noop,
        ),
    ]
