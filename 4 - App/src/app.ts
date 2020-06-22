/* eslint-disable class-methods-use-this */
import { autoinject } from "aurelia-framework";
import { zipArrays } from "utils/utility";

import Classifier from "services/classifier";
import dom from "font-awesome/library";
import nProgress from "nprogress";

import fish from "fish";

type PredictionResults = {
  image: string;
  informationUrl: string;
  bestLabel: string;
  bestScore: number;
  allLabelsScores: (string | number)[][];
};

@autoinject
export default class App {
  private images: string[] = [];

  private isModelLoading = false;

  private isModelLoaded = false;

  private isClassifyingImages = false;

  private imagesToClassify: number;

  private results: PredictionResults[] = [];

  // eslint-disable-next-line no-useless-constructor
  constructor(private readonly classifier: Classifier) {}

  attached(): void {
    dom.watch();
  }

  async loadModel(): Promise<void> {
    nProgress.configure({ showSpinner: false }).start();
    this.isModelLoading = true;
    await this.classifier.loadModel();
    this.isModelLoading = false;
    this.isModelLoaded = true;
    nProgress.done();
  }

  async classifyImages(images: string[]): Promise<void> {
    this.imagesToClassify = images.length;
    if (images.length > 0) {
      nProgress.start();
      this.isClassifyingImages = true;
      // eslint-disable-next-line no-restricted-syntax
      for (const image of images) {
        const {
          classLabels,
          predictions,
          highestProbabilityIndex,
          // eslint-disable-next-line no-await-in-loop
        } = await this.classifier.startClassification(image);

        const sortedClassLabels = classLabels.splice(0);
        sortedClassLabels.sort();

        this.results.push({
          image,
          informationUrl: fish[sortedClassLabels[highestProbabilityIndex]],
          bestLabel: sortedClassLabels[highestProbabilityIndex],
          bestScore: Number(predictions[highestProbabilityIndex]) * 100,
          allLabelsScores: zipArrays(sortedClassLabels, predictions),
        });

        this.imagesToClassify -= 1;
      }
      this.isClassifyingImages = false;
      nProgress.done();
    }
  }
}
