import json
import re
from datetime import date, datetime
from pathlib import Path
from typing import Any

DEFAULT_RULES_PATH = Path(__file__).resolve().parents[2] / "rules.json"


def load_rules(path: Path = DEFAULT_RULES_PATH) -> list[dict[str, Any]]:
    with path.open(encoding="utf-8") as rules_file:
        return json.load(rules_file)["rules"]


def _value(fields: dict[str, Any], field_name: str) -> Any:
    field = fields.get(field_name)
    return field.get("value") if isinstance(field, dict) else field


def _parse_declared_date(value: Any) -> date | None:
    if not isinstance(value, str):
        return None
    for pattern in (
        "%d/%m/%Y", "%d-%m-%Y", "%d/%m/%y", "%d-%m-%y",
        "%Y/%m/%d", "%Y-%m-%d", "%m/%Y", "%m-%Y",
    ):
        try:
            return datetime.strptime(value.strip(), pattern).date()
        except ValueError:
            continue
    return None


def _evaluate_check(check: dict[str, Any], fields: dict[str, Any]) -> bool | None:
    """Evaluate a declarative check. None means there is not enough evidence."""
    actual = _value(fields, check["field"])
    operator = check["operator"]
    if operator == "present":
        return actual is not None and str(actual).strip() != ""
    if actual is None:
        return None
    if operator == "regex":
        return re.fullmatch(check["pattern"], str(actual)) is not None
    if operator == "equals":
        return actual == check["value"]
    if operator == "equals_field":
        other = _value(fields, check["other_field"])
        return None if other is None else actual == other
    if operator == "date_after_field":
        other = _value(fields, check["other_field"])
        actual_date = _parse_declared_date(actual)
        other_date = _parse_declared_date(other)
        return None if actual_date is None or other_date is None else actual_date > other_date
    if operator == "number_between":
        try:
            value = float(actual)
        except (TypeError, ValueError):
            return False
        return check.get("minimum", float("-inf")) <= value <= check.get("maximum", float("inf"))
    raise ValueError(f"Unsupported rule operator: {operator}")


def _applies(rule: dict[str, Any], is_food: bool) -> bool:
    classification = rule.get("classification", "any")
    return classification == "any" or (classification == "food" and is_food) or (
        classification == "non_food" and not is_food
    )


def evaluate_rules(
    fields: dict[str, Any],
    is_food: bool,
    ocr_confidence: float,
    rules: list[dict[str, Any]] | None = None,
    confidence_threshold: float = 0.55,
) -> list[dict[str, Any]]:
    results = []
    for rule in rules if rules is not None else load_rules():
        if not _applies(rule, is_food):
            status = "SKIPPED"
        else:
            outcomes = [_evaluate_check(check, fields) for check in rule["checks"]]
            uncertain = ocr_confidence < confidence_threshold or any(
                outcome is None for outcome in outcomes
            )
            uncertain = uncertain or any(
                isinstance(fields.get(field_name), dict)
                and (
                    fields[field_name].get("confidence", 0.0) < confidence_threshold
                    or fields[field_name].get("ambiguous", False)
                )
                for check in rule["checks"]
                for field_name in (
                    {check["field"]}
                    | ({check["other_field"]} if "other_field" in check else set())
                )
            )
            status = (
                "NEEDS_REVIEW"
                if uncertain
                else "PASS"
                if all(outcomes)
                else "FAIL"
            )
        extracted_values = {
            check["field"]: _value(fields, check["field"]) for check in rule["checks"]
        }
        results.append(
            {
                "rule_id": rule["id"],
                "name": rule["name"],
                "status": status,
                "severity": rule["severity"],
                "message": rule["guidance"],
                "extracted_value": next(iter(extracted_values.values()), None),
                "legal_source": rule["legal_source"],
            }
        )
    return results


def summarize_results(results: list[dict[str, Any]]) -> tuple[str, float]:
    applicable = [result for result in results if result["status"] != "SKIPPED"]
    if not applicable:
        return "NEEDS_REVIEW", 0.0
    failed = sum(result["status"] == "FAIL" for result in applicable)
    review = sum(result["status"] == "NEEDS_REVIEW" for result in results)
    score = round(
        sum(result["status"] == "PASS" for result in applicable) / len(applicable), 4
    )
    overall = "NEEDS_REVIEW" if review else "NON_COMPLIANT" if failed else "COMPLIANT"
    return overall, score
