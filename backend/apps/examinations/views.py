from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Exam, StudentResult
from .permissions import IsAuthenticatedStudent, IsExaminationManager
from .serializers import (
    AdminStudentResultSerializer,
    ExamSerializer,
    StudentResultSerializer,
)


class ExamViewSet(viewsets.ModelViewSet):
    queryset = Exam.objects.select_related(
        "semester", "semester__academic_year", "semester__program"
    ).all()
    serializer_class = ExamSerializer
    permission_classes = [IsExaminationManager]
    filterset_fields = ["exam_type", "semester", "is_published", "is_active"]
    search_fields = ["name"]
    ordering_fields = ["start_date", "end_date", "name"]
    ordering = ["-start_date", "name"]

    @action(detail=True, methods=["post"], url_path="publish")
    def publish(self, request, pk=None):
        exam = self.get_object()
        result_count = StudentResult.objects.filter(exam=exam).count()
        if result_count == 0:
            return Response(
                {"detail": "Cannot publish an examination without at least one student result."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        exam.is_published = True
        exam.save(update_fields=["is_published", "updated_at"])
        return Response(ExamSerializer(exam).data)

    @action(detail=True, methods=["post"], url_path="unpublish")
    def unpublish(self, request, pk=None):
        exam = self.get_object()
        exam.is_published = False
        exam.save(update_fields=["is_published", "updated_at"])
        return Response(ExamSerializer(exam).data)


class AdminStudentResultViewSet(viewsets.ModelViewSet):
    queryset = StudentResult.objects.select_related(
        "student", "student__user", "exam", "exam__semester",
        "exam__semester__academic_year", "course_offering",
        "course_offering__course", "course_offering__semester",
    ).all()
    serializer_class = AdminStudentResultSerializer
    permission_classes = [IsExaminationManager]
    filterset_fields = ["student", "exam", "course_offering", "status"]
    search_fields = [
        "student__student_id", "student__admission_number",
        "student__user__first_name", "student__user__last_name",
        "course_offering__course__code", "course_offering__course__name",
        "course_offering__section", "exam__name",
    ]
    ordering_fields = ["created_at", "marks", "course_offering__course__code"]
    ordering = ["course_offering__course__code"]

    def create(self, request, *args, **kwargs):
        exam_id = request.data.get("exam")
        if exam_id:
            try:
                exam = Exam.objects.get(pk=exam_id)
            except Exam.DoesNotExist:
                return Response({"exam": "The selected examination does not exist."}, status=400)
            if exam.is_published:
                return Response(
                    {"exam": "Results cannot be added to a published examination."}, status=400
                )
        return super().create(request, *args, **kwargs)

    def perform_update(self, serializer):
        if serializer.instance.exam.is_published:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({"exam": "Results cannot be modified while the examination is published."})
        serializer.save()

    def destroy(self, request, *args, **kwargs):
        result = self.get_object()
        if result.exam.is_published:
            return Response(
                {"detail": "Results cannot be deleted while the examination is published."},
                status=400,
            )
        return super().destroy(request, *args, **kwargs)


class MyResultsView(APIView):
    permission_classes = [IsAuthenticatedStudent]

    def get(self, request):
        student = request.user.student
        results = StudentResult.objects.filter(
            student=student, exam__is_published=True
        ).select_related(
            "exam", "course_offering", "course_offering__course"
        )
        serializer = StudentResultSerializer(results, many=True)
        return Response({
            "student_id": student.student_id,
            "count": results.count(),
            "results": serializer.data,
        })


class MyResultsSummaryView(APIView):
    permission_classes = [IsAuthenticatedStudent]

    def get(self, request):
        student = request.user.student
        queryset = StudentResult.objects.select_related(
            "student", "exam", "exam__semester", "exam__semester__academic_year",
            "course_offering", "course_offering__course",
        ).filter(
            student=student,
            exam__is_published=True,
            exam__is_active=True,
            exam__exam_type=Exam.ExamType.SEMESTER,
        ).order_by("exam__semester__number", "course_offering__course__code")

        semesters = {}
        for result in queryset:
            semester = result.exam.semester
            key = semester.id
            if key not in semesters:
                semesters[key] = {
                    "semester": semester.id,
                    "semester_number": semester.number,
                    "academic_year": semester.academic_year_id,
                    "academic_year_name": semester.academic_year.name,
                    "results": [],
                    "total_credits": 0,
                    "weighted_grade_points": 0,
                    "has_complete_grade_points": True,
                }
            data = semesters[key]
            data["results"].append(StudentResultSerializer(result).data)
            credits = result.course_offering.course.credits or 0
            data["total_credits"] += credits
            if result.grade_point is None:
                data["has_complete_grade_points"] = False
            else:
                data["weighted_grade_points"] += float(result.grade_point) * credits

        response_semesters = []
        for data in semesters.values():
            total_credits = data["total_credits"]
            sgpa = (
                round(data["weighted_grade_points"] / total_credits, 2)
                if data["has_complete_grade_points"] and total_credits > 0
                else None
            )
            response_semesters.append({
                "semester": data["semester"],
                "semester_number": data["semester_number"],
                "academic_year": data["academic_year"],
                "academic_year_name": data["academic_year_name"],
                "total_credits": total_credits,
                "sgpa": sgpa,
                "results": data["results"],
            })
        return Response({
            "student_id": student.student_id,
            "semester_count": len(response_semesters),
            "semesters": response_semesters,
        })
