from django.core.management.base import BaseCommand

from apps.accounts.services import create_university_roles


class Command(BaseCommand):
    help = "Create the standard University Portal RBAC roles."

    def handle(self, *args, **options):
        created_roles = create_university_roles()

        if created_roles:
            self.stdout.write(
                self.style.SUCCESS(
                    "Created roles: "
                    + ", ".join(created_roles)
                )
            )
        else:
            self.stdout.write(
                self.style.WARNING(
                    "All university roles already exist."
                )
            )