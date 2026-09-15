from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
import logging

class BaseAgent(ABC):
    """
    Base class for all JA Assure marketing agents.
    Provides standard execution lifecycle, logging, and metrics hooks.
    """

    def __init__(self, name: str, brand: Optional[str] = None):
        self.name = name
        self.brand = brand
        self.logger = logging.getLogger(f"ja_assure.agents.{name}")

    @abstractmethod
    async def run(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute agent task with input dictionary and return structured dictionary output.
        """
        pass

    def log_event(self, event_type: str, details: Dict[str, Any]):
        self.logger.info(f"[{self.name}] Event: {event_type} | Data: {details}")
