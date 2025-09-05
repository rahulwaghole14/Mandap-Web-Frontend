import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Building, Users, Calendar, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

const AssociationMap = ({ associations = [] }) => {
  const [selectedAssociation, setSelectedAssociation] = useState(null);
  const [hoveredAssociation, setHoveredAssociation] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const svgRef = useRef(null);

  // Major cities in India with approximate coordinates for the new 300x150 SVG map
  const cityCoordinates = {
    'Mumbai': { x: 120, y: 85, state: 'Maharashtra' },
    'Delhi': { x: 210, y: 55, state: 'Delhi' },
    'Bangalore': { x: 108, y: 114, state: 'Karnataka' },
    'Hyderabad': { x: 132, y: 105, state: 'Telangana' },
    'Chennai': { x: 150, y: 120, state: 'Tamil Nadu' },
    'Kolkata': { x: 252, y: 96, state: 'West Bengal' },
    'Pune': { x: 126, y: 90, state: 'Maharashtra' },
    'Ahmedabad': { x: 108, y: 75, state: 'Gujarat' },
    'Jaipur': { x: 168, y: 66, state: 'Rajasthan' },
    'Lucknow': { x: 228, y: 60, state: 'Uttar Pradesh' },
    'Kanpur': { x: 222, y: 63, state: 'Uttar Pradesh' },
    'Nagpur': { x: 150, y: 84, state: 'Madhya Pradesh' },
    'Indore': { x: 144, y: 75, state: 'Madhya Pradesh' },
    'Thane': { x: 123, y: 85.5, state: 'Maharashtra' },
    'Bhopal': { x: 156, y: 72, state: 'Madhya Pradesh' },
    'Visakhapatnam': { x: 180, y: 111, state: 'Andhra Pradesh' },
    'Patna': { x: 252, y: 75, state: 'Bihar' },
    'Vadodara': { x: 114, y: 78, state: 'Gujarat' },
    'Ghaziabad': { x: 216, y: 55.5, state: 'Haryana' },
    'Ludhiana': { x: 192, y: 54, state: 'Punjab' },
    'Agra': { x: 204, y: 60, state: 'Uttar Pradesh' },
    'Nashik': { x: 129, y: 87, state: 'Maharashtra' },
    'Faridabad': { x: 213, y: 55.5, state: 'Haryana' },
    'Meerut': { x: 210, y: 57, state: 'Uttar Pradesh' },
    'Rajkot': { x: 102, y: 81, state: 'Gujarat' },
    'Kalyan': { x: 124.8, y: 86.4, state: 'Maharashtra' },
    'Vasai': { x: 123.6, y: 85.8, state: 'Maharashtra' },
    'Varanasi': { x: 228, y: 69, state: 'Uttar Pradesh' },
    'Srinagar': { x: 192, y: 36, state: 'Jammu & Kashmir' },
    'Aurangabad': { x: 135, y: 88.5, state: 'Maharashtra' },
    'Navi Mumbai': { x: 121.2, y: 84.6, state: 'Maharashtra' },
    'Solapur': { x: 120, y: 93, state: 'Maharashtra' },
    'Mysore': { x: 114, y: 117, state: 'Karnataka' },
    'Bhubaneswar': { x: 228, y: 105, state: 'Odisha' },
    'Guwahati': { x: 270, y: 84, state: 'Assam' },
    'Chandigarh': { x: 189, y: 52.5, state: 'Chandigarh' },
    'Amritsar': { x: 186, y: 51, state: 'Punjab' },
    'Jodhpur': { x: 150, y: 72, state: 'Rajasthan' },
    'Ranchi': { x: 240, y: 87, state: 'Jharkhand' },
    'Coimbatore': { x: 132, y: 123, state: 'Tamil Nadu' },
    'Kochi': { x: 108, y: 129, state: 'Kerala' },
    'Raipur': { x: 180, y: 90, state: 'Chhattisgarh' },
    'Jabalpur': { x: 162, y: 78, state: 'Madhya Pradesh' },
    'Gwalior': { x: 168, y: 69, state: 'Madhya Pradesh' },
    'Vijayawada': { x: 168, y: 108, state: 'Andhra Pradesh' },
    'Madurai': { x: 138, y: 126, state: 'Tamil Nadu' },
    'Allahabad': { x: 219, y: 66, state: 'Uttar Pradesh' },
    'Howrah': { x: 250.8, y: 96.6, state: 'West Bengal' },
    'Salem': { x: 135, y: 124.5, state: 'Tamil Nadu' },
    'Warangal': { x: 144, y: 106.5, state: 'Telangana' },
    'Guntur': { x: 171, y: 109.5, state: 'Andhra Pradesh' },
    'Bhiwandi': { x: 124.2, y: 86.1, state: 'Maharashtra' },
    'Saharanpur': { x: 207, y: 55.5, state: 'Uttar Pradesh' },
    'Gorakhpur': { x: 237, y: 67.5, state: 'Uttar Pradesh' },
    'Bikaner': { x: 156, y: 69, state: 'Rajasthan' },
    'Amravati': { x: 141, y: 85.5, state: 'Maharashtra' },
    'Noida': { x: 214.8, y: 56.4, state: 'Uttar Pradesh' },
    'Jamshedpur': { x: 237, y: 90, state: 'Jharkhand' },
    'Bhilai': { x: 177, y: 91.5, state: 'Chhattisgarh' },
    'Cuttack': { x: 225, y: 103.5, state: 'Odisha' },
    'Firozabad': { x: 207, y: 61.5, state: 'Uttar Pradesh' },
    'Bhavnagar': { x: 105, y: 82.5, state: 'Gujarat' },
    'Dehradun': { x: 198, y: 48, state: 'Uttarakhand' },
    'Durgapur': { x: 246, y: 93, state: 'West Bengal' },
    'Asansol': { x: 243, y: 94.5, state: 'West Bengal' },
    'Rourkela': { x: 219, y: 96, state: 'Odisha' },
    'Bareilly': { x: 213, y: 60, state: 'Uttar Pradesh' },
    'Moradabad': { x: 210, y: 58.5, state: 'Uttar Pradesh' },
    'Dhanbad': { x: 240, y: 88.5, state: 'Jharkhand' },
    'Ajmer': { x: 159, y: 70.5, state: 'Rajasthan' },
    'Kolhapur': { x: 117, y: 96, state: 'Maharashtra' },
    'Shahjahanpur': { x: 216, y: 58.5, state: 'Uttar Pradesh' },
    'Gulbarga': { x: 120, y: 105, state: 'Karnataka' },
    'Jamnagar': { x: 99, y: 79.5, state: 'Gujarat' },
    'Dhule': { x: 135, y: 82.5, state: 'Maharashtra' },
    'Bilaspur': { x: 174, y: 88.5, state: 'Chhattisgarh' },
    'Sangli': { x: 118.8, y: 94.5, state: 'Maharashtra' },
    'Mangalore': { x: 105, y: 120, state: 'Karnataka' },
    'Kozhikode': { x: 111, y: 127.5, state: 'Kerala' },
    'Erode': { x: 129, y: 123, state: 'Tamil Nadu' },
    'Rajahmundry': { x: 174, y: 109.5, state: 'Andhra Pradesh' },
    'Kollam': { x: 111, y: 130.5, state: 'Kerala' },
    'Ujjain': { x: 153, y: 73.5, state: 'Madhya Pradesh' },
    'Jalgaon': { x: 132, y: 82.5, state: 'Maharashtra' },
    'Bharatpur': { x: 171, y: 67.5, state: 'Rajasthan' },
    'Mathura': { x: 201, y: 61.5, state: 'Uttar Pradesh' },
    'Kurnool': { x: 144, y: 112.5, state: 'Andhra Pradesh' },
    'Ramagundam': { x: 147, y: 105, state: 'Telangana' },
    'Guntakal': { x: 141, y: 114, state: 'Andhra Pradesh' },
    'Nizamabad': { x: 141, y: 103.5, state: 'Telangana' },
    'Kottayam': { x: 112.8, y: 129, state: 'Kerala' },
    'Parbhani': { x: 120, y: 91.5, state: 'Maharashtra' },
    'Tiruvannamalai': { x: 141, y: 121.5, state: 'Tamil Nadu' },
    'Bidar': { x: 123, y: 103.5, state: 'Karnataka' },
    'Yavatmal': { x: 138, y: 88.5, state: 'Maharashtra' },
    'Achalpur': { x: 139.2, y: 86.4, state: 'Maharashtra' },
    'Barshi': { x: 120, y: 92.4, state: 'Maharashtra' },
    'Chalisgaon': { x: 130.8, y: 83.4, state: 'Maharashtra' },
    'Ichalkaranji': { x: 118.2, y: 95.4, state: 'Maharashtra' },
    'Jalna': { x: 136.8, y: 88.5, state: 'Maharashtra' },
    'Latur': { x: 123, y: 91.5, state: 'Maharashtra' },
    'Lonavala': { x: 124.8, y: 88.5, state: 'Maharashtra' },
    'Malegaon': { x: 130.8, y: 82.5, state: 'Maharashtra' },
    'Miraj': { x: 118.8, y: 94.5, state: 'Maharashtra' },
    'Nanded': { x: 135, y: 93, state: 'Maharashtra' },
    'Osmanabad': { x: 120, y: 92.4, state: 'Maharashtra' },
    'Pandharpur': { x: 120, y: 93.6, state: 'Maharashtra' },
    'Satara': { x: 120, y: 92.4, state: 'Maharashtra' },
    'Wardha': { x: 144, y: 85.5, state: 'Maharashtra' },
    'Washim': { x: 135, y: 87, state: 'Maharashtra' }
  };

  // Get coordinates for a city, with fallback to nearest major city
  const getCityCoordinates = (cityName) => {
    const city = cityName?.trim();
    if (!city) return null;

    // Direct match
    if (cityCoordinates[city]) {
      return cityCoordinates[city];
    }

    // Try to find partial matches
    for (const [key, coords] of Object.entries(cityCoordinates)) {
      if (key.toLowerCase().includes(city.toLowerCase()) || 
          city.toLowerCase().includes(key.toLowerCase())) {
        return coords;
      }
    }

    // If no match found, return a default position (center of India)
    return { x: 300, y: 250, state: 'Unknown' };
  };

  // Group associations by city
  const associationsByCity = associations.reduce((acc, association) => {
    const city = association.city || 'Unknown';
    if (!acc[city]) {
      acc[city] = [];
    }
    acc[city].push(association);
    return acc;
  }, {});

  // Zoom functions
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.5, 4));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.5, 0.5));
  };

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Pan functions
  const handleMouseDown = (e) => {
    if (e.button === 0) { // Left mouse button only
      setIsDragging(true);
      setDragStart({
        x: e.clientX - pan.x,
        y: e.clientY - pan.y
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Wheel zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.min(Math.max(prev * delta, 0.5), 4));
  };

  const handlePinClick = (city, cityAssociations) => {
    setSelectedAssociation({ city, associations: cityAssociations });
  };

  const handlePinHover = (city, cityAssociations) => {
    setHoveredAssociation({ city, associations: cityAssociations });
  };

  const handlePinLeave = () => {
    setHoveredAssociation(null);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Association Map</h3>
          <p className="text-sm text-gray-600">Geographic distribution of associations across India</p>
        </div>
        
        {/* Zoom Controls */}
        <div className="flex items-center space-x-2">
          <div className="flex bg-white border rounded-lg shadow-sm">
            <button
              onClick={handleZoomIn}
              className="p-2 hover:bg-gray-50 border-r transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4 text-gray-600" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-2 hover:bg-gray-50 border-r transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4 text-gray-600" />
            </button>
            <button
              onClick={handleReset}
              className="p-2 hover:bg-gray-50 transition-colors"
              title="Reset View"
            >
              <RotateCcw className="h-4 w-4 text-gray-600" />
            </button>
          </div>
          <span className="text-sm text-gray-500 ml-2">
            {Math.round(zoom * 100)}%
          </span>
        </div>
      </div>

      <div className="relative">
        {/* Show message if no associations */}
        {associations.length === 0 ? (
          <div className="text-center py-16">
            <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-lg text-gray-600 mb-2">No associations found</p>
            <p className="text-sm text-gray-500">Associations will appear here once they are added to the system</p>
          </div>
        ) : (
          /* SVG Map of India - Clean style like the reference image */
          <div className="relative w-full h-96 bg-white rounded-lg border overflow-hidden">
            <svg
              ref={svgRef}
              viewBox="0 0 300 150"
              className="w-full h-full cursor-grab active:cursor-grabbing"
              style={{ minHeight: '384px' }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
            >
              {/* Transform group for zoom and pan */}
              <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
                {/* Clean India outline using the provided SVG code */}
                <path
                  d="M50 120 Q70 105 90 110 Q120 100 140 120 L180 125 Q190 110 220 120 Q250 125 270 140 Q250 145 180 140 Q120 130 100 135 Q80 140 50 120 Z"
                  fill="#7dd3fc"
                  stroke="#0ea5e9"
                  strokeWidth="2"
                />

                {/* City pins - color coded by status like reference image */}
                {Object.entries(associationsByCity).map(([city, cityAssociations]) => {
                  const coords = getCityCoordinates(city);
                  if (!coords) return null;

                  const totalAssociations = cityAssociations.length;
                  const activeAssociations = cityAssociations.filter(a => a.status === 'Active').length;
                  const status = activeAssociations > 0 ? 'Active' : 
                               cityAssociations.some(a => a.status === 'Pending') ? 'Pending' : 'Inactive';

                  // Color coding similar to reference image (METROS, MINI-METROS, BEST OF URBAN INDIA)
                  const pinColor = status === 'Active' ? '#fbbf24' : // Yellow like METROS
                                  status === 'Pending' ? '#ef4444' : // Red like MINI-METROS
                                  '#1e40af'; // Dark blue like BEST OF URBAN INDIA

                  return (
                    <g key={city}>
                      {/* Pin circle - solid like reference image */}
                      <circle
                        cx={coords.x}
                        cy={coords.y}
                        r={Math.min(6 + totalAssociations * 1.5, 18)}
                        fill={pinColor}
                        stroke="white"
                        strokeWidth="1.5"
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => handlePinClick(city, cityAssociations)}
                        onMouseEnter={() => handlePinHover(city, cityAssociations)}
                        onMouseLeave={handlePinLeave}
                      />
                       
                      {/* Pin count - small white text like reference image */}
                      <text
                        x={coords.x}
                        y={coords.y + 3}
                        textAnchor="middle"
                        className="text-xs font-bold fill-white pointer-events-none"
                        style={{ fontSize: '10px' }}
                      >
                        {totalAssociations}
                      </text>

                      {/* City label on hover */}
                      {hoveredAssociation?.city === city && (
                        <text
                          x={coords.x}
                          y={coords.y - 12}
                          textAnchor="middle"
                          className="text-xs font-medium fill-gray-800 pointer-events-none"
                          style={{ fontSize: '11px' }}
                        >
                          {city}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            </svg>

            {/* Legend - positioned like reference image */}
            <div className="absolute bottom-4 right-4 bg-white bg-opacity-95 rounded-lg p-3 text-xs shadow-lg">
              <div className="font-medium mb-2 text-gray-800">AREAS SURVEYED</div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <span className="text-gray-700">Active Associations</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-gray-700">Pending Associations</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-700 rounded-full"></div>
                  <span className="text-gray-700">Inactive Associations</span>
                </div>
                <div className="text-gray-600 mt-2 text-xs">
                  Pin size indicates number of associations
                </div>
              </div>
            </div>

            {/* Zoom Instructions */}
            <div className="absolute top-4 left-4 bg-white bg-opacity-90 rounded-lg p-2 text-xs text-gray-600">
              <div className="font-medium mb-1">Map Controls:</div>
              <div>• Use mouse wheel to zoom</div>
              <div>• Click and drag to pan</div>
              <div>• Use buttons to zoom in/out</div>
            </div>
          </div>
        )}

        {/* Association Details Panel */}
        {selectedAssociation && (
          <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-sm max-h-80 overflow-y-auto z-10">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">
                {selectedAssociation.city}
              </h4>
              <button
                onClick={() => setSelectedAssociation(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-3">
              {selectedAssociation.associations.map((association) => (
                <div key={association.id} className="border-l-4 border-blue-500 pl-3">
                  <div className="font-medium text-gray-900">{association.name}</div>
                  <div className="text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <Building className="h-4 w-4" />
                      <span>{association.district}, {association.state}</span>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <Users className="h-4 w-4" />
                      <span>{association.memberCount} members</span>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <Calendar className="h-4 w-4" />
                      <span>Joined {new Date(association.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      association.status === 'Active' 
                        ? 'bg-green-100 text-green-800'
                        : association.status === 'Pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {association.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {associations.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <MapPin className="h-5 w-5 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-600">Cities Covered</p>
                <p className="text-2xl font-bold text-blue-900">
                  {Object.keys(associationsByCity).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <Building className="h-5 w-5 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-600">Total Associations</p>
                <p className="text-2xl font-bold text-green-900">
                  {associations.length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center">
              <Users className="h-5 w-5 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-600">Total Members</p>
                <p className="text-2xl font-bold text-yellow-900">
                  {associations.reduce((sum, a) => sum + (a.memberCount || 0), 0)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-purple-600">Active Cities</p>
                <p className="text-2xl font-bold text-purple-900">
                  {Object.values(associationsByCity).filter(cityAssocs => 
                    cityAssocs.some(a => a.status === 'Active')
                  ).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssociationMap;
