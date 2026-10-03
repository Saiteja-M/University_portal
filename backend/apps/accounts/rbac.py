from django.contrib.auth.models import Group, Permission


ROLE_PERMISSIONS = {
    "ADMIN": [
        "accounts.view_userprofile",
        "accounts.add_userprofile",
        "accounts.change_userprofile",
        "accounts.delete_userprofile",
    ],
    "HOD": [
        "accounts.view_userprofile",
        "accounts.change_userprofile",
    ],
    "FACULTY": [
        "accounts.view_userprofile",
    ],
    "STUDENT": [
        "accounts.view_userprofile",
    ],
}


def assign_role_permissions():
    """
    Assign currently available permissions to the initial
    university roles.
    """

    assigned = []

    for role_name, permission_names in ROLE_PERMISSIONS.items():
        group = Group.objects.get(name=role_name)

        for permission_name in permission_names:
            app_label, codename = permission_name.split(".", 1)

            permission = Permission.objects.get(
                content_type__app_label=app_label,
                codename=codename,
            )

            group.permissions.add(permission)

            assigned.append(
                f"{role_name}: {permission_name}"
            )

    return assigned