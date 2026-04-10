import heapq
from math import dist

from app.models.hazard import Hazard


class OptimizationEngine:
    """A small A* planner over a coarse grid that avoids active hazard areas."""

    def __init__(self, width: int = 100, height: int = 100):
        self.width = width
        self.height = height

    def _neighbors(self, node: tuple[int, int]) -> list[tuple[int, int]]:
        x, y = node
        directions = [(-1, 0), (1, 0), (0, -1), (0, 1)]
        neighbors: list[tuple[int, int]] = []
        for dx, dy in directions:
            nx, ny = x + dx, y + dy
            if 0 <= nx < self.width and 0 <= ny < self.height:
                neighbors.append((nx, ny))
        return neighbors

    def _blocked(self, node: tuple[int, int], hazards: list[Hazard]) -> bool:
        x, y = node
        for hazard in hazards:
            if hazard.radius is None:
                continue
            if dist([x, y], [hazard.center_x, hazard.center_y]) <= hazard.radius:
                return True
        return False

    def safer_route(
        self,
        start: tuple[int, int],
        target: tuple[int, int],
        hazards: list[Hazard],
    ) -> list[tuple[int, int]]:
        if self._blocked(start, hazards) or self._blocked(target, hazards):
            return []

        open_heap: list[tuple[float, tuple[int, int]]] = []
        heapq.heappush(open_heap, (0, start))

        came_from: dict[tuple[int, int], tuple[int, int] | None] = {start: None}
        g_score: dict[tuple[int, int], float] = {start: 0.0}

        while open_heap:
            _, current = heapq.heappop(open_heap)
            if current == target:
                break

            for neighbor in self._neighbors(current):
                if self._blocked(neighbor, hazards):
                    continue

                tentative_g = g_score[current] + 1.0
                if tentative_g < g_score.get(neighbor, float("inf")):
                    g_score[neighbor] = tentative_g
                    priority = tentative_g + dist([neighbor[0], neighbor[1]], [target[0], target[1]])
                    heapq.heappush(open_heap, (priority, neighbor))
                    came_from[neighbor] = current

        if target not in came_from:
            return []

        path = [target]
        current = target
        while came_from[current] is not None:
            current = came_from[current]  # type: ignore[index]
            path.append(current)

        path.reverse()
        return path
