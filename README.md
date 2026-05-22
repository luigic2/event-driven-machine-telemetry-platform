# Event-Driven Machine Telemetry Platform

A fullstack machine telemetry monitoring platform built with **React**, **Node.js**, **TypeScript**, and **AWS-oriented architecture**, designed to explore event-driven communication between decoupled services.

This project simulates a simplified industrial/fleet monitoring environment where machines send telemetry data, backend services process events asynchronously, maintenance alerts are generated automatically, and the frontend displays operational information in a dashboard.

The main goal of this project is to practice modern software engineering concepts such as **microservices**, **Backend-for-Frontend (BFF)**, **event-driven architecture**, **message brokers**, **AWS services**, **CI/CD**, **testing**, and **observability**.

---

## Project Status

This project is currently under development.

The initial focus is to build the core fullstack flow locally, then gradually evolve the system with AWS services, infrastructure as code, automated tests, and observability.

---

## Main Goals

This project was created to study and demonstrate:

-Fullstack application development with React and Node.js
-Type-safe backend and frontend development using TypeScript
-Backend-for-Frontend architecture
-Microservices communication patterns
-Synchronous communication using HTTP APIs
-Asynchronous communication using event-driven architecture
-Message broker concepts using AWS services such as SQS, SNS, and EventBridge
-Machine telemetry processing
-Maintenance alert generation
-Real-time dashboard updates
-CI/CD pipelines with GitHub Actions
-AWS cloud architecture fundamentals
-Infrastructure as Code with Terraform
-Observability with CloudWatch, OpenTelemetry, and New Relic concepts



---

## Architecture overview

The application is designed around a decoupled service architecture.

The frontend communicates with a BFF layer, which is responsible for adapting and aggregating data for the user interface. Backend services communicate synchronously when immediate responses are required and asynchronously through events when services need to react to business changes without direct coupling.


React Frontend
     |
     | HTTP Request
     v
Backend-for-Frontend (BFF)
     |
     | Synchronous HTTP calls
     v
Microservices
     |
     | Publish domain events
     v
Message Broker
     |
     | Deliver events
     v
Event Consumers


Created by Luigi Cavalieri as a study and portfolio project focused on fullstack development, AWS cloud architecture, and event-driven microservices.