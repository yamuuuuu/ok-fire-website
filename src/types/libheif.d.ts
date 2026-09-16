declare module 'libheif-js' {
  type ImageData = { width: number; height: number; data: Uint8ClampedArray };
  type HeifImage = { get_width(): number; get_height(): number; display(data: ImageData, callback: (data: ImageData | null) => void): void; free(): void };
  const libheif: { HeifDecoder: new () => { decode(data: Uint8Array): HeifImage[] } };
  export default libheif;
}
