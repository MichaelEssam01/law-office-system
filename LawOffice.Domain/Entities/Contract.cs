using LawOffice.Domain.Common;
using LawOffice.Domain.Enums;

namespace LawOffice.Domain.Entities;

public class Contract : BaseEntity
{
    public string ContractNumber { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty; // موضوع العقد
    public ContractStatus Status { get; set; } = ContractStatus.InDrafting;

    // التواريخ
    public DateTime? AgreementDate { get; set; } // تاريخ الاتفاق
    public DateTime StartDate { get; set; } = DateTime.UtcNow; // تاريخ البدء
    public DateTime? ClosedDate { get; set; } // تاريخ الانتهاء

    // نوع العقد
    public ContractType ContractType { get; set; } = ContractType.Rent;
    public string? OtherContractType { get; set; } // تفاصيل أخرى

    // بيانات الملف
    public string? FileNumber { get; set; }
    public int? FileYear { get; set; }
    public string? FileColor { get; set; }

    public string? Notes { get; set; }

    // الموكل والمحامي
    public Guid ClientId { get; set; }
    public Client Client { get; set; } = null!;

    public Guid? AssignedLawyerId { get; set; }
    public User? AssignedLawyer { get; set; }

    public Guid CreatedBy { get; set; }

    public ICollection<ContractParty> Parties { get; set; } = new List<ContractParty>();
}

