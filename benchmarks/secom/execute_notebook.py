"""Execute the companion notebook using only the benchmark virtual environment."""
import json
import sys
from pathlib import Path

import nbformat
from nbclient import NotebookClient
from jupyter_client import KernelManager
from jupyter_client.kernelspec import KernelSpecManager

ROOT = Path(__file__).resolve().parent
kernel_dir = ROOT / "cache/kernels/gridmind-secom"
kernel_dir.mkdir(parents=True, exist_ok=True)
(kernel_dir / "kernel.json").write_text(json.dumps({
    "argv": [sys.executable, "-m", "ipykernel_launcher", "-f", "{connection_file}"],
    "display_name": "GridMind offline SECOM", "language": "python",
}))


class BenchmarkKernel(KernelManager):
    def __init__(self, *args, **kwargs):
        kwargs["kernel_spec_manager"] = KernelSpecManager(kernel_dirs=[str(kernel_dir.parent)])
        super().__init__(*args, **kwargs)


notebook_path = ROOT / "inspection.ipynb"
notebook = nbformat.read(notebook_path, as_version=4)
client = NotebookClient(notebook, timeout=120, kernel_name="gridmind-secom", record_timing=False,
                        kernel_manager_class=BenchmarkKernel,
                        resources={"metadata": {"path": str(ROOT)}})
client.execute()
nbformat.validate(notebook)
nbformat.write(notebook, notebook_path)
print("PASS executed all companion notebook cells with the isolated benchmark kernel")
