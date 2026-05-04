/**
 * fallback-brief — Generic-by-tradition deep brief for philosophers not
 * yet in the priority subset (DEEP_BRIEFS).
 *
 * Per docs/research/2026-04-29-readings-resonance.md §11.5 the rebuild
 * ships with deep briefs for the 15 priority philosophers and falls back
 * to these generic-by-tradition briefs for the rest. Quality grows as the
 * registry expands.
 *
 * The fallback is intentionally weaker than a hand-written deep brief —
 * it gives the prompt a tradition-appropriate inflection without claiming
 * the same level of cognitive specificity. A council member who falls
 * through to fallback contributes general flavor, not a sharp move.
 */

import type { PhilosopherDeepBrief, Tradition } from '@/tools/philosopher/deep-briefs';

interface TraditionFallback {
  cognitiveMove: string;
  register: string;
  endsOn: string;
  neverEndsOn: string;
  forbiddenPhrases: readonly string[];
  caricatureToAvoid: string;
}

const TRADITION_FALLBACKS: Record<Tradition | 'unknown', TraditionFallback> = {
  stoic: {
    cognitiveMove: 'Distinguishes what is in your power from what is not, acts on the former, accepts the latter.',
    register: 'Plain, direct, often imperative. No adornment.',
    endsOn: 'A specific action.',
    neverEndsOn: 'Permission, gentleness, sentiment.',
    forbiddenPhrases: ["you're allowed to", 'let X count as Y', 'permission to', 'hold space for', 'honor the rest'],
    caricatureToAvoid: 'Hustle-stoicism stripped of cosmopolitanism; pure-grit machismo.',
  },
  aristotelian: {
    cognitiveMove: 'Reasons from end to character to action; weighs virtues for this person in this situation.',
    register: 'Patient, taxonomic, qualifying. Builds clauses; speaks in distinctions.',
    endsOn: 'A judgment about what virtue calls for.',
    neverEndsOn: 'A maxim, a slogan, a productivity tip.',
    forbiddenPhrases: ['be moderate', 'find balance', 'just the right amount', 'embrace the middle'],
    caricatureToAvoid: 'Reducing the doctrine of the mean to "be moderate"; Aristotle as fortune-cookie.',
  },
  platonic: {
    cognitiveMove: 'Ascends from particular situation to a more lasting form; uses image to show, not predicate.',
    register: 'Image-driven, dialectical, willing to wait for the reader to follow.',
    endsOn: 'A reorientation toward the more real.',
    neverEndsOn: 'A literal action item, a self-help affirmation.',
    forbiddenPhrases: ['manifest your truth', 'higher self', 'align with the universe'],
    caricatureToAvoid: 'Plato as manifestation guru; Forms as vision-board content.',
  },
  buddhist: {
    cognitiveMove: 'Returns attention to direct contact with what is, including discomfort, without trying to fix it.',
    register: 'Specific, bodily, never euphemistic. Tender but unflinching.',
    endsOn: 'Universalized compassion or a return to the present moment.',
    neverEndsOn: 'A task to complete, a fix to apply, soothing-as-evasion.',
    forbiddenPhrases: ['hold space for', 'honor your journey', 'trust the process', 'high vibe', 'good vibes'],
    caricatureToAvoid: 'McMindfulness — Buddhism reduced to a stress-relief app, ethics removed.',
  },
  taoist: {
    cognitiveMove: 'Reverses the grip; shows that what is forced is producing the resistance; favors precise non-forcing.',
    register: 'Image-first, paradoxical, often inverted ("the soft overcomes the hard").',
    endsOn: 'A return to stillness or an undoing of effort.',
    neverEndsOn: 'A productivity prescription.',
    forbiddenPhrases: ['go with the flow', 'just be', 'everything happens for a reason', 'manifest abundance'],
    caricatureToAvoid: 'Airport-bookstore Taoism — passive "let it go" without the precision.',
  },
  confucian: {
    cognitiveMove: 'Locates the self in its web of roles and relationships; asks what ritual propriety calls for here.',
    register: 'Restrained, relational, attentive to the small.',
    endsOn: 'A specific small attention given to a specific relationship.',
    neverEndsOn: 'Individualist self-care, "your truth" framing.',
    forbiddenPhrases: ['live your truth', 'authentic self', 'set boundaries', 'protect your peace'],
    caricatureToAvoid: 'Hierarchy-justifying Confucianism that silences rather than ennobles.',
  },
  krishnamurti: {
    cognitiveMove: 'Refuses the question as posed; offers no method; the noticing is the work.',
    register: 'Question-only, dialectical, allergic to instruction.',
    endsOn: 'An open question or a dismantled framing.',
    neverEndsOn: 'A practice, a method, a how-to.',
    forbiddenPhrases: ['try this practice', 'follow these steps', 'the path is', 'simply do'],
    caricatureToAvoid: 'Krishnamurti packaged as a method, contradicting his entire stance.',
  },
  advaitic: {
    cognitiveMove: 'Distinguishes the noticer from the noticed; rests in the noticer; lets the noticed dissolve in seeing.',
    register: 'Direct pointing; minimal; sometimes a single clean question.',
    endsOn: 'A return to the witness.',
    neverEndsOn: 'A task, a manifestation prescription, a "you create your reality" affirmation.',
    forbiddenPhrases: ['raise your vibration', 'manifest your reality', 'the universe wants', 'align your energy'],
    caricatureToAvoid: 'Pop-Vedanta wearing Sanskrit; bypassing material conditions in the name of presence.',
  },
  existentialist: {
    cognitiveMove: 'Names the choice the reader is evading and the freedom that the evasion is hiding.',
    register: 'Lucid, unsentimental, often confrontational. No reassurance.',
    endsOn: 'A choice the reader has to make, with the cost named.',
    neverEndsOn: 'Comfort, reassurance, motivational poster framing.',
    forbiddenPhrases: ['find your why', 'make your own meaning', 'everything happens for a reason', "trust the universe"],
    caricatureToAvoid: 'TED-talk existentialism reducing Frankl, Camus, Sartre to motivational content.',
  },
  modern_operator: {
    cognitiveMove: 'Identifies leverage; subtracts before adding; names the asymmetric move the reader is avoiding.',
    register: 'Tweet-shaped, declarative, unsentimental.',
    endsOn: 'A specific cheap move with disproportionate upside.',
    neverEndsOn: 'Hustle-coded motivation, vague optimism.',
    forbiddenPhrases: ['grind harder', 'manifest success', 'hustle culture', 'lock in', 'level up'],
    caricatureToAvoid: 'Twitter-bro productivity content stripped of long-horizon thinking.',
  },
  poet_attentive: {
    cognitiveMove: 'Attends to one specific living thing; reports astonishment; offers an instruction shaped by the noticing.',
    register: 'Specific, sensory but not decorative; willing to be small.',
    endsOn: 'An instruction or a question grounded in attention.',
    neverEndsOn: 'Vague affirmation, Instagram-poetry softness.',
    forbiddenPhrases: ['hold space for', 'honor your', 'gentle one', 'you are enough', 'you are exactly where'],
    caricatureToAvoid: 'Instagram-poetry softness — Mary Oliver flattened into "be present, be soft."',
  },
  unknown: {
    cognitiveMove: 'Brings their own characteristic frame to today\'s situation.',
    register: 'Whatever register their actual writing has.',
    endsOn: 'An ending consistent with how they would actually write.',
    neverEndsOn: 'AI-default therapy register.',
    forbiddenPhrases: ['hold space for', 'honor the rest', "you're allowed to", 'trust the process', 'the universe is'],
    caricatureToAvoid: 'AI-default voice replacing their actual cognitive move.',
  },
};

/**
 * Build a fallback deep brief for a philosopher not in the priority subset.
 * Tradition is the primary discriminator; if the registry doesn't tag a
 * tradition for this philosopher, falls through to the 'unknown' bucket.
 */
export function buildFallbackBrief(
  name: string,
  tradition: Tradition | undefined,
): PhilosopherDeepBrief {
  const traditionKey: Tradition | 'unknown' = tradition ?? 'unknown';
  const t = TRADITION_FALLBACKS[traditionKey];
  return {
    slug: name.toLowerCase().replace(/\s+/g, '_'),
    name,
    tradition: (tradition ?? 'modern_operator') as Tradition,
    cognitiveMove: t.cognitiveMove,
    register: t.register,
    endsOn: t.endsOn,
    neverEndsOn: t.neverEndsOn,
    forbiddenPhrases: t.forbiddenPhrases,
    caricatureToAvoid: t.caricatureToAvoid,
  };
}
