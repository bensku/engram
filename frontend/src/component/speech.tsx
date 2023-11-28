import { useState } from 'preact/hooks';
import { speechInputEnabled, speechInputHandler } from '../state';
import { MicVAD as MicVADType } from '@ricky0123/vad-web';

export const SpeechInput = () => {
  const [vad, setVad] = useState<MicVADType>();

  if (speechInputEnabled.value) {
    if (vad) {
      vad.start();
    } else {
      // Only load VAD if it is used, because it is quite big (10+ mb)
      void (async () => {
        const { MicVAD } = await import('@ricky0123/vad-web');
        setVad(
          await MicVAD.new({
            onSpeechEnd: (audio) => {
              const wav = inputToWav(audio, 16000);
              // TODO is this efficient enough?
              const binaryStr = wav.reduce(
                (acc, byte) => acc + String.fromCharCode(byte),
                '',
              );
              if (speechInputHandler.value) {
                speechInputHandler.value(binaryStr);
              }
            },
          }),
        );
      })();
    }
  } else {
    if (vad) {
      vad.pause();
    }
  }
  return null;
};

function inputToWav(input: Float32Array, sampleRate: number): Uint8Array {
  // Helper function to write a string to a DataView
  function writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  const bufferLength = input.length;
  const wavHeader = new ArrayBuffer(44);
  const view = new DataView(wavHeader);

  // Write the WAV container.
  // RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + bufferLength * 2, true); // File size
  writeString(view, 8, 'WAVE');
  // fmt sub-chunk (format details)
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // Audio format (1 is PCM)
  view.setUint16(22, 1, true); // NumChannels
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * 2, true); // ByteRate (SampleRate * NumChannels * BitsPerSample/8)
  view.setUint16(32, 2, true); // BlockAlign (NumChannels * BitsPerSample/8)
  view.setUint16(34, 16, true); // BitsPerSample
  // data sub-chunk (audio data)
  writeString(view, 36, 'data');
  view.setUint32(40, bufferLength * 2, true); // Subchunk2Size (NumSamples * NumChannels * BitsPerSample/8)

  // Convert samples from float to 16-bit PCM
  const int16Array = new Int16Array(bufferLength);
  for (let i = 0; i < bufferLength; i++) {
    const sample = Math.max(-1, Math.min(1, input[i])); // Clamp the sample to the range [-1.0, 1.0]
    int16Array[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff; // Convert to 16-bit
  }

  // Combine the WAV header and the audio samples
  const finalBuffer = new Uint8Array(
    wavHeader.byteLength + int16Array.byteLength,
  );
  finalBuffer.set(new Uint8Array(wavHeader), 0);
  finalBuffer.set(new Uint8Array(int16Array.buffer), wavHeader.byteLength);

  return finalBuffer;
}
