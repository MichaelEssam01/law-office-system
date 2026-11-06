using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LawOffice.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateSessionFieldsV2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "AssignedLawyerId",
                table: "Sessions",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CircuitNumber",
                table: "Sessions",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CurrentSessionRole",
                table: "Sessions",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DecisionKey",
                table: "Sessions",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DecisionText",
                table: "Sessions",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Location",
                table: "Sessions",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PostponementReason",
                table: "Sessions",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "PreviousSessionLawyerId",
                table: "Sessions",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PreviousSessionRole",
                table: "Sessions",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SessionProceedings",
                table: "Sessions",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Sessions_AssignedLawyerId",
                table: "Sessions",
                column: "AssignedLawyerId");

            migrationBuilder.CreateIndex(
                name: "IX_Sessions_PreviousSessionLawyerId",
                table: "Sessions",
                column: "PreviousSessionLawyerId");

            migrationBuilder.AddForeignKey(
                name: "FK_Sessions_AspNetUsers_AssignedLawyerId",
                table: "Sessions",
                column: "AssignedLawyerId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Sessions_AspNetUsers_PreviousSessionLawyerId",
                table: "Sessions",
                column: "PreviousSessionLawyerId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Sessions_AspNetUsers_AssignedLawyerId",
                table: "Sessions");

            migrationBuilder.DropForeignKey(
                name: "FK_Sessions_AspNetUsers_PreviousSessionLawyerId",
                table: "Sessions");

            migrationBuilder.DropIndex(
                name: "IX_Sessions_AssignedLawyerId",
                table: "Sessions");

            migrationBuilder.DropIndex(
                name: "IX_Sessions_PreviousSessionLawyerId",
                table: "Sessions");

            migrationBuilder.DropColumn(
                name: "AssignedLawyerId",
                table: "Sessions");

            migrationBuilder.DropColumn(
                name: "CircuitNumber",
                table: "Sessions");

            migrationBuilder.DropColumn(
                name: "CurrentSessionRole",
                table: "Sessions");

            migrationBuilder.DropColumn(
                name: "DecisionKey",
                table: "Sessions");

            migrationBuilder.DropColumn(
                name: "DecisionText",
                table: "Sessions");

            migrationBuilder.DropColumn(
                name: "Location",
                table: "Sessions");

            migrationBuilder.DropColumn(
                name: "PostponementReason",
                table: "Sessions");

            migrationBuilder.DropColumn(
                name: "PreviousSessionLawyerId",
                table: "Sessions");

            migrationBuilder.DropColumn(
                name: "PreviousSessionRole",
                table: "Sessions");

            migrationBuilder.DropColumn(
                name: "SessionProceedings",
                table: "Sessions");
        }
    }
}
