using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LawOffice.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSessions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "NextSessionDate",
                table: "Sessions");

            migrationBuilder.RenameColumn(
                name: "SessionDate",
                table: "Sessions",
                newName: "ScheduledAt");

            migrationBuilder.RenameColumn(
                name: "Decision",
                table: "Sessions",
                newName: "Title");

            migrationBuilder.AlterColumn<string>(
                name: "Notes",
                table: "Sessions",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AddColumn<string>(
                name: "CourtName",
                table: "Sessions",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedBy",
                table: "Sessions",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<int>(
                name: "Status",
                table: "Sessions",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CourtName",
                table: "Sessions");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "Sessions");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Sessions");

            migrationBuilder.RenameColumn(
                name: "Title",
                table: "Sessions",
                newName: "Decision");

            migrationBuilder.RenameColumn(
                name: "ScheduledAt",
                table: "Sessions",
                newName: "SessionDate");

            migrationBuilder.AlterColumn<string>(
                name: "Notes",
                table: "Sessions",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "NextSessionDate",
                table: "Sessions",
                type: "datetime2",
                nullable: true);
        }
    }
}
