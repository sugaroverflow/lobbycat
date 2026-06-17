# Evaluative Constitution
## Evaluator: Aadi Kulkarni
## Version: v2 pilot / 2026-03-28

> ⚠️ Synthetic estimate. This constitution was inferred from public evidence by an AI agent. It does not claim to reconstruct Aadi Kulkarni's true beliefs. See evidence-assessed.md for sources and confidence levels.

---

## Part A: Project Criteria

### Criterion 1: Accessibility for excluded or underserved populations
- **Weight:** HIGH (max 20 pts)
- **Why Aadi:** The clearest durable value across his entire public record. Polici.org was explicitly built to serve "underserved populations." His career goal: "digitizing government to bring basic services to Americans accessibly and cost-effectively." Quote: "building fair and accessible digital tools for citizens to participate in the life of the community is vital." Predates his professional career; consistently foregrounded in self-description. (Cornell Chronicle, US-Ireland Alliance, Hotchkiss, bio — all CONFIRMED.)
- **High score:** Projects that demonstrably serve populations currently excluded from a civic service — people who cannot access legal advice, government benefits, health information, or political participation due to literacy, language, income, disability, or geography barriers. Extra weight if the exclusion mechanism is documented and the intervention is specific to it.
- **Low score:** Projects primarily used by already-engaged, digitally literate citizens who already have access to multiple alternatives. Projects that improve convenience for informed users without addressing access gaps.
- **Dossier fields:** communities_served, primary_users_or_beneficiaries, underdog_signal, systemic_issue_area, disparity_tracking, geography

---

### Criterion 2: Government digital infrastructure quality and interoperability
- **Weight:** HIGH (max 20 pts)
- **Why Aadi:** His career arc is a sustained engagement with the interface between government, law, and digital infrastructure. Harvard LIL: integrated state codes into public open platform. NSF research: ethics in technical systems. Coinbase: regulatory policy frameworks. Bio: "tech and law infrastructure need updating to facilitate public service delivery." (Bio — CONFIRMED; Harvard LIL — CONFIRMED; Cornell Chronicle — CONFIRMED.)
- **High score:** Projects that build or improve shared public digital infrastructure — open APIs for government data, interoperable standards for civic services, open identity or authentication systems for public services, open procurement or contracting infrastructure. Projects that connect existing systems rather than creating new silos. Projects where the value scales with adoption and re-use.
- **Low score:** Standalone tools with no integration with existing infrastructure. Projects that create proprietary solutions to problems that could be addressed by open standards. Projects that digitise a single narrow workflow without interoperability.
- **Dossier fields:** open_source, github_url, format, project_type, government_partnerships, jurisdictional_scope

---

### Criterion 3: Regulatory and policy clarity contribution
- **Weight:** HIGH (max 20 pts)
- **Why Aadi:** Current professional role: "the way governments globally build policy frameworks around emerging technology." Eurofi Budapest 2024 attendance. Honours thesis: ML analysis of federal regulatory comments. NSF research: ethics standards assessment. Career consistently moves between doing the work and understanding its policy framework. (Bio — CONFIRMED; Eurofi — CONFIRMED; Cornell Chronicle honours thesis — CONFIRMED.)
- **High score:** Projects that directly help governments, regulators, or citizens understand, shape, or navigate policy frameworks for digital or emerging technology. Regulatory transparency tools, policy analysis platforms, digital standards development, tools that make legal/regulatory text legible to non-experts, platforms that enable evidence-based policymaking.
- **Low score:** Projects with no engagement with regulatory or policy dimensions — purely operational tools that avoid the governance question entirely. Projects that treat regulation as an obstacle rather than a design constraint.
- **Dossier fields:** issue_area, political_relevance_summary, policy_outcomes, government_partnerships, systemic_issue_area

---

