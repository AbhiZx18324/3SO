import re
from .plain import PlainRule
from .time import TimeRule
from .relation import RelationRule
from datetime import time, datetime, timedelta

class RuleFactory:
    @staticmethod
    def from_string(rule_str: str):
        rule_str = rule_str.strip().replace("\n", "")
        if "IF(" in rule_str and ("KEIN(" in rule_str or "THEN(" in rule_str):
            return RuleFactory._parse_time_rule(rule_str)
        elif "FIRST(" in rule_str and "SECOND(" in rule_str:
            return RuleFactory._parse_relation_rule(rule_str)
        else:
            return RuleFactory._parse_plain_rule(rule_str)
        
    @staticmethod
    def parse_time_range(interval_str):
        start_str, end_str = interval_str.split("-")
        start_time = time.fromisoformat(start_str.strip())
        end_time = time.fromisoformat(end_str.strip())
        return start_time, end_time

    @staticmethod
    def _parse_plain_rule(rule_str):
        tokens = rule_str.strip().split(";")
        name = "Unnamed"
        rule = {}
        for token in tokens:
            if token.startswith("NAME="):
                name = token.split("=")[1]           
            elif "=" in token:
                key, value = token.split("=")
                if key == "RESET":
                    reset_value, reset_unit = value.split(',')
                    reset_delta = {
                        "MINUTE": timedelta(minutes=1),
                        "HOUR": timedelta(hours=1),
                        "DAY": timedelta(days=1),
                        "WEEK": timedelta(weeks=1)
                    }.get(reset_unit.upper(), timedelta(days=1)) * int(reset_value)
                    rule["RESET_DELTA"] = reset_delta
                elif key == "INTERVAL":
                    start_str, end_str = value.split("-")
                    start_time = time.fromisoformat(start_str.strip())
                    end_time = time.fromisoformat(end_str.strip())
                    rule["START_TIME"], rule["END_TIME"] = start_time, end_time
                else:
                    rule[key] = value
            elif ">" in token or "<" in token:
                rule["EVENT_CONDITION"] = token.strip()
        return PlainRule(name, rule)

    @staticmethod
    def _parse_time_rule(rule_str):
        name = re.search(r"NAME=([^;]+)", rule_str).group(1)
        if_block = re.search(r"IF\(([^)]+)\)", rule_str).group(1)
        second_type = "KEIN" if "KEIN(" in rule_str else "THEN"
        then_block = re.search(rf"{second_type}\(([^)]+)\)", rule_str).group(1)
        interval_raw = re.search(r"\)IN\(([^)]+)\)", rule_str).group(1)

        interval_val, interval_unit = interval_raw.split(",")
        interval_minutes = RuleFactory._convert_to_minutes(int(interval_val), interval_unit)

        if_rule = RuleFactory._parse_plain_rule(if_block)
        then_rule = RuleFactory._parse_plain_rule(then_block)

        return TimeRule(name, if_rule, then_rule, interval_minutes)

    @staticmethod
    def _parse_relation_rule(rule_str):
        name = re.search(r"NAME=([^;]+)", rule_str).group(1)
        first_block = re.search(r"FIRST\(([^)]+)\)", rule_str).group(1)
        second_block = re.search(r"SECOND\(([^)]+)\)", rule_str).group(1)
        reset_match = re.search(r"RESET=(\d+),(\w+)", rule_str)
        interval_minutes = RuleFactory._convert_to_minutes(int(reset_match.group(1)), reset_match.group(2)) if reset_match else 240
        threshold = float(re.search(r"THRESHOLD=([^;]+)", rule_str).group(1))

        first_rule = RuleFactory._parse_plain_rule(first_block)
        second_rule = RuleFactory._parse_plain_rule(second_block)
        
        return RelationRule(name, first_rule, second_rule, interval_minutes, threshold)

    @staticmethod
    def _convert_to_minutes(value, unit):
        unit = unit.upper()
        return {
            "MINUTE": 1,
            "HOUR": 60,
            "DAY": 1440,
            "WEEK": 10080
        }[unit] * value
