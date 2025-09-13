from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from database.configs.database import get_session

router = APIRouter(prefix="/means", tags=["means"])


@router.get("/stats/15d")
def stats_15d(session: Session = Depends(get_session)):
    try:
        query = text("""
                     SELECT 
                        AVG(temperature) as temp_avg,
                        MIN(temperature) as temp_min, 
                        MAX(temperature) as temp_max,
                        AVG(humidity) as hum_avg,
                        MIN(humidity) as hum_min,
                        MAX(humidity) as hum_max,
                        COUNT(*) as count
                     FROM readings 
                     WHERE timestamp >= NOW() - INTERVAL 15 DAY
                     """)
        result = session.execute(query)
        stats = result.mappings().first()

        if stats and stats["count"] > 0:
            # Calcular evapotranspiração média
            eto_avg = calculate_eto(float(stats["temp_avg"]), float(stats["hum_avg"]))

            return {
                "temperature": {
                    "avg": round(float(stats["temp_avg"]), 2),
                    "min": round(float(stats["temp_min"]), 2),
                    "max": round(float(stats["temp_max"]), 2),
                },
                "humidity": {
                    "avg": round(float(stats["hum_avg"]), 2),
                    "min": round(float(stats["hum_min"]), 2),
                    "max": round(float(stats["hum_max"]), 2),
                },
                "evapotranspiration": {"avg": round(eto_avg, 3)},
                "period": "15d",
                "count": int(stats["count"]),
            }
        else:
            return {"error": "No data available for the last 15 days"}
    except Exception as e:
        print(f"Error in stats_15d: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/stats/30d")
def stats_30d(session: Session = Depends(get_session)):
    try:
        query = text("""
                     SELECT 
                        AVG(temperature) as temp_avg,
                        MIN(temperature) as temp_min, 
                        MAX(temperature) as temp_max,
                        AVG(humidity) as hum_avg,
                        MIN(humidity) as hum_min,
                        MAX(humidity) as hum_max,
                        COUNT(*) as count
                     FROM readings 
                     WHERE timestamp >= NOW() - INTERVAL 30 DAY
                     """)
        result = session.execute(query)
        stats = result.mappings().first()

        if stats and stats["count"] > 0:
            # Calcular evapotranspiração média
            eto_avg = calculate_eto(float(stats["temp_avg"]), float(stats["hum_avg"]))

            return {
                "temperature": {
                    "avg": round(float(stats["temp_avg"]), 2),
                    "min": round(float(stats["temp_min"]), 2),
                    "max": round(float(stats["temp_max"]), 2),
                },
                "humidity": {
                    "avg": round(float(stats["hum_avg"]), 2),
                    "min": round(float(stats["hum_min"]), 2),
                    "max": round(float(stats["hum_max"]), 2),
                },
                "evapotranspiration": {"avg": round(eto_avg, 3)},
                "period": "30d",
                "count": int(stats["count"]),
            }
        else:
            return {"error": "No data available for the last 30 days"}
    except Exception as e:
        print(f"Error in stats_30d: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/evapotranspiration/{period}")
def evapotranspiration_daily(period: str, session: Session = Depends(get_session)):
    try:
        if period not in ["15d", "30d"]:
            raise HTTPException(status_code=400, detail="Period must be 15d or 30d")

        days = 15 if period == "15d" else 30

        query = text(f"""
                     SELECT 
                        DATE(timestamp) as date,
                        AVG(temperature) as temp_avg,
                        AVG(humidity) as hum_avg
                     FROM readings 
                     WHERE timestamp >= NOW() - INTERVAL {days} DAY
                     GROUP BY DATE(timestamp)
                     ORDER BY date ASC
                     """)

        result = session.execute(query)
        daily_data = result.mappings().all()

        eto_data = []
        for day in daily_data:
            eto_value = calculate_eto(float(day["temp_avg"]), float(day["hum_avg"]))
            eto_data.append(
                {
                    "date": day["date"].isoformat(),
                    "temperature": round(float(day["temp_avg"]), 2),
                    "humidity": round(float(day["hum_avg"]), 2),
                    "evapotranspiration": round(eto_value, 3),
                }
            )

        return eto_data
    except Exception as e:
        print(f"Error in evapotranspiration_daily: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


def calculate_eto(temp_celsius, humidity_percent):
    """
    Calcula a evapotranspiração de referência usando método simplificado
    baseado em temperatura e umidade relativa
    """
    try:
        # Método simplificado de Blaney-Criddle modificado
        # ETo = p * (0.46 * T_mean + 8.13) * k_humidity

        # Fator de correção da umidade
        humidity_factor = 1.0 - (humidity_percent / 100.0) * 0.3

        # Fator mensal simplificado (assumindo média anual)
        p_factor = 0.27  # valor médio aproximado

        # Cálculo da ETo em mm/dia
        eto = p_factor * (0.46 * temp_celsius + 8.13) * humidity_factor

        # Limitar valores extremos
        if eto < 0:
            eto = 0
        elif eto > 15:  # limite máximo razoável
            eto = 15

        return eto
    except Exception:
        return 0.0