### Criterion 4: Data ethics and epistemic integrity
- **Weight:** MEDIUM (max 12 pts)
- **Why Aadi:** Two years of NSF-funded research on data ethics with Solon Barocas and Karen Levy. Bio names "AI ethics, policy, and law research" as core background. Polici addressed epistemic accessibility. Honours thesis: combining technical method with regulatory analysis. (Bio — CONFIRMED; Cornell Chronicle — CONFIRMED; US-Ireland Alliance — CONFIRMED.)
- **High score:** Projects that are explicit about their assumptions, limitations, and potential for harm. Projects that build in transparency about how data is collected, used, and governed. Projects with documented consideration of algorithmic fairness, bias, or differential impact. Projects that acknowledge failure modes.
- **Low score:** Projects that collect or use data about citizens without transparency about governance. Projects that make strong claims about impact without methodological basis. Projects that treat algorithmic outputs as neutral or objective.
- **Dossier fields:** documented_limitations, outcome_methodology, causation_strength, ai_involvement, political_bias_allegations, disparity_tracking

---

### Criterion 5: Implementation maturity and evidence of use
- **Weight:** MEDIUM (max 12 pts)
- **Why Aadi:** Professional background spans policy, law, and technology — not academic speculation. US Senate, House, presidential campaign, major financial technology company. Polici beta-tested with real institutions (Cornell, Duke, DHHS). Direct experience of what institutional adoption requires. (Cornell Chronicle — CONFIRMED; US-Ireland Alliance — CONFIRMED; bio — CONFIRMED.)
- **High score:** Projects with documented deployment — real users, real institutions using it, documented uptake. Government partnership or formal adoption. Active codebases with recent commits. Published performance metrics.
- **Low score:** Concept papers, early prototypes with no documented use, "in development" tools without evidence of real-world application. Speculative impact claims.
- **Dossier fields:** policy_outcomes, government_partnerships, last_commit_date, scraped.homepage_http_status, published_performance_metrics, decade_plus, founding_year
- **NOTE:** Prototype protection applies — see Part C.

---

### Criterion 6: Open standards and public knowledge orientation
- **Weight:** MEDIUM (max 12 pts)
- **Why Aadi:** Harvard LIL work: integrating public legal materials into open platform; learned about open-source community processes. Polici PBC: mission over profit structure. Bio frames interest as infrastructure. (Harvard LIL — CONFIRMED; US-Ireland Alliance — CONFIRMED; bio — CONFIRMED.)
- **High score:** Open-source projects with active community governance. Projects that produce open data standards, open APIs, or publicly reusable outputs. Projects whose value accrues to a public commons.
- **Low score:** Proprietary civic tech with vendor lock-in. Projects that centralise civic data in private hands. Projects using open-source framing superficially while building capture into business model.
- **Dossier fields:** open_source, github_url, github_stars, governance_model, community_ownership, contributor_governance, funding_model

---

### Criterion 7: Cross-jurisdictional applicability
- **Weight:** LOW (max 6 pts)
- **Why Aadi:** Mitchell Scholarship to Ireland, Coinbase international policy team, Eurofi Budapest. Bio: "the way governments globally build policy frameworks." Career explicitly international. But local excellence remains valuable — this is a bonus, not prerequisite. (Bio — CONFIRMED; Eurofi — CONFIRMED; Mitchell Scholarship — CONFIRMED.)
- **High score:** Projects designed for or adapted to multiple jurisdictional contexts. Reusable frameworks, data standards, or open-source tools with documented international deployment.
- **Low score:** Projects so specific to one context that replication would require near-complete rebuilding.
- **Dossier fields:** jurisdictional_scope, geography, countries_deployed, generalizability_notes, open_source

---

**Total maximum criteria score: 102 pts** (to be normalised proportionally to 100-pt scale)
**Actual max:** 20+20+20+12+12+12+6 = 102. For scoring: divide criteria sum by 1.02 to normalise to 100-pt ceiling, then apply modifiers.

---

## Part B: Value Modifiers

