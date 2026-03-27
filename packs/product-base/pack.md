---
schema: looply/pack@v1
name: product-base
summary: Base pack for discovery and delivery planning
pack_version: 0.1.0
domains:
  - product
includes:
  packs: []
  agents:
    - pm-analyst
  tasks:
    - analyze-requirement
    - create-prd
    - break-prd-into-stories
  workflows:
    - idea-to-prd
    - prd-to-stories
---

# Product Base Pack

Pack inicial do LOOPLY para discovery e planejamento de delivery.
