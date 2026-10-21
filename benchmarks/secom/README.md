# GM-MVP-005: offline SECOM benchmark

Real public semiconductor measurements, separate from the synthetic industrial core and Claude's market research. The [benchmark report](../../docs/engineering/gridmind-gm-mvp-005-secom-benchmark.md) explains the negative detection result and next dependency. Nothing here is an operational manufacturing recommendation.

## Reproduce

From the existing repository root, use Python 3.12.14:

```sh
python3 -m venv benchmarks/secom/.venv
benchmarks/secom/.venv/bin/python -m pip install -r benchmarks/secom/requirements.txt
# The only acquisition step; bounded official UCI download with a pinned checksum.
benchmarks/secom/.venv/bin/python benchmarks/secom/fetch.py
# Everything below is offline. No Supabase, Auth, keys or production connectivity.
OPENBLAS_NUM_THREADS=1 OMP_NUM_THREADS=1 benchmarks/secom/.venv/bin/python benchmarks/secom/benchmark.py
SECOM_REAL_ACCEPTANCE=1 OPENBLAS_NUM_THREADS=1 OMP_NUM_THREADS=1 benchmarks/secom/.venv/bin/python -m unittest discover -s benchmarks/secom -p 'test_*.py' -v
```

`fetch.py` writes ignored `cache/secom.zip` and `cache/acquisition.json`. It refuses changed source bytes rather than changing the lock. Preparation verifies the archive and each member without extracting supplied paths. The source files remain local. `benchmark.py --archive PATH --output PATH` also accepts a previously acquired matching archive, with no network. Default output is versioned `results/`; use another output directory when comparing an independent rerun. A missing archive is an error, never a synthetic fallback.

`protocol.json` fixes the label, split, model, preprocessing, threshold and uncertainty method. `source-lock.json` records the original acquisition receipt, archive/member hashes, license, authors and source-version limitations. Results contain the full split manifest with physical source lines, per-feature missingness, fitted coefficients, held-out row-level predictions and summary metrics. `results.json` records the runtime. NumPy/scikit-learn/BLAS may introduce tiny numerical differences on another platform; acceptance requires identical splits/confusion counts and metric agreement to eight decimals, while not requiring byte-identical floating-point coefficients or platform metadata.

## Inspect the notebook

The executed companion `inspection.ipynb` imports the same tested parser and runner; it does not implement another model. It includes data quality, the exact comparison and an independent CSV-level confusion check. Install `requirements-notebook.txt` if you want to rerun it in Jupyter. Open the notebook from this directory and select the benchmark virtual environment as its kernel. Run all cells in order after acquiring the archive. Alternatively, `benchmarks/secom/.venv/bin/python benchmarks/secom/execute_notebook.py` executes and validates it using an isolated kernel specification in the ignored cache. Its temporary full rerun writes only to a temporary local directory.

## Automated checks

`test_benchmark.py` uses tiny **invented** arrays only for parser/math/leakage boundary tests; those arrays never enter the real benchmark metrics. Set `SECOM_REAL_ACCEPTANCE=1` to also verify the genuine cached archive and full held-out reproduction. This explicit mode fails if the archive is missing. The prepared `ci-workflow.yml.example` first runs no-network unit tests, then explicitly downloads the pinned official archive and reproduces the real benchmark offline. It is an **inactive template**: GitHub rejected workflow publication because the OAuth connection lacks `workflow` scope. Once a workflow-enabled connection is authorized, copy it to `.github/workflows/secom-benchmark.yml` and verify the hosted run. Existing app CI, quality, browser and migration checks remain intact; no required check is disabled or weakened.

## Attribution and source boundary

McCann, M. & Johnston, A. (2008). **SECOM [Dataset]**. UCI Machine Learning Repository. [DOI 10.24432/C54305](https://doi.org/10.24432/C54305), [official dataset record](https://archive.ics.uci.edu/dataset/179/secom), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). GridMind derives chronological splits, missingness profiles, imputed/scaled features, model coefficients, predictions and evaluation summaries. These changes and interpretations are GridMind's; neither UCI nor the authors endorse them. Retain this attribution with redistributed derived results.

There are no production migrations, DB uploads, app routes, model-serving endpoints, confidential records or machine commands. The existing GM-MVP-004 catalog still truthfully says zero rows processed **there**; the new offline experiment processes SECOM separately. Do not insert genuine measurements into APIs whose contract accepts synthetic origins only.
