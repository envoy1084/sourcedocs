/** biome-ignore-all lint/complexity/noExcessiveLinesPerFunction: safe */
/** biome-ignore-all lint/suspicious/noExplicitAny: safe */
/** biome-ignore-all lint/style/noMagicNumbers: safe */
/** biome-ignore-all lint/complexity/noExcessiveCognitiveComplexity: safe */
/** biome-ignore-all lint/style/noNestedTernary: safe */

import crypto from "node:crypto";
import os from "node:os";
import path from "node:path";

import { FileSystem } from "@effect/platform";
import { effectify } from "@effect/platform/Effectify";
import {
  BadArgument,
  type PlatformError,
  SystemError,
  type SystemErrorReason,
} from "@effect/platform/Error";
import { type Context, Effect, Layer, Option, pipe, Stream } from "effect";
import { type IFs, memfs, type NestedDirectoryJSON } from "memfs";
import type { Stats } from "memfs/lib/node/Stats";
import type { PathLike, TCallback } from "memfs/lib/node/types/misc";
import type { IError, TMode } from "memfs/lib/node/volume";

const handleErrnoException =
  (module: SystemError["module"], method: string) =>
  (
    err: IError,
    [path]: [path: PathLike | number, ...args: Array<unknown>],
  ): PlatformError => {
    let reason: SystemErrorReason = "Unknown";

    switch (err.code) {
      case "ENOENT":
        reason = "NotFound";
        break;

      case "EACCES":
        reason = "PermissionDenied";
        break;

      case "EEXIST":
        reason = "AlreadyExists";
        break;

      case "EISDIR":
        reason = "BadResource";
        break;

      case "ENOTDIR":
        reason = "BadResource";
        break;

      case "EBUSY":
        reason = "Busy";
        break;

      case "ELOOP":
        reason = "BadResource";
        break;

      default:
        reason = "Unknown";
    }

    return new SystemError({
      cause: err,
      description: err.message,
      method,
      module,
      pathOrDescriptor: path.toString(),
      reason,
      syscall: "",
    });
  };

const handleBadArgument = (method: string) => (cause: unknown) =>
  new BadArgument({
    cause,
    method,
    module: "FileSystem",
  });

// access
const access = (fs: IFs) => {
  const memNodeAccess = effectify(
    fs.access,
    handleErrnoException("FileSystem", "access"),
    handleBadArgument("access"),
  );

  return (path: string, options?: FileSystem.AccessFileOptions) => {
    let mode = fs.constants.F_OK;
    if (options?.readable) {
      mode |= fs.constants.R_OK;
    }
    if (options?.writable) {
      mode |= fs.constants.W_OK;
    }
    return memNodeAccess(path, mode);
  };
};

// == copy
const copy = (fs: IFs) => {
  const nodeCp = effectify(
    fs.cp,
    handleErrnoException("FileSystem", "copy"),
    handleBadArgument("copy"),
  );
  return (fromPath: string, toPath: string, options?: FileSystem.CopyOptions) =>
    nodeCp(fromPath, toPath, {
      force: options?.overwrite ?? false,
      preserveTimestamps: options?.preserveTimestamps ?? false,
      recursive: true,
    });
};

// == copyFile
const copyFile = (fs: IFs) => {
  const nodeCopyFile = effectify(
    fs.copyFile,
    handleErrnoException("FileSystem", "copyFile"),
    handleBadArgument("copyFile"),
  );
  return (fromPath: string, toPath: string) => nodeCopyFile(fromPath, toPath);
};

// == chmod
const chmod = (fs: IFs) => {
  const nodeChmod = effectify(
    fs.chmod,
    handleErrnoException("FileSystem", "chmod"),
    handleBadArgument("chmod"),
  );
  return (path: string, mode: number) => nodeChmod(path, mode);
};

// == chown
const chown = (fs: IFs) => {
  const nodeChown = effectify(
    fs.chown,
    handleErrnoException("FileSystem", "chown"),
    handleBadArgument("chown"),
  );
  return (path: string, uid: number, gid: number) => nodeChown(path, uid, gid);
};

// == link
const link = (fs: IFs) => {
  const nodeLink = effectify(
    fs.link,
    handleErrnoException("FileSystem", "link"),
    handleBadArgument("link"),
  );
  return (existingPath: string, newPath: string) =>
    nodeLink(existingPath, newPath);
};

// exists
const exists = (fs: IFs) => {
  return (path: string) => Effect.sync(() => fs.existsSync(path));
};

