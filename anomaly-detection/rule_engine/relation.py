import pandas as pd

class RelationRule:
    def __init__(self, name : str, first_rule : str, second_rule : str, interval_minutes : int, threshold : int = 0.5):
        self.name = name
        self.first_rule = first_rule
        self.second_rule = second_rule
        self.interval = pd.Timedelta(minutes=interval_minutes)
        self.threshold = threshold

    def match(self, df: pd.DataFrame) -> pd.Series:
        '''
        If anomaly occurs in a bucket, 
        all the timestamps in the dataset having timestamp within the bucket get marked
        '''
        match_series = pd.Series(False, index=df.index, name = self.name)
        start_time = df.index.min()
        end_time = df.index.max()

        while start_time < end_time:
            window_end = start_time + self.interval
            window_df = df[(df.index >= start_time) & (df.index < window_end)]

            first_count = self.first_rule.match(window_df).sum()
            second_count = self.second_rule.match(window_df).sum()

            if second_count > 0:
                ratio = first_count / second_count
                if ratio > self.threshold:
                    match_series.loc[window_df.index] = True

            start_time = window_end
        df.sort_index(inplace=True)
        return match_series
