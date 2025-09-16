import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Upload, 
  X, 
  Star, 
  StarOff, 
  Move, 
  Loader2,
  Image as ImageIcon,
  Download
} from 'lucide-react';
import { galleryApi } from '../services/galleryApi';
import toast from 'react-hot-toast';

const EventGallery = ({ eventId, eventTitle, onClose }) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm();

  const watchedFiles = watch('images');

  // Fetch gallery images on component mount
  useEffect(() => {
    fetchGalleryImages();
  }, [eventId]);

  const fetchGalleryImages = async () => {
    try {
      setLoading(true);
      const response = await galleryApi.getGalleryImages('event', eventId);
      setImages(response.images || []);
    } catch (error) {
      console.error('Error fetching gallery images:', error);
      toast.error('Failed to fetch gallery images');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    
    // Validate files
    files.forEach(file => {
      try {
        galleryApi.validateImageFile(file);
      } catch (error) {
        toast.error(error.message);
        return;
      }
    });

    // Set captions for each file
    const captions = files.map((file, index) => 
      `Image ${images.length + index + 1}`
    );
    
    setValue('captions', captions);
  };

  const onSubmitUpload = async (data) => {
    try {
      setUploading(true);
      
      const files = Array.from(data.images);
      const captions = data.captions || [];
      const altTexts = data.altTexts || [];

      const response = await galleryApi.uploadGalleryImages(
        'event', 
        eventId, 
        files, 
        { captions, altTexts }
      );

      // Add new images to the list
      setImages(prevImages => [...prevImages, ...response.images]);
      
      toast.success(`${files.length} images uploaded successfully!`);
      setShowUpload(false);
      reset();
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error(error.message || 'Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!window.confirm('Are you sure you want to delete this image?')) {
      return;
    }

    try {
      await galleryApi.deleteGalleryImage(imageId);
      setImages(prevImages => prevImages.filter(img => img.id !== imageId));
      toast.success('Image deleted successfully');
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Failed to delete image');
    }
  };

  const handleToggleFeatured = async (imageId, isFeatured) => {
    try {
      await galleryApi.updateGalleryImage(imageId, { isFeatured: !isFeatured });
      setImages(prevImages => 
        prevImages.map(img => 
          img.id === imageId 
            ? { ...img, isFeatured: !isFeatured }
            : { ...img, isFeatured: false } // Unfeature others
        )
      );
      toast.success(isFeatured ? 'Image unfeatured' : 'Image featured');
    } catch (error) {
      console.error('Error updating image:', error);
      toast.error('Failed to update image');
    }
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, dropIndex) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const newImages = [...images];
    const draggedImage = newImages[draggedIndex];
    
    // Remove dragged image and insert at new position
    newImages.splice(draggedIndex, 1);
    newImages.splice(dropIndex, 0, draggedImage);

    // Update display order
    const imageIds = newImages.map(img => img.id);
    
    try {
      await galleryApi.reorderGalleryImages('event', eventId, imageIds);
      setImages(newImages);
      toast.success('Images reordered successfully');
    } catch (error) {
      console.error('Error reordering images:', error);
      toast.error('Failed to reorder images');
    }

    setDraggedIndex(null);
  };

  const openImageViewer = (image) => {
    setSelectedImage(image);
    setShowViewer(true);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading gallery...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Event Gallery</h2>
            <p className="text-gray-600">{eventTitle}</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowUpload(true)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Images</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {images.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Images Yet</h3>
              <p className="text-gray-600 mb-4">Upload images to create a gallery for this event.</p>
              <button
                onClick={() => setShowUpload(true)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2 mx-auto"
              >
                <Plus className="h-4 w-4" />
                <span>Upload First Image</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image, index) => (
                <div
                  key={image.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  className={`relative group bg-gray-100 rounded-lg overflow-hidden cursor-move ${
                    draggedIndex === index ? 'opacity-50' : ''
                  }`}
                >
                  <div className="aspect-square relative">
                    <img
                      src={galleryApi.getImageUrl(image.filename)}
                      alt={image.altText || image.caption || 'Gallery image'}
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                    />
                    
                    {/* Featured Badge */}
                    {image.isFeatured && (
                      <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center space-x-1">
                        <Star className="h-3 w-3" />
                        <span>Featured</span>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openImageViewer(image)}
                          className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                          title="View Image"
                        >
                          <Eye className="h-4 w-4 text-gray-700" />
                        </button>
                        <button
                          onClick={() => handleToggleFeatured(image.id, image.isFeatured)}
                          className={`p-2 rounded-full transition-colors ${
                            image.isFeatured 
                              ? 'bg-yellow-500 hover:bg-yellow-600' 
                              : 'bg-white hover:bg-gray-100'
                          }`}
                          title={image.isFeatured ? 'Unfeature' : 'Feature'}
                        >
                          {image.isFeatured ? (
                            <Star className="h-4 w-4 text-white" />
                          ) : (
                            <StarOff className="h-4 w-4 text-gray-700" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteImage(image.id)}
                          className="p-2 bg-white rounded-full hover:bg-red-100 transition-colors"
                          title="Delete Image"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Image Info */}
                  <div className="p-3">
                    <p className="text-sm text-gray-900 truncate">
                      {image.caption || image.originalName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {galleryApi.formatFileSize(image.fileSize)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upload Modal */}
        {showUpload && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex justify-between items-center p-6 border-b">
                <h3 className="text-xl font-semibold">Upload Images</h3>
                <button
                  onClick={() => setShowUpload(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit(onSubmitUpload)} className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Images (up to 10 files, 10MB each)
                    </label>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      {...register('images', { 
                        required: 'Please select at least one image',
                        onChange: handleFileSelect
                      })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                    {errors.images && (
                      <p className="text-red-500 text-sm mt-1">{errors.images.message}</p>
                    )}
                  </div>

                  {watchedFiles && watchedFiles.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Image Captions (optional)
                      </label>
                      <div className="space-y-2">
                        {Array.from(watchedFiles).map((file, index) => (
                          <div key={index} className="flex items-center space-x-3">
                            <span className="text-sm text-gray-600 w-20 truncate">
                              {file.name}
                            </span>
                            <input
                              type="text"
                              {...register(`captions.${index}`)}
                              placeholder="Enter caption..."
                              className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowUpload(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        <span>Upload Images</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Image Viewer Modal */}
        {showViewer && selectedImage && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-60 p-4">
            <div className="relative max-w-4xl max-h-[90vh]">
              <button
                onClick={() => setShowViewer(false)}
                className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
              >
                <X className="h-8 w-8" />
              </button>
              
              <img
                src={galleryApi.getImageUrl(selectedImage.filename)}
                alt={selectedImage.altText || selectedImage.caption || 'Gallery image'}
                className="max-w-full max-h-full object-contain"
                crossOrigin="anonymous"
              />
              
              {(selectedImage.caption || selectedImage.altText) && (
                <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-75 text-white p-4 rounded">
                  <p className="text-lg font-semibold">{selectedImage.caption}</p>
                  {selectedImage.altText && (
                    <p className="text-sm text-gray-300">{selectedImage.altText}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventGallery;
