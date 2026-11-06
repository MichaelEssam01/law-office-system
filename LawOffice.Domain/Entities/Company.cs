using LawOffice.Domain.Common;
using LawOffice.Domain.Enums;

namespace LawOffice.Domain.Entities;

public class Company : BaseEntity
{
    public string CompanyCode { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty; // موضوع
    public CompanyStatus Status { get; set; } = CompanyStatus.Active; // قائمة / منتهية

    // التواريخ (مثل القضايا)
    public DateTime? AgreementDate { get; set; }
    public DateTime StartDate { get; set; } = DateTime.UtcNow;
    public DateTime? FilingDate { get; set; }
    public DateTime? ClosedDate { get; set; }

    // نوع الشركة
    public CompanyType CompanyType { get; set; } = CompanyType.LLC;
    public string? OtherCompanyType { get; set; }

    public string? CompanyNumber { get; set; } // رقم الشركة
    public string? CompanyDuration { get; set; } // مدة الشركة

    // بيانات الجهة (خانة واحدة txt field)
    public string? AuthorityDetails { get; set; }

    // بيانات الملف
    public string? FileNumber { get; set; }
    public int? FileYear { get; set; }
    public string? FileColor { get; set; }

    // الإجراءات والنتيجة
    public string? ContractProcedure { get; set; } // العقد
    public string? RegistryProcedure { get; set; } // السجل
    public string? RegistrationPlace { get; set; } // مكان التسجيل
    public string? SubsequentProcedures { get; set; } // الإجراءات اللاحقة
    public string? TaxNumber { get; set; } // الرقم الضريبي
    public string? ValueAddedTax { get; set; } // القيمة المضافة
    public string? Result { get; set; } // النتيجة
    public string? Notes { get; set; } // ملاحظات

    // الموكل والمحامي
    public Guid ClientId { get; set; }
    public Client Client { get; set; } = null!;

    public Guid? AssignedLawyerId { get; set; }
    public User? AssignedLawyer { get; set; }

    public Guid CreatedBy { get; set; }

    public ICollection<CompanyParty> Parties { get; set; } = new List<CompanyParty>();
}

