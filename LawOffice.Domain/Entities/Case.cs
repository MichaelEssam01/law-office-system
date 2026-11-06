using LawOffice.Domain.Common;
using LawOffice.Domain.Enums;

namespace LawOffice.Domain.Entities;

public class Case : BaseEntity
{
    // Auto-generated internal tracking code
    public string CaseNumber { get; set; } = string.Empty;

    // الموضوع (previously Description / Title)
    public string Title { get; set; } = string.Empty; // عنوان / موضوع القضية
    public string? Subject { get; set; } // الموضوع التفصيلي
    public string Description { get; set; } = string.Empty; // Keep for backward compat

    // الحالة
    public CaseStatus Status { get; set; } = CaseStatus.InProgress;

    // نوع الحفظ إذا كانت الحالة منتهية (حفظ دائم / حفظ مؤقت / معدم)
    public ArchivingType? ArchivingType { get; set; }

    // التواريخ
    public DateTime? AgreementDate { get; set; } // تاريخ الاتفاق
    public DateTime StartDate { get; set; } = DateTime.UtcNow; // تاريخ البدء
    public DateTime? CourtFilingDate { get; set; } // تاريخ الإيداع في المحكمة
    public DateTime? ClosedDate { get; set; }

    // نوع القضية
    public CaseType? CaseType { get; set; }
    public FamilyCaseSubtype? FamilyCaseSubtype { get; set; } // إذا كانت نوع القضية أسرة (مال / متنوع / حبس / وراثة)

    // بيانات المحكمة
    public string? CourtCaseNumber { get; set; } // رقم القضية في المحكمة
    public YearType? YearType { get; set; } // ميلادي أو قضائي
    public int? Year { get; set; } // السنة (ميلادي أو قضائي حتى 3 أرقام)
    public LitigationDegree? LitigationDegree { get; set; } // درجة التقاضي

    // الملف
    public string? FileNumber { get; set; } // رقم الملف
    public int? FileYear { get; set; } // سنة الملف
    public string? FileColor { get; set; } // لون الملف

    // النتيجة والتاريخ
    public string? JudgmentResult { get; set; } // النتيجة
    public DateTime? JudgmentDate { get; set; } // التاريخ
    public string? Notes { get; set; } // ملاحظات

    // إجراءات القضية (متداولة / معلقة / موقوفة)
    public string? OfficeAction { get; set; }        // مكتب
    public string? CourtAction { get; set; }         // محكمة
    public string? ExternalAction { get; set; }      // جهات خارجية
    public string? OtherAction { get; set; }         // أخرى
    public bool? HasOfficeAction { get; set; }       // تفعيل إجراء مكتب (للحالة معلقة/موقوفة)
    public bool? HasCourtAction { get; set; }        // تفعيل إجراء محكمة (للحالة معلقة/موقوفة)
    public bool? HasExternalAction { get; set; }     // تفعيل إجراء جهات خارجية (للحالة معلقة/موقوفة)
    public bool? HasOtherAction { get; set; }        // تفعيل إجراء أخرى (للحالة معلقة/موقوفة)

    // سبب التعليق / الإيقاف
    public string? SuspensionReason { get; set; }        // سبب التعليق المختار (أتعاب، متأخرة، توكيل، مستندات، أخرى) أو نص سبب الإيقاف
    public string? SuspensionDocumentsText { get; set; } // تفاصيل المستندات
    public string? SuspensionOtherText { get; set; }     // تفاصيل أخرى

    // Legacy ClientId kept for backward compatibility (points to primary client)
    public Guid ClientId { get; set; }
    public Client Client { get; set; } = null!;

    public Guid? AssignedLawyerId { get; set; }
    public User? AssignedLawyer { get; set; }

    // Audit Fields
    public Guid CreatedBy { get; set; }

    // Navigation properties
    public ICollection<CaseParty> Parties { get; set; } = new List<CaseParty>();
    public ICollection<Session> Sessions { get; set; } = new List<Session>();
    public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
    public ICollection<Document> Documents { get; set; } = new List<Document>();
}
