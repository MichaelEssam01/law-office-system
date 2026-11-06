namespace LawOffice.Domain.Enums;

public enum SessionStatus
{
    Scheduled = 0,             // مجدولة
    Completed = 1,             // منتهية
    Postponed = 2,             // مؤجلة
    Cancelled = 3,             // ملغاة
    ReservedForJudgment = 4    // محجوزة للحكم
}
