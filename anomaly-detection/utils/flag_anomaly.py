import pandas as pd

def manual_check(result_file : str):
    ...

def or_based(result_file : str):
    ano_df = pd.read_csv(result_file)
    ano_df['Datetime'] = pd.to_datetime(ano_df['Datetime'])
    ano_df.set_index('Datetime', inplace=True)

    rule_cols = ano_df.columns[4:]
    ano_df['Anomaly'] = False
    for col in rule_cols:
        ano_df['Anomaly'] |= ano_df[col]

    return ano_df