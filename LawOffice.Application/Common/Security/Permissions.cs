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
