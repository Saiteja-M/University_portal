

from django.db import models


class TimeStampedModel(models.Model):
    """
    Abstract base model that provides creation and
    modification timestamps to reusable domain models.
    """

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True