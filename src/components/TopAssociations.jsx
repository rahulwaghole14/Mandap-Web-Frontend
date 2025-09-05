import React from 'react';
import { Building, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const TopAssociations = ({ associations = [] }) => {
  // Debug logging
  console.log('TopAssociations component received associations:', associations);
  console.log('Associations length:', associations.length);
  
  const getGrowthIcon = (growth) => {
    if (growth > 0) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else if (growth < 0) {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    } else {
      return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const getGrowthColor = (growth) => {
    if (growth > 0) {
      return 'text-green-600';
    } else if (growth < 0) {
      return 'text-red-600';
    } else {
      return 'text-gray-600';
    }
  };

  const formatGrowth = (growth) => {
    if (growth > 0) {
      return `+${growth.toFixed(1)}%`;
    } else if (growth < 0) {
      return `${growth.toFixed(1)}%`;
    } else {
      return '0%';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Top Associations</h3>
          <p className="text-sm text-gray-600">Growth comparison with last year</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">{associations.length}</div>
          <div className="text-sm text-gray-600">Total</div>
        </div>
      </div>

      {associations.length === 0 ? (
        <div className="text-center py-12">
          <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No associations found</p>
        </div>
      ) : (
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Association Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Members
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Growth
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {associations.map((association, index) => (
                <tr key={association.id || index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <Building className="h-4 w-4 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {association.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {association.district}, {association.state}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {association.memberCount || 0}
                    </div>
                    <div className="text-sm text-gray-500">
                      Current
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getGrowthIcon(association.growthPercentage)}
                      <span className={`ml-2 text-sm font-medium ${getGrowthColor(association.growthPercentage)}`}>
                        {formatGrowth(association.growthPercentage)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      vs last year
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary stats */}
      {associations.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {associations.filter(a => a.growthPercentage > 0).length}
              </div>
              <div className="text-sm text-gray-600">Growing</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {associations.filter(a => a.growthPercentage < 0).length}
              </div>
              <div className="text-sm text-gray-600">Declining</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {associations.filter(a => a.growthPercentage === 0).length}
              </div>
              <div className="text-sm text-gray-600">Stable</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopAssociations;


