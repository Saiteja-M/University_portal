from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("examinations", "0002_result_course_offering"),
    ]

    operations = [
        migrations.RemoveConstraint(
            model_name="studentresult",
            name="unique_student_exam_course_result",
        ),
        migrations.RemoveField(
            model_name="studentresult",
            name="course",
        ),
        migrations.AlterField(
            model_name="studentresult",
            name="course_offering",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                related_name="exam_results",
                to="academics.courseoffering",
            ),
        ),
        migrations.AddConstraint(
            model_name="studentresult",
            constraint=models.UniqueConstraint(
                fields=("student", "exam", "course_offering"),
                name="unique_student_exam_offering_result",
            ),
        ),
        migrations.AddIndex(
            model_name="studentresult",
            index=models.Index(
                fields=("exam", "course_offering"),
                name="examinations_exam_offe_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="studentresult",
            index=models.Index(
                fields=("student", "exam"),
                name="examinations_student_exam_idx",
            ),
        ),
    ]
