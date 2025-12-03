import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Trash2, Image as ImageIcon } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Point, Area } from "react-easy-crop";

interface LogoUploadProps {
  companyId: string;
  currentLogoUrl?: string | null;
}

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.src = url;
  });

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not get canvas context");
  }

  // Set canvas size to final dimensions (300x150)
  canvas.width = 300;
  canvas.height = 150;

  // Draw the cropped image and scale it to 300x150
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    300,
    150
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Canvas is empty"));
        }
      },
      "image/jpeg",
      0.9 // Quality 90%
    );
  });
}

export function LogoUpload({ companyId, currentLogoUrl }: LogoUploadProps) {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showCropDialog, setShowCropDialog] = useState(false);

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.match(/image\/(jpeg|jpg|png)/)) {
      toast({
        title: "Invalid file type",
        description: "Please select a JPG or PNG image",
        variant: "destructive",
      });
      return;
    }

    // Check file size (3MB = 3 * 1024 * 1024 bytes)
    if (file.size > 3 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 3MB",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setSelectedFile(reader.result as string);
      setShowCropDialog(true);
    });
    reader.readAsDataURL(file);
  };

  const handleCropAndUpload = async () => {
    if (!selectedFile || !croppedAreaPixels) return;

    setIsUploading(true);
    try {
      // Get the cropped and resized image
      const croppedImageBlob = await getCroppedImg(selectedFile, croppedAreaPixels);

      // Convert blob to base64 data URI
      const base64DataUri = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(croppedImageBlob);
      });

      // Update company with base64 logo data directly in database
      await apiRequest("PUT", `/api/companies/${companyId}/logo`, {
        logoUrl: base64DataUri,
      });

      // Invalidate company query
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/my-company"] });

      toast({
        title: "Success",
        description: "Logo uploaded successfully",
      });

      setShowCropDialog(false);
      setSelectedFile(null);
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload logo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteLogo = async () => {
    try {
      await apiRequest("DELETE", `/api/companies/${companyId}/logo`);

      // Invalidate company queries
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/my-company"] });

      toast({
        title: "Success",
        description: "Logo deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting logo:", error);
      toast({
        title: "Delete failed",
        description: "Failed to delete logo. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        {currentLogoUrl ? (
          <div className="relative">
            <img
              src={currentLogoUrl}
              alt="Company logo"
              className="h-20 w-40 object-contain border rounded-md bg-white dark:bg-gray-800"
              data-testid="img-company-logo"
            />
          </div>
        ) : (
          <div className="h-20 w-40 border-2 border-dashed rounded-md flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <ImageIcon className="h-8 w-8 text-gray-400" />
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById("logo-upload")?.click()}
            data-testid="button-upload-logo"
          >
            <Upload className="h-4 w-4 mr-2" />
            {currentLogoUrl ? "Change Logo" : "Upload Logo"}
          </Button>

          {currentLogoUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteLogo}
              data-testid="button-delete-logo"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
        </div>

        <input
          id="logo-upload"
          type="file"
          accept="image/jpeg,image/jpg,image/png"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      <p className="text-sm text-muted-foreground">
        Upload a logo (JPG or PNG, max 3MB). Image will be cropped to 2:1 aspect ratio and resized to 300x150px.
      </p>

      <Dialog open={showCropDialog} onOpenChange={setShowCropDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crop Logo</DialogTitle>
          </DialogHeader>

          <div className="relative h-96 bg-gray-100 dark:bg-gray-800">
            {selectedFile && (
              <Cropper
                image={selectedFile}
                crop={crop}
                zoom={zoom}
                aspect={2}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Zoom</label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full"
              data-testid="input-zoom"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCropDialog(false);
                setSelectedFile(null);
              }}
              disabled={isUploading}
              data-testid="button-cancel-crop"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCropAndUpload}
              disabled={isUploading}
              data-testid="button-upload-cropped"
            >
              {isUploading ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
