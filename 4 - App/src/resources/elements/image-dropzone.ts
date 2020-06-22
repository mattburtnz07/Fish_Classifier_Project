import { resizeImage } from "utils/utility";
import { bindable, customElement } from "aurelia-framework";
import Dropzone from "dropzone";

@customElement("image-dropzone")
export default class ImageDropZone {
  @bindable private classifyImages: ({ images }) => void;

  @bindable private isClassifying: boolean;

  @bindable private imagesToClassify: number;

  private dropZone: Dropzone;

  private hasImages = false;

  private images: string[] = [];

  attached(): void {
    this.dropZone = new Dropzone("#dropzone", {
      autoProcessQueue: false,
      url: "/", // Ignore
    });

    this.dropZone.on("addedfiles", () => {
      this.hasImages = true;
    });
  }

  start(): void {
    // eslint-disable-next-line no-restricted-syntax
    for (const image of [...this.dropZone.files]) {
      this.images.push(resizeImage(image.dataURL));
    }

    this.classifyImages({ images: this.images });
    this.clear();
  }

  clear(): void {
    this.images = [];
    this.dropZone.removeAllFiles();
  }
}
