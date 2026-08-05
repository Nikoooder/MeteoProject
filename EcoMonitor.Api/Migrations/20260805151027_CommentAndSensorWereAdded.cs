using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EcoMonitor.Api.Migrations
{
    /// <inheritdoc />
    public partial class CommentAndSensorWereAdded : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Comment",
                table: "Measurements",
                type: "character varying(400)",
                maxLength: 400,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SensorName",
                table: "Measurements",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Comment",
                table: "Measurements");

            migrationBuilder.DropColumn(
                name: "SensorName",
                table: "Measurements");
        }
    }
}
