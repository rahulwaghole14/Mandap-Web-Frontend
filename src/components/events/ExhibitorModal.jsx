import React, { useState } from 'react';
import Modal from '../Modal';
import { useForm } from 'react-hook-form';
import { uploadApi } from '../../services/uploadApi';
import { Loader2, Upload, X } from 'lucide-react';

const BUSINESS_CATEGORIES = [
  'Flower Decoration',
  'Tent',
  'Lighting',
  'Sound',
  'Furniture',
  'Other'
];

const ExhibitorModal = ({ isOpen, onClose, onSubmit, defaultValues = null }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: defaultValues || {} });
  const [uploading, setUploading] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(defaultValues?.logo || '');

  const onChangeLogo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) return;
    setLogoFile(file);
    try {
      const b64 = await uploadApi.convertToBase64(file);
      setLogoPreview(b64);
    } catch {
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview('');
  };

  const submitInternal = async (values) => {
    try {
      setUploading(true);
      let logoUrl = values.logo || '';
      if (logoFile) {
        const res = await uploadApi.uploadImage(logoFile);
        const filename = res.file?.filename || res.filename;
        logoUrl = uploadApi.getImageUrl(filename);
      }
      await onSubmit({
        name: values.name,
        businessCategory: values.businessCategory || 'Other',
        description: values.description || '',
        phone: values.phone || '',
        logo: logoUrl || null,
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal title={defaultValues ? 'Edit Exhibitor' : 'Add Exhibitor'} isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit(submitInternal)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
          <input
            type="text"
            {...register('name', { required: 'Name is required' })}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Exhibitor name"
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Business Category</label>
          <select
            {...register('businessCategory')}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {BUSINESS_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
          <input
            type="text"
            {...register('phone')}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 border-gray-300"
            placeholder="10-digit phone"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            rows={3}
            {...register('description')}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 border-gray-300"
            placeholder="About the exhibitor"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
            <div className="space-y-1 text-center">
              {!logoPreview ? (
                <>
                  <Upload className="mx-auto h-10 w-10 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500">
                      <span>Upload a file</span>
                      <input type="file" className="sr-only" accept="image/*" onChange={onChangeLogo} />
                    </label>
                  </div>
                </>
              ) : (
                <div className="relative inline-block">
                  <img src={logoPreview} alt="Logo" className="h-16 w-16 object-cover rounded" />
                  <button type="button" onClick={removeLogo} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><X className="h-4 w-4" /></button>
                </div>
              )}
            </div>
          </div>
          <div className="mt-2">
            <input
              type="url"
              placeholder="Or paste a logo URL"
              {...register('logo')}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 border-gray-300"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={uploading} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2">
            {uploading && <Loader2 className="h-4 w-4 animate-spin" />}<span>{defaultValues ? 'Save' : 'Add'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ExhibitorModal;


