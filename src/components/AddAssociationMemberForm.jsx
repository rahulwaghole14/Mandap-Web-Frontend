import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { memberApi } from '../services/memberApi';
import toast from 'react-hot-toast';
import { formatDateForAPI, getMaxDateForPicker, getMinDateForPicker, validateBirthDate } from '../utils/dateUtils';

const AddAssociationMemberForm = ({ association, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [businessImages, setBusinessImages] = useState([]);
  const [businessImagePreviews, setBusinessImagePreviews] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm({
    defaultValues: {
      state: 'Maharashtra',
      associationName: association?.name || ''
    }
  });

  // Update form values when association prop changes
  useEffect(() => {
    if (association) {
      console.log('Association prop changed:', association);
      
      // Use setTimeout to ensure the form is fully rendered before setting values
      setTimeout(() => {
        if (association.state) {
          setValue('state', association.state);
          console.log('State set to:', association.state);
        }
        if (association.name) {
          setValue('associationName', association.name);
          console.log('Association name set to:', association.name);
        }
      }, 100);
    }
  }, [association, setValue]);

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

  const handleBusinessImages = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setBusinessImages(files);
      
      // Create previews
      const previews = files.map(file => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(file);
        });
      });
      
      Promise.all(previews).then(setBusinessImagePreviews);
    }
  };

  const removeBusinessImage = (index) => {
    const newImages = businessImages.filter((_, i) => i !== index);
    const newPreviews = businessImagePreviews.filter((_, i) => i !== index);
    setBusinessImages(newImages);
    setBusinessImagePreviews(newPreviews);
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      let profileImage = null;
      let businessImageUrls = [];
      
      // Upload profile image if provided
      if (image) {
        const formData = new FormData();
        formData.append('image', image);
        
        try {
          const uploadResponse = await fetch('https://mandapam-backend-97mi.onrender.com/api/upload/profile-image', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
          });
          
          if (uploadResponse.ok) {
            const uploadResult = await uploadResponse.json();
            profileImage = uploadResult.filename;
          } else {
            throw new Error('Failed to upload profile image');
          }
        } catch (uploadError) {
          console.error('Profile image upload error:', uploadError);
          toast.error('Failed to upload profile image. Member will be created without profile image.');
        }
      }
      
      // Upload business images if provided
      if (businessImages.length > 0) {
        try {
          const uploadPromises = businessImages.map(async (file) => {
            const formData = new FormData();
            formData.append('image', file);
            
            const uploadResponse = await fetch('https://mandapam-backend-97mi.onrender.com/api/upload/business-image', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: formData
            });
            
            if (uploadResponse.ok) {
              const uploadResult = await uploadResponse.json();
              return uploadResult.filename;
            } else {
              throw new Error(`Failed to upload business image: ${file.name}`);
            }
          });
          
          businessImageUrls = await Promise.all(uploadPromises);
        } catch (uploadError) {
          console.error('Business images upload error:', uploadError);
          toast.error('Failed to upload business images. Member will be created without business images.');
        }
      }
      
      // Transform form data to match backend schema
      const memberData = {
        // Core required fields
        name: data.name.trim(),
        businessName: data.businessName.trim(),
        phone: data.phone.trim(),
        state: data.state || 'Maharashtra',
        businessType: data.businessType,
        city: data.city,
        pincode: data.pincode,
        associationName: association?.name || data.associationName,
        // Optional fields - only include if they have values
        ...(data.birthDate && { birthDate: formatDateForAPI(data.birthDate) }),
        ...(data.email && { email: data.email }),
        ...(data.address && { address: data.address }),
        ...(data.gstNumber && { gstNumber: data.gstNumber }),
        ...(data.description && { description: data.description }),
        ...(data.experience && { experience: parseInt(data.experience) }),
        ...(profileImage && { profileImage: profileImage }),
        ...(businessImageUrls.length > 0 && { businessImages: businessImageUrls })
      };

      const response = await memberApi.createMember(memberData);
      onSuccess(response.member);
      reset();
      removeImage();
      setBusinessImages([]);
      setBusinessImagePreviews([]);
      toast.success('Member added successfully!');
    } catch (error) {
      console.error('Error adding member:', error);
      const errorMessage = error.response?.data?.message || 'Failed to add member';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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

  // Get all Maharashtra districts
  const maharashtraDistricts = Object.keys(maharashtraData).sort();

  // Get cities based on selected district
  const getCitiesForDistrict = (district) => {
    return maharashtraData[district] || [];
  };

  // Watch for district changes
  const watchedDistrict = watch('district');

  const businessTypes = [
    { value: 'catering', label: 'Catering' },
    { value: 'sound', label: 'Sound' },
    { value: 'mandapam', label: 'Mandapam' },
    { value: 'light', label: 'Light' },
    { value: 'decorator', label: 'Decorator' },
    { value: 'photography', label: 'Photography' },
    { value: 'videography', label: 'Videography' },
    { value: 'transport', label: 'Transport' },
    { value: 'other', label: 'Other' }
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Association Info Display */}
      {association && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center space-x-2">
            <div className="text-blue-600 font-medium">Adding member to:</div>
            <div className="text-blue-800 font-semibold">{association.name}</div>
          </div>
          <div className="text-blue-600 text-sm mt-1">
            {association.city}, {association.district}, {association.state}
          </div>
        </div>
      )}

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
            <option value="Maharashtra">Maharashtra</option>
            <option value="Delhi">Delhi</option>
            <option value="Karnataka">Karnataka</option>
            <option value="Tamil Nadu">Tamil Nadu</option>
            <option value="Telangana">Telangana</option>
            <option value="Gujarat">Gujarat</option>
            <option value="Uttar Pradesh">Uttar Pradesh</option>
            <option value="West Bengal">West Bengal</option>
            <option value="Rajasthan">Rajasthan</option>
            <option value="Andhra Pradesh">Andhra Pradesh</option>
            <option value="Madhya Pradesh">Madhya Pradesh</option>
            <option value="Kerala">Kerala</option>
            <option value="Odisha">Odisha</option>
            <option value="Punjab">Punjab</option>
            <option value="Haryana">Haryana</option>
            <option value="Bihar">Bihar</option>
            <option value="Jharkhand">Jharkhand</option>
            <option value="Assam">Assam</option>
            <option value="Chhattisgarh">Chhattisgarh</option>
            <option value="Uttarakhand">Uttarakhand</option>
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
            {businessTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
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
            disabled={!watch('district') || watch('state') !== 'Maharashtra'}
          >
            <option value="">Select city</option>
            {watch('state') === 'Maharashtra' && watchedDistrict && getCitiesForDistrict(watchedDistrict).map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
          {errors.city && (
            <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>
          )}
          {watch('state') === 'Maharashtra' && !watchedDistrict && (
            <p className="text-gray-500 text-sm mt-1">Please select a district first</p>
          )}
          {watch('state') && watch('state') !== 'Maharashtra' && (
            <p className="text-gray-500 text-sm mt-1">City selection is available only for Maharashtra</p>
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
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input
            type="email"
            {...register('email', {
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Please enter a valid email address'
              }
            })}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter email address"
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">GST Number</label>
          <input
            type="text"
            {...register('gstNumber', {
              pattern: {
                value: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
                message: 'Please enter a valid GST number (e.g., 12ABCDE1234F1Z5)'
              }
            })}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
              errors.gstNumber ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter GST number (e.g., 12ABCDE1234F1Z5)"
          />
          {errors.gstNumber && (
            <p className="text-red-500 text-sm mt-1">{errors.gstNumber.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Experience (Years)</label>
          <input
            type="number"
            {...register('experience', {
              min: { value: 0, message: 'Experience cannot be negative' },
              max: { value: 100, message: 'Experience cannot exceed 100 years' }
            })}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
              errors.experience ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter years of experience (0-100)"
            min="0"
            max="100"
          />
          {errors.experience && (
            <p className="text-red-500 text-sm mt-1">{errors.experience.message}</p>
          )}
        </div>
      </div>

      {/* Full Address Field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Full Address</label>
        <textarea
          {...register('address')}
          rows={3}
          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
            errors.address ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter complete address"
        />
        {errors.address && (
          <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>
        )}
      </div>

      {/* Business Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Business Description</label>
        <textarea
          {...register('description')}
          rows={3}
          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
            errors.description ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Describe your business and services"
        />
        {errors.description && (
          <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
        )}
      </div>

      {/* Profile Image Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Profile Picture</label>
        <div className="flex items-center space-x-4">
          <input
            type="file"
            accept="image/*"
            onChange={handleImage}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
          />
          {preview && (
            <div className="relative">
              <img src={preview} alt="Preview" className="h-16 w-16 rounded-lg object-cover" />
              <button
                type="button"
                onClick={removeImage}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
              >
                ×
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Business Images Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Business Images</label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
          <div className="space-y-1 text-center">
            {businessImagePreviews.length === 0 ? (
              <>
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-4h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="flex text-sm text-gray-600">
                  <label className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500">
                    <span>Upload business images</span>
                    <input
                      type="file"
                      className="sr-only"
                      accept="image/*"
                      multiple
                      onChange={handleBusinessImages}
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB each (Multiple files allowed)</p>
              </>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {businessImagePreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img
                        src={preview}
                        alt={`Business preview ${index + 1}`}
                        className="h-24 w-24 object-cover rounded-lg mx-auto"
                      />
                      <button
                        type="button"
                        onClick={() => removeBusinessImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex text-sm text-gray-600">
                  <label className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500">
                    <span>Add more images</span>
                    <input
                      type="file"
                      className="sr-only"
                      accept="image/*"
                      multiple
                      onChange={handleBusinessImages}
                    />
                  </label>
                </div>
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
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Adding...</span>
            </>
          ) : (
            <span>Add Member</span>
          )}
        </button>
      </div>
    </form>
  );
};

export default AddAssociationMemberForm;





