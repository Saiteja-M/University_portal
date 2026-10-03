from django.core.management.base import BaseCommand

from apps.accounts.rbac import assign_role_permissions


class Command(BaseCommand):
    help = "Assign available permissions to university RBAC roles."

    def handle(self, *args, **options):
        assigned = assign_role_permissions()

        if assigned:
            self.stdout.write(
                self.style.SUCCESS(
                    f"Processed {len(assigned)} role-permission assignments."
                )
            )