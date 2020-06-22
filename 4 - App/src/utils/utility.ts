/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
// argMax via https://gist.github.com/engelen/fbce4476c9e68c52ff7e5c2da5c24a28
export function argMax(array: number[]) {
  return array
    .map((x: number, i: number) => [x, i])
    .reduce((r: number[], a: number[]) => (a[0] > r[0] ? a : r))[1];
}

export function zipArrays(a: string[], b: number[]) {
  return a.map((e: string, i: number) => [e, b[i]]);
}

export function resizeImage(base64Str: string) {
  const img = new Image();
  img.src = base64Str;

  const canvas = document.createElement("canvas");
  canvas.width = 224;
  canvas.height = 224;

  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const imageAspectRatio = img.width / img.height;
  const canvasAspectRatio = canvas.width / canvas.height;
  let renderableHeight: number;
  let renderableWidth: number;
  let xStart: number;
  let yStart: number;

  if (imageAspectRatio < canvasAspectRatio) {
    renderableHeight = canvas.height;
    renderableWidth = img.width * (renderableHeight / img.height);
    xStart = (canvas.width - renderableWidth) / 2;
    yStart = 0;
  } else if (imageAspectRatio > canvasAspectRatio) {
    renderableWidth = canvas.width;
    renderableHeight = img.height * (renderableWidth / img.width);
    xStart = 0;
    yStart = (canvas.height - renderableHeight) / 2;
  } else {
    renderableHeight = canvas.height;
    renderableWidth = canvas.width;
    xStart = 0;
    yStart = 0;
  }

  ctx.drawImage(img, xStart, yStart, renderableWidth, renderableHeight);
  return canvas.toDataURL();
}
