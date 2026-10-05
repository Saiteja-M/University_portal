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
        migrations.RemoveField(
            model_name="facultycourseassignment",
            name="course",
        ),
        migrations.RemoveField(
            model_name="facultycourseassignment",
            name="academic_year",
        ),
        migrations.RemoveField(
            model_name="facultycourseassignment",
            name="semester",
        ),
        migrations.RemoveField(
            model_name="facultycourseassignment",
            name="section",
        ),
        migrations.AlterField(
            model_name="facultycourseassignment",
            name="offering",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                related_name="faculty_assignments",
                to="academics.courseoffering",
            ),
        ),
        migrations.RemoveConstraint(
            model_name="facultycourseassignment",
            name="unique_faculty_course_assignment",
        ),
        migrations.AddConstraint(
            model_name="facultycourseassignment",
            constraint=models.UniqueConstraint(
                fields=("faculty", "offering"),
                name="unique_faculty_course_offering_assignment",
            ),
        ),
    ]
