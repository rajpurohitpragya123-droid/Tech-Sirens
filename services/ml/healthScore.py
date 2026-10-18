"""
Crop Health Scoring Algorithm.
Calculates overall field health score (0-100) based on NPK, pH, and soil moisture.
"""

def calculate_crop_health_score(moisture: float, ph: float, n: float, p: float, k: float) -> float:
    score = 100.0
    
    # Moisture score (ideal 40-70%)
    if moisture < 40:
        score -= (40 - moisture) * 1.2
    elif moisture > 70:
        score -= (moisture - 70) * 0.8
        
    # pH score (ideal 6.0 - 7.5)
    if ph < 6.0:
        score -= (6.0 - ph) * 8.0
    elif ph > 7.5:
        score -= (ph - 7.5) * 8.0
        
    # NPK balance checks
    if n < 20 or p < 15 or k < 20:
        score -= 10.0
        
    return max(0.0, min(100.0, round(score, 1)))