// == makeDirectory
const makeDirectory = (fs: IFs) => {
  const nodeMkdir = effectify(
    fs.mkdir,
    handleErrnoException("FileSystem", "makeDirectory"),
    handleBadArgument("makeDirectory"),
  );
  return (path: string, options?: FileSystem.MakeDirectoryOptions) =>
    nodeMkdir(path, {
      mode: options?.mode,
      recursive: options?.recursive ?? false,
    });
};

// == makeTempDirectory
const makeTempDirectoryFactory = (fs: IFs, method: string) => {
  const nodeMkdtemp = effectify(
    fs.mkdtemp,
    handleErrnoException("FileSystem", method),
    handleBadArgument(method),
  );
  return (options?: FileSystem.MakeTempDirectoryOptions) =>
    Effect.suspend(() => {
      const prefix = options?.prefix ?? "";
      const directory =
        typeof options?.directory === "string"
          ? path.join(options.directory, ".")
          : os.tmpdir();

      return nodeMkdtemp(
        prefix ? path.join(directory, prefix) : `${directory}/`,
      );
    });
};
const makeTempDirectory = (fs: IFs) =>
  makeTempDirectoryFactory(fs, "makeTempDirectory");

// == remove
const removeFactory = (fs: IFs, method: string) => {
  const nodeRm = effectify(
    fs.rm,
    handleErrnoException("FileSystem", method),
    handleBadArgument(method),
  );
  return (path: string, options?: FileSystem.RemoveOptions) =>
    nodeRm(path, {
      force: options?.force ?? false,
      recursive: options?.recursive ?? false,
    });
};
const remove = (fs: IFs) => removeFactory(fs, "remove");

// == makeTempDirectoryScoped
const makeTempDirectoryScoped = (fs: IFs) => {
  const makeDirectory = makeTempDirectoryFactory(fs, "makeTempDirectoryScoped");
  const removeDirectory = removeFactory(fs, "makeTempDirectoryScoped");
  return (options?: FileSystem.MakeTempDirectoryOptions) =>
    Effect.acquireRelease(makeDirectory(options), (directory) =>
      Effect.orDie(removeDirectory(directory, { recursive: true })),
    );
};

// == open
const openFactory = (fs: IFs, method: string) => {
  const nodeOpen = effectify(
    fs.open,
    handleErrnoException("FileSystem", method),
    handleBadArgument(method),
  );
  const nodeClose = effectify(
    fs.close,
    handleErrnoException("FileSystem", method),
    handleBadArgument(method),
  );

  return (fs: IFs, path: string, options?: FileSystem.OpenFileOptions) =>
    pipe(
      Effect.acquireRelease(
        nodeOpen(path, options?.flag ?? "r", options?.mode as TMode),
        (fd) => Effect.orDie(nodeClose(fd)),
      ),
      Effect.map((fd) =>
        makeFile(fs)(
          FileSystem.FileDescriptor(fd),
          options?.flag?.startsWith("a") ?? false,
        ),
      ),
    );
};
const open = (fs: IFs) => openFactory(fs, "open");

