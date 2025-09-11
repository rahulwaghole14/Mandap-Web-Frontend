import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const PerformanceChart = ({ monthlyData = [] }) => {
  // Debug logging
  console.log('PerformanceChart received monthlyData:', monthlyData);
  console.log('PerformanceChart monthlyData type:', typeof monthlyData);
  console.log('PerformanceChart monthlyData length:', monthlyData?.length);
  
  // Prepare data for the chart
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  // Create data array with 0 for months without data
  const chartData = months.map((month, index) => {
    const monthData = monthlyData.find(item => item.month === index + 1);
    return monthData ? monthData.membersJoined : 0;
  });

  const data = {
    labels: months,
    datasets: [
      {
        label: 'Members Joined',
        data: chartData,
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        borderRadius: 4,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            return `Members: ${context.parsed.y}`;
          }
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: 'rgba(0, 0, 0, 0.7)',
          font: {
            size: 12,
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: 'rgba(0, 0, 0, 0.7)',
          font: {
            size: 12,
          },
        },
      },
    },
    elements: {
      bar: {
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        hoverBackgroundColor: 'rgba(59, 130, 246, 1)',
      },
    },
  };

  const totalMembers = chartData.reduce((sum, count) => sum + count, 0);
  const currentMonth = new Date().getMonth();
  const currentMonthMembers = chartData[currentMonth];
  const previousMonthMembers = chartData[currentMonth - 1] || 0;
  
  // Improved growth calculation - compare current month to average of previous months
  let growthPercentage = 0;
  
  if (currentMonth > 0) {
    // Calculate average of all previous months in the year
    const previousMonthsData = chartData.slice(0, currentMonth);
    const previousMonthsTotal = previousMonthsData.reduce((sum, count) => sum + count, 0);
    const previousMonthsAverage = previousMonthsTotal / previousMonthsData.length;
    
    if (previousMonthsAverage > 0) {
      growthPercentage = ((currentMonthMembers - previousMonthsAverage) / previousMonthsAverage * 100).toFixed(1);
    } else if (currentMonthMembers > 0 && previousMonthsAverage === 0) {
      // If previous months average was 0 but current month has members, show 100% growth
      growthPercentage = 100;
    }
  } else {
    // For January (month 0), compare to previous month (December of last year)
    // Since we don't have last year's data, we'll show 0% for now
    growthPercentage = 0;
  }
    
  // Debug logging for calculated values
  console.log('PerformanceChart chartData:', chartData);
  console.log('PerformanceChart totalMembers:', totalMembers);
  console.log('PerformanceChart currentMonth:', currentMonth);
  console.log('PerformanceChart currentMonthMembers:', currentMonthMembers);
  console.log('PerformanceChart previousMonthMembers:', previousMonthMembers);
  console.log('PerformanceChart growthPercentage:', growthPercentage);
  console.log('PerformanceChart growth calculation:', {
    currentMonthMembers,
    previousMonthMembers,
    currentMonth,
    previousMonthsData: currentMonth > 0 ? chartData.slice(0, currentMonth) : [],
    previousMonthsAverage: currentMonth > 0 ? (chartData.slice(0, currentMonth).reduce((sum, count) => sum + count, 0) / chartData.slice(0, currentMonth).length) : 0,
    growthPercentage
  });

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Performance</h3>
          <p className="text-sm text-gray-600">Monthly member growth for {new Date().getFullYear()}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">{totalMembers}</div>
          <div className="text-sm text-gray-600">Total Members</div>
        </div>
      </div>

      {/* Growth indicator */}
      <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
        <div>
          <span className="text-sm text-gray-600">This Month:</span>
          <span className="ml-2 text-lg font-semibold text-gray-900">{currentMonthMembers}</span>
        </div>
        <div className="flex items-center">
          <span className="text-sm text-gray-600 mr-2">Growth:</span>
          <span className={`text-sm font-medium ${
            growthPercentage >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {growthPercentage >= 0 ? '+' : ''}{growthPercentage}%
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64">
        <Bar data={data} options={options} />
      </div>

      {/* Monthly breakdown */}
      <div className="mt-4 grid grid-cols-6 gap-2">
        {months.map((month, index) => (
          <div key={month} className="text-center">
            <div className="text-xs text-gray-500">{month}</div>
            <div className="text-sm font-medium text-gray-900">
              {chartData[index]}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PerformanceChart;


