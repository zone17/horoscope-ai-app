/**
 * Demo: light-council-injection vs deep-council-injection
 *
 * Same sign, same day, same council. Only variable: how much the prompt tells
 * the model about the council members' actual cognitive moves.
 *
 * Plus: same architecture run with a contrastive council (existentialist/critical
 * vs stoic/buddhist/operator) to test whether deep injection makes the council
 * felt as more than names.
 *
 * Run: npx tsx scripts/demo-light-vs-deep.ts
 */

import 'dotenv/config';
import { generateText } from 'ai';

const MODEL = 'anthropic/claude-sonnet-4.6';

const SHARED_HEADER = `Write a daily reading for someone whose sun sign is ARIES.

CONTEXT FOR TODAY (use to shape the reading; do NOT name these directly):
- Date: Wednesday, April 29, 2026 — late April, mid-week
- Lunar phase: waxing crescent, ~3 days past new moon (energy of seeds being planted, early commitment, fragile beginnings; momentum is brittle, not yet earned)
- Season: late spring in the northern hemisphere — warming but not yet summer
- Day-of-week: Wednesday, the hump — earned momentum if the week started well, recalibration if it hasn't

SIGN VOICE:
Aries thinks fast, decides fast, regrets sometimes, doesn't apologize for either. Fire-cardinal. Initiation energy — the sign of the strike, not the sustain. Wants to move; resents waiting. Vulnerable to: starting before they look, spending themselves on the wrong fight, mistaking pace for direction.

VOICE & CRAFT RULES:
- No "dear Aries", no "today, Aries..." — write to "you" directly.
- 50-90 words.
- Push back on the reader at least once. Affirmation alone reads as flattery; flattery doesn't resonate.
- Stage a scene the reader can recognize themselves inside. Do not predict.
- Include one concrete behavioral specifier — something the reader likely did in the past 24 hours. Not a sensory image of an object.
- Engineer at least one tonal pivot: confront → ground, name → invert, sting → bless. A flat tone flatlines.
- NO therapy-permission landings. Banned: "let X count as Y", "rest is reloading", "you're allowed", "it's okay to", "give yourself permission".
- No AI tells. Banned: delve, tapestry, embrace, navigate (as verb), journey, cultivate, harness, unlock.
- End with a sharp imperative or a real question. Not a benediction.
- Anonymous voice. No author signature, no philosopher attribution. The reader should not be told whose thinking shaped this.

OUTPUT: Just the reading. No preamble, no headings, no explanation.`;

const COUNCIL_A_LIGHT = `THE READER'S WORLDVIEW:
This person has chosen to think with: Marcus Aurelius, Pema Chödrön, Naval Ravikant, Thich Nhat Hanh, Seneca.
Let those choices implicitly shape the kind of advice that lands for them.`;

const COUNCIL_A_DEEP = `THE READER'S WORLDVIEW (use to shape — never reference directly):
This person has chosen to think with these 5. Their collective moves should inflect the reading:

— Marcus Aurelius: view from above; the brevity of life as proportion-restorer; the reminder that what disturbs is the judgment, not the event. Method: cool inventory. Never: sentimental, vague, decorative.
— Pema Chödrön: stay with the sharp edge. "Groundlessness as ground." Compassionate honesty without flinching. Method: turn toward what scares. Never: bypassing, soothing-as-evasion, fixing.
— Naval Ravikant: leverage thinking, specific knowledge, the rare skill of judgment, the difference between rich and wealthy. Method: clean asymmetric reasoning. Never: hustle, motivational filler, vague.
— Thich Nhat Hanh: the present moment is the only place anything lives. Interbeing — nothing happens alone. Method: gentle precision. Never: cold, hurried, abstract.
— Seneca: the imperative. Time is the only non-renewable. The friend who tells you the hard truth in the same breath as the kind one. Method: command + reason. Never: hedge.

What this council has in common: they push toward the present, the proportionate, the practiced. They reject hustle, drift, and decoration. The reader wants advice that holds up at 3am.`;

const COUNCIL_B_LIGHT = `THE READER'S WORLDVIEW:
This person has chosen to think with: Jean-Paul Sartre, Emil Cioran, Jiddu Krishnamurti, Friedrich Nietzsche, Simone de Beauvoir.
Let those choices implicitly shape the kind of advice that lands for them.`;

const COUNCIL_B_DEEP = `THE READER'S WORLDVIEW (use to shape — never reference directly):
This person has chosen to think with these 5. Their collective moves should inflect the reading:

— Jean-Paul Sartre: bad faith. The lie we tell ourselves to evade choosing. Freedom as the fact you can never not be choosing. Method: name the evasion. Never: comfort, reassure, soften.
— Emil Cioran: the lucid pessimism that frees rather than crushes. The aphorism as scalpel. Insomnia as the only honest condition. Method: corrosive precision. Never: uplift, console, generalize.
— Jiddu Krishnamurti: the question is the answer. Drop the seeker. Truth is a pathless land — refuse all systems, including this one. Method: dismantle the framing. Never: prescribe, instruct, sermonize.
— Friedrich Nietzsche: the test of every thought is whether you would will it eternally. Slave morality vs master morality. The will to power as the will to overcome yourself. Method: provocation as care. Never: pity, level, humble-brag.
— Simone de Beauvoir: ambiguity as the human condition; ethics as constructed in tension; the situation precedes the act. Method: refuse easy resolution. Never: tidy, depoliticize, individual-blame.

What this council has in common: they refuse comfort, refuse received wisdom, demand authenticity at the cost of ease. The reader wants the question that won't let them sleep, not the answer that helps them sleep.`;

async function run(label: string, councilPrompt: string) {
  const fullPrompt = `${SHARED_HEADER}\n\n${councilPrompt}`;
  const { text } = await generateText({
    model: MODEL,
    prompt: fullPrompt,
    maxOutputTokens: 400,
    temperature: 0.85,
  });
  console.log(`\n${'='.repeat(72)}\n${label}\n${'='.repeat(72)}\n${text.trim()}\n`);
  return text.trim();
}

async function main() {
  console.log('\nDEMO: Light vs Deep council injection');
  console.log('Same sign (Aries), same day (Wed Apr 29 2026, waxing crescent), same craft rules.');
  console.log('Only the council-injection mechanism differs.\n');

  await run('COUNCIL A — LIGHT (Marcus, Pema, Naval, Thich, Seneca — names only)', COUNCIL_A_LIGHT);
  await run('COUNCIL A — DEEP (same 5, with cognitive moves)', COUNCIL_A_DEEP);
  await run('COUNCIL B — LIGHT (Sartre, Cioran, Krishnamurti, Nietzsche, de Beauvoir — names only)', COUNCIL_B_LIGHT);
  await run('COUNCIL B — DEEP (same 5, with cognitive moves)', COUNCIL_B_DEEP);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
