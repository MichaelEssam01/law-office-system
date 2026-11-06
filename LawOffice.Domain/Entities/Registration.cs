using LawOffice.Domain.Common;
using LawOffice.Domain.Enums;

namespace LawOffice.Domain.Entities;

public class Registration : BaseEntity
{
    public string RegistrationNumber { get; set; } = string.Empty;
    public string AuthorityName { get; set; } = string.Empty; // الجهة

    public RegistrationRequestType RequestType { get; set; } = RegistrationRequestType.InheritanceDeclaration;
    public string? OtherRequestType { get; set; } // أخرى (text field)

    // بيانات الملف
    public string? FileNumber { get; set; }
    public int? FileYear { get; set; }
    public string? FileColor { get; set; }

    // النتيجة (رقم - تاريخ - جهة)
    public string? ResultNumber { get; set; }
    public DateTime? ResultDate { get; set; }
    public string? ResultAuthority { get; set; }

    public string? Notes { get; set; }

    // الموكل والمحامي
    public Guid ClientId { get; set; }
    public Client Client { get; set; } = null!;

    public Guid? AssignedLawyerId { get; set; }
    public User? AssignedLawyer { get; set; }

    public Guid CreatedBy { get; set; }

    public ICollection<RegistrationProcedure> Procedures { get; set; } = new List<RegistrationProcedure>();
}