const makeFile = (fs: IFs) => {
  const nodeReadFactory = (method: string) =>
    effectify(
      fs.read,
      handleErrnoException("FileSystem", method),
      handleBadArgument(method),
    );
  const nodeRead = nodeReadFactory("read");
  const nodeReadAlloc = nodeReadFactory("readAlloc");
  const nodeStat = effectify(
    fs.fstat,
    handleErrnoException("FileSystem", "stat"),
    handleBadArgument("stat"),
  );
  const nodeTruncate = effectify(
    fs.ftruncate,
    handleErrnoException("FileSystem", "truncate"),
    handleBadArgument("truncate"),
  );

  const nodeSync = effectify(
    fs.fsync,
    handleErrnoException("FileSystem", "sync"),
    handleBadArgument("sync"),
  );

  const nodeWriteFactory = (method: string) =>
    effectify(
      fs.write as (
        fd: number,
        buffer: Buffer | ArrayBufferView | DataView,
        offset: number,
        length: number,
        position: number,
        callback: (err: Error, bytesWritten: number) => void,
      ) => void,
      handleErrnoException("FileSystem", method),
      handleBadArgument(method),
    );

  const nodeWrite = nodeWriteFactory("write");
  const nodeWriteAll = nodeWriteFactory("writeAll");

  class FileImpl implements FileSystem.File {
    readonly [FileSystem.FileTypeId]: FileSystem.FileTypeId;

    private readonly semaphore = Effect.unsafeMakeSemaphore(1);
    private position = 0n;

    constructor(
      readonly fd: FileSystem.File.Descriptor,
      private readonly append: boolean,
    ) {
      this[FileSystem.FileTypeId] = FileSystem.FileTypeId;
    }

    get stat() {
      return Effect.map(nodeStat(this.fd), makeFileInfo);
    }

    get sync() {
      return nodeSync(this.fd);
    }

    seek(offset: FileSystem.SizeInput, from: FileSystem.SeekMode) {
      const offsetSize = FileSystem.Size(offset);
      return this.semaphore.withPermits(1)(
        Effect.sync(() => {
          if (from === "start") {
            this.position = offsetSize;
          } else if (from === "current") {
            this.position += offsetSize;
          }

          return this.position;
        }),
      );
    }

    read(buffer: Uint8Array) {
      return this.semaphore.withPermits(1)(
        Effect.map(
          Effect.suspend(() =>
            nodeRead(this.fd, buffer, 0, buffer.length, Number(this.position)),
          ),
          (bytesRead) => {
            const sizeRead = FileSystem.Size(bytesRead);
            this.position += sizeRead;
            return sizeRead;
          },
        ),
      );
    }

    readAlloc(size: FileSystem.SizeInput) {
      const sizeNumber = Number(size);
      return this.semaphore.withPermits(1)(
        Effect.flatMap(
          Effect.sync(() => Buffer.allocUnsafeSlow(sizeNumber)),
          (buffer) =>
            Effect.map(
              nodeReadAlloc(
                this.fd,
                buffer,
                0,
                buffer.length,
                Number(this.position),
              ),
              (bytesRead): Option.Option<Buffer> => {
                if (bytesRead === 0) {
                  return Option.none();
                }

                this.position += BigInt(bytesRead);
                if (bytesRead === sizeNumber) {
                  return Option.some(buffer);
                }

                const dst = Buffer.allocUnsafeSlow(bytesRead);
                buffer.copy(dst, 0, 0, bytesRead);
                return Option.some(dst);
              },
            ),
        ),
      );
    }

    truncate(length?: FileSystem.SizeInput) {
      return this.semaphore.withPermits(1)(
        Effect.map(nodeTruncate(this.fd, length ? Number(length) : 0), () => {
          if (!this.append) {
            const len = BigInt(length ?? 0);
            if (this.position > len) {
              this.position = len;
            }
          }
        }),
      );
    }

    write(buffer: Uint8Array) {
      return this.semaphore.withPermits(1)(
        Effect.map(
          Effect.suspend(() =>
            nodeWrite(this.fd, buffer, 0, buffer.length, Number(this.position)),
          ),
          () => {
            const sizeWritten = FileSystem.Size(buffer.length);
            if (!this.append) {
              this.position += sizeWritten;
            }

            return sizeWritten;
          },
        ),
      );
    }

    private writeAllChunk(
      buffer: Uint8Array,
    ): Effect.Effect<void, PlatformError> {
      return Effect.flatMap(
        Effect.suspend(() => {
          const res = nodeWriteAll(
            this.fd,
            buffer,
            0,
            buffer.length,
            Number(this.position),
          );

          return res;
        }),
        (bytesWritten) => {
          if (bytesWritten === 0) {
            return Effect.fail(
              new SystemError({
                description: "write returned 0 bytes written",
                method: "writeAll",
                module: "FileSystem",
                pathOrDescriptor: this.fd,
                reason: "WriteZero",
              }),
            );
          }

          if (!this.append) {
            this.position += BigInt(bytesWritten);
          }

          return bytesWritten < buffer.length
            ? this.writeAllChunk(buffer.subarray(bytesWritten))
            : Effect.void;
        },
      );
    }

    writeAll(buffer: Uint8Array) {
      return this.semaphore.withPermits(1)(this.writeAllChunk(buffer));
    }
  }

  return (fd: FileSystem.File.Descriptor, append: boolean): FileSystem.File =>
    new FileImpl(fd, append);
};

// == makeTempFile
const makeTempFileFactory = (fs: IFs, method: string) => {
  const makeDirectory = makeTempDirectoryFactory(fs, method);
  const open = openFactory(fs, method);
  const randomHexString = (bytes: number) =>
    Effect.sync(() => crypto.randomBytes(bytes).toString("hex"));
  return (options?: FileSystem.MakeTempFileOptions) =>
    pipe(
      Effect.zip(makeDirectory(options), randomHexString(6)),
      Effect.map(([directory, random]) =>
        path.join(directory, random + (options?.suffix ?? "")),
      ),
      Effect.tap((path) => Effect.scoped(open(fs, path, { flag: "w+" }))),
    );
};
const makeTempFile = (fs: IFs) => makeTempFileFactory(fs, "makeTempFile");

// == makeTempFileScoped

