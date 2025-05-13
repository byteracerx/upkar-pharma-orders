import { useState } from 'react';

// Gallery images with direct placeholder URLs to ensure they display properly
const galleryImages = [
  {
    id: 1,
    src: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    alt: 'Pharmacy interior',
    caption: 'Our modern pharmacy facility'
  },
  {
    id: 2,
    src: 'https://images.unsplash.com/photo-1576602976047-174e57a47881?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    alt: 'Medicine packaging',
    caption: 'Quality assured packaging'
  },
  {
    id: 3,
    src: 'https://images.unsplash.com/photo-1584362917165-526a968579e8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    alt: 'Delivery service',
    caption: 'Fast and reliable delivery'
  },
  {
    id: 4,
    src: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    alt: 'Customer service',
    caption: 'Dedicated customer support'
  },
  {
    id: 5,
    src: 'https://images.unsplash.com/photo-1583912267550-d6c2a3a8e5c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    alt: 'Product range',
    caption: 'Wide range of pharmaceutical products'
  },
  {
    id: 6,
    src: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    alt: 'Quality control',
    caption: 'Rigorous quality control'
  }
];

// Fallback image in case the provided images don't load
const fallbackImage = 'https://via.placeholder.com/400x300/e2e8f0/475569?text=Upkar+Pharma';

const PhotoGallery = () => {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [loadedImages, setLoadedImages] = useState<Record<number, boolean>>({});

  const openLightbox = (index: number) => {
    setSelectedImage(index);
  };

  const closeLightbox = () => {
    setSelectedImage(null);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, id: number) => {
    console.log(`Image ${id} failed to load, using fallback`);
    e.currentTarget.src = fallbackImage;
  };

  const handleImageLoad = (id: number) => {
    setLoadedImages(prev => ({
      ...prev,
      [id]: true
    }));
  };

  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Photo Gallery</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Take a look at our facilities, products, and services through our gallery.
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {galleryImages.map((image, index) => (
            <div 
              key={image.id} 
              className="overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer group"
              onClick={() => openLightbox(index)}
            >
              <div className="relative aspect-[4/3] bg-gray-100">
                {/* Loading skeleton */}
                {!loadedImages[image.id] && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-gray-300 border-t-upkar-blue rounded-full animate-spin"></div>
                  </div>
                )}
                <img
                  src={image.src}
                  alt={image.alt}
                  onError={(e) => handleImageError(e, image.id)}
                  onLoad={() => handleImageLoad(image.id)}
                  className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${
                    loadedImages[image.id] ? 'opacity-100' : 'opacity-0'
                  }`}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-end">
                  <div className="p-4 w-full text-white transform translate-y-full group-hover:translate-y-0 transition-transform">
                    <p className="font-medium">{image.caption}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Lightbox */}
      {selectedImage !== null && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          <button 
            className="absolute top-4 right-4 text-white text-4xl font-light hover:text-gray-300 transition-colors"
            onClick={closeLightbox}
            aria-label="Close lightbox"
          >
            &times;
          </button>
          
          {/* Navigation buttons */}
          {selectedImage > 0 && (
            <button 
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white text-4xl font-light hover:text-gray-300 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage(selectedImage - 1);
              }}
              aria-label="Previous image"
            >
              ‹
            </button>
          )}
          
          {selectedImage < galleryImages.length - 1 && (
            <button 
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white text-4xl font-light hover:text-gray-300 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage(selectedImage + 1);
              }}
              aria-label="Next image"
            >
              ›
            </button>
          )}
          
          <div className="max-w-4xl max-h-[90vh] relative" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gray-800 rounded-lg p-1">
              <img
                src={galleryImages[selectedImage].src}
                alt={galleryImages[selectedImage].alt}
                onError={(e) => handleImageError(e, galleryImages[selectedImage].id)}
                className="max-w-full max-h-[80vh] object-contain rounded"
              />
              <div className="bg-black bg-opacity-70 p-4 text-white rounded-b-lg">
                <p className="text-center">{galleryImages[selectedImage].caption}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default PhotoGallery;