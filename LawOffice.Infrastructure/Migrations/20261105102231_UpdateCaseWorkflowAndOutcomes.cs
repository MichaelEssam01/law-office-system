using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LawOffice.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateCaseWorkflowAndOutcomes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<Guid>(
                name: "AssignedLawyerId",
                table: "Cases",
                type: "uniqueidentifier",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier");

            migrationBuilder.AddColumn<string>(
                name: "CourtAction",
                table: "Cases",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ExternalAction",
                table: "Cases",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "HasCourtAction",
                table: "Cases",
                type: "bit",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "HasExternalAction",
                table: "Cases",
                type: "bit",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "HasOfficeAction",
                table: "Cases",
                type: "bit",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "HasOtherAction",
                table: "Cases",
                type: "bit",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OfficeAction",
                table: "Cases",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OtherAction",
                table: "Cases",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SuspensionDocumentsText",
                table: "Cases",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SuspensionOtherText",
                table: "Cases",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SuspensionReason",
                table: "Cases",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OpponentLawyerName",
                table: "CaseParties",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CourtAction",
                table: "Cases");

            migrationBuilder.DropColumn(
                name: "ExternalAction",
                table: "Cases");

            migrationBuilder.DropColumn(
                name: "HasCourtAction",
                table: "Cases");

            migrationBuilder.DropColumn(
                name: "HasExternalAction",
                table: "Cases");

            migrationBuilder.DropColumn(
                name: "HasOfficeAction",
                table: "Cases");

            migrationBuilder.DropColumn(
                name: "HasOtherAction",
                table: "Cases");

            migrationBuilder.DropColumn(
                name: "OfficeAction",
                table: "Cases");

            migrationBuilder.DropColumn(
                name: "OtherAction",
                table: "Cases");

            migrationBuilder.DropColumn(
                name: "SuspensionDocumentsText",
                table: "Cases");

            migrationBuilder.DropColumn(
                name: "SuspensionOtherText",
                table: "Cases");

            migrationBuilder.DropColumn(
                name: "SuspensionReason",
                table: "Cases");

            migrationBuilder.DropColumn(
                name: "OpponentLawyerName",
                table: "CaseParties");

            migrationBuilder.AlterColumn<Guid>(
                name: "AssignedLawyerId",
                table: "Cases",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier",
                oldNullable: true);
        }
    }
}
