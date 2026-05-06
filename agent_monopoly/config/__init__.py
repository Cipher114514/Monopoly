"""
游戏规则配置模块
"""
from .game_rules import (
    ECONOMY,
    GAME_SETTINGS,
    TILE_TYPES,
    BUILDING_LEVELS,
    SPECIAL_PROPERTY_TYPES,
    NORMAL_PROPERTY_RENTS,
    UTILITY_RENT_MULTIPLIER,
    can_build_house,
    can_upgrade_building,
    is_special_property,
    can_mortgage,
    calculate_bankruptcy,
    calculate_normal_property_rent,
    calculate_utility_rent,
    RULES_SUMMARY,
)

__all__ = [
    "ECONOMY",
    "GAME_SETTINGS",
    "TILE_TYPES",
    "BUILDING_LEVELS",
    "SPECIAL_PROPERTY_TYPES",
    "NORMAL_PROPERTY_RENTS",
    "UTILITY_RENT_MULTIPLIER",
    "can_build_house",
    "can_upgrade_building",
    "is_special_property",
    "can_mortgage",
    "calculate_bankruptcy",
    "calculate_normal_property_rent",
    "calculate_utility_rent",
    "RULES_SUMMARY",
]
