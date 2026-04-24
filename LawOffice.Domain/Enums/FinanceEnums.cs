namespace LawOffice.Domain.Enums;

public enum InvoiceStatus
{
    Unpaid = 0,
    PartiallyPaid = 1,
    Paid = 2,
    Overdue = 3,
    Cancelled = 4
}

public enum PaymentMethod
{
    Cash = 0,
    BankTransfer = 1,
    CreditCard = 2,
    Check = 3
}