### Modifier 1: Boosts projects serving communities with no existing digital alternative
- **Direction:** boost
- **Magnitude:** strong (+10–15 pts)
- **Applies when:** The dossier or project description explicitly identifies a community that currently lacks a digital equivalent to the service offered — benefit calculators for claimants with no prior tool, legal information tools for unrepresented populations, government services for communities excluded by literacy or language barriers.
- **Why Aadi:** Polici mission was to fill an absence. Career statement: bringing services to those who cannot access them. (Cornell Chronicle, US-Ireland Alliance — CONFIRMED.)

### Modifier 2: Reduces projects that centralise civic data without governance accountability
- **Direction:** reduce
- **Magnitude:** strong (−10–15 pts)
- **Applies when:** A project collects, aggregates, or analyses data about citizens for civic purposes but has no documented governance model, no community oversight, no transparency about data use, or centralises sensitive information in a single private or unaccountable entity.
- **Why Aadi:** NSF research with Barocas and Levy centred on algorithmic accountability. Bio names "AI ethics" as foundational. (Cornell Chronicle, bio — CONFIRMED. Note: strong inference from research context.)

### Modifier 3: Boosts projects that make legal or regulatory text legible to non-specialists
- **Direction:** boost
- **Magnitude:** moderate (+5–10 pts)
- **Applies when:** A project specifically addresses the gap between formal legal/regulatory text and comprehension by ordinary citizens, government workers, or policymakers.
- **Why Aadi:** Harvard LIL (integrating public legal materials), Polici (translating dense text), honours thesis (parsing regulatory comments). Consistent thread. (Harvard LIL, Cornell Chronicle, US-Ireland Alliance — CONFIRMED.)

### Modifier 4: Reduces purely symbolic interventions with no civic infrastructure value
- **Direction:** reduce
- **Magnitude:** moderate (−5–10 pts)
- **Applies when:** A project's primary output is awareness-raising, a declaration, a visual representation, or an educational intervention with no operational civic technology component.
- **Why Aadi:** Theory of change is consistently infrastructural not communicative. Polici was a tool. Harvard LIL was infrastructure. Coinbase work is regulatory frameworks. (Bio — CONFIRMED; career arc — STRONG inference.)

### Modifier 5: Conditional — boosts open-source with active community governance; reduces closed proprietary tools claiming civic purpose
- **Direction:** conditional
- **Magnitude:** moderate (+5–10 pts boost / −5–8 pts reduce)
- **Applies when (boost):** Open-source with active contributor community, documented governance model, genuinely reusable codebase or data standards.
- **Applies when (reduce):** Claims civic purpose but built on closed platform, vendor-controlled architecture, or proprietary data model preventing community ownership.
- **Why Aadi:** Harvard LIL embedded him in open-source community processes. Polici PBC structure. Bio infrastructure framing. (Harvard LIL — CONFIRMED; Polici PBC — CONFIRMED; bio — CONFIRMED.)

### Modifier 6: Boosts projects designed to enable government to deliver services better
- **Direction:** boost
- **Magnitude:** moderate (+5–8 pts)
- **Applies when:** Primary user or beneficiary is a government agency, civil servant, or public institution — and the project is designed to make public service delivery more effective, efficient, or accessible.
- **Why Aadi:** Stated career goal across multiple sources: help government better use technology. US Senate, House, presidential campaign experience. Pro-state capacity framing, not anti-state disruption. (Cornell Chronicle, US-Ireland Alliance — CONFIRMED.)

---

## Part C: Procedural Rules

### Abstention threshold
A project receives N/A only when the dossier provides insufficient evidence to assess against any of the three HIGH-weight criteria (Criteria 1, 2, 3), AND the project's website and accessible external sources also fail to fill this gap. A completely empty dossier or dead link with no accessible website abstains. A thin dossier with at least one substantive field populated does not abstain — it receives a score with HIGH uncertainty and, if dossier_completeness < 0.35, underdog protection applies. In practice, abstention is rare; most projects have enough to make some assessment.

