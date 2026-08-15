using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace EcoMonitor.Api.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreateAgain : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Locations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Latitude = table.Column<double>(type: "double precision", nullable: false),
                    Longitude = table.Column<double>(type: "double precision", nullable: false),
                    UserId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Locations", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Username = table.Column<string>(type: "text", nullable: false),
                    Email = table.Column<string>(type: "text", nullable: false),
                    PasswordHash = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Measurements",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CreationDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LocationId = table.Column<int>(type: "integer", nullable: false),
                    CreatorId = table.Column<int>(type: "integer", nullable: false),
                    Comment = table.Column<string>(type: "character varying(400)", maxLength: 400, nullable: false),
                    SensorName = table.Column<string>(type: "text", nullable: false),
                    O2 = table.Column<double>(type: "double precision", nullable: true),
                    CO = table.Column<double>(type: "double precision", nullable: true),
                    SO2 = table.Column<double>(type: "double precision", nullable: true),
                    NO = table.Column<double>(type: "double precision", nullable: true),
                    CH = table.Column<double>(type: "double precision", nullable: true),
                    CO2 = table.Column<double>(type: "double precision", nullable: true),
                    NO2 = table.Column<double>(type: "double precision", nullable: true),
                    H2CO = table.Column<double>(type: "double precision", nullable: true),
                    PM25 = table.Column<double>(type: "double precision", nullable: true),
                    PM10 = table.Column<double>(type: "double precision", nullable: true),
                    TVOC = table.Column<double>(type: "double precision", nullable: true),
                    WindSpeed = table.Column<double>(type: "double precision", nullable: true),
                    WindDirection = table.Column<string>(type: "text", nullable: true),
                    MeasurementTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Humidity = table.Column<double>(type: "double precision", nullable: true),
                    AtmosphericPressure = table.Column<double>(type: "double precision", nullable: true),
                    Precipitation = table.Column<double>(type: "double precision", nullable: true),
                    PrecipitationPerHour = table.Column<double>(type: "double precision", nullable: true),
                    AirTemperature = table.Column<double>(type: "double precision", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Measurements", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Measurements_Locations_LocationId",
                        column: x => x.LocationId,
                        principalTable: "Locations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Measurements_LocationId",
                table: "Measurements",
                column: "LocationId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Measurements");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropTable(
                name: "Locations");
        }
    }
}
