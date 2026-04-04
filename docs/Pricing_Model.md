# Pricing Model 

## Actuarial Overview
The system utilizes a **Weekly Predictive Underwriting** approach. Unlike traditional insurance models relying on static historical averages, our system calculates premiums based on **Real-Time Risk Probability (RRP)** and **Individualized Earnings Potential (IEP)** for the upcoming seven-day window.

The objective is to neutralize the financial impact of external disruptions (Environmental, Regulatory, or Macro-economic) through hyper-localized pricing.


## 1. Advanced Premium Calculation

The premium is a function of systemic risk and individual worker behavior.

>>## *Actuarial Formula*
>>
>>$$P_w = \left( \frac{(L_e \cdot V_s) \cdot \Phi_r}{K} \right) \cdot (1 + M)$$
>>
>>**Variables:**
>>- $P_w$: Weekly Premium
>>- $L_e$: Expected Income Loss (Base)
>>- $V_s$: Spatio-Temporal Volatility Score (Local risk variance)
>>- $\Phi_r$: Worker Reliability Multiplier (Historical engagement index)
>>- $K$: Risk Pool Normalization Factor (converts individual risk into pooled, affordable pricing)
>>- $M$: Operational Margin (22% – 34%)

## 2. Refining Expected Income Loss ($L_e$)

Instead of simple disruption hours, the model calculates the **Opportunity Cost of Lost Shifts**.
>>## *Formula*
>>
>>$$L_e = \sum_{d=1}^{7} (H_{pred} \cdot E_{hourly} \cdot P_{dist})$$
>>
>>- **$H_{pred}$:** Predicted hours lost based on ensemble weather/AQI/Civil disturbance models.
>>- **$E_{hourly}$:** Weighted average earnings for specific day/time slots over the last 90 days.
>>- **$P_{dist}$:** Probability of disruption intensity (Weights: Yellow alert = 0.4, Red alert = 0.9).


## 3. Dynamic Risk Coefficient ($\Phi_r$)

To prevent adverse selection, the model adjusts based on individual performance data:
>>- **High-Engagement Workers:** $\Phi_r = 0.85 - 0.95$ (Consistency discount).
>>- **Intermittent/New Workers:** $\Phi_r = 1.10 - 1.25$ (Uncertainty buffer).


## 4. Income-Linked Payout Architecture

The payout mechanism operates as a **Gap Coverage** model, using a **Validation Layer** to distinguish between external disruption and voluntary idle time.

>>### Payout Calculation
>>$$Payout = \min(L_{actual}, \text{Coverage Cap}) \times \Omega$$
>>
>>- **$\Omega$ (Validation Coefficient):** Derived by comparing "App Online" telemetry against the disruption window. Payouts are prorated if the worker was not active during the disruption period.
>>
>>**Example Scenario:**
>>| Metric | Value |
>>| :--- | :--- |
>>| Predicted Weekly Earnings | ₹7,000 |
>>| Actual Weekly Earnings | ₹4,500 |
>>| Gross Loss | ₹2,500 |
>>| Attributable Disruption (80%) | ₹2,000 |
>>| **Final Payout (75% Coverage)** | **₹1,500** |


## 5. AI/ML Integration

### Layer 1: Spatio-Temporal Forecasting
* **Model:** DeepAR (GluonTS) / Temporal Fusion Transformers (TFT).
* **Input:** Multi-source feeds (IMD satellite data, CPCB sensor grids, NLP for local news).
* **Output:** 7-day disruption probability grid (500m x 500m resolution).

### Layer 2: Behavioral Earnings Projection
* **Model:** Quantile Regression Forests.
* **Function:** Predicts earning ranges (10th to 90th percentile) to account for market saturation and seasonal demand.

### Layer 3: Automated Retraining (MLOps)
* **Feedback Loop:** Weekly Actual vs. Predicted (AvP) variance is processed. If AvP exceeds 15%, an automated hyperparameter optimization (HPO) cycle is triggered.


## 6. Technical Stack

| Component | Technology |
| :--- | :--- |
| **Feature Store** | Feast (Real-time serving of historical earnings) |
| **Orchestration** | Prefect / Airflow (Weather data ingestion) |
| **Inference Engine** | BentoML (XGBoost & TFT model serving) |
| **Geospatial Data** | PostGIS / H3 Index (Hexagonal binning of risk zones) |
| **Monitoring** | WhyLabs / Evidently AI (Data/Concept drift detection) |


## 7. Strategic Profitability

To maintain a **Target Loss Ratio of 45%**, the engine employs **Adaptive Margin Scaling**:

1.  **Low Volatility:** Margins are lowered to drive adoption ($M = 20\%$).
2.  **High Volatility:** Margins increase during peak monsoon or festival seasons to build claims reserves ($M = 35\%$).
3.  **Stop-Loss Trigger:** If total claims in a specific zone exceed 80% of the premium pool, the engine shifts to conservative underwriting for new enrollments.