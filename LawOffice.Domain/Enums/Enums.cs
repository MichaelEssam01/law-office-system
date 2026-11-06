namespace LawOffice.Domain.Enums;

public enum UserRole
{
    Admin,
    Lawyer,
    Receptionist,
    Accountant
}

public enum CaseStatus
{
    InProgress = 1,  // متداولة
    Pending = 2,     // معلقة
    Finished = 4,    // منتهية
    Suspended = 5    // موقوفة
}

public enum ArchivingType
{
    Permanent,   // حفظ دائم
    Temporary,   // حفظ مؤقت
    Disposed     // معدم
}

public enum CaseType
{
    Administrative,       // إداري
    Family,               // أسرة
    Economic,             // اقتصادية
    Rents,                // إيجارات
    Constitutional,       // دستورية
    Commercial,           // تجاري
    Compensation,         // تعويضات
    Enforcement,          // تنفيذ
    SignatureValidity,    // صحة توقيع
    Labor,                // عمال
    Civil,                // مدني
    CivilAppealed,        // مدني مستأنف
    Urgent,               // مستعجل
    Criminal,             // جنائي
    Other                 // أخرى
}

public enum FamilyCaseSubtype
{
    Financial,            // مال
    Miscellaneous,        // متنوع
    Imprisonment,         // حبس
    Inheritance           // وراثة
}

public enum YearType
{
    Gregorian,            // ميلادي
    Judicial              // قضائي
}

public enum LitigationDegree
{
    Summary,              // جزئي
    FirstInstance,        // ابتدائي
    AdministrativeCourt,  // إدارية
    StateCouncil,         // قضاء إداري
    Appellate,            // استئناف
    Cassation,            // نقض
    Constitutional,       // دستورية
    Supreme,              // عليا
    Other                 // أخرى
}

public enum PartyCapacity
{
    Plaintiff,                    // مدعي
    Defendant,                    // مدعى عليه
    OffensiveIntervener,          // متدخل هجومي
    AdhesiveIntervener,           // متدخل انضمامي
    JoinedParty,                  // مدخل
    Appellant,                    // مستأنف
    Appellee,                     // مستأنف ضده
    Challenger,                   // طاعن
    Respondent,                   // مطعون ضده
    Victim,                       // مجني عليه
    Accused,                      // متهم
    CivilRightPlaintiff,          // مدعي بالحق المدني
    Other                         // أخرى
}

public enum DisputeNature
{
    Original,                     // أصلي
    Confrontational               // في المواجهة
}

public enum PartyType
{
    Client,                       // عميل
    Opponent                      // خصم
}

public enum PaymentType
{
    Income,
    Expense
}

