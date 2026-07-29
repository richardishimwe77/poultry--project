# Graph Module (Line Chart)

The **Graph** page must display responsive **Line Charts** that visualize historical sensor data collected from the ESP32 in real time.

## Line Charts

Use **Chart.js** (or Recharts if preferred) to implement smooth, responsive line charts.

Create the following charts:

* Temperature History (°C)
* Humidity History (%)
* Air Quality History (PPM)

Each chart should:

* Display real-time updates when new sensor readings are received.
* Retrieve historical data from Supabase.
* Support zooming and tooltips.
* Show smooth animated transitions.
* Be responsive on desktop, tablet, and mobile devices.

## Filters

Allow the administrator to filter sensor readings by:

* Today
* Daily
* Weekly
* Monthly
* Yearly
* Custom Date Range

When a filter changes, the chart should automatically reload data from the database.

Example:

* Daily → Last 24 hours
* Weekly → Last 7 days
* Monthly → Current month
* Yearly → Current year

## Statistics Panel

Above each line chart display summary statistics:

* Current Temperature
* Average Temperature
* Highest Temperature
* Lowest Temperature

Repeat the same for Humidity and Air Quality.

## Chart Features

* Responsive LineChart
* Smooth curves
* Tooltips on hover
* Time displayed on the X-axis
* Sensor value displayed on the Y-axis
* Legend
* Grid lines
* Zoom and Pan
* Export as PNG
* Export as CSV
* Print Chart

## Data Source

The charts must fetch data from the `sensor_readings` table in Supabase.

Each reading contains:

```text
id
temperature
humidity
air_quality
fan_status
created_at
```

The `created_at` field will be used for the X-axis (time), while the sensor values will be plotted on the Y-axis.

## API Endpoints

```http
GET /api/graphs/today
GET /api/graphs/daily
GET /api/graphs/weekly
GET /api/graphs/monthly
GET /api/graphs/yearly
GET /api/graphs/custom?start=YYYY-MM-DD&end=YYYY-MM-DD
```

## Dashboard Navigation

The application will contain only three pages:

* **Controls** – Real-time monitoring cards and fan control.
* **Graph** – Historical Line Charts with filters and statistics.
* **Logs** – System event history and alerts.

## Testing

Create automated tests to verify that:

* Line charts load correctly.
* Daily filter returns only today's readings.
* Weekly filter returns the last 7 days.
* Monthly filter returns the current month.
* Yearly filter returns the current year.
* Custom date range returns the correct records.
* New ESP32 readings update the graph in real time.
* Tooltips display the correct values.
* Export to PNG works correctly.
* Export to CSV generates the correct data.
* Charts resize correctly on desktop, tablet, and mobile devices.
* Missing sensor data is handled gracefully without breaking the chart.
