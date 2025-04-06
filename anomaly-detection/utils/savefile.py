import pandas as pd

def savefile(df : pd.DataFrame, savepath : str):
    try:
        df.to_csv(savepath)
        print(f"DataFrame saved to {savepath}")
    except Exception as e:
        print(f"An error occurred while saving the DataFrame: {e}")