import type { Dirent, Stats } from "node:fs";

import type { FileSystem, Path } from "@effect/platform";
import { Effect, Option } from "effect";
import type { FSOption } from "glob";

const fileInfoToStats = (stat: FileSystem.File.Info): Stats => {
  const nowDate = new Date();

  const getMs = (opt: Option.Option<Date>) =>
    Option.getOrElse(opt, () => nowDate).getTime();
  const getDate = (opt: Option.Option<Date>) =>
    Option.getOrElse(opt, () => nowDate);

  return {
    atime: getDate(stat.atime),
    atimeMs: getMs(stat.atime),
    birthtime: getDate(stat.birthtime),
    birthtimeMs: getMs(stat.birthtime),
    blksize: Number(Option.getOrElse(stat.blksize, () => 4096)),
    blocks: Option.getOrElse(stat.blocks, () =>
      Math.ceil(Number(stat.size) / 512),
    ),
    ctime: getDate(stat.mtime),
    ctimeMs: getMs(stat.mtime),
    dev: stat.dev,
    gid: Option.getOrElse(stat.gid, () => 0),
    ino: Option.getOrElse(stat.ino, () => 0),
    isBlockDevice: () => stat.type === "BlockDevice",
    isCharacterDevice: () => stat.type === "CharacterDevice",
    isDirectory: () => stat.type === "Directory",
    isFIFO: () => stat.type === "FIFO",
    isFile: () => stat.type === "File",
    isSocket: () => stat.type === "Socket",
    isSymbolicLink: () => stat.type === "SymbolicLink",
    mode: stat.mode,
    mtime: getDate(stat.mtime),
    mtimeMs: getMs(stat.mtime),
    nlink: Option.getOrElse(stat.nlink, () => 1),
    rdev: Option.getOrElse(stat.rdev, () => 0),
    size: Number(stat.size),
    uid: Option.getOrElse(stat.uid, () => 0),
  };
};

const createDirent = (
  name: string,
  parentPath: string,
  type: string,
): Dirent => ({
  isBlockDevice: () => type === "BlockDevice",
  isCharacterDevice: () => type === "CharacterDevice",
  isDirectory: () => type === "Directory",
  isFIFO: () => type === "FIFO",
  isFile: () => type === "File",
  isSocket: () => type === "Socket",
  isSymbolicLink: () => type === "SymbolicLink",
  name,
  parentPath,
});

const readDirFactory = (
  fs: FileSystem.FileSystem,
  path: Path.Path,
  basePath: string,
) =>
  Effect.gen(function* () {
    const fileNames = yield* fs.readDirectory(basePath);

    const res: Dirent[] = [];

    for (const name of fileNames) {
      const filePath = path.resolve(basePath, name);
      const stat = yield* fs.stat(filePath);
      res.push(createDirent(name, basePath, stat.type));
    }

    return res;
  });

export const makeGlobFsAdaptor = (
  fs: FileSystem.FileSystem,
  path: Path.Path,
): FSOption => {
  return {
    lstatSync: (path: string) => fileInfoToStats(Effect.runSync(fs.stat(path))),
    promises: {
      lstat: (path) => Effect.runPromise(fs.stat(path)).then(fileInfoToStats),
      readdir: (basePath) =>
        Effect.runPromise(readDirFactory(fs, path, basePath)),
      readlink: (path) => Effect.runPromise(fs.readLink(path)),
      realpath: (path) => Effect.runPromise(fs.realPath(path)),
    },
    readdir: (basePath, _opts, callback) => {
      Effect.runPromise(readDirFactory(fs, path, basePath)).then(
        (res) => callback(null, res),
        (err) => callback(err),
      );
    },
    readdirSync: (basePath: string) =>
      Effect.runSync(readDirFactory(fs, path, basePath)),
    readlinkSync: (path: string) => Effect.runSync(fs.readLink(path)),
    realpathSync: (path: string) => Effect.runSync(fs.realPath(path)),
  };
};
