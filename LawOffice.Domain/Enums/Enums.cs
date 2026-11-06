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

public enum ContractStatus
{
    InDrafting = 1, // جاري الصياغة
    Finished = 2    // منتهي
}

public enum ContractType
{
    Rent = 0,          // إيجار
    Sale = 1,          // بيع
    Gift = 2,          // هبة
    Partnership = 3,   // شركة
    Mortgage = 4,      // رهن
    Contracting = 5,   // مقاولة
    Consultancy = 6,   // استشاري
    Employment = 7,    // عمل
    Marriage = 8,      // زواج
    Exploitation = 9,  // استغلال
    Usufruct = 10,     // حق انتفاع
    Other = 11         // أخرى
}

public enum RegistrationRequestType
{
    InheritanceDeclaration = 0, // إشهار إرث
    BareOwnershipSale = 1,      // بيع رقبة
    UsufructSale = 2,           // بيع منفعة
    FullOwnershipSale = 3,      // بيع رقبة ومنفعة
    Rent = 4,                   // إيجار
    Mortgage = 5,               // رهن
    AmicablePartition = 6,      // قسمة رضائية
    PetitionRegistration = 7,   // إشهار صحيفة
    JudgmentRegistration = 8,   // إشهار حكم
    Other = 9                   // أخرى
}

public enum RegistrationProcedureType
{
    Survey = 0,          // رفع مساحي
    Application = 1,     // طلب
    DraftProject = 2,    // مشروع
    TechnicalReview = 3, // مراجعة فنية
    FinancialReview = 4, // مراجعة مالية
    Publication = 5      // إشهار
}

public enum CompanyStatus
{
    Active = 1,   // قائمة
    Finished = 2  // منتهية
}

public enum CompanyType
{
    GeneralPartnership = 0,         // تضامن
    LimitedPartnership = 1,         // توصية
    PartnershipLimitedByShares = 2, // توصية بالأسهم
    LLC = 3,                        // ذات مسئولية محدودة
    JointStock = 4,                 // مساهمة
    DeFacto = 5,                    // واقع
    Other = 6                       // أخرى
}

