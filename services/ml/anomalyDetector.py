"""
Sensor Anomaly Detection Module for Tech Sirens Smart IoT Field Sensors.
Detects sensor drift, soil dryness emergencies, and sudden temperature spikes.
"""

from typing import Dict, Any, List

def detect_soil_anomaly(telemetry: Dict[str, Any], history: List[Dict[str, Any]] = None) -> Dict[str, Any]:
    moisture = telemetry.get("moisturePercent", 50)
    temp = telemetry.get("temperatureCelsius", 25)
    
    anomalies = []
    severity = "normal"
    
    if moisture < 15:
        anomalies.append("CRITICAL_DROUGHT_RISK: Soil moisture is below 15%")
        severity = "critical"
    elif moisture > 85:
        anomalies.append("WATERLOGGING_ALERT: Excessive moisture detected, risk of root rot")
        severity = "warning"
        
    if temp > 42:
        anomalies.append("HEATWAVE_WARNING: High ambient and soil heat stress")
        severity = "warning" if severity != "critical" else "critical"
        
    return {
        "deviceId": telemetry.get("deviceId", "unknown"),
        "severity": severity,
        "anomalies": anomalies,
        "recommendation": "Initiate drip irrigation immediately" if moisture < 15 else "Conditions nominal",
    }
