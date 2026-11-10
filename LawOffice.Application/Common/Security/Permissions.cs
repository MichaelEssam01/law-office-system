namespace LawOffice.Application.Common.Security;

public static class Permissions
{
    public static class Cases
    {
        public const string View = "Cases.View";
        public const string ViewAll = "Cases.ViewAll";
        public const string Create = "Cases.Create";
        public const string Update = "Cases.Update";
        public const string Delete = "Cases.Delete";
    }

    public static class Contracts
    {
        public const string View = "Contracts.View";
        public const string Create = "Contracts.Create";
        public const string Update = "Contracts.Update";
        public const string Delete = "Contracts.Delete";
    }

    public static class Registrations
    {
        public const string View = "Registrations.View";
        public const string Create = "Registrations.Create";
        public const string Update = "Registrations.Update";
        public const string Delete = "Registrations.Delete";
    }

    public static class Companies
    {
        public const string View = "Companies.View";
        public const string Create = "Companies.Create";
        public const string Update = "Companies.Update";
        public const string Delete = "Companies.Delete";
    }

    public static class Sessions
    {
        public const string View = "Sessions.View";
        public const string Create = "Sessions.Create";
        public const string Update = "Sessions.Update";
        public const string Delete = "Sessions.Delete";
    }

    public static class Clients
    {
        public const string View = "Clients.View";
        public const string Create = "Clients.Create";
        public const string Update = "Clients.Update";
        public const string Delete = "Clients.Delete";
    }

    public static class Users
    {
        public const string View = "Users.View";
        public const string Create = "Users.Create";
        public const string Update = "Users.Update";
        public const string Delete = "Users.Delete";
    }

    public static class Finance
    {
        public const string View = "Finance.View";
        public const string Manage = "Finance.Manage";
    }

    public static class Documents
    {
        public const string View = "Documents.View";
        public const string Upload = "Documents.Upload";
        public const string Delete = "Documents.Delete";
    }

    public static class Settings
    {
        public const string Manage = "Settings.Manage";
    }
}
