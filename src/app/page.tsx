"use client";

import { useCallback, useEffect, useState } from "react";
import { Fan, Thermometer, Droplets, Wind, RefreshCw, Zap } from "lucide-react";
import type { SensorReading, House } from "@/lib/types";
import {
  fetchHouses,
  fetchSensorReadings,
  toggleFan,
  toggleHeater,
} from "@/lib/api";

function ControlToggle({
  on,
  disabled,
  onClick,
}: {
  on: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={onClick}
      className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      } ${on ? "bg-green-500" : "bg-gray-300"}`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ${
          on ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export default function ControlsPage() {
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [houses, setHouses] = useState<House[]>([]);
  const [selectedHouse, setSelectedHouse] = useState<string>("");
  const [time, setTime] = useState(new Date());
  const [togglingFan, setTogglingFan] = useState(false);
  const [togglingHeater, setTogglingHeater] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const loadData = useCallback(() => {
    fetchHouses()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setHouses(data);
          if (!selectedHouse) setSelectedHouse(data[0].id);
        }
      })
      .catch(() => {});

    if (!selectedHouse) return;
    const params = new URLSearchParams({
      filter: "daily",
      house_id: selectedHouse,
    });
    fetchSensorReadings(params)
      .then((data) => {
        if (Array.isArray(data)) setReadings(data);
      })
      .catch(() => {});
  }, [selectedHouse]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const latest = readings.length > 0 ? readings[readings.length - 1] : null;
  const tempHistory = readings.map((r) => r.temperature);
  const avgTemp = tempHistory.length
    ? (tempHistory.reduce((a, b) => a + b, 0) / tempHistory.length).toFixed(1)
    : "0.0";

  // ==========================================
  // Control Logic (mirrors Arduino behavior)
  // ==========================================
  const temp = latest?.temperature ?? 0;
  const manualHeaterOn = latest?.heater_status ?? false;
  const manualFanOn = latest?.fan_status ?? false;

  // Heater: auto OFF at >=34°C, auto ON at <30°C, manual in between
  const heaterAutoOff = temp >= 34;
  const heaterAutoOn = temp < 30;
  const effectiveHeater = heaterAutoOn
    ? true
    : heaterAutoOff
      ? false
      : manualHeaterOn;

  // Fan: auto ON at >34°C, manual otherwise
  const fanAutoOn = temp > 34;
  const effectiveFan = fanAutoOn ? true : manualFanOn;

  const handleFanCommand = async (turnOn: boolean) => {
    if (togglingFan || fanAutoOn) return;
    if (turnOn === manualFanOn) return;
    setTogglingFan(true);
    try {
      await toggleFan();
      loadData();
    } catch {}
    setTogglingFan(false);
  };

  const handleHeaterCommand = async (turnOn: boolean) => {
    if (togglingHeater || heaterAutoOff || heaterAutoOn) return;
    if (turnOn === manualHeaterOn) return;
    setTogglingHeater(true);
    try {
      await toggleHeater();
      loadData();
    } catch {}
    setTogglingHeater(false);
  };

  const cards = [
    {
      label: "Temperature",
      value: temp,
      unit: "°C",
      icon: Thermometer,
      color:
        temp > 34
          ? "text-red-500"
          : temp < 30
            ? "text-blue-500"
            : "text-green-500",
      bg: temp > 34 ? "bg-red-50" : temp < 30 ? "bg-blue-50" : "bg-green-50",
    },
    {
      label: "Humidity",
      value: latest?.humidity ?? 0,
      unit: "%",
      icon: Droplets,
      color: "text-cyan-500",
      bg: "bg-cyan-50",
    },
    {
      label: "Air Quality",
      value: latest?.air_quality ?? 0,
      unit: "PPM",
      icon: Wind,
      color:
        latest && latest.air_quality > 400
          ? "text-orange-500"
          : "text-green-500",
      bg: latest && latest.air_quality > 400 ? "bg-orange-50" : "bg-green-50",
    },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Controls Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {time.toLocaleDateString()} {time.toLocaleTimeString()} &middot;{" "}
            {readings.length} readings today
          </p>
        </div>
        <div className="flex items-center gap-2">
          {houses.length > 1 && (
            <select
              value={selectedHouse}
              onChange={(e) => setSelectedHouse(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm bg-white"
            >
              {houses.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Sensor Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`rounded-xl ${card.bg} p-6 border border-gray-200 shadow-sm`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-600">
                  {card.label}
                </span>
                <Icon className={card.color} size={24} />
              </div>
              <p className={`text-3xl font-bold ${card.color}`}>
                {card.value}
                <span className="text-lg font-normal text-gray-400 ml-1">
                  {card.unit}
                </span>
              </p>
              {card.label === "Temperature" && (
                <p className="text-xs text-gray-400 mt-1">
                  Avg: {avgTemp}°C today &middot;
                  {temp > 34 ? " Critical" : temp < 30 ? " Low" : " Normal"}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Control Cards: Fan + Heater side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ────────────── FAN CARD ────────────── */}
        <div
          className={`rounded-xl border p-6 shadow-sm ${
            effectiveFan
              ? "bg-green-50 border-green-200"
              : "bg-white border-gray-200"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-600">
              Fan Control
            </span>
            <Fan
              className={effectiveFan ? "text-green-500" : "text-gray-400"}
              size={28}
            />
          </div>

          <div className="flex items-center gap-3 mb-3">
            <span
              className={`text-2xl font-bold ${effectiveFan ? "text-green-600" : "text-gray-500"}`}
            >
              {effectiveFan ? "RUNNING" : "OFF"}
            </span>
            {fanAutoOn && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                AUTO
              </span>
            )}
          </div>

          <p className="text-xs mb-4 text-gray-400">
            {fanAutoOn
              ? `Temperature ${temp}°C > 34°C — fan auto-activated`
              : `Manual control — fan will auto-activate above 34°C`}
          </p>

          <div className="flex items-center gap-3 mb-3">
            <ControlToggle
              on={effectiveFan}
              disabled={fanAutoOn || togglingFan}
              onClick={() => handleFanCommand(!manualFanOn)}
            />
            <span className="text-sm font-medium text-gray-500">
              {fanAutoOn ? "Auto ON" : manualFanOn ? "ON" : "OFF"}
            </span>
          </div>

          {fanAutoOn && (
            <p className="text-xs text-red-500 font-medium">
              Auto-override active — manual control locked while temperature
              exceeds 34°C
            </p>
          )}
        </div>

        {/* ────────────── HEATER CARD ────────────── */}
        <div
          className={`rounded-xl border p-6 shadow-sm ${
            effectiveHeater
              ? "bg-red-50 border-red-200"
              : "bg-white border-gray-200"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-600">
              Heater Control
            </span>
            <Zap
              className={effectiveHeater ? "text-red-500" : "text-gray-400"}
              size={28}
            />
          </div>

          <div className="flex items-center gap-3 mb-3">
            <span
              className={`text-2xl font-bold ${effectiveHeater ? "text-red-600" : "text-gray-500"}`}
            >
              {effectiveHeater ? "ACTIVE" : "OFF"}
            </span>
            {(heaterAutoOn || heaterAutoOff) && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                AUTO
              </span>
            )}
          </div>

          <p className="text-xs mb-4 text-gray-400">
            {heaterAutoOff
              ? `Temperature ${temp}°C ≥ 34°C — heater auto-forced OFF`
              : heaterAutoOn
                ? `Temperature ${temp}°C < 30°C — heater auto-forced ON`
                : `Manual control — heater auto ON <30°C, auto OFF ≥34°C`}
          </p>

          <div className="flex items-center gap-3 mb-3">
            <ControlToggle
              on={effectiveHeater}
              disabled={heaterAutoOn || heaterAutoOff || togglingHeater}
              onClick={() => handleHeaterCommand(!manualHeaterOn)}
            />
            <span className="text-sm font-medium text-gray-500">
              {heaterAutoOn
                ? "Auto ON"
                : heaterAutoOff
                  ? "Auto OFF"
                  : manualHeaterOn
                    ? "ON"
                    : "OFF"}
            </span>
          </div>

          {(heaterAutoOn || heaterAutoOff) && (
            <p className="text-xs text-red-500 font-medium">
              {heaterAutoOn
                ? "Auto-override active — heater forced ON below 30°C"
                : "Auto-override active — heater forced OFF at or above 34°C"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
