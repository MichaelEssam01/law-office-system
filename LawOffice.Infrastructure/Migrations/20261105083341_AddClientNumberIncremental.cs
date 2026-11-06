using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LawOffice.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddClientNumberIncremental : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ClientNumber",
                table: "Clients",
                type: "int",
                nullable: false,
                defaultValue: 0)
                .Annotation("SqlServer:Identity", "1, 1");

            migrationBuilder.CreateIndex(
                name: "IX_Clients_ClientNumber",
                table: "Clients",
                column: "ClientNumber",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Clients_ClientNumber",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "ClientNumber",
                table: "Clients");
        }
    }
}
