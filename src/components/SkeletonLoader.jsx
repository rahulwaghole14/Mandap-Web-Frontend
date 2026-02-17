import React from 'react';

// Skeleton for stat cards
export const StatCardSkeleton = () => (
  <div className="bg-white rounded-lg shadow p-6 animate-pulse">
    <div className="flex items-center">
      <div className="p-3 rounded-full bg-gray-300 h-12 w-12"></div>
      <div className="ml-4 flex-1">
        <div className="h-4 bg-gray-300 rounded w-24 mb-2"></div>
        <div className="h-6 bg-gray-300 rounded w-16 mb-1"></div>
        <div className="h-3 bg-gray-300 rounded w-20"></div>
      </div>
    </div>
  </div>
);

// Skeleton for chart
export const ChartSkeleton = () => (
  <div className="bg-white rounded-lg shadow p-6 animate-pulse">
    <div className="flex items-center justify-between mb-6">
      <div>
        <div className="h-5 bg-gray-300 rounded w-32 mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-48"></div>
      </div>
      <div className="text-right">
        <div className="h-8 bg-gray-300 rounded w-16 mb-1"></div>
        <div className="h-4 bg-gray-300 rounded w-20"></div>
      </div>
    </div>
    
    <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
      <div>
        <div className="h-4 bg-gray-300 rounded w-24 mb-1"></div>
        <div className="h-5 bg-gray-300 rounded w-12"></div>
      </div>
      <div className="flex items-center">
        <div className="h-4 bg-gray-300 rounded w-16 mr-2"></div>
        <div className="h-4 bg-gray-300 rounded w-12"></div>
      </div>
    </div>

    {/* Chart area skeleton */}
    <div className="h-64 bg-gray-100 rounded mb-4"></div>
    
    {/* Monthly breakdown skeleton */}
    <div className="grid grid-cols-6 gap-2">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="text-center">
          <div className="h-3 bg-gray-300 rounded w-8 mx-auto mb-1"></div>
          <div className="h-4 bg-gray-300 rounded w-6 mx-auto"></div>
        </div>
      ))}
    </div>
  </div>
);

// Skeleton for table
export const TableSkeleton = () => (
  <div className="bg-white rounded-lg shadow animate-pulse">
    <div className="px-6 py-4 border-b border-gray-200">
      <div className="h-5 bg-gray-300 rounded w-32"></div>
    </div>
    <div className="p-6">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {Array.from({ length: 6 }).map((_, index) => (
                <th key={index} className="px-6 py-3">
                  <div className="h-4 bg-gray-300 rounded w-20"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Array.from({ length: 5 }).map((_, rowIndex) => (
              <tr key={rowIndex}>
                {Array.from({ length: 6 }).map((_, colIndex) => (
                  <td key={colIndex} className="px-6 py-4">
                    <div className="h-4 bg-gray-300 rounded w-24"></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

// Skeleton for top associations
export const TopAssociationsSkeleton = () => (
  <div className="bg-white rounded-lg shadow p-6 animate-pulse">
    <div className="flex items-center justify-between mb-6">
      <div>
        <div className="h-5 bg-gray-300 rounded w-32 mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-48"></div>
      </div>
      <div className="text-right">
        <div className="h-8 bg-gray-300 rounded w-8 mb-1"></div>
        <div className="h-4 bg-gray-300 rounded w-12"></div>
      </div>
    </div>

    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex items-center space-x-4">
          <div className="h-8 w-8 bg-gray-300 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-300 rounded w-32 mb-1"></div>
            <div className="h-3 bg-gray-300 rounded w-24"></div>
          </div>
          <div className="text-right">
            <div className="h-4 bg-gray-300 rounded w-8 mb-1"></div>
            <div className="h-3 bg-gray-300 rounded w-12"></div>
          </div>
          <div className="text-right">
            <div className="h-4 bg-gray-300 rounded w-12"></div>
            <div className="h-3 bg-gray-300 rounded w-16"></div>
          </div>
        </div>
      ))}
    </div>

    {/* Summary stats skeleton */}
    <div className="mt-6 pt-6 border-t border-gray-200">
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="text-center">
            <div className="h-6 bg-gray-300 rounded w-8 mx-auto mb-1"></div>
            <div className="h-4 bg-gray-300 rounded w-16 mx-auto"></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Generic skeleton for any content
export const GenericSkeleton = ({ width = "w-full", height = "h-4", className = "" }) => (
  <div className={`bg-gray-300 rounded animate-pulse ${width} ${height} ${className}`}></div>
);

// Loading spinner
export const LoadingSpinner = ({ size = "h-8 w-8", className = "" }) => (
  <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-primary-600 ${size} ${className}`}></div>
);

export default {
  StatCardSkeleton,
  ChartSkeleton,
  TableSkeleton,
  TopAssociationsSkeleton,
  GenericSkeleton,
  LoadingSpinner
};
