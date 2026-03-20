<h1><img src="https://readme-typing-svg.herokuapp.com?font=Fira+Code&weight=700&size=28&duration=6000&pause=100000&color=FFFFFF&center=false&vCenter=true&repeat=false&width=750&lines=AI+Powered+Insurance+for+India’s+Gig+Economy" alt="AI-Powered Insurance for India’s Gig Economy" /></a></h1>

[![Hackathon](https://img.shields.io/badge/Event-Guidewire_DEVTrails_2026-purple.svg)]()
[![Team](https://img.shields.io/badge/Team-Devtrailers-blue.svg)]()
[![Status](https://img.shields.io/badge/Status-Ideation_Phase-orange.svg)]()

## **The Problem We’re Solving**

>Platform-based delivery partners in India experience significant and recurring income loss due to external disruptions such as extreme weather, high pollution levels, and natural disasters, which directly reduce their working hours and earning opportunities. Despite being critical to the digital economy, they lack any formal income protection or insurance mechanisms, leaving them financially vulnerable and solely responsible for losses caused by factors beyond their control.


## **Solution Overview**

> We are building a **mobile-first platform** that enables enrollment, coverage management, real-time monitoring, and automated payouts through a unified interface.
>
> The system operates on a **weekly subscription model**, where coverage is dynamically priced based on real-time risk signals.
>
> The application collects and processes key inputs such as **geolocation, device metadata, and activity patterns**, and integrates external data sources including weather APIs, AQI feeds, and official government announcements.
>
> To ensure data integrity, the platform incorporates a **dedicated signal integrity layer with controlled access to location and device-level signals during active sessions**, reducing the risk of manipulation, and synthetic activity.
>
> From a functional standpoint, the platform provides:
>
> - Coverage activation and subscription management
> - Real-time risk and disruption monitoring
> - Proactive risk insights and worker guidance
> - Automatic event detection and validation
> - Instant payout execution without manual claims
>
> This application layer interfaces with backend systems responsible for **signal validation, risk modeling, event verification, fraud detection, advisory intelligence, and payout automation**.


## **System Flow**

>| # | Component | Description | Location |
>| :-- | :--- | :--- | :--- |
>| 1 | **Solution Architecture** | Detailed breakdown of all components and their roles within the overall system design. | [`docs/Solution_architecture.md`](./docs/Solution_architecture.md) |

<p align="center">
  <img src="assets/system_flow.png" width="500">
<p>

> The platform operates through a structured pipeline in which **real-time disruption signals are detected, validated, and transformed into actionable insurance events**.
>
> It begins by collecting **device and external signals**, which are validated through a **signal integrity layer** to ensure authenticity. Verified inputs are processed by **AI models** to detect and confirm disruption events such as weather anomalies, pollution spikes, or curfews.
>
> These signals feed into a **dynamic risk engine** for pricing, while a **graph-based fraud layer** identifies suspicious behavior. The system also provides **proactive guidance** to help workers avoid high-risk situations.
>
> When a valid event is detected, **parametric payouts are triggered automatically**, with all actions recorded in an **audit layer** for transparency.


## **Pricing Model Overview** 

>The system utilizes a **Weekly Predictive Underwriting** approach. Unlike traditional insurance models relying on static historical averages, our system calculates premiums based on **Real-Time Risk Probability (RRP)** and **Individualized Earnings Potential (IEP)** for the upcoming seven-day window.
>
>The objective is to neutralize the financial impact of external disruptions (Environmental, Regulatory, or Macro-economic) through hyper-localized pricing.
>
>>## *Formula*
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
>>---
>| # | Component | Description | Location |
>| :-- | :--- | :--- | :--- |
>| 2 | **Pricing Model** | Explains how weekly premiums are calculated using predicted income loss, risk factors, and AI-driven adjustments.| [`docs/Pricing_Model.md`](./docs/Pricing_Model.md) |

## **Adversarial Defense & Anti-Spoofing Strategy Overview**

>The system is already well designed to defend against **coordinated “Market Crash” attacks**, where large fraud rings simulate disruption events to drain parametric insurance pools.
>
>At its core is a **graph-based detection layer (R-GCN)**, which performs the majority of fraud identification by analyzing **relationships between workers, devices, networks, and payout channels**. This enables detection of **synthetic clusters (fraud rings)** even when individual signals appear legitimate.
>
>To further improve robustness and handle edge cases, two additional defense layers are introduced:
>
>- **Layer 1 (Device & Signal Integrity):** Validates that inputs originate from authentic hardware and consistent physical behavior.
>- **Layer 3 (Temporal Coordination Analysis):** Identifies synchronized activity patterns indicative of automated, large-scale attacks.
>
>This **three-layer architecture** ensures that:
>
>>- Spoofed or tampered signals are filtered at the **device level** 
>>- Fraud is detected **structurally** through graph relationships, and
>>- Coordinated attacks are exposed via **temporal anomalies**.
>
>By combining these independent validation layers, the system achieves **strong adversarial resilience**.
>| # | Component | Description | Location |
>| :-- | :--- | :--- | :--- |
>| 3 | **Market Crash Defense** | Detailed Explantion of three-layer fraud defense strategy combining device integrity, graph-based ring detection (R-GCN), and temporal analysis to mitigate coordinated spoofing attacks. | [`docs/Market_Crash_Defense.md`](./docs/Market_Crash_Defense.md) |
>| 4 | **Literature Review** | Analysis of anti-spoofing research and prior work, whose insights are adapted using transfer learning to strengthen the system’s fraud detection capabilities. | [`docs/Literature_Review.md`](./docs/Literature_Review.md) |

## Innovation 
<p align="center">
  <img src="assets/innovation.png" width="500">
<p>

>| # | Component | Description | Location |
>| :-- | :--- | :--- | :--- |
>| 5 | **Innovation** | Highlighting our key innovations across both technical architecture and product features. | [`docs/Innovation.md`](./docs/Innovation.md) |


## Planned Tech Stack

>### AI / Machine Learning
>>| Technology | Category | Role in System |
>>| :--- | :--- | :--- |
>>| **DeepAR / TFT** | Forecasting | weekly disruption probability forecasting |
>>| **XGBoost** | ML Model | MVP Model |
>>| **R-GCN** | Fraud Detection | Core graph-based fraud ring detection |
>>| **T-GNN** | Fraud Detection | Detects synchronized or scripted payout attacks via temporal coordination analysis |
>>| **BERT** | Signal Processing | Parses local news and government announcements for curfew or disruption signals |
>
>---
>
>### Application Platform
>>| Technology | Category | Role in System |
>>| :--- | :--- | :--- |
>>| **Flutter** | Mobile Application | Enrollment, coverage management, monitoring, and payout interface |
>>| **Python** | Backend | Acts as a bridge, receiving requests from the Flutter app and querying the database |
>>| **SHA-256** | Hashing | Immutable log of all signal validations, event detections, and payout executions |
>>| **JWTs** | Security | Controlled session-level access to location and device signals to prevent manipulation |
>
>---
>
>### Data Infrastructure and Engineering 
>>| Technology | Category | Role in System |
>>| :--- | :--- | :--- |
>>| **PostgreSQL** | DB | Store information and sync it across devices |
>>| **PostGIS** | Geospatial DB | Stores and queries spatial risk zone data |
>>| **H3 Index** | Spatial Indexing | Hexagonal binning of risk zones for hyper-local pricing using grid system |
>>| **Feast** | Feature Store | Real-time serving of historical earnings features for the pricing engine |
>>| **Prefect / Airflow** | Orchestration | Schedules weather and AQI data ingestion pipelines |
>>| **BentoML** | Inference Engine | Serves XGBoost and TFT models in production |
>
>---
>
>### External Data Sources
>>| Technology | Category | Role in System |
>>| :--- | :--- | :--- |
>>| **IMD Satellite Data** | Weather API | Primary weather feed for the disruption probability model |
>>| **CPCB Sensor Grids** | AQI Feed | Air quality index data for pollution-based disruption detection |
>>| **Government Announcements** | Regulatory Feed | Automatically detects curfews, lockdowns, and public safety events |

---

## Resource Mapping

| # | Component | Description | Location |
| :-- | :--- | :--- | :--- |
| 1 | **Solution Architecture** | Detailed breakdown of all components and their roles within the overall system design. | [`docs/Solution_architecture.md`](./docs/Solution_architecture.md) |
| 2 | **Pricing Model** | Explains how weekly premiums are calculated using predicted income loss, risk factors, and AI-driven adjustments.| [`docs/Pricing_Model.md`](./docs/Pricing_Model.md) |
| 3 | **Market Crash Defense** | Detailed Explantion of three-layer fraud defense strategy combining device integrity, graph-based ring detection (R-GCN), and temporal analysis to mitigate coordinated spoofing attacks. | [`docs/Market_Crash_Defense.md`](./docs/Market_Crash_Defense.md) |
| 4 | **Literature Review** | Analysis of anti-spoofing research and prior work, whose insights are adapted using transfer learning to strengthen the system’s fraud detection capabilities. | [`docs/Literature_Review.md`](./docs/Literature_Review.md) |
| 5 | **Innovation** | Highlighting our key innovations across both technical architecture and product features. | [`docs/Innovation.md`](./docs/Innovation.md) |

---