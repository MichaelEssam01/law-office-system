using LawOffice.Domain.Common;

namespace LawOffice.Domain.Entities;

public class Client : BaseEntity
{
    // Name Breakdown
    public string FirstName { get; set; } = string.Empty;
    public string SecondName { get; set; } = string.Empty;
    public string ThirdName { get; set; } = string.Empty;
    public string FourthName { get; set; } = string.Empty;

    public string FullName
    {
        get => $"{FirstName} {SecondName} {ThirdName} {FourthName}".Trim();
        set
        {
            if (string.IsNullOrWhiteSpace(value)) return;
            var parts = value.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length > 0) FirstName = parts[0];
            if (parts.Length > 1) SecondName = parts[1];
            if (parts.Length > 2) ThirdName = parts[2];
            if (parts.Length > 3) FourthName = string.Join(" ", parts.Skip(3));
        }
    }

    public string Phone { get; set; } = string.Empty; // Primary / Mobile numbers
    public string? HomeLandline { get; set; }
    public string? WorkLandline { get; set; }

    public string Email { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string NationalId { get; set; } = string.Empty;
    public string? Job { get; set; }

    // Internal Ratings
    public int? SolvencyRating { get; set; } // تقييم الملاءة
    public int? CommitmentRating { get; set; } // تقييم الالتزام
    public int? CooperationRating { get; set; } // تقييم حسن التعامل
    public int? NetworkRating { get; set; } // شبكة الموكلين
    public string? OtherRatings { get; set; } // تقييمات أخرى

    // Relatives
    public string? RelativesInfo { get; set; }

    // Power of Attorney (التوكيل)
    public bool HasPowerOfAttorney { get; set; }
    public string? PoaNumber { get; set; } // رقم التوكيل
    public string? PoaLetter { get; set; } // حرف التوكيل
    public int? PoaYear { get; set; } // سنة التوكيل
    public string? PoaOffice { get; set; } // مكتب توثيق
    public string? PoaType { get; set; } // أصدار (نفسه - صفة - نفسه وصفة)
    public string? PoaCapacityDetails { get; set; } // تفاصيل الصفة

    // Instructions
    public string? Instructions { get; set; }

    public ICollection<Case> Cases { get; set; } = new List<Case>();
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
}
