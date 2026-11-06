using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LawOffice.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateCaseFieldsV2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "AgreementDate",
                table: "Cases",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ArchivingType",
                table: "Cases",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CaseType",
                table: "Cases",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CourtCaseNumber",
                table: "Cases",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CourtFilingDate",
                table: "Cases",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "FamilyCaseSubtype",
                table: "Cases",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FileColor",
                table: "Cases",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FileNumber",
                table: "Cases",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "FileYear",
                table: "Cases",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "JudgmentDate",
                table: "Cases",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "JudgmentResult",
                table: "Cases",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "LitigationDegree",
                table: "Cases",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Subject",
                table: "Cases",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Year",
                table: "Cases",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "YearType",
                table: "Cases",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "CaseParties",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CaseId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PartyType = table.Column<int>(type: "int", nullable: false),
                    ClientId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Capacity = table.Column<int>(type: "int", nullable: false),
                    DisputeNature = table.Column<int>(type: "int", nullable: false),
                    HasSameCapacityOthers = table.Column<bool>(type: "bit", nullable: false),
                    OtherPersonName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    OtherLawyerName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CaseParties", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CaseParties_Cases_CaseId",
                        column: x => x.CaseId,
                        principalTable: "Cases",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CaseParties_Clients_ClientId",
                        column: x => x.ClientId,
                        principalTable: "Clients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CaseParties_CaseId",
                table: "CaseParties",
                column: "CaseId");

            migrationBuilder.CreateIndex(
                name: "IX_CaseParties_ClientId",
                table: "CaseParties",
                column: "ClientId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CaseParties");

            migrationBuilder.DropColumn(
                name: "AgreementDate",
                table: "Cases");

            migrationBuilder.DropColumn(
                name: "ArchivingType",
                table: "Cases");

            migrationBuilder.DropColumn(
                name: "CaseType",
                table: "Cases");

            migrationBuilder.DropColumn(
                name: "CourtCaseNumber",
                table: "Cases");

            migrationBuilder.DropColumn(
                name: "CourtFilingDate",
                table: "Cases");

            migrationBuilder.DropColumn(
                name: "FamilyCaseSubtype",
                table: "Cases");

            migrationBuilder.DropColumn(
                name: "FileColor",
                table: "Cases");

            migrationBuilder.DropColumn(
                name: "FileNumber",
                table: "Cases");

            migrationBuilder.DropColumn(
                name: "FileYear",
                table: "Cases");

            migrationBuilder.DropColumn(
                name: "JudgmentDate",
                table: "Cases");

            migrationBuilder.DropColumn(
                name: "JudgmentResult",
                table: "Cases");

            migrationBuilder.DropColumn(
                name: "LitigationDegree",
                table: "Cases");

            migrationBuilder.DropColumn(
                name: "Subject",
                table: "Cases");

            migrationBuilder.DropColumn(
                name: "Year",
                table: "Cases");

            migrationBuilder.DropColumn(
                name: "YearType",
                table: "Cases");
        }
    }
}