const makeTempFileScoped = (fs: IFs) => {
  const makeFile = makeTempFileFactory(fs, "makeTempFileScoped");
  const removeDirectory = removeFactory(fs, "makeTempFileScoped");
  return (options?: FileSystem.MakeTempFileOptions) =>
    Effect.acquireRelease(makeFile(options), (file) =>
      Effect.orDie(removeDirectory(path.dirname(file), { recursive: true })),
    );
};

// == readDirectory

const readDirectory =
  (fs: IFs) => (path: string, options?: FileSystem.ReadDirectoryOptions) =>
    Effect.tryPromise({
      catch: (err) =>
        handleErrnoException("FileSystem", "readDirectory")(err as any, [path]),
      try: () => fs.promises.readdir(path, options) as Promise<string[]>,
    });

// == readFile
const readFile = (fs: IFs) => (path: string) =>
  Effect.async<Uint8Array, PlatformError>((resume) => {
    try {
      fs.readFile(path, (err, data) => {
        if (err) {
          resume(
            Effect.fail(
              handleErrnoException("FileSystem", "readFile")(err, [path]),
            ),
          );
        } else {
          resume(Effect.succeed(data as Buffer));
        }
      });
    } catch (err) {
      resume(Effect.fail(handleBadArgument("readFile")(err)));
    }
  });

// readFileString
const readFileString =
  (fs: IFs) => (path: string, encoding: string | undefined) => {
    return Effect.gen(function* () {
      const arr = yield* readFile(fs)(path);
      return Buffer.from(arr).toString(encoding as BufferEncoding);
    });
  };

// == readLink
const readLink = (fs: IFs) => {
  const nodeReadLink = effectify(
    fs.readlink as (path: PathLike, callback: TCallback<string>) => void,
    handleErrnoException("FileSystem", "readLink"),
    handleBadArgument("readLink"),
  );

  return (path: string) => nodeReadLink(path);
};

// == realPath
const realPath = (fs: IFs) => {
  const nodeRealPath = effectify(
    fs.realpath as (path: PathLike, callback: TCallback<string>) => void,
    handleErrnoException("FileSystem", "realPath"),
    handleBadArgument("realPath"),
  );
  return (path: string) => nodeRealPath(path);
};

// == rename
const rename = (fs: IFs) => {
  const nodeRename = effectify(
    fs.rename,
    handleErrnoException("FileSystem", "rename"),
    handleBadArgument("rename"),
  );
  return (oldPath: string, newPath: string) => nodeRename(oldPath, newPath);
};

// == stat
const makeFileInfo = (stat: Stats): FileSystem.File.Info => ({
  atime: Option.fromNullable(stat.atime),
  birthtime: Option.fromNullable(stat.birthtime),
  blksize: Option.map(Option.fromNullable(stat.blksize), FileSystem.Size),
  blocks: Option.fromNullable(stat.blocks as number),
  dev: stat.dev as number,
  gid: Option.fromNullable(stat.gid as number),
  ino: Option.fromNullable(stat.ino as number),
  mode: stat.mode as number,
  mtime: Option.fromNullable(stat.mtime),
  nlink: Option.fromNullable(stat.nlink as number),
  rdev: Option.fromNullable(stat.rdev as number),
  size: FileSystem.Size(stat.size),
  type: stat.isFile()
    ? "File"
    : stat.isDirectory()
      ? "Directory"
      : stat.isSymbolicLink()
        ? "SymbolicLink"
        : stat.isBlockDevice()
          ? "BlockDevice"
          : stat.isCharacterDevice()
            ? "CharacterDevice"
            : stat.isFIFO()
              ? "FIFO"
              : stat.isSocket()
                ? "Socket"
                : "Unknown",
  uid: Option.fromNullable(stat.uid as number),
});
const stat = (fs: IFs) => {
  const nodeStat = effectify(
    fs.stat,
    handleErrnoException("FileSystem", "stat"),
    handleBadArgument("stat"),
  );
  return (path: string) => Effect.map(nodeStat(path), makeFileInfo);
};

// == symlink

const symlink = (fs: IFs) => {
  const nodeSymlink = effectify(
    fs.symlink,
    handleErrnoException("FileSystem", "symlink"),
    handleBadArgument("symlink"),
  );
  return (target: string, path: string) => nodeSymlink(target, path);
};

// == truncate

const truncate = (fs: IFs) => {
  const nodeTruncate = effectify(
    fs.truncate,
    handleErrnoException("FileSystem", "truncate"),
    handleBadArgument("truncate"),
  );
  return (path: string, length?: FileSystem.SizeInput) =>
    nodeTruncate(path, Number(length ?? 0));
};

