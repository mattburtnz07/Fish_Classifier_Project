/* eslint-disable class-methods-use-this */
import { Tensor, InferenceSession } from "onnxjs";
import ndarray from "ndarray";
import ops from "ndarray-ops";
import { argMax } from "utils/utility";

type PredictionResponse = {
  classLabels: string[];
  predictions: number[];
  highestProbabilityIndex: number;
};

const imageHeight = 224;
const imageWidth = 224;

export default class Classifier {
  private canvas: HTMLCanvasElement;

  private classLabels =
    "albacore australian_herring australian_salmon big bream flathead flounder gurnard snapper yellowtail_kingfish";

  private ctx: CanvasRenderingContext2D;

  private onnxSession: InferenceSession;

  private sessionIniailized = false;

  constructor() {
    this.onnxSession = new InferenceSession();
    this.canvas = document.createElement("canvas");
    this.canvas.width = imageWidth;
    this.canvas.height = imageHeight;
    this.ctx = this.canvas.getContext("2d");
  }

  private getImageData(src: string): Promise<ImageData> {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => {
        this.ctx.drawImage(img, 0, 0);
        img.style.display = "none";
        resolve(this.ctx.getImageData(0, 0, imageWidth, imageHeight));
      };
      img.onerror = reject;
      img.src = src;
    });
  }

  async loadModel(): Promise<void> {
    if (!this.sessionIniailized) {
      await this.onnxSession.loadModel(
        "https://dl.dropboxusercontent.com/s/xtebcyu1y5l2sj6/fish_model.onnx"
      );
      this.sessionIniailized = true;
    }
  }

  async startClassification(imageSrc: string): Promise<PredictionResponse> {
    const imageData: ImageData = await this.getImageData(imageSrc);
    const preprocessedData: ndarray.Data<number> = this.realignImageDataForInference(
      imageData.data,
      imageWidth,
      imageHeight
    );

    const inputTensor = new Tensor(
      preprocessedData as Float32Array,
      "float32",
      [1, 3, imageWidth, imageHeight]
    );

    const outputMap = await this.onnxSession.run([inputTensor]);
    const outputTensor = outputMap.values().next().value.data;
    return this.makeResponse(Array.from(outputTensor));
  }

  private realignImageDataForInference(
    data: Uint8ClampedArray,
    width: number,
    height: number
  ): ndarray.Data<number> {
    // Preprocess raw image data to match SageMaker's image classifier expected shape
    // re-aligning the imageData from [224*224*4] to the correct dimension [1*3*224*224]
    const dataFromImage = ndarray(new Float32Array(data), [width, height, 4]);
    const dataProcessed = ndarray(new Float32Array(width * height * 3), [
      1,
      3,
      height,
      width,
    ]);
    ops.assign(
      dataProcessed.pick(0, 0, null, null),
      dataFromImage.pick(null, null, 0)
    );
    ops.assign(
      dataProcessed.pick(0, 1, null, null),
      dataFromImage.pick(null, null, 1)
    );
    ops.assign(
      dataProcessed.pick(0, 2, null, null),
      dataFromImage.pick(null, null, 2)
    );

    return dataProcessed.data;
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  private makeResponse(predictions): PredictionResponse {
    const highestProbabilityIndex: number = argMax(predictions);
    const classLabels: string[] = [].concat(this.classLabels.split(" "));
    classLabels.sort();

    return {
      classLabels,
      predictions,
      highestProbabilityIndex,
    };
  }
}
