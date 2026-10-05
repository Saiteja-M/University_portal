from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("faculty", "0004_assignment_to_course_offering"),
    ]

    operations = [
        migrations.RemoveConstraint(
            model_name="facultycourseassignment",
            name="unique_faculty_course_assignment",
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
        migrations.AddConstraint(
            model_name="facultycourseassignment",
            constraint=models.UniqueConstraint(
                fields=("faculty", "offering"),
                name="unique_faculty_course_offering_assignment",
            ),
        ),
    ]
