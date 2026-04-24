using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LawOffice.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCaseLogic : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Cases_AspNetUsers_LawyerId",
                table: "Cases");

            migrationBuilder.DropIndex(
                name: "IX_Cases_LawyerId",
                table: "Cases");

            migrationBuilder.RenameColumn(
                name: "LawyerId",
                table: "Cases",
                newName: "CreatedBy");

            migrationBuilder.RenameColumn(
                name: "CourtName",
                table: "Cases",
                newName: "Description");

            migrationBuilder.AlterColumn<string>(
                name: "CaseNumber",
                table: "Cases",
                type: "nvarchar(450)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AddColumn<Guid>(
                name: "AssignedLawyerId",
                table: "Cases",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<DateTime>(
                name: "ClosedDate",
                table: "Cases",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Notes",
                table: "Cases",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "StartDate",
                table: "Cases",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.CreateIndex(
                name: "IX_Cases_AssignedLawyerId",
                table: "Cases",
                column: "AssignedLawyerId");

            migrationBuilder.CreateIndex(
                name: "IX_Cases_CaseNumber",
                table: "Cases",
                column: "CaseNumber",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Cases_AspNetUsers_AssignedLawyerId",
                table: "Cases",
                column: "AssignedLawyerId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Cases_AspNetUsers_AssignedLawyerId",
                table: "Cases");

            migrationBuilder.DropIndex(
                name: "IX_Cases_AssignedLawyerId",
                table: "Cases");

            migrationBuilder.DropIndex(
                name: "IX_Cases_CaseNumber",
                table: "Cases");

            migrationBuilder.DropColumn(
                name: "AssignedLawyerId",
                table: "Cases");

            migrationBuilder.DropColumn(
                name: "ClosedDate",
                table: "Cases");

            migrationBuilder.DropColumn(
                name: "Notes",
                table: "Cases");

            migrationBuilder.DropColumn(
                name: "StartDate",
                table: "Cases");

            migrationBuilder.RenameColumn(
                name: "Description",
                table: "Cases",
                newName: "CourtName");

            migrationBuilder.RenameColumn(
                name: "CreatedBy",
                table: "Cases",
                newName: "LawyerId");

            migrationBuilder.AlterColumn<string>(
                name: "CaseNumber",
                table: "Cases",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)");

            migrationBuilder.CreateIndex(
                name: "IX_Cases_LawyerId",
                table: "Cases",
                column: "LawyerId");

            migrationBuilder.AddForeignKey(
                name: "FK_Cases_AspNetUsers_LawyerId",
                table: "Cases",
                column: "LawyerId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