// == utimes

const utimes = (fs: IFs) => {
  const nodeUtimes = effectify(
    fs.utimes,
    handleErrnoException("FileSystem", "utime"),
    handleBadArgument("utime"),
  );
  return (path: string, atime: number | Date, mtime: number | Date) =>
    nodeUtimes(path, atime, mtime);
};

// == watch
const watchNode = (fs: IFs, path: string, options?: FileSystem.WatchOptions) =>
  Stream.asyncScoped<FileSystem.WatchEvent, PlatformError>((emit) =>
    Effect.acquireRelease(
      Effect.sync(() => {
        const watcher = fs.watch(
          path,
          { recursive: options?.recursive },
          (event, path) => {
            if (!path) {
              return;
            }
            switch (event) {
              case "rename": {
                emit.fromEffect(
                  Effect.matchEffect(stat(fs)(path), {
                    onFailure: (err) =>
                      err._tag === "SystemError" && err.reason === "NotFound"
                        ? Effect.succeed(FileSystem.WatchEventRemove({ path }))
                        : Effect.fail(err),
                    onSuccess: (_) =>
                      Effect.succeed(FileSystem.WatchEventCreate({ path })),
                  }),
                );
                return;
              }
              case "change": {
                emit.single(FileSystem.WatchEventUpdate({ path }));
                return;
              }
              default: {
                return;
              }
            }
          },
        );
        watcher.on("error", (error) => {
          emit.fail(
            new SystemError({
              cause: error,
              method: "watch",
              module: "FileSystem",
              pathOrDescriptor: path,
              reason: "Unknown",
            }),
          );
        });
        watcher.on("close", () => {
          emit.end();
        });
        return watcher;
      }),
      (watcher) => Effect.sync(() => watcher.close()),
    ),
  );

const watch =
  (fs: IFs) =>
  (
    backend: Option.Option<Context.Tag.Service<FileSystem.WatchBackend>>,
    path: string,
    options?: FileSystem.WatchOptions,
  ) =>
    stat(fs)(path).pipe(
      Effect.map((stat) =>
        backend.pipe(
          Option.flatMap((_) => _.register(path, stat, options)),
          Option.getOrElse(() => watchNode(fs, path, options)),
        ),
      ),
      Stream.unwrap,
    );

// == writeFile
const writeFile =
  (fs: IFs) =>
  (path: string, data: Uint8Array, options?: FileSystem.WriteFileOptions) =>
    Effect.async<void, PlatformError>((resume) => {
      try {
        fs.writeFile(
          path,
          data,
          {
            flag: options?.flag ?? "w",
            mode: options?.mode ?? 0o666,
          },
          (err) => {
            if (err) {
              resume(
                Effect.fail(
                  handleErrnoException("FileSystem", "writeFile")(err, [path]),
                ),
              );
            } else {
              resume(Effect.void);
            }
          },
        );
      } catch (err) {
        resume(Effect.fail(handleBadArgument("writeFile")(err)));
      }
    });

const writeFileString = (fs: IFs) => (path: string, data: string) => {
  const arr = Buffer.from(data);
  return writeFile(fs)(path, arr);
};

export const layer = (initial?: NestedDirectoryJSON, cwd?: string) => {
  return Layer.unwrapEffect(
    Effect.gen(function* () {
      const { fs } = memfs(initial, cwd);
      const backend = yield* Effect.serviceOption(FileSystem.WatchBackend);

      return FileSystem.layerNoop({
        access: access(fs),
        chmod: chmod(fs),
        chown: chown(fs),
        copy: copy(fs),
        copyFile: copyFile(fs),
        exists: exists(fs),
        link: link(fs),
        makeDirectory: makeDirectory(fs),
        makeTempDirectory: makeTempDirectory(fs),
        makeTempDirectoryScoped: makeTempDirectoryScoped(fs),
        makeTempFile: makeTempFile(fs),
        makeTempFileScoped: makeTempFileScoped(fs),
        open: (path, opts) => open(fs)(fs, path, opts),
        readDirectory: readDirectory(fs),
        readFile: readFile(fs),
        readFileString: readFileString(fs),
        readLink: readLink(fs),
        realPath: realPath(fs),
        remove: remove(fs),
        rename: rename(fs),
        // sink
        // stream
        stat: stat(fs),
        symlink: symlink(fs),
        truncate: truncate(fs),
        utimes: utimes(fs),
        watch(path, options) {
          return watch(fs)(backend, path, options);
        },
        writeFile: writeFile(fs),
        writeFileString: writeFileString(fs),
      });
    }),
  );
};
