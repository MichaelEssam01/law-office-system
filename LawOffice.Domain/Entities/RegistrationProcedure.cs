using LawOffice.Domain.Common;
using LawOffice.Domain.Enums;

namespace LawOffice.Domain.Entities;

public class RegistrationProcedure : BaseEntity
{
    public Guid RegistrationId { get; set; }
    public Registration Registration { get; set; } = null!;

    public RegistrationProcedureType ProcedureType { get; set; }
    public DateTime? StartDate { get; set; } // تاريخ البدء
    public string? CompletedWork { get; set; } // ما تم
    public string? Obstacles { get; set; } // المعوقات
    public string? RequiredAction { get; set; } // الإجراء المطلوب

    public Guid? ResponsibleLawyerId { get; set; } // المحامي المسئول
    public User? ResponsibleLawyer { get; set; }

    public string? Notes { get; set; } // ملاحظات
}