### Prototype handling
Prototypes are not penalised on Criterion 5 (implementation maturity) IF: the problem domain is within Aadi's core concern, AND the design demonstrates epistemic credibility and a plausible deployment path. However, the ceiling for Criterion 5 is lowered to max 10 points (not 20) for undeployed prototypes even with protection. This reflects his experience of the gap between concept and institutional adoption.

### Popularity discount
Popularity is not a quality signal in itself. When a project scores highly primarily because its dossier is rich and the project is widely known — rather than because it genuinely fits the constitution — flag popularity_risk as HIGH and note in the rationale that the score would likely be 8–12 points lower if dossier richness were normalised. Do not automatically reduce the score — make the risk visible.

### Tie-breaking
Equal scores after all criteria and modifiers: (1) which project serves a harder-to-reach or more marginalised community? (2) which has an active open-source community governance model? (3) which shows more recent active deployment (last_commit_date within 24 months, or government partnership in last 3 years)? (4) if still tied: higher dossier_completeness ranks higher.

### Uncertainty handling
Uncertainty lowers scores only below the underdog protection floor (28 pts, see Part D). Above the floor, uncertainty is documented but does not mechanically reduce the score. When evidence is thin but positive in direction, the score is held at the lower end of the supportable range, not penalised further.

### Novelty vs implementation
A compelling theory of change can substitute for at most 50% of the implementation maturity score (Criterion 5) — meaning up to 10 of 20 points can come from theoretical credibility alone, not deployment evidence. This applies only where: the theory is specific and epistemically credible, AND the problem domain makes deployment genuinely difficult.

### Movement infrastructure vs direct service
Neither is systematically privileged. Movement infrastructure benefiting from Modifier 5 (open standards/community governance). Direct service tools benefiting from Modifier 1 (no existing alternative). Different scoring paths, not ranked against each other.

### Scope of concern
Geographic scope does not determine base score. Local excellence can score as highly as global deployment. Cross-jurisdictional applicability (Criterion 7) adds bonus points. Population-need-driven: projects serving populations with no existing digital alternatives receive Modifier 1 boost regardless of geography.

---

## Part D: Underdog Protection

**Decision: YES**

**Rationale:** Aadi's core mission implies that obscure projects may serve exactly the populations he values most. The dossier richness gap (who is well-documented in civic tech databases) reflects structural patterns analogous to the academic knowledge gap Polici was built to address. His data ethics background (Barocas/Levy) would lead him to recognise underdocumentation as a measurement problem, not a quality signal. Protecting underdog projects is consistent with his accessibility orientation.

**Uncertainty floor:** dossier_completeness < 0.35 → score floor of 28. Projects at or below this threshold are not scored below 28.

**Suspended criteria when completeness < 0.35:**
- Criterion 5 (implementation maturity) — suspended. Do not penalise for lack of deployment evidence when the dossier is too thin to assess deployment.
- Criterion 4 (data ethics) — partially suspended. Do not penalise for lack of documented limitations when the project has not produced documentation.

---

## Part E: Dossier Field Proposals

| Field name | What it captures | Criterion/modifier it supports | Priority |
|---|---|---|---|
| regulatory_engagement | Whether the project has engaged with formal regulatory processes | Criterion 3 | CRITICAL |
| accessibility_features | Specific design features for accessibility — multilingual, low-literacy, offline, screen reader | Criterion 1, Modifier 1 | CRITICAL |
| data_governance_model | How the project governs data about citizens — control, consent, oversight | Modifier 2 | CRITICAL |
| legal_tech_integration | Integration with formal legal or regulatory text systems | Criterion 2 | useful |
| open_standards_adoption | Implementation of or contribution to documented open standards | Criterion 6, Modifier 5 | useful |
| excluded_population_evidence | Documented (not claimed) evidence of serving specific excluded populations | Criterion 1, Modifier 1 | useful |
| government_adoption_depth | Whether government use is superficial (pilot) or structural (embedded in law/procurement) | Criteria 2, 5 | nice-to-have |

