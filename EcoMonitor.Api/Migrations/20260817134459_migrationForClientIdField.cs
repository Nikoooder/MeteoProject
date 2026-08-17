using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EcoMonitor.Api.Migrations
{
    /// <inheritdoc />
    public partial class migrationForClientIdField : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "ClientId",
                table: "Measurements",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "ClientId",
                table: "Locations",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_Measurements_ClientId",
                table: "Measurements",
                column: "ClientId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Locations_ClientId",
                table: "Locations",
                column: "ClientId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Measurements_ClientId",
                table: "Measurements");

            migrationBuilder.DropIndex(
                name: "IX_Locations_ClientId",
                table: "Locations");

            migrationBuilder.DropColumn(
                name: "ClientId",
                table: "Measurements");

            migrationBuilder.DropColumn(
                name: "ClientId",
                table: "Locations");
        }
    }
}
