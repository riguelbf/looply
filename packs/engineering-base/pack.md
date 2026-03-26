---
schema: looply/pack@v1
name: engineering-base
summary: Base operational pack for end-to-end software delivery
pack_version: 0.1.0
domains:
  - engineering
includes:
  agents:
    - delivery-orchestrator
    - pm-analyst
    - architect
    - backend
    - reviewer
  tasks:
    - orchestrate-delivery
    - report-workflow-status
    - analyze-requirement
    - create-prd
    - break-prd-into-stories
    - create-tech-spec
    - create-adr
    - implement-api
    - review-code
    - publish-service
  workflows:
    - idea-to-prd
    - prd-to-stories
    - story-to-production
    - workflow-status
---

# Engineering Base Pack

Pack inicial do LOOPLY para provar a jornada de software da ideia ate a publicacao.
