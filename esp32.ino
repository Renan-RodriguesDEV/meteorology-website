#include <WiFi.h>
#include <HTTPClient.h>
#include "DHT.h"

#define DHTPIN 4
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

const char *ssid = "SEU_SSID";
const char *password = "SUA_SENHA";
const char *SERVER_URL = "http://192.168.1.10:8000/api/readings";

const unsigned long INTERVAL = 5UL * 60UL * 1000UL; // 5 minutos
unsigned long lastSend = 0;

void setup()
{
    Serial.begin(115200);
    dht.begin();
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED)
    {
        delay(500);
        Serial.print(".");
    }
    Serial.println("WiFi conectado!");
    lastSend = millis() - INTERVAL; // força envio inicial
}

void loop()
{
    if (millis() - lastSend >= INTERVAL)
    {
        lastSend = millis();
        sendData();
    }
    delay(100);
}

void sendData()
{
    float h = dht.readHumidity();
    float t = dht.readTemperature();
    if (isnan(h) || isnan(t))
    {
        Serial.println("Falha leitura DHT!");
        return;
    }

    String json = "{\"temperature\":" + String(t, 1) + ",\"humidity\":" + String(h, 1) + "}";

    if (WiFi.status() == WL_CONNECTED)
    {
        HTTPClient http;
        http.begin(SERVER_URL);
        http.addHeader("Content-Type", "application/json");
        int code = http.POST(json);
        Serial.print("Resposta: ");
        Serial.println(code);
        http.end();
    }
}
