using LawOffice.Domain.Common;
using LawOffice.Domain.Enums;

namespace LawOffice.Domain.Entities;

public class Session : BaseEntity
{
    public Guid CaseId { get; set; }
    public string Title { get; set; } = string.Empty; // عنوان الجلسة
    public DateTime ScheduledAt { get; set; } // التوقيت والتاريخ

    // المحكمة والمكان ورقم الدائرة
    public string CourtName { get; set; } = string.Empty; // المحكمة
    public string? Location { get; set; } // المكان / القاعة / الدور (منفصل عن المحكمة)
    public string? CircuitNumber { get; set; } // رقم الدائرة

    // الجلسة الحالية
    public string? CurrentSessionRole { get; set; } // دور / صفة الجلسة الحالية (مرافعة / خبير / مذكرات...)
    public Guid? AssignedLawyerId { get; set; } // المحامي المسئول الحالي
    public virtual User? AssignedLawyer { get; set; }

    // الجلسة السابقة
    public string? PreviousSessionRole { get; set; } // دور الجلسة السابقة
    public string? PostponementReason { get; set; } // سبب التأجيل
    public Guid? PreviousSessionLawyerId { get; set; } // المحامي المسئول في الجلسة السابقة
    public virtual User? PreviousSessionLawyer { get; set; }

    // الحالة
    public SessionStatus Status { get; set; } = SessionStatus.Scheduled;

    // ما تم في الجلسة
    public string? SessionProceedings { get; set; } // ما تم في الجلسة

    // القرار
    public string? DecisionKey { get; set; } // كود أو مفتاح القرار (مثل: postponed_notice, reserved_judgment, ...)
    public string? DecisionText { get; set; } // نص أو تفاصيل منطوق القرار

    public string? Notes { get; set; }
    public Guid CreatedBy { get; set; }

    // Navigation properties
    public virtual Case? Case { get; set; }
}
