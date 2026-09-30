from django.contrib.auth.hashers import make_password
from django.db import migrations


def create_demo_users(apps, schema_editor):
    User = apps.get_model("accounts", "User")

    demo_users = [
        {
            "username": "jagveer.chauhan",
            "first_name": "Jagveer",
            "last_name": "Chauhan",
            "role": "submitter",
            "password": "123456",
        },
        {
            "username": "rahul.chauhan",
            "first_name": "Rahul",
            "last_name": "Chauhan",
            "role": "reviewer",
            "password": "123456",
        },
    ]

    for user_data in demo_users:
        User.objects.get_or_create(
            username=user_data["username"],
            defaults={
                "first_name": user_data["first_name"],
                "last_name": user_data["last_name"],
                "role": user_data["role"],
                "password": make_password(user_data["password"]),
                "is_active": True,
            },
        )


def remove_demo_users(apps, schema_editor):
    User = apps.get_model("accounts", "User")

    User.objects.filter(
        username__in=[
            "jagveer.chauhan",
            "rahul.chauhan",
        ]
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(
            create_demo_users,
            remove_demo_users,
        ),
    ]