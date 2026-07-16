'use client';
import { useState, useEffect } from 'react';
// @ts-ignore — browser ESM build; Node entry breaks in the browser
import * as faceapi from '@vladmandic/face-api/dist/face-api.esm.js';

const tf = faceapi.tf;   // ← the bundled instance, not a second one

export default function FaceLab() {
  const [ready, setReady] = useState(false);
  const [out, setOut] = useState<string[]>([]);
  const log = (s: string) => setOut((o) => [...o, s]);

  useEffect(() => {
    (async () => {
      await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
      await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
      await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
      await tf.ready();
      log(`backend: ${tf.getBackend()}`);
      setReady(true);
    })();
  }, []);

  async function probe(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
        const img = await faceapi.bufferToImage(file);

        // The official answer we're trying to reproduce.
        const official = Array.from(
        (await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor())!.descriptor
        );

        // Same crop face-api uses internally: extractFaces on the ALIGNED rect.
        const det = await faceapi.detectSingleFace(img).withFaceLandmarks();
        const [canvas] = await faceapi.extractFaces(img, [det.alignedRect]);
        log(`crop size: ${canvas.width}x${canvas.height}`);

        const drift = (d: Float32Array | number[]) =>
        Math.hypot(...Array.from(d).map((v, i) => v - official[i])).toFixed(5);

        const descOf = (x: any) =>
        faceapi.nets.faceRecognitionNet.forwardInput(new faceapi.NetInput([x])) as any;

        // Variant 0 — hand the canvas straight to face-api (should be ~0; proves the crop is right)
        const v0 = await faceapi.nets.faceRecognitionNet.computeFaceDescriptor(canvas);
        log(`v0 canvas → computeFaceDescriptor : ${drift(v0)}`);

        // Variant 1 — what we did before: naive resize, no pad, default halfPixelCenters
        const t1 = tf.tidy(() =>
        tf.browser.fromPixels(canvas).resizeBilinear([150, 150]).toFloat().expandDims(0)
        );
        log(`v1 naive resize                    : ${drift(await descOf(t1).data())}`);

        // Variant 2 — pad to square + halfPixelCenters (mirrors toBatchTensor)
        const t2 = tf.tidy(() => {
        let t = tf.browser.fromPixels(canvas).toFloat().expandDims(0);
        t = faceapi.padToSquare(t, true);
        return tf.image.resizeBilinear(t, [150, 150], false, true);
        });
        log(`v2 padToSquare + halfPixelCenters  : ${drift(await descOf(t2).data())}`);

        // Variant 3 — pad to square, default resize flags
        const t3 = tf.tidy(() => {
        let t = tf.browser.fromPixels(canvas).toFloat().expandDims(0);
        t = faceapi.padToSquare(t, true);
        return tf.image.resizeBilinear(t, [150, 150]);
        });
        log(`v3 padToSquare only                : ${drift(await descOf(t3).data())}`);

        tf.dispose([t1, t2, t3]);
    } catch (err: any) {
        log(`ERROR: ${err.message}`);
    } finally {
        e.target.value = '';
    }
    }

  return (
    <div className="p-8 space-y-4 font-mono text-sm">
      <p>{ready ? 'models loaded' : 'loading…'}</p>
      <input type="file" accept="image/*" onChange={probe} disabled={!ready} />
      <pre className="whitespace-pre-wrap">{out.join('\n')}</pre>
    </div>
  );
}