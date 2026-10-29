
from core.benchmark_loader import get_company_benchmarks


def test_load_google_benchmarks():
    benchmarks = get_company_benchmarks("Google")

    assert isinstance(benchmarks, dict)
    assert len(benchmarks) > 0