---

## Synthesis Notes

### Contradictions reviewed

**Potential contradiction 1: Criterion 5 (implementation maturity — MEDIUM weight) vs Underdog Protection (YES)**
These could conflict if a project is both undocumented AND has no deployment evidence — underdog protection prevents penalisation while implementation maturity would score it low. Resolution in Part C and D: when completeness < 0.35, Criterion 5 is suspended. The protection applies only to the scoring mechanism, not to the raw quality assessment. This is resolved and consistent.

**Potential contradiction 2: Modifier 4 (reduces symbolic interventions) vs Criterion 3 (rewards regulatory clarity contribution)**
Awareness-raising and policy advocacy are different things. A campaign against government surveillance (symbolic/communicative) differs from a regulatory analysis tool (operational infrastructure). Resolution: Modifier 4 targets projects whose ONLY output is symbolic — declarations, campaigns, visual representations. Projects that produce regulatory analysis tools or data standards are not symbolic even if they have a communications component. The modifier applies to primary output type, not to the presence of any communications work. Resolved and consistent.

**Potential contradiction 3: Criterion 3 (regulatory/policy clarity — HIGH weight) and Criterion 2 (government digital infrastructure — HIGH weight) may reward similar projects**
These overlap significantly: a project building open government data APIs both improves digital infrastructure AND contributes to regulatory/policy clarity. Resolution: this is not a contradiction — it is a feature. Projects that do both score high on both criteria, which is intentional. The overlap reflects Aadi's integration of technical infrastructure and policy thinking. No resolution needed.

**Potential contradiction 4: Modifier 2 (reduces centralised data without governance) and Criterion 5 (rewards implementation maturity)**
A well-deployed project might also centralise data without governance. Resolution: the modifier reduces the score regardless of deployment maturity. The mature-but-unaccountable project scores well on Criterion 5 but is pulled down by Modifier 2. This is intentional — deployment without governance accountability is not a value Aadi endorses. Resolved and consistent.

### Gaps identified

**Gap 1: No criterion for political opposition research or monitoring tools.** Projects like LittleSis, SourceAfrica, or OpenSecrets-type tools — which monitor power and money flows — don't clearly map to any criterion. They are not government digital infrastructure, not regulatory clarity tools, not directly serving excluded populations. They score primarily on Criterion 4 (data ethics — does the monitoring respect epistemic standards?) and Criterion 3 (does it contribute to policy accountability?). The constitution can score these; it just won't score them particularly high unless the dossier shows strong accessibility or open-infrastructure dimensions.

**Gap 2: No explicit criterion for participatory democracy or deliberation tools.** Platforms like Decidim, Polis, or vTaiwan — which enable participatory policymaking — score on Criterion 1 (who participates? are excluded populations included?), Criterion 2 (is it open infrastructure?), and Criterion 3 (does it contribute to policy process?). But there is no dedicated criterion for the quality of deliberation or participation design. Given Aadi's public-service orientation, he likely values good participatory design — but the evidence base does not directly confirm this. These tools will score medium-high under this constitution but may be slightly undervalued.

**Gap 3: No criterion for disinformation or information integrity tools.** Tools like Full Fact, Bellingcat, or AlgorithmWatch — which address information quality — score primarily on Criterion 4 (epistemic integrity) and partially on Criterion 3 (regulatory clarity). They don't score well on Criteria 1, 2, 5, or 6 unless they specifically serve excluded populations or produce open infrastructure. This constitution is likely to undervalue information integrity work relative to its actual civic importance.

### Operational readiness

All criteria can be applied using dossier fields (mapped above). All modifiers have precise trigger conditions. All procedural rules produce deterministic outcomes given dossier data. The constitution is operationally ready for the ranking agent.

The scoring normalisation note: Criteria sum max = 102 pts. Divide raw criteria score by 1.02 before applying modifiers. Modifiers are then applied to the normalised criteria score. Final score clamped 0–100.
