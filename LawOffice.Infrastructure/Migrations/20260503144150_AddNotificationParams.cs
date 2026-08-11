using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LawOffice.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddNotificationParams : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ParametersJson",
                table: "Notifications",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ParametersJson",
                table: "Notifications");
        }
    }
}
