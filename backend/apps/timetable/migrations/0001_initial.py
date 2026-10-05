from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True
    dependencies = [
        ("academics", "0004_course_offering_and_course_hours"),
        ("faculty", "0004_assignment_to_course_offering"),
    ]
    operations = [
        migrations.CreateModel(
            name="TimetableSlot",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("day_of_week", models.PositiveSmallIntegerField(choices=[(1,"Monday"),(2,"Tuesday"),(3,"Wednesday"),(4,"Thursday"),(5,"Friday"),(6,"Saturday"),(7,"Sunday")])),
                ("period", models.PositiveSmallIntegerField()),
                ("start_time", models.TimeField()),
                ("end_time", models.TimeField()),
                ("room", models.CharField(max_length=100)),
                ("building", models.CharField(blank=True, max_length=100)),
                ("is_active", models.BooleanField(default=True)),
                ("faculty", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="timetable_slots", to="faculty.faculty")),
                ("offering", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="timetable_slots", to="academics.courseoffering")),
            ],
            options={"ordering":["day_of_week","period","start_time"]},
        ),
        migrations.AddConstraint(
            model_name="timetableSlot".lower(),
            constraint=models.UniqueConstraint(fields=("offering","day_of_week","period"), name="unique_offering_timetable_period"),
        ),
        migrations.AddConstraint(
            model_name="timetableSlot".lower(),
            constraint=models.UniqueConstraint(fields=("room","day_of_week","period"), name="unique_room_timetable_period"),
        ),
        migrations.AddIndex(model_name="timetableSlot".lower(), index=models.Index(fields=["faculty","day_of_week","period"], name="tt_faculty_day_period_idx")),
        migrations.AddIndex(model_name="timetableSlot".lower(), index=models.Index(fields=["day_of_week","period"], name="tt_day_period_idx")),
    ]
