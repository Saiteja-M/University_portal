from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework.response import Response
from rest_framework.views import APIView


@extend_schema(
    responses={
        200: OpenApiResponse(
            description="University Portal API is healthy."
        )
    }
)
class HealthCheckView(APIView):
    """
    Basic API health-check endpoint.
    """

    authentication_classes = []
    permission_classes = []

    def get(self, request):
        return Response(
            {
                "status": "ok",
                "service": "university-portal-api",
            }
        )