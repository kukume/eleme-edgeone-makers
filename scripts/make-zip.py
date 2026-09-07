from __future__ import print_function

import os
import sys
import zipfile

root = sys.argv[1]
out = sys.argv[2]

with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
    for dirpath, _, filenames in os.walk(root):
        for name in filenames:
            full = os.path.join(dirpath, name)
            rel = os.path.relpath(full, root).replace("\\", "/")
            if "[" in rel or "]" in rel:
                raise SystemExit("illegal name: " + rel)
            z.write(full, rel)
            print(rel)

print("wrote " + out)
