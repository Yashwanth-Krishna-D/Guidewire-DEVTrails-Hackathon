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

## Resource Mapping

| # | Component | Description | Location |
| :-- | :--- | :--- | :--- |
| 1 | **Solution Architecture** | Detailed breakdown of all components and their roles within the overall system design. | [`docs/Solution_architecture.md`](./docs/Solution_architecture.md) |
| 2 | **System Flow Diagram** | Visual representation of the system workflow, illustrating stages and logic gates. | [`assets/system_flow.png`](./assets/system_flow.png) |

---
