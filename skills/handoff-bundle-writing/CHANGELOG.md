# Changelog

All notable changes to this skill will be documented in this file.
This project adheres to [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.1] - 2026-03-29

### Fixed
- Aligned the machine-readable handoff bundle example and methodology with the
  canonical schema by using `id` instead of `handoff_id` for the stable handoff
  identifier.
- Clarified and added explicit eval coverage for the `needs-exploration`
  verdict so route-back behavior stays testable.

## [0.1.0] - 2026-03-29

### Added
- Initial `handoff-bundle-writing` skill focused on turning in-progress,
  interrupted, or transferred runs into structured handoff bundles for safe
  resume.
- A manual-first workflow with explicit boundaries against pre-execution
  briefing, memory writeback, generic summarization, and canonical state sync.
- Methodology and output-template references covering authority hierarchy,
  canonical field shape, quick vs standard handoff lanes, and resume-safe
  transfer context.
- Lightweight trigger and qualitative eval fixtures plus projection settings for
  cross-platform installs.
