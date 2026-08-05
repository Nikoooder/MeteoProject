using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EcoMonitor.Api.Migrations
{
    /// <inheritdoc />
    public partial class NewFieldsInMeasurementWereAdded : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "SO",
                table: "Measurements",
                newName: "WindSpeed");

            migrationBuilder.RenameColumn(
                name: "CO",
                table: "Measurements",
                newName: "WindDirectionDegrees");

            migrationBuilder.AlterColumn<DateTimeOffset>(
                name: "CreationDate",
                table: "Measurements",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddColumn<double>(
                name: "AirTemperature",
                table: "Measurements",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "AtmosphericPressure",
                table: "Measurements",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "CH",
                table: "Measurements",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "CO2",
                table: "Measurements",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "H2CO",
                table: "Measurements",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "HumidityPercentage",
                table: "Measurements",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "O2",
                table: "Measurements",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "Precipitation",
                table: "Measurements",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "SO2",
                table: "Measurements",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Sensor",
                table: "Measurements",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<double>(
                name: "TVOC",
                table: "Measurements",
                type: "double precision",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AirTemperature",
                table: "Measurements");

            migrationBuilder.DropColumn(
                name: "AtmosphericPressure",
                table: "Measurements");

            migrationBuilder.DropColumn(
                name: "CH",
                table: "Measurements");

            migrationBuilder.DropColumn(
                name: "CO2",
                table: "Measurements");

            migrationBuilder.DropColumn(
                name: "H2CO",
                table: "Measurements");

            migrationBuilder.DropColumn(
                name: "HumidityPercentage",
                table: "Measurements");

            migrationBuilder.DropColumn(
                name: "O2",
                table: "Measurements");

            migrationBuilder.DropColumn(
                name: "Precipitation",
                table: "Measurements");

            migrationBuilder.DropColumn(
                name: "SO2",
                table: "Measurements");

            migrationBuilder.DropColumn(
                name: "Sensor",
                table: "Measurements");

            migrationBuilder.DropColumn(
                name: "TVOC",
                table: "Measurements");

            migrationBuilder.RenameColumn(
                name: "WindSpeed",
                table: "Measurements",
                newName: "SO");

            migrationBuilder.RenameColumn(
                name: "WindDirectionDegrees",
                table: "Measurements",
                newName: "CO");

            migrationBuilder.AlterColumn<string>(
                name: "CreationDate",
                table: "Measurements",
                type: "text",
                nullable: false,
                oldClrType: typeof(DateTimeOffset),
                oldType: "timestamp with time zone");
        }
    }
}
