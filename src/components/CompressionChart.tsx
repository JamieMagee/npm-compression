import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import type { CompressionResult } from "../types";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

interface CompressionChartProps {
  results: CompressionResult[];
  originalGzippedSize: number;
  isUpdating?: boolean;
}

export function CompressionChart({
  results,
  originalGzippedSize,
  isUpdating = false,
}: CompressionChartProps) {
  if (results.length === 0) return null;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Generate colors based on compression method and level
  const generateColors = (results: CompressionResult[]) => {
    const backgroundColors = ["rgba(156, 163, 175, 0.8)"]; // Gray for original
    const borderColors = ["rgba(156, 163, 175, 1)"];

    results.forEach((result) => {
      let color: string;
      let borderColor: string;

      if (result.method === "gzip") {
        // Red to orange spectrum for gzip (levels 1-9)
        const intensity = result.level / 9;
        const red = Math.floor(239 - intensity * 100);
        const green = Math.floor(68 + intensity * 100);
        const blue = Math.floor(68 + intensity * 100);
        color = `rgba(${red}, ${green}, ${blue}, 0.8)`;
        borderColor = `rgba(${red}, ${green}, ${blue}, 1)`;
      } else if (result.method === "brotli") {
        // Blue to purple spectrum for brotli (levels 1-11)
        const intensity = result.level / 11;
        const red = Math.floor(59 + intensity * 180);
        const green = Math.floor(130 - intensity * 80);
        const blue = Math.floor(246 + intensity * 8);
        color = `rgba(${red}, ${green}, ${blue}, 0.8)`;
        borderColor = `rgba(${red}, ${green}, ${blue}, 1)`;
      } else if (result.method === "zstd") {
        // Green to teal spectrum for zstd (levels 1-22)
        const intensity = result.level / 22;
        const red = Math.floor(34 - intensity * 20);
        const green = Math.floor(197 + intensity * 50);
        const blue = Math.floor(94 + intensity * 100);
        color = `rgba(${red}, ${green}, ${blue}, 0.8)`;
        borderColor = `rgba(${red}, ${green}, ${blue}, 1)`;
      } else {
        // Fallback gray
        color = "rgba(156, 163, 175, 0.8)";
        borderColor = "rgba(156, 163, 175, 1)";
      }

      backgroundColors.push(color);
      borderColors.push(borderColor);
    });

    return { backgroundColors, borderColors };
  };

  const { backgroundColors, borderColors } = generateColors(results);

  const data = {
    labels: [
      "Original gzipped",
      ...results.map((r) => `${r.method} ${r.level}`),
    ],
    datasets: [
      {
        label: "File Size",
        data: [originalGzippedSize, ...results.map((r) => r.size)],
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Compression Results by Level",
        font: {
          size: 16,
          weight: "bold" as const,
        },
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const value = context.parsed.y;
            return `${context.dataset.label}: ${formatBytes(value)}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "File Size",
        },
        ticks: {
          callback: function (value: any) {
            return formatBytes(value);
          },
        },
      },
      x: {
        title: {
          display: true,
          text: "Compression Method",
        },
      },
    },
  };

  return (
    <div className="compression-chart">
      {isUpdating && (
        <div className="chart-updating">
          <div className="chart-spinner"></div>
          <span>Chart updating as results come in...</span>
        </div>
      )}
      <Bar data={data} options={options} />
    </div>
  );
}
