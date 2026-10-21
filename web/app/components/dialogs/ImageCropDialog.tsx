'use client';

import Cropper, { Area, Point } from 'react-easy-crop';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/app/components/ui/dialog';
import {
  canvasToFile,
  cropImageToCanvas,
  loadImage,
} from '@/app/utils/helpers/client';

import { Button } from '@/app/components/ui/button';
import { Slider } from '@/app/components/ui/slider';
import { toast } from '@/app/hooks/use-toast';
import { useDictionary } from '@/app/providers/dictionary-provider';
import { useState } from 'react';

interface IProps {
  file: string;
  onSave: (croppedFile: File) => void;
}
const ImageCropDialog = ({ file, onSave }: IProps) => {
  const { common, profile } = useDictionary();

  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropComplete = (_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleSave = async () => {
    if (!croppedAreaPixels || !file) return;

    try {
      const image = await loadImage(file);

      const croppedCanvas = cropImageToCanvas(image, croppedAreaPixels);

      const croppedFile = await canvasToFile(
        croppedCanvas,
        'cropped-image.jpg',
      );

      onSave(croppedFile);
    } catch (error) {
      toast({
        variant: 'error',
        description: `Error while cropping and saving the image: ${error}`,
      });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">{common.crop}</Button>
      </DialogTrigger>
      <DialogContent className="">
        <DialogHeader>
          <DialogTitle>{profile.basic.cropImage}</DialogTitle>
          <DialogDescription>{profile.basic.cropImageDesc}</DialogDescription>
        </DialogHeader>
        <section className="relative">
          <div className="size-64">
            <Cropper
              image={file}
              crop={crop}
              zoom={zoom}
              aspect={1}
              showGrid={false}
              cropShape="round"
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
            />
          </div>
          <div className="mt-6">
            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onValueChange={(value) => setZoom(value[0])}
            />
          </div>
        </section>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" onClick={handleSave}>
              {common.save}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImageCropDialog;
