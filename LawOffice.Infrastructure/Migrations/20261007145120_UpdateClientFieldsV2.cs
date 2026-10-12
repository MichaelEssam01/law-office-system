using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LawOffice.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateClientFieldsV2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CommitmentRating",
                table: "Clients",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CooperationRating",
                table: "Clients",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FirstName",
                table: "Clients",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "FourthName",
                table: "Clients",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "HasPowerOfAttorney",
                table: "Clients",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "HomeLandline",
                table: "Clients",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Instructions",
                table: "Clients",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Job",
                table: "Clients",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "NetworkRating",
                table: "Clients",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OtherRatings",
                table: "Clients",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PoaCapacityDetails",
                table: "Clients",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PoaLetter",
                table: "Clients",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PoaNumber",
                table: "Clients",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PoaOffice",
                table: "Clients",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PoaType",
                table: "Clients",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PoaYear",
                table: "Clients",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RelativesInfo",
                table: "Clients",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SecondName",
                table: "Clients",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "SolvencyRating",
                table: "Clients",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ThirdName",
                table: "Clients",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "WorkLandline",
                table: "Clients",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CommitmentRating",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "CooperationRating",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "FirstName",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "FourthName",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "HasPowerOfAttorney",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "HomeLandline",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "Instructions",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "Job",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "NetworkRating",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "OtherRatings",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "PoaCapacityDetails",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "PoaLetter",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "PoaNumber",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "PoaOffice",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "PoaType",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "PoaYear",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "RelativesInfo",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "SecondName",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "SolvencyRating",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "ThirdName",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "WorkLandline",
                table: "Clients");
        }
    }
}
