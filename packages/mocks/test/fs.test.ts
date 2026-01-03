import { FileSystem, Path } from "@effect/platform";
import { describe, expect, layer } from "@effect/vitest";
import { Effect, Exit, Option } from "effect";

import { InMemoryContext } from "../src";

const initialStructure = {
  dir: {
    "nested.txt": "world",
  },
  "file.txt": "hello",
};

describe("Mock File System", () => {
  layer(InMemoryContext.layer(initialStructure))((it) => {
    const getAbsLocation = (...segments: string[]) =>
      Effect.gen(function* () {
        const path = yield* Path.Path;
        const absPath = path.resolve(...segments);
        return absPath;
      });

    it.effect("exists: file and directory", () =>
      Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem;

        expect(yield* fs.exists(yield* getAbsLocation("file.txt"))).toBe(true);
        expect(yield* fs.exists(yield* getAbsLocation("dir"))).toBe(true);

        expect(yield* fs.exists(yield* getAbsLocation("missing.txt"))).toBe(
          false,
        );
      }),
    );

    it.effect("readFileString: reads content", () =>
      Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem;

        const content = yield* fs.readFileString(
          yield* getAbsLocation("file.txt"),
        );
        expect(content).toBe("hello");
      }),
    );

    it.effect("readFileString: missing file fails", () =>
      Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem;

        const exit = yield* Effect.exit(fs.readFileString("missing.txt"));

        expect(Exit.isFailure(exit)).toBe(true);
      }),
    );

    it.effect("writeFile: writes data", () =>
      Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem;

        const absPath = yield* getAbsLocation("new.txt");

        const data = Buffer.from("data");

        yield* fs.writeFile(absPath, data);
        const returnedData = yield* fs.readFile(absPath);
        expect(Buffer.from(returnedData).toString()).toBe(data.toString());
      }),
    );

    it.effect("writeFileString: creates file", () =>
      Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem;

        const absPath = yield* getAbsLocation("new.txt");

        yield* fs.writeFileString(absPath, "data");
        expect(yield* fs.readFileString(absPath)).toBe("data");
      }),
    );

    it.effect("writeFileString: overwrites file", () =>
      Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem;

        const absPath = yield* getAbsLocation("file.txt");

        yield* fs.writeFileString(absPath, "new");
        expect(yield* fs.readFileString(absPath)).toBe("new");
      }),
    );

    it.effect("makeDirectory: creates nested dirs", () =>
      Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem;

        const absPath = yield* getAbsLocation("a/b/c");

        yield* fs.makeDirectory(absPath, { recursive: true });
        expect(yield* fs.exists(absPath)).toBe(true);
      }),
    );

    it.effect("readDirectory: lists entries", () =>
      Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem;

        const absPath = yield* getAbsLocation("dir");

        const entries = yield* fs.readDirectory(absPath, { recursive: true });
        expect(entries.sort()).toEqual(["nested.txt"]);
      }),
    );

    it.effect("readDirectory: file fails", () =>
      Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem;

        const absPath = yield* getAbsLocation("file.txt");

        const exit = yield* Effect.exit(fs.readDirectory(absPath));

        expect(Exit.isFailure(exit)).toBe(true);
      }),
    );

    it.effect("remove: deletes file", () =>
      Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem;

        const absPath = yield* getAbsLocation("file.txt");

        yield* fs.remove(absPath);
        expect(yield* fs.exists(absPath)).toBe(false);
      }),
    );

    it.effect("remove: deletes directory recursively", () =>
      Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem;

        const absPath = yield* getAbsLocation("dir");

        yield* fs.remove(absPath, { recursive: true });
        expect(yield* fs.exists(absPath)).toBe(false);
      }),
    );

    it.effect("rename: moves file", () =>
      Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem;

        const oldPath = yield* getAbsLocation("file.txt");
        const newPath = yield* getAbsLocation("renamed.txt");

        yield* fs.rename(oldPath, newPath);

        expect(yield* fs.exists(oldPath)).toBe(false);
        expect(yield* fs.exists(newPath)).toBe(true);
      }),
    );

    it.effect("rename: moves directory", () =>
      Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem;

        const oldPath = yield* getAbsLocation("dir");
        const newPath = yield* getAbsLocation("dir2");

        yield* fs.rename(oldPath, newPath);

        expect(yield* fs.exists(oldPath)).toBe(false);
        expect(yield* fs.exists(newPath)).toBe(true);

        expect(yield* fs.exists(yield* getAbsLocation("dir2/nested.txt"))).toBe(
          true,
        );
      }),
    );

    it.effect("copyFile: duplicates file", () =>
      Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem;

        const path1 = yield* getAbsLocation("file.txt");
        const path2 = yield* getAbsLocation("copy.txt");

        yield* fs.copyFile(path1, path2);

        expect(yield* fs.readFileString(path2)).toBe("hello");
        expect(yield* fs.readFileString(path1)).toBe("hello");
      }),
    );

    it.effect("copy: copies directory with overwrite", () =>
      Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem;

        const path1 = yield* getAbsLocation("file.txt");
        const path2 = yield* getAbsLocation("nested.txt");

        yield* fs.copy(path1, path2, { overwrite: true });

        expect(yield* fs.readFileString(path2)).toBe("hello");
        expect(yield* fs.readFileString(path1)).toBe("hello");
      }),
    );

    it.effect("stat: file vs directory", () =>
      Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem;

        const filePath = yield* getAbsLocation("file.txt");
        const dirPath = yield* getAbsLocation("dir");

        const file = yield* fs.stat(filePath);
        const dir = yield* fs.stat(dirPath);

        expect(file.type).toBe("File");
        expect(dir.type).toBe("Directory");
      }),
    );

    it.effect("access: existing path succeeds", () =>
      Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem;
        const path = yield* getAbsLocation("file.txt");
        yield* fs.access(path);
      }),
    );

    it.effect("access: missing path fails", () =>
      Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem;

        const path = yield* getAbsLocation("missing.txt");

        const exit = yield* Effect.exit(fs.access(path));
        expect(Exit.isFailure(exit)).toBe(true);
      }),
    );

    it.effect("chmod: does not throw", () =>
      Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem;

        const path = yield* getAbsLocation("file.txt");

        const Perms = 0o777;
        yield* fs.chmod(path, Perms);
      }),
    );

    it.effect("link: creates a link", () =>
      Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem;

        const oldPath = yield* getAbsLocation("file.txt");
        const newPath = yield* getAbsLocation("link.txt");

        yield* fs.link(oldPath, newPath);

        expect(yield* fs.exists(oldPath)).toBe(true);
        expect(yield* fs.exists(newPath)).toBe(true);

        const oldContent = yield* fs.readFileString(oldPath);
        const newContent = yield* fs.readFileString(newPath);

        expect(oldContent).toEqual(newContent);
      }),
    );

    it.effect("makeTempDirectory: creates a temp directory at root", () => {
      return Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem;

        const absPath = yield* fs.makeTempDirectory();

        expect(yield* fs.exists(absPath)).toBe(true);
      }).pipe(Effect.provide(InMemoryContext.layer(initialStructure)));
    });

    it.effect(
      "makeTempDirectory: creates a temp directory inside a dir",
      () => {
        return Effect.gen(function* () {
          const fs = yield* FileSystem.FileSystem;

          const absPath = yield* fs.makeTempDirectory({ directory: "dir" });
          const root = absPath.split("/")[1] ?? "";
          expect(root).toBe("dir");
          expect(yield* fs.exists(absPath)).toBe(true);
        }).pipe(Effect.provide(InMemoryContext.layer(initialStructure)));
      },
    );

    it.effect("makeTempDirectory: creates a temp with prefix", () => {
      return Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem;

        const absPath = yield* fs.makeTempDirectory({ prefix: "temp-" });
        const match = absPath.match(/temp-(.*)/);

        expect(match?.[0]).toBeTruthy();
        expect(yield* fs.exists(absPath)).toBe(true);
      }).pipe(Effect.provide(InMemoryContext.layer(initialStructure)));
    });

    it.effect("open: opens file", () =>
      Effect.scoped(
        Effect.gen(function* () {
          const fs = yield* FileSystem.FileSystem;

          const absPath = yield* getAbsLocation("file.txt");

          const file = yield* fs.open(absPath);

          file.read(Buffer.alloc(10));

          const stats = yield* file.stat;

          expect(stats.type).toBe("File");
        }),
      ),
    );

    it.effect("open: reads a certain number of bytes", () =>
      Effect.scoped(
        Effect.gen(function* () {
          const fs = yield* FileSystem.FileSystem;
          const absPath = yield* getAbsLocation("file.txt");
          const file = yield* fs.open(absPath);

          const bytes = yield* file.readAlloc(FileSystem.Size(3));

          expect(Option.isSome(bytes)).toBe(true);

          const data = yield* fs.readFileString(absPath);

          if (Option.isSome(bytes)) {
            expect(data.slice(0, 3)).toBe(
              Buffer.from(bytes.value).toString("utf-8"),
            );
          }
        }),
      ),
    );

    it.effect("open: should seek and write to file", () =>
      Effect.scoped(
        Effect.gen(function* () {
          const fs = yield* FileSystem.FileSystem;
          const absPath = yield* getAbsLocation("file.txt");
          const file = yield* fs.open(absPath);

          yield* file.seek(5, "start"); // Cursor at position 3
          yield* file.write(Buffer.from("world"));

          const data = yield* fs.readFileString(absPath);

          expect(data).toBe("helloworld");

          yield* file.seek(-10, "current");
          yield* file.write(Buffer.from("world"));

          const data2 = yield* fs.readFileString(absPath);

          expect(data2).toBe("worldworld");
        }),
      ),
    );
  });
});
