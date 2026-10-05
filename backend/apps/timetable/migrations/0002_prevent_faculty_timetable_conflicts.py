from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("timetable", "0001_initial"),
    ]

    operations = [
        migrations.AddConstraint(
            model_name="timetableslot",
            constraint=models.UniqueConstraint(
                fields=("faculty", "day_of_week", "period"),
                name="unique_faculty_timetable_period",
            ),
        ),
    ]
