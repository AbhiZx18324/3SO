import pandas as pd
from rule_engine.factory import RuleFactory

def read_lines_from_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as file:
            lines = [line.rstrip('\n') for line in file]
        return lines
    except FileNotFoundError:
        print(f"Error: File not found at {filepath}")
        return []
    except Exception as e:
        print(f"An error occurred: {e}")
        return []
    
def detect_anomalies_RB(log_file : str, rules_file : str):
    df = pd.read_csv(log_file)
    df['Datetime'] = pd.to_datetime(df['Datetime'])
    df.set_index('Datetime', inplace=True)
    
    rules = [RuleFactory.from_string(rule) for rule in read_lines_from_file(rules_file)]

    matches = [rule.match(df) for rule in rules]
    for match in matches:
        df[match.name] = match

    return df
