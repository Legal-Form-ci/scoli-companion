import { useState } from "react";
import { ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import SmartImage from "@/components/SmartImage";

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
}

const ProductImageGallery = ({ images, productName }: ProductImageGalleryProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  const allImages = images.length > 0 ? images : ["/placeholder.svg"];

  const goToPrevious = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const goToNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  const handleImageClick = (e: React.MouseEvent) => {
    // Only open zoom if clicking on the image itself, not on buttons
    if ((e.target as HTMLElement).tagName === 'IMG') {
      setIsZoomOpen(true);
    }
  };

  const handleThumbnailClick = (index: number) => {
    setSelectedIndex(index);
  };

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-square bg-muted rounded-2xl overflow-hidden group">
        <SmartImage
          src={allImages[selectedIndex]}
          alt={`${productName} - Image ${selectedIndex + 1}`}
          className="w-full h-full object-contain cursor-zoom-in"
          onClick={handleImageClick}
          fallbackSrc="/placeholder.svg"
          priority
          width={900}
          height={900}
          sizes="(max-width: 1024px) 100vw, 50vw"
        />

        {/* Navigation Arrows - Always visible on mobile, hover on desktop */}
        {allImages.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity h-10 w-10 rounded-full shadow-lg z-10"
              onClick={goToPrevious}
              type="button"
            >
              <ChevronLeft size={20} />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity h-10 w-10 rounded-full shadow-lg z-10"
              onClick={goToNext}
              type="button"
            >
              <ChevronRight size={20} />
            </Button>
          </>
        )}

        {/* Zoom Button */}
        <Button
          variant="secondary"
          size="icon"
          className="absolute bottom-2 right-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity h-10 w-10 rounded-full shadow-lg z-10"
          onClick={() => setIsZoomOpen(true)}
          type="button"
        >
          <ZoomIn size={18} />
        </Button>

        {/* Image Counter */}
        {allImages.length > 1 && (
          <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
            {selectedIndex + 1} / {allImages.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {allImages.map((image, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleThumbnailClick(index)}
              className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 transition-all ${
                selectedIndex === index
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-transparent hover:border-border"
              }`}
            >
              <SmartImage
                src={image}
                alt={`Miniature ${index + 1}`}
                className="w-full h-full object-cover"
                fallbackSrc="/placeholder.svg"
                width={80}
                height={80}
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}

      {/* Zoom Dialog */}
      <Dialog open={isZoomOpen} onOpenChange={setIsZoomOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden bg-black">
          <div className="relative w-full h-full flex items-center justify-center">
            <SmartImage
              src={allImages[selectedIndex]}
              alt={productName}
              className="max-w-full max-h-[85vh] object-contain"
              fallbackSrc="/placeholder.svg"
              width={1200}
              height={1200}
              sizes="100vw"
            />

            {allImages.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white h-12 w-12 rounded-full"
                  onClick={goToPrevious}
                  type="button"
                >
                  <ChevronLeft size={24} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white h-12 w-12 rounded-full"
                  onClick={goToNext}
                  type="button"
                >
                  <ChevronRight size={24} />
                </Button>
              </>
            )}

            {/* Thumbnail Strip */}
            {allImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 p-2 rounded-lg">
                {allImages.map((image, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleThumbnailClick(index)}
                    className={`w-12 h-12 rounded overflow-hidden border-2 transition-all ${
                      selectedIndex === index
                        ? "border-white"
                        : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <SmartImage
                      src={image}
                      alt={`Miniature ${index + 1}`}
                      className="w-full h-full object-cover"
                      fallbackSrc="/placeholder.svg"
                      width={48}
                      height={48}
                      sizes="48px"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductImageGallery;
