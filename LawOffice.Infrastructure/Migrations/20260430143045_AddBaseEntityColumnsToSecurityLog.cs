using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LawOffice.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddBaseEntityColumnsToSecurityLog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "UserSecurityLogs",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "UserSecurityLogs",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "UserSecurityLogs",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "UserNotificationSettings",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "UserNotificationSettings",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "UserNotificationSettings",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "UserSecurityLogs");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "UserSecurityLogs");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "UserSecurityLogs");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "UserNotificationSettings");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "UserNotificationSettings");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "UserNotificationSettings");
        }
    }
}
