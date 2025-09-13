import math
from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException, Query

router = APIRouter(prefix="/sun", tags=["Sun"])

# Localização fixa (poderia futuramente vir de config ou DB)
LATITUDE = -23.1867  # Exemplo: Botucatu / SP proximidade
LONGITUDE = -48.9870
TIMEZONE_OFFSET = -3  # UTC-3


def _julian_day(d: date) -> float:
    # Fonte: NOAA Solar Calculator (simplificado)
    return d.toordinal() + 1721424.5


def _solar_positions(d: date):
    jd = _julian_day(d)
    n = jd - 2451545.0 + 0.0008
    J_star = n - (LONGITUDE / 360.0)
    M = (357.5291 + 0.98560028 * J_star) % 360
    M_rad = math.radians(M)
    C = (
        1.9148 * math.sin(M_rad)
        + 0.02 * math.sin(2 * M_rad)
        + 0.0003 * math.sin(3 * M_rad)
    )
    lambda_sun = (M + 102.9372 + C + 180) % 360
    lambda_rad = math.radians(lambda_sun)
    J_transit = (
        2451545.0
        + J_star
        + 0.0053 * math.sin(M_rad)
        - 0.0069 * math.sin(2 * lambda_rad)
    )

    # Declinação solar
    delta = math.asin(math.sin(lambda_rad) * math.sin(math.radians(23.44)))

    # Ângulo horário do nascer / pôr do sol (assumindo -0.83° refração + raio solar)
    cos_omega = (
        math.sin(math.radians(-0.83))
        - math.sin(math.radians(LATITUDE)) * math.sin(delta)
    ) / (math.cos(math.radians(LATITUDE)) * math.cos(delta))

    if cos_omega <= -1:
        # Sol 24h acima
        return None, None, 24.0
    if cos_omega >= 1:
        # Sol 24h abaixo
        return None, None, 0.0

    omega = math.degrees(math.acos(cos_omega))

    J_set = J_transit + (omega / 360.0)
    J_rise = J_transit - (omega / 360.0)

    return J_rise, J_set, (2 * omega / 15.0)  # duração em horas


def _julian_to_datetime(j: float) -> datetime:
    # Conversão Julian Day para datetime UTC
    # Fonte: simplificada
    unix_time = (j - 2440587.5) * 86400.0
    return datetime.utcfromtimestamp(unix_time).replace(tzinfo=timezone.utc)


def _apply_tz(dt_utc: datetime) -> datetime:
    return dt_utc.astimezone(timezone(timedelta(hours=TIMEZONE_OFFSET)))


def _format_time(dt: datetime | None) -> str:
    if dt is None:
        return "--:--"
    return dt.strftime("%H:%M")


def _day_payload(d: date):
    J_rise, J_set, daylight_hours = _solar_positions(d)
    if J_rise is None and J_set is None:
        # Caso extremo
        return {
            "date": d.isoformat(),
            "sunrise": None,
            "sunset": None,
            "day_length_hours": daylight_hours,
            "day_length_human": f"{daylight_hours:.2f} h",
        }

    sunrise_local = _apply_tz(_julian_to_datetime(J_rise))
    sunset_local = _apply_tz(_julian_to_datetime(J_set))

    return {
        "date": d.isoformat(),
        "sunrise": sunrise_local.isoformat(),
        "sunset": sunset_local.isoformat(),
        "sunrise_hm": _format_time(sunrise_local),
        "sunset_hm": _format_time(sunset_local),
        "day_length_hours": daylight_hours,
        "day_length_human": f"{daylight_hours:.2f} h",
    }


@router.get("/today")
def sun_today():
    today = date.today()
    return _day_payload(today)


@router.get("/yesterday")
def sun_yesterday():
    y = date.today() - timedelta(days=1)
    return _day_payload(y)


@router.get("/day")
def sun_specific(day: date = Query(..., description="Formato YYYY-MM-DD")):
    try:
        return _day_payload(day)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
