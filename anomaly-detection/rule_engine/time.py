import pandas as pd

class TimeRule:
    def __init__(self, name, if_rule, then_rule, interval_minutes):
        self.name = name
        self.if_rule = if_rule
        self.then_rule = then_rule
        self.interval = pd.Timedelta(minutes=interval_minutes)

    def match(self, df: pd.DataFrame) -> pd.Series:
        df.sort_values(["User", "Datetime"], inplace=True)

        match_result = pd.Series(False, index=df.index, name=self.name)

        for user, user_df in df.groupby("User"):
            if_rows = user_df[self.if_rule.match(user_df)]
            for idx, row in if_rows.iterrows():
                start_time = idx
                end_time = start_time + self.interval
                window_df = user_df[(user_df.index > start_time) & (user_df.index <= end_time)]
                if not self.then_rule.match(window_df).any():
                    match_result.loc[window_df.index] = True  # No THEN match → anomaly

        match_result.sort_index(inplace=True)
        df.sort_index(inplace=True)
        return match_result
