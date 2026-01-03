import { Context, Layer } from "effect";
import {
  createFsFromVolume,
  type IFs,
  type NestedDirectoryJSON,
  Volume,
} from "memfs";

export class MemFs extends Context.Tag("MemFs")<
  MemFs,
  {
    cwd: string;
    volume: Volume;
    fs: IFs;
  }
>() {}

export const MemFsLive = (initialJson: NestedDirectoryJSON, cwd = "/") =>
  Layer.sync(MemFs, () => {
    const volume = Volume.fromNestedJSON(initialJson, cwd);
    const fs = createFsFromVolume(volume);
    return { cwd, fs, volume };
  });
