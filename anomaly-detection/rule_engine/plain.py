import pandas as pd
import re

class PlainRule:
    def __init__(self, name, rules):
        self.name = name
        self.rules = rules

    def match(self, df: pd.DataFrame) -> pd.Series:
        cond = pd.Series(True, index=df.index, name=self.name)
        t_only = df.index.time
        start_t = ''
        end_t = ''
        for key, val in self.rules.items():
            if key == "USER":
                cond &= df["User"].apply(lambda user: bool(re.match(val, user)))
            elif key == "PROCESS":
                cond &= df["Process"].str.upper() == val
            elif key == "FKL-PROCESS":
                lower_limit, upper_limit = map(int, val.split(","))
                cond &= (df["FKL_Process"] >= lower_limit) & (df["FKL_Process"] <= upper_limit)
            elif key == "START_TIME":
                start_t = val
            elif key == "END_TIME":
                end_t = val
                 
        if (start_t and end_t):
            if start_t < end_t:
                cond &= (start_t <= t_only) & (t_only <= end_t)
            else:
                cond &= (t_only >= start_t) | (t_only <= end_t) # crosses midnight

        df.sort_index(inplace=True)
        return cond
