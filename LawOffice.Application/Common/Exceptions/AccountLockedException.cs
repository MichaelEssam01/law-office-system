namespace LawOffice.Application.Common.Exceptions;

public class AccountLockedException : Exception
{
    public AccountLockedException() : base("Account is locked due to multiple failed attempts.")
    {
    }
}

public class AccountInactiveException : Exception
{
    public AccountInactiveException() : base("Account is inactive.")
    {
    }
}
