import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { memberApi } from '../services/memberApi';
import toast from 'react-hot-toast';
import { formatDateForAPI, getMaxDateForPicker, getMinDateForPicker, validateBirthDate } from '../utils/dateUtils';

const EditMemberForm = ({ member, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm();

  // Maharashtra districts and their cities
  const maharashtraData = {
    'Ahmednagar': ['Ahmednagar', 'Shrirampur', 'Kopargaon', 'Sangamner', 'Rahuri', 'Pathardi', 'Parner', 'Nevasa', 'Shevgaon', 'Karjat'],
    'Akola': ['Akola', 'Akot', 'Balapur', 'Murtijapur', 'Patur', 'Telhara', 'Barshitakli', 'Patur'],
    'Amravati': ['Amravati', 'Achalpur', 'Daryapur', 'Anjangaon', 'Chandur Railway', 'Dhamangaon Railway', 'Morshi', 'Warud', 'Teosa', 'Chandur Bazar'],
    'Aurangabad': ['Aurangabad', 'Gangapur', 'Paithan', 'Sillod', 'Vaijapur', 'Kannad', 'Soegaon', 'Khuldabad', 'Phulambri'],
    'Beed': ['Beed', 'Georai', 'Majalgaon', 'Parli', 'Ashti', 'Patoda', 'Shirur (Kasar)', 'Wadwani', 'Kaij', 'Dharur'],
    'Bhandara': ['Bhandara', 'Tumsar', 'Sakoli', 'Lakhani', 'Lakhandur', 'Mohadi', 'Pauni', 'Lakhni'],
    'Buldhana': ['Buldhana', 'Chikhli', 'Deulgaon Raja', 'Jalgaon (Jamod)', 'Khamgaon', 'Lonar', 'Mehkar', 'Motala', 'Nandura', 'Sangrampur', 'Shegaon'],
    'Chandrapur': ['Chandrapur', 'Ballarpur', 'Bhadravati', 'Bramhapuri', 'Chimur', 'Gondpipri', 'Jiwati', 'Korpana', 'Mul', 'Nagbhid', 'Pombhurna', 'Rajura', 'Sawali', 'Sindewahi', 'Warora'],
    'Dhule': ['Dhule', 'Shirpur', 'Sakri', 'Shindkheda'],
    'Gadchiroli': ['Gadchiroli', 'Aheri', 'Armori', 'Bhamragad', 'Chamorshi', 'Desaiganj', 'Dhanora', 'Etapalli', 'Kurkheda', 'Korchi', 'Mulchera', 'Sironcha', 'Wadsa'],
    'Gondia': ['Gondia', 'Arjuni Morgaon', 'Deori', 'Goregaon', 'Salekasa', 'Tirora'],
    'Hingoli': ['Hingoli', 'Aundha (Nagnath)', 'Kalamnuri', 'Sengaon'],
    'Jalgaon': ['Jalgaon', 'Amalner', 'Bhusawal', 'Chalisgaon', 'Chopda', 'Erandol', 'Jamner', 'Muktainagar', 'Pachora', 'Parola', 'Raver', 'Yawal'],
    'Jalna': ['Jalna', 'Ambad', 'Bhokardan', 'Ghansawangi', 'Jafferabad', 'Mantha', 'Partur'],
    'Kolhapur': ['Kolhapur', 'Ajra', 'Bavda', 'Bhudargad', 'Chandgad', 'Gadhinglaj', 'Gaganbawada', 'Hatkanangle', 'Kagal', 'Karveer', 'Panhala', 'Radhanagari', 'Shahuwadi', 'Shirol'],
    'Latur': ['Latur', 'Ahmadpur', 'Ausa', 'Chakur', 'Deoni', 'Jalkot', 'Nilanga', 'Renapur', 'Shirur Anantpal', 'Udgir'],
    'Mumbai City': ['Mumbai'],
    'Mumbai Suburban': ['Mumbai', 'Thane', 'Kalyan', 'Ulhasnagar', 'Ambernath', 'Badlapur', 'Mira-Bhayandar', 'Vasai-Virar', 'Bhiwandi-Nizampur', 'Kalyan-Dombivali'],
    'Nagpur': ['Nagpur', 'Hingna', 'Kamptee', 'Katol', 'Kuhi', 'Mauda', 'Narkhed', 'Parseoni', 'Ramtek', 'Savner', 'Umred'],
    'Nanded': ['Nanded', 'Ardhapur', 'Bhokar', 'Biloli', 'Deglur', 'Dharmabad', 'Hadgaon', 'Kandhar', 'Kinwat', 'Loha', 'Mahur', 'Mudkhed', 'Mukhed', 'Naigaon (Khairgaon)', 'Niwasa', 'Parbhani', 'Purna'],
    'Nandurbar': ['Nandurbar', 'Akkalkuwa', 'Nawapur', 'Shahade', 'Taloda'],
    'Nashik': ['Nashik', 'Baglan', 'Chandwad', 'Deola', 'Dindori', 'Igatpuri', 'Kalwan', 'Malegaon', 'Nandgaon', 'Niphad', 'Peth', 'Sinnar', 'Surgana', 'Trimbakeshwar', 'Yevla'],
    'Osmanabad': ['Osmanabad', 'Bhum', 'Kalamb', 'Lohara', 'Paranda', 'Tuljapur', 'Washi'],
    'Palghar': ['Palghar', 'Dahanu', 'Jawhar', 'Mokhada', 'Talasari', 'Vikramgad', 'Vasai'],
    'Parbhani': ['Parbhani', 'Gangakhed', 'Jintur', 'Manwath', 'Palam', 'Pathri', 'Purna', 'Sailu', 'Sonpeth'],
    'Pune': ['Pune', 'Ambegaon', 'Baramati', 'Bhor', 'Daund', 'Haveli', 'Indapur', 'Junnar', 'Khed', 'Mawal', 'Mulshi', 'Purandar', 'Shirur', 'Velhe'],
    'Raigad': ['Raigad', 'Alibag', 'Karjat', 'Khalapur', 'Mahad', 'Mangaon', 'Mhasla', 'Murud', 'Panvel', 'Pen', 'Poladpur', 'Roha', 'Shrivardhan', 'Sudhagad', 'Tala', 'Uran'],
    'Ratnagiri': ['Ratnagiri', 'Chiplun', 'Dapoli', 'Guhagar', 'Khed', 'Lanja', 'Mandangad', 'Rajapur', 'Sangameshwar'],
    'Sangli': ['Sangli', 'Atpadi', 'Jat', 'Kadegaon', 'Kavathemahankal', 'Khanapur (Vita)', 'Miraj', 'Palus', 'Shirala', 'Tasgaon', 'Walwa'],
    'Satara': ['Satara', 'Jaoli', 'Karad', 'Khandala', 'Khatav', 'Koregaon', 'Mahabaleshwar', 'Man', 'Patan', 'Phaltan', 'Wai'],
    'Sindhudurg': ['Sindhudurg', 'Devgad', 'Kankavli', 'Kudal', 'Malvan', 'Sawantwadi', 'Vaibhavwadi', 'Vengurla'],
    'Solapur': ['Solapur', 'Akkalkot', 'Barshi', 'Karmala', 'Madha', 'Mangalvedhe', 'Malshiras', 'Mohol', 'Pandharpur', 'Sangole'],
    'Thane': ['Thane', 'Ambarnath', 'Bhiwandi', 'Kalyan', 'Mira-Bhayandar', 'Ulhasnagar', 'Vasai-Virar', 'Dombivali', 'Badlapur', 'Ambernath'],
    'Wardha': ['Wardha', 'Arvi', 'Ashti', 'Deoli', 'Hinganghat', 'Karanja', 'Samudrapur', 'Seloo'],
    'Washim': ['Washim', 'Karanja', 'Malegaon', 'Mangrulpir', 'Manora', 'Risod'],
    'Yavatmal': ['Yavatmal', 'Arni', 'Babhulgaon', 'Darwha', 'Digras', 'Ghatanji', 'Kalamb', 'Kelapur', 'Mahagaon', 'Maregaon', 'Ner', 'Pusad', 'Ralegaon', 'Umarkhed', 'Wani', 'Zari-Jamani']
  };

  const states = [
    'Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'Telangana', 'Gujarat', 'Rajasthan',
    'Uttar Pradesh', 'West Bengal', 'Andhra Pradesh', 'Madhya Pradesh', 'Kerala'
  ];

  // Get all Maharashtra districts
  const maharashtraDistricts = Object.keys(maharashtraData).sort();

  // Get cities based on selected district
  const getCitiesForDistrict = (district) => {
    return maharashtraData[district] || [];
  };

  // Watch for district changes
  const watchedDistrict = watch('district');

  // Populate form with existing member data
  useEffect(() => {
    if (member) {
      console.log('EditMemberForm - Member data:', member);
      console.log('EditMemberForm - District value:', member.district);
      console.log('EditMemberForm - State value:', member.state);
      console.log('EditMemberForm - City value:', member.city);
      
      setValue('name', member.name);
      setValue('businessName', member.businessName);
      setValue('phone', member.phone);
      setValue('state', member.state);
      setValue('businessType', member.businessType);
      setValue('city', member.city);
      setValue('district', member.district);
      setValue('pincode', member.pincode);
      setValue('associationName', member.associationName);
      setValue('birthDate', member.birthDate ? member.birthDate.split('T')[0] : '');
      
      // Set selectedDistrict state for cascading dropdowns
      if (member.district) {
        console.log('EditMemberForm - Setting selectedDistrict to:', member.district);
        setSelectedDistrict(member.district);
      } else {
        console.log('EditMemberForm - No district data, selectedDistrict remains empty');
      }
    }
  }, [member, setValue]);

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    setPreview(null);
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      console.log('EditMemberForm - Form data:', data);
      console.log('EditMemberForm - District from form:', data.district);
      
      // Transform form data to match backend schema
      const memberData = {
        name: data.name.trim(),
        businessName: data.businessName.trim(),
        phone: data.phone.trim(),
        state: data.state,
        businessType: data.businessType,
        city: data.city,
        district: data.district,
        pincode: data.pincode,
        associationName: data.associationName,
        profileImage: image?.name || member.profileImage,
        birthDate: data.birthDate ? formatDateForAPI(data.birthDate) : null
      };

      console.log('EditMemberForm - Member data being sent:', memberData);
      console.log('EditMemberForm - District being sent:', memberData.district);

      const response = await memberApi.updateMember(member._id, memberData);
      console.log('EditMemberForm - Response from API:', response);
      onSuccess(response.member);
    } catch (error) {
      console.error('Error updating member:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update member';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };



  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
          <input
            type="text"
            {...register('name', { required: 'Name is required' })}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter full name"
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Business Name *</label>
          <input
            type="text"
            {...register('businessName', { required: 'Business name is required' })}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
              errors.businessName ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter business name"
          />
          {errors.businessName && (
            <p className="text-red-500 text-sm mt-1">{errors.businessName.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
          <input
            type="text"
            {...register('phone', { 
              required: 'Phone number is required',
              pattern: {
                value: /^[0-9]{10}$/,
                message: 'Please enter a valid 10-digit phone number'
              }
            })}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
              errors.phone ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter 10-digit phone number"
          />
          {errors.phone && (
            <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Birth Date</label>
          <input
            type="date"
            {...register('birthDate', {
              validate: (value) => {
                if (!value) return true; // Optional field
                const validation = validateBirthDate(value);
                return validation.isValid || validation.message;
              }
            })}
            min={getMinDateForPicker()}
            max={getMaxDateForPicker()}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
              errors.birthDate ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.birthDate && (
            <p className="text-red-500 text-sm mt-1">{errors.birthDate.message}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">Optional - Member must be at least 18 years old</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
          <select
            {...register('state', { 
              required: 'State is required',
              onChange: (e) => {
                // Reset district and city when state changes
                setValue('district', '');
                setValue('city', '');
                setSelectedDistrict('');
              }
            })}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
              errors.state ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select state</option>
            {states.map(state => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
          {errors.state && (
            <p className="text-red-500 text-sm mt-1">{errors.state.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Business Type *</label>
          <select
            {...register('businessType', { required: 'Business type is required' })}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
              errors.businessType ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select business type</option>
            <option value="sound">Sound</option>
            <option value="decorator">Decorator</option>
            <option value="catering">Catering</option>
            <option value="generator">Generator</option>
            <option value="madap">Madap</option>
            <option value="light">Light</option>
          </select>
          {errors.businessType && (
            <p className="text-red-500 text-sm mt-1">{errors.businessType.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">District *</label>
          <select
            {...register('district', { 
              required: 'District is required',
              onChange: (e) => {
                // Reset city when district changes
                setValue('city', '');
                setSelectedDistrict(e.target.value);
              }
            })}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
              errors.district ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={!watch('state') || watch('state') !== 'Maharashtra'}
          >
            <option value="">Select district</option>
            {watch('state') === 'Maharashtra' && maharashtraDistricts.map(district => (
              <option key={district} value={district}>{district}</option>
            ))}
          </select>
          {errors.district && (
            <p className="text-red-500 text-sm mt-1">{errors.district.message}</p>
          )}
          {watch('state') && watch('state') !== 'Maharashtra' && (
            <p className="text-gray-500 text-sm mt-1">District selection is available only for Maharashtra</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
          <select
            {...register('city', { required: 'City is required' })}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
              errors.city ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={!watchedDistrict || !getCitiesForDistrict(watchedDistrict).length}
          >
            <option value="">Select city</option>
            {watchedDistrict && getCitiesForDistrict(watchedDistrict).map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
          {errors.city && (
            <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>
          )}
          {watchedDistrict && !getCitiesForDistrict(watchedDistrict).length && (
            <p className="text-gray-500 text-sm mt-1">No cities available for selected district</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Pincode *</label>
          <input
            type="text"
            {...register('pincode', { 
              required: 'Pincode is required',
              pattern: {
                value: /^[0-9]{6}$/,
                message: 'Please enter a valid 6-digit pincode'
              }
            })}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
              errors.pincode ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter 6-digit pincode"
          />
          {errors.pincode && (
            <p className="text-red-500 text-sm mt-1">{errors.pincode.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Association Name *</label>
          <select
            {...register('associationName', { required: 'Association name is required' })}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
              errors.associationName ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select association</option>
            <option value="Mumbai Mandapam Association">Mumbai Mandapam Association</option>
            <option value="Pune Mandapam Association">Pune Mandapam Association</option>
            <option value="Nagpur Mandapam Association">Nagpur Mandapam Association</option>
            <option value="Thane Mandapam Association">Thane Mandapam Association</option>
            <option value="Nashik Mandapam Association">Nashik Mandapam Association</option>
          </select>
          {errors.associationName && (
            <p className="text-red-500 text-sm mt-1">{errors.associationName.message}</p>
          )}
        </div>
      </div>

      

      {/* Profile Image */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Profile Image</label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
          <div className="space-y-1 text-center">
            {!preview && !member.profileImage ? (
              <>
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-4h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="flex text-sm text-gray-600">
                  <label className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500">
                    <span>Upload a file</span>
                    <input
                      type="file"
                      className="sr-only"
                      accept="image/*"
                      onChange={handleImage}
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
              </>
            ) : (
              <div className="relative">
                <img
                  src={preview || member.profileImage}
                  alt="Preview"
                  className="mx-auto h-24 w-24 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Updating...</span>
            </>
          ) : (
            <span>Update Member</span>
          )}
        </button>
      </div>
    </form>
  );
};

export default EditMemberForm;
