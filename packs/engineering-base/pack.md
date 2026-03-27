---
schema: looply/pack@v1
name: engineering-base
summary: Base operational pack for engineering delivery and release
pack_version: 0.1.0
domains:
  - engineering
includes:
  packs: []
  agents:
    - delivery-orchestrator
    - architect
    - cloud-architect
    - platform-engineer
    - cloud-governance
    - finops
    - backend
    - frontend
    - devops
    - reviewer
    - sre
  tasks:
    - orchestrate-delivery
    - report-workflow-status
    - create-tech-spec
    - create-adr
    - create-cloud-architecture
    - create-cloud-adr
    - design-platform-foundation
    - assess-cloud-governance
    - review-workload-cost
    - implement-api
    - implement-frontend
    - review-code
    - prepare-service-release
    - assess-service-operability
  workflows:
    - story-to-production
    - workflow-status
---

# Engineering Base Pack

Pack inicial do LOOPLY para delivery tecnico, release e operabilidade.
