from django.db import migrations, models
import django.db.models.deletion


def link_legacy_sessions(apps, schema_editor):
    AttendanceSession = apps.get_model("attendance", "AttendanceSession")
    CourseOffering = apps.get_model("academics", "CourseOffering")
    FacultyCourseAssignment = apps.get_model("faculty", "FacultyCourseAssignment")

    for session in AttendanceSession.objects.all().iterator():
        offering = (
            CourseOffering.objects
            .filter(
                course_id=session.course_id,
                academic_year_id=session.academic_year_id,
                semester_id=session.semester_id,
                faculty_assignments__faculty_id=session.faculty_id,
                faculty_assignments__is_active=True,
            )
            .order_by("id")
            .first()
        )
        if offering is None:
            offering, _ = CourseOffering.objects.get_or_create(
                course_id=session.course_id,
                academic_year_id=session.academic_year_id,
                semester_id=session.semester_id,
                section="GENERAL",
                defaults={"capacity": 60, "status": "OPEN", "is_active": True},
            )
            FacultyCourseAssignment.objects.get_or_create(
                faculty_id=session.faculty_id,
                offering_id=offering.id,
                defaults={"assigned_date": session.session_date, "is_active": True},
            )
        session.offering_id = offering.id
        session.save(update_fields=["offering"])


class Migration(migrations.Migration):
    dependencies = [
        ("attendance", "0001_initial"),
        ("academics", "0004_course_offering_and_course_hours"),
        ("faculty", "0004_assignment_to_course_offering"),
    ]

    operations = [
        migrations.AddField(
            model_name="attendancesession",
            name="offering",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="attendance_sessions",
                to="academics.courseoffering",
            ),
        ),
        migrations.RunPython(link_legacy_sessions, migrations.RunPython.noop),
    ]
