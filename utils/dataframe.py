import io

import pandas as pd
from fastapi.responses import StreamingResponse


def convert_to_df(data: list[dict]):
    return pd.DataFrame(data)


def df_to_csv_bytes(df: pd.DataFrame) -> bytes:
    """Converte DataFrame para bytes de CSV."""
    buffer = io.BytesIO()
    df.to_csv(buffer, index=False)
    buffer.seek(0)  # Volte ao início do buffer
    return buffer


def get_csv_bytes(data: list[dict], filename: str = "data.csv"):
    df = convert_to_df(data)
    df_bytes = df_to_csv_bytes(df)
    return StreamingResponse(
        content=df_bytes,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
