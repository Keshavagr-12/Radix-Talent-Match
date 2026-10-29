"""
Backward-compatibility alias for evaluation_storage_service.
All evaluations are persisted to local/central JSON storage.
"""

from core.evaluation_storage_service import save_talent_evaluation, list_evaluations

__all__ = ["save_talent_evaluation", "list_evaluations"]
